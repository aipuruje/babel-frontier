// ========== SECURE API ENDPOINT EXAMPLE ==========
// Demonstrates how to integrate all security middleware
// This file shows the pattern to apply to all endpoints in index.js

import { telegramAuthMiddleware } from './telegram_auth.js';
import { authMiddleware, createSession, isBlacklisted } from './auth_middleware.js';
import { requirePermission, validatePartnerAccess } from './rbac.js';
import { rateLimitMiddleware } from './rate_limiter.js';
import { validateInput, SCHEMAS } from './input_validator.js';
import { securePaymentCallback, detectFraud } from './payment_security.js';

/**
 * EXAMPLE 1: Secure User Registration / Login
 * - Validates Telegram WebApp data
 * - Creates JWT session
 * - Returns auth token
 */
export async function handleSecureLogin(request, env, corsHeaders) {
    try {
        // Step 1: Validate Telegram WebApp authentication
        const telegramAuth = await telegramAuthMiddleware(request, env);

        if (!telegramAuth.valid) {
            return new Response(
                JSON.stringify({ error: telegramAuth.error }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const telegramUser = telegramAuth.user;

        // Step 2: Check rate limit (prevent brute force)
        const rateLimit = await rateLimitMiddleware(request, env, null);
        if (rateLimit.status) {
            return rateLimit; // 429 response
        }

        // Step 3: Find or create user in database
        let user = await env.DB.prepare(`
            SELECT user_id, username, role FROM users WHERE telegram_id = ?
        `).bind(telegramUser.id.toString()).first();

        if (!user) {
            // Create new user
            const result = await env.DB.prepare(`
                INSERT INTO users (user_id, telegram_id, username, first_name, role)
                VALUES (?, ?, ?, ?, 'student')
            `).bind(
                telegramUser.id.toString(),
                telegramUser.id.toString(),
                telegramUser.username || telegramUser.first_name,
                telegramUser.first_name
            ).run();

            user = {
                user_id: telegramUser.id.toString(),
                username: telegramUser.username || telegramUser.first_name,
                role: 'student'
            };
        }

        // Step 4: Create JWT session
        const session = await createSession(
            { ...telegramUser, user_id: user.user_id },
            env.JWT_SECRET,
            env.DB
        );

        // Step 5: Return auth token
        return new Response(
            JSON.stringify({
                success: true,
                token: session.token,
                expires_at: session.expires_at,
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    role: user.role
                }
            }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    ...rateLimit.headers // Add rate limit headers
                }
            }
        );

    } catch (error) {
        console.error('Secure login error:', error);
        return new Response(
            JSON.stringify({ error: 'Authentication failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * EXAMPLE 2: Secure Protected Endpoint (Writing Submission)
 * - Validates JWT token
 * - Checks RBAC permissions
 * - Rate limits
 * - Validates input
 * - Sanitizes data
 */
export async function handleSecureWritingSubmit(request, env, corsHeaders) {
    try {
        // Step 1: Authenticate user
        const auth = await authMiddleware(request, env);

        if (!auth.authenticated) {
            return new Response(
                JSON.stringify({ error: auth.error }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const user = auth.user;

        // Step 2: Check if token is blacklisted
        const token = request.headers.get('Authorization')?.substring(7);
        if (await isBlacklisted(token, env)) {
            return new Response(
                JSON.stringify({ error: 'Token has been revoked' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Step 3: Check RBAC permissions
        const permission = await requirePermission('content:create');
        const authz = await permission(request, user);

        if (!authz.authorized) {
            return new Response(
                JSON.stringify({ error: authz.error }),
                { status: authz.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Step 4: Rate limiting
        const rateLimit = await rateLimitMiddleware(request, env, user);
        if (rateLimit.status) {
            return rateLimit; // 429 response
        }

        // Step 5: Validate and sanitize input
        const data = await request.json();
        const validation = validateInput(data, SCHEMAS.WRITING_SUBMISSION);

        if (!validation.valid) {
            return new Response(
                JSON.stringify({ error: 'Validation failed', details: validation.errors }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const sanitized = validation.sanitized;

        // Step 6: Process the writing submission (existing logic)
        const result = await env.DB.prepare(`
            INSERT INTO writing_analysis (user_id, essay, prompt, word_target, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(
            user.user_id,
            sanitized.essay,
            sanitized.prompt || '',
            sanitized.word_target || 250
        ).run();

        // Step 7: Return success response with rate limit headers
        return new Response(
            JSON.stringify({
                success: true,
                submission_id: result.meta.last_row_id
            }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    ...rateLimit.headers
                }
            }
        );

    } catch (error) {
        console.error('Secure writing submit error:', error);
        return new Response(
            JSON.stringify({ error: 'Submission failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * EXAMPLE 3: Secure B2B Partner Endpoint
 * - Validates API key
 * - Checks partner scope
 * - Rate limits
 * - Returns anonymized data
 */
export async function handleSecurePartnerAPI(request, env, corsHeaders) {
    try {
        // Step 1: Extract and validate API key
        const apiKey = request.headers.get('X-API-Key') || new URL(request.url).searchParams.get('api_key');

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'Missing API key' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Step 2: Fetch partner from database
        const partner = await env.DB.prepare(`
            SELECT * FROM institutional_partners WHERE api_key = ?
        `).bind(apiKey).first();

        if (!partner) {
            return new Response(
                JSON.stringify({ error: 'Invalid API key' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Step 3: Validate partner access (scope, subscription, limits)
        const accessCheck = validatePartnerAccess(partner, 'elite_profiles');

        if (!accessCheck.authorized) {
            return new Response(
                JSON.stringify({ error: accessCheck.error }),
                { status: accessCheck.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Step 4: Rate limit (higher limits for partners)
        const rateLimit = await rateLimitMiddleware(request, env, { user_id: partner.id });
        if (rateLimit.status) {
            return rateLimit;
        }

        // Step 5: Increment API call counter
        await env.DB.prepare(`
            UPDATE institutional_partners
            SET api_calls_this_month = api_calls_this_month + 1
            WHERE id = ?
        `).bind(partner.id).run();

        // Step 6: Log API access for audit
        await env.DB.prepare(`
            INSERT INTO partner_api_logs (partner_id, endpoint, ip_address)
            VALUES (?, ?, ?)
        `).bind(
            partner.id,
            new URL(request.url).pathname,
            request.headers.get('CF-Connecting-IP')
        ).run();

        // Step 7: Return anonymized data (example)
        const eliteProfiles = await env.DB.prepare(`
            SELECT 
                profile_token,
                overall_band,
                speaking_band,
                writing_band,
                performance_velocity,
                region
            FROM elite_profiles
            WHERE status = 'available'
            AND overall_band >= 8.5
            LIMIT 20
        `).all();

        return new Response(
            JSON.stringify({
                elite_profiles: eliteProfiles.results,
                count: eliteProfiles.results.length,
                data_classification: 'ANONYMIZED'
            }),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json',
                    ...rateLimit.headers
                }
            }
        );

    } catch (error) {
        console.error('Secure partner API error:', error);
        return new Response(
            JSON.stringify({ error: 'API request failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * EXAMPLE 4: Secure Payment Webhook
 * - Verifies webhook signature
 * - Checks for duplicate transactions
 * - Detects fraud
 * - Processes payment
 */
export async function handleSecurePaymentWebhook(request, env, corsHeaders) {
    return securePaymentCallback(request, async (req, environment) => {
        const data = await req.json();

        // Check for duplicate transaction
        const isDuplicate = await environment.DB.prepare(`
            SELECT id FROM user_transactions WHERE transaction_id = ?
        `).bind(data.transaction_id).first();

        if (isDuplicate) {
            return new Response(
                JSON.stringify({ error: 'Duplicate transaction' }),
                { status: 409, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Fraud detection
        const fraudCheck = await detectFraud(data.user_id, data.amount, environment.DB);

        if (fraudCheck.fraud) {
            // Log fraud attempt
            await environment.DB.prepare(`
                INSERT INTO security_audit_logs (
                    event_type, user_id, action, resource, severity
                ) VALUES (?, ?, ?, ?, ?)
            `).bind(
                'fraud_attempt',
                data.user_id,
                `Blocked transaction: ${data.amount} UZS`,
                fraudCheck.reason,
                fraudCheck.severity
            ).run();

            return new Response(
                JSON.stringify({ error: 'Transaction blocked', reason: fraudCheck.reason }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Process payment (insert transaction record)
        await environment.DB.prepare(`
            INSERT INTO user_transactions (
                user_id, transaction_id, amount, status, payment_method
            ) VALUES (?, ?, ?, ?, ?)
        `).bind(
            data.user_id,
            data.transaction_id,
            data.amount,
            'completed',
            'click'
        ).run();

        return new Response(
            JSON.stringify({ success: true, transaction_id: data.transaction_id }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    }, env, 'click');
}

export default {
    handleSecureLogin,
    handleSecureWritingSubmit,
    handleSecurePartnerAPI,
    handleSecurePaymentWebhook
};
