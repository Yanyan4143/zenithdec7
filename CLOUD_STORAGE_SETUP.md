# ☁️ **CLOUD STORAGE SETUP GUIDE**
## **Real-World Configuration for ZenithLabs POS**

### **🚀 QUICK START - GOOGLE DRIVE (RECOMMENDED)**

Google Drive is the easiest and most reliable option for real-world use. Follow these steps:

## 📁 **GOOGLE DRIVE SETUP - STEP BY STEP**

### **Step 1: Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click **"Select a project"** → **"NEW PROJECT"**
4. Enter project name: `ZenithLabs POS Backup`
5. Click **"CREATE"**

### **Step 2: Enable Google Drive API**
1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Drive API"**
3. Click on it and press **"ENABLE"**
4. Wait for it to activate (takes 1-2 minutes)

### **Step 3: Create OAuth Credentials**
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Select **"Web application"** as application type
4. Enter name: `ZenithLabs POS Web App`
5. Add **Authorized JavaScript origins**:
   - `http://localhost:3000` (for testing)
   - `https://yourdomain.com` (for production)
6. Add **Authorized redirect URIs**:
   - `http://localhost:3000/oauth-callback.html`
   - `https://yourdomain.com/oauth-callback.html`
7. Click **"CREATE"**

### **Step 4: Get Your Credentials**
You will see a popup with your **Client ID**. Copy it - this is what you need.

### **Step 5: Get API Key**
1. Go back to **"Credentials"** page
2. Click **"+ CREATE CREDENTIALS"** → **"API key"**
3. Copy the API key
4. **IMPORTANT**: Restrict the API key:
   - Click on the API key name
   - Under "API restrictions", select **"Restrict key"**
   - Choose **"Google Drive API"** only
   - Save the changes

### **Step 6: Update Configuration**
In `cloud-storage.js`, replace the demo credentials:

```javascript
googledrive: {
    name: 'Google Drive',
    api: 'drive',
    scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
    ],
    clientId: 'YOUR_ACTUAL_CLIENT_ID_HERE', // Replace with your Client ID from Step 4
    apiKey: 'YOUR_ACTUAL_API_KEY_HERE',     // Replace with your API Key from Step 5
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    redirectUri: window.location.origin + '/oauth-callback.html'
}
```

### **Step 7: Test the Connection**
1. Start your POS system
2. Go to Admin panel → Cloud Storage section
3. Select **"Google Drive"** from dropdown
4. Click **"Connect Cloud"**
5. It should open Google OAuth popup
6. Sign in and grant permissions
7. Success! Your cloud storage is now connected

---

## 📦 **DROPBOX SETUP (ALTERNATIVE)**

### **1. Create Dropbox App**
1. Go to [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Click **"Create app"**
3. Select **"Scoped access"**
4. Select **"Full Dropbox"**
5. Enter app name: `ZenithLabs POS`
5. Enter app name (e.g., "ZenithLabs POS")

### 2. Configure Permissions
1. Go to "Permissions" tab
2. Add these scopes:
   - `files.content.write`
   - `files.content.read`
3. Click "Submit"

### 3. Get App Key
1. Go to "Settings" tab
2. Find "App key" (also called Client ID)
3. Copy the App key

### 4. Update Configuration
In `cloud-storage.js`, update the Dropbox configuration:
```javascript
dropbox: {
    name: 'Dropbox',
    clientId: 'YOUR_ACTUAL_DROPBOX_APP_KEY',
    // ... rest of config
}
```

## ☁️ OneDrive Setup

### 1. Register Azure AD Application
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Enter application name (e.g., "ZenithLabs POS")
5. Select "Accounts in any organizational directory"
6. Set redirect URI: `http://localhost:3000/oauth-callback.html`

### 2. Configure API Permissions
1. Go to "API permissions"
2. Click "Add a permission" → "Microsoft Graph"
3. Select "Delegated permissions"
4. Add these permissions:
   - `Files.ReadWrite.AppFolder`
5. Click "Add permissions"

### 3. Get Client ID
1. Go to "Overview" tab
2. Copy the "Application (client) ID"

### 4. Update Configuration
In `cloud-storage.js`, update the OneDrive configuration:
```javascript
onedrive: {
    name: 'OneDrive',
    clientId: 'YOUR_ACTUAL_ONEDRIVE_CLIENT_ID',
    // ... rest of config
}
```

## 🌐 Google Cloud Storage Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "ZenithLabs POS Backups")

### 2. Enable Cloud Storage API
1. Go to "APIs & Services" → "Library"
2. Search for "Cloud Storage API"
3. Click "Enable"

### 3. Create Storage Bucket
1. Go to "Cloud Storage" → "Buckets"
2. Click "Create bucket"
3. Enter bucket name (e.g., "your-pos-backup-bucket")
4. Choose storage location
5. Choose storage class (Standard recommended)
6. Keep default access control settings
7. Click "Create"

### 4. Create Service Account
1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Enter service account name (e.g., "pos-backup-service")
4. Click "Create and Continue"
5. Skip granting roles for now
6. Click "Done"

### 5. Grant Bucket Permissions
1. Go to your bucket
2. Click "Permissions" tab
3. Click "Grant Access"
4. Add the service account email
5. Grant "Storage Object Admin" role
6. Click "Save"

### 6. Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Select "Web application"
4. Add authorized redirect URI
5. Copy the Client ID

### 7. Update Configuration
In `cloud-storage.js`, update the Google Cloud Storage configuration:
```javascript
googcloud: {
    name: 'Google Cloud Storage',
    bucket: 'your-actual-pos-backup-bucket',
    clientId: 'YOUR_ACTUAL_GOOGLE_CLOUD_CLIENT_ID',
    // ... rest of config
}
```

## 🔧 Deployment Considerations

### Production URLs
Update the `redirectUri` in all configurations to your production domain:
```javascript
redirectUri: 'https://your-domain.com/oauth-callback.html'
```

### Security Best Practices
1. Use environment variables for sensitive credentials
2. Enable HTTPS in production
3. Restrict API key usage to your domain
4. Regularly rotate credentials
5. Monitor API usage and costs

### CORS Configuration
For Google Cloud Storage, configure CORS:
```json
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

## 🚀 Testing the Integration

### 1. Local Development
1. Start a local web server (not file:// protocol)
2. Open `admin.html` in your browser
3. Navigate to the Backup tab
4. Select a cloud provider
5. Click "Connect Cloud"
6. Complete the OAuth flow
7. Test backup functionality

### 2. Production Testing
1. Deploy to your production domain
2. Update redirect URIs in cloud provider configs
3. Test the full authentication flow
4. Verify backup uploads and downloads
5. Test automatic backup protection

## 📋 Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure redirect URIs match exactly
2. **API Not Enabled**: Verify all required APIs are enabled
3. **Permission Denied**: Check OAuth scopes and permissions
4. **Upload Failures**: Verify bucket permissions and CORS settings

### Debug Mode
Enable console logging in `cloud-storage.js`:
```javascript
console.log('Cloud Storage Debug:', { provider, config, error });
```

## 🎯 Next Steps

1. Configure your preferred cloud provider(s)
2. Test the authentication flow
3. Verify backup and restore functionality
4. Set up automatic backup schedules
5. Monitor backup success rates

## 📞 Support

For issues with specific cloud providers:
- Google Drive: [Google Drive API Documentation](https://developers.google.com/drive/api)
- Dropbox: [Dropbox API Documentation](https://www.dropbox.com/developers/documentation)
- OneDrive: [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/api)
- Google Cloud Storage: [Cloud Storage Documentation](https://cloud.google.com/storage/docs)
