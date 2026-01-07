# Babel Frontier Load Testing: Integration Instructions

## Summary

This document provides integration instructions to connect the new KV and R2 handlers to your main Worker API routes.

---

## 1. Import New Handlers

Add these imports to the top of `backend/api/index.js`:

```javascript
// Import KV-optimized writing handler
import {
    handleAutoSave,
    handleRealtimeAnalysis,
    handleSubmit
} from './writing_kv_handler.js';

// Import R2-optimized speaking handler
import {
    handleSpeakingInit,
    handleChunkUpload,
    handleSpeakingFinalize,
    handleSpeakingStatus
} from './speaking_r2_handler.js';
```

---

## 2. Add Route Handlers

Add these routes to the `handleApiRoutes()` function:

```javascript
// ========== KV-OPTIMIZED WRITING ROUTES ==========

// Route: PUT /api/writing/save (KV auto-save)
if (url.pathname === '/api/writing/save' && request.method === 'PUT') {
    return handleAutoSave(request, env, corsHeaders);
}

// Route: POST /api/writing/analyze-realtime (optional lightweight analysis)
// This already exists, but can be swapped with handleRealtimeAnalysis if needed

// Route: POST /api/writing/submit (enhanced with KV pull)
// Replace existing handleWritingSubmit with:
if (url.pathname === '/api/writing/submit' && request.method === 'POST') {
    return handleSubmit(request, env, corsHeaders);
}

// ========== R2-OPTIMIZED SPEAKING ROUTES ==========

// Route: POST /api/speaking/init
if (url.pathname === '/api/speaking/init' && request.method === 'POST') {
    return handleSpeakingInit(request, env, corsHeaders);
}

// Route: POST /api/speaking/upload-chunk
if (url.pathname === '/api/speaking/upload-chunk' && request.method === 'POST') {
    return handleChunkUpload(request, env, corsHeaders);
}

// Route: POST /api/speaking/finalize
if (url.pathname === '/api/speaking/finalize' && request.method === 'POST') {
    return handleSpeakingFinalize(request, env, corsHeaders);
}

// Route: GET /api/speaking/status/:sessionId
if (url.pathname.startsWith('/api/speaking/status/') && request.method === 'GET') {
    const sessionId = url.pathname.split('/')[4];
    return handleSpeakingStatus(request, env, corsHeaders, sessionId);
}
```

---

## 3. Environment Variable Check

Ensure your handlers gracefully handle missing bindings:

```javascript
// In writing_kv_handler.js handleAutoSave():
if (!env.DRAFTS_KV) {
    console.warn('DRAFTS_KV not configured - falling back to D1');
    // Fallback to existing D1 auto-save logic
}

// In speaking_r2_handler.js handleChunkUpload():
if (!env.AUDIO_BUCKET) {
    console.warn('AUDIO_BUCKET not configured - audio not persisted');
    // Return error or mock response
}
```

---

## 4. Frontend Integration (Optional)

If you want to test KV auto-saves from the frontend:

### Writing Foundry Component

```javascript
// Auto-save every 30 seconds
useEffect(() => {
    const interval = setInterval(async () => {
        if (essayContent) {
            await fetch('/api/writing/save', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    missionId: 'writing_task_2',
                    content: essayContent,
                    timestamp: new Date().toISOString()
                })
            });
        }
    }, 30000);
    
    return () => clearInterval(interval);
}, [essayContent]);
```

### Speaking Mission Component

```javascript
// Initialize session
const initSessionResponse = await fetch('/api/speaking/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        userId: user.id,
        missionId: 'speaking_part_1',
        topic: 'Describe your hometown'
    })
});

const { session_id } = await initSessionResponse.json();

// Upload audio chunks
const uploadChunk = async (audioBlob, chunkIndex) => {
    await fetch('/api/speaking/upload-chunk', {
        method: 'POST',
        headers: {
            'Content-Type': 'audio/webm',
            'X-User-ID': user.id,
            'X-Session-ID': session_id,
            'X-Chunk-Index': chunkIndex.toString()
        },
        body: audioBlob
    });
};
```

---

## 5. Testing Checklist

- [ ] KV namespace created: `wrangler kv:namespace create DRAFTS_KV`
- [ ] R2 bucket created: `wrangler r2 bucket create babel-audio`
- [ ] Namespace ID updated in `wrangler.toml`
- [ ] Routes added to `backend/api/index.js`
- [ ] Imports added at top of file
- [ ] Worker deployed: `wrangler deploy`
- [ ] Test auto-save: `PUT /api/writing/save`
- [ ] Test chunk upload: `POST /api/speaking/upload-chunk`
- [ ] Run k6 tests to verify

---

## 6. Rollback Plan

If issues arise, comment out the new routes and redeploy:

```javascript
// Temporary: Revert to D1-only writing
if (url.pathname === '/api/writing/submit' && request.method === 'POST') {
    return handleWritingSubmit(request, env, corsHeaders);  // Old handler
}
```

---

## Quick Reference

**New Endpoints**:
- `PUT /api/writing/save` - KV auto-save
- `POST /api/writing/submit` - Enhanced with KV pull
- `POST /api/speaking/init` - Initialize speaking session
- `POST /api/speaking/upload-chunk` - Stream chunk to R2
- `POST /api/speaking/finalize` - Trigger AI processing
- `GET /api/speaking/status/:sessionId` - Get session status

**Required Bindings**:
- `env.DRAFTS_KV` (KV namespace)
- `env.AUDIO_BUCKET` (R2 bucket)
- `env.DB` (D1 database - already exists)

**Migration Steps**:
1. Setup infrastructure (`setup-load-testing.ps1`)
2. Update `wrangler.toml`
3. Add imports + routes to `index.js`
4. Deploy Worker
5. Run k6 tests
6. Update FRICTION_DASHBOARD.md with results
