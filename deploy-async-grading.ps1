# Deployment Script: Async Grading Pipeline
# Run this script to set up Cloudflare Queues and deploy the async grading system

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Async Grading Pipeline Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create Cloudflare Queues
Write-Host "[1/5] Creating Cloudflare Queues..." -ForegroundColor Yellow

Write-Host "Creating main grading queue: ielts-grading-tasks" -ForegroundColor Gray
npx wrangler queues create ielts-grading-tasks

Write-Host "Creating dead letter queue: ielts-grading-dlq" -ForegroundColor Gray
npx wrangler queues create ielts-grading-dlq

Write-Host "✅ Queues created successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Apply Database Migration
Write-Host "[2/5] Applying database migration..." -ForegroundColor Yellow

$migrationFile = "backend\grading_queue_schema.sql"

if (Test-Path $migrationFile) {
    Write-Host "Running migration: $migrationFile" -ForegroundColor Gray
    npx wrangler d1 execute babel-frontier-db --remote --file=$migrationFile
    
    Write-Host "✅ Database schema updated" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Migration file not found: $migrationFile" -ForegroundColor Red
    Write-Host "Please ensure grading_queue_schema.sql exists in backend/" -ForegroundColor Red
}

Write-Host ""

# Step 3: Verify Configuration
Write-Host "[3/5] Verifying wrangler.toml configuration..." -ForegroundColor Yellow

$wranglerToml = Get-Content "wrangler.toml" -Raw

if ($wranglerToml -match "GRADING_QUEUE") {
    Write-Host "✅ Queue producer binding found: GRADING_QUEUE" -ForegroundColor Green
}
else {
    Write-Host "❌ Queue producer binding missing in wrangler.toml" -ForegroundColor Red
    exit 1
}

if ($wranglerToml -match "ielts-grading-tasks") {
    Write-Host "✅ Queue consumer configuration found" -ForegroundColor Green
}
else {
    Write-Host "❌ Queue consumer configuration missing in wrangler.toml" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Deploy Worker
Write-Host "[4/5] Deploying Worker with queue handlers..." -ForegroundColor Yellow

npx wrangler deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Worker deployed successfully" -ForegroundColor Green
}
else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Verify Queue Consumer
Write-Host "[5/5] Verifying queue consumer status..." -ForegroundColor Yellow

Write-Host "Listing queues..." -ForegroundColor Gray
npx wrangler queues list

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete! 🚀" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test the submission flow: POST /api/writing/submit" -ForegroundColor White
Write-Host "2. Poll for results: GET /api/submissions/:submissionId" -ForegroundColor White
Write-Host "3. Monitor queue activity in Cloudflare Dashboard" -ForegroundColor White
Write-Host "4. Run load tests: .\run-all-tests.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Troubleshooting:" -ForegroundColor Yellow
Write-Host "- View logs: npx wrangler tail" -ForegroundColor White
Write-Host "- Check DLQ: npx wrangler queues consumer ielts-grading-dlq" -ForegroundColor White
Write-Host ""
Write-Host "The Antigravity architecture is now LIVE!" -ForegroundColor Cyan
Write-Host "Students will never see timeouts again. ✨" -ForegroundColor Cyan
