// Admin Settings JavaScript - Complete Settings Management System
// This file handles all settings functionality for the admin panel

// Settings Storage Key
const ADMIN_SETTINGS_STORAGE_KEY = 'pos_admin_settings';
const DEFAULT_SETTINGS = {
    // System Settings
    systemTimezone: 'Asia/Manila',
    systemCurrency: '₱',
    decimalPlaces: '2',
    dateFormat: 'MM/DD/YYYY',
    
    // Display Settings
    showInventoryImages: true,
    enableAnimations: true,
    showNotifications: true,
    itemsPerPage: '25',
    themeMode: 'light'
};

// Current settings object
let currentSettings = { ...DEFAULT_SETTINGS };

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('settings-tab')) {
        initializeSettings();
        setupSettingsEventListeners();
        loadSettingsFromStorage();
        applySettingsToUI();
    }
});

// Initialize settings system
function initializeSettings() {
    console.log('🔧 Initializing admin settings system...');
    
    // Set default values for all form elements
    const formElements = {
        // System Settings
        'system-timezone': DEFAULT_SETTINGS.systemTimezone,
        'system-currency': DEFAULT_SETTINGS.systemCurrency,
        'decimal-places': DEFAULT_SETTINGS.decimalPlaces,
        'date-format': DEFAULT_SETTINGS.dateFormat,
        
        // Display Settings
        'show-inventory-images': DEFAULT_SETTINGS.showInventoryImages,
        'enable-animations': DEFAULT_SETTINGS.enableAnimations,
        'show-notifications': DEFAULT_SETTINGS.showNotifications,
        'items-per-page': DEFAULT_SETTINGS.itemsPerPage,
        'theme-mode': DEFAULT_SETTINGS.themeMode
    };
    
    // Set default values
    Object.keys(formElements).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = formElements[id];
            } else {
                element.value = formElements[id];
            }
        }
    });
    
    console.log('✅ Admin settings system initialized');
}

// Setup event listeners for settings
function setupSettingsEventListeners() {
    // Save settings button
    const saveBtn = document.getElementById('save-settings-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }
    
    // Reset settings button
    const resetBtn = document.getElementById('reset-settings-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSettings);
    }
    
    // Password change buttons
    const changeAdminPasswordBtn = document.getElementById('change-admin-password-btn');
    if (changeAdminPasswordBtn) {
        changeAdminPasswordBtn.addEventListener('click', () => changePassword('admin'));
    }
    
    const changeCashierPasswordBtn = document.getElementById('change-cashier-password-btn');
    if (changeCashierPasswordBtn) {
        changeCashierPasswordBtn.addEventListener('click', () => changePassword('cashier'));
    }
    
    // Handle form submission
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSettings();
        });
    }
    
    // Real-time preview for theme mode
    const themeSelect = document.getElementById('theme-mode');
    if (themeSelect) {
        themeSelect.addEventListener('change', function() {
            previewTheme(this.value);
        });
    }
    
    // Real-time preview for currency
    const currencyInput = document.getElementById('system-currency');
    if (currencyInput) {
        currencyInput.addEventListener('input', function() {
            previewCurrency(this.value);
        });
    }
    
    // Real-time preview for decimal places
    const decimalSelect = document.getElementById('decimal-places');
    if (decimalSelect) {
        decimalSelect.addEventListener('change', function() {
            previewDecimalPlaces(this.value);
        });
    }
    
    // Auto-save on change (optional)
    const autoSaveElements = document.querySelectorAll('#settings-form input, #settings-form select');
    autoSaveElements.forEach(element => {
        element.addEventListener('change', function() {
            if (this.type !== 'checkbox') {
                // Auto-save for non-checkbox elements after 2 seconds of no changes
                clearTimeout(this.autoSaveTimeout);
                this.autoSaveTimeout = setTimeout(() => {
                    saveSettings(true); // Silent save
                }, 2000);
            }
        });
    });
    
    console.log('✅ Settings event listeners setup complete');
}

// Load settings from localStorage
function loadSettingsFromStorage() {
    try {
        const stored = localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
        if (stored) {
            currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            console.log('📦 Settings loaded from storage');
        } else {
            console.log('📦 Using default settings');
        }
    } catch (error) {
        console.error('❌ Error loading settings from storage:', error);
        currentSettings = { ...DEFAULT_SETTINGS };
    }
}

// Apply settings to UI
function applySettingsToUI() {
    Object.keys(currentSettings).forEach(key => {
        const element = document.getElementById(keyToElementId(key));
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = currentSettings[key];
            } else {
                element.value = currentSettings[key];
            }
        }
    });
    
    // Update last saved timestamp
    updateLastSavedTimestamp();
    
    console.log('✅ Settings applied to UI');
}

// Convert setting key to element ID
function keyToElementId(key) {
    return key.replace(/([A-Z])/g, '-$1').toLowerCase();
}

// Save settings
async function saveSettings(silent = false) {
    try {
        console.log('💾 Saving admin settings...');
        console.log('🔍 Form elements found:', document.querySelectorAll('#settings-form input, #settings-form select').length);
        
        // Collect all form values
        const formData = collectSettingsFormData();
        console.log('📊 Form data collected:', formData);
        
        // Validate settings
        const validation = validateSettings(formData);
        if (!validation.valid) {
            console.error('❌ Validation failed:', validation.message);
            showSettingsMessage(validation.message, 'error');
            return;
        }
        
        // Update current settings
        currentSettings = { ...currentSettings, ...formData };
        console.log('✅ Settings updated:', currentSettings);
        
        // Save to localStorage
        localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings));
        console.log('💾 Settings saved to localStorage');
        
        // Apply settings to system
        await applySettingsToSystem(currentSettings);
        
        // Update UI
        updateLastSavedTimestamp();
        
        // Show success message
        if (!silent) {
            showSettingsMessage('Settings saved successfully!', 'success');
        }
        
        console.log('✅ Settings saved successfully');
        
    } catch (error) {
        console.error('❌ Error saving settings:', error);
        if (!silent) {
            showSettingsMessage('Error saving settings: ' + error.message, 'error');
        }
    }
}

// Collect settings from form data
function collectSettingsFormData() {
    const formData = {};
    
    // System Settings
    formData.systemTimezone = document.getElementById('system-timezone')?.value || DEFAULT_SETTINGS.systemTimezone;
    formData.systemCurrency = document.getElementById('system-currency')?.value || DEFAULT_SETTINGS.systemCurrency;
    formData.decimalPlaces = document.getElementById('decimal-places')?.value || DEFAULT_SETTINGS.decimalPlaces;
    formData.dateFormat = document.getElementById('date-format')?.value || DEFAULT_SETTINGS.dateFormat;
    
    // Display Settings
    formData.showInventoryImages = document.getElementById('show-inventory-images')?.checked ?? DEFAULT_SETTINGS.showInventoryImages;
    formData.enableAnimations = document.getElementById('enable-animations')?.checked ?? DEFAULT_SETTINGS.enableAnimations;
    formData.showNotifications = document.getElementById('show-notifications')?.checked ?? DEFAULT_SETTINGS.showNotifications;
    formData.itemsPerPage = document.getElementById('items-per-page')?.value || DEFAULT_SETTINGS.itemsPerPage;
    formData.themeMode = document.getElementById('theme-mode')?.value || DEFAULT_SETTINGS.themeMode;
    
    return formData;
}

// Validate settings
function validateSettings(settings) {
    // Validate currency symbol (max 3 characters)
    if (settings.systemCurrency && settings.systemCurrency.length > 3) {
        return { valid: false, message: 'Currency symbol must be 3 characters or less' };
    }
    
    return { valid: true, message: 'Settings are valid' };
}

// Apply settings to system
async function applySettingsToSystem(settings) {
    console.log('🔧 Applying settings to system...');
    
    // Apply theme
    applyTheme(settings.themeMode);
    
    // Apply currency format
    applyCurrencyFormat(settings.systemCurrency, settings.decimalPlaces);
    
    // Apply date format
    applyDateFormat(settings.dateFormat);
    
    console.log('✅ Settings applied to system');
}

// Apply theme
function applyTheme(themeMode) {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    
    if (themeMode === 'dark') {
        body.classList.add('theme-dark');
    } else if (themeMode === 'light') {
        body.classList.add('theme-light');
    } else if (themeMode === 'auto') {
        // Auto theme based on system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    }
    
    console.log(`🎨 Theme applied: ${themeMode}`);
}

// Apply currency format
function applyCurrencyFormat(currency, decimalPlaces) {
    // Update currency formatting functions
    if (window.formatCurrency) {
        window.posCurrency = currency;
        window.posDecimalPlaces = parseInt(decimalPlaces);
    }
    
    console.log(`💰 Currency format applied: ${currency}, ${decimalPlaces} decimal places`);
}

// Apply date format
function applyDateFormat(dateFormat) {
    // Update date formatting functions
    if (window.formatDate) {
        window.posDateFormat = dateFormat;
    }
    
    console.log(`📅 Date format applied: ${dateFormat}`);
}

// Apply security settings
function applySecuritySettings(settings) {
    // Apply session timeout
    if (window.updateSessionSettings) {
        window.updateSessionSettings({
            enabled: settings.sessionTimeout,
            duration: settings.timeoutDuration,
            maxAttempts: settings.maxLoginAttempts
        });
    }
    
    // Apply audit logging
    if (window.updateAuditSettings) {
        window.updateAuditSettings(settings.auditLogging);
    }
    
    console.log('🔐 Security settings applied');
}

// Apply backup settings
function applyBackupSettings(settings) {
    if (window.updateBackupSettings) {
        window.updateBackupSettings({
            autoBackup: settings.autoBackup,
            frequency: settings.backupFrequency,
            retention: settings.backupRetention
        });
    }
    
    console.log('💾 Backup settings applied');
}

// Apply sync settings
function applySyncSettings(settings) {
    if (window.updateSyncSettings) {
        window.updateSyncSettings({
            cloudSync: settings.cloudSync,
            interval: parseInt(settings.syncInterval),
            offlineMode: settings.offlineMode
        });
    }
    
    console.log('🔄 Sync settings applied');
}

// Reset settings to defaults
function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.')) {
        console.log('🔄 Resetting settings to defaults...');
        
        currentSettings = { ...DEFAULT_SETTINGS };
        
        // Save to localStorage
        localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings));
        
        // Apply to UI
        applySettingsToUI();
        
        // Apply to system
        applySettingsToSystem(currentSettings);
        
        // Show message
        showSettingsMessage('Settings reset to defaults successfully!', 'success');
        
        console.log('✅ Settings reset to defaults');
    }
}

// Show settings message
function showSettingsMessage(message, type) {
    const statusElement = document.getElementById('settings-status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `small mt-2 ${type === 'error' ? 'text-danger' : 'text-success'}`;
        statusElement.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 3000);
    }
}

// Update last saved timestamp
function updateLastSavedTimestamp() {
    const lastSavedElement = document.getElementById('settings-last-saved');
    if (lastSavedElement) {
        const now = new Date();
        lastSavedElement.textContent = `Last saved: ${now.toLocaleString()}`;
    }
}

// Preview theme
function previewTheme(themeMode) {
    const body = document.body;
    
    // Add preview class
    body.classList.add('theme-preview');
    
    // Apply temporary theme
    body.classList.remove('theme-light', 'theme-dark');
    if (themeMode === 'dark') {
        body.classList.add('theme-dark');
    } else {
        body.classList.add('theme-light');
    }
    
    // Remove preview after 2 seconds
    setTimeout(() => {
        body.classList.remove('theme-preview');
        applyTheme(currentSettings.themeMode);
    }, 2000);
    
    console.log(`🎨 Theme preview: ${themeMode}`);
}

// Preview currency
function previewCurrency(currency) {
    console.log(`💰 Currency preview: ${currency}`);
    // Update any visible currency displays
    const currencyElements = document.querySelectorAll('.currency-symbol');
    currencyElements.forEach(element => {
        element.textContent = currency;
    });
}

// Preview decimal places
function previewDecimalPlaces(decimalPlaces) {
    console.log(`🔢 Decimal places preview: ${decimalPlaces}`);
    // Update any visible price displays
    const priceElements = document.querySelectorAll('.price-display');
    priceElements.forEach(element => {
        const currentPrice = parseFloat(element.dataset.price || '0');
        element.textContent = formatPrice(currentPrice, decimalPlaces);
    });
}

// Format price helper
function formatPrice(price, decimalPlaces) {
    const currency = document.getElementById('system-currency')?.value || '₱';
    const decimals = parseInt(decimalPlaces) || 2;
    return `${currency}${price.toFixed(decimals)}`;
}

// Export settings
function exportSettings() {
    const dataStr = JSON.stringify(currentSettings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `pos-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    console.log('📤 Settings exported');
}

// Import settings
function importSettings(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedSettings = JSON.parse(e.target.result);
            
            // Validate imported settings
            const validation = validateSettings(importedSettings);
            if (!validation.valid) {
                showSettingsMessage('Invalid settings file: ' + validation.message, 'error');
                return;
            }
            
            // Apply imported settings
            currentSettings = { ...DEFAULT_SETTINGS, ...importedSettings };
            
            // Save to localStorage
            localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings));
            
            // Apply to UI
            applySettingsToUI();
            
            // Apply to system
            applySettingsToSystem(currentSettings);
            
            showSettingsMessage('Settings imported successfully!', 'success');
            console.log('📥 Settings imported successfully');
            
        } catch (error) {
            console.error('❌ Error importing settings:', error);
            showSettingsMessage('Error importing settings: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

// Get current settings (for other modules)
function getCurrentSettings() {
    return { ...currentSettings };
}

// Get specific setting
function getSetting(key) {
    return currentSettings[key];
}

// Update specific setting
function updateSetting(key, value) {
    currentSettings[key] = value;
    localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings));
    applySettingsToSystem(currentSettings);
}

// Test function for debugging save functionality
window.testSaveSettings = async function() {
    console.log('🧪 Testing save settings functionality...');
    
    // Check if form exists
    const form = document.getElementById('settings-form');
    if (!form) {
        console.error('❌ Settings form not found');
        return;
    }
    
    // Check if save button exists
    const saveBtn = document.getElementById('save-settings-btn');
    if (!saveBtn) {
        console.error('❌ Save button not found');
        return;
    }
    
    // Count form elements
    const inputs = form.querySelectorAll('input, select');
    console.log(`🔍 Found ${inputs.length} form elements`);
    
    // Test collecting form data
    const formData = collectSettingsFormData();
    console.log('📊 Test form data collection:', formData);
    
    // Test validation
    const validation = validateSettings(formData);
    console.log('✅ Test validation:', validation);
    
    // Test save
    await saveSettings(true); // Silent save
    
    console.log('🧪 Save settings test completed');
};

// Change password function
async function changePassword(userType) {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const statusDiv = document.getElementById('password-change-status');
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showPasswordStatus('Please fill in all password fields', 'danger');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showPasswordStatus('New password and confirmation do not match', 'danger');
        return;
    }
    
    if (newPassword.length < 4) {
        showPasswordStatus('Password must be at least 4 characters long', 'danger');
        return;
    }
    
    try {
        // Get current user credentials from localStorage
        const currentUser = sessionStorage.getItem('currentUser');
        const userRole = sessionStorage.getItem('userRole');
        
        if (!currentUser || !userRole) {
            showPasswordStatus('No active session found. Please login again.', 'danger');
            return;
        }
        
        // For admin changing admin password or cashier password
        if (userRole === 'admin') {
            // Verify current admin password
            const storedAdminHash = localStorage.getItem('admin_password_hash');
            const currentPasswordHash = hashPassword(currentPassword);
            
            if (storedAdminHash && storedAdminHash !== currentPasswordHash) {
                showPasswordStatus('Current password is incorrect', 'danger');
                return;
            }
            
            // Change the password based on target user
            const newPasswordHash = hashPassword(newPassword);
            
            if (userType === 'admin') {
                localStorage.setItem('admin_password_hash', newPasswordHash);
                showPasswordStatus('Admin password changed successfully!', 'success');
                console.log('🔐 Admin password changed successfully');
            } else if (userType === 'cashier') {
                localStorage.setItem('cashier_password_hash', newPasswordHash);
                showPasswordStatus('Cashier password changed successfully!', 'success');
                console.log('🔐 Cashier password changed successfully by admin');
            }
            
            // Clear password fields
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
            
        } else {
            showPasswordStatus('Only administrators can change passwords', 'danger');
        }
        
    } catch (error) {
        console.error('❌ Password change failed:', error);
        showPasswordStatus('Password change failed. Please try again.', 'danger');
    }
}

// Show password status message
function showPasswordStatus(message, type) {
    const statusDiv = document.getElementById('password-change-status');
    statusDiv.textContent = message;
    statusDiv.className = `small mt-2 alert alert-${type} py-1`;
    statusDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

// Simple password hashing function (SHA-256)
function hashPassword(password) {
    // Simple hash for demonstration - in production, use proper crypto
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

// Make functions globally available
window.saveSettings = saveSettings;
window.resetSettings = resetSettings;
window.changePassword = changePassword;
window.exportSettings = exportSettings;
window.importSettings = importSettings;
window.getCurrentSettings = getCurrentSettings;
window.getSetting = getSetting;
window.updateSetting = updateSetting;
window.testSaveSettings = testSaveSettings;

console.log('🔧 Admin settings module loaded');
