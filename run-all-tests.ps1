# Run All Load Tests - Automated Test Suite
# This script executes the complete testing framework:
# 1. Baseline test (50 users)
# 2. Daily peak test (200 users)
# 3. Stress test (500 users)
# 4. Pedagogical audits (Cullen Checksum + Fuzzer)
# 5. Friction analysis

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BABEL FRONTIER - Load Testing Framework" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BASE_URL = "https://babel-frontier.rahrus1977.workers.dev"
$USE_MOCK_AI = "true"  # Set to "false" to test with real Gemini (watch quota!)
$REPORTS_DIR = ".\reports"

# Set environment variables
$env:BASE_URL = $BASE_URL
$env:USE_MOCK_AI = $USE_MOCK_AI

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Base URL: $BASE_URL"
Write-Host "  Mock AI: $USE_MOCK_AI"
Write-Host ""

# Create reports directory
if (!(Test-Path $REPORTS_DIR)) {
    New-Item -ItemType Directory -Path $REPORTS_DIR -Force | Out-Null
}

# Check if k6 is installed
try {
    $k6Version = k6 version 2>&1
    Write-Host "✓ k6 installed: $k6Version" -ForegroundColor Green
}
catch {
    Write-Host "✗ k6 not found! Please install k6:" -ForegroundColor Red
    Write-Host "  Windows: choco install k6" -ForegroundColor Yellow
    Write-Host "  Or download from: https://k6.io/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PHASE 1: Baseline Test (50 users)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

k6 run --config load-testing/config/ramp-up-50.json `
    --out json="$REPORTS_DIR/k6-baseline-50.json" `
    load-testing/k6-scripts/speaking-stress-test.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Baseline test failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Baseline test complete" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PHASE 2: Daily Peak Test (200 users)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

k6 run --config load-testing/config/ramp-up-200.json `
    --out json="$REPORTS_DIR/k6-dailypeak-200.json" `
    load-testing/k6-scripts/grading-latency-test.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Daily peak test had errors (may be expected)" -ForegroundColor Yellow
}

Write-Host "✓ Daily peak test complete" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PHASE 3: Stress Test (500 users)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

k6 run --config load-testing/config/ramp-up-500.json `
    --out json="$REPORTS_DIR/k6-stress-500.json" `
    load-testing/k6-scripts/writing-stress-test.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠ Stress test pushed system limits (expected)" -ForegroundColor Yellow
}

Write-Host "✓ Stress test complete" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PHASE 4: Pedagogical Audits" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Running Cullen Checksum..." -ForegroundColor Yellow
node pedagogical-audit/cullen-checksum.js

Write-Host ""
Write-Host "Running AI Fuzzer..." -ForegroundColor Yellow
node pedagogical-audit/fuzzer.js

Write-Host ""
Write-Host "✓ Pedagogical audits complete" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PHASE 5: Friction Analysis" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Analyzing baseline test..." -ForegroundColor Yellow
node pedagogical-audit/friction-analyzer.js "$REPORTS_DIR/k6-baseline-50.json"

Write-Host ""
Write-Host "Analyzing stress test..." -ForegroundColor Yellow
node pedagogical-audit/friction-analyzer.js "$REPORTS_DIR/k6-stress-500.json"

Write-Host ""
Write-Host "✓ Friction analysis complete" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ALL TESTS COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Reports saved to: $REPORTS_DIR" -ForegroundColor Green
Write-Host ""
Write-Host "Key Files:" -ForegroundColor Yellow
Write-Host "  - sim_friction_heatmap.json (UX drop-off analysis)"
Write-Host "  - cullen_checksum_report.json (Pedagogical validation)"
Write-Host "  - fuzzer_report.json (Edge case testing)"
Write-Host "  - k6-*.json (Raw k6 metrics)"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Review sim_friction_heatmap.json for critical issues"
Write-Host "  2. Address any P0-CRITICAL recommendations"
Write-Host "  3. Re-run tests after fixes to validate improvements"
Write-Host ""
