// Test script to verify Gmail SMTP configuration
// Run with: node scripts/testGmailEmail.js

const nodemailer = require('nodemailer');
const { config } = require('dotenv');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '../.env.local') });

async function testGmailEmail() {
  console.log('Testing Gmail SMTP configuration...');
  
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('❌ Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env.local');
    return;
  }

  if (process.env.GMAIL_APP_PASSWORD === 'your_gmail_app_password_here') {
    console.error('❌ Please update GMAIL_APP_PASSWORD with your actual Gmail app password');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    // Verify connection
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified successfully');

    // Send test email
    const testEmail = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Send to yourself
      subject: 'Test Email - Ticket Generator',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Gmail SMTP Test</h2>
          <p>This is a test email from your ticket generator application.</p>
          <p>If you received this, your Gmail SMTP configuration is working correctly!</p>
          <br>
          <p>Best regards,<br>Ticket Generator Team</p>
        </div>
      `,
    };

    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n📝 Authentication failed. Please check:');
      console.log('1. Your Gmail app password is correct');
      console.log('2. 2-Factor Authentication is enabled on your Gmail account');
      console.log('3. You generated an app password (not your regular password)');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n📝 Network error. Please check your internet connection.');
    }
  }
}

testGmailEmail();