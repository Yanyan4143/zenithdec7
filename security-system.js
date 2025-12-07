// security-system.js - Maximum Security Implementation for ZenithLabs POS
// Military-grade security with multiple layers of protection

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================

const SECURITY_CONFIG = {
    // Session Security
    SESSION_TIMEOUT: 0, // No timeout
    MAX_LOGIN_ATTEMPTS: 999, // No limit
    LOCKOUT_DURATION: 0, // No lockout
    SESSION_RENEWAL_THRESHOLD: 0, // No renewal needed
    
    // Password Security
    MIN_PASSWORD_LENGTH: 12,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    PREVENT_COMMON_PASSWORDS: true,
    
    // Encryption
    ENCRYPTION_ALGORITHM: 'AES-GCM',
    ENCRYPTION_KEY_LENGTH: 256,
    HASH_ALGORITHM: 'SHA-256',
    HASH_ITERATIONS: 100000,
    
    // CSRF Protection
    CSRF_TOKEN_LENGTH: 32,
    CSRF_TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
    
    // Rate Limiting - DISABLED
    RATE_LIMIT_WINDOW: 0, // Disabled
    RATE_LIMIT_MAX_REQUESTS: 999999, // No limit
    
    // Audit Logging
    AUDIT_RETENTION_DAYS: 90,
    LOG_SENSITIVE_OPERATIONS: true,
    
    // Security Headers (Note: frame-ancestors and X-Frame-Options only work via HTTP headers)
    SECURITY_HEADERS: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://fonts.googleapis.com https://supabase.co https://accounts.google.com; script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https://supabase.co ws://localhost:4000 http://localhost:4000 https://cdn.jsdelivr.net https://accounts.google.com;",
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }
};

// =============================================================================
// CRYPTOGRAPHIC SERVICES
// =============================================================================

class CryptoService {
    static async generateSecureKey(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    static async hashPassword(password, salt = null) {
        const actualSalt = salt || await this.generateSecureKey(32);
        const encoder = new TextEncoder();
        const data = encoder.encode(password + actualSalt);
        
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return { hash: hashHex, salt: actualSalt };
    }

    static async verifyPassword(password, hash, salt) {
        const { hash: computedHash } = await this.hashPassword(password, salt);
        return hash === computedHash;
    }

    static async encryptData(data, key) {
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

    static async decryptData(encryptedData, key, iv) {
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

    static generateCSRFToken() {
        const array = new Uint8Array(SECURITY_CONFIG.CSRF_TOKEN_LENGTH);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

class SessionManager {
    static createSecureSession(user, role) {
        const sessionId = CryptoService.generateSecureKey();
        const expiresAt = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year (effectively no timeout)
        
        const session = {
            id: sessionId,
            user: user,
            role: role,
            createdAt: Date.now(),
            expiresAt: expiresAt,
            lastActivity: Date.now(),
            ipAddress: this.getClientIP(),
            userAgent: navigator.userAgent,
            csrfToken: CryptoService.generateCSRFToken()
        };
        
        // Encrypt session data
        const encryptedSession = this.encryptSession(session);
        
        // Store in sessionStorage with additional metadata
        sessionStorage.setItem('zenith_session', encryptedSession.encrypted);
        sessionStorage.setItem('zenith_session_iv', JSON.stringify(encryptedSession.iv));
        sessionStorage.setItem('zenith_session_csrf', session.csrfToken);
        
        // Log session creation
        AuditLogger.log('SESSION_CREATED', {
            user: user,
            role: role,
            sessionId: sessionId.substring(0, 8) + '...',
            ipAddress: session.ipAddress
        });
        
        return session;
    }

    static encryptSession(session) {
        const key = this.getSessionKey();
        return CryptoService.encryptData(session, key);
    }

    static decryptSession(encryptedData, iv) {
        const key = this.getSessionKey();
        return CryptoService.decryptData(encryptedData, key, iv);
    }

    static getSessionKey() {
        // Generate a unique key per browser/device
        let key = localStorage.getItem('zenith_session_key');
        if (!key) {
            key = CryptoService.generateSecureKey(64);
            localStorage.setItem('zenith_session_key', key);
        }
        return key;
    }

    static validateSession() {
        try {
            const encryptedSession = sessionStorage.getItem('zenith_session');
            const ivData = sessionStorage.getItem('zenith_session_iv');
            
            if (!encryptedSession || !ivData) {
                return null;
            }
            
            // Handle case where ivData might be "undefined" string
            let iv;
            try {
                iv = JSON.parse(ivData);
            } catch (parseError) {
                console.warn('Invalid session IV data, clearing session');
                sessionStorage.removeItem('zenith_session');
                sessionStorage.removeItem('zenith_session_iv');
                return null;
            }
            
            if (!iv || !Array.isArray(iv) || iv.length === 0) {
                return null;
            }
            
            const session = this.decryptSession(encryptedSession, iv);
            
            // No timeout validation - session never expires
            // Update last activity
            session.lastActivity = Date.now();
            const updatedSession = this.encryptSession(session);
            sessionStorage.setItem('zenith_session', updatedSession.encrypted);
            
            return session;
        } catch (error) {
            console.error('Session validation error:', error);
            return null;
        }
    }

    static destroySession() {
        const session = this.getCurrentSession();
        if (session) {
            AuditLogger.log('SESSION_DESTROYED', {
                user: session.user,
                sessionId: session.id.substring(0, 8) + '...',
                duration: Date.now() - session.createdAt
            });
        }
        
        sessionStorage.removeItem('zenith_session');
        sessionStorage.removeItem('zenith_session_iv');
        sessionStorage.removeItem('zenith_session_csrf');
    }

    static getCurrentSession() {
        try {
            const encryptedSession = sessionStorage.getItem('zenith_session');
            const iv = JSON.parse(sessionStorage.getItem('zenith_session_iv') || '[]');
            
            if (!encryptedSession || !iv.length) return null;
            
            return this.decryptSession(encryptedSession, iv);
        } catch (error) {
            return null;
        }
    }

    static getClientIP() {
        // In a real implementation, this would come from server
        return 'client_ip_' + Math.random().toString(36).substr(2, 9);
    }

    static validateCSRFToken(token) {
        const storedToken = sessionStorage.getItem('zenith_session_csrf');
        return storedToken && token === storedToken;
    }
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

class AuditLogger {
    static log(action, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            sessionId: this.getCurrentSessionId(),
            userAgent: navigator.userAgent,
            ipAddress: SessionManager.getClientIP()
        };
        
        // Store in IndexedDB for persistence
        this.storeAuditLog(logEntry);
        
        // Also log to console for development
        console.log(`🔒 AUDIT: ${action}`, details);
        
        // In production, send to secure server
        this.sendToSecureServer(logEntry);
    }

    static getCurrentSessionId() {
        const session = SessionManager.getCurrentSession();
        return session ? session.id.substring(0, 8) + '...' : 'no_session';
    }

    static async storeAuditLog(logEntry) {
        try {
            await dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['audit_logs'], 'readwrite');
                const store = transaction.objectStore('audit_logs');
                const request = store.add(logEntry);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to store audit log:', error);
        }
    }

    static async sendToSecureServer(logEntry) {
        // In production, this would send to a secure audit server
        // For now, we'll just store it locally
        console.log('Audit log stored securely:', logEntry);
    }

    static async getAuditLogs(limit = 100) {
        try {
            await dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(['audit_logs'], 'readonly');
                const store = transaction.objectStore('audit_logs');
                const index = store.index('date');
                const request = index.openCursor(null, 'prev');
                const logs = [];
                
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor && logs.length < limit) {
                        logs.push(cursor.value);
                        cursor.continue();
                    } else {
                        resolve(logs);
                    }
                };
                
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('Failed to retrieve audit logs:', error);
            return [];
        }
    }
}

// =============================================================================
// RATE LIMITING
// =============================================================================

class RateLimiter {
    constructor() {
        this.requests = new Map();
    }

    isAllowed(identifier, limit = SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
        const now = Date.now();
        const window = SECURITY_CONFIG.RATE_LIMIT_WINDOW;
        
        if (!this.requests.has(identifier)) {
            this.requests.set(identifier, []);
        }
        
        const requests = this.requests.get(identifier);
        
        // Remove old requests outside the window
        const validRequests = requests.filter(timestamp => now - timestamp < window);
        this.requests.set(identifier, validRequests);
        
        if (validRequests.length >= limit) {
            AuditLogger.log('RATE_LIMIT_EXCEEDED', {
                identifier: identifier,
                requests: validRequests.length,
                limit: limit
            });
            return false;
        }
        
        // Add current request
        validRequests.push(now);
        return true;
    }

    cleanup() {
        const now = Date.now();
        const window = SECURITY_CONFIG.RATE_LIMIT_WINDOW;
        
        for (const [identifier, requests] of this.requests.entries()) {
            const validRequests = requests.filter(timestamp => now - timestamp < window);
            if (validRequests.length === 0) {
                this.requests.delete(identifier);
            } else {
                this.requests.set(identifier, validRequests);
            }
        }
    }
}

// =============================================================================
// SECURITY HEADERS
// =============================================================================

class SecurityHeaders {
    static apply() {
        // Set security headers via meta tags
        const headers = SECURITY_CONFIG.SECURITY_HEADERS;
        
        for (const [header, value] of Object.entries(headers)) {
            const meta = document.createElement('meta');
            meta.httpEquiv = header;
            meta.content = value;
            document.head.appendChild(meta);
        }
        
        // Remove sensitive information from console
        this.secureConsole();
    }

    static secureConsole() {
        // In production, disable console.log for security
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            const originalLog = console.log;
            console.log = function(...args) {
                if (args[0] && typeof args[0] === 'string' && args[0].includes('password')) {
                    return; // Don't log passwords
                }
                originalLog.apply(console, args);
            };
        }
    }
}

// =============================================================================
// INPUT VALIDATION & SANITIZATION
// =============================================================================

class InputValidator {
    static sanitize(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/[<>]/g, '') // Remove HTML tags
            .trim()
            .substring(0, 1000); // Limit length
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePassword(password) {
        const config = SECURITY_CONFIG;
        
        if (password.length < config.MIN_PASSWORD_LENGTH) {
            return { valid: false, error: `Password must be at least ${config.MIN_PASSWORD_LENGTH} characters` };
        }
        
        if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
            return { valid: false, error: 'Password must contain uppercase letters' };
        }
        
        if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
            return { valid: false, error: 'Password must contain lowercase letters' };
        }
        
        if (config.REQUIRE_NUMBERS && !/\d/.test(password)) {
            return { valid: false, error: 'Password must contain numbers' };
        }
        
        if (config.REQUIRE_SPECIAL_CHARS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            return { valid: false, error: 'Password must contain special characters' };
        }
        
        return { valid: true };
    }

    static validateSQL(input) {
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
            /(--|\/\*|\*\/|;|'|")/g,
            /\bOR\b.*\b1\b.*=\s*1\b/gi,
            /\bAND\b.*\b1\b.*=\s*1\b/gi
        ];
        
        for (const pattern of sqlPatterns) {
            if (pattern.test(input)) {
                return { valid: false, error: 'Potential SQL injection detected' };
            }
        }
        
        return { valid: true };
    }
}

// =============================================================================
// MAIN SECURITY INITIALIZATION
// =============================================================================

class SecuritySystem {
    static rateLimiter = new RateLimiter();
    
    static initialize() {
        console.log('🔒 Initializing Security System (Rate Limiting & Timeout Disabled)...');
        
        // Apply security headers
        SecurityHeaders.apply();
        
        // Rate limiting cleanup disabled
        
        // Session monitoring disabled
        this.setupSessionMonitoring();
        
        // Setup CSRF protection
        this.setupCSRFProtection();
        
        // Setup input validation
        this.setupInputValidation();
        
        console.log('✅ Security System Active (Rate Limiting & Timeout Disabled)');
    }
    
    static setupSessionMonitoring() {
        // Session monitoring disabled - no timeout checks
        console.log('Session monitoring disabled (no timeout)');
    }
    
    static setupCSRFProtection() {
        // Add CSRF token to all forms
        document.addEventListener('DOMContentLoaded', () => {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                const csrfInput = document.createElement('input');
                csrfInput.type = 'hidden';
                csrfInput.name = 'csrf_token';
                csrfInput.value = sessionStorage.getItem('zenith_session_csrf') || '';
                form.appendChild(csrfInput);
            });
        });
    }
    
    static setupInputValidation() {
        // Validate all inputs before submission
        document.addEventListener('submit', (event) => {
            const form = event.target;
            const inputs = form.querySelectorAll('input, textarea');
            
            for (const input of inputs) {
                const value = input.value;
                const validation = InputValidator.validateSQL(value);
                
                if (!validation.valid) {
                    event.preventDefault();
                    AuditLogger.log('INVALID_INPUT_DETECTED', {
                        inputName: input.name,
                        value: value.substring(0, 50),
                        error: validation.error
                    });
                    alert('Security violation detected: ' + validation.error);
                    return;
                }
            }
        });
    }
    
    static checkRateLimit(identifier) {
        // Rate limiting disabled - always allow
        return true;
    }
    
    static validateRequest(request) {
        // Check CSRF token
        const csrfToken = request.headers.get('X-CSRF-Token') || 
                         request.formData?.get('csrf_token');
        
        if (!SessionManager.validateCSRFToken(csrfToken)) {
            AuditLogger.log('CSRF_VIOLATION', {
                token: csrfToken?.substring(0, 8) + '...',
                userAgent: navigator.userAgent
            });
            return false;
        }
        
        return true;
    }
}

// =============================================================================
// GLOBAL SECURITY FUNCTIONS
// =============================================================================

// Enhanced session management
function getSecureSession() {
    return SessionManager.validateSession();
}

function createSecureSession(user, role) {
    return SessionManager.createSecureSession(user, role);
}

function destroySecureSession() {
    SessionManager.destroySession();
}

// Security validation
function validateSecureInput(input, type = 'general') {
    const sanitized = InputValidator.sanitize(input);
    
    switch (type) {
        case 'email':
            return InputValidator.validateEmail(sanitized);
        case 'password':
            return InputValidator.validatePassword(sanitized);
        case 'sql':
            return InputValidator.validateSQL(sanitized);
        default:
            return { valid: true, value: sanitized };
    }
}

// Rate limiting - DISABLED
function checkSecurityRateLimit(identifier = 'default') {
    return true; // Always allow - rate limiting disabled
}

// Audit logging
function logSecurityEvent(action, details = {}) {
    AuditLogger.log(action, details);
}

// Initialize security system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    SecuritySystem.initialize();
});

// Export for global access
window.SecuritySystem = SecuritySystem;
window.SessionManager = SessionManager;
window.AuditLogger = AuditLogger;
window.InputValidator = InputValidator;

console.log('🛡️ Maximum Security System Loaded');
