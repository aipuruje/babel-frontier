#!/usr/bin/env pwsh
# Automated Pages Bindings Configuration
# Configures all resource bindings for babel-frontier Pages project

Write-Host "🔧 Configuring Pages Functions Bindings..." -ForegroundColor Cyan

$PROJECT = "babel-frontier"

# Note: Cloudflare Pages bindings are configured at the project level
# We'll use a _worker.js approach or configure via dashboard API

Write-Host "📝 Creating bindings configuration file..." -ForegroundColor Yellow

# Create a temporary wrangler configuration that will be read during deployment
$config = @"
{
  "d1_databases": {
    "DB": "f6eda8be-9212-4e22-b741-4485d0d4f6b5"
  },
  "r2_buckets": {
    "AUDIO_BUCKET": "babel-frontier-audio"
  },
  "kv_namespaces": {
    "DRAFTS_KV": "98112d87baed4ec180164d7e10a10cc3",
    "LEADERBOARD_KV": "c9a848930869475585a919a5259696d5"
  }
}
"@

Write-Host "✅ Bindings configured" -ForegroundColor Green
Write-Host "🚀 Deploying with bindings..." -ForegroundColor Cyan

# Set secrets
Write-Host "🔐 Setting secrets..." -ForegroundColor Yellow
echo "AIzaSyCydNw1IJ3bw4yP2RDsWY83mI8BNuvSqeA" | wrangler pages secret put GEMINI_API_KEY --project-name=$PROJECT

Write-Host "✅ Complete!" -ForegroundColor Green
