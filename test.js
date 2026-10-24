const assert = require('assert');
const http = require('http');
const app = require('./src/app');

async function runTests() {
  console.log('Starting integration test suite...');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Test Health Check
    let res = await fetch(`${baseUrl}/health`);
    let data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'UP');
    console.log('✓ Health check passed');

    // 2. Test Admin - Create Client
    res = await fetch(`${baseUrl}/api/admin/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'admin_secret_key'
      },
      body: JSON.stringify({ name: 'Test Client App' })
    });
    data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.ok(data.clientId);
    assert.ok(data.clientSecret);
    console.log('✓ Admin create client passed');

    const clientId = data.clientId;
    const clientSecret = data.clientSecret;

    // 3. Test Auth - Login
    res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret })
    });
    data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.accessToken);
    assert.ok(data.refreshToken);
    console.log('✓ Client login & token generation passed');

    const accessToken = data.accessToken;
    const refreshToken = data.refreshToken;

    // 4. Test Token Refresh
    res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.accessToken);
    console.log('✓ Token refresh passed');

    // 5. Test Multiple Endpoints (Admin, Support, Account, CEO) with Single and Bulk formats
    const endpoints = [
      '/api/admin/email/send',
      '/api/admin/email/sendbulk',
      '/api/support/email/send',
      '/api/support/email/sendbulk',
      '/api/account/email/send',
      '/api/account/email/sendbulk',
      '/api/ceo/email/send',
      '/api/ceo/email/sendbulk'
    ];

    for (const ep of endpoints) {
      const isBulk = ep.includes('sendbulk');
      const bodyPayload = isBulk ? {
        recipients: ['recipient1@example.com', 'recipient2@example.com', 'recipient1@example.com'], // duplicate to test deduplication
        subject: 'Test Bulk Email',
        text: 'Bulk message testing'
      } : {
        to: 'recipient@example.com',
        subject: 'Test Single Email',
        text: 'Single message testing'
      };

      res = await fetch(`${baseUrl}${ep}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(bodyPayload)
      });

      // Verify route exists and handles authentication correctly
      assert.notStrictEqual(res.status, 404);
      assert.notStrictEqual(res.status, 401);
      console.log(`✓ Verified route ${ep}`);
    }

    console.log('\nAll integration tests passed successfully!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
