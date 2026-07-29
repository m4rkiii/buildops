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

async function runDigestReportTests() {
  console.log('\n==========================================');
  console.log('  Sprint G1/G2 — AI Digest Report E2E Test ');
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
      full_name: 'NCA Inspector Wanjiku',
      email: `nca_wanjiku_${Date.now()}@buildops.co.ke`,
      password: 'SecurePassword123!',
      role: 'nca_regulator'
    });

    assert(regRes.status === 201, 'Registration should return 201');
    token = regRes.body.token;
    console.log('[PASS] Step 1: User registered as NCA Regulator.');

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
      project_name: 'Eldoret Grain Silo Terminal',
      project_type: 'Industrial',
      county: 'Uasin Gishu',
      nca_contractor_grade: 'NCA 3',
      budget_ksh: 620000000.0,
      planned_start_date: '2026-08-01',
      planned_end_date: '2027-10-31'
    });

    assert(projRes.status === 201, 'Create project should return 201');
    projectId = projRes.body.project.project_id;
    console.log(`[PASS] Step 2: Project created (${projectId}).`);

    // 3. Fetch AI Executive Digest via GET /projects/:projectId/digest
    const digestRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/projects/${projectId}/digest`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    assert(digestRes.status === 200, 'GET /projects/:id/digest should return 200');
    assert(digestRes.body.digest !== undefined, 'Response must contain digest object');
    assert(typeof digestRes.body.digest.executive_summary === 'string', 'Digest must contain executive_summary');
    assert(Array.isArray(digestRes.body.digest.key_risk_drivers), 'Digest must contain key_risk_drivers list');
    assert(Array.isArray(digestRes.body.digest.recommended_mitigations), 'Digest must contain recommended_mitigations list');

    console.log('\n--- Generated AI Executive Digest Preview ---');
    console.log(`Executive Summary: ${digestRes.body.digest.executive_summary.slice(0, 120)}...`);
    console.log(`Schedule Analysis: ${digestRes.body.digest.schedule_variance_analysis.slice(0, 100)}...`);
    console.log(`Financial Forecast: ${digestRes.body.digest.financial_overrun_forecast.slice(0, 100)}...`);
    console.log('---------------------------------------------\n');

    console.log('[PASS] Step 3: Verified AI Digest API endpoint returned structured report.');

    console.log('\n==========================================');
    console.log('  [PASS] All Sprint G1/G2 Digest Tests Passed! ');
    console.log('==========================================\n');
  } catch (err) {
    console.error('[FAIL] Digest report test failed:', err.message);
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

runDigestReportTests();
