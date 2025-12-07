// Cashier Settings JavaScript - Settings Integration for Cashier Panel
// This file handles settings functionality specific to the cashier panel

// Shared settings storage key (same as admin)
const SETTINGS_STORAGE_KEY = 'pos_admin_settings';

// Cashier-specific settings defaults
const CASHIER_DEFAULTS = {
    // Display preferences
    cartAnimations: true,
    soundEffects: true,
    quickAddButtons: true,
    showProductImages: true,
    compactView: false,
    
    // Operational settings
    autoPrintReceipt: false,
    requireCustomerInfo: false,
    allowPartialPayments: true,
    showTaxBreakdown: true
};

// Current cashier settings
let cashierSettings = { ...CASHIER_DEFAULTS };

// Initialize cashier settings when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the cashier page
    if (window.location.pathname.includes('cashier.html') || document.getElementById('cart-items')) {
        initializeCashierSettings();
        loadSharedSettings();
        applyCashierSettings();
    }
});

// Initialize cashier settings system
function initializeCashierSettings() {
    console.log('🛒 Initializing cashier settings system...');
    
    // Setup password change modal
    setupCashierPasswordChange();
    
    // Load cashier-specific settings from localStorage
    try {
        const stored = localStorage.getItem('pos_cashier_settings');
        if (stored) {
            cashierSettings = { ...CASHIER_DEFAULTS, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('❌ Error loading cashier settings:', error);
    }
    
    // Setup event listeners for cashier-specific settings forms
    setupCashierSettingsEventListeners();
    
    console.log('✅ Cashier settings system initialized');
}

// Setup cashier settings event listeners
function setupCashierSettingsEventListeners() {
    // Loyalty settings form
    const loyaltyForm = document.getElementById('loyalty-settings-form');
    if (loyaltyForm) {
        loyaltyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveLoyaltySettings();
        });
    }
    
    // Receipt settings form
    const receiptForm = document.getElementById('receipt-settings-form');
    if (receiptForm) {
        receiptForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveReceiptSettings();
        });
    }
    
    console.log('✅ Cashier settings event listeners setup complete');
}

// Save loyalty settings
function saveLoyaltySettings() {
    try {
        console.log('💾 Saving loyalty settings...');
        
        // Collect loyalty settings data
        const loyaltyData = collectLoyaltySettingsData();
        
        // Save to localStorage
        localStorage.setItem('pos_loyalty_settings', JSON.stringify(loyaltyData));
        
        // Apply settings
        applyLoyaltySettings(loyaltyData);
        
        // Show success message
        showCashierSettingsMessage('Loyalty settings saved successfully!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('loyaltySettingsModal'));
        if (modal) {
            modal.hide();
        }
        
        console.log('✅ Loyalty settings saved successfully');
        
    } catch (error) {
        console.error('❌ Error saving loyalty settings:', error);
        showCashierSettingsMessage('Error saving loyalty settings: ' + error.message, 'error');
    }
}

// Save receipt settings
function saveReceiptSettings() {
    try {
        console.log('💾 Saving receipt settings...');
        
        // Collect receipt settings data
        const receiptData = collectReceiptSettingsData();
        
        // Save to localStorage
        localStorage.setItem('pos_receipt_settings', JSON.stringify(receiptData));
        
        // Apply settings
        applyReceiptSettings(receiptData);
        
        // Show success message
        showCashierSettingsMessage('Receipt settings saved successfully!', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('receiptSettingsModal'));
        if (modal) {
            modal.hide();
        }
        
        console.log('✅ Receipt settings saved successfully');
        
    } catch (error) {
        console.error('❌ Error saving receipt settings:', error);
        showCashierSettingsMessage('Error saving receipt settings: ' + error.message, 'error');
    }
}

// Collect loyalty settings data
function collectLoyaltySettingsData() {
    const formData = {};
    
    // Collect tier data from the form
    const tierElements = document.querySelectorAll('[id^="tier-"]');
    tierElements.forEach(element => {
        const key = element.id.replace('tier-', '');
        formData[key] = element.type === 'checkbox' ? element.checked : element.value;
    });
    
    return formData;
}

// Collect receipt settings data
function collectReceiptSettingsData() {
    const formData = {};
    
    // Collect receipt form data
    const receiptElements = document.querySelectorAll('[id^="receipt-"]');
    receiptElements.forEach(element => {
        const key = element.id.replace('receipt-', '');
        formData[key] = element.type === 'checkbox' ? element.checked : element.value;
    });
    
    return formData;
}

// Apply loyalty settings
function applyLoyaltySettings(settings) {
    // Update loyalty system with new settings
    if (window.updateLoyaltySettings) {
        window.updateLoyaltySettings(settings);
    }
    
    console.log('👥 Loyalty settings applied');
}

// Apply receipt settings
function applyReceiptSettings(settings) {
    // Update receipt system with new settings
    if (window.updateReceiptSettings) {
        window.updateReceiptSettings(settings);
    }
    
    console.log('🧾 Receipt settings applied');
}

// Show cashier settings message
function showCashierSettingsMessage(message, type) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add to container or create one
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(container);
    }
    
    container.appendChild(toast);
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove after hiding
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Load shared settings from admin panel
function loadSharedSettings() {
    try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
            const sharedSettings = JSON.parse(stored);
            
            // Apply shared settings that affect cashier
            applySharedSettingsToCashier(sharedSettings);
            
            console.log('📦 Shared settings loaded for cashier');
        }
    } catch (error) {
        console.error('❌ Error loading shared settings:', error);
    }
}

// Apply shared settings to cashier interface
function applySharedSettingsToCashier(settings) {
    // Apply theme
    if (settings.themeMode) {
        applyThemeToCashier(settings.themeMode);
    }
    
    // Apply currency format
    if (settings.systemCurrency && settings.decimalPlaces) {
        applyCurrencyFormatToCashier(settings.systemCurrency, settings.decimalPlaces);
    }
    
    // Apply date format
    if (settings.dateFormat) {
        applyDateFormatToCashier(settings.dateFormat);
    }
    
    // Apply animation settings
    if (settings.enableAnimations !== undefined) {
        updateCashierAnimations(settings.enableAnimations);
    }
    
    // Apply notification settings
    if (settings.showNotifications !== undefined) {
        updateCashierNotifications(settings.showNotifications);
    }
}

// Apply theme to cashier interface
function applyThemeToCashier(themeMode) {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
    
    if (themeMode === 'dark') {
        body.classList.add('theme-dark');
    } else if (themeMode === 'light') {
        body.classList.add('theme-light');
    } else if (themeMode === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    }
    
    console.log(`🛒 Cashier theme applied: ${themeMode}`);
}

// Apply currency format to cashier
function applyCurrencyFormatToCashier(currency, decimalPlaces) {
    window.posCurrency = currency;
    window.posDecimalPlaces = parseInt(decimalPlaces);
    
    // Update all currency displays
    updateCurrencyDisplays();
    
    console.log(`🛒 Cashier currency format: ${currency}, ${decimalPlaces} decimals`);
}

// Apply date format to cashier
function applyDateFormatToCashier(dateFormat) {
    window.posDateFormat = dateFormat;
    
    // Update all date displays
    updateDateDisplays();
    
    console.log(`🛒 Cashier date format: ${dateFormat}`);
}

// Update currency displays
function updateCurrencyDisplays() {
    const currency = window.posCurrency || '₱';
    const decimals = window.posDecimalPlaces || 2;
    
    // Update price displays
    const priceElements = document.querySelectorAll('.price, .amount, .total');
    priceElements.forEach(element => {
        const currentPrice = parseFloat(element.dataset.price || element.textContent.replace(/[^0-9.-]/g, '') || '0');
        if (!isNaN(currentPrice)) {
            element.textContent = `${currency}${currentPrice.toFixed(decimals)}`;
        }
    });
    
    // Update currency symbols
    const currencySymbols = document.querySelectorAll('.currency-symbol');
    currencySymbols.forEach(element => {
        element.textContent = currency;
    });
}

// Update date displays
function updateDateDisplays() {
    const dateFormat = window.posDateFormat || 'MM/DD/YYYY';
    
    // Update date displays
    const dateElements = document.querySelectorAll('.date-display');
    dateElements.forEach(element => {
        const currentDate = element.dataset.date || new Date().toISOString().split('T')[0];
        element.textContent = formatDate(currentDate, dateFormat);
    });
}

// Format date helper
function formatDate(dateString, format) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    switch (format) {
        case 'DD/MM/YYYY':
            return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        default: // MM/DD/YYYY
            return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
    }
}

// Update cashier animations
function updateCashierAnimations(enabled) {
    const body = document.body;
    
    if (enabled) {
        body.classList.add('animations-enabled');
        body.classList.remove('animations-disabled');
    } else {
        body.classList.add('animations-disabled');
        body.classList.remove('animations-enabled');
    }
    
    // Update animation settings
    window.cartAnimations = enabled;
    
    console.log(`🎬 Cart animations ${enabled ? 'enabled' : 'disabled'}`);
}

// Update cashier notifications
function updateCashierNotifications(enabled) {
    window.showNotifications = enabled;
    
    if (!enabled) {
        // Hide any current notifications
        const notifications = document.querySelectorAll('.notification, .alert, .toast');
        notifications.forEach(notification => {
            notification.style.display = 'none';
        });
    }
    
    console.log(`🔔 Notifications ${enabled ? 'enabled' : 'disabled'}`);
}

// Apply cashier-specific settings
function applyCashierSettings() {
    // Apply cart animations
    if (cashierSettings.cartAnimations) {
        document.body.classList.add('cart-animations-enabled');
    }
    
    // Apply sound effects
    if (cashierSettings.soundEffects) {
        enableSoundEffects();
    }
    
    // Apply quick add buttons
    if (cashierSettings.quickAddButtons) {
        showQuickAddButtons();
    }
    
    // Apply product images
    if (!cashierSettings.showProductImages) {
        hideProductImages();
    }
    
    // Apply compact view
    if (cashierSettings.compactView) {
        document.body.classList.add('compact-view');
    }
    
    // Apply operational settings
    applyOperationalSettings();
    
    console.log('✅ Cashier-specific settings applied');
}

// Enable sound effects
function enableSoundEffects() {
    // Add sound effect listeners
    const cartAddBtn = document.getElementById('add-to-cart-btn');
    if (cartAddBtn) {
        cartAddBtn.addEventListener('click', playAddToCartSound);
    }
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', playCheckoutSound);
    }
    
    console.log('🔊 Sound effects enabled');
}

// Play add to cart sound
function playAddToCartSound() {
    if (window.Audio && window.AudioContext) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
}

// Play checkout sound
function playCheckoutSound() {
    if (window.Audio && window.AudioContext) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
}

// Show quick add buttons
function showQuickAddButtons() {
    const cartSection = document.getElementById('cart-section');
    if (cartSection && !document.getElementById('quick-add-buttons')) {
        const quickAddContainer = document.createElement('div');
        quickAddContainer.id = 'quick-add-buttons';
        quickAddContainer.className = 'quick-add-container mb-3';
        quickAddContainer.innerHTML = `
            <div class="row g-2">
                <div class="col-4">
                    <button class="btn btn-outline-primary btn-sm quick-add-btn" data-amount="100">+₱100</button>
                </div>
                <div class="col-4">
                    <button class="btn btn-outline-primary btn-sm quick-add-btn" data-amount="500">+₱500</button>
                </div>
                <div class="col-4">
                    <button class="btn btn-outline-primary btn-sm quick-add-btn" data-amount="1000">+₱1000</button>
                </div>
            </div>
        `;
        
        cartSection.insertBefore(quickAddContainer, cartSection.firstChild);
        
        // Add event listeners
        quickAddContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('quick-add-btn')) {
                const amount = parseFloat(e.target.dataset.amount);
                addToCartAmount(amount);
            }
        });
        
        console.log('⚡ Quick add buttons shown');
    }
}

// Add amount to cart
function addToCartAmount(amount) {
    // This would integrate with your existing cart functionality
    if (window.addToCart) {
        // Add a generic item with the specified amount
        window.addToCart({
            name: 'Quick Add',
            price: amount,
            quantity: 1
        });
    }
    
    // Play sound if enabled
    if (cashierSettings.soundEffects) {
        playAddToCartSound();
    }
}

// Hide product images
function hideProductImages() {
    const productImages = document.querySelectorAll('.product-image, .item-image');
    productImages.forEach(image => {
        image.style.display = 'none';
    });
    
    console.log('🖼️ Product images hidden');
}

// Apply operational settings
function applyOperationalSettings() {
    // Auto print receipt
    if (cashierSettings.autoPrintReceipt) {
        enableAutoPrintReceipt();
    }
    
    // Require customer info
    if (cashierSettings.requireCustomerInfo) {
        enableCustomerInfoRequirement();
    }
    
    // Allow partial payments
    if (cashierSettings.allowPartialPayments) {
        enablePartialPayments();
    }
    
    // Show tax breakdown
    if (cashierSettings.showTaxBreakdown) {
        enableTaxBreakdown();
    }
}

// Enable auto print receipt
function enableAutoPrintReceipt() {
    // Add auto-print logic after successful checkout
    if (window.checkoutSuccess) {
        const originalCheckout = window.checkoutSuccess;
        window.checkoutSuccess = function() {
            originalCheckout.apply(this, arguments);
            // Trigger print
            setTimeout(() => {
                window.print();
            }, 1000);
        };
    }
    
    console.log('🖨️ Auto print receipt enabled');
}

// Enable customer info requirement
function enableCustomerInfoRequirement() {
    // Add customer info fields to checkout
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm && !document.getElementById('customer-info-section')) {
        const customerInfo = document.createElement('div');
        customerInfo.id = 'customer-info-section';
        customerInfo.className = 'customer-info-section mb-3';
        customerInfo.innerHTML = `
            <h6>Customer Information (Required)</h6>
            <div class="row g-2">
                <div class="col-md-6">
                    <input type="text" class="form-control" id="customer-name" placeholder="Customer Name" required>
                </div>
                <div class="col-md-6">
                    <input type="tel" class="form-control" id="customer-phone" placeholder="Phone Number" required>
                </div>
            </div>
        `;
        
        checkoutForm.insertBefore(customerInfo, checkoutForm.firstChild);
    }
    
    console.log('👤 Customer info requirement enabled');
}

// Enable partial payments
function enablePartialPayments() {
    // Add partial payment options
    const paymentSection = document.getElementById('payment-section');
    if (paymentSection && !document.getElementById('partial-payment-options')) {
        const partialOptions = document.createElement('div');
        partialOptions.id = 'partial-payment-options';
        partialOptions.className = 'partial-payment-options mb-3';
        partialOptions.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" id="enable-partial-payment">
                <label class="form-check-label" for="enable-partial-payment">
                    Enable Partial Payment
                </label>
            </div>
            <div id="partial-payment-details" style="display: none;" class="mt-2">
                <input type="number" class="form-control" id="partial-payment-amount" placeholder="Partial Payment Amount">
            </div>
        `;
        
        paymentSection.appendChild(partialOptions);
        
        // Add toggle logic
        const enableCheckbox = document.getElementById('enable-partial-payment');
        const detailsSection = document.getElementById('partial-payment-details');
        
        enableCheckbox.addEventListener('change', function() {
            detailsSection.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    console.log('💳 Partial payments enabled');
}

// Enable tax breakdown
function enableTaxBreakdown() {
    // Add tax breakdown to cart total
    const cartTotal = document.getElementById('cart-total');
    if (cartTotal && !document.getElementById('tax-breakdown')) {
        const taxBreakdown = document.createElement('div');
        taxBreakdown.id = 'tax-breakdown';
        taxBreakdown.className = 'tax-breakdown mt-2';
        taxBreakdown.innerHTML = `
            <div class="d-flex justify-content-between">
                <span>Subtotal:</span>
                <span id="subtotal-amount">₱0.00</span>
            </div>
            <div class="d-flex justify-content-between">
                <span>Tax (12%):</span>
                <span id="tax-amount">₱0.00</span>
            </div>
            <hr>
            <div class="d-flex justify-content-between fw-bold">
                <span>Total:</span>
                <span id="total-with-tax">₱0.00</span>
            </div>
        `;
        
        cartTotal.appendChild(taxBreakdown);
        
        // Update tax calculation
        updateTaxBreakdown();
    }
    
    console.log('🧾 Tax breakdown enabled');
}

// Update tax breakdown
function updateTaxBreakdown() {
    const subtotalElement = document.getElementById('subtotal-amount');
    const taxElement = document.getElementById('tax-amount');
    const totalElement = document.getElementById('total-with-tax');
    
    if (subtotalElement && taxElement && totalElement) {
        // Get current cart total (without tax)
        const currentTotal = window.getCurrentCartTotal ? window.getCurrentCartTotal() : 0;
        const tax = currentTotal * 0.12; // 12% tax
        const totalWithTax = currentTotal + tax;
        
        const currency = window.posCurrency || '₱';
        const decimals = window.posDecimalPlaces || 2;
        
        subtotalElement.textContent = `${currency}${currentTotal.toFixed(decimals)}`;
        taxElement.textContent = `${currency}${tax.toFixed(decimals)}`;
        totalElement.textContent = `${currency}${totalWithTax.toFixed(decimals)}`;
    }
}

// Update cashier settings
function updateCashierSetting(key, value) {
    cashierSettings[key] = value;
    localStorage.setItem('pos_cashier_settings', JSON.stringify(cashierSettings));
    applyCashierSettings();
}

// Get cashier setting
function getCashierSetting(key) {
    return cashierSettings[key];
}

// Listen for settings changes from admin panel
window.addEventListener('storage', function(e) {
    if (e.key === SETTINGS_STORAGE_KEY) {
        console.log('🔄 Settings changed in admin panel, updating cashier...');
        loadSharedSettings();
    }
});

// Test function for debugging cashier settings save functionality
window.testCashierSettings = function() {
    console.log('🧪 Testing cashier settings functionality...');
    
    // Check if loyalty form exists
    const loyaltyForm = document.getElementById('loyalty-settings-form');
    if (loyaltyForm) {
        console.log('✅ Loyalty settings form found');
        const loyaltyElements = loyaltyForm.querySelectorAll('input, select');
        console.log(`🔍 Found ${loyaltyElements.length} loyalty form elements`);
    } else {
        console.log('ℹ️ Loyalty settings form not found (may not be loaded yet)');
    }
    
    // Check if receipt form exists
    const receiptForm = document.getElementById('receipt-settings-form');
    if (receiptForm) {
        console.log('✅ Receipt settings form found');
        const receiptElements = receiptForm.querySelectorAll('input, select');
        console.log(`🔍 Found ${receiptElements.length} receipt form elements`);
    } else {
        console.log('ℹ️ Receipt settings form not found (may not be loaded yet)');
    }
    
    // Test collecting loyalty data
    if (loyaltyForm) {
        const loyaltyData = collectLoyaltySettingsData();
        console.log('📊 Test loyalty data collection:', loyaltyData);
    }
    
    // Test collecting receipt data
    if (receiptForm) {
        const receiptData = collectReceiptSettingsData();
        console.log('📊 Test receipt data collection:', receiptData);
    }
    
    // Test shared settings loading
    const sharedSettings = localStorage.getItem('pos_admin_settings');
    if (sharedSettings) {
        console.log('✅ Shared settings found:', JSON.parse(sharedSettings));
    } else {
        console.log('ℹ️ No shared settings found');
    }
    
    console.log('🧪 Cashier settings test completed');
};

// Setup cashier password change modal
function setupCashierPasswordChange() {
    // Open modal button
    const passwordChangeBtn = document.getElementById('cashier-password-change-btn');
    if (passwordChangeBtn) {
        passwordChangeBtn.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('cashierPasswordChangeModal'));
            modal.show();
        });
    }
    
    // Confirm password change button
    const confirmBtn = document.getElementById('confirm-cashier-password-change');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', changeCashierPassword);
    }
}

// Change cashier password function
async function changeCashierPassword() {
    const currentPassword = document.getElementById('cashier-current-password').value;
    const newPassword = document.getElementById('cashier-new-password').value;
    const confirmPassword = document.getElementById('cashier-confirm-password').value;
    const statusDiv = document.getElementById('cashier-password-status');
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showCashierPasswordStatus('Please fill in all password fields', 'danger');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showCashierPasswordStatus('New password and confirmation do not match', 'danger');
        return;
    }
    
    if (newPassword.length < 4) {
        showCashierPasswordStatus('Password must be at least 4 characters long', 'danger');
        return;
    }
    
    try {
        // Get current user credentials from sessionStorage
        const currentUser = sessionStorage.getItem('currentUser');
        const userRole = sessionStorage.getItem('userRole');
        
        if (!currentUser || !userRole) {
            showCashierPasswordStatus('No active session found. Please login again.', 'danger');
            return;
        }
        
        // For cashier changing their own password
        if (userRole === 'cashier') {
            // Verify current cashier password
            const storedCashierHash = localStorage.getItem('cashier_password_hash');
            const currentPasswordHash = hashCashierPassword(currentPassword);
            
            if (storedCashierHash && storedCashierHash !== currentPasswordHash) {
                showCashierPasswordStatus('Current password is incorrect', 'danger');
                return;
            }
            
            // Change the password
            const newPasswordHash = hashCashierPassword(newPassword);
            localStorage.setItem('cashier_password_hash', newPasswordHash);
            
            showCashierPasswordStatus('Password changed successfully!', 'success');
            console.log('🔐 Cashier password changed successfully');
            
            // Clear form and close modal after success
            setTimeout(() => {
                document.getElementById('cashier-current-password').value = '';
                document.getElementById('cashier-new-password').value = '';
                document.getElementById('cashier-confirm-password').value = '';
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('cashierPasswordChangeModal'));
                if (modal) {
                    modal.hide();
                }
            }, 2000);
            
        } else if (userRole === 'admin') {
            // Admin can also change cashier password
            const newPasswordHash = hashCashierPassword(newPassword);
            localStorage.setItem('cashier_password_hash', newPasswordHash);
            
            showCashierPasswordStatus('Cashier password changed successfully by admin!', 'success');
            console.log('🔐 Cashier password changed successfully by admin');
            
            // Clear form and close modal after success
            setTimeout(() => {
                document.getElementById('cashier-current-password').value = '';
                document.getElementById('cashier-new-password').value = '';
                document.getElementById('cashier-confirm-password').value = '';
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('cashierPasswordChangeModal'));
                if (modal) {
                    modal.hide();
                }
            }, 2000);
        } else {
            showCashierPasswordStatus('Access denied', 'danger');
        }
        
    } catch (error) {
        console.error('❌ Cashier password change failed:', error);
        showCashierPasswordStatus('Password change failed. Please try again.', 'danger');
    }
}

// Show cashier password status message
function showCashierPasswordStatus(message, type) {
    const statusDiv = document.getElementById('cashier-password-status');
    statusDiv.textContent = message;
    statusDiv.className = `small alert alert-${type} py-1`;
    statusDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

// Simple password hashing function (same as admin)
function hashCashierPassword(password) {
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
window.updateCashierSetting = updateCashierSetting;
window.getCashierSetting = getCashierSetting;
window.updateTaxBreakdown = updateTaxBreakdown;
window.saveLoyaltySettings = saveLoyaltySettings;
window.saveReceiptSettings = saveReceiptSettings;
window.applyLoyaltySettings = applyLoyaltySettings;
window.changeCashierPassword = changeCashierPassword;
window.applyReceiptSettings = applyReceiptSettings;
window.testCashierSettings = testCashierSettings;

console.log('🛒 Cashier settings module loaded');
