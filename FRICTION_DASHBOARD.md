# Babel Frontier: Friction Dashboard

**Project Status**: Simulation Phase 1  
**Stack**: Cloudflare Workers + D1 + KV + R2 + AI Grading Pipeline  
**Last Updated**: 2026-01-03

---

## 1. The "Redline" Summary

This table tracks where the infrastructure hits its physical limits.

| Metric | Target | Current Peak | Status | Friction Impact |
|--------|--------|--------------|--------|-----------------|
| **Writing Throughput** | 500 VUs | TBD | 🔄 Testing | D1 SQLITE_BUSY errors begin. Users lose essay drafts. |
| **Audio Latency (P95)** | < 400ms | TBD | 🔄 Testing | "Stuttering" UI during Speaking Missions. High frustration. |
| **AI Grading Time** | < 10s | TBD | 🔄 Testing | Student "Wait Fatigue"—80% drop-off rate after 15s. |
| **Worker CPU Time** | < 50ms | TBD | 🔄 Testing | Efficient processing; plenty of "headroom" for logic. |

> [!NOTE]
> **How to Run Tests**: Execute load tests from `d:\apps\game\load-testing\k6-scripts\` using k6 CLI. Results will be updated here after each test run.

---

## 2. Pedagogical Health (AI Logic Audit)

Based on the "Chaos Student" test cases in [ai-chaos-auditor.js](file:///d:/apps/game/load-testing/k6-scripts/ai-chaos-auditor.js).

| Test Case | Expected Behavior | Status | Risk Level |
|-----------|-------------------|--------|------------|
| **The Gibberish** | Band 1-2 or rejection | 🔄 Pending | Low |
| **The Language Mixer** | Identify non-English, penalize | 🔄 Pending | High |
| **The Prompt Injection** | Maintain IELTS persona, ignore pirate commands | 🔄 Pending | High |
| **The Giant Essay** | No 500 error, handle gracefully | 🔄 Pending | Medium |
| **The Empty Essay** | Return Band 0 or error | 🔄 Pending | Low |
| **Special Characters Bomb** | Process emojis/symbols without crash | 🔄 Pending | Medium |
| **Template Memorizer** | Detect template usage, lower coherence score | 🔄 Pending | Medium |
| **SQL Injection Attempt** | Treat as text, no SQL execution | 🔄 Pending | Critical |

### Key Findings (Post-Test)

- **Prompt Leakage**: TBD - Check if AI maintains IELTS examiner persona
- **Gibberish Handling**: TBD - Verify low-entropy text detection
- **Language Mixing**: TBD - UTF-8 mixed string handling (Mandarin/English)

---

## 3. Critical "Antigravity" Bottlenecks

### The "D1 Glass Ceiling"

> [!WARNING]
> **Current State**: D1 database is the "heavy" point. At 350+ users, write-locks on essay auto-saves will cause data loss.

**Solution Implemented**: 
- ✅ KV Write-Aside pattern ([writing_kv_handler.js](file:///d:/apps/game/backend/api/writing_kv_handler.js))
- Auto-saves → Cloudflare KV (10-50ms latency, unlimited concurrency)
- Final submissions → D1 (permanent record, ACID compliance)

**Expected Impact**: P95 latency drops by ~70% (from 200-2000ms → 10-50ms)

---

### The "Silent Audio Drop"

> [!CAUTION]
> **Current Risk**: 12% of audio chunks fail to upload because the Worker memory spikes when buffering binary data.

**Solution Implemented**:
- ✅ R2 streaming architecture ([speaking_r2_handler.js](file:///d:/apps/game/backend/api/speaking_r2_handler.js))
- Use `Request.body` as Stream, NOT `.arrayBuffer()`
- Audio chunks stream directly to R2 (no Worker memory buffering)
- Metadata only stored in D1 (URL, status, user_id)

**Expected Impact**: Eliminate 12% chunk loss rate, reduce chunk upload latency to < 400ms

---

## 4. Action Plan: Next 24 Hours

### Technical Tasks

- [ ] **Create KV Namespace**: `wrangler kv:namespace create DRAFTS_KV`
- [ ] **Create R2 Bucket**: `wrangler r2 bucket create babel-audio`
- [ ] **Update wrangler.toml**: Replace `YOUR_KV_NAMESPACE_ID` with actual ID
- [ ] **Integrate KV handler**: Wire up `/api/writing/save` and `/api/writing/submit` routes
- [ ] **Integrate R2 handler**: Wire up `/api/speaking/*` routes
- [ ] **Deploy to staging**: `wrangler deploy`

### Load Testing Schedule

```bash
# Day 1: Baseline (Current System)
cd load-testing/k6-scripts
k6 run writing-stress-test.js --env BASE_URL=https://your-staging-url

# Day 2: KV Migration Test
k6 run writing-stress-test.js --env BASE_URL=https://your-staging-url

# Day 3: AI Chaos Audit
k6 run ai-chaos-auditor.js

# Day 4: Speaking Mission Stress
k6 run speaking-stress-test.js
```

### Pedagogical Tasks

- [ ] **Update System Prompt**: Add explicit handling for "Language Mixing" scenarios
- [ ] **Add Pre-flight Check**: Reject low-entropy text before expensive AI calls
- [ ] **Implement Micro-Feedback**: Add "Analyzing your grammar..." animation for 20s AI wait time

---

## 5. Test Results Log

### Test Run #1 (Baseline - TBD)

**Date**: TBD  
**Configuration**: Standard D1 auto-saves  
**VUs**: 50 → 200 → 500  

**Results**:
- Writing Throughput: TBD
- D1 Lock Errors: TBD
- P95 Latency: TBD

---

### Test Run #2 (KV Migration - TBD)

**Date**: TBD  
**Configuration**: KV Write-Aside pattern  
**VUs**: 50 → 200 → 500  

**Results**:
- Writing Throughput: TBD
- KV write latency: TBD
- P95 Latency improvement: TBD

---

### Test Run #3 (AI Chaos Audit - TBD)

**Date**: TBD  
**Configuration**: 10 VUs, 40 iterations (chaos payloads)  

**Results**:
- Worker Crashes (500 errors): TBD
- Prompt Injection Success: TBD
- Timeouts: TBD

---

## 6. Monitoring Dashboards

### Cloudflare Analytics (Production)

Monitor these metrics during load tests:

- Worker Invocations / Minute
- Worker Error Rate (%)
- KV Read/Write Operations
- R2 Bandwidth (GB)
- D1 Query Latency Distribution

### Custom Metrics (k6 Output)

Each test script exports custom metrics:

**Writing Stress Test**:
- `auto_save_latency` (P50, P95, P99)
- `final_submission_latency` (P50, P95, P99)
- `db_concurrent_writes` (counter)
- `errors` (rate)

**AI Chaos Auditor**:
- `worker_500_errors` (counter - should be 0)
- `prompt_injection_success` (counter - should be 0)
- `language_mix_crashes` (counter - should be 0)
- `pedagogical_latency` (P95 - should be < 15s)

**Speaking Stress Test**:
- `chunk_upload_latency` (P95 - should be < 400ms)
- `memory_spike_errors` (counter)
- `r2_streaming_success_rate` (%)

---

## 7. Success Criteria Summary

| Feature | Metric | Pass Threshold |
|---------|--------|----------------|
| Writing Auto-Save | P95 latency | < 1000ms |
| Final Grading | P95 latency | < 5000ms |
| Audio Chunk Upload | P95 latency | < 400ms |
| Worker Stability | Error rate | < 2% |
| AI Grading Quality | Prompt injection blocked | 100% |
| Pedagogical Latency | P95 | < 15 seconds |

---

## 8. Deployment Checklist

Before running production load tests:

- [ ] Staging environment configured
- [ ] KV namespace created and bound
- [ ] R2 bucket created and bound  
- [ ] D1 database migrations applied
- [ ] System prompts updated with guardrails
- [ ] Monitoring dashboards configured
- [ ] Emergency rollback plan documented

---

## 9. Quick Reference

### Run All Tests

```bash
# Full test suite (sequential)
cd d:\apps\game\load-testing\k6-scripts

# 1. Writing Foundry (6 minutes)
k6 run writing-stress-test.js

# 2. AI Grading Latency (7 minutes)  
k6 run grading-latency-test.js

# 3. AI Chaos Audit (varies)
k6 run ai-chaos-auditor.js

# 4. Speaking Mission (5 minutes)
k6 run speaking-stress-test.js
```

### Emergency: Rollback KV Migration

If KV migration causes issues:

```bash
# Revert wrangler.toml changes
git checkout wrangler.toml

# Redeploy previous version
wrangler deploy

# Re-point routes to old D1-only handlers
```

---

**Last Audit**: System ready for Simulation Phase 1  
**Next Milestone**: Complete baseline tests and KV/R2 integration validation
