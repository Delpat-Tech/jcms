// test-webhook.js - Test n8n webhook directly
const axios = require('axios');

async function testWebhook() {
  try {
    console.log('🧪 Testing n8n webhook...');
    
    const payload = {
      event: 'user_registered',
      timestamp: new Date().toISOString(),
      user: {
        id: 'test123',
        username: 'TestUser',
        email: 'test@example.com',
        role: 'viewer',
        createdAt: new Date()
      },
      tenant: {
        id: 'tenant123',
        name: 'Test Company',
        subdomain: 'testco'
      }
    };

    const response = await axios.post('http://localhost:5678/webhook/user-registration', payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Source': 'JCMS'
      },
      timeout: 10000
    });

    console.log('✅ Webhook successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);

  } catch (error) {
    console.error('❌ Webhook failed:');
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 n8n is not running on port 5678');
      console.error('💡 Start n8n with: n8n start');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 Cannot resolve localhost');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testWebhook();