// anti-cloning.js - Advanced Anti-Cloning & Anti-Copying Protection
// Military-grade protection against code theft, cloning, and unauthorized copying

// =============================================================================
// ANTI-CLONING CONFIGURATION
// =============================================================================

const ANTI_CLONING_CONFIG = {
    // Domain Locking
    ALLOWED_DOMAINS: ['localhost', '127.0.0.1', 'zenithlabs-pos.com'],
    DOMAIN_CHECK_INTERVAL: 5000,
    
    // Environment Detection
    ALLOWED_USER_AGENTS: ['Chrome', 'Firefox', 'Safari', 'Edge'],
    BLOCKED_ENVIRONMENTS: ['bot', 'crawler', 'spider', 'scraper', 'headless'],
    
    // Code Protection
    OBFUSCATION_ENABLED: true,
    DEBUGGER_DETECTION: true,
    CONSOLE_PROTECTION: true,
    COPY_PROTECTION: true,
    
    // Tamper Detection
    INTEGRITY_CHECK_INTERVAL: 10000,
    FILE_INTEGRITY_HASHES: {},
    
    // License Validation
    LICENSE_KEY_REQUIRED: true,
    LICENSE_SERVER: 'https://license.zenithlabs-pos.com',
    LICENSE_CHECK_INTERVAL: 30000,
    
    // Hardware Fingerprinting
    HARDWARE_FINGERPRINT: true,
    DEVICE_BINDING: true,
    
    // Network Protection
    OFFLINE_MODE_LIMIT: 24 * 60 * 60 * 1000, // 24 hours
    NETWORK_VALIDATION: true,
    
    // Self-Destruct
    SELF_DESTRUCT_ENABLED: true,
    TAMPER_RESPONSE: 'lockdown', // 'lockdown', 'disable', 'erase'
};

// =============================================================================
// HARDWARE FINGERPRINTING
// =============================================================================

class HardwareFingerprint {
    static async generate() {
        const components = {
            screen: this.getScreenFingerprint(),
            canvas: this.getCanvasFingerprint(),
            webgl: this.getWebGLFingerprint(),
            audio: this.getAudioFingerprint(),
            fonts: this.getFontFingerprint(),
            timezone: this.getTimezoneFingerprint(),
            language: this.getLanguageFingerprint(),
            memory: this.getMemoryFingerprint(),
            cpu: this.getCPUFingerprint(),
            connection: this.getConnectionFingerprint()
        };
        
        const fingerprint = this.hashComponents(components);
        console.log('🔒 Hardware fingerprint generated:', fingerprint.substring(0, 16) + '...');
        return fingerprint;
    }
    
    static getScreenFingerprint() {
        return `${screen.width}x${screen.height}x${screen.colorDepth}:${screen.pixelDepth}:${screen.availWidth}x${screen.availHeight}`;
    }
    
    static getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 200;
            canvas.height = 50;
            
            // Draw complex pattern
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('ZenithLabs POS 🛡️', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Security System', 4, 35);
            
            return canvas.toDataURL();
        } catch (e) {
            return 'canvas_blocked';
        }
    }
    
    static getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return 'webgl_unsupported';
            
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (!debugInfo) return 'webgl_no_debug';
            
            return `${gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)}|${gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)}`;
        } catch (e) {
            return 'webgl_error';
        }
    }
    
    static getAudioFingerprint() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const analyser = context.createAnalyser();
            const gainNode = context.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(10000, context.currentTime);
            
            gainNode.gain.setValueAtTime(0, context.currentTime);
            
            oscillator.connect(analyser);
            analyser.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start(0);
            oscillator.stop(context.currentTime + 0.001);
            
            const fingerprint = analyser.frequencyBinCount.toString();
            return fingerprint;
        } catch (e) {
            return 'audio_blocked';
        }
    }
    
    static getFontFingerprint() {
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Palatino', 'Garamond', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'];
        const testString = 'mmmmmmmmmmlli';
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const fontDetection = {};
        
        testFonts.forEach(font => {
            let detected = false;
            baseFonts.forEach(baseFont => {
                ctx.font = `72px ${baseFont}`;
                const baseWidth = ctx.measureText(testString).width;
                ctx.font = `72px ${font}, ${baseFont}`;
                const testWidth = ctx.measureText(testString).width;
                
                if (baseWidth !== testWidth) {
                    detected = true;
                }
            });
            fontDetection[font] = detected;
        });
        
        return JSON.stringify(fontDetection);
    }
    
    static getTimezoneFingerprint() {
        return `${Intl.DateTimeFormat().resolvedOptions().timeZone}:${new Date().getTimezoneOffset()}`;
    }
    
    static getLanguageFingerprint() {
        return `${navigator.language}:${navigator.languages.join(',')}`;
    }
    
    static getMemoryFingerprint() {
        return navigator.deviceMemory || 'unknown';
    }
    
    static getCPUFingerprint() {
        return navigator.hardwareConcurrency || 'unknown';
    }
    
    static getConnectionFingerprint() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!connection) return 'no_connection_info';
        
        return `${connection.effectiveType}:${connection.downlink}:${connection.rtt}`;
    }
    
    static hashComponents(components) {
        const data = JSON.stringify(components);
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }
}

// =============================================================================
// LICENSE VALIDATION SYSTEM
// =============================================================================

class LicenseValidator {
    static async validate() {
        try {
            const licenseKey = localStorage.getItem('zenith_license_key');
            if (!licenseKey) {
                throw new Error('No license key found');
            }
            
            // Development license auto-validation
            if (licenseKey === 'DEV-TRIAL-2025-ZENITHLABS-POS') {
                localStorage.setItem('zenith_license_valid', 'true');
                const expires = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toISOString();
                localStorage.setItem('zenith_license_expiry', expires);
                console.log('✅ Development license validated successfully');
                return true;
            }
            
            // Generate hardware fingerprint
            const hardwareId = await HardwareFingerprint.generate();
            
            // Validate license with server
            const response = await this.validateWithServer(licenseKey, hardwareId);
            
            if (response.valid) {
                localStorage.setItem('zenith_license_valid', 'true');
                localStorage.setItem('zenith_license_expiry', response.expiry);
                console.log('✅ License validated successfully');
                return true;
            } else {
                throw new Error(response.error || 'Invalid license');
            }
        } catch (error) {
            console.error('❌ License validation failed:', error);
            this.handleLicenseFailure();
            return false;
        }
    }
    
    static async validateWithServer(licenseKey, hardwareId) {
        // In production, this would call your license server
        // For now, simulate validation
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simulate valid license for demo
                resolve({
                    valid: true,
                    expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                    features: ['pos', 'admin', 'reports', 'analytics']
                });
            }, 1000);
        });
    }
    
    static handleLicenseFailure() {
        if (ANTI_CLONING_CONFIG.SELF_DESTRUCT_ENABLED) {
            this.selfDestruct();
        } else {
            this.lockdown();
        }
    }
    
    static lockdown() {
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a1a; color: white; font-family: Arial, sans-serif;">
                <div style="text-align: center;">
                    <h1>🛡️ LICENSE INVALID</h1>
                    <p>This ZenithLabs POS system requires a valid license to operate.</p>
                    <p>Please contact support to obtain a valid license.</p>
                    <p>Error: Invalid or expired license key</p>
                </div>
            </div>
        `;
    }
    
    static selfDestruct() {
        // Clear all data
        localStorage.clear();
        sessionStorage.clear();
        
        // Attempt to clear IndexedDB
        if (window.indexedDB) {
            const databases = indexedDB.databases();
            databases.then(dbs => {
                dbs.forEach(db => {
                    indexedDB.deleteDatabase(db.name);
                });
            });
        }
        
        // Show destruction message
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #8B0000; color: white; font-family: Arial, sans-serif;">
                <div style="text-align: center;">
                    <h1>⚠️ SYSTEM LOCKED</h1>
                    <p>Unauthorized use detected.</p>
                    <p>All data has been secured.</p>
                    <p>Please contact system administrator.</p>
                </div>
            </div>
        `;
        
        // Prevent further interaction
        window.addEventListener('beforeunload', (e) => {
            e.preventDefault();
            e.returnValue = '';
        });
    }
}

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

class EnvironmentDetector {
    static isLegitimateEnvironment() {
        // Check user agent
        const userAgent = navigator.userAgent;
        const isBot = ANTI_CLONING_CONFIG.BLOCKED_ENVIRONMENTS.some(bot => 
            userAgent.toLowerCase().includes(bot)
        );
        
        if (isBot) {
            console.warn('🤖 Bot environment detected');
            return false;
        }
        
        // Check for headless browser
        if (this.isHeadlessBrowser()) {
            console.warn('🔧 Headless browser detected');
            return false;
        }
        
        // Check for developer tools
        if (ANTI_CLONING_CONFIG.DEBUGGER_DETECTION && this.isDebuggerOpen()) {
            console.warn('🐛 Debugger detected');
            return false;
        }
        
        return true;
    }
    
    static isHeadlessBrowser() {
        // Check for headless browser indicators
        const indicators = [
            () => navigator.webdriver,
            () => window.phantom,
            () => window.callPhantom,
            () => window._phantom,
            () => window.__nightmare,
            () => window.navigator.webdriver,
            () => window.spawn,
            () => window.emit,
            () => window.Buffer,
            () => window.process
        ];
        
        return indicators.some(check => {
            try {
                return check();
            } catch (e) {
                return false;
            }
        });
    }
    
    static isDebuggerOpen() {
        const threshold = 160;
        const start = performance.now();
        
        debugger;
        
        const end = performance.now();
        
        if (end - start > threshold) {
            return true;
        }
        
        // Additional check using console timing
        const consoleStart = performance.now();
        console.log('debug_check');
        const consoleEnd = performance.now();
        
        return consoleEnd - consoleStart > 100;
    }
}

// =============================================================================
// CODE INTEGRITY VALIDATION
// =============================================================================

class CodeIntegrityValidator {
    static initialize() {
        this.generateFileHashes();
        this.startIntegrityMonitoring();
    }
    
    static generateFileHashes() {
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            const src = script.src;
            if (src.includes('zenithlabs') || src.includes('localhost')) {
                // In production, pre-calculate these hashes
                ANTI_CLONING_CONFIG.FILE_INTEGRITY_HASHES[src] = this.calculateScriptHash(script);
            }
        });
    }
    
    static calculateScriptHash(script) {
        // Simple hash calculation - in production use SHA-256
        return btoa(script.textContent || '').substring(0, 32);
    }
    
    static startIntegrityMonitoring() {
        setInterval(() => {
            this.validateIntegrity();
        }, ANTI_CLONING_CONFIG.INTEGRITY_CHECK_INTERVAL);
    }
    
    static validateIntegrity() {
        const scripts = document.querySelectorAll('script[src]');
        let violations = [];
        
        scripts.forEach(script => {
            const src = script.src;
            const expectedHash = ANTI_CLONING_CONFIG.FILE_INTEGRITY_HASHES[src];
            
            if (expectedHash) {
                const currentHash = this.calculateScriptHash(script);
                if (currentHash !== expectedHash) {
                    violations.push({ src, expectedHash, currentHash });
                }
            }
        });
        
        if (violations.length > 0) {
            console.error('🔓 Code integrity violations detected:', violations);
            this.handleTampering();
        }
    }
    
    static handleTampering() {
        const response = ANTI_CLONING_CONFIG.TAMPER_RESPONSE;
        
        switch (response) {
            case 'lockdown':
                LicenseValidator.lockdown();
                break;
            case 'disable':
                this.disableSystem();
                break;
            case 'erase':
                LicenseValidator.selfDestruct();
                break;
        }
    }
    
    static disableSystem() {
        // Disable all functionality
        document.querySelectorAll('button, input, select').forEach(element => {
            element.disabled = true;
        });
        
        // Show warning
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(255, 0, 0, 0.9); color: white;
            display: flex; justify-content: center; align-items: center;
            z-index: 999999; font-family: Arial, sans-serif;
        `;
        warning.innerHTML = `
            <div style="text-align: center;">
                <h1>⚠️ SYSTEM DISABLED</h1>
                <p>Code tampering detected. System disabled for security.</p>
                <p>Please contact system administrator.</p>
            </div>
        `;
        document.body.appendChild(warning);
    }
}

// =============================================================================
// CONSOLE PROTECTION
// =============================================================================

class ConsoleProtection {
    static initialize() {
        if (!ANTI_CLONING_CONFIG.CONSOLE_PROTECTION) return;
        
        this.protectConsole();
        this.monitorConsole();
    }
    
    static protectConsole() {
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info,
            debug: console.debug
        };
        
        // Override console methods
        console.log = function(...args) {
            if (args[0] && typeof args[0] === 'string') {
                const message = args[0].toLowerCase();
                if (message.includes('password') || 
                    message.includes('secret') || 
                    message.includes('key') ||
                    message.includes('token')) {
                    return; // Block sensitive information
                }
            }
            originalConsole.log.apply(console, args);
        };
        
        // Add anti-tampering detection
        console.log.toString = function() {
            return 'function log() { [native code] }';
        };
    }
    
    static monitorConsole() {
        // Monitor for console clearing (common tampering technique)
        let clearCount = 0;
        const originalClear = console.clear;
        
        console.clear = function() {
            clearCount++;
            if (clearCount > 5) {
                console.warn('🔔 Excessive console clearing detected');
                CodeIntegrityValidator.handleTampering();
            }
            originalClear.apply(console, arguments);
        };
    }
}

// =============================================================================
// COPY PROTECTION
// =============================================================================

class CopyProtection {
    static initialize() {
        if (!ANTI_CLONING_CONFIG.COPY_PROTECTION) return;
        
        this.disableRightClick();
        this.disableKeyboardShortcuts();
        this.disableTextSelection();
        this.disableDragAndDrop();
        this.monitorCopyAttempts();
    }
    
    static disableRightClick() {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            console.warn('🚫 Right-click disabled');
            return false;
        });
    }
    
    static disableKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Block common copy shortcuts
            if ((e.ctrlKey || e.metaKey) && 
                (e.key === 'c' || e.key === 'x' || e.key === 'v' || 
                 e.key === 'a' || e.key === 's' || e.key === 'u')) {
                e.preventDefault();
                console.warn('🚫 Keyboard shortcut disabled:', e.key);
                return false;
            }
            
            // Block F12 and other developer tools
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'J') ||
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
                console.warn('🚫 Developer tools shortcut disabled');
                return false;
            }
        });
    }
    
    static disableTextSelection() {
        document.addEventListener('selectstart', (e) => {
            e.preventDefault();
            return false;
        });
        
        // Add CSS to prevent selection
        const style = document.createElement('style');
        style.textContent = `
            * {
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                user-select: none !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    static disableDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            e.preventDefault();
            return false;
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            return false;
        });
    }
    
    static monitorCopyAttempts() {
        let copyAttempts = 0;
        const maxAttempts = 3;
        
        document.addEventListener('copy', (e) => {
            copyAttempts++;
            console.warn(`🚫 Copy attempt #${copyAttempts}`);
            
            if (copyAttempts >= maxAttempts) {
                console.warn('🔔 Multiple copy attempts detected');
                CodeIntegrityValidator.handleTampering();
            }
            
            e.preventDefault();
            return false;
        });
    }
}

// =============================================================================
// DOMAIN VALIDATION
// =============================================================================

class DomainValidator {
    static validate() {
        const currentDomain = window.location.hostname;
        const isValidDomain = ANTI_CLONING_CONFIG.ALLOWED_DOMAINS.includes(currentDomain);
        
        if (!isValidDomain) {
            console.error('🚫 Invalid domain detected:', currentDomain);
            this.handleInvalidDomain();
            return false;
        }
        
        return true;
    }
    
    static handleInvalidDomain() {
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a1a; color: white; font-family: Arial, sans-serif;">
                <div style="text-align: center;">
                    <h1>🚫 DOMAIN NOT AUTHORIZED</h1>
                    <p>This ZenithLabs POS system is not licensed to run on this domain.</p>
                    <p>Current domain: ${window.location.hostname}</p>
                    <p>Please contact support to obtain a license for this domain.</p>
                </div>
            </div>
        `;
    }
    
    static startMonitoring() {
        setInterval(() => {
            this.validate();
        }, ANTI_CLONING_CONFIG.DOMAIN_CHECK_INTERVAL);
    }
}

// =============================================================================
// MAIN ANTI-CLONING SYSTEM
// =============================================================================

class AntiCloningSystem {
    static async initialize() {
        console.log('🛡️ Initializing Anti-Cloning System...');
        
        try {
            // Validate domain
            if (!DomainValidator.validate()) {
                return false;
            }
            DomainValidator.startMonitoring();
            
            // Check environment
            if (!EnvironmentDetector.isLegitimateEnvironment()) {
                LicenseValidator.lockdown();
                return false;
            }
            
            // Validate license
            if (ANTI_CLONING_CONFIG.LICENSE_KEY_REQUIRED) {
                const licenseValid = await LicenseValidator.validate();
                if (!licenseValid) {
                    return false;
                }
                
                // Periodic license validation
                setInterval(() => {
                    LicenseValidator.validate();
                }, ANTI_CLONING_CONFIG.LICENSE_CHECK_INTERVAL);
            }
            
            // Initialize protection systems
            ConsoleProtection.initialize();
            CopyProtection.initialize();
            CodeIntegrityValidator.initialize();
            
            // Generate and store hardware fingerprint
            const fingerprint = await HardwareFingerprint.generate();
            localStorage.setItem('zenith_hardware_id', fingerprint);
            
            // Monitor for tampering
            this.startTamperingMonitoring();
            
            console.log('✅ Anti-Cloning System Active');
            return true;
            
        } catch (error) {
            console.error('❌ Anti-Cloning System failed to initialize:', error);
            LicenseValidator.selfDestruct();
            return false;
        }
    }
    
    static startTamperingMonitoring() {
        // Monitor for window size changes (common for debugging)
        let originalWidth = window.outerWidth;
        let originalHeight = window.outerHeight;
        
        setInterval(() => {
            if (Math.abs(window.outerWidth - originalWidth) > 200 ||
                Math.abs(window.outerHeight - originalHeight) > 200) {
                console.warn('🔔 Window size change detected - possible debugging');
                originalWidth = window.outerWidth;
                originalHeight = window.outerHeight;
            }
        }, 1000);
        
        // Monitor for focus/blur (developer tools detection)
        let devtoolsOpen = false;
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 ||
                window.outerWidth - window.innerWidth > 200) {
                if (!devtoolsOpen) {
                    console.warn('🔔 Developer tools opened');
                    devtoolsOpen = true;
                    
                    if (ANTI_CLONING_CONFIG.DEBUGGER_DETECTION) {
                        setTimeout(() => {
                            if (devtoolsOpen) {
                                CodeIntegrityValidator.handleTampering();
                            }
                        }, 5000);
                    }
                }
            } else {
                devtoolsOpen = false;
            }
        }, 1000);
    }
    
    static getStatus() {
        return {
            domainValid: DomainValidator.validate(),
            environmentLegitimate: EnvironmentDetector.isLegitimateEnvironment(),
            hardwareFingerprint: localStorage.getItem('zenith_hardware_id'),
            licenseValid: localStorage.getItem('zenith_license_valid') === 'true',
            protectionsEnabled: {
                console: ANTI_CLONING_CONFIG.CONSOLE_PROTECTION,
                copy: ANTI_CLONING_CONFIG.COPY_PROTECTION,
                debugger: ANTI_CLONING_CONFIG.DEBUGGER_DETECTION,
                integrity: true
            }
        };
    }
}

// =============================================================================
// GLOBAL FUNCTIONS
// =============================================================================

window.checkAntiCloningStatus = () => AntiCloningSystem.getStatus();
window.validateLicense = () => LicenseValidator.validate();
window.getHardwareFingerprint = () => HardwareFingerprint.generate();

// Initialize anti-cloning system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔓 Anti-cloning system disabled for development');
    // AntiCloningSystem.initialize(); // DISABLED FOR DEVELOPMENT
});

// Additional protection on window load
window.addEventListener('load', () => {
    console.log('🔓 Window load protection disabled for development');
    // DISABLED FOR DEVELOPMENT
    /*
    setTimeout(() => {
        if (!AntiCloningSystem.getStatus().domainValid) {
            DomainValidator.handleInvalidDomain();
        }
    }, 2000);
    */
});

console.log('🛡️ Anti-Cloning Protection System Loaded');
