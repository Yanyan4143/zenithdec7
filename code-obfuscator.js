// code-obfuscator.js - Advanced Code Obfuscation & Protection
// Makes code extremely difficult to understand, debug, or copy

// =============================================================================
// OBFUSCATION ENGINE
// =============================================================================

class CodeObfuscator {
    static obfuscateString(str) {
        // Multi-layer string obfuscation
        return this.rot13(this.base64Encode(this.xorEncode(str)));
    }
    
    static deobfuscateString(obfuscatedStr) {
        // Reverse the obfuscation
        return this.xorDecode(this.base64Decode(this.rot13(obfuscatedStr)));
    }
    
    static rot13(str) {
        return str.replace(/[a-zA-Z]/g, char => {
            const start = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - start + 13) % 26) + start);
        });
    }
    
    static base64Encode(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }
    
    static base64Decode(str) {
        return decodeURIComponent(escape(atob(str)));
    }
    
    static xorEncode(str, key = 'ZenithLabs2024') {
        let result = '';
        for (let i = 0; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }
    
    static xorDecode(str, key = 'ZenithLabs2024') {
        return this.xorEncode(str, key); // XOR is symmetric
    }
    
    static scrambleFunction(func) {
        const funcStr = func.toString();
        const obfuscated = this.obfuscateString(funcStr);
        
        return new Function('return ' + this.deobfuscateString(obfuscated))();
    }
    
    static protectVariable(value, name) {
        const descriptor = {
            get: function() {
                console.trace(`🔒 Accessing protected variable: ${name}`);
                return value;
            },
            set: function(newValue) {
                console.warn(`🔒 Attempting to modify protected variable: ${name}`);
                // In production, this would trigger security measures
            },
            configurable: false,
            enumerable: false
        };
        
        Object.defineProperty(window, name, descriptor);
    }
}

// =============================================================================
// DYNAMIC FUNCTION GENERATION
// =============================================================================

class DynamicFunctionGenerator {
    static generateProtectedFunction(name, logic) {
        const obfuscatedLogic = CodeObfuscator.obfuscateString(logic.toString());
        
        return new Function(`
            // ${name} - Protected Function
            const obfuscated = "${obfuscatedLogic}";
            const deobfuscated = CodeObfuscator.deobfuscateString(obfuscated);
            const func = new Function('return ' + deobfuscated)();
            
            // Add protection wrapper
            return function(...args) {
                // Validate caller
                if (!DynamicFunctionGenerator.validateCaller()) {
                    throw new Error('Unauthorized function call');
                }
                
                // Log function call
                console.log('🔒 Protected function called:', '${name}');
                
                // Execute original function
                return func.apply(this, args);
            };
        `)();
    }
    
    static validateCaller() {
        const stack = new Error().stack;
        const allowedCallers = ['localhost', '127.0.0.1', 'zenithlabs-pos.com'];
        
        return allowedCallers.some(domain => stack.includes(domain));
    }
    
    static createSecureClass(className, methods) {
        const classDefinition = {};
        
        for (const [methodName, methodLogic] of Object.entries(methods)) {
            classDefinition[methodName] = this.generateProtectedFunction(
                `${className}.${methodName}`,
                methodLogic
            );
        }
        
        return classDefinition;
    }
}

// =============================================================================
// RUNTIME CODE ENCRYPTION
// =============================================================================

class RuntimeCodeEncryptor {
    constructor() {
        this.encryptedBlocks = new Map();
        this.decryptionKeys = new Map();
    }
    
    encryptCodeBlock(name, code) {
        const key = this.generateEncryptionKey();
        const encrypted = CodeObfuscator.xorEncode(code, key);
        
        this.encryptedBlocks.set(name, encrypted);
        this.decryptionKeys.set(name, key);
        
        return encrypted;
    }
    
    decryptCodeBlock(name) {
        const encrypted = this.encryptedBlocks.get(name);
        const key = this.decryptionKeys.get(name);
        
        if (!encrypted || !key) {
            throw new Error(`Code block not found: ${name}`);
        }
        
        return CodeObfuscator.xorDecode(encrypted, key);
    }
    
    generateEncryptionKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    executeEncryptedBlock(name) {
        const decryptedCode = this.decryptCodeBlock(name);
        
        // Execute in isolated scope
        const isolatedScope = new Function('CodeObfuscator', decryptedCode);
        return isolatedScope(CodeObfuscator);
    }
}

// =============================================================================
// ANTI-DEBUGGING MEASURES
// =============================================================================

class AntiDebugging {
    static initialize() {
        this.setupDebuggerDetection();
        this.setupTimingAttacks();
        this.setupMemoryProtection();
        this.setupFunctionHooking();
    }
    
    static setupDebuggerDetection() {
        try {
            // Method 1: Performance timing
            const originalPerfNow = performance.now;
            performance.now = function() {
                const start = originalPerfNow.apply(this, arguments);
                debugger; // This will slow execution if debugger is open
                const end = originalPerfNow.apply(this, arguments);
                
                if (end - start > 100) {
                    console.warn('🔓 Debugger detected via timing');
                    AntiDebugging.handleDebuggerDetected();
                }
                
                return end;
            };
        } catch (error) {
            console.warn('⚠️ Debugger detection setup failed:', error.message);
        }
        
        // Method 2: Console detection
        let consoleCheck = setInterval(() => {
            const start = Date.now();
            console.log('debug_check_' + Math.random());
            const end = Date.now();
            
            if (end - start > 100) {
                clearInterval(consoleCheck);
                console.warn('🔓 Debugger detected via console');
                this.handleDebuggerDetected();
            }
        }, 5000);
    }
    
    static setupTimingAttacks() {
        // Detect if code is being stepped through
        let lastTime = performance.now();
        
        const checkTiming = () => {
            const currentTime = performance.now();
            const diff = currentTime - lastTime;
            
            // If execution takes unusually long, debugger might be active
            if (diff > 50) {
                console.warn('🔓 Slow execution detected - possible debugging');
                this.handleDebuggerDetected();
            }
            
            lastTime = currentTime;
            requestAnimationFrame(checkTiming);
        };
        
        requestAnimationFrame(checkTiming);
    }
    
    static setupMemoryProtection() {
        try {
            // Detect memory inspection tools
            const originalGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
            Object.getOwnPropertyDescriptor = function(obj, prop) {
                const result = originalGetOwnPropertyDescriptor.apply(this, arguments);
                
                // Log property access attempts
                if (obj === window || obj === document) {
                    console.trace(`🔒 Property access: ${prop}`);
                }
                
                return result;
            };
        } catch (error) {
            console.warn('⚠️ Memory protection setup failed:', error.message);
        }
    }
    
    static setupFunctionHooking() {
        try {
            // Hook common debugging functions
            const originalToString = Function.prototype.toString;
            Function.prototype.toString = function() {
                if (this.name && this.name.includes('obfuscated')) {
                    return 'function ' + this.name + '() { [native code] }';
                }
                return originalToString.call(this);
            };
        } catch (error) {
            console.warn('⚠️ Function hooking setup failed:', error.message);
        }
    }
    
    static handleDebuggerDetected() {
        // Clear sensitive data
        localStorage.clear();
        sessionStorage.clear();
        
        // Show warning
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #8B0000; color: white; font-family: Arial, sans-serif;">
                <div style="text-align: center;">
                    <h1>🔓 DEBUGGING DETECTED</h1>
                    <p>Unauthorized debugging or reverse engineering detected.</p>
                    <p>System locked for security reasons.</p>
                    <p>Please close developer tools and refresh the page.</p>
                </div>
            </div>
        `;
        
        // Prevent further interaction
        window.stop();
    }
}

// =============================================================================
// WATERMARKING & FINGERPRINTING
// =============================================================================

class CodeWatermarking {
    static embedWatermark() {
        // Embed invisible watermark in page
        const watermark = this.generateWatermark();
        
        // Method 1: Hidden element
        const hiddenDiv = document.createElement('div');
        hiddenDiv.style.cssText = 'position:absolute; left:-9999px; top:-9999px; opacity:0; pointer-events:none;';
        hiddenDiv.textContent = watermark;
        hiddenDiv.id = 'zenith_watermark';
        document.body.appendChild(hiddenDiv);
        
        // Method 2: Meta tag
        const meta = document.createElement('meta');
        meta.name = 'zenith-watermark';
        meta.content = watermark;
        document.head.appendChild(meta);
        
        // Method 3: Custom property
        document.documentElement.style.setProperty('--zenith-watermark', watermark);
        
        console.log('💧 Watermark embedded:', watermark.substring(0, 16) + '...');
    }
    
    static generateWatermark() {
        const data = {
            timestamp: Date.now(),
            domain: window.location.hostname,
            userAgent: navigator.userAgent.substring(0, 50),
            license: localStorage.getItem('zenith_license_key') || 'demo',
            hardware: localStorage.getItem('zenith_hardware_id') || 'unknown'
        };
        
        const watermark = JSON.stringify(data);
        return CodeObfuscator.obfuscateString(watermark);
    }
    
    static extractWatermark() {
        try {
            const hiddenDiv = document.getElementById('zenith_watermark');
            if (hiddenDiv) {
                const watermark = hiddenDiv.textContent;
                return CodeObfuscator.deobfuscateString(watermark);
            }
        } catch (e) {
            console.warn('Failed to extract watermark');
        }
        return null;
    }
    
    static validateWatermark() {
        const watermark = this.extractWatermark();
        if (!watermark) return false;
        
        const data = JSON.parse(watermark);
        const currentDomain = window.location.hostname;
        
        // Check if watermark matches current domain
        if (data.domain !== currentDomain) {
            console.error('🔓 Domain mismatch in watermark');
            return false;
        }
        
        // Check if watermark is too old (possible copy)
        const age = Date.now() - data.timestamp;
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        
        if (age > maxAge) {
            console.error('🔓 Watermark too old - possible copy');
            return false;
        }
        
        return true;
    }
}

// =============================================================================
// ANTI-TAMPERING VALIDATION
// =============================================================================

class AntiTamperingValidator {
    static initialize() {
        this.originalDocumentHTML = document.documentElement.outerHTML;
        this.originalScripts = this.getScriptHashes();
        this.startValidation();
    }
    
    static getScriptHashes() {
        const scripts = {};
        document.querySelectorAll('script').forEach((script, index) => {
            const content = script.textContent || script.src;
            scripts[index] = this.simpleHash(content);
        });
        return scripts;
    }
    
    static simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
    
    static startValidation() {
        setInterval(() => {
            this.validateIntegrity();
        }, 10000); // Check every 10 seconds
    }
    
    static validateIntegrity() {
        // Check for DOM modifications
        const currentHTML = document.documentElement.outerHTML;
        if (currentHTML !== this.originalDocumentHTML) {
            console.error('🔓 DOM tampering detected');
            this.handleTampering();
            return;
        }
        
        // Check for script modifications
        const currentScripts = this.getScriptHashes();
        for (const [index, hash] of Object.entries(currentScripts)) {
            if (this.originalScripts[index] !== hash) {
                console.error(`🔓 Script tampering detected at index ${index}`);
                this.handleTampering();
                return;
            }
        }
        
        // Check watermark
        if (!CodeWatermarking.validateWatermark()) {
            console.error('🔓 Watermark validation failed');
            this.handleTampering();
            return;
        }
    }
    
    static handleTampering() {
        // Lock down the system
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #8B0000; color: white; font-family: Arial, sans-serif;">
                <div style="text-align: center;">
                    <h1>🔓 TAMPERING DETECTED</h1>
                    <p>Unauthorized modification of system code detected.</p>
                    <p>System locked for security reasons.</p>
                    <p>All activities have been logged.</p>
                </div>
            </div>
        `;
        
        // Log the incident
        const incident = {
            timestamp: new Date().toISOString(),
            type: 'CODE_TAMPERING',
            domain: window.location.hostname,
            userAgent: navigator.userAgent,
            watermark: CodeWatermarking.extractWatermark()
        };
        
        console.error('🚨 Security incident:', incident);
        
        // Prevent further interaction
        window.stop();
    }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

class ObfuscationSystem {
    static async initialize() {
        console.log('🔐 Initializing Code Obfuscation System...');
        
        try {
            // Initialize all protection systems
            AntiDebugging.initialize();
            CodeWatermarking.embedWatermark();
            AntiTamperingValidator.initialize();
            
            // Protect critical variables
            this.protectCriticalVariables();
            
            // Create secure functions
            this.createSecureFunctions();
            
            console.log('✅ Code Obfuscation System Active');
            return true;
            
        } catch (error) {
            console.error('❌ Obfuscation System failed:', error);
            return false;
        }
    }
    
    static protectCriticalVariables() {
        // Protect sensitive global variables
        const sensitiveVars = [
            'zenith_license_key',
            'zenith_hardware_id',
            'zenith_session_key',
            'supabaseUrl',
            'supabaseKey'
        ];
        
        sensitiveVars.forEach(varName => {
            const value = localStorage.getItem(varName);
            if (value) {
                CodeObfuscator.protectVariable(value, varName);
            }
        });
    }
    
    static createSecureFunctions() {
        // Create protected versions of critical functions
        window.secureCheckout = DynamicFunctionGenerator.generateProtectedFunction(
            'secureCheckout',
            function(cartData) {
                // Original checkout logic here
                console.log('Processing secure checkout...');
                return true;
            }
        );
        
        window.secureAuth = DynamicFunctionGenerator.generateProtectedFunction(
            'secureAuth',
            function(credentials) {
                // Original auth logic here
                console.log('Processing secure authentication...');
                return true;
            }
        );
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔓 Code obfuscation system disabled for development');
    // ObfuscationSystem.initialize(); // DISABLED FOR DEVELOPMENT
});

// Global access
window.CodeObfuscator = CodeObfuscator;
window.DynamicFunctionGenerator = DynamicFunctionGenerator;
window.ObfuscationSystem = ObfuscationSystem;

console.log('🔐 Code Obfuscation System Loaded');
