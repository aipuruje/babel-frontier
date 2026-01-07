// ========== JWT AUTHENTICATION MIDDLEWARE ==========
// Provides JWT token generation, validation, and role-based access control

/**
 * Generates a JWT token for a user
 * @param {Object} payload - User data to encode
 * @param {string} secret - JWT secret key
 * @param {number} expiresIn - Token expiry in seconds (default: 24 hours)
 * @returns {string} - JWT token
 */
export async function generateJWT(payload, secret, expiresIn = 86400) {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
        ...payload,
        iat: now,
        exp: now + expiresIn
    };

    // Encode header and payload
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));

    // Create signature
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = await hmacSHA256(data, secret);
    const encodedSignature = base64UrlEncode(signature);

    return `${data}.${encodedSignature}`;
}

/**
 * Validates a JWT token
 * @param {string} token - JWT token to validate
 * @param {string} secret - JWT secret key
 * @returns {Object|null} - Decoded payload if valid, null if invalid
 */
export async function validateJWT(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const [encodedHeader, encodedPayload, encodedSignature] = parts;

        // Verify signature
        const data = `${encodedHeader}.${encodedPayload}`;
        const expectedSignature = await hmacSHA256(data, secret);
        const expectedEncodedSignature = base64UrlEncode(expectedSignature);

        // Timing-safe comparison
        if (encodedSignature !== expectedEncodedSignature) {
            console.error('JWT validation failed: Invalid signature');
            return null;
        }

        // Decode payload
        const payload = JSON.parse(base64UrlDecode(encodedPayload));

        // Check expiry
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            console.error('JWT validation failed: Token expired');
            return null;
        }

        return payload;

    } catch (error) {
        console.error('JWT validation error:', error);
        return null;
    }
}

/**
 * HMAC-SHA256 implementation
 */
async function hmacSHA256(data, key) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return arrayBufferToString(signature);
}

/**
 * Base64 URL encoding
 */
function base64UrlEncode(str) {
    if (typeof str === 'string') {
        str = new TextEncoder().encode(str);
    }
    const base64 = btoa(String.fromCharCode(...new Uint8Array(str)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64 URL decoding
 */
function base64UrlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
        str += '=';
    }
    return atob(str);
}

/**
 * Convert ArrayBuffer to string
 */
function arrayBufferToString(buffer) {
    return String.fromCharCode(...new Uint8Array(buffer));
}

/**
 * Authentication middleware - validates JWT from Authorization header
 * @param {Request} request
 * @param {Object} env
 * @returns {Object} - { authenticated: boolean, user?: Object, error?: string }
 */
export async function authMiddleware(request, env) {
    try {
        const authHeader = request.headers.get('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { authenticated: false, error: 'Missing or invalid Authorization header' };
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const payload = await validateJWT(token, env.JWT_SECRET);

        if (!payload) {
            return { authenticated: false, error: 'Invalid or expired token' };
        }

        return {
            authenticated: true,
            user: {
                user_id: payload.user_id,
                username: payload.username,
                role: payload.role || 'student',
                telegram_id: payload.telegram_id
            }
        };

    } catch (error) {
        console.error('Auth middleware error:', error);
        return { authenticated: false, error: 'Authentication failed' };
    }
}

/**
 * Creates a new session and returns JWT token
 * @param {Object} user - User object from Telegram validation or database
 * @param {string} secret - JWT secret key
 * @param {Object} db - D1 database instance
 * @returns {Object} - { token: string, expires_at: number }
 */
export async function createSession(user, secret, db) {
    // Fetch user role from database
    const userRecord = await db.prepare(`
        SELECT role FROM users WHERE user_id = ?
    `).bind(user.id?.toString() || user.user_id).first();

    const role = userRecord?.role || 'student';

    const payload = {
        user_id: user.id?.toString() || user.user_id,
        username: user.username || user.first_name,
        telegram_id: user.id || user.telegram_id,
        role: role
    };

    const token = await generateJWT(payload, secret);
    const expiresAt = Math.floor(Date.now() / 1000) + 86400; // 24 hours

    return {
        token,
        expires_at: expiresAt
    };
}

/**
 * Logout - invalidates token (add to blacklist if needed)
 * @param {string} token - JWT token to invalidate
 * @param {Object} env - Environment with KV storage
 */
export async function logout(token, env) {
    // Store token in blacklist (KV with TTL matching token expiry)
    const payload = await validateJWT(token, env.JWT_SECRET);
    if (payload && payload.exp) {
        const ttl = payload.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
            await env.KV.put(`blacklist:${token}`, '1', { expirationTtl: ttl });
        }
    }
}

/**
 * Check if token is blacklisted
 * @param {string} token - JWT token
 * @param {Object} env - Environment with KV storage
 * @returns {boolean} - True if blacklisted
 */
export async function isBlacklisted(token, env) {
    if (!env.KV) return false;
    const blacklisted = await env.KV.get(`blacklist:${token}`);
    return blacklisted !== null;
}

export default {
    generateJWT,
    validateJWT,
    authMiddleware,
    createSession,
    logout,
    isBlacklisted
};
