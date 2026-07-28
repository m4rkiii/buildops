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

async function runRiskIntegrationTests() {
  console.log('\n==========================================');
  console.log('  Sprint D4 — Live ML Risk Integration Test ');
  console.log('==========================================\n');

  try {
    // Start Express server on ephemeral port
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
      full_name: 'ML Risk Officer',
      email: `ml_risk_${Date.now()}@buildops.co.ke`,
      password: 'SecurePassword123!',
      role: 'government_officer'
    });

    assert(regRes.status === 201, 'Registration should return 201');
    token = regRes.body.token;
    console.log('[PASS] Step 1: User registered & JWT issued.');

    // 2. Create Construction Project
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
      project_name: 'Nairobi Express Interchange',
      project_type: 'Infrastructure',
      county: 'Nairobi',
      nca_contractor_grade: 'NCA 1',
      budget_ksh: 850000000.0,
      planned_start_date: '2026-08-01',
      planned_end_date: '2027-12-31'
    });

    assert(projRes.status === 201, 'Create project should return 201');
    assert(projRes.body.project.risk_score !== undefined, 'Project response must include risk_score');
    assert(typeof projRes.body.project.risk_score.delay_risk_score === 'number', 'risk_score must have numeric delay_risk_score');
    projectId = projRes.body.project.project_id;
    console.log(`[PASS] Step 2: Project created with initial risk score: ${(projRes.body.project.risk_score.delay_risk_score * 100).toFixed(1)}% (${projRes.body.project.risk_score.risk_level}).`);

    // 3. Add Delayed Milestone (Triggers ML Risk Re-computation)
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
      milestone_name: 'Environmental Clearance Approval',
      planned_date: '2026-09-15',
      status: 'delayed'
    });

    assert(msRes.status === 201, 'Create milestone should return 201');
    assert(msRes.body.risk_score !== undefined, 'Milestone creation must return recalculated risk_score');
    console.log(`[PASS] Step 3: Delayed milestone created; recalculated risk score: ${(msRes.body.risk_score.delay_risk_score * 100).toFixed(1)}% (${msRes.body.risk_score.risk_level}).`);

    // 4. Verify risk_scores DB table persistence
    const dbRes = await db.query('SELECT * FROM risk_scores WHERE project_id = $1', [projectId]);
    assert(dbRes.rows.length > 0, 'Database risk_scores table must contain persisted record');
    assert(dbRes.rows[0].risk_level !== undefined, 'Persisted risk record must include risk_level');
    console.log('[PASS] Step 4: Verified risk score persisted in DB risk_scores table.');

    console.log('\n==========================================');
    console.log('  [PASS] All Sprint D4 Integration Tests Passed! ');
    console.log('==========================================\n');
  } catch (err) {
    console.error('[FAIL] Integration test failed:', err.message);
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

runRiskIntegrationTests();
