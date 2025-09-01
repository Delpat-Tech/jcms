# 📧 n8n Email Automation Setup Guide

## 🚀 **Quick Setup**

### **1. Install n8n**
```bash
npm install -g n8n
# or
npx n8n
```

### **2. Start n8n**
```bash
n8n start
# Access: http://localhost:5678
```

### **3. Import Workflow**
1. Open n8n dashboard: `http://localhost:5678`
2. Click **"Import from file"**
3. Upload: `n8n-workflow-welcome-email.json`
4. Activate the workflow

### **4. Configure Email Settings**
In n8n workflow, update **Send Welcome Email** node:
```
From Email: your-email@domain.com
SMTP Settings: Configure your email provider
```

**Popular Email Providers:**
- **Gmail**: smtp.gmail.com:587 (App Password required)
- **Outlook**: smtp-mail.outlook.com:587
- **SendGrid**: smtp.sendgrid.net:587

### **5. Update JCMS Environment**
```bash
# .env file
N8N_WEBHOOK_URL="http://localhost:5678/webhook/user-registration"
```

---

## 🔧 **Workflow Details**

### **Trigger:** Webhook
- **URL**: `http://localhost:5678/webhook/user-registration`
- **Method**: POST
- **Headers**: `Content-Type: application/json`

### **Payload Structure:**
```json
{
  "event": "user_registered",
  "timestamp": "2024-01-01T12:00:00Z",
  "user": {
    "id": "user_id",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "viewer"
  },
  "tenant": {
    "id": "tenant_id",
    "name": "Company Name",
    "subdomain": "company"
  }
}
```

### **Email Template Features:**
- ✅ **Personalized** with user details
- ✅ **Branded** with tenant information
- ✅ **Responsive** HTML design
- ✅ **Professional** styling
- ✅ **Getting started** guide

---

## 🧪 **Testing**

### **1. Register New User**
```bash
POST http://localhost:5000/api/auth/register
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "tenant": "tenant_id"
}
```

### **2. Check n8n Execution**
- Go to n8n dashboard
- Check **Executions** tab
- Verify email was sent

### **3. Manual Webhook Test**
```bash
curl -X POST http://localhost:5678/webhook/user-registration \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user_registered",
    "user": {
      "username": "test",
      "email": "test@example.com"
    },
    "tenant": {
      "name": "Test Company"
    }
  }'
```

---

## 🔄 **Additional Automations**

### **Image Upload Notifications**
- Webhook: `/webhook/image-upload`
- Notify admins of new uploads
- Send usage reports

### **Daily Analytics Reports**
- Schedule: Daily at 9 AM
- Email tenant admins
- Include user activity stats

### **User Onboarding Series**
- Day 1: Welcome email
- Day 3: Getting started tips
- Day 7: Feature highlights

---

## 🛠️ **Troubleshooting**

**Webhook not triggering:**
- Check n8n is running on port 5678
- Verify webhook URL in .env
- Check network connectivity

**Email not sending:**
- Verify SMTP credentials
- Check spam folder
- Test email settings in n8n

**Template not rendering:**
- Check JSON payload structure
- Verify template variables
- Test with sample data

The automation is now ready to send beautiful welcome emails to all new JCMS users! 🎉