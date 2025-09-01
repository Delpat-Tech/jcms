const nodemailer = require('nodemailer');

async function main() {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'dramsyt@gmail.com',
      pass: 'yxxywluubqfbpfzm' // your new App Password (no spaces)
    }
  });

  let mailOptions = {
    from: '"Test Script" <dramsyt@gmail.com>',
    to: 'shinderudransh3@gmail.com',
    subject: 'Nodemailer SMTP Test',
    text: 'If you received this, your SMTP connection is working!',
    html: '<b>If you received this, your SMTP connection is working!</b>',
  };

  try {
    console.log('Attempting to send email...');
    let info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Failed to send email.');
    console.error(error);
  }
}

main();
