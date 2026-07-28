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

async function runProjectTests() {
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
    console.log('[Sprint B2 Project Test] Starting Project CRUD integration tests...');

    // 1. Register User A & User B
    const userAPayload = { full_name: 'Alice Builder', email: 'alice@buildops.co.ke', password: 'Password123!', role: 'contractor' };
    const userBPayload = { full_name: 'Bob Inspector', email: 'bob@buildops.co.ke', password: 'Password123!', role: 'government_officer' };

    const userARes = await makeRequest(server, { ...baseOptions, path: '/auth/register', method: 'POST' }, userAPayload);
    const userBRes = await makeRequest(server, { ...baseOptions, path: '/auth/register', method: 'POST' }, userBPayload);

    const tokenA = userARes.body.token;
    const tokenB = userBRes.body.token;

    // 2. User A Creates Project
    const projPayload = {
      project_name: 'Nairobi Affordable Housing Phase 1',
      project_type: 'Residential',
      county: 'Nairobi',
      nca_contractor_grade: 'NCA 1',
      budget_ksh: 450000000.00,
      planned_start_date: '2026-08-01',
      planned_end_date: '2027-12-31'
    };

    const createRes = await makeRequest(server, {
      ...baseOptions,
      path: '/projects',
      method: 'POST',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    }, projPayload);

    assert.strictEqual(createRes.statusCode, 201, 'Project creation should return 201 Created');
    assert(createRes.body.project.project_id, 'Project ID should be returned');
    assert.strictEqual(createRes.body.project.project_name, projPayload.project_name);
    assert.strictEqual(createRes.body.project.owner_user_id, userARes.body.user.user_id);
    const projectId = createRes.body.project.project_id;
    console.log('  ✓ Test 1 Passed: User A successfully created project');

    // 3. Reject missing field on creation
    const badProjRes = await makeRequest(server, {
      ...baseOptions,
      path: '/projects',
      method: 'POST',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    }, { project_name: 'Incomplete Project' });

    assert.strictEqual(badProjRes.statusCode, 400, 'Missing fields should return 400 Bad Request');
    console.log('  ✓ Test 2 Passed: Reject project creation with missing fields');

    // 4. User A gets project list
    const listRes = await makeRequest(server, {
      ...baseOptions,
      path: '/projects',
      method: 'GET',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    });

    assert.strictEqual(listRes.statusCode, 200, 'Project list should return 200 OK');
    assert.strictEqual(listRes.body.projects.length, 1, 'User A should have 1 project');
    console.log('  ✓ Test 3 Passed: User A retrieves list of owned projects');

    // 5. User A gets single project by ID
    const singleRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}`,
      method: 'GET',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    });

    assert.strictEqual(singleRes.statusCode, 200, 'Get single project should return 200 OK');
    assert.strictEqual(singleRes.body.project.project_id, projectId);
    console.log('  ✓ Test 4 Passed: User A retrieves single project by ID');

    // 6. User A updates project
    const updateRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}`,
      method: 'PUT',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    }, { project_name: 'Nairobi Affordable Housing Phase 1 (Updated)', budget_ksh: 500000000.00 });

    assert.strictEqual(updateRes.statusCode, 200, 'Project update should return 200 OK');
    assert.strictEqual(updateRes.body.project.project_name, 'Nairobi Affordable Housing Phase 1 (Updated)');
    assert.strictEqual(updateRes.body.project.budget_ksh, 500000000.00);
    console.log('  ✓ Test 5 Passed: User A updates project details');

    // 7. Security Test: User B attempts GET on User A's project (403 Forbidden)
    const bGetRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}`,
      method: 'GET',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenB}` }
    });

    assert.strictEqual(bGetRes.statusCode, 403, 'User B accessing User A project should return 403 Forbidden');
    console.log('  ✓ Test 6 Passed: Security Guard — User B denied GET access to User A project');

    // 8. Security Test: User B attempts PUT on User A's project (403 Forbidden)
    const bPutRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}`,
      method: 'PUT',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenB}` }
    }, { project_name: 'Hacked Project Name' });

    assert.strictEqual(bPutRes.statusCode, 403, 'User B updating User A project should return 403 Forbidden');
    console.log('  ✓ Test 7 Passed: Security Guard — User B denied PUT access to User A project');

    // 9. Security Test: User B attempts DELETE on User A's project (403 Forbidden)
    const bDelRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}`,
      method: 'DELETE',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenB}` }
    });

    assert.strictEqual(bDelRes.statusCode, 403, 'User B deleting User A project should return 403 Forbidden');
    console.log('  ✓ Test 8 Passed: Security Guard — User B denied DELETE access to User A project');

    // 10. User A deletes project
    const delRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}`,
      method: 'DELETE',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenA}` }
    });

    assert.strictEqual(delRes.statusCode, 200, 'User A deleting own project should return 200 OK');
    console.log('  ✓ Test 9 Passed: User A successfully deletes own project');

    console.log('[PASS] [Sprint B2 Project Test] All 9 Project CRUD integration tests passed successfully!');
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('[FAIL] Sprint B2 Project Test Failed:', err);
    server.close(() => process.exit(1));
  }
}

if (require.main === module) {
  runProjectTests();
}

module.exports = { runProjectTests };
