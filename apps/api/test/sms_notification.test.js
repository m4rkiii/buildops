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

async function runSmsNotificationTests() {
  console.log('\n==========================================');
  console.log('  Sprint F1/F2 — SMS Notification E2E Test ');
  console.log('==========================================\n');

  try {
    server = app.listen(0);
    port = server.address().port;

    // 1. Register User with Phone Number
    const regRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      full_name: 'Site Director Otieno',
      email: `director_otieno_${Date.now()}@buildops.co.ke`,
      password: 'SecurePassword123!',
      role: 'contractor',
      phone_number: '+254722123456'
    });

    assert(regRes.status === 201, 'Registration should return 201');
    token = regRes.body.token;
    console.log('[PASS] Step 1: User registered with Kenyan phone number (+254722123456).');

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
      project_name: 'Kisumu Port Cold Storage Facility',
      project_type: 'Industrial',
      county: 'Kisumu',
      nca_contractor_grade: 'NCA 2',
      budget_ksh: 450000000.0,
      planned_start_date: '2026-08-01',
      planned_end_date: '2027-08-01'
    });

    assert(projRes.status === 201, 'Create project should return 201');
    projectId = projRes.body.project.project_id;
    console.log(`[PASS] Step 2: Project created (${projectId}).`);

    // 3. Add Delayed Milestones to breach risk thresholds and trigger SMS Alert
    await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/projects/${projectId}/milestones`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      milestone_name: 'Refrigeration Compressor Delivery',
      planned_date: '2026-10-01',
      status: 'delayed'
    });

    const ms2Res = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/projects/${projectId}/milestones`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, {
      milestone_name: 'HVAC Ductwork Installation',
      planned_date: '2026-11-01',
      status: 'delayed'
    });

    assert(ms2Res.status === 201, 'Milestone creation should return 201');
    console.log('[PASS] Step 3: Delayed milestones added (triggered risk re-computation).');

    // 4. Fetch User Notifications via GET /notifications
    const notifRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/notifications',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    assert(notifRes.status === 200, 'GET /notifications should return 200');
    assert(Array.isArray(notifRes.body.notifications), 'Response must contain notifications array');
    assert(notifRes.body.notifications.length > 0, 'Notifications list must contain dispatched SMS alert record');
    
    const notif = notifRes.body.notifications[0];
    assert(notif.channel === 'SMS', 'Notification channel must be SMS');
    assert(notif.message.includes('BuildOps Alert'), 'Message must contain alert header');
    console.log(`[PASS] Step 4: Retrieved notifications via GET /notifications: "${notif.message}" (${notif.channel}).`);

    // 5. Fetch Project-Specific Notifications via GET /notifications/project/:projectId
    const projNotifRes = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: `/notifications/project/${projectId}`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    assert(projNotifRes.status === 200, 'GET /notifications/project/:id should return 200');
    assert(projNotifRes.body.notifications.length > 0, 'Project notifications array must not be empty');
    console.log('[PASS] Step 5: Retrieved project-specific notifications successfully.');

    console.log('\n==========================================');
    console.log('  [PASS] All Sprint F1/F2 Tests Passed! ');
    console.log('==========================================\n');
  } catch (err) {
    console.error('[FAIL] SMS notification test failed:', err.message);
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

runSmsNotificationTests();
