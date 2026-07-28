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

  console.log('\n✅ All API test suites passed cleanly!');
} catch (err) {
  console.error('\n❌ API Test Suite Execution Failed:', err.message);
  process.exit(1);
}
