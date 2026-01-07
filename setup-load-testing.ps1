<#
.SYNOPSIS
    Setup script for Babel Frontier load testing infrastructure

.DESCRIPTION
    Creates KV namespace, R2 bucket, and applies database migrations
    for the performance testing and optimization framework

.NOTES
    Run this script BEFORE deploying the updated Worker code
#>

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Babel Frontier: Load Testing Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create KV Namespace
Write-Host "📦 Step 1: Creating KV Namespace for Draft Storage..." -ForegroundColor Yellow
try {
    $kvOutput = wrangler kv:namespace create DRAFTS_KV 2>&1 | Out-String
    Write-Host $kvOutput
    
    # Extract KV namespace ID from output
    if ($kvOutput -match 'id = "([a-f0-9-]+)"') {
        $kvId = $matches[1]
        Write-Host "Success! KV Namespace created: $kvId" -ForegroundColor Green
        Write-Host ""
        Write-Host "ACTION REQUIRED: Update wrangler.toml" -ForegroundColor Yellow
        Write-Host "   Replace 'YOUR_KV_NAMESPACE_ID' with: $kvId" -ForegroundColor White
        Write-Host ""
    }
    else {
        Write-Host "Could not extract KV namespace ID from output" -ForegroundColor Red
        Write-Host "Please check wrangler output above for the ID" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "KV namespace creation failed: $_" -ForegroundColor Red
}

# Step 2: Create R2 Bucket
Write-Host "🪣 Step 2: Creating R2 Bucket for Audio Streaming..." -ForegroundColor Yellow
try {
    wrangler r2 bucket create babel-audio
    Write-Host "Success! R2 bucket 'babel-audio' created" -ForegroundColor Green
}
catch {
    Write-Host "Note: R2 bucket may already exist or creation failed: $_" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Apply Database Migrations
Write-Host "Step 3: Applying Database Migrations..." -ForegroundColor Yellow
$migrationSQL = @"
-- Create speaking_sessions table for R2 streaming architecture
CREATE TABLE IF NOT EXISTS speaking_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    mission_id TEXT NOT NULL,
    topic TEXT,
    status TEXT DEFAULT 'initialized',
    chunks_uploaded INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_chunk_at TEXT,
    finalized_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(telegram_id)
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_speaking_sessions_user 
    ON speaking_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_speaking_sessions_session_id 
    ON speaking_sessions(session_id);

-- Ensure submissions table has proper indexes for writing analytics
CREATE INDEX IF NOT EXISTS idx_submissions_user_id 
    ON submissions(userId);

CREATE INDEX IF NOT EXISTS idx_submissions_created_at 
    ON submissions(submitted_at);
"@

# Save migration to temp file
$tempMigrationFile = "temp_migration_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
$migrationSQL | Out-File -FilePath $tempMigrationFile -Encoding UTF8

Write-Host "Running D1 migration..." -ForegroundColor White
try {
    wrangler d1 execute babel-frontier-db --file=$tempMigrationFile --remote
    Write-Host "Success! Database migrations applied" -ForegroundColor Green
}
catch {
    Write-Host "Migration failed: $_" -ForegroundColor Red
}

# Cleanup
Remove-Item $tempMigrationFile -ErrorAction SilentlyContinue
Write-Host ""

# Step 4: Verify Setup
Write-Host "Step 4: Verification Checklist" -ForegroundColor Yellow
Write-Host "   [ ] KV Namespace ID updated in wrangler.toml" -ForegroundColor White
Write-Host "   [ ] R2 bucket 'babel-audio' created" -ForegroundColor White
Write-Host "   [ ] Database migrations applied" -ForegroundColor White
Write-Host "   [ ] Run 'wrangler deploy' to deploy updated Worker" -ForegroundColor White
Write-Host ""

# Step 5: Next Steps
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update wrangler.toml with KV namespace ID (see above)" -ForegroundColor White
Write-Host "   2. Deploy Worker: wrangler deploy" -ForegroundColor White
Write-Host "   3. Run load tests:" -ForegroundColor White
Write-Host "      cd load-testing/k6-scripts" -ForegroundColor Gray
Write-Host "      k6 run writing-stress-test.js" -ForegroundColor Gray
Write-Host "      k6 run ai-chaos-auditor.js" -ForegroundColor Gray
Write-Host "      k6 run speaking-stress-test.js" -ForegroundColor Gray
Write-Host "   4. Review results in FRICTION_DASHBOARD.md" -ForegroundColor White
Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Green
