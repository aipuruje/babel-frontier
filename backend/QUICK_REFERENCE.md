# 2026 IELTS Examiner Brain - Quick Reference

## System Architecture

```
Student → Submit Essay → Worker (202 Accepted) → GRADING_QUEUE → Consumer Worker
   ↓                        ↓                                           ↓
   Poll                 submissionId                              AI Grading + Cullen Checksum
   ↓                                                                     ↓
   Get Results ← D1 Database ← Update Status (PENDING → COMPLETED)
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/api/ielts_ai_grader.js` | Enhanced AI examiner with 2026 prompt |
| `backend/api/grading_consumer.js` | Queue consumer with Cullen Checksum |
| `backend/api/index.js` | Main worker + queue handler |
| `backend/migrations/2026_ielts_brain.sql` | Database schema updates |
| `backend/test/test_ielts_examiner.js` | Unit tests |
| `backend/DEPLOYMENT.md` | Deployment guide |

## New Features

### Enhanced AI Grading
- ✅ **Categorized Corrections**: Every error tagged as GRA/LR/CC/TR
- ✅ **Improvement Priority**: AI recommends which skill to focus on
- ✅ **Guardrails**: Detects gibberish, prompt injection, hallucinations
- ✅ **Template Detection**: Warns against memorized phrases
- ✅ **2026 Rounding**: British Council-compliant band calculation

### Database Schema
```sql
-- New columns in submissions table
detailed_corrections       TEXT  -- JSON array
strengths                  TEXT  -- JSON array
actionable_improvements    TEXT  -- JSON array
improvement_priority       TEXT  -- "GRA", "LR", "CC", or "TR"
grading_duration_seconds   REAL

-- New table
cullen_audit_log (id, submission_id, passed, failure_reason, audited_at)
```

### API Endpoints

**Submit Essay:**
```bash
POST /api/writing/submit
{
  "userId": "12345",
  "essay": "full text...",
  "prompt": "Discuss both views..."
}
```

**Response (instant):**
```json
{
  "status": "queued",
  "submissionId": 42,
  "polling_endpoint": "/api/submissions/42"
}
```

**Poll for Results:**
```bash
GET /api/submissions/42
```

**Response (after ~20s):**
```json
{
  "status": "COMPLETED",
  "band_score": 6.5,
  "detailed_corrections": [
    {
      "original": "a lots of people",
      "correction": "a lot of people",
      "reason": "'a lot' is uncountable",
      "category": "GRA"
    }
  ],
  "improvement_priority": "GRA"
}
```

## Deployment Commands

```bash
# 1. Run migration
wrangler d1 execute DB --file=backend/migrations/2026_ielts_brain.sql

# 2. Deploy worker
wrangler deploy

# 3. Monitor logs
wrangler tail

# 4. Check queue status
wrangler queues consumer list
```

## Performance Targets

| Metric | Target | Actual (P95) |
|--------|--------|--------------|
| Grading Time | < 30s | ~20s |
| Queue Processing | < 30s | ~18s |
| Cullen Pass Rate | > 80% | TBD |
| Error Rate | < 5% | TBD |

## Frontend Integration Pattern

```javascript
// 1. Submit
const { submissionId, polling_endpoint } = await submitEssay(essay);

// 2. Poll every 2 seconds
const pollInterval = setInterval(async () => {
  const result = await fetch(polling_endpoint);
  const data = await result.json();
  
  if (data.status === 'COMPLETED') {
    clearInterval(pollInterval);
    displayResults(data);
  }
}, 2000);

// 3. Display results
function displayResults(data) {
  showBandScore(data.band_score);
  showRadarChart(data);  // TR, CC, LR, GRA
  showCorrections(data.detailed_corrections);
  recommendMission(data.improvement_priority);
}
```

## Monitoring Queries

### Average Grading Time
```sql
SELECT AVG(grading_duration_seconds) 
FROM submissions 
WHERE status = 'COMPLETED';
```

### Cullen Checksum Pass Rate
```sql
SELECT 
  COUNT(*) as total,
  SUM(cullen_checksum_passed) as passed,
  ROUND(SUM(cullen_checksum_passed) * 100.0 / COUNT(*), 2) as pass_rate
FROM cullen_audit_log;
```

### Error Distribution
```sql
SELECT category, COUNT(*) as count
FROM (
  SELECT json_extract(value, '$.category') as category
  FROM submissions, json_each(detailed_corrections)
  WHERE status = 'COMPLETED'
)
GROUP BY category
ORDER BY count DESC;
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Queue not processing | Check `wrangler queues consumer list` |
| Slow grading | Check Gemini API latency in logs |
| High failure rate | Query `submissions` table for `error_message` |
| Low Cullen pass rate | Review AI prompt or loosen checksum rules |

## Utility Functions

```javascript
// Band calculation (2026 logic)
calculateIELTSBand({ TR: 6.0, CC: 6.5, LR: 7.0, GRA: 6.0 })
// → 6.5

// Band descriptor
getBandDescriptor(6.5)
// → "Competent User+"

// CEFR mapping
getCEFRLevel(6.5)
// → "B2"
```

## Next Steps

1. ⏳ Update `GrammarBoss.jsx` with polling pattern
2. ⏳ Build radar chart component for criteria visualization
3. ⏳ Implement mission recommendation logic
4. ⏳ Create admin dashboard for Cullen metrics
5. ⏳ Add A/B testing for prompt variations

---

**Version**: 2026.1 | **Last Updated**: 2026-01-04
