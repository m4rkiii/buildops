const assert = require('assert');
const http = require('http');
const db = require('../src/db');
const app = require('../src/index');

function makeRequest(server, options, payload = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const body = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);

    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
}

async function runMilestoneTests() {
  db.setUseMemoryStore(true);
  db.resetMemoryStore();

  const server = app.listen(0);
  const port = server.address().port;

  const baseOptions = {
    hostname: 'localhost',
    port: port,
    headers: { 'Content-Type': 'application/json' }
  };

  try {
    console.log('[Sprint B3 Milestone Test] Starting Milestone CRUD integration tests...');

    // 1. Setup User A & User B and User A Project
    const userARes = await makeRequest(server, { ...baseOptions, path: '/auth/register', method: 'POST' }, {
      full_name: 'Alice Builder', email: 'alice.m@buildops.co.ke', password: 'Password123!', role: 'contractor'
    });
    const userBRes = await makeRequest(server, { ...baseOptions, path: '/auth/register', method: 'POST' }, {
      full_name: 'Bob Inspector', email: 'bob.m@buildops.co.ke', password: 'Password123!', role: 'government_officer'
    });

    const tokenA = userARes.body.token;
    const tokenB = userBRes.body.token;

    const projRes = await makeRequest(server, {
      ...baseOptions,
      path: '/projects',
      method: 'POST',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    }, {
      project_name: 'Mombasa Port Expansion',
      project_type: 'Infrastructure',
      county: 'Mombasa',
      budget_ksh: 1200000000.00,
      planned_start_date: '2026-09-01',
      planned_end_date: '2028-09-01'
    });

    const projectId = projRes.body.project.project_id;

    // 2. User A Creates Milestone
    const mPayload = {
      milestone_name: 'Site Excavation & Foundation Clearing',
      planned_date: '2026-10-15',
      status: 'pending'
    };

    const createRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones`,
      method: 'POST',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    }, mPayload);

    assert.strictEqual(createRes.statusCode, 201, 'Milestone creation should return 201 Created');
    assert(createRes.body.milestone.milestone_id, 'Milestone ID should exist');
    assert.strictEqual(createRes.body.milestone.milestone_name, mPayload.milestone_name);
    const milestoneId = createRes.body.milestone.milestone_id;
    console.log('  ✓ Test 1 Passed: User A successfully created milestone');

    // 3. Reject missing required fields
    const badMRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones`,
      method: 'POST',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    }, { milestone_name: 'Incomplete Milestone' });

    assert.strictEqual(badMRes.statusCode, 400, 'Missing planned_date should return 400 Bad Request');
    console.log('  ✓ Test 2 Passed: Reject milestone creation with missing fields');

    // 4. Reject invalid status
    const invalidStatusRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones`,
      method: 'POST',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    }, { milestone_name: 'Foundation Work', planned_date: '2026-11-01', status: 'invalid_status_type' });

    assert.strictEqual(invalidStatusRes.statusCode, 400, 'Invalid status should return 400 Bad Request');
    console.log('  ✓ Test 3 Passed: Reject milestone creation with invalid status');

    // 5. User A retrieves milestone list for project
    const listRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones`,
      method: 'GET',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    });

    assert.strictEqual(listRes.statusCode, 200, 'Get milestones list should return 200 OK');
    assert.strictEqual(listRes.body.milestones.length, 1, 'Should contain 1 milestone');
    console.log('  ✓ Test 4 Passed: User A retrieves project milestones list');

    // 6. User A retrieves single milestone
    const singleRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones/${milestoneId}`,
      method: 'GET',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    });

    assert.strictEqual(singleRes.statusCode, 200, 'Get single milestone should return 200 OK');
    assert.strictEqual(singleRes.body.milestone.milestone_id, milestoneId);
    console.log('  ✓ Test 5 Passed: User A retrieves single milestone by ID');

    // 7. User A updates milestone status to completed & actual_date
    const updateRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones/${milestoneId}`,
      method: 'PUT',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    }, { status: 'completed', actual_date: '2026-10-14' });

    assert.strictEqual(updateRes.statusCode, 200, 'Update milestone should return 200 OK');
    assert.strictEqual(updateRes.body.milestone.status, 'completed');
    assert.strictEqual(updateRes.body.milestone.actual_date, '2026-10-14');
    console.log('  ✓ Test 6 Passed: User A updates milestone status and completion date');

    // 8. Security Test: User B denied POST milestone on User A project (403)
    const bPostRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones`,
      method: 'POST',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenB}` }
    }, { milestone_name: 'Unauthorized Milestone', planned_date: '2026-12-01' });

    assert.strictEqual(bPostRes.statusCode, 403, 'User B POST milestone should return 403 Forbidden');
    console.log('  ✓ Test 7 Passed: Security Guard — User B denied POST milestone on User A project');

    // 9. Security Test: User B denied GET milestones on User A project (403)
    const bGetRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones`,
      method: 'GET',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenB}` }
    });

    assert.strictEqual(bGetRes.statusCode, 403, 'User B GET milestones should return 403 Forbidden');
    console.log('  ✓ Test 8 Passed: Security Guard — User B denied GET milestones on User A project');

    // 10. Security Test: User B denied PUT milestone on User A project (403)
    const bPutRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones/${milestoneId}`,
      method: 'PUT',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenB}` }
    }, { status: 'delayed' });

    assert.strictEqual(bPutRes.statusCode, 403, 'User B PUT milestone should return 403 Forbidden');
    console.log('  ✓ Test 9 Passed: Security Guard — User B denied PUT milestone on User A project');

    // 11. Security Test: User B denied DELETE milestone on User A project (403)
    const bDelRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones/${milestoneId}`,
      method: 'DELETE',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenB}` }
    });

    assert.strictEqual(bDelRes.statusCode, 403, 'User B DELETE milestone should return 403 Forbidden');
    console.log('  ✓ Test 10 Passed: Security Guard — User B denied DELETE milestone on User A project');

    // 12. User A deletes milestone
    const delRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones/${milestoneId}`,
      method: 'DELETE',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    });

    assert.strictEqual(delRes.statusCode, 200, 'User A deleting own milestone should return 200 OK');
    console.log('  ✓ Test 11 Passed: User A successfully deletes own milestone');

    console.log('[PASS] [Sprint B3 Milestone Test] All 11 Milestone CRUD integration tests passed successfully!');
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('[FAIL] Sprint B3 Milestone Test Failed:', err);
    server.close(() => process.exit(1));
  }
}

if (require.main === module) {
  runMilestoneTests();
}

module.exports = { runMilestoneTests };
