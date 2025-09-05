// services/notificationService.js
const nodemailer = require('nodemailer');
const Notification = require('../models/notification');
const User = require('../models/user');

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmailNotification = async (adminEmails, activityData) => {
  if (!process.env.SMTP_USER) {
    console.log('📧 Email notifications disabled (no SMTP config)');
    return;
  }

  const subject = `JCMS Alert: ${activityData.action} on ${activityData.resource}`;
  const html = `
    <h3>JCMS Activity Alert</h3>
    <p><strong>User:</strong> ${activityData.username} (${activityData.userRole})</p>
    <p><strong>Action:</strong> ${activityData.action}</p>
    <p><strong>Resource:</strong> ${activityData.resource}</p>
    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>IP:</strong> ${activityData.details.ip}</p>
    <hr>
    <p><small>This is an automated notification from JCMS</small></p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: adminEmails.join(','),
      subject,
      html
    });
    console.log('📧 Email notifications sent to admins');
  } catch (error) {
    console.error('❌ Email notification failed:', error.message);
  }
};

const saveNotification = async (activityData) => {
  try {
    const notification = new Notification({
      type: 'user_activity',
      action: activityData.action,
      resource: activityData.resource,
      userId: activityData.userId,
      username: activityData.username,
      userRole: activityData.userRole,
      resourceId: activityData.resourceId,
      details: activityData.details
    });
    
    await notification.save();
    console.log('💾 Notification saved to database');
    return notification;
  } catch (error) {
    console.error('❌ Failed to save notification:', error.message);
  }
};

const notifyAdmins = async (activityData) => {
  // 1. Save to database for persistent storage
  await saveNotification(activityData);
  
  // 2. Get all admin users
  const admins = await User.find({}).populate('role');
  const adminUsers = admins.filter(user => 
    ['admin', 'superadmin'].includes(user.role?.name)
  );
  
  // 3. Send email notifications
  const adminEmails = adminUsers.map(admin => admin.email).filter(Boolean);
  if (adminEmails.length > 0) {
    await sendEmailNotification(adminEmails, activityData);
  }
  
  return { emailsSent: adminEmails.length, notificationSaved: true };
};

module.exports = {
  notifyAdmins,
  saveNotification,
  sendEmailNotification
};