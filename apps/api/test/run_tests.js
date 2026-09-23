const { execSync } = require('child_process');
const path = require('path');

console.log('[BuildOps API Test Runner] Running Express API test suite...');

try {
  console.log('\n--- Running Health Check Test ---');
  execSync('node test/health.test.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n--- Running Auth Integration Tests (Sprint B1) ---');
  execSync('node test/auth.test.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n--- Running Project CRUD Integration Tests (Sprint B2) ---');
  execSync('node test/project.test.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n--- Running Milestone CRUD Integration Tests (Sprint B3) ---');
  execSync('node test/milestone.test.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n--- Running E2E Backend Pass (Sprint B4) ---');
  execSync('node test/e2e_backend.test.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n--- Running Role-Based NCA Regulator Access Tests (Sprint H1) ---');
  execSync('node test/nca_role.test.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n--- Running Phase I Secondary ML API Tests ---');
  execSync('node test/phase_i_ml.test.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n--- Running Presentation Readiness Master Verification ---');
  execSync('node test/test_presentation_readiness.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n✅ All API test suites passed cleanly!');
} catch (err) {
  console.error('\n❌ API Test Suite Execution Failed:', err.message);
  process.exit(1);
}
