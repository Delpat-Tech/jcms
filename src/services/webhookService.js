// services/webhookService.js - n8n webhook integration
const axios = require('axios');

class WebhookService {
  constructor() {
    this.n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/user-registration';
  }

  // Send user registration data to n8n
  async triggerUserRegistration(userData, tenantData) {
    try {
      const payload = {
        event: 'user_registered',
        timestamp: new Date().toISOString(),
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          createdAt: userData.createdAt
        },
        tenant: {
          id: tenantData.id,
          name: tenantData.name,
          subdomain: tenantData.subdomain
        }
      };

      const response = await axios.post(this.n8nWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Source': 'JCMS'
        },
        timeout: 5000
      });

      console.log('✅ n8n webhook triggered successfully:', response.status);
      return { success: true, status: response.status };

    } catch (error) {
      console.error('❌ n8n webhook failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Send image upload notification
  async triggerImageUpload(imageData, userData, tenantData) {
    try {
      const payload = {
        event: 'image_uploaded',
        timestamp: new Date().toISOString(),
        image: {
          id: imageData.id,
          title: imageData.title,
          fileUrl: imageData.fileUrl
        },
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email
        },
        tenant: {
          name: tenantData.name,
          subdomain: tenantData.subdomain
        }
      };

      await axios.post(this.n8nWebhookUrl.replace('user-registration', 'image-upload'), payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      console.log('✅ Image upload webhook triggered');
      return { success: true };

    } catch (error) {
      console.error('❌ Image upload webhook failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = WebhookService;