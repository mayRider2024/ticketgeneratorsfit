// Quick standalone SMTP test using current .env values (CommonJS version)
// Run: node scripts/testEmail.js recipient@example.com
require('dotenv').config();
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const { Resend } = require('resend');

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error('Usage: npm run email:test -- you@example.com');
    process.exit(1);
  }
  let transport;
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
    console.log('Using Resend API...');
    const resend = new Resend(process.env.RESEND_API_KEY);
    // Simulate sendMail API like nodemailer for consistency.
    try {
      const r = await resend.emails.send({
        from: process.env.RESEND_FROM,
        to,
        subject: 'TicketGenerator SMTP Test (Resend)',
        text: 'Resend test email',
        html: '<p>Resend test email</p>'
      });
      if (r.error) {
        console.error('Resend error:', r.error.message);
        process.exit(4);
      }
      console.log('Resend success id:', r.data?.id);
      process.exit(0);
    } catch (e) {
      console.error('Resend exception:', e.message);
      process.exit(4);
    }
    return;
  } else if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN && process.env.GMAIL_USER) {
    console.log('Using Gmail OAuth2 credentials...');
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );
    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    let accessToken;
    try {
      const res = await oAuth2Client.getAccessToken();
      accessToken = typeof res === 'string' ? res : res?.token;
    } catch (e) {
      console.error('Failed to get Gmail access token:', e.message);
      process.exit(2);
    }
    transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken
      },
      logger: true,
      debug: true
    });
  } else {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      console.error('Missing SMTP env vars (and Gmail OAuth2 not configured)');
      process.exit(2);
    }
    transport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass }, logger: true, debug: true });
  }
  try {
    console.log('Verifying transport...');
    await transport.verify();
    console.log('Transport OK');
  } catch (e) {
    console.error('Transport verify FAILED:', e.message);
    process.exit(3);
  }
  const from = process.env.GMAIL_USER || (process.env.EMAIL_FROM && process.env.EMAIL_STRICT_FROM !== 'true' ? process.env.EMAIL_FROM : process.env.SMTP_USER);
  let info;
  try {
    info = await transport.sendMail({ from, to, subject: 'TicketGenerator SMTP Test', text: 'This is a plain text test email confirming SMTP connectivity.', html: '<p>This is a <b>test email</b> confirming SMTP connectivity.</p>' });
  } catch (e) {
    console.error('Send failed:', e.message);
    process.exit(4);
  }
  console.log('Result accepted:', info.accepted, 'rejected:', info.rejected || []);
  if (info.rejected && info.rejected.length) {
    process.exit(5);
  }
  if (!info.accepted || !info.accepted.length) {
    console.error('No recipients accepted. Raw response:', info.response);
    process.exit(6);
  }
  console.log('Success. MessageID:', info.messageId);
  process.exit(0);
}

main().catch(e => { console.error('Fatal error', e); process.exit(10); });
