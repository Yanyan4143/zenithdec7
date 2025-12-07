// Real Cloud Storage Integration for POS
// Supports Google Drive, Dropbox, OneDrive, and Google Cloud Storage

class CloudStorageManager {
    constructor() {
        this.providers = {
            googledrive: {
                name: 'Google Drive',
                api: 'drive',
                scopes: [
                    'https://www.googleapis.com/auth/drive.file',
                    'https://www.googleapis.com/auth/drive.metadata.readonly'
                ],
                clientId: '395844779846-7q9jl8a6d0qgq7q8r7q8r7q8r7q8r7q8.apps.googleusercontent.com', // Demo client ID
                apiKey: 'AIzaSyDemoKeyForTesting', // Demo API key
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                redirectUri: window.location.origin + '/oauth-callback.html'
            },
            dropbox: {
                name: 'Dropbox',
                api: 'dropbox',
                scopes: ['files.content.write', 'files.content.read'],
                clientId: 'demo-dropbox-app-key', // Replace with actual app key
                redirectUri: window.location.origin + '/oauth-callback.html'
            },
            onedrive: {
                name: 'OneDrive',
                api: 'graph',
                scopes: ['Files.ReadWrite.AppFolder'],
                clientId: 'demo-onedrive-client-id', // Replace with actual client ID
                redirectUri: window.location.origin + '/oauth-callback.html'
            },
            googcloud: {
                name: 'Google Cloud Storage',
                api: 'storage',
                bucket: 'zenithlabs-pos-backups', // Replace with actual bucket name
                clientId: 'demo-google-cloud-client-id', // Replace with actual client ID
                redirectUri: window.location.origin + '/oauth-callback.html'
            }
        };
        
        this.currentProvider = null;
        this.accessToken = null;
        this.isConnected = false;
        this.backupHistory = [];
        
        this.loadCloudSettings();
        this.initializeEventListeners();
    }
    
    // Load cloud settings from localStorage
    loadCloudSettings() {
        this.currentProvider = localStorage.getItem('cloudProvider');
        this.accessToken = localStorage.getItem('cloudAccessToken');
        this.backupHistory = JSON.parse(localStorage.getItem('cloudBackupHistory') || '[]');
        
        if (this.currentProvider && this.accessToken) {
            this.isConnected = true;
            this.updateCloudStatus(true);
        }
    }
    
    // Save cloud settings to localStorage
    saveCloudSettings() {
        localStorage.setItem('cloudProvider', this.currentProvider);
        localStorage.setItem('cloudAccessToken', this.accessToken);
        localStorage.setItem('cloudBackupHistory', JSON.stringify(this.backupHistory));
    }
    
    // Initialize event listeners
    initializeEventListeners() {
        const connectBtn = document.getElementById('connect-cloud-btn');
        const providerSelect = document.getElementById('cloud-provider-select');
        const backupBtn = document.getElementById('backup-to-cloud-btn');
        
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectCloudStorage());
        }
        
        if (providerSelect) {
            providerSelect.addEventListener('change', () => this.handleProviderChange());
        }
        
        if (backupBtn) {
            backupBtn.addEventListener('click', () => this.backupToCloud());
        }
    }
    
    // Handle provider change
    handleProviderChange() {
        const providerSelect = document.getElementById('cloud-provider-select');
        const selectedProvider = providerSelect.value;
        
        if (selectedProvider && this.currentProvider && selectedProvider !== this.currentProvider) {
            if (confirm('Changing providers will disconnect current cloud storage. Continue?')) {
                this.disconnectCloudStorage();
            } else {
                providerSelect.value = this.currentProvider;
            }
        }
    }
    
    // Connect to cloud storage
    async connectCloudStorage() {
        const providerSelect = document.getElementById('cloud-provider-select');
        const provider = providerSelect?.value;
        
        if (!provider) {
            this.showNotification('Please select a cloud provider first', 'warning');
            return;
        }
        
        const config = this.providers[provider];
        if (!config) {
            this.showNotification('Invalid cloud provider selected', 'error');
            return;
        }
        
        // Check if using demo credentials
        if (config.clientId.includes('demo-') || config.apiKey.includes('demo-')) {
            this.showDemoCredentialHelper(provider);
            return;
        }
        
        try {
            this.showNotification(`Connecting to ${config.name}...`, 'info');
            
            let authResult;
            
            switch (provider) {
                case 'googledrive':
                    authResult = await this.connectGoogleDrive(config);
                    break;
                case 'dropbox':
                    authResult = await this.connectDropbox(config);
                    break;
                case 'onedrive':
                    authResult = await this.connectOneDrive(config);
                    break;
                case 'googcloud':
                    authResult = await this.connectGoogleCloud(config);
                    break;
                default:
                    throw new Error('Unsupported cloud provider');
            }
            
            if (authResult.success) {
                this.currentProvider = provider;
                this.accessToken = authResult.accessToken;
                this.isConnected = true;
                
                this.saveCloudSettings();
                this.updateCloudStatus(true);
                this.showNotification(`Successfully connected to ${config.name}!`, 'success');
                
                // Test connection
                await this.testConnection();
            } else {
                throw new Error(authResult.error || 'Authentication failed');
            }
            
        } catch (error) {
            console.error('Cloud connection error:', error);
            this.showNotification(`Failed to connect to ${config.name}: ${error.message}`, 'error');
        }
    }
    
    // Connect to Google Drive
    async connectGoogleDrive(config) {
        try {
            // Check if using demo credentials
            if (config.clientId.includes('demo-') || config.apiKey.includes('demo-')) {
                return { success: false, error: 'Using demo credentials. Please configure real Google Drive credentials following the setup guide.' };
            }
            
            // Load Google API if not already loaded
            if (typeof gapi === 'undefined') {
                await this.loadGoogleAPI(config);
            }
            
            return new Promise((resolve) => {
                // Check if Google Identity Services is available
                if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
                    resolve({ success: false, error: 'Google Identity Services not loaded. Please refresh the page and try again.' });
                    return;
                }
                
                // Initialize token client
                const tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: config.clientId,
                    scope: config.scopes.join(' '),
                    callback: (response) => {
                        if (response.access_token) {
                            resolve({ success: true, accessToken: response.access_token });
                        } else if (response.error) {
                            resolve({ success: false, error: `OAuth error: ${response.error}` });
                        } else {
                            resolve({ success: false, error: 'Failed to get access token' });
                        }
                    },
                    error_callback: (error) => {
                        resolve({ success: false, error: error.message || 'Authentication failed' });
                    }
                });
                
                // Request token
                tokenClient.requestAccessToken();
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    resolve({ success: false, error: 'Authentication timeout' });
                }, 30000);
            });
            
        } catch (error) {
            console.error('Google Drive connection error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Load Google API
    async loadGoogleAPI(config) {
        // Skip API loading for demo credentials to prevent errors
        if (config.apiKey.includes('demo-')) {
            console.log('Skipping Google API load for demo credentials');
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            // Load Google API script if not already loaded
            if (typeof gapi === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = async () => {
                    try {
                        await gapi.load('client', async () => {
                            await gapi.client.init({
                                apiKey: config.apiKey,
                                discoveryDocs: config.discoveryDocs,
                            });
                            console.log('✅ Google API loaded successfully');
                            resolve();
                        });
                    } catch (error) {
                        console.error('Google API initialization error:', error);
                        reject(error);
                    }
                };
                script.onerror = () => {
                    console.error('Failed to load Google API script');
                    reject(new Error('Failed to load Google API'));
                };
                document.head.appendChild(script);
            } else {
                console.log('Google API already loaded');
                resolve();
            }
        });
    }
    
    // Connect to Dropbox
    async connectDropbox(config) {
        try {
            // Check if using demo credentials
            if (config.clientId.includes('demo-')) {
                return { success: false, error: 'Using demo credentials. Please configure real Dropbox credentials following the setup guide.' };
            }
            
            // Generate Dropbox auth URL
            const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${config.clientId}&response_type=token&redirect_uri=${encodeURIComponent(config.redirectUri)}`;
            
            // Open auth window
            const authWindow = window.open(authUrl, 'dropbox-auth', 'width=600,height=600');
            
            return new Promise((resolve) => {
                const checkAuth = setInterval(() => {
                    try {
                        if (authWindow.closed) {
                            clearInterval(checkAuth);
                            resolve({ success: false, error: 'Authentication cancelled' });
                            return;
                        }
                        
                        // Check for token in URL (this would be handled by your callback page)
                        const urlParams = new URLSearchParams(authWindow.location.search);
                        const hashParams = new URLSearchParams(authWindow.location.hash.substring(1));
                        
                        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
                        
                        if (accessToken) {
                            clearInterval(checkAuth);
                            authWindow.close();
                            resolve({ success: true, accessToken: accessToken });
                        }
                    } catch (e) {
                        // Cross-origin error, continue checking
                    }
                }, 1000);
                
                // Timeout after 5 minutes
                setTimeout(() => {
                    clearInterval(checkAuth);
                    if (!authWindow.closed) {
                        authWindow.close();
                    }
                    resolve({ success: false, error: 'Authentication timeout' });
                }, 300000);
            });
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Connect to OneDrive
    async connectOneDrive(config) {
        try {
            // Check if using demo credentials
            if (config.clientId.includes('demo-')) {
                return { success: false, error: 'Using demo credentials. Please configure real OneDrive credentials following the setup guide.' };
            }
            
            // Generate Microsoft Graph auth URL
            const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${config.clientId}&response_type=token&scope=${encodeURIComponent(config.scopes.join(' '))}&redirect_uri=${encodeURIComponent(config.redirectUri)}`;
            
            // Open auth window
            const authWindow = window.open(authUrl, 'onedrive-auth', 'width=600,height=600');
            
            return new Promise((resolve) => {
                const checkAuth = setInterval(() => {
                    try {
                        if (authWindow.closed) {
                            clearInterval(checkAuth);
                            resolve({ success: false, error: 'Authentication cancelled' });
                            return;
                        }
                        
                        // Check for token in URL
                        const hashParams = new URLSearchParams(authWindow.location.hash.substring(1));
                        const accessToken = hashParams.get('access_token');
                        
                        if (accessToken) {
                            clearInterval(checkAuth);
                            authWindow.close();
                            resolve({ success: true, accessToken: accessToken });
                        }
                    } catch (e) {
                        // Cross-origin error, continue checking
                    }
                }, 1000);
                
                // Timeout after 5 minutes
                setTimeout(() => {
                    clearInterval(checkAuth);
                    if (!authWindow.closed) {
                        authWindow.close();
                    }
                    resolve({ success: false, error: 'Authentication timeout' });
                }, 300000);
            });
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Connect to Google Cloud Storage
    async connectGoogleCloud(config) {
        try {
            // Check if using demo credentials
            if (config.clientId.includes('demo-')) {
                return { success: false, error: 'Using demo credentials. Please configure real Google Cloud Storage credentials following the setup guide.' };
            }
            
            // Use Google Cloud Storage REST API
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&response_type=token&scope=https://www.googleapis.com/auth/devstorage.full_control&redirect_uri=${encodeURIComponent(config.redirectUri)}`;
            
            // Open auth window
            const authWindow = window.open(authUrl, 'gcs-auth', 'width=600,height=600');
            
            return new Promise((resolve) => {
                const checkAuth = setInterval(() => {
                    try {
                        if (authWindow.closed) {
                            clearInterval(checkAuth);
                            resolve({ success: false, error: 'Authentication cancelled' });
                            return;
                        }
                        
                        // Check for token in URL
                        const hashParams = new URLSearchParams(authWindow.location.hash.substring(1));
                        const accessToken = hashParams.get('access_token');
                        
                        if (accessToken) {
                            clearInterval(checkAuth);
                            authWindow.close();
                            resolve({ success: true, accessToken: accessToken });
                        }
                    } catch (e) {
                        // Cross-origin error, continue checking
                    }
                }, 1000);
                
                // Timeout after 5 minutes
                setTimeout(() => {
                    clearInterval(checkAuth);
                    if (!authWindow.closed) {
                        authWindow.close();
                    }
                    resolve({ success: false, error: 'Authentication timeout' });
                }, 300000);
            });
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Test cloud connection
    async testConnection() {
        try {
            switch (this.currentProvider) {
                case 'googledrive':
                    await this.testGoogleDriveConnection();
                    break;
                case 'dropbox':
                    await this.testDropboxConnection();
                    break;
                case 'onedrive':
                    await this.testOneDriveConnection();
                    break;
                case 'googcloud':
                    await this.testGoogleCloudConnection();
                    break;
            }
            this.showNotification('Cloud connection test successful!', 'success');
        } catch (error) {
            console.error('Connection test failed:', error);
            this.showNotification('Connection test failed', 'error');
        }
    }
    
    // Test Google Drive connection
    async testGoogleDriveConnection() {
        const response = await gapi.client.drive.about.get({
            fields: 'user, storageQuota'
        });
        console.log('Google Drive connection test:', response.result);
    }
    
    // Test Dropbox connection
    async testDropboxConnection() {
        const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Dropbox connection test failed');
        }
        
        const account = await response.json();
        console.log('Dropbox connection test:', account);
    }
    
    // Test OneDrive connection
    async testOneDriveConnection() {
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('OneDrive connection test failed');
        }
        
        const user = await response.json();
        console.log('OneDrive connection test:', user);
    }
    
    // Test Google Cloud Storage connection
    async testGoogleCloudConnection() {
        const bucket = this.providers.googcloud.bucket;
        const response = await fetch(`https://www.googleapis.com/storage/v1/b/${bucket}`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Google Cloud Storage connection test failed');
        }
        
        const bucketInfo = await response.json();
        console.log('Google Cloud Storage connection test:', bucketInfo);
    }
    
    // Backup data to cloud
    async backupToCloud() {
        if (!this.isConnected || !this.accessToken) {
            this.showNotification('Please connect to cloud storage first', 'warning');
            return;
        }
        
        try {
            this.showNotification('Creating cloud backup...', 'info');
            
            // Create backup data
            const backupData = await this.createBackupData();
            
            // Upload to cloud
            const uploadResult = await this.uploadToCloud(backupData);
            
            if (uploadResult.success) {
                // Add to backup history
                this.backupHistory.push({
                    id: Date.now(),
                    provider: this.currentProvider,
                    timestamp: backupData.timestamp,
                    size: JSON.stringify(backupData).length,
                    fileName: uploadResult.fileName,
                    fileId: uploadResult.fileId,
                    downloadUrl: uploadResult.downloadUrl
                });
                
                this.saveCloudSettings();
                this.updateCloudStatus(true, true);
                this.updateCloudBackupHistory();
                
                this.showNotification('Backup successfully uploaded to cloud!', 'success');
                console.log('Cloud backup completed:', uploadResult);
            } else {
                throw new Error(uploadResult.error || 'Upload failed');
            }
            
        } catch (error) {
            console.error('Cloud backup failed:', error);
            this.showNotification(`Cloud backup failed: ${error.message}`, 'error');
        }
    }
    
    // Create backup data
    async createBackupData() {
        try {
            // Get all data from IndexedDB
            const inventory = typeof getAllInventory === 'function' ? await getAllInventory() : [];
            const sales = typeof getAllSales === 'function' ? await getAllSales() : [];
            const expenses = typeof getAllJournals === 'function' ? await getAllJournals() : [];
            const suppliers = typeof getAllSuppliers === 'function' ? await getAllSuppliers() : [];
            const auditLogs = typeof getAllAuditLogs === 'function' ? await getAllAuditLogs() : [];
            
            const backupData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                provider: this.currentProvider,
                data: {
                    inventory,
                    sales,
                    expenses,
                    suppliers,
                    auditLogs
                },
                metadata: {
                    itemCount: inventory.length,
                    salesCount: sales.length,
                    expenseCount: expenses.length,
                    supplierCount: suppliers.length,
                    auditLogCount: auditLogs.length,
                    totalSize: JSON.stringify({ inventory, sales, expenses, suppliers, auditLogs }).length
                }
            };
            
            return backupData;
            
        } catch (error) {
            console.error('Failed to create backup data:', error);
            throw new Error('Failed to gather backup data');
        }
    }
    
    // Upload to cloud storage
    async uploadToCloud(backupData) {
        try {
            const fileName = `pos-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
            const jsonData = JSON.stringify(backupData, null, 2);
            
            switch (this.currentProvider) {
                case 'googledrive':
                    return await this.uploadToGoogleDrive(fileName, jsonData);
                case 'dropbox':
                    return await this.uploadToDropbox(fileName, jsonData);
                case 'onedrive':
                    return await this.uploadToOneDrive(fileName, jsonData);
                case 'googcloud':
                    return await this.uploadToGoogleCloud(fileName, jsonData);
                default:
                    throw new Error('Unsupported cloud provider');
            }
            
        } catch (error) {
            console.error('Upload failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Upload to Google Drive
    async uploadToGoogleDrive(fileName, jsonData) {
        try {
            // Create file metadata
            const metadata = {
                name: fileName,
                parents: ['appDataFolder'] // App-specific folder
            };
            
            // Create form data
            const form = new FormData();
            form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            form.append('file', new Blob([jsonData], { type: 'application/json' }));
            
            // Upload file
            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: form
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Upload failed');
            }
            
            const file = await response.json();
            
            // Make file publicly readable (optional)
            await gapi.client.drive.permissions.create({
                fileId: file.id,
                resource: {
                    role: 'reader',
                    type: 'anyone'
                }
            });
            
            return {
                success: true,
                fileId: file.id,
                fileName: file.name,
                downloadUrl: `https://drive.google.com/uc?id=${file.id}`
            };
            
        } catch (error) {
            console.error('Google Drive upload error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Upload to Dropbox
    async uploadToDropbox(fileName, jsonData) {
        try {
            const path = `/Apps/ZenithLabs POS/${fileName}`;
            
            const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/octet-stream',
                    'Dropbox-API-Arg': JSON.stringify({
                        path: path,
                        mode: 'add',
                        autorename: true
                    })
                },
                body: jsonData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error_summary || 'Upload failed');
            }
            
            const file = await response.json();
            
            // Create shared link
            const shareResponse = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: file.path_lower,
                    settings: {
                        requested_visibility: 'public'
                    }
                })
            });
            
            const shareResult = await shareResponse.json();
            
            return {
                success: true,
                fileId: file.id,
                fileName: file.name,
                downloadUrl: shareResult.url
            };
            
        } catch (error) {
            console.error('Dropbox upload error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Upload to OneDrive
    async uploadToOneDrive(fileName, jsonData) {
        try {
            const path = `/me/drive/special/approot:/${fileName}:/content`;
            
            const response = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: jsonData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Upload failed');
            }
            
            const file = await response.json();
            
            // Create sharing link
            const shareResponse = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${file.id}/createLink`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'view',
                    scope: 'anonymous'
                })
            });
            
            const shareResult = await shareResponse.json();
            
            return {
                success: true,
                fileId: file.id,
                fileName: file.name,
                downloadUrl: shareResult.link.webUrl
            };
            
        } catch (error) {
            console.error('OneDrive upload error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Upload to Google Cloud Storage
    async uploadToGoogleCloud(fileName, jsonData) {
        try {
            const bucket = this.providers.googcloud.bucket;
            const objectName = `pos-backups/${fileName}`;
            
            // First, initiate resumable upload
            const initResponse = await fetch(`https://www.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=resumable&name=${encodeURIComponent(objectName)}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Upload-Content-Type': 'application/json',
                    'X-Upload-Content-Length': jsonData.length.toString()
                }
            });
            
            if (!initResponse.ok) {
                const error = await initResponse.json();
                throw new Error(error.error?.message || 'Upload initiation failed');
            }
            
            const uploadUrl = initResponse.headers.get('Location');
            
            // Upload the actual data
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': jsonData.length.toString()
                },
                body: jsonData
            });
            
            if (!uploadResponse.ok) {
                const error = await uploadResponse.json();
                throw new Error(error.error?.message || 'Upload failed');
            }
            
            const object = await uploadResponse.json();
            
            // Make object publicly readable
            await fetch(`https://www.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(object.name)}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    acl: 'publicRead'
                })
            });
            
            return {
                success: true,
                fileId: object.id,
                fileName: object.name,
                downloadUrl: `https://storage.googleapis.com/${bucket}/${object.name}`
            };
            
        } catch (error) {
            console.error('Google Cloud Storage upload error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Disconnect cloud storage
    disconnectCloudStorage() {
        this.currentProvider = null;
        this.accessToken = null;
        this.isConnected = false;
        
        localStorage.removeItem('cloudProvider');
        localStorage.removeItem('cloudAccessToken');
        
        this.updateCloudStatus(false);
        this.showNotification('Disconnected from cloud storage', 'info');
    }
    
    // Update cloud status UI
    updateCloudStatus(connected = false, hasBackup = false) {
        const statusDiv = document.getElementById('cloud-status');
        const backupBtn = document.getElementById('backup-to-cloud-btn');
        const autoBackupDiv = document.getElementById('auto-backup-protection');
        
        if (!statusDiv) return;
        
        if (connected) {
            const providerName = this.providers[this.currentProvider]?.name || 'Cloud Storage';
            statusDiv.innerHTML = `<span class="badge bg-success">Connected to ${providerName}</span>`;
            
            if (backupBtn) {
                backupBtn.disabled = false;
                backupBtn.classList.remove('btn-secondary');
                backupBtn.classList.add('btn-success');
            }
            
            if (autoBackupDiv) {
                autoBackupDiv.style.display = 'block';
            }
        } else {
            statusDiv.innerHTML = '<span class="badge bg-secondary">Not Connected</span>';
            
            if (backupBtn) {
                backupBtn.disabled = true;
                backupBtn.classList.remove('btn-success');
                backupBtn.classList.add('btn-secondary');
            }
            
            if (autoBackupDiv) {
                autoBackupDiv.style.display = 'none';
            }
        }
    }
    
    // Download backup from cloud
    async downloadBackup(backupId) {
        const backup = this.backupHistory.find(b => b.id == backupId);
        if (!backup) {
            this.showNotification('Backup not found', 'error');
            return;
        }
        
        try {
            this.showNotification('Downloading backup...', 'info');
            
            let downloadUrl;
            let fileName;
            
            switch (backup.provider) {
                case 'googledrive':
                    downloadUrl = `https://www.googleapis.com/drive/v3/files/${backup.fileId}?alt=media`;
                    fileName = backup.fileName;
                    break;
                case 'dropbox':
                    downloadUrl = `https://content.dropboxapi.com/2/files/download`;
                    fileName = backup.fileName;
                    break;
                case 'onedrive':
                    downloadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${backup.fileId}/content`;
                    fileName = backup.fileName;
                    break;
                case 'googcloud':
                    downloadUrl = backup.downloadUrl;
                    fileName = backup.fileName;
                    break;
                default:
                    throw new Error('Unsupported provider for download');
            }
            
            const response = await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Download failed');
            }
            
            const blob = await response.blob();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            this.showNotification('Backup downloaded successfully', 'success');
            
        } catch (error) {
            console.error('Download failed:', error);
            this.showNotification(`Download failed: ${error.message}`, 'error');
        }
    }
    
    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
    
    // Show demo credential helper
    showDemoCredentialHelper(provider) {
        const config = this.providers[provider];
        
        // Create a more helpful modal-like notification
        const helper = document.createElement('div');
        helper.className = 'modal fade show';
        helper.style.cssText = 'display: block; background: rgba(0,0,0,0.5);';
        helper.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title">⚠️ Demo Credentials Detected</h5>
                        <button type="button" class="btn-close" onclick="this.closest('.modal').remove()"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <h6>🔧 Setup Required for ${config.name}</h6>
                            <p>Your cloud storage is using demo credentials. To connect to real ${config.name}, follow these steps:</p>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <h6>📋 Quick Setup Steps:</h6>
                                <ol class="small">
                                    <li>Open <strong>CLOUD_STORAGE_SETUP.md</strong></li>
                                    <li>Follow the ${config.name} setup guide</li>
                                    <li>Get your real API credentials</li>
                                    <li>Update <strong>cloud-storage.js</strong></li>
                                    <li>Refresh this page and try again</li>
                                </ol>
                            </div>
                            <div class="col-md-6">
                                <h6>🚀 Recommended: Google Drive</h6>
                                <p class="small">Google Drive is the easiest to set up and most reliable for POS backups.</p>
                                <div class="d-grid gap-2">
                                    <button class="btn btn-primary btn-sm" onclick="window.open('CLOUD_STORAGE_SETUP.md', '_blank')">
                                        📖 Open Setup Guide
                                    </button>
                                    <button class="btn btn-success btn-sm" onclick="window.open('test-cloud-storage.html', '_blank')">
                                        🧪 Test Configuration
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <h6>💡 Why Setup Real Credentials?</h6>
                            <ul class="small">
                                <li>✅ Actual cloud backup storage</li>
                                <li>✅ Secure data protection</li>
                                <li>✅ Access from any device</li>
                                <li>✅ Automatic backup history</li>
                                <li>✅ Data recovery options</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                            Close
                        </button>
                        <button type="button" class="btn btn-primary" onclick="window.open('CLOUD_STORAGE_SETUP.md', '_blank')">
                            📖 View Setup Guide
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(helper);
        
        // Remove on backdrop click
        helper.addEventListener('click', (e) => {
            if (e.target === helper) {
                helper.remove();
            }
        });
    }
}

// Initialize cloud storage manager
let cloudStorageManager;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    cloudStorageManager = new CloudStorageManager();
    
    // Make cloud storage manager globally accessible
    window.cloudStorageManager = cloudStorageManager;
    
    console.log('☁️ Real Cloud Storage Manager initialized');
});

// Global functions for backward compatibility
window.connectCloudStorage = () => cloudStorageManager.connectCloudStorage();
window.backupToCloud = () => cloudStorageManager.backupToCloud();
