// Quick test to verify server routes
const http = require('http');

const tests = [
  { path: '/health', expected: 'ok' },
  { path: '/', expected: 'html' },
  { path: '/api/game/invalid', expected: '404' }
];

console.log('Testing server routes...\n');

tests.forEach(test => {
  http.get(`http://localhost:3000${test.path}`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`✓ ${test.path} - Status: ${res.statusCode}`);
      if (test.expected === 'html') {
        console.log(`  Response type: ${res.headers['content-type']}`);
      } else {
        console.log(`  Response: ${data.substring(0, 100)}`);
      }
      console.log('');
    });
  }).on('error', (err) => {
    console.log(`✗ ${test.path} - Error: ${err.message}\n`);
  });
});
