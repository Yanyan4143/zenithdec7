// Error Diagnostic Tool for ZenithLabs POS
// Helps identify the source of "bad request" errors

class ErrorDiagnostic {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.init();
    }
    
    init() {
        // Override console.error to catch all errors
        const originalError = console.error;
        console.error = (...args) => {
            this.errors.push({
                timestamp: new Date().toISOString(),
                message: args.join(' '),
                stack: new Error().stack
            });
            originalError.apply(console, args);
        };
        
        // Override console.warn to catch warnings
        const originalWarn = console.warn;
        console.warn = (...args) => {
            this.warnings.push({
                timestamp: new Date().toISOString(),
                message: args.join(' ')
            });
            originalWarn.apply(console, args);
        };
        
        // Listen for unhandled errors
        window.addEventListener('error', (event) => {
            this.errors.push({
                timestamp: new Date().toISOString(),
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });
        
        // Listen for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.errors.push({
                timestamp: new Date().toISOString(),
                message: `Unhandled Promise Rejection: ${event.reason}`,
                stack: event.reason?.stack
            });
        });
        
        // Check for common issues
        this.checkCommonIssues();
        
        console.log('🔍 Error Diagnostic Tool initialized');
    }
    
    checkCommonIssues() {
        // Check for missing DOM elements
        const criticalElements = [
            'connect-cloud-btn',
            'cloud-provider-select',
            'backup-to-cloud-btn',
            'cloud-status'
        ];
        
        criticalElements.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                this.warnings.push({
                    timestamp: new Date().toISOString(),
                    message: `Missing critical element: #${id}`
                });
            }
        });
        
        // Check for cloud storage configuration
        if (window.cloudStorageManager) {
            const config = window.cloudStorageManager.providers;
            if (config.googledrive.clientId === 'YOUR_GOOGLE_CLIENT_ID') {
                this.warnings.push({
                    timestamp: new Date().toISOString(),
                    message: 'Cloud storage credentials not configured (using placeholder values)'
                });
            }
        } else {
            this.warnings.push({
                timestamp: new Date().toISOString(),
                message: 'Cloud storage manager not initialized'
            });
        }
        
        // Check for required scripts
        const requiredScripts = [
            'https://accounts.google.com/gsi/client',
            'cloud-storage.js'
        ];
        
        requiredScripts.forEach(src => {
            const script = Array.from(document.scripts).find(s => s.src?.includes(src));
            if (!script) {
                this.warnings.push({
                    timestamp: new Date().toISOString(),
                    message: `Missing required script: ${src}`
                });
            }
        });
    }
    
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            errors: this.errors,
            warnings: this.warnings,
            summary: {
                totalErrors: this.errors.length,
                totalWarnings: this.warnings.length,
                hasCloudStorageIssues: this.warnings.some(w => w.message.includes('cloud')),
                hasMissingElements: this.warnings.some(w => w.message.includes('Missing critical element'))
            }
        };
        
        return report;
    }
    
    showReport() {
        const report = this.generateReport();
        
        console.log('📋 ERROR DIAGNOSTIC REPORT');
        console.log('==========================');
        console.log(`Timestamp: ${report.timestamp}`);
        console.log(`URL: ${report.url}`);
        console.log(`Errors: ${report.summary.totalErrors}`);
        console.log(`Warnings: ${report.summary.totalWarnings}`);
        
        if (report.summary.totalErrors > 0) {
            console.log('\n❌ ERRORS:');
            report.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.timestamp}`);
                console.log(`   Message: ${error.message}`);
                if (error.stack) console.log(`   Stack: ${error.stack}`);
            });
        }
        
        if (report.summary.totalWarnings > 0) {
            console.log('\n⚠️ WARNINGS:');
            report.warnings.forEach((warning, index) => {
                console.log(`${index + 1}. ${warning.timestamp}`);
                console.log(`   Message: ${warning.message}`);
            });
        }
        
        // Show recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        if (report.summary.hasCloudStorageIssues) {
            console.log('- Configure cloud storage credentials or disable cloud storage');
        }
        if (report.summary.hasMissingElements) {
            console.log('- Check HTML for missing cloud storage elements');
        }
        if (report.summary.totalErrors > 0) {
            console.log('- Fix JavaScript errors to prevent "bad request" issues');
        }
        
        return report;
    }
    
    downloadReport() {
        const report = this.generateReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pos-error-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize diagnostic tool
let errorDiagnostic;

document.addEventListener('DOMContentLoaded', () => {
    errorDiagnostic = new ErrorDiagnostic();
    
    // Make it globally accessible
    window.errorDiagnostic = errorDiagnostic;
    
    // Add keyboard shortcut to show report (Ctrl+Shift+D)
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'D') {
            event.preventDefault();
            errorDiagnostic.showReport();
        }
    });
    
    // Show report after 5 seconds if there are issues
    setTimeout(() => {
        const report = errorDiagnostic.generateReport();
        if (report.summary.totalErrors > 0 || report.summary.totalWarnings > 0) {
            console.log('🔍 Issues detected! Press Ctrl+Shift+D to see diagnostic report');
        }
    }, 5000);
});
