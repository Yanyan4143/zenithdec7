// license-manager.js - Advanced License & Authentication System
// Prevents unauthorized use and enforces licensing terms

// =============================================================================
// DEVELOPMENT MODE - TEMPORARY TRIAL LICENSE
// =============================================================================

// Generate development trial license for testing
function generateDevelopmentLicense() {
    const trialLicense = {
        key: 'DEV-TRIAL-2025-ZENITHLABS-POS',
        type: 'TRIAL',
        issued: new Date().toISOString(),
        expires: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString(), // 30 days
        hardwareId: 'development-mode',
        features: ['basic_pos', 'full_inventory', 'basic_reports', 'cloud_sync', 'admin_panel'],
        maxUsers: 5,
        maxDevices: 3,
        domain: window.location.hostname,
        signature: 'dev-signature'
    };
    
    localStorage.setItem('zenith_license_key', trialLicense.key);
    localStorage.setItem('zenith_license_data', JSON.stringify(trialLicense));
    
    console.log('🔓 Development trial license generated');
    return trialLicense;
}

// Auto-generate development license if none exists
if (!localStorage.getItem('zenith_license_key')) {
    generateDevelopmentLicense();
}

// =============================================================================
// BYPASS SECURITY FOR DEVELOPMENT - TEMPORARY
// =============================================================================

// Override license validation to always succeed for development
function bypassSecurityForDevelopment() {
    console.log('🔓 Security bypassed for development mode');
    
    // Override all security checks
    localStorage.setItem('zenith_license_valid', 'true');
    localStorage.setItem('zenith_license_expiry', new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString());
    
    // Override license validation functions
    window.LicenseManager = {
        initialize: async () => {
            console.log('✅ License Manager bypassed - development mode');
            return true;
        },
        validateLicense: async () => true,
        currentLicense: {
            key: 'DEV-BYPASS-2025',
            type: 'DEVELOPMENT',
            features: ['all'],
            expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
    };
    
    // Override anti-cloning validation
    window.LicenseValidator = {
        validate: async () => {
            console.log('✅ Anti-cloning bypassed - development mode');
            return true;
        }
    };
    
    // Override code obfuscator
    window.ObfuscationSystem = {
        initialize: async () => {
            console.log('✅ Code obfuscation bypassed - development mode');
            return true;
        }
    };
}

// Apply bypass immediately
bypassSecurityForDevelopment();

// =============================================================================
// LICENSE CONFIGURATION
// =============================================================================

const LICENSE_CONFIG = {
    // License Server
    LICENSE_SERVER: 'https://license.zenithlabs-pos.com',
    FALLBACK_LICENSE_SERVER: 'https://backup-license.zenithlabs-pos.com',
    
    // License Types
    LICENSE_TYPES: {
        TRIAL: {
            name: 'Trial',
            duration: 30 * 24 * 60 * 60 * 1000, // 30 days
            features: ['basic_pos', 'limited_inventory', 'basic_reports'],
            maxUsers: 1,
            maxDevices: 1
        },
        BASIC: {
            name: 'Basic',
            duration: 365 * 24 * 60 * 60 * 1000, // 1 year
            features: ['basic_pos', 'full_inventory', 'basic_reports', 'cloud_sync'],
            maxUsers: 3,
            maxDevices: 2
        },
        PROFESSIONAL: {
            name: 'Professional',
            duration: 365 * 24 * 60 * 60 * 1000, // 1 year
            features: ['basic_pos', 'full_inventory', 'advanced_reports', 'cloud_sync', 'analytics', 'employee_management'],
            maxUsers: 10,
            maxDevices: 5
        },
        ENTERPRISE: {
            name: 'Enterprise',
            duration: 365 * 24 * 60 * 60 * 1000, // 1 year
            features: ['basic_pos', 'full_inventory', 'advanced_reports', 'cloud_sync', 'analytics', 'employee_management', 'api_access', 'custom_branding'],
            maxUsers: 999,
            maxDevices: 999
        }
    },
    
    // Validation Settings
    VALIDATION_INTERVAL: 60 * 60 * 1000, // 1 hour
    OFFLINE_GRACE_PERIOD: 7 * 24 * 60 * 60 * 1000, // 7 days
    MAX_FAILED_ATTEMPTS: 3,
    
    // Security
    ENCRYPTION_ALGORITHM: 'AES-GCM',
    HASH_ALGORITHM: 'SHA-256',
    TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
};

// =============================================================================
// LICENSE CRYPTOGRAPHY
// =============================================================================

class LicenseCrypto {
    static async generateLicenseKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    static async encryptLicenseData(data, key) {
        const encoder = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const keyBuffer = await crypto.subtle.importKey(
            'raw',
            encoder.encode(key),
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            keyBuffer,
            encoder.encode(JSON.stringify(data))
        );
        
        return {
            encrypted: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv)
        };
    }
    
    static async decryptLicenseData(encryptedData, key, iv) {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const keyBuffer = await crypto.subtle.importKey(
            'raw',
            encoder.encode(key),
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(iv) },
            keyBuffer,
            new Uint8Array(encryptedData)
        );
        
        return JSON.parse(decoder.decode(decrypted));
    }
    
    static async hashLicenseData(data) {
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(data)));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    static generateLicenseSignature(licenseData, privateKey) {
        // In a real implementation, this would use RSA or ECDSA
        // For demo purposes, we'll use a simpler approach
        const data = JSON.stringify(licenseData);
        const signature = btoa(data + privateKey).substring(0, 64);
        return signature;
    }
    
    static verifyLicenseSignature(licenseData, signature, publicKey) {
        // In a real implementation, this would verify the cryptographic signature
        // For demo purposes, we'll use a simpler validation
        const expectedSignature = this.generateLicenseSignature(licenseData, publicKey);
        return signature === expectedSignature;
    }
}

// =============================================================================
// LICENSE MANAGER
// =============================================================================

class LicenseManager {
    static currentLicense = null;
    static validationTimer = null;
    static offlineMode = false;
    static lastValidation = null;
    
    static async initialize() {
        console.log('🔐 Initializing License Manager...');
        
        try {
            // Load existing license
            await this.loadLicense();
            
            // Validate license
            const isValid = await this.validateLicense();
            
            if (!isValid) {
                throw new Error('Invalid or expired license');
            }
            
            // Start periodic validation
            this.startPeriodicValidation();
            
            // Setup offline detection
            this.setupOfflineDetection();
            
            console.log('✅ License Manager Active');
            return true;
            
        } catch (error) {
            console.error('❌ License Manager failed:', error);
            this.handleLicenseFailure();
            return false;
        }
    }
    
    static async loadLicense() {
        const licenseKey = localStorage.getItem('zenith_license_key');
        if (!licenseKey) {
            throw new Error('No license key found');
        }
        
        // Check for development license first
        if (licenseKey === 'DEV-TRIAL-2025-ZENITHLABS-POS') {
            const licenseData = JSON.parse(localStorage.getItem('zenith_license_data') || '{}');
            this.currentLicense = licenseData;
            console.log('📋 Development license loaded:', licenseData.type);
            return;
        }
        
        const encryptedLicense = localStorage.getItem('zenith_license_encrypted');
        const licenseIv = JSON.parse(localStorage.getItem('zenith_license_iv') || '[]');
        
        if (!encryptedLicense || !licenseIv.length) {
            throw new Error('Corrupted license data');
        }
        
        try {
            // Decrypt license
            const licenseData = await LicenseCrypto.decryptLicenseData(
                JSON.parse(encryptedLicense),
                licenseKey,
                licenseIv
            );
            
            this.currentLicense = licenseData;
            console.log('📋 License loaded:', licenseData.type);
            
        } catch (error) {
            throw new Error('Failed to decrypt license: ' + error.message);
        }
    }
    
    static async validateLicense() {
        if (!this.currentLicense) {
            return false;
        }
        
        // Development license auto-validation
        if (this.currentLicense.key === 'DEV-TRIAL-2025-ZENITHLABS-POS') {
            console.log('🔓 Development license validated (auto-approved)');
            return true;
        }
        
        const now = Date.now();
        
        // Check expiry (handle both expires and expiresAt fields)
        const expiresAt = this.currentLicense.expiresAt || this.currentLicense.expires;
        if (expiresAt && now > new Date(expiresAt).getTime()) {
            console.error('❌ License expired');
            return false;
        }
        
        // Check domain binding
        if (this.currentLicense.domain && this.currentLicense.domain !== window.location.hostname) {
            console.error('❌ License domain mismatch');
            return false;
        }
        
        // Check hardware binding
        if (this.currentLicense.hardwareId && this.currentLicense.hardwareId !== 'development-mode') {
            const currentHardwareId = localStorage.getItem('zenith_hardware_id');
            if (currentHardwareId !== this.currentLicense.hardwareId) {
                console.error('❌ License hardware mismatch');
                return false;
            }
        }
        
        // Online validation (if not in offline mode)
        if (!this.offlineMode) {
            const onlineValid = await this.validateOnline();
            if (!onlineValid) {
                console.warn('⚠️ Online validation failed, checking offline grace period');
                return this.checkOfflineGracePeriod();
            }
        }
        
        this.lastValidation = now;
        return true;
    }
    
    static async validateOnline() {
        try {
            const response = await fetch(`${LICENSE_CONFIG.LICENSE_SERVER}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-License-Key': localStorage.getItem('zenith_license_key')
                },
                body: JSON.stringify({
                    licenseId: this.currentLicense.id,
                    domain: window.location.hostname,
                    hardwareId: localStorage.getItem('zenith_hardware_id'),
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.valid) {
                // Update license with server data
                this.currentLicense = { ...this.currentLicense, ...result.license };
                await this.saveLicense();
                return true;
            } else {
                console.error('❌ Server validation failed:', result.reason);
                return false;
            }
            
        } catch (error) {
            console.warn('⚠️ Online validation error:', error);
            return false;
        }
    }
    
    static checkOfflineGracePeriod() {
        if (!this.lastValidation) {
            return false;
        }
        
        const gracePeriod = LICENSE_CONFIG.OFFLINE_GRACE_PERIOD;
        const timeSinceValidation = Date.now() - this.lastValidation;
        
        if (timeSinceValidation > gracePeriod) {
            console.error('❌ Offline grace period exceeded');
            return false;
        }
        
        console.log(`⏰ Offline grace period: ${Math.floor((gracePeriod - timeSinceValidation) / (24 * 60 * 60 * 1000))} days remaining`);
        return true;
    }
    
    static async saveLicense() {
        if (!this.currentLicense) return;
        
        const licenseKey = localStorage.getItem('zenith_license_key');
        if (!licenseKey) return;
        
        try {
            const encrypted = await LicenseCrypto.encryptLicenseData(
                this.currentLicense,
                licenseKey
            );
            
            localStorage.setItem('zenith_license_encrypted', JSON.stringify(encrypted.encrypted));
            localStorage.setItem('zenith_license_iv', JSON.stringify(encrypted.iv));
            
        } catch (error) {
            console.error('❌ Failed to save license:', error);
        }
    }
    
    static startPeriodicValidation() {
        if (this.validationTimer) {
            clearInterval(this.validationTimer);
        }
        
        this.validationTimer = setInterval(async () => {
            const isValid = await this.validateLicense();
            if (!isValid) {
                this.handleLicenseFailure();
            }
        }, LICENSE_CONFIG.VALIDATION_INTERVAL);
    }
    
    static setupOfflineDetection() {
        window.addEventListener('online', () => {
            console.log('🌐 Network connection restored');
            this.offlineMode = false;
            this.validateLicense(); // Immediate validation when back online
        });
        
        window.addEventListener('offline', () => {
            console.log('📱 Network connection lost - entering offline mode');
            this.offlineMode = true;
        });
        
        // Check initial online status
        this.offlineMode = !navigator.onLine;
    }
    
    static handleLicenseFailure() {
        console.error('🚨 License validation failed - system lockdown');
        
        // Clear license data
        localStorage.removeItem('zenith_license_key');
        localStorage.removeItem('zenith_license_encrypted');
        localStorage.removeItem('zenith_license_iv');
        
        // Lock down system
        this.lockdownSystem();
    }
    
    static lockdownSystem() {
        // Stop all operations
        if (this.validationTimer) {
            clearInterval(this.validationTimer);
        }
        
        // Show license error
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a1a; color: white; font-family: Arial, sans-serif;">
                <div style="text-align: center; max-width: 500px; padding: 20px;">
                    <h1 style="color: #ff4444; margin-bottom: 20px;">🔐 LICENSE REQUIRED</h1>
                    <p style="margin-bottom: 20px;">This ZenithLabs POS system requires a valid license to operate.</p>
                    <div style="background: #333; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>License Status: INVALID</h3>
                        <p>Please contact support to obtain a valid license.</p>
                    </div>
                    <div style="font-size: 12px; opacity: 0.7;">
                        <p>Domain: ${window.location.hostname}</p>
                        <p>Hardware ID: ${localStorage.getItem('zenith_hardware_id') || 'Unknown'}</p>
                        <p>Timestamp: ${new Date().toISOString()}</p>
                    </div>
                    <button onclick="location.reload()" style="background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 20px;">
                        Retry
                    </button>
                </div>
            </div>
        `;
        
        // Prevent further interaction
        window.stop();
    }
    
    static async activateLicense(licenseKey) {
        try {
            console.log('🔑 Activating license...');
            
            // Validate license key with server
            const licenseData = await this.fetchLicenseData(licenseKey);
            
            if (!licenseData) {
                throw new Error('Invalid license key');
            }
            
            // Bind to current domain and hardware
            licenseData.domain = window.location.hostname;
            licenseData.hardwareId = localStorage.getItem('zenith_hardware_id');
            licenseData.activatedAt = Date.now();
            
            // Calculate expiry
            const licenseType = LICENSE_CONFIG.LICENSE_TYPES[licenseData.type];
            if (licenseType && licenseType.duration) {
                licenseData.expiresAt = Date.now() + licenseType.duration;
            }
            
            // Save license
            this.currentLicense = licenseData;
            localStorage.setItem('zenith_license_key', licenseKey);
            await this.saveLicense();
            
            console.log('✅ License activated successfully');
            return true;
            
        } catch (error) {
            console.error('❌ License activation failed:', error);
            return false;
        }
    }
    
    static async fetchLicenseData(licenseKey) {
        try {
            const response = await fetch(`${LICENSE_CONFIG.LICENSE_SERVER}/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    licenseKey: licenseKey,
                    domain: window.location.hostname,
                    hardwareId: localStorage.getItem('zenith_hardware_id')
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            return result.license || null;
            
        } catch (error) {
            console.warn('⚠️ Failed to fetch license data:', error);
            return null;
        }
    }
    
    static hasFeature(feature) {
        if (!this.currentLicense) return false;
        
        const licenseType = LICENSE_CONFIG.LICENSE_TYPES[this.currentLicense.type];
        return licenseType && licenseType.features.includes(feature);
    }
    
    static getLicenseInfo() {
        if (!this.currentLicense) return null;
        
        const licenseType = LICENSE_CONFIG.LICENSE_TYPES[this.currentLicense.type];
        
        return {
            type: this.currentLicense.type,
            name: licenseType ? licenseType.name : 'Unknown',
            features: licenseType ? licenseType.features : [],
            expiresAt: this.currentLicense.expiresAt,
            domain: this.currentLicense.domain,
            hardwareId: this.currentLicense.hardwareId,
            isValid: this.currentLicense.expiresAt ? Date.now() < this.currentLicense.expiresAt : false,
            daysRemaining: this.currentLicense.expiresAt ? 
                Math.ceil((this.currentLicense.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)) : 
                'Unlimited'
        };
    }
}

// =============================================================================
// LICENSE UI COMPONENTS
// =============================================================================

class LicenseUI {
    static showLicenseDialog() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center;
            z-index: 999999;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
                <h2 style="margin-bottom: 20px; color: #333;">🔐 License Activation</h2>
                <p style="margin-bottom: 20px; color: #666;">Enter your license key to activate ZenithLabs POS:</p>
                <input type="text" id="license-key-input" placeholder="Enter license key..." 
                    style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 20px; font-family: monospace;">
                <div style="display: flex; gap: 10px;">
                    <button onclick="LicenseUI.activateLicenseFromInput()" 
                        style="flex: 1; background: #4CAF50; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;">
                        Activate
                    </button>
                    <button onclick="LicenseUI.closeLicenseDialog()" 
                        style="flex: 1; background: #f44336; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;">
                        Cancel
                    </button>
                </div>
                <div id="license-status" style="margin-top: 15px; padding: 10px; border-radius: 5px; display: none;"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus input
        document.getElementById('license-key-input').focus();
        
        // Handle Enter key
        document.getElementById('license-key-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.activateLicenseFromInput();
            }
        });
    }
    
    static async activateLicenseFromInput() {
        const input = document.getElementById('license-key-input');
        const status = document.getElementById('license-status');
        const licenseKey = input.value.trim();
        
        if (!licenseKey) {
            this.showStatus('Please enter a license key', 'error');
            return;
        }
        
        status.style.display = 'block';
        status.style.background = '#ffc107';
        status.style.color = '#333';
        status.textContent = 'Activating license...';
        
        try {
            const success = await LicenseManager.activateLicense(licenseKey);
            
            if (success) {
                this.showStatus('License activated successfully! Reloading...', 'success');
                setTimeout(() => location.reload(), 2000);
            } else {
                this.showStatus('Invalid license key. Please check and try again.', 'error');
            }
            
        } catch (error) {
            this.showStatus('Activation failed: ' + error.message, 'error');
        }
    }
    
    static showStatus(message, type) {
        const status = document.getElementById('license-status');
        status.style.display = 'block';
        status.textContent = message;
        
        if (type === 'success') {
            status.style.background = '#4CAF50';
            status.style.color = 'white';
        } else if (type === 'error') {
            status.style.background = '#f44336';
            status.style.color = 'white';
        } else {
            status.style.background = '#ffc107';
            status.style.color = '#333';
        }
    }
    
    static closeLicenseDialog() {
        const modal = document.querySelector('div[style*="position: fixed"]');
        if (modal) {
            modal.remove();
        }
    }
    
    static showLicenseInfo() {
        const licenseInfo = LicenseManager.getLicenseInfo();
        
        if (!licenseInfo) {
            this.showLicenseDialog();
            return;
        }
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center;
            z-index: 999999;
        `;
        
        const features = licenseInfo.features.map(f => `<li>${f}</li>`).join('');
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
                <h2 style="margin-bottom: 20px; color: #333;">📋 License Information</h2>
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                    <p><strong>Type:</strong> ${licenseInfo.name}</p>
                    <p><strong>Status:</strong> <span style="color: ${licenseInfo.isValid ? '#4CAF50' : '#f44336'}">${licenseInfo.isValid ? 'Valid' : 'Expired'}</span></p>
                    <p><strong>Days Remaining:</strong> ${licenseInfo.daysRemaining}</p>
                    <p><strong>Domain:</strong> ${licenseInfo.domain}</p>
                </div>
                <h3>Features:</h3>
                <ul style="margin-bottom: 20px;">${features}</ul>
                <button onclick="LicenseUI.closeLicenseDialog()" 
                    style="width: 100%; background: #2196F3; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;">
                    Close
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// =============================================================================
// GLOBAL FUNCTIONS
// =============================================================================

window.showLicenseDialog = () => LicenseUI.showLicenseDialog();
window.showLicenseInfo = () => LicenseUI.showLicenseInfo();
window.checkLicense = () => LicenseManager.getLicenseInfo();
window.hasLicenseFeature = (feature) => LicenseManager.hasFeature(feature);

// Initialize license manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    LicenseManager.initialize();
});

// Export for global access
window.LicenseManager = LicenseManager;
window.LicenseUI = LicenseUI;

console.log('🔐 License Manager System Loaded');
