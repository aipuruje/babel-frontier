// ========== INPUT VALIDATION & SANITIZATION ==========
// Prevents injection attacks, XSS, and malicious input

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} input - User input string
 * @returns {string} - Sanitized string
 */
export function sanitizeHTML(input) {
    if (typeof input !== 'string') return input;

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Validate email address
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (E.164 format)
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
}

/**
 * Validate user ID (alphanumeric + underscore only)
 * @param {string} userId
 * @returns {boolean}
 */
export function isValidUserId(userId) {
    const userIdRegex = /^[a-zA-Z0-9_]{1,50}$/;
    return userIdRegex.test(userId);
}

/**
 * Validate region name (letters, spaces, hyphens only)
 * @param {string} region
 * @returns {boolean}
 */
export function isValidRegion(region) {
    const regionRegex = /^[a-zA-Z\s-]{1,50}$/;
    return regionRegex.test(region);
}

/**
 * Detect SQL injection patterns (paranoid mode)
 * @param {string} input
 * @returns {boolean} - True if suspicious
 */
export function containsSQLInjection(input) {
    if (typeof input !== 'string') return false;

    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
        /(UNION.*SELECT)/i,
        /('|(\\')|(;)|(--)|(\/\*))/,
        /(OR\s+1\s*=\s*1)/i,
        /(AND\s+1\s*=\s*1)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect NoSQL injection patterns
 * @param {string} input
 * @returns {boolean} - True if suspicious
 */
export function containsNoSQLInjection(input) {
    if (typeof input !== 'string') return false;

    const nosqlPatterns = [
        /\$where/i,
        /\$ne/i,
        /\$gt/i,
        /\$regex/i
    ];

    return nosqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Detect command injection patterns
 * @param {string} input
 * @returns {boolean} - True if suspicious
 */
export function containsCommandInjection(input) {
    if (typeof input !== 'string') return false;

    const commandPatterns = [
        /[;&|`$()]/,
        /\.\.\//,
        /(bash|sh|cmd|powershell)/i
    ];

    return commandPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate string length
 * @param {string} input
 * @param {number} maxLength
 * @returns {boolean}
 */
export function isValidLength(input, maxLength) {
    return typeof input === 'string' && input.length <= maxLength;
}

/**
 * Comprehensive input validation
 * @param {Object} data - Input data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} - { valid: boolean, errors: Array, sanitized: Object }
 */
export function validateInput(data, schema) {
    const errors = [];
    const sanitized = {};

    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];

        // Check required fields
        if (rules.required && (value === undefined || value === null || value === '')) {
            errors.push(`${field} is required`);
            continue;
        }

        // Skip validation if field is optional and not provided
        if (!rules.required && (value === undefined || value === null)) {
            continue;
        }

        // Type validation
        if (rules.type && typeof value !== rules.type) {
            errors.push(`${field} must be of type ${rules.type}`);
            continue;
        }

        // String validations
        if (typeof value === 'string') {
            // Length validation
            if (rules.maxLength && !isValidLength(value, rules.maxLength)) {
                errors.push(`${field} exceeds maximum length of ${rules.maxLength}`);
            }

            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`${field} must be at least ${rules.minLength} characters`);
            }

            // Pattern validation
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(`${field} has invalid format`);
            }

            // Email validation
            if (rules.email && !isValidEmail(value)) {
                errors.push(`${field} must be a valid email address`);
            }

            // Phone validation
            if (rules.phone && !isValidPhone(value)) {
                errors.push(`${field} must be a valid phone number`);
            }

            // Injection detection
            if (containsSQLInjection(value)) {
                errors.push(`${field} contains potentially malicious content (SQL)`);
            }

            if (containsNoSQLInjection(value)) {
                errors.push(`${field} contains potentially malicious content (NoSQL)`);
            }

            if (containsCommandInjection(value)) {
                errors.push(`${field} contains potentially malicious content (Command)`);
            }

            // Sanitize HTML if specified
            if (rules.sanitizeHTML) {
                sanitized[field] = sanitizeHTML(value);
            } else {
                sanitized[field] = value;
            }
        } else {
            sanitized[field] = value;
        }

        // Number validations
        if (typeof value === 'number') {
            if (rules.min !== undefined && value < rules.min) {
                errors.push(`${field} must be at least ${rules.min}`);
            }

            if (rules.max !== undefined && value > rules.max) {
                errors.push(`${field} must be at most ${rules.max}`);
            }

            sanitized[field] = value;
        }

        // Array validations
        if (Array.isArray(value)) {
            if (rules.minItems && value.length < rules.minItems) {
                errors.push(`${field} must have at least ${rules.minItems} items`);
            }

            if (rules.maxItems && value.length > rules.maxItems) {
                errors.push(`${field} must have at most ${rules.maxItems} items`);
            }

            sanitized[field] = value;
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        sanitized
    };
}

/**
 * Common validation schemas
 */
export const SCHEMAS = {
    USER_REGISTRATION: {
        telegram_id: { required: true, type: 'string', pattern: /^\d+$/ },
        username: { required: false, type: 'string', maxLength: 50, sanitizeHTML: true },
        first_name: { required: false, type: 'string', maxLength: 50, sanitizeHTML: true },
        region: { required: false, type: 'string', maxLength: 50, pattern: /^[a-zA-Z\s-]+$/ }
    },

    WRITING_SUBMISSION: {
        essay: { required: true, type: 'string', minLength: 150, maxLength: 5000, sanitizeHTML: true },
        prompt: { required: false, type: 'string', maxLength: 500 },
        word_target: { required: false, type: 'number', min: 150, max: 500 }
    },

    PARTNER_REGISTRATION: {
        partner_type: { required: true, type: 'string', pattern: /^(government|university|ngo|corporate)$/ },
        organization_name: { required: true, type: 'string', maxLength: 100, sanitizeHTML: true },
        contact_email: { required: true, type: 'string', email: true },
        contact_phone: { required: false, type: 'string', phone: true }
    },

    PAYMENT_INITIATE: {
        product_id: { required: true, type: 'string', pattern: /^[a-zA-Z0-9_-]+$/ },
        amount: { required: true, type: 'number', min: 1000, max: 10000000 },
        user_id: { required: true, type: 'string', pattern: /^\d+$/ }
    }
};

/**
 * Validation middleware
 * @param {Object} schema - Validation schema
 * @returns {Function} - Middleware function
 */
export function validationMiddleware(schema) {
    return async (data) => {
        const result = validateInput(data, schema);

        if (!result.valid) {
            return {
                valid: false,
                status: 400,
                error: 'Validation failed',
                details: result.errors
            };
        }

        return {
            valid: true,
            sanitized: result.sanitized
        };
    };
}

export default {
    sanitizeHTML,
    isValidEmail,
    isValidPhone,
    isValidUserId,
    isValidRegion,
    containsSQLInjection,
    containsNoSQLInjection,
    containsCommandInjection,
    validateInput,
    validationMiddleware,
    SCHEMAS
};
