// Helper script: node scripts/getGmailRefreshToken.js
// Prompts you through the OAuth2 flow to obtain a refresh token for Gmail SMTP.
// Prerequisites:
// 1. In Google Cloud Console create an OAuth 2.0 Client ID (Desktop app type is simplest for this script)
// 2. Enable Gmail API for the project.
// 3. Set the following env vars in .env (or export before running):
//    GMAIL_CLIENT_ID=...\n   GMAIL_CLIENT_SECRET=...\n   GMAIL_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob OR http://localhost (if using copy-paste legacy)
// Then run: node scripts/getGmailRefreshToken.js
// It will print a URL; open it, consent, copy the code back, and you'll get a refresh token.

require('dotenv').config();
const readline = require('readline');
const { google } = require('googleapis');

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
const redirectUri = process.env.GMAIL_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';

if (!clientId || !clientSecret) {
  console.error('Missing GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET in environment');
  process.exit(1);
}

const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

// Gmail scope (least privilege) just for sending mail. If you need read/modify later you can expand.
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
console.log('\nAuthorize this app by visiting this url:\n', authUrl, '\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Enter the code from that page here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());
    console.log('\nSuccess. Save these in your .env:\n');
    if (tokens.refresh_token) {
      console.log('GMAIL_REFRESH_TOKEN=' + tokens.refresh_token);
    } else {
      console.warn('No refresh_token returned. Did you already grant consent? Add prompt=consent to force.');
    }
    console.log('GMAIL_ACCESS_TOKEN (optional preview)=' + (tokens.access_token || '')); // ephemeral
    console.log('\nExample email vars (replace with your Gmail address):');
    console.log('SMTP_SERVICE=gmail');
    console.log('GMAIL_USER=yourgmail@gmail.com');
  } catch (e) {
    console.error('Error retrieving access token:', e.message);
    process.exit(2);
  }
});
