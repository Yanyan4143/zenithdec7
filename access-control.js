// access-control.js - Role-Based Access Control (RBAC) System
// Maximum security with granular permissions and audit logging

class AccessControlSystem {
    constructor() {
        this.permissions = this.definePermissions();
        this.roles = this.defineRoles();
        this.userPermissions = new Map();
        this.auditLogger = AuditLogger;
    }

    definePermissions() {
        return {
            // Dashboard permissions
            'dashboard.view': 'View dashboard',
            'dashboard.analytics': 'View advanced analytics',
            'dashboard.reports': 'Generate reports',
            
            // Inventory permissions
            'inventory.view': 'View inventory',
            'inventory.add': 'Add inventory items',
            'inventory.edit': 'Edit inventory items',
            'inventory.delete': 'Delete inventory items',
            'inventory.import': 'Import inventory',
            'inventory.export': 'Export inventory',
            
            // Sales permissions
            'sales.view': 'View sales history',
            'sales.create': 'Create sales',
            'sales.void': 'Void sales',
            'sales.refund': 'Process refunds',
            'sales.discount': 'Apply discounts',
            'sales.reports': 'View sales reports',
            
            // Financial permissions
            'financial.view': 'View financial data',
            'financial.edit': 'Edit financial data',
            'financial.expenses': 'Manage expenses',
            'financial.reports': 'View financial reports',
            'financial.export': 'Export financial data',
            
            // User management permissions
            'users.view': 'View users',
            'users.create': 'Create users',
            'users.edit': 'Edit users',
            'users.delete': 'Delete users',
            'users.permissions': 'Manage permissions',
            
            // System permissions
            'system.settings': 'Access system settings',
            'system.backup': 'Perform system backup',
            'system.restore': 'Perform system restore',
            'system.audit': 'View audit logs',
            'system.security': 'Manage security settings',
            
            // Supplier permissions
            'suppliers.view': 'View suppliers',
            'suppliers.add': 'Add suppliers',
            'suppliers.edit': 'Edit suppliers',
            'suppliers.delete': 'Delete suppliers',
            
            // Hardware permissions
            'hardware.view': 'View hardware status',
            'hardware.manage': 'Manage hardware devices',
            'hardware.print': 'Print receipts',
            
            // Premium features permissions
            'premium.analytics': 'Access premium analytics',
            'premium.employees': 'Manage employees',
            'premium.intelligence': 'Access business intelligence',
            'premium.reports': 'Generate advanced reports'
        };
    }

    defineRoles() {
        return {
            'admin': {
                name: 'Administrator',
                permissions: Object.keys(this.permissions), // All permissions
                level: 100,
                description: 'Full system access'
            },
            'manager': {
                name: 'Manager',
                permissions: [
                    'dashboard.view', 'dashboard.analytics', 'dashboard.reports',
                    'inventory.view', 'inventory.add', 'inventory.edit', 'inventory.import', 'inventory.export',
                    'sales.view', 'sales.create', 'sales.void', 'sales.discount', 'sales.reports',
                    'financial.view', 'financial.expenses', 'financial.reports', 'financial.export',
                    'users.view', 'users.edit',
                    'suppliers.view', 'suppliers.add', 'suppliers.edit',
                    'hardware.view', 'hardware.print',
                    'premium.analytics', 'premium.employees', 'premium.intelligence', 'premium.reports'
                ],
                level: 80,
                description: 'Management access with limited system controls'
            },
            'cashier': {
                name: 'Cashier',
                permissions: [
                    'dashboard.view',
                    'inventory.view',
                    'sales.view', 'sales.create', 'sales.discount',
                    'hardware.view', 'hardware.print'
                ],
                level: 40,
                description: 'Point of sale operations'
            },
            'viewer': {
                name: 'Viewer',
                permissions: [
                    'dashboard.view',
                    'inventory.view',
                    'sales.view',
                    'financial.view',
                    'suppliers.view',
                    'hardware.view'
                ],
                level: 20,
                description: 'Read-only access'
            }
        };
    }

    hasPermission(userRole, permission) {
        const role = this.roles[userRole];
        if (!role) {
            this.auditLogger.log('ACCESS_DENIED', {
                reason: 'Invalid role',
                userRole: userRole,
                permission: permission
            });
            return false;
        }

        const hasPermission = role.permissions.includes(permission);
        
        if (!hasPermission) {
            this.auditLogger.log('ACCESS_DENIED', {
                reason: 'Insufficient permissions',
                userRole: userRole,
                permission: permission,
                roleLevel: role.level
            });
        } else {
            this.auditLogger.log('ACCESS_GRANTED', {
                userRole: userRole,
                permission: permission,
                roleLevel: role.level
            });
        }

        return hasPermission;
    }

    checkElementAccess(element, userRole) {
        const requiredPermission = element.dataset.permission;
        if (!requiredPermission) return true;

        return this.hasPermission(userRole, requiredPermission);
    }

    enforceAccessControl(userRole) {
        // Hide/disable elements based on permissions
        const elements = document.querySelectorAll('[data-permission]');
        
        elements.forEach(element => {
            const hasAccess = this.checkElementAccess(element, userRole);
            
            if (!hasAccess) {
                // Different handling for different element types
                if (element.tagName === 'BUTTON' || element.tagName === 'A') {
                    element.disabled = true;
                    element.style.opacity = '0.5';
                    element.style.cursor = 'not-allowed';
                    element.title = 'Access denied: insufficient permissions';
                } else if (element.tagName === 'DIV' || element.tagName === 'SECTION') {
                    element.style.display = 'none';
                } else if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
                    element.disabled = true;
                    element.readOnly = true;
                    element.style.backgroundColor = '#f5f5f5';
                }
            }
        });

        // Hide entire menu sections
        const menuSections = document.querySelectorAll('[data-role-permission]');
        menuSections.forEach(section => {
            const requiredPermission = section.dataset.rolePermission;
            if (!this.hasPermission(userRole, requiredPermission)) {
                section.style.display = 'none';
            }
        });
    }

    getRolePermissions(userRole) {
        const role = this.roles[userRole];
        return role ? role.permissions : [];
    }

    getUserPermissions(userId) {
        return this.userPermissions.get(userId) || [];
    }

    assignUserPermission(userId, permission) {
        if (!this.userPermissions.has(userId)) {
            this.userPermissions.set(userId, []);
        }
        
        const userPerms = this.userPermissions.get(userId);
        if (!userPerms.includes(permission)) {
            userPerms.push(permission);
            this.auditLogger.log('PERMISSION_ASSIGNED', {
                userId: userId,
                permission: permission
            });
        }
    }

    removeUserPermission(userId, permission) {
        const userPerms = this.userPermissions.get(userId);
        if (userPerms) {
            const index = userPerms.indexOf(permission);
            if (index > -1) {
                userPerms.splice(index, 1);
                this.auditLogger.log('PERMISSION_REMOVED', {
                    userId: userId,
                    permission: permission
                });
            }
        }
    }

    validateAction(action, userRole, context = {}) {
        const permissionMap = {
            'add_inventory': 'inventory.add',
            'edit_inventory': 'inventory.edit',
            'delete_inventory': 'inventory.delete',
            'create_sale': 'sales.create',
            'void_sale': 'sales.void',
            'add_expense': 'financial.expenses',
            'edit_user': 'users.edit',
            'view_reports': 'dashboard.reports',
            'system_settings': 'system.settings',
            'manage_suppliers': 'suppliers.edit',
            'print_receipt': 'hardware.print'
        };

        const requiredPermission = permissionMap[action];
        if (!requiredPermission) {
            this.auditLogger.log('UNKNOWN_ACTION', {
                action: action,
                userRole: userRole,
                context: context
            });
            return false;
        }

        const hasPermission = this.hasPermission(userRole, requiredPermission);
        
        if (hasPermission) {
            this.auditLogger.log('ACTION_VALIDATED', {
                action: action,
                userRole: userRole,
                permission: requiredPermission,
                context: context
            });
        }

        return hasPermission;
    }

    createSecureEndpoint(endpoint, requiredPermission) {
        return async (req, res) => {
            const session = getSecureSession();
            if (!session) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            if (!this.hasPermission(session.role, requiredPermission)) {
                res.status(403).json({ error: 'Forbidden - insufficient permissions' });
                return;
            }

            // Log the access attempt
            this.auditLogger.log('ENDPOINT_ACCESSED', {
                endpoint: endpoint,
                userRole: session.role,
                permission: requiredPermission,
                timestamp: new Date().toISOString()
            });

            // Continue with the actual endpoint logic
            return true;
        };
    }

    generatePermissionReport() {
        const report = {
            generatedAt: new Date().toISOString(),
            roles: {},
            permissions: this.permissions
        };

        for (const [roleId, role] of Object.entries(this.roles)) {
            report.roles[roleId] = {
                name: role.name,
                level: role.level,
                description: role.description,
                permissionCount: role.permissions.length,
                permissions: role.permissions.map(perm => ({
                    name: perm,
                    description: this.permissions[perm] || 'No description'
                }))
            };
        }

        return report;
    }

    auditUserAccess(userId, action, result) {
        this.auditLogger.log('USER_ACTION_AUDIT', {
            userId: userId,
            action: action,
            result: result,
            timestamp: new Date().toISOString()
        });
    }

    // Middleware for route protection
    protectRoute(requiredPermission) {
        return (req, res, next) => {
            const session = getSecureSession();
            
            if (!session) {
                res.redirect('/index.html');
                return;
            }

            if (!this.hasPermission(session.role, requiredPermission)) {
                res.status(403).send('Access Denied');
                return;
            }

            next();
        };
    }

    // Real-time permission checking
    setupRealTimePermissionChecking() {
        // Monitor DOM changes for new elements that need permission checking
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const elementsWithPermissions = node.querySelectorAll ? 
                            node.querySelectorAll('[data-permission]') : [];
                        
                        elementsWithPermissions.forEach(element => {
                            const session = getSecureSession();
                            if (session) {
                                const hasAccess = this.checkElementAccess(element, session.role);
                                if (!hasAccess) {
                                    element.style.display = 'none';
                                }
                            }
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}

// Initialize Access Control System
window.AccessControl = new AccessControlSystem();

// Helper functions for common access control tasks
function requirePermission(permission) {
    const session = getSecureSession();
    if (!session || !window.AccessControl.hasPermission(session.role, permission)) {
        throw new Error(`Access denied: ${permission} required`);
    }
}

function secureElement(elementId, permission) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const session = getSecureSession();
    if (!session || !window.AccessControl.hasPermission(session.role, permission)) {
        element.style.display = 'none';
        element.disabled = true;
    }
}

function secureAction(action, callback) {
    return function(...args) {
        const session = getSecureSession();
        if (!session || !window.AccessControl.validateAction(action, session.role)) {
            alert('Access denied: insufficient permissions');
            return;
        }
        return callback.apply(this, args);
    };
}

// Initialize access control when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const session = getSecureSession();
    if (session) {
        window.AccessControl.enforceAccessControl(session.role);
        window.AccessControl.setupRealTimePermissionChecking();
        
        console.log(`🔐 Access Control initialized for role: ${session.role}`);
    }
});

// Export for global access
window.requirePermission = requirePermission;
window.secureElement = secureElement;
window.secureAction = secureAction;

console.log('🛡️ Access Control System Loaded');
