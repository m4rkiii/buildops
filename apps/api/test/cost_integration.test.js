const http = require('http');
const db = require('../src/db');
const app = require('../src/index');

let server;
let port;
let token;
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

async function runCostIntegrationTests() {
  console.log('\n==========================================');
  console.log('  Sprint E2 — Live ML Cost Overrun Test   ');
  console.log('==========================================\n');

  try {
    server = app.listen(0);
    port = server.address().port;

    // 1. Register User
    const regRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      full_name: 'Cost Analyst',
      email: `cost_analyst_${Date.now()}@buildops.co.ke`,
      password: 'SecurePassword123!',
      role: 'contractor'
    });

    assert(regRes.status === 201, 'Registration should return 201');
    token = regRes.body.token;
    console.log('[PASS] Step 1: User registered & JWT issued.');

    // 2. Create Project
    const projRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/projects',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      project_name: 'Mombasa Port Expansion Berth 22',
      project_type: 'Civil Works',
      county: 'Mombasa',
      nca_contractor_grade: 'NCA 1',
      budget_ksh: 1200000000.0,
      planned_start_date: '2026-08-01',
      planned_end_date: '2028-12-31'
    });

    assert(projRes.status === 201, 'Create project should return 201');
    assert(projRes.body.project.risk_score !== undefined, 'Project must include risk_score object');
    assert(typeof projRes.body.project.risk_score.cost_overrun_pct === 'number', 'risk_score must have numeric cost_overrun_pct');
    projectId = projRes.body.project.project_id;
    console.log(`[PASS] Step 2: Project created with initial cost overrun forecast: +${projRes.body.project.risk_score.cost_overrun_pct}% (Est. KSh ${projRes.body.project.risk_score.estimated_overrun_ksh.toLocaleString()}).`);

    // 3. Add Delayed Milestone (Triggers ML Cost & Delay Re-computation)
    const msRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/projects/${projectId}/milestones`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      milestone_name: 'Dredging & Seabed Excavation',
      planned_date: '2026-10-15',
      status: 'delayed'
    });

    assert(msRes.status === 201, 'Create milestone should return 201');
    assert(msRes.body.risk_score !== undefined, 'Milestone creation must return recalculated risk_score');
    assert(typeof msRes.body.risk_score.cost_overrun_pct === 'number', 'Recalculated risk_score must contain cost_overrun_pct');
    console.log(`[PASS] Step 3: Delayed milestone added; recalculated cost overrun forecast: +${msRes.body.risk_score.cost_overrun_pct}% (Est. KSh ${msRes.body.risk_score.estimated_overrun_ksh.toLocaleString()}).`);

    // 4. Verify risk_scores DB table persistence
    const dbRes = await db.query('SELECT * FROM risk_scores WHERE project_id = $1', [projectId]);
    assert(dbRes.rows.length > 0, 'Database risk_scores table must contain persisted record');
    assert(dbRes.rows[0].cost_overrun_pct !== undefined, 'Persisted risk record must include cost_overrun_pct');
    console.log('[PASS] Step 4: Verified cost overrun score persisted in DB risk_scores table.');

    console.log('\n==========================================');
    console.log('  [PASS] All Sprint E2 Integration Tests Passed! ');
    console.log('==========================================\n');
  } catch (err) {
    console.error('[FAIL] Cost integration test failed:', err.message);
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

runCostIntegrationTests();
