# Google Sheets Integration Setup Guide

## Overview
This feature creates and maintains a live Google Spreadsheet that automatically updates whenever ticket data changes.

## Setup Steps

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Note your Project ID

### 2. Enable Google Sheets API
1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click on it and press "Enable"
4. Also enable "Google Drive API" (needed for sharing permissions)

### 3. Create Service Account
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in service account details:
   - Name: `ticketgenerator-sheets`
   - Description: `Service account for ticket generator spreadsheet access`
4. Click "Create and Continue"
5. Skip role assignment (click "Continue")
6. Click "Done"

### 4. Generate Service Account Key
1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Download the JSON file
6. Keep this file secure!

### 5. Extract Credentials
From the downloaded JSON file, you need these values:
- `client_email` - The service account email
- `private_key` - The private key (including `-----BEGIN PRIVATE KEY-----` headers)
- `project_id` - Your Google Cloud project ID

### 6. Update Environment Variables
Add these to your `.env.local` file:

```bash
# Google Sheets API Configuration
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_PROJECT_ID=your-google-project-id
```

**Important Notes:**
- Keep the quotes around the private key
- Include the full private key with headers
- The `\n` characters should be literal `\n` in the env file

### 7. Test the Integration
1. Restart your application
2. Go to any event's tickets page
3. Click "📊 View in Google Sheets"
4. A new Google Spreadsheet should be created and opened

## Features

### Auto-Creation
- First click creates a new Google Spreadsheet
- Spreadsheet is automatically named: `Event [eventId] - Tickets Database`
- Made publicly viewable (read-only)

### Auto-Updates
- Spreadsheet automatically updates when ticket data changes
- Updates happen every 2 seconds after data changes
- No manual refresh needed

### Professional Formatting
- Header row with blue background and white text
- Auto-resized columns for better readability
- Clean, organized layout

### Persistent Access
- Once created, the "🔗 Open Spreadsheet" button appears
- Click to quickly access your spreadsheet anytime
- Same spreadsheet is reused for each event

## Troubleshooting

### "Google Sheets credentials not configured"
- Make sure all three environment variables are set
- Check that private key includes the full key with headers
- Restart your application after adding credentials

### "Permission denied"
- Ensure Google Sheets API is enabled in Google Cloud Console
- Verify service account has proper permissions
- Check that the JSON key file was downloaded correctly

### "Failed to create spreadsheet"
- Check Google Cloud Console for API quota limits
- Ensure Google Drive API is also enabled
- Verify service account credentials are correct

## Security Notes
- Never commit the service account JSON file to version control
- Keep your `.env.local` file secure
- The private key should never be shared publicly
- Service account has minimal permissions (only creates/edits spreadsheets)

## Usage
1. **View in Google Sheets** - Creates/opens the live spreadsheet
2. **Auto-sync** - Spreadsheet updates automatically when tickets change
3. **Share spreadsheet URL** - Anyone with the link can view (read-only)
4. **Real-time collaboration** - Multiple people can view the same spreadsheet