# Load Testing & Pedagogical Audit Framework

## Overview

This framework simulates **500 concurrent users** across 4 personas to stress-test the Babel Frontier IELTS app and validate pedagogical quality.

**Components:**
- **k6 Load Testing**: Simulates Speaking, Writing, and Grading scenarios
- **Pedagogical Audit**: Validates AI grading against Cullen IELTS standards
- **Friction Analysis**: Identifies UX drop-off points

---

## Quick Start

### 1. Install k6

**Windows (PowerShell):**
```powershell
choco install k6
# Or download from: https://k6.io/docs/get-started/installation/
```

**Verify Installation:**
```bash
k6 version
```

### 2. Run Baseline Load Test (50 users)

```bash
cd d:\apps\game
k6 run --config load-testing/config/ramp-up-50.json load-testing/k6-scripts/speaking-stress-test.js
```

**Expected output:** P95 latency < 3s, error rate < 10%

### 3. Run Pedagogical Audit

```bash
node pedagogical-audit/cullen-checksum.js
node pedagogical-audit/fuzzer.js
```

**Expected output:** 
- Cullen Checksum: ≥80% pass rate
- Fuzzer: No crashes, all edge cases handled

---

## Test Scenarios

### Scenario 1: Speaking Mission Stress Test

**What it tests:** Audio upload → Gemini transcription → Band scoring → D1 save

**Command:**
```bash
k6 run --config load-testing/config/ramp-up-200.json load-testing/k6-scripts/speaking-stress-test.js
```

**Key Metrics:**
- `gemini_transcription_time` (should be < 3s at P95)
- `db_write_time` (should be < 100ms)
- `errors` (should be < 10%)

---

### Scenario 2: Writing Foundry Auto-Save Test

**What it tests:** Progressive essay writing with auto-save every 10s

**Command:**
```bash
# Set environment variable to use mock AI (avoid quota exhaustion)
$env:USE_MOCK_AI="true"
k6 run --config load-testing/config/ramp-up-500.json load-testing/k6-scripts/writing-stress-test.js
```

**Key Metrics:**
- `auto_save_latency` (should be < 1s at P95)
- `db_concurrent_writes` (watch for D1 locking)
- `template_essays_detected` (should catch Template Trapped persona)

**Critical Test:** At 500 users, auto-save happens ~50 times/second. Will D1 handle this?

---

### Scenario 3: AI Grading Latency Test

**What it tests:** "Time to Feedback" - how long students wait for band scores

**Command:**
```bash
k6 run --config load-testing/config/ramp-up-200.json load-testing/k6-scripts/grading-latency-test.js
```

**Acceptance Criteria:**
- P95 latency < 8 seconds (students drop off after 8s)
- Error rate < 2%
- All 4 IELTS criteria returned

---

## Pedagogical Audit

### Cullen Checksum Validator

**What it does:** Tests AI grading against 14 known-quality essays (Band 3.5-8.5)

**Run:**
```bash
node pedagogical-audit/cullen-checksum.js
```

**Output:** `reports/cullen_checksum_report.json`

**Pass Criteria:**
- Weak essays (Band 3.5-5.5) graded ≤ expected + 1.0
- Strong essays (Band 7.0-8.5) graded ≥ expected - 1.0
- Template essays penalized below claimed band

---

### AI Fuzzer

**What it does:** Stress-tests AI with 15 edge cases (empty text, SQL injection, gibberish)

**Run:**
```bash
node pedagogical-audit/fuzzer.js
```

**Output:** `reports/fuzzer_report.json`

**Pass Criteria:**
- No system crashes
- All edge cases return graceful errors or low band scores
- Pass rate ≥ 80%

---

### Friction Analyzer

**What it does:** Parses k6 results to identify UX drop-off points

**Run:**
```bash
# First, run a k6 test and save JSON output
k6 run --out json=reports/k6-results.json load-testing/k6-scripts/speaking-stress-test.js

# Then analyze friction
node pedagogical-audit/friction-analyzer.js reports/k6-results.json
```

**Output:** `reports/sim_friction_heatmap.json`

**Identifies:**
- Critical friction (>20% error rate, P95 >5s)
- UX friction (P95 >3s, slow auto-saves)
- Pedagogical drift (template detection failures)
- Persona-specific drop-offs

---

## Understanding Reports

### Friction Heatmap Structure

```json
{
  "criticalFriction": [
    {
      "type": "high_error_rate",
      "value": "25%",
      "impact": "Users experiencing frequent failures",
      "recommendation": "Check AI quota, review D1 capacity"
    }
  ],
  "uxFriction": [...],
  "pedagogicalDrift": [
    {
      "type": "template_not_detected",
      "impact": "AI not penalizing memorized phrases",
      "recommendation": "Enhance AI prompt"
    }
  ]
}
```

---

## User Personas

### 1. Silent Warrior (40%)
- **Band Range:** 3.5-4.5
- **Behavior:** Short responses, frequent pauses, quits on complexity
- **Use Case:** Tests if UI is accessible for low-English users

### 2. Template Trapped (30%)
- **Band Range:** 5.5-6.0
- **Behavior:** Uses memorized phrases like "In my humble opinion"
- **Use Case:** Tests if AI detects and penalizes templates

### 3. Samarkand Scholar (20%)
- **Band Range:** 6.5-8.5
- **Behavior:** Complex sentences, advanced vocabulary
- **Use Case:** Tests system ceiling for high-performers

### 4. Chaos Agent (10%)
- **Band Range:** Random
- **Behavior:** Gibberish, rapid clicks, poor connectivity simulation
- **Use Case:** Tests edge case handling and resilience

---

## Scaling Recommendations

### Baseline Test (50 users) - ✓ Should Pass
- **Goal:** Establish performance baseline
- **Expected:** P95 < 3s, error rate < 10%
- **If Failed:** Review API implementation, check Gemini quota

### Daily Peak (200 users) - ⚠️ Monitor
- **Goal:** Simulate typical afternoon peak
- **Expected:** P95 < 4s, error rate < 15%
- **If Failed:** Add caching, optimize AI prompts

### Stress Test (500 users) - 🔥 Breaking Point
- **Goal:** Find system limits
- **Expected:** P95 < 5s, error rate < 20%
- **If Failed:** This is normal! Use friction heatmap to identify bottlenecks:
  - D1 locking → Add write batching or Durable Objects
  - Gemini quota → Switch to async processing with job queue
  - Network timeout → Add CDN caching for static assets

---

## Environment Variables

```bash
# Target API (change for local vs production)
$env:BASE_URL="https://babel-frontier.rahrus1977.workers.dev"

# Use mock AI responses (avoids Gemini quota)
$env:USE_MOCK_AI="true"

# Or test with real AI (use carefully - quota limits)
$env:USE_MOCK_AI="false"
```

---

## Interpreting k6 Metrics

### Key Metrics

| Metric | Good | Concerning | Critical |
|--------|------|------------|----------|
| `http_req_duration` P95 | < 3s | 3-5s | > 5s |
| `errors` rate | < 5% | 5-15% | > 15% |
| `gemini_transcription_time` P95 | < 3s | 3-8s | > 8s |
| `auto_save_latency` P95 | < 500ms | 500-1000ms | > 1s |

### What P95 Means

**P95 = 3000ms** means 95% of requests completed in ≤ 3 seconds. Only 5% took longer.

**Why P95 matters:** Average latency can hide bad experiences. If P95 is 10s, 1 in 20 users waits 10+ seconds.

---

## Common Issues & Fixes

### Issue: High Error Rate (>20%)

**Possible Causes:**
- Gemini quota exhausted
- D1 database locked
- Network timeout

**Fixes:**
1. Set `USE_MOCK_AI=true` to bypass Gemini
2. Check Cloudflare logs: `wrangler tail`
3. Review D1 query performance

---

### Issue: Slow Auto-Save (P95 >1s)

**Cause:** Too many concurrent writes to D1

**Fixes:**
1. Debounce auto-save (only save after 2s of inactivity)
2. Implement optimistic UI updates
3. Batch writes (save multiple users' data in one transaction)

---

### Issue: Template Detection Failure

**Cause:** AI not recognizing memorized phrases

**Fixes:**
1. Enhance Gemini prompt:
   ```
   "Flag essays using common IELTS templates like 'In my humble opinion',
   'It goes without saying', 'Last but not least'. Penalize repetitive phrases."
   ```
2. Add regex-based pre-check for common templates
3. Review `pedagogical-audit/test-data/template-essays.json` for known bad patterns

---

## Next Steps

1. **Run Baseline Test:** Establish performance baseline with 50 users
2. **Review Reports:** Check `reports/` directory for friction heatmap
3. **Fix Critical Issues:** Address any critical friction (>20% errors, P95 >5s)
4. **Run Stress Test:** Test at 500 users to find breaking point
5. **Optimize:** Use recommendations from friction heatmap

---

## File Structure

```
load-testing/
├── k6-scripts/
│   ├── speaking-stress-test.js       # Audio upload simulation
│   ├── writing-stress-test.js        # Auto-save frequency test
│   └── grading-latency-test.js       # Time-to-feedback test
├── config/
│   ├── ramp-up-50.json               # Baseline (50 users)
│   ├── ramp-up-200.json              # Daily peak (200 users)
│   └── ramp-up-500.json              # Stress test (500 users)
└── utils/
    ├── persona-behavior.js           # User persona definitions
    └── mock-audio-generator.js       # Fake audio blob generator

pedagogical-audit/
├── cullen-checksum.js                # Validate AI against Cullen standards
├── fuzzer.js                         # Edge case testing
├── friction-analyzer.js              # Parse k6 results
└── test-data/
    ├── weak-essays.json              # Band 3.5-5.5 samples
    ├── strong-essays.json            # Band 7.0-8.5 samples
    └── template-essays.json          # Memorized phrase examples

reports/
├── cullen_checksum_report.json       # Pedagogical validation
├── fuzzer_report.json                # Edge case results
└── sim_friction_heatmap.json         # UX drop-off analysis
```

---

## Support

For issues or questions:
1. Check `reports/*.json` for detailed error logs
2. Review Cloudflare Worker logs: `wrangler tail`
3. Inspect D1 database: `wrangler d1 execute babel-frontier-db --remote --command "SELECT * FROM users LIMIT 10"`

**Created by:** Antigravity AI  
**Version:** 1.0  
**Last Updated:** 2026-01-03
