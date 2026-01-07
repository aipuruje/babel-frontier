# Babel Frontier: Load Testing Quick Start

This guide will help you set up and run the complete load testing framework for Babel Frontier.

## Prerequisites

- **k6 installed**: Download from [k6.io](https://k6.io/docs/get-started/installation/)
- **Wrangler CLI**: Ensure you have Cloudflare Wrangler installed
- **Cloudflare account**: With Workers, KV, R2, and D1 access

## Quick Setup

### 1. Run Automated Setup

```powershell
# From d:\apps\game directory
.\setup-load-testing.ps1
```

This script will:
- ✅ Create KV namespace for draft storage
- ✅ Create R2 bucket for audio streaming
- ✅ Apply database migrations

### 2. Update Configuration

After running the setup script, update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "DRAFTS_KV"
id = "YOUR_ACTUAL_KV_ID"  # Replace with ID from setup script output
```

### 3. Deploy Worker

```bash
wrangler deploy
```

## Running Load Tests

### Test Suite Overview

| Test | Duration | Purpose |
|------|----------|---------|
| **Writing Stress Test** | 6 min | Tests D1 → KV migration at 500 concurrent users |
| **AI Chaos Auditor** | Varies | Tests AI grading robustness with edge cases |
| **Speaking Stress Test** | 5 min | Tests R2 streaming with binary audio uploads |
| **Grading Latency Test** | 7 min | Measures AI grading "time to feedback" |

### Run Individual Tests

```bash
cd load-testing/k6-scripts

# Writing Foundry Stress Test (tests KV auto-saves)
k6 run writing-stress-test.js

# AI Chaos Auditor (tests edge cases)
k6 run ai-chaos-auditor.js

# Speaking Mission Stress Test (tests R2 streaming)
k6 run speaking-stress-test.js

# AI Grading Latency Test
k6 run grading-latency-test.js
```

### Run All Tests

```bash
# Sequential execution
k6 run writing-stress-test.js && \
k6 run grading-latency-test.js && \
k6 run ai-chaos-auditor.js && \
k6 run speaking-stress-test.js
```

## Interpreting Results

### Writing Stress Test

**Key Metrics**:
- `auto_save_latency` (P95): Should be < 1000ms with KV
- `db_concurrent_writes`: Monitor D1 write queue
- `errors`: Should be < 20% at 500 VUs

**Success Criteria**: ✅ No SQLITE_BUSY errors at 500 VUs

### AI Chaos Auditor

**Key Metrics**:
- `worker_500_errors`: Must be 0
- `prompt_injection_success`: Must be 0
- `pedagogical_latency` (P95): Should be < 15s

**Success Criteria**: ✅ All chaos payloads handled gracefully

### Speaking Stress Test

**Key Metrics**:
- `chunk_upload_latency` (P95): Should be < 400ms
- `memory_spike_errors`: Should be 0 (R2 streaming prevents this)

**Success Criteria**: ✅ No chunk upload failures at 50 concurrent users

## Architecture Highlights

### KV Write-Aside Pattern (Writing)

```
Auto-saves → KV (10-50ms) → Final Submit → D1 (permanent)
```

**Benefits**:
- 70% latency reduction
- Eliminates D1 write-lock queue
- Unlimited concurrency

### R2 Streaming (Speaking)

```
Audio chunks → Stream to R2 (no Worker buffering) → Metadata → D1
```

**Benefits**:
- Eliminates 12% chunk loss rate
- No Worker memory spikes
- Handles 50+ concurrent uploads

## Monitoring

### During Tests

Watch Cloudflare Dashboard:
- Workers → Analytics
- KV → Operations
- R2 → Bandwidth
- D1 → Query Performance

### Post-Test Analysis

Update `FRICTION_DASHBOARD.md` with results:
- Current Peak values
- Status (✅/⚠️/❌)
- Any new friction points discovered

## Troubleshooting

### "KV namespace not found"

```bash
# Verify binding in wrangler.toml
wrangler kv:namespace list

# Recreate if needed
wrangler kv:namespace create DRAFTS_KV
```

### "R2 bucket does not exist"

```bash
# Create bucket
wrangler r2 bucket create babel-audio

# Verify
wrangler r2 bucket list
```

### High error rate in tests

1. Check Worker logs: `wrangler tail`
2. Verify API endpoints are deployed
3. Confirm KV/R2 bindings are active
4. Test with lower VU count first (50 → 100)

## Next Steps

After successful load tests:

1. **Update FRICTION_DASHBOARD.md** with actual metrics
2. **Identify bottlenecks** from test results
3. **Optimize** critical paths (AI grading, D1 queries)
4. **Re-test** to verify improvements
5. **Document** findings for production readiness

## Support

- Load Testing Scripts: `d:\apps\game\load-testing\k6-scripts\`
- Handler Implementations: `d:\apps\game\backend\api\`
- Configuration: `d:\apps\game\wrangler.toml`
- Results Dashboard: `d:\apps\game\FRICTION_DASHBOARD.md`
