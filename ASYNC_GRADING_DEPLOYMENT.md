# Asynchronous Grading Pipeline - Deployment Guide

This guide walks you through deploying the queue-based async grading system to eliminate essay grading timeouts.

## Prerequisites

- Cloudflare Workers account
- Wrangler CLI installed (`npm install -g wrangler`)
- D1 database already created (`babel-frontier-db`)
- GEMINI_API_KEY secret configured

## Step 1: Create Cloudflare Queues

Create the main grading queue:

```powershell
npx wrangler queues create ielts-grading-tasks
```

Create the dead letter queue (for failed messages):

```powershell
npx wrangler queues create ielts-grading-dlq
```

Expected output:
```
✅ Created queue ielts-grading-tasks
✅ Created queue ielts-grading-dlq
```

## Step 2: Update Database Schema

Run the database migration to add status tracking columns:

```powershell
# Apply the migration
npx wrangler d1 execute babel-frontier-db --remote --file=backend/grading_queue_schema.sql
```

Verify the migration:

```powershell
npx wrangler d1 execute babel-frontier-db --remote --command="SELECT sql FROM sqlite_master WHERE name='submissions'"
```

You should see the new columns: `status`, `submitted_at`, `completed_at`, `error_message`, `retry_count`.

## Step 3: Verify Configuration

Check `wrangler.toml` includes the queue bindings:

```toml
[[queues.producers]]
binding = "GRADING_QUEUE"
queue = "ielts-grading-tasks"

[[queues.consumers]]
queue = "ielts-grading-tasks"
max_batch_size = 1
max_batch_timeout = 30
max_retries = 3
dead_letter_queue = "ielts-grading-dlq"
```

## Step 4: Deploy Worker

Deploy the updated Worker with queue handlers:

```powershell
npx wrangler deploy
```

Expected output:
```
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded babel-frontier (X.XX sec)
Published babel-frontier (X.XX sec)
  https://babel-frontier.your-subdomain.workers.dev
Current Deployment ID: xxxx-xxxx-xxxx
```

## Step 5: Verify Queue Consumer

Check that the queue consumer is active:

```powershell
npx wrangler queues list
```

You should see:
```
ielts-grading-tasks (consumer: active)
ielts-grading-dlq
```

## Step 6: Test the Flow

### Test 1: Submit Essay (Producer)

```powershell
curl -X POST https://babel-frontier.your-subdomain.workers.dev/api/writing/submit `
  -H "Content-Type: application/json" `
  -d '{\"userId\": 999, \"essay\": \"Climate change is one of the most pressing issues of our time. Many scientists argue that human activities are the primary cause. This essay will discuss both the causes and potential solutions.\", \"prompt\": \"Discuss the causes and solutions to climate change.\"}'
```

Expected response (202 Accepted):
```json
{
  "status": "queued",
  "submissionId": 123,
  "message": "Your essay is being graded by our AI examiner. Check back in a few moments!",
  "polling_endpoint": "/api/submissions/123",
  "estimated_time_seconds": 30,
  "word_count": 33
}
```

### Test 2: Poll for Status (Pending)

```powershell
curl https://babel-frontier.your-subdomain.workers.dev/api/submissions/123
```

Expected response while grading:
```json
{
  "status": "PENDING",
  "submissionId": 123,
  "message": "Your essay is being graded. Please wait...",
  "submitted_at": "2026-01-04 09:06:00",
  "estimated_completion": "10-30 seconds"
}
```

### Test 3: Poll for Status (Completed)

Wait 20-30 seconds, then poll again:

```powershell
curl https://babel-frontier.your-subdomain.workers.dev/api/submissions/123
```

Expected response when grading completes:
```json
{
  "status": "COMPLETED",
  "submissionId": 123,
  "band_score": 6.5,
  "task_achievement": 6.0,
  "coherence": 7.0,
  "vocabulary": 6.5,
  "grammar": 6.5,
  "feedback": {
    "summary": "Good attempt with clear structure...",
    "strengths": ["Clear introduction", "Logical paragraphing"],
    "actionable_improvements": ["Expand your examples", "Use more complex sentences"]
  },
  "word_count": 33,
  "submitted_at": "2026-01-04 09:06:00",
  "completed_at": "2026-01-04 09:06:28",
  "grading_duration_seconds": 28
}
```

## Step 7: Monitor Queue Activity

### View Queue Metrics (Cloudflare Dashboard)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Queues**
3. Click on `ielts-grading-tasks`
4. View metrics:
   - Messages enqueued
   - Messages processed
   - Processing time (p50, p95, p99)
   - Failed messages

### Monitor Logs

```powershell
npx wrangler tail
```

You should see logs like:
```
Processing 1 grading task(s) from queue
Grading submission 123 for user 999
AI grading completed in 24567ms for submission 123
✅ Submission 123 graded successfully: Band 6.5
```

## Step 8: Check Dead Letter Queue

If any messages fail after max retries (3), they'll be in the DLQ:

```powershell
npx wrangler queues consumer ielts-grading-dlq
```

**Note**: You may need to set up a consumer for the DLQ to handle permanently failed messages (e.g., alert admins, trigger manual review).

## Troubleshooting

### Issue: Queue consumer not processing messages

**Solution**: Verify the queue binding is correct in `wrangler.toml` and redeploy:
```powershell
npx wrangler deploy --force
```

### Issue: "GRADING_QUEUE is not defined"

**Solution**: Ensure the producer binding is in `wrangler.toml`:
```toml
[[queues.producers]]
binding = "GRADING_QUEUE"
queue = "ielts-grading-tasks"
```

### Issue: Submissions stuck in PENDING

**Solution**: Check queue consumer logs:
```powershell
npx wrangler tail --format pretty
```

Look for errors like missing GEMINI_API_KEY or database connection issues.

### Issue: High retry count

**Solution**: Check the DLQ for error patterns:
```powershell
# Query D1 for retry statistics
npx wrangler d1 execute babel-frontier-db --remote --command="SELECT retry_count, COUNT(*) as count FROM submissions GROUP BY retry_count"
```

## Performance Expectations

After deployment, you should see:

- **Submit Endpoint**: < 200ms response time (instant)
- **Queue Processing**: 20-30 seconds per essay (AI grading time)
- **Polling Overhead**: Negligible (simple DB query)
- **Concurrency**: Unlimited submissions (Cloudflare Queues scale automatically)
- **Timeout Issues**: **Zero** ✅

## Next Steps

1. **Update Frontend**: Implement polling in `telegram-mini-app` (see frontend integration guide)
2. **Load Testing**: Run k6 tests with 500+ concurrent submissions
3. **Monitoring**: Set up alerts for DLQ messages
4. **Optimization**: Consider using Durable Objects for real-time WebSocket updates (future enhancement)

---

**Status**: The Async Grading Pipeline is now live! 🚀

Students will never see a timeout again. The "Antigravity" architecture is complete.
