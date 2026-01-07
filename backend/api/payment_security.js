// ========== PAYMENT SECURITY ==========
// PCI-DSS aligned payment webhook verification and fraud detection

/**
 * Verify Click.uz webhook signature
 * @param {Object} data - Webhook payload
 * @param {string} signature - Signature from Click-Signature header
 * @param {string} secretKey - Click merchant secret key
 * @returns {boolean} - True if valid
 */
export async function verifyClickSignature(data, signature, secretKey) {
    try {
        // Click.uz signature format: HMAC-SHA256(sorted_params, secret_key)
        const params = [];
        const keys = Object.keys(data).sort();

        for (const key of keys) {
            if (key !== 'sign' && key !== 'signature') {
                params.push(`${key}=${data[key]}`);
            }
        }

        const dataString = params.join('|');
        const computed = await hmacSHA256(dataString, secretKey);

        // Timing-safe comparison
        return timingSafeEqual(computed, signature);

    } catch (error) {
        console.error('Click signature verification error:', error);
        return false;
    }
}

/**
 * Verify Payme webhook signature
 * @param {Request} request - Request object
 * @param {string} password - Payme merchant password
 * @returns {boolean} - True if valid
 */
export function verifyPaymeSignature(request, password) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return false;
        }

        // Payme uses Basic auth: "Paycom:{password}"
        const decoded = atob(authHeader.replace('Basic ', ''));
        const expected = `Paycom:${password}`;

        return timingSafeEqual(decoded, expected);

    } catch (error) {
        console.error('Payme signature verification error:', error);
        return false;
    }
}

/**
 * HMAC-SHA256 helper
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
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

/**
 * Check for duplicate transaction (idempotency)
 * @param {string} transactionId - Transaction ID from payment provider
 * @param {Object} db - D1 database
 * @returns {boolean} - True if duplicate
 */
export async function isDuplicateTransaction(transactionId, db) {
    const existing = await db.prepare(`
        SELECT id FROM user_transactions 
        WHERE transaction_id = ? 
        AND created_at > datetime('now', '-24 hours')
    `).bind(transactionId).first();

    return existing !== null;
}

/**
 * Fraud detection rules
 */
export const FRAUD_RULES = {
    MAX_DAILY_AMOUNT: 5000000, // 5M UZS per day per user
    MAX_TRANSACTION_COUNT: 10, // 10 transactions per day
    VELOCITY_THRESHOLD: 3,      // Max 3 transactions in 5 minutes
    MAX_SINGLE_TRANSACTION: 2000000, // 2M UZS single transaction
    SUSPICIOUS_AMOUNTS: [100000, 500000, 1000000] // Common fraud amounts
};

/**
 * Check for fraudulent transaction patterns
 * @param {string} userId - User ID
 * @param {number} amount - Transaction amount in UZS
 * @param {Object} db - D1 database
 * @returns {Object} - { fraud: boolean, reason?: string }
 */
export async function detectFraud(userId, amount, db) {
    try {
        // Check single transaction limit
        if (amount > FRAUD_RULES.MAX_SINGLE_TRANSACTION) {
            return {
                fraud: true,
                reason: 'Transaction amount exceeds limit',
                severity: 'HIGH'
            };
        }

        // Check daily total amount
        const dailyTotal = await db.prepare(`
            SELECT SUM(amount) as total
            FROM user_transactions
            WHERE user_id = ?
            AND created_at > datetime('now', '-1 day')
            AND status = 'completed'
        `).bind(userId).first();

        if (dailyTotal?.total && dailyTotal.total + amount > FRAUD_RULES.MAX_DAILY_AMOUNT) {
            return {
                fraud: true,
                reason: 'Daily transaction limit exceeded',
                severity: 'HIGH'
            };
        }

        // Check daily transaction count
        const dailyCount = await db.prepare(`
            SELECT COUNT(*) as count
            FROM user_transactions
            WHERE user_id = ?
            AND created_at > datetime('now', '-1 day')
        `).bind(userId).first();

        if (dailyCount?.count >= FRAUD_RULES.MAX_TRANSACTION_COUNT) {
            return {
                fraud: true,
                reason: 'Too many transactions in 24 hours',
                severity: 'MEDIUM'
            };
        }

        // Check velocity (transactions in last 5 minutes)
        const recentCount = await db.prepare(`
            SELECT COUNT(*) as count
            FROM user_transactions
            WHERE user_id = ?
            AND created_at > datetime('now', '-5 minutes')
        `).bind(userId).first();

        if (recentCount?.count >= FRAUD_RULES.VELOCITY_THRESHOLD) {
            return {
                fraud: true,
                reason: 'Transaction velocity too high',
                severity: 'HIGH'
            };
        }

        // Check for suspicious round amounts
        if (FRAUD_RULES.SUSPICIOUS_AMOUNTS.includes(amount)) {
            // Not blocking, but flagging for review
            return {
                fraud: false,
                flagged: true,
                reason: 'Suspicious round amount - flagged for review',
                severity: 'LOW'
            };
        }

        return { fraud: false };

    } catch (error) {
        console.error('Fraud detection error:', error);
        // Fail open to avoid blocking legitimate transactions
        return { fraud: false, error: error.message };
    }
}

/**
 * Log security event for payment fraud attempt
 * @param {string} userId
 * @param {number} amount
 * @param {string} reason
 * @param {Object} db
 */
export async function logFraudAttempt(userId, amount, reason, db) {
    await db.prepare(`
        INSERT INTO security_audit_logs (
            event_type, user_id, action, resource, severity
        ) VALUES (?, ?, ?, ?, ?)
    `).bind(
        'fraud_attempt',
        userId,
        `Blocked transaction: ${amount} UZS`,
        reason,
        'CRITICAL'
    ).run();
}

/**
 * Secure payment callback handler wrapper
 * @param {Request} request
 * @param {Function} handler - Payment processing function
 * @param {Object} env
 * @param {string} provider - 'click' or 'payme'
 * @returns {Response}
 */
export async function securePaymentCallback(request, handler, env, provider) {
    try {
        // Verify signature
        let verified = false;

        if (provider === 'click') {
            const data = await request.json();
            const signature = request.headers.get('Click-Signature');
            verified = await verifyClickSignature(data, signature, env.CLICK_SECRET_KEY);
        } else if (provider === 'payme') {
            verified = verifyPaymeSignature(request, env.PAYME_PASSWORD);
        }

        if (!verified) {
            // Log security incident
            await env.DB.prepare(`
                INSERT INTO security_audit_logs (
                    event_type, ip_address, action, severity
                ) VALUES (?, ?, ?, ?)
            `).bind(
                'payment_webhook_failed',
                request.headers.get('CF-Connecting-IP'),
                `Invalid ${provider} webhook signature`,
                'CRITICAL'
            ).run();

            return new Response(
                JSON.stringify({
                    error: 'Invalid signature',
                    code: 'SIGNATURE_VERIFICATION_FAILED'
                }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Call the actual payment handler
        return await handler(request, env);

    } catch (error) {
        console.error(`${provider} payment callback error:`, error);
        return new Response(
            JSON.stringify({ error: 'Payment processing failed' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * PCI-DSS compliance check: Never store card data
 * This function is a reminder/validator - returns error if card data detected
 */
export function validateNoCardData(data) {
    const cardPatterns = [
        /\b\d{13,19}\b/,  // Card numbers
        /\b\d{3,4}\b.*cvv/i,  // CVV
        /\bexp.*\d{2}\/\d{2,4}\b/i  // Expiry dates
    ];

    const dataStr = JSON.stringify(data);

    for (const pattern of cardPatterns) {
        if (pattern.test(dataStr)) {
            throw new Error('PCI-DSS VIOLATION: Card data detected in storage');
        }
    }
}

export default {
    verifyClickSignature,
    verifyPaymeSignature,
    isDuplicateTransaction,
    detectFraud,
    logFraudAttempt,
    securePaymentCallback,
    validateNoCardData,
    FRAUD_RULES
};
