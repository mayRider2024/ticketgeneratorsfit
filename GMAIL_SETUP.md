# Gmail SMTP Setup Guide

## Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "2-Step Verification"
4. Follow the prompts to enable 2-Step Verification if not already enabled

## Step 2: Generate App Password
1. In the same "Security" section, look for "App passwords"
2. Click on "App passwords" (you may need to sign in again)
3. Select "Mail" from the "Select app" dropdown
4. Select "Other (custom name)" from the "Select device" dropdown
5. Enter "Ticket Generator" as the custom name
6. Click "Generate"
7. Copy the 16-character app password (it will look like: abcd efgh ijkl mnop)

## Step 3: Update Environment Variables
1. Open your `.env.local` file
2. Replace `your_gmail_app_password_here` with the app password you just generated
3. Make sure GMAIL_USER is set to your Gmail address: `lokemayuresh6dz@student.sfit.ac.in`

Example:
```
GMAIL_USER=lokemayuresh6dz@student.sfit.ac.in
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

## Step 4: Install Dependencies
Run the following command in your terminal:
```bash
npm install nodemailer
```

## Step 5: Test the Configuration
Run the test script to verify everything is working:
```bash
node scripts/testGmailEmail.js
```

## Step 6: Use the Feature
1. Go to your ticket generator page
2. Fill in the name and email fields
3. Click "Send Ticket via Email"
4. The ticket image will be sent to the specified email address

## Troubleshooting
- If you get authentication errors, double-check your app password
- Make sure 2-Factor Authentication is enabled on your Google account
- The app password should be 16 characters without spaces
- If the test email fails, check your internet connection
- Gmail may temporarily block access if too many emails are sent too quickly

## Security Notes
- Never share your app password
- The app password is specific to this application
- You can revoke the app password anytime from your Google Account settings
- Keep your `.env.local` file secure and never commit it to version control