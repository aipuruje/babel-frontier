# 2026 IELTS Master Examiner Brain - Deployment Guide

## Overview

The Babel Frontier AI grading system has been upgraded to 2026 British Council/IDP standards. This document provides deployment and usage instructions.

## Architecture

```
User submits essay → Worker (instant 202) → GRADING_QUEUE → Consumer Worker → AI Grading → D1 Update
                   ↓                                                                           ↓
              Returns submissionId                                              Student polls for results
```

## Files Modified/Created

### Core Components
- ✅ `backend/api/ielts_ai_grader.js` - Enhanced examiner with categorized feedback
- ✅ `backend/api/grading_consumer.js` - Queue consumer with Cullen Checksum
- ✅ `backend/api/index.js` - Updated queue handler
- ✅ `backend/migrations/2026_ielts_brain.sql` - Database schema updates

### Test & Documentation
- ✅ `backend/test/test_ielts_examiner.js` - Unit tests
- ✅ `DEPLOYMENT.md` - This file

## Deployment Steps

### Step 1: Run Database Migrations

```bash
wrangler d1 execute DB --file=backend/migrations/2026_ielts_brain.sql
```

This adds:
- `detailed_corrections` column (JSON)
- `strengths` column (JSON)
- `actionable_improvements` column (JSON)
- `improvement_priority` column (TEXT)
- `grading_duration_seconds` column (REAL)
- `cullen_audit_log` table
- Performance indexes

### Step 2: Deploy Worker

```bash
# Deploy the main worker (includes queue consumer)
wrangler deploy
```

### Step 3: Configure Queue Settings (Optional)

Edit `wrangler.toml` to adjust queue behavior:

```toml
[[queues.consumers]]
queue = "grading-queue"
max_batch_size = 10
max_batch_timeout = 30
max_retries = 3
dead_letter_queue = "grading-dlq"
```

### Step 4: Verify Deployment

```bash
# Check logs
wrangler tail

# Monitor queue status
wrangler queues consumer list
```

## API Usage

### Submit Essay for Grading

```bash
curl -X POST https://babel-frontier.workers.dev/api/writing/submit \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "12345",
    "essay": "Some people believe that technology...[full essay]",
    "prompt": "Discuss both views and give your opinion"
  }'
```

**Response (202 Accepted):**
```json
{
  "status": "queued",
  "submissionId": 42,
  "message": "Your essay is being graded...",
  "polling_endpoint": "/api/submissions/42",
  "estimated_time_seconds": 30,
  "word_count": 287
}
```

### Poll for Results

```bash
curl https://babel-frontier.workers.dev/api/submissions/42
```

**Response (PENDING):**
```json
{
  "status": "PENDING",
  "submissionId": 42,
  "message": "Your essay is being graded. Please wait...",
  "estimated_completion": "10-30 seconds"
}
```

**Response (COMPLETED):**
```json
{
  "status": "COMPLETED",
  "submissionId": 42,
  "band_score": 6.5,
  "task_achievement": 6.0,
  "coherence": 6.5,
  "vocabulary": 7.0,
  "grammar": 6.0,
  "feedback": {
    "summary": "Your essay addresses the task...",
    "strengths": [
      "Strong vocabulary range with academic terms",
      "Clear paragraph structure"
    ],
    "actionable_improvements": [
      "Add more complex sentence structures",
      "Vary discourse markers beyond 'however' and 'therefore'"
    ]
  },
  "detailed_corrections": [
    {
      "original": "a lots of people",
      "correction": "a lot of people",
      "reason": "'a lot' is uncountable",
      "category": "GRA"
    }
  ],
  "improvement_priority": "GRA",
  "word_count": 287,
  "grading_duration_seconds": 18.3
}
```

## Frontend Integration Example

```javascript
// React component example
async function submitEssay(essay, prompt) {
  // 1. Submit
  const submitResponse = await fetch('/api/writing/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, essay, prompt })
  });
  
  const { submissionId, polling_endpoint } = await submitResponse.json();
  
  // 2. Poll for results
  const pollInterval = setInterval(async () => {
    const statusResponse = await fetch(polling_endpoint);
    const data = await statusResponse.json();
    
    if (data.status === 'COMPLETED') {
      clearInterval(pollInterval);
      displayResults(data);
    } else if (data.status === 'FAILED') {
      clearInterval(pollInterval);
      showError(data.error);
    }
  }, 2000); // Poll every 2 seconds
  
  // Timeout after 60 seconds
  setTimeout(() => {
    clearInterval(pollInterval);
    showError('Grading taking longer than expected');
  }, 60000);
}

function displayResults(data) {
  // Display band score with progress ring
  showBandScore(data.band_score);
  
  // Show radar chart of criteria scores
  showRadarChart({
    'Task Response': data.task_achievement,
    'Coherence': data.coherence,
    'Vocabulary': data.vocabulary,
    'Grammar': data.grammar
  });
  
  // Show categorized corrections
  const corrections = data.detailed_corrections || [];
  const graErrors = corrections.filter(c => c.category === 'GRA');
  const lrErrors = corrections.filter(c => c.category === 'LR');
  
  // Recommend mission based on weakest area
  if (data.improvement_priority === 'GRA') {
    recommendMission('Grammar Boss: Complex Sentences');
  } else if (data.improvement_priority === 'LR') {
    recommendMission('Vocabulary Forge: Academic Collocations');
  }
}
```

## Progress Tracking

To build a student progress chart:

```javascript
// Fetch submission history
const history = await fetch(`/api/writing/history/${userId}`);
const submissions = await history.json();

// Extract time series data
const progressData = submissions.map(s => ({
  date: s.submitted_at,
  overallBand: s.band_score,
  TR: s.task_achievement,
  CC: s.coherence_cohesion,
  LR: s.lexical_resource,
  GRA: s.grammatical_range_accuracy
}));

// Identify trend
const firstBand = progressData[0].overallBand;
const latestBand = progressData[progressData.length - 1].overallBand;
const improvement = latestBand - firstBand;

console.log(`Student improved by ${improvement} band(s)!`);
```

## Monitoring & Analytics

### Check Cullen Checksum Pass Rate

```sql
SELECT 
  DATE(audited_at) as date,
  COUNT(*) as total_checks,
  SUM(CASE WHEN cullen_checksum_passed = 1 THEN 1 ELSE 0 END) as passed,
  ROUND(SUM(CASE WHEN cullen_checksum_passed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as pass_rate_percent
FROM cullen_audit_log
WHERE audited_at > datetime('now', '-7 days')
GROUP BY DATE(audited_at)
ORDER BY date DESC;
```

### Average Grading Time

```sql
SELECT 
  AVG(grading_duration_seconds) as avg_grading_time,
  MIN(grading_duration_seconds) as min_time,
  MAX(grading_duration_seconds) as max_time
FROM submissions
WHERE status = 'COMPLETED'
  AND completed_at > datetime('now', '-7 days');
```

### Error Rate

```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM submissions WHERE submitted_at > datetime('now', '-7 days')), 2) as percentage
FROM submissions
WHERE submitted_at > datetime('now', '-7 days')
GROUP BY status;
```

## Troubleshooting

### Queue Messages Not Processing

```bash
# Check queue consumer is running
wrangler queues consumer list

# View recent logs
wrangler tail --format=pretty
```

### Slow Grading Times

- Check Gemini API latency
- Verify worker CPU limits haven't been hit
- Consider increasing `max_batch_size` in wrangler.toml

### High Failure Rate

```sql
-- Get failed submissions with error messages
SELECT id, userId, error_message, retry_count, submitted_at
FROM submissions
WHERE status = 'FAILED'
ORDER BY submitted_at DESC
LIMIT 10;
```

## Performance Targets

- ✅ **Queue Processing**: < 30 seconds (P95)
- ✅ **AI Response Time**: < 20 seconds (Gemini 2.0 Flash)
- ✅ **Polling Frequency**: Every 2-3 seconds
- ✅ **Cullen Checksum Pass Rate**: > 80%
- ✅ **Concurrent Grading**: Up to 50 messages

## Next Steps

1. **Frontend Integration**: Update `GrammarBoss.jsx` to use new polling pattern
2. **Progress Charts**: Build radar chart component for criteria scores
3. **Mission Recommendations**: Create logic to suggest missions based on `improvement_priority`
4. **Analytics Dashboard**: Build admin panel to view Cullen Checksum metrics
5. **A/B Testing**: Test different prompt variations for better feedback quality

---

**Last Updated**: 2026-01-04
**Version**: 2026.1
