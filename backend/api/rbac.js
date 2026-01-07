// ========== ROLE-BASED ACCESS CONTROL (RBAC) ==========
// Enforces permissions based on user roles

/**
 * User roles and their permission levels
 */
export const ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin',
    PARTNER: 'partner'
};

/**
 * Permission matrix defining what each role can access
 */
const PERMISSIONS = {
    // User management
    'user:read:own': [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],
    'user:read:all': [ROLES.TEACHER, ROLES.ADMIN],
    'user:update:own': [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],
    'user:update:all': [ROLES.ADMIN],
    'user:delete': [ROLES.ADMIN],

    // Content management
    'content:read': [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],
    'content:create': [ROLES.TEACHER, ROLES.ADMIN],
    'content:update': [ROLES.TEACHER, ROLES.ADMIN],
    'content:delete': [ROLES.ADMIN],

    // Events
    'events:read': [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],
    'events:create': [ROLES.TEACHER, ROLES.ADMIN],
    'events:manage': [ROLES.ADMIN],

    // Analytics & Reports
    'analytics:personal': [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],
    'analytics:all_users': [ROLES.TEACHER, ROLES.ADMIN],
    'analytics:regional': [ROLES.ADMIN],

    // B2B APIs (Sultan's API)
    'sultan:government:heatmap': [ROLES.PARTNER], // Requires government scope
    'sultan:university:profiles': [ROLES.PARTNER], // Requires university scope
    'sultan:partner:manage': [ROLES.ADMIN],

    // Hive & Collective Intelligence
    'hive:aggregate': [ROLES.ADMIN],
    'hive:view': [ROLES.TEACHER, ROLES.ADMIN],
    'hive:regional_events': [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],

    // Payment & Transactions
    'payment:initiate': [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],
    'payment:refund': [ROLES.ADMIN],
    'payment:view:own': [ROLES.STUDENT, ROLES.TEACHER, ROLES.ADMIN],
    'payment:view:all': [ROLES.ADMIN],

    // Admin operations
    'admin:system': [ROLES.ADMIN]
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if role has permission
 */
export function hasPermission(role, permission) {
    const allowedRoles = PERMISSIONS[permission];
    return allowedRoles && allowedRoles.includes(role);
}

/**
 * Check if user can access a resource
 * @param {Object} user - User object with role
 * @param {string} permission - Permission required
 * @param {string} resourceUserId - Owner of the resource (for 'own' permissions)
 * @returns {boolean} - True if access allowed
 */
export function canAccess(user, permission, resourceUserId = null) {
    // For 'own' permissions, check if user is accessing their own resource
    if (permission.endsWith(':own')) {
        if (user.role === ROLES.ADMIN) {
            // Admins can access all
            return true;
        }
        if (resourceUserId && user.user_id !== resourceUserId) {
            // User trying to access someone else's resource
            return false;
        }
    }

    return hasPermission(user.role, permission);
}

/**
 * RBAC middleware - enforces role-based permissions
 * @param {string} requiredPermission - Permission required for this endpoint
 * @returns {Function} - Middleware function
 */
export function requirePermission(requiredPermission) {
    return async (request, user, resourceUserId = null) => {
        if (!user || !user.role) {
            return {
                authorized: false,
                error: 'Authentication required',
                status: 401
            };
        }

        const allowed = canAccess(user, requiredPermission, resourceUserId);

        if (!allowed) {
            return {
                authorized: false,
                error: 'Insufficient permissions',
                status: 403,
                required: requiredPermission,
                userRole: user.role
            };
        }

        return {
            authorized: true
        };
    };
}

/**
 * Partner scope validation for B2B APIs
 * @param {Object} partner - Partner object from database
 * @param {string} requiredScope - Scope required (e.g., 'elite_profiles')
 * @returns {boolean} - True if partner has the scope
 */
export function hasPartnerScope(partner, requiredScope) {
    try {
        const scopes = JSON.parse(partner.access_scopes || '[]');
        return scopes.includes(requiredScope);
    } catch (error) {
        console.error('Error parsing partner scopes:', error);
        return false;
    }
}

/**
 * Validate B2B partner access
 * @param {Object} partner - Partner object
 * @param {string} requiredScope - Required scope
 * @returns {Object} - { authorized: boolean, error?: string }
 */
export function validatePartnerAccess(partner, requiredScope) {
    // Check if partner is active
    if (partner.status !== 'active') {
        return {
            authorized: false,
            error: 'Partner account is not active',
            status: 403
        };
    }

    // Check subscription expiry
    if (partner.subscription_expires) {
        const expiryDate = new Date(partner.subscription_expires);
        if (expiryDate < new Date()) {
            return {
                authorized: false,
                error: 'Subscription expired',
                status: 402 // Payment Required
            };
        }
    }

    // Check API call limit
    if (partner.api_calls_this_month >= partner.api_call_limit) {
        return {
            authorized: false,
            error: 'API call limit exceeded',
            status: 429 // Too Many Requests
        };
    }

    // Check scope
    if (!hasPartnerScope(partner, requiredScope)) {
        return {
            authorized: false,
            error: `Access denied. Required scope: ${requiredScope}`,
            status: 403
        };
    }

    return { authorized: true };
}

/**
 * Update database schema to add role column if not exists
 */
export const SCHEMA_UPDATE = `
-- Add role column to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student';

-- Create index on role for faster queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
`;

export default {
    ROLES,
    hasPermission,
    canAccess,
    requirePermission,
    hasPartnerScope,
    validatePartnerAccess,
    SCHEMA_UPDATE
};
