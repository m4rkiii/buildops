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

async function runE2EBackendTests() {
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
    console.log('[Sprint B4 E2E Test] Starting End-to-End Backend Integration Pass...');

    // 1. Register Primary Contractor
    const regRes = await makeRequest(server, {
      ...baseOptions,
      path: '/auth/register',
      method: 'POST'
    }, {
      full_name: 'Wanjiku Njuguna',
      email: 'wanjiku@buildops.co.ke',
      password: 'StrongPassword2026!',
      role: 'contractor',
      phone_number: '+254700000111'
    });

    assert.strictEqual(regRes.statusCode, 201, 'Registration should return 201 Created');
    assert(regRes.body.token, 'Token should be returned');
    console.log('  ✓ Step 1: Registered contractor account & issued JWT');

    // 2. Login User & Retrieve Token
    const loginRes = await makeRequest(server, {
      ...baseOptions,
      path: '/auth/login',
      method: 'POST'
    }, { email: 'wanjiku@buildops.co.ke', password: 'StrongPassword2026!' });

    assert.strictEqual(loginRes.statusCode, 200, 'Login should return 200 OK');
    const token = loginRes.body.token;
    console.log('  ✓ Step 2: Authenticated login & retrieved JWT token');

    // 3. Verify Profile
    const profileRes = await makeRequest(server, {
      ...baseOptions,
      path: '/auth/me',
      method: 'GET',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(profileRes.statusCode, 200);
    assert.strictEqual(profileRes.body.user.role, 'contractor');
    console.log('  ✓ Step 3: Verified user profile & role via /auth/me');

    // 4. Create Construction Project
    const projRes = await makeRequest(server, {
      ...baseOptions,
      path: '/projects',
      method: 'POST',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${token}` }
    }, {
      project_name: 'Kambu Infrastructure Phase 2',
      project_type: 'Civil Works',
      county: 'Machakos',
      nca_contractor_grade: 'NCA 2',
      budget_ksh: 550000000.00,
      planned_start_date: '2026-09-15',
      planned_end_date: '2028-03-30'
    });

    assert.strictEqual(projRes.statusCode, 201, 'Project creation should return 201');
    const projectId = projRes.body.project.project_id;
    console.log('  ✓ Step 4: Created project "Kambu Infrastructure Phase 2"');

    // 5. Add Milestones to Project
    const m1Res = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones`,
      method: 'POST',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${token}` }
    }, {
      milestone_name: 'Phase 1 Land Clearance & Excavation',
      planned_date: '2026-10-30',
      status: 'in_progress'
    });

    const m2Res = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones`,
      method: 'POST',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${token}` }
    }, {
      milestone_name: 'Drainage & Sewerage Systems Installation',
      planned_date: '2027-02-28',
      status: 'pending'
    });

    assert.strictEqual(m1Res.statusCode, 201);
    assert.strictEqual(m2Res.statusCode, 201);
    const m1Id = m1Res.body.milestone.milestone_id;
    console.log('  ✓ Step 5: Created 2 project milestones');

    // 6. Update Milestone Status to Completed
    const updateM1Res = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones/${m1Id}`,
      method: 'PUT',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${token}` }
    }, {
      status: 'completed',
      actual_date: '2026-10-28'
    });

    assert.strictEqual(updateM1Res.statusCode, 200);
    assert.strictEqual(updateM1Res.body.milestone.status, 'completed');
    assert.strictEqual(updateM1Res.body.milestone.actual_date, '2026-10-28');
    console.log('  ✓ Step 6: Updated Milestone 1 to "completed" with actual completion date');

    // 7. Update Project Budget
    const updateProjRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}`,
      method: 'PUT',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${token}` }
    }, {
      budget_ksh: 600000000.00
    });

    assert.strictEqual(updateProjRes.statusCode, 200);
    assert.strictEqual(updateProjRes.body.project.budget_ksh, 600000000.00);
    console.log('  ✓ Step 7: Updated project budget to KSh 600,000,000.00');

    // 8. Fetch All Project Milestones
    const listMRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}/milestones`,
      method: 'GET',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${token}` }
    });

    assert.strictEqual(listMRes.statusCode, 200);
    assert.strictEqual(listMRes.body.milestones.length, 2);
    console.log('  ✓ Step 8: Verified all milestones retrieved cleanly');

    // 9. Security Isolation Check: Second User Authorization Denial
    const regUserBRes = await makeRequest(server, {
      ...baseOptions,
      path: '/auth/register',
      method: 'POST'
    }, {
      full_name: 'Other Contractor',
      email: 'other@buildops.co.ke',
      password: 'Password123!',
      role: 'contractor'
    });

    const tokenB = regUserBRes.body.token;

    const unauthorizedRes = await makeRequest(server, {
      ...baseOptions,
      path: `/projects/${projectId}`,
      method: 'GET',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${tokenB}` }
    });

    assert.strictEqual(unauthorizedRes.statusCode, 403, 'Unauthorized user should be denied access');
    console.log('  ✓ Step 9: Confirmed tenant isolation — second user denied access to project');

    console.log('[PASS] [Sprint B4 E2E Test] Complete Auth -> Project -> Milestone workflow passed cleanly!');
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('[FAIL] Sprint B4 E2E Test Failed:', err);
    server.close(() => process.exit(1));
  }
}

if (require.main === module) {
  runE2EBackendTests();
}

module.exports = { runE2EBackendTests };
