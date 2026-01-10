# Complete Automated Deployment Script
# Clears invalid API token and deploys with OAuth

$ErrorActionPreference = 'Stop'

Write-Host "=== Automated Cloudflare Pages Deployment ===" -ForegroundColor Cyan

# Step 1: Clear invalid API token environment variable
Write-Host "`n[1/5] Clearing invalid API token..." -ForegroundColor Yellow
if ($env:CLOUDFLARE_API_TOKEN) {
    $env:CLOUDFLARE_API_TOKEN = $null
    [System.Environment]::SetEnvironmentVariable('CLOUDFLARE_API_TOKEN', $null, 'Process')
    Write-Host "OK: Cleared CLOUDFLARE_API_TOKEN" -ForegroundColor Green
}

# Step 2: Logout and re-login
Write-Host "`n[2/5] Re-authenticating with Cloudflare..." -ForegroundColor Yellow
try {
    wrangler logout 2>&1 | Out-Null
}
catch {
    Write-Host "Logout skipped" -ForegroundColor Gray
}

Write-Host "Opening browser for OAuth login..." -ForegroundColor Cyan
wrangler login

# Step 3: Deploy to Pages
Write-Host "`n[3/5] Deploying to Pages..." -ForegroundColor Yellow
wrangler pages deploy dist --project-name=babel-frontier

# Step 4: Instructions for manual steps
Write-Host "`n[4/5] Next: Configure bindings manually" -ForegroundColor Yellow
Write-Host "Dashboard: https://dash.cloudflare.com/7f497d52d236b552a4eb07ab6e4a7039/pages/view/babel-frontier/settings/functions" -ForegroundColor Cyan
Write-Host "Add these bindings:" -ForegroundColor White
Write-Host "  BRAIN (R2) -> brain-packs" -ForegroundColor Gray
Write-Host "  BRAIN_KV (KV) -> Create new KV namespace via dashboard" -ForegroundColor Gray
Write-Host "  DB (D1) -> archive_of_tongues" -ForegroundColor Gray

# Step 5: Summary
Write-Host "`n[5/5] Deployment Summary" -ForegroundColor Yellow
Write-Host "Brain pack in R2: brain-packs/brain/packs/brain_pack_v1.0.0.json" -ForegroundColor Green
Write-Host "Migration file: .\api\db\migrations\002_brain_telemetry.sql" -ForegroundColor Green
Write-Host "Frontend deployed to: babel-frontier.pages.dev" -ForegroundColor Green

Write-Host "`nDONE! Complete bindings in dashboard." -ForegroundColor Green
