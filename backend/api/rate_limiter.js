// ========== RATE LIMITER ==========
// Prevents API abuse and DDoS attacks using sliding window algorithm

/**
 * Rate limit configurations per endpoint
 */
export const RATE_LIMITS = {
    // Speech/Writing analysis (resource-intensive)
    '/api/speech-analysis': { requests: 10, window: 60 }, // 10 per minute
    '/api/analyze-writing': { requests: 10, window: 60 },
    '/api/writing/submit': { requests: 5, window: 60 },

    // Content generation (Gemini API calls)
    '/api/content/generate': { requests: 20, window: 60 },
    '/api/auto-forge': { requests: 10, window: 60 },

    // B2B Partner APIs
    '/api/sultan/government/literacy-heatmap': { requests: 100, window: 3600 }, // 100 per hour
    '/api/sultan/university/elite-profiles': { requests: 100, window: 3600 },

    // Hive/collective intelligence
    '/api/hive/aggregate': { requests: 1, window: 3600 }, // Once per hour (should be via cron)
    '/api/lore/scrape-news': { requests: 1, window: 3600 },

    // Default for other endpoints
    'default': { requests: 60, window: 60 } // 60 per minute
};

/**
 * Get rate limit config for an endpoint
 * @param {string} path - Request path
 * @returns {Object} - { requests, window }
 */
function getRateLimitConfig(path) {
    // Try exact match first
    if (RATE_LIMITS[path]) {
        return RATE_LIMITS[path];
    }

    // Try prefix match
    for (const [key, config] of Object.entries(RATE_LIMITS)) {
        if (path.startsWith(key)) {
            return config;
        }
    }

    return RATE_LIMITS.default;
}

/**
 * Rate limiter using in-memory storage (Workers KV or Durable Objects in production)
 * @param {Request} request
 * @param {Object} env - Environment with KV storage
 * @param {string} identifier - User ID or IP address
 * @returns {Object} - { allowed: boolean, retryAfter?: number, limit?: number, remaining?: number }
 */
export async function checkRateLimit(request, env, identifier) {
    const url = new URL(request.url);
    const path = url.pathname;
    const config = getRateLimitConfig(path);

    const key = `ratelimit:${path}:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - config.window;

    try {
        // Get request timestamps from KV
        const stored = await env.KV?.get(key);
        let timestamps = stored ? JSON.parse(stored) : [];

        // Remove timestamps outside the current window
        timestamps = timestamps.filter(ts => ts > windowStart);

        // Check if limit exceeded
        if (timestamps.length >= config.requests) {
            const oldestTimestamp = Math.min(...timestamps);
            const retryAfter = oldestTimestamp + config.window - now;

            return {
                allowed: false,
                retryAfter: Math.max(retryAfter, 1),
                limit: config.requests,
                remaining: 0,
                reset: oldestTimestamp + config.window
            };
        }

        // Add current timestamp
        timestamps.push(now);

        // Store updated timestamps with TTL
        if (env.KV) {
            await env.KV.put(key, JSON.stringify(timestamps), {
                expirationTtl: config.window + 60 // Add buffer
            });
        }

        return {
            allowed: true,
            limit: config.requests,
            remaining: config.requests - timestamps.length,
            reset: now + config.window
        };

    } catch (error) {
        console.error('Rate limit check error:', error);
        // Fail open (allow request) if storage unavailable
        return { allowed: true };
    }
}

/**
 * Rate limit middleware
 * @param {Request} request
 * @param {Object} env
 * @param {Object} user - Authenticated user (if available)
 * @returns {Response|null} - 429 response if rate limited, null if allowed
 */
export async function rateLimitMiddleware(request, env, user = null) {
    // Use user ID if authenticated, otherwise IP address
    const identifier = user?.user_id || request.headers.get('CF-Connecting-IP') || 'unknown';

    const result = await checkRateLimit(request, env, identifier);

    if (!result.allowed) {
        return new Response(
            JSON.stringify({
                error: 'Rate limit exceeded',
                message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
                retryAfter: result.retryAfter,
                limit: result.limit
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': result.retryAfter.toString(),
                    'X-RateLimit-Limit': result.limit.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': result.reset.toString()
                }
            }
        );
    }

    // Add rate limit headers to successful responses (caller should merge these)
    return {
        headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString()
        }
    };
}

/**
 * Brute force protection - special rate limit for failed auth attempts
 * @param {string} identifier - User ID or IP
 * @param {Object} env
 * @returns {boolean} - True if blocked
 */
export async function checkBruteForce(identifier, env) {
    const key = `bruteforce:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const window = 300; // 5 minutes
    const maxAttempts = 5;

    try {
        const stored = await env.KV?.get(key);
        let attempts = stored ? JSON.parse(stored) : [];

        // Remove old attempts
        attempts = attempts.filter(ts => ts > now - window);

        if (attempts.length >= maxAttempts) {
            return true; // Blocked
        }

        // Record this attempt
        attempts.push(now);
        if (env.KV) {
            await env.KV.put(key, JSON.stringify(attempts), {
                expirationTtl: window + 60
            });
        }

        return false;

    } catch (error) {
        console.error('Brute force check error:', error);
        return false; // Fail open
    }
}

/**
 * Reset rate limit for a user (admin function)
 * @param {string} identifier - User ID or IP
 * @param {Object} env
 */
export async function resetRateLimit(identifier, env) {
    const keys = await env.KV?.list({ prefix: `ratelimit:*:${identifier}` });
    if (keys?.keys) {
        for (const key of keys.keys) {
            await env.KV.delete(key.name);
        }
    }
}

export default {
    checkRateLimit,
    rateLimitMiddleware,
    checkBruteForce,
    resetRateLimit,
    RATE_LIMITS
};
