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

async function runAuthTests() {
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
    console.log('[Sprint B1 Auth Test] Starting authentication integration tests...');

    // Test 1: Successful Registration
    const regPayload = {
      full_name: 'Maina Kamau',
      email: 'maina.kamau@buildops.co.ke',
      password: 'SecurePassword123!',
      role: 'contractor',
      phone_number: '+254712345678'
    };

    const regRes = await makeRequest(server, {
      ...baseOptions,
      path: '/auth/register',
      method: 'POST'
    }, regPayload);

    assert.strictEqual(regRes.statusCode, 201, 'Registration should return 201 Created');
    assert.strictEqual(regRes.body.user.email, regPayload.email.toLowerCase(), 'Email should match');
    assert.strictEqual(regRes.body.user.role, 'contractor', 'Role should be contractor');
    assert(regRes.body.token, 'JWT token should be issued on registration');
    console.log('  ✓ Test 1 Passed: User registration success & JWT issuance');

    // Test 2: Reject Duplicate Email
    const dupRes = await makeRequest(server, {
      ...baseOptions,
      path: '/auth/register',
      method: 'POST'
    }, regPayload);

    assert.strictEqual(dupRes.statusCode, 400, 'Duplicate registration should return 400 Bad Request');
    assert(dupRes.body.error.includes('already registered'), 'Error message should indicate duplicate email');
    console.log('  ✓ Test 2 Passed: Duplicate email registration rejection');

    // Test 3: Successful Login
    const loginPayload = {
      email: 'maina.kamau@buildops.co.ke',
      password: 'SecurePassword123!'
    };

    const loginRes = await makeRequest(server, {
      ...baseOptions,
      path: '/auth/login',
      method: 'POST'
    }, loginPayload);

    assert.strictEqual(loginRes.statusCode, 200, 'Valid login should return 200 OK');
    assert(loginRes.body.token, 'JWT token should be returned on login');
    const validToken = loginRes.body.token;
    console.log('  ✓ Test 3 Passed: User login success & JWT retrieval');

    // Test 4: Reject Bad Password
    const badLoginRes = await makeRequest(server, {
      ...baseOptions,
      path: '/auth/login',
      method: 'POST'
    }, { email: 'maina.kamau@buildops.co.ke', password: 'WrongPassword' });

    assert.strictEqual(badLoginRes.statusCode, 401, 'Bad password login should return 401 Unauthorized');
    console.log('  ✓ Test 4 Passed: Bad password login rejection');

    // Test 5: Protected Route Rejects Missing JWT
    const noJwtRes = await makeRequest(server, {
      ...baseOptions,
      path: '/auth/me',
      method: 'GET'
    });

    assert.strictEqual(noJwtRes.statusCode, 401, 'Protected route without JWT should return 401');
    console.log('  ✓ Test 5 Passed: Protected route rejects missing JWT');

    // Test 6: Protected Route Rejects Invalid JWT
    const badJwtRes = await makeRequest(server, {
      ...baseOptions,
      path: '/auth/me',
      method: 'GET',
      headers: { ...baseOptions.headers, Authorization: 'Bearer invalid.token.payload' }
    });

    assert.strictEqual(badJwtRes.statusCode, 403, 'Protected route with invalid JWT should return 403');
    console.log('  ✓ Test 6 Passed: Protected route rejects invalid JWT');

    // Test 7: Protected Route Accepts Valid JWT & Exposes Profile
    const meRes = await makeRequest(server, {
      ...baseOptions,
      path: '/auth/me',
      method: 'GET',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${validToken}` }
    });

    assert.strictEqual(meRes.statusCode, 200, 'Protected route with valid JWT should return 200');
    assert.strictEqual(meRes.body.user.email, 'maina.kamau@buildops.co.ke', 'User email in profile should match');
    assert.strictEqual(meRes.body.user.role, 'contractor', 'User role should match');
    console.log('  ✓ Test 7 Passed: Protected route accepts valid JWT');

    // Test 8: Role Guard Verification
    const contractorRes = await makeRequest(server, {
      ...baseOptions,
      path: '/auth/contractor-only',
      method: 'GET',
      headers: { ...baseOptions.headers, Authorization: `Bearer ${validToken}` }
    });

    assert.strictEqual(contractorRes.statusCode, 200, 'Contractor role access allowed');
    console.log('  ✓ Test 8 Passed: Role-based access control guard verified');

    console.log('[PASS] [Sprint B1 Auth Test] All 8 integration test cases passed successfully!');
    server.close(() => process.exit(0));
  } catch (err) {
    console.error('[FAIL] Sprint B1 Auth Test Failed:', err);
    server.close(() => process.exit(1));
  }
}

if (require.main === module) {
  runAuthTests();
}

module.exports = { runAuthTests };
