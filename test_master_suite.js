const { execSync } = require('child_process');
const path = require('path');

console.log('\n======================================================');
console.log('   BuildOps Sentinel — Master Monorepo Regression Suite');
console.log('======================================================\n');

try {
  console.log('--- Step 1: ML Microservice Model Retraining & Pytest Suite ---');
  execSync('python train_ensemble_anomaly.py', { stdio: 'inherit', cwd: path.join(__dirname, 'apps', 'ml-service') });
  execSync('python -m pytest', { stdio: 'inherit', cwd: path.join(__dirname, 'apps', 'ml-service') });

  console.log('\n--- Step 2: Express API Integration Test Suite ---');
  execSync('npm test', { stdio: 'inherit', cwd: path.join(__dirname, 'apps', 'api') });

  console.log('\n--- Step 3: NFR01 & NFR02 Latency Benchmark Suite ---');
  execSync('node test/test_nfr_benchmarks.js', { stdio: 'inherit', cwd: path.join(__dirname, 'apps', 'api') });

  console.log('\n--- Step 4: React Dashboard Vite Production Build ---');
  execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, 'apps', 'web') });

  console.log('\n======================================================');
  console.log('   ✅ ALL MONOREPO TEST SUITES PASSED CLEANLY!       ');
  console.log('======================================================\n');
} catch (err) {
  console.error('\n❌ Master Regression Suite Failure:', err.message);
  process.exit(1);
}
