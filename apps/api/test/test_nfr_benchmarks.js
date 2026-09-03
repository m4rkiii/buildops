const http = require('http');
const db = require('../src/db');
const app = require('../src/index');

let server;
let port;
let token;
let projectId;

function makeRequest(options, postData) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const latencyMs = Date.now() - startTime;
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), latencyMs });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, latencyMs });
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

async function runNFRBenchmarks() {
  console.log('\n======================================================');
  console.log('   Sprint J1 — Non-Functional Requirements Benchmarks  ');
  console.log('======================================================\n');

  try {
    server = app.listen(0);
    port = server.address().port;

    // 1. Setup Contractor & Project
    const authRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      full_name: 'NFR Benchmark Tester',
      email: `nfr_tester_${Date.now()}@buildops.co.ke`,
      password: 'SecurePassword123!',
      role: 'contractor'
    });
    token = authRes.body.token;

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
      project_name: 'NFR Latency Benchmark Test Project',
      project_type: 'Commercial',
      county: 'Nairobi',
      nca_contractor_grade: 'NCA 1',
      budget_ksh: 500000000.0,
      planned_start_date: '2026-01-01',
      planned_end_date: '2027-12-31'
    });
    projectId = projRes.body.project.project_id;

    // 2. NFR01 Benchmark: Dashboard Project Load Latency (< 3,000ms)
    const dashboardRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/projects/${projectId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    assert(dashboardRes.status === 200, 'GET /projects/:id should return 200 OK');
    assert(dashboardRes.latencyMs < 3000, `NFR01 Violation: Dashboard load ${dashboardRes.latencyMs}ms exceeds 3000ms target!`);
    console.log(`[PASS] NFR01 Benchmark: Project Risk Score & Dashboard load completed in ${dashboardRes.latencyMs}ms (< 3,000ms target).`);

    // 3. NFR02 Benchmarks: ML Inference Latencies (< 2,000ms)
    // 3a. Schedule Forecast Endpoint
    const forecastRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/projects/${projectId}/schedule-forecast`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(forecastRes.status === 200, 'GET /schedule-forecast should return 200 OK');
    assert(forecastRes.latencyMs < 2000, `NFR02 Violation: Schedule forecast latency ${forecastRes.latencyMs}ms exceeds 2000ms target!`);
    console.log(`[PASS] NFR02 Benchmark: Schedule forecast ML inference completed in ${forecastRes.latencyMs}ms (< 2,000ms target).`);

    // 3b. Anomaly Check Endpoint
    const anomalyRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/projects/${projectId}/anomaly-check`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(anomalyRes.status === 200, 'GET /anomaly-check should return 200 OK');
    assert(anomalyRes.latencyMs < 2000, `NFR02 Violation: Anomaly check latency ${anomalyRes.latencyMs}ms exceeds 2000ms target!`);
    console.log(`[PASS] NFR02 Benchmark: Isolation Forest anomaly check completed in ${anomalyRes.latencyMs}ms (< 2,000ms target).`);

    // 3c. Executive Digest Generator Endpoint
    const digestRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/projects/${projectId}/digest`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(digestRes.status === 200, 'GET /digest should return 200 OK');
    assert(digestRes.latencyMs < 2000, `NFR02 Violation: AI Digest latency ${digestRes.latencyMs}ms exceeds 2000ms target!`);
    console.log(`[PASS] NFR02 Benchmark: AI Executive Digest generation completed in ${digestRes.latencyMs}ms (< 2,000ms target).`);

    console.log('\n======================================================');
    console.log('   [PASS] All NFR01 & NFR02 Latency Benchmarks Passed! ');
    console.log('======================================================\n');
  } catch (err) {
    console.error('[FAIL] NFR Benchmark failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    if (db.pool) await db.pool.end();
  }
}

runNFRBenchmarks();
