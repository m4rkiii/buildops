const http = require('http');
const db = require('../src/db');
const app = require('../src/index');

let server;
let port;
let contractorToken;
let ncaToken;
let projectId;

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function runNcaRoleTests() {
  console.log('\n==========================================');
  console.log('  Sprint H1 — NCA Regulator Read-Only Test ');
  console.log('==========================================\n');

  try {
    server = app.listen(0);
    port = server.address().port;

    // 1. Register Contractor User & Create Project
    const contractorRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      full_name: 'Lead Contractor Kamau',
      email: `contractor_kamau_${Date.now()}@buildops.co.ke`,
      password: 'SecurePassword123!',
      role: 'contractor'
    });
    contractorToken = contractorRes.body.token;

    const projRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/projects',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${contractorToken}`
      }
    }, {
      project_name: 'Nairobi Airport Terminal 3 Expansion',
      project_type: 'Infrastructure',
      county: 'Nairobi',
      nca_contractor_grade: 'NCA 1',
      budget_ksh: 1800000000.0,
      planned_start_date: '2026-08-01',
      planned_end_date: '2028-12-31'
    });
    projectId = projRes.body.project.project_id;
    console.log('[PASS] Step 1: Contractor created project successfully.');

    // 2. Register NCA Regulator User
    const ncaRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      full_name: 'NCA Compliance Officer Njeri',
      email: `nca_njeri_${Date.now()}@nca.go.ke`,
      password: 'SecurePassword123!',
      role: 'nca_regulator'
    });

    assert(ncaRes.status === 201, 'NCA Regulator registration should return 201');
    ncaToken = ncaRes.body.token;
    console.log('[PASS] Step 2: Registered NCA Regulator user.');

    // 3. NCA Regulator Lists All Projects Across Platform (GET /projects)
    const listRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/projects',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ncaToken}` }
    });

    assert(listRes.status === 200, 'NCA Regulator GET /projects should return 200');
    const foundProj = listRes.body.projects.find(p => p.project_id === projectId);
    assert(foundProj !== undefined, 'NCA Regulator must be able to inspect projects owned by other contractors');
    console.log('[PASS] Step 3: Verified NCA Regulator can inspect all projects platform-wide.');

    // 4. Verify NCA Regulator Cannot Create Project (POST /projects -> 403 Forbidden)
    const createFail = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/projects',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ncaToken}`
      }
    }, {
      project_name: 'Illegal Project Creation',
      project_type: 'Residential',
      county: 'Nakuru',
      budget_ksh: 10000000.0,
      planned_start_date: '2026-08-01',
      planned_end_date: '2027-08-01'
    });

    assert(createFail.status === 403, 'NCA Regulator POST /projects should return 403 Forbidden');
    console.log('[PASS] Step 4: Confirmed project creation blocked for NCA Regulator (403 Forbidden).');

    // 5. Verify NCA Regulator Cannot Update Project (PUT /projects/:id -> 403 Forbidden)
    const updateFail = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/projects/${projectId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ncaToken}`
      }
    }, {
      project_name: 'Tampered Name'
    });

    assert(updateFail.status === 403, 'NCA Regulator PUT /projects/:id should return 403 Forbidden');
    console.log('[PASS] Step 5: Confirmed project update blocked for NCA Regulator (403 Forbidden).');

    // 6. Verify NCA Regulator Cannot Delete Project (DELETE /projects/:id -> 403 Forbidden)
    const delFail = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/projects/${projectId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${ncaToken}` }
    });

    assert(delFail.status === 403, 'NCA Regulator DELETE /projects/:id should return 403 Forbidden');
    console.log('[PASS] Step 6: Confirmed project deletion blocked for NCA Regulator (403 Forbidden).');

    console.log('\n==========================================');
    console.log('  [PASS] All Sprint H1 NCA Role Tests Passed! ');
    console.log('==========================================\n');
  } catch (err) {
    console.error('[FAIL] NCA role test failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (db.pool) await db.pool.end();
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

runNcaRoleTests();
