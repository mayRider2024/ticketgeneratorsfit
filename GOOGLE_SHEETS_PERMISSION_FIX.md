# 🔧 Google Sheets Permission Fix Guide

## Current Error: "The caller does not have permission"

This error occurs because the service account doesn't have the required APIs enabled or proper permissions. Follow these steps to fix it:

## 🚀 Step-by-Step Fix

### 1. Enable Required APIs in Google Cloud Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project**: `ticketgeneratorsc`
3. **Go to "APIs & Services" > "Library"**
4. **Enable these APIs** (search for each one):

   **a) Google Sheets API**
   - Search: "Google Sheets API"
   - Click on it
   - Click "Enable" (if not already enabled)

   **b) Google Drive API**
   - Search: "Google Drive API"
   - Click on it
   - Click "Enable" (if not already enabled)

### 2. Verify Service Account Permissions

1. **Go to "APIs & Services" > "Credentials"**
2. **Find your service account**: `ticketgenerator-mail@ticketgeneratorsc.iam.gserviceaccount.com`
3. **Click on the service account**
4. **Go to "Permissions" tab**
5. **Add these roles if missing**:
   - `Editor` (for creating files)
   - `Service Account User`

### 3. Alternative: Create New Service Account (if issues persist)

If the above doesn't work, create a fresh service account:

1. **Go to "APIs & Services" > "Credentials"**
2. **Click "Create Credentials" > "Service Account"**
3. **Fill details**:
   - Name: `ticket-sheets-service`
   - ID: `ticket-sheets-service`
   - Description: `Service for ticket spreadsheet management`
4. **Click "Create and Continue"**
5. **Grant roles**:
   - Select `Editor` role
   - Click "Continue"
6. **Click "Done"**

### 4. Generate New Key (if using new service account)

1. **Click on the new service account**
2. **Go to "Keys" tab**
3. **Click "Add Key" > "Create new key"**
4. **Select "JSON"**
5. **Download the file**
6. **Extract credentials** from the JSON:
   - `client_email`
   - `private_key`
   - `project_id`

### 5. Update Environment Variables

If you created a new service account, update your `.env.local`:

```bash
GOOGLE_CLIENT_EMAIL=ticket-sheets-service@ticketgeneratorsc.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_NEW_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_PROJECT_ID=ticketgeneratorsc
```

### 6. Restart Your Application

After making changes:
```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
```

## 🧪 Test the Fix

1. **Go to any event's tickets page**
2. **Click "📊 View in Google Sheets"**
3. **Check browser console** for detailed error logs
4. **If it works**: A new Google Spreadsheet should open

## 🔍 Debugging Commands

If you still get errors, check the logs in your browser's developer console (F12). The updated service now provides detailed error information.

## 📋 Common Issues & Solutions

### Issue: "API has not been used"
**Solution**: Enable Google Sheets API and Google Drive API in Google Cloud Console

### Issue: "invalid_grant"
**Solution**: 
- Check that private key is correct and properly quoted
- Verify service account email is correct
- Ensure no extra spaces in environment variables

### Issue: "insufficient authentication scopes"
**Solution**: The updated service now includes both required scopes:
- `https://www.googleapis.com/auth/spreadsheets`
- `https://www.googleapis.com/auth/drive.file`

### Issue: "Quotas exceeded"
**Solution**: Wait a few minutes and try again, or check quota limits in Google Cloud Console

## 🎯 Verification Checklist

✅ Google Sheets API enabled  
✅ Google Drive API enabled  
✅ Service account has Editor role  
✅ Private key is properly quoted  
✅ No typos in service account email  
✅ Application restarted after env changes  

## 🔒 Security Notes

- Keep your service account credentials secure
- Never commit private keys to version control
- The service account only has permission to create/edit spreadsheets
- Created spreadsheets are set to "anyone with link can view"

## 📞 Still Having Issues?

If you're still getting permission errors:

1. **Check Google Cloud Console Logs**:
   - Go to "Logging" > "Logs Explorer"
   - Look for API errors related to your project

2. **Try with a brand new Google Cloud project**:
   - Sometimes existing project settings can cause conflicts

3. **Verify billing is enabled**:
   - Google Cloud requires billing to be enabled for API usage

The updated service now provides much more detailed error logging to help identify the exact issue!