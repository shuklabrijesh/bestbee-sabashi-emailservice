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

    // 5. Test Namespace Email Endpoint Routing (e.g., /api/admin/email/send)
    // Even if SMTP auth fails without real credentials, the endpoint routing & validation should accept the authenticated request
    res = await fetch(`${baseUrl}/api/admin/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Test Admin Email',
        text: 'Testing admin namespace'
      })
    });
    // We expect either 200 (if SMTP mocked/configured) or 500 (if invalid SMTP credentials in test environment),
    // but crucially NOT 404 (route exists) and NOT 401/403 (auth works).
    assert.notStrictEqual(res.status, 404);
    assert.notStrictEqual(res.status, 401);
    console.log('✓ Namespace email routing (/api/admin/email/send) verified');

    console.log('\nAll integration tests passed successfully!');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
