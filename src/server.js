const app = require('./app');
const config = require('./config/config');
const ngrok = require('@ngrok/ngrok');

app.listen(config.port, async () => {
  console.log(`Multi-Tenant Email Service running on port ${config.port}`);

  try {
    // Automatically establish the public tunnel on startup
    const session = await ngrok.forward({
      addr: config.port,
      authtoken: config.grok.authToken,
      domain: config.grok.subdomain
    });

    console.log(`🚀 Fixed Public URL: ${session.url()}`);
  } catch (err) {
    console.error('❌ Failed to establish ngrok tunnel:', err);
  }
});
