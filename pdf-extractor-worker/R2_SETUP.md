# R2 Activation Required

## Issue
R2 is not enabled on your Cloudflare account. The Worker is deployed but can't access the R2 bucket.

## Solution (30 seconds)

1. **Enable R2** (one-time, free):
   - Visit: https://dash.cloudflare.com/?to=/:account/r2
   - Click "Purchase R2 Plan" 
   - Select FREE tier ($0/month for 10GB storage)
   - Click "Enable R2"

2. **Re-deploy Worker**:
   ```bash
   cd d:\apps\game\pdf-extractor-worker
   wrangler deploy
   ```

3. **Trigger Extraction**:
   ```bash
   curl -X POST "https://pdf-extractor.rahrus1977.workers.dev/extract-all"
   ```
   This will extract all 7 PDFs (~3-5 minutes)

## Check Progress
```bash
# See extraction progress
curl "https://pdf-extractor.rahrus1977.workers.dev/status"
```

## Verify Database
After extraction completes, Grammar Boss will have real content from Cambridge books.
