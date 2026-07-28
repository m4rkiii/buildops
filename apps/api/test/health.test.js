const assert = require('assert');
const http = require('http');
const app = require('../src/index');

const server = app.listen(0, () => {
  const port = server.address().port;
  http.get(`http://localhost:${port}/health`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        assert.strictEqual(res.statusCode, 200, 'Status should be 200');
        const json = JSON.parse(data);
        assert.strictEqual(json.status, 'ok', 'Status property should be ok');
        assert.strictEqual(json.service, 'buildops-api', 'Service should match');
        console.log('✅ [Sprint A1 API Test] /health check passed successfully!');
        server.close(() => process.exit(0));
      } catch (err) {
        console.error('❌ [Sprint A1 API Test Failed]:', err);
        server.close(() => process.exit(1));
      }
    });
  }).on('error', err => {
    console.error('❌ Request error:', err);
    server.close(() => process.exit(1));
  });
});
