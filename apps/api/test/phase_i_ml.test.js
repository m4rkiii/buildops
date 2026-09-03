const http = require('http');
const db = require('../src/db');
const app = require('../src/index');

let server;
let port;
let contractorToken;
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runPhaseIMLTests() {
  console.log('\n======================================================');
  console.log('  Phase I — Secondary ML (Schedule Forecast & Anomaly) ');
  console.log('======================================================\n');

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
      full_name: 'ML Lead Contractor Otieno',
      email: `contractor_otieno_${Date.now()}@buildops.co.ke`,
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
      project_name: 'Mombasa Port Berth Extension Phase 3',
      project_type: 'Infrastructure',
      county: 'Mombasa',
      nca_contractor_grade: 'NCA 1',
      budget_ksh: 3500000000.0,
      planned_start_date: '2026-01-01',
      planned_end_date: '2027-12-31'
    });
    projectId = projRes.body.project.project_id;
    console.log('[PASS] Step 1: Created test project for Phase I ML verification.');

    // 2. Fetch Schedule Forecast (GET /projects/:id/schedule-forecast)
    const forecastRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/projects/${projectId}/schedule-forecast`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${contractorToken}` }
    });

    assert(forecastRes.status === 200, `GET schedule-forecast failed with status ${forecastRes.status}`);
    assert(forecastRes.body.forecast !== undefined, 'Response must contain forecast object');
    assert(typeof forecastRes.body.forecast.projected_completion_date === 'string', 'Forecast must include projected_completion_date');
    assert(typeof forecastRes.body.forecast.estimated_schedule_drift_days === 'number', 'Forecast must include estimated_schedule_drift_days');
    console.log(`[PASS] Step 2: Schedule forecast endpoint verified (Projected end: ${forecastRes.body.forecast.projected_completion_date}, Drift: ${forecastRes.body.forecast.estimated_schedule_drift_days} days).`);

    // 3. Fetch Anomaly Check (GET /projects/:id/anomaly-check)
    const anomalyRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/projects/${projectId}/anomaly-check`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${contractorToken}` }
    });

    assert(anomalyRes.status === 200, `GET anomaly-check failed with status ${anomalyRes.status}`);
    assert(anomalyRes.body.anomaly !== undefined, 'Response must contain anomaly object');
    assert(typeof anomalyRes.body.anomaly.is_anomaly === 'boolean', 'Anomaly response must include is_anomaly boolean');
    assert(Array.isArray(anomalyRes.body.anomaly.detected_outliers), 'Anomaly response must include detected_outliers array');
    console.log(`[PASS] Step 3: Anomaly check endpoint verified (Is Anomaly: ${anomalyRes.body.anomaly.is_anomaly}, Score: ${anomalyRes.body.anomaly.anomaly_score}).`);

    console.log('\n======================================================');
    console.log('  [PASS] All Phase I Secondary ML API Tests Passed!  ');
    console.log('======================================================\n');
  } catch (err) {
    console.error('[FAIL] Phase I ML test failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (db.pool) await db.pool.end();
  }
}

runPhaseIMLTests();
