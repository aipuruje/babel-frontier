# Cloudflare Pages Brain Pack Deployment Script
$ErrorActionPreference = 'Stop'

Write-Host "=== Cloudflare Pages Brain Pack Setup ===" -ForegroundColor Cyan

# Step 1: Copy brain pack to project root
Write-Host "`n[1/6] Preparing brain pack file..." -ForegroundColor Yellow
$brainPackSource = ".\api\content\brain_pack_v1.json"
$brainPackDest = ".\brain_pack_v1.0.0.json"

if (Test-Path $brainPackSource) {
    Copy-Item $brainPackSource $brainPackDest -Force
    Write-Host "OK: Brain pack copied to root" -ForegroundColor Green
}
else {
    throw "Brain pack not found at $brainPackSource"
}

# Step 2: Create R2 bucket
Write-Host "`n[2/6] Creating R2 bucket..." -ForegroundColor Yellow
$bucket = "brain-packs"
try {
    wrangler r2 bucket create $bucket 2>&1 | Out-Null
    Write-Host "OK: R2 bucket created: $bucket" -ForegroundColor Green
}
catch {
    Write-Host "OK: R2 bucket may already exist" -ForegroundColor Green
}

# Step 3: Upload brain pack to R2
Write-Host "`n[3/6] Uploading brain pack to R2..." -ForegroundColor Yellow
$r2Key = "brain/packs/brain_pack_v1.0.0.json"
wrangler r2 object put "$bucket/$r2Key" --file $brainPackDest
Write-Host "OK: Brain pack uploaded" -ForegroundColor Green

# Step 4: Create KV namespace
Write-Host "`n[4/6] Creating KV namespace..." -ForegroundColor Yellow
$kvOut = wrangler kv namespace create BRAIN_KV 2>&1 | Out-String
Write-Host $kvOut
if ($kvOut -match 'id\s*=\s*"([^"]+)"') {
    $kvId = $Matches[1]
    Write-Host "OK: KV ID = $kvId" -ForegroundColor Green
    Set-Content -Path ".\.brain_kv_id.tmp" -Value $kvId
}

# Step 5: Set KV pointer
Write-Host "`n[5/6] Setting KV version pointer..." -ForegroundColor Yellow
if (Test-Path ".\.brain_kv_id.tmp") {
    $kvId = Get-Content ".\.brain_kv_id.tmp"
    wrangler kv key put --namespace-id=$kvId "brain/current_version" "v1.0.0"
    Write-Host "OK: Version pointer set" -ForegroundColor Green
}

# Step 6: Create migration
Write-Host "`n[6/6] Creating migration file..." -ForegroundColor Yellow
$migDir = ".\api\db\migrations"
$migFile = "$migDir\002_brain_telemetry.sql"

if (-not (Test-Path $migDir)) {
    New-Item -ItemType Directory -Path $migDir -Force | Out-Null
}

if (-not (Test-Path $migFile)) {
    @"
-- Brain Pack Telemetry Migration
CREATE TABLE IF NOT EXISTS telemetry_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    session_id TEXT,
    event_name TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    client_data TEXT NOT NULL,
    fields_json TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_telemetry_user_ts ON telemetry_events(user_id, timestamp);
"@ | Set-Content -Path $migFile -Encoding UTF8
    Write-Host "OK: Migration created" -ForegroundColor Green
}
else {
    Write-Host "OK: Migration exists" -ForegroundColor Green
}

Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host "1. Add bindings in Pages dashboard:" -ForegroundColor White
Write-Host "   BRAIN (R2) -> brain-packs" -ForegroundColor Gray
if (Test-Path ".\.brain_kv_id.tmp") {
    $kvId = Get-Content ".\.brain_kv_id.tmp"
    Write-Host "   BRAIN_KV (KV) -> $kvId" -ForegroundColor Gray
}
Write-Host "2. Apply migration: wrangler d1 execute archive_of_tongues --file='.\api\db\migrations\002_brain_telemetry.sql'" -ForegroundColor White
Write-Host "3. Deploy: npm run build && wrangler pages deploy dist --project-name=babel-frontier" -ForegroundColor White
Write-Host "`nDONE!" -ForegroundColor Green
