/**
 * Social Antigravity Handler
 * Implements Pods, Social Lifts, and Cached Leaderboards
 */

const POD_SIZE_LIMIT = 12;
const RANKING_CACHE_TTL = 600; // 10 minutes

export async function handleSocial(request, env, corsHeaders) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
        if (path === '/api/social/join-pod') {
            return await handleJoinPod(request, env, corsHeaders);
        }
        if (path === '/api/social/lift') {
            return await handleSendSocialLift(request, env, corsHeaders);
        }
        if (path === '/api/social/pod-rankings') {
            return await handleGetPodRankings(request, env, corsHeaders);
        }
    } catch (error) {
        console.error("Social API error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}

async function handleJoinPod(request, env, corsHeaders) {
    const { userId } = await request.json();

    // 1. Check if already in a pod
    const existing = await env.DB.prepare(`SELECT pod_id FROM pod_members WHERE user_id = ?`).bind(userId).first();
    if (existing) {
        return new Response(JSON.stringify({ success: true, podId: existing.pod_id }), { headers: corsHeaders });
    }

    // 2. Find a pod with space
    let pod = await env.DB.prepare(`
        SELECT p.id FROM pods p 
        LEFT JOIN pod_members pm ON p.id = pm.pod_id 
        GROUP BY p.id 
        HAVING COUNT(pm.user_id) < ?
        LIMIT 1
    `).bind(POD_SIZE_LIMIT).first();

    // 3. Create a new pod if none available
    if (!pod) {
        const podId = `pod_${Date.now()}`;
        const podName = `Vanguard ${Math.floor(Math.random() * 1000)}`;
        await env.DB.prepare(`INSERT INTO pods (id, name) VALUES (?, ?)`).bind(podId, podName).run();
        pod = { id: podId };
    }

    // 4. Join pod
    await env.DB.prepare(`INSERT INTO pod_members (pod_id, user_id) VALUES (?, ?)`).bind(pod.id, userId).run();

    return new Response(JSON.stringify({ success: true, podId: pod.id }), { headers: corsHeaders });
}

async function handleSendSocialLift(request, env, corsHeaders) {
    const { fromUserId, toUserId } = await request.json();

    // 1. Verify same pod
    const pod = await env.DB.prepare(`
        SELECT a.pod_id FROM pod_members a 
        JOIN pod_members b ON a.pod_id = b.pod_id 
        WHERE a.user_id = ? AND b.user_id = ?
    `).bind(fromUserId, toUserId).first();

    if (!pod) {
        return new Response(JSON.stringify({ error: "Users must be in the same Pod to lift each other" }), { status: 403, headers: corsHeaders });
    }

    // 2. Calculate Boost: M_boost = (100 - M_current) / 10
    const toUser = await env.DB.prepare(`SELECT momentum_score FROM users WHERE user_id = ?`).bind(toUserId).first();
    const fromUser = await env.DB.prepare(`SELECT momentum_score FROM users WHERE user_id = ?`).bind(fromUserId).first();

    const boostTo = Math.max(2, (100 - (toUser.momentum_score || 0)) / 10);
    const boostFrom = 5; // Fixed small reward for the sender (In Antigravity, generosity is incentivized)

    // 3. Apply Lift
    await env.DB.prepare(`
        UPDATE users SET momentum_score = MIN(100, momentum_score + ?) WHERE user_id = ?
    `).bind(boostTo, toUserId).run();

    await env.DB.prepare(`
        UPDATE users SET momentum_score = MIN(100, momentum_score + ?) WHERE user_id = ?
    `).bind(boostFrom, fromUserId).run();

    // 4. Invalidate cache for this pod
    await env.DRAFTS_KV.delete(`pod_rankings:${pod.pod_id}`);

    return new Response(JSON.stringify({
        success: true,
        message: `Aura: You've lifted a teammate! +${boostFrom} Momentum for you, and +${boostTo.toFixed(1)} for them.`
    }), { headers: corsHeaders });
}

async function handleGetPodRankings(request, env, corsHeaders) {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    const member = await env.DB.prepare(`SELECT pod_id FROM pod_members WHERE user_id = ?`).bind(userId).first();
    if (!member) {
        return new Response(JSON.stringify({ error: "User not in a pod" }), { status: 404, headers: corsHeaders });
    }

    const podId = member.pod_id;
    const cacheKey = `pod_rankings:${podId}`;

    // 1. Try Cache
    const cached = await env.DRAFTS_KV.get(cacheKey);
    if (cached) {
        return new Response(cached, { headers: { ...corsHeaders, 'X-Cache': 'HIT', 'Content-Type': 'application/json' } });
    }

    // 2. Fetch from D1
    const { results: rankings } = await env.DB.prepare(`
        SELECT u.user_id, u.username, u.momentum_score, u.last_active
        FROM users u
        JOIN pod_members pm ON u.user_id = pm.user_id
        WHERE pm.pod_id = ?
        ORDER BY u.momentum_score DESC
    `).bind(podId).all();

    const pod = await env.DB.prepare(`SELECT name FROM pods WHERE id = ?`).bind(podId).first();

    const avgMomentum = rankings.reduce((acc, curr) => acc + (curr.momentum_score || 0), 0) / rankings.length;

    const responseData = {
        podName: pod.name,
        avgMomentum: avgMomentum.toFixed(1),
        rankings: rankings.map(u => ({
            ...u,
            velocity: 'stable' // Mock: in a real app, we'd compare with previous momentum
        }))
    };

    // 3. Save to Cache
    await env.DRAFTS_KV.put(cacheKey, JSON.stringify(responseData), { expirationTtl: RANKING_CACHE_TTL });

    // 4. Update pod average in D1 (for boss raid unlocks)
    await env.DB.prepare(`UPDATE pods SET avg_momentum = ? WHERE id = ?`).bind(avgMomentum, podId).run();

    return new Response(JSON.stringify(responseData), { headers: { ...corsHeaders, 'X-Cache': 'MISS', 'Content-Type': 'application/json' } });
}
