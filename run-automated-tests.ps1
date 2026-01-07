# Automated k6 Installation and Test Execution
# Downloads k6 directly and runs all tests automatically

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AUTOMATED TEST EXECUTION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$K6_VERSION = "v0.48.0"
$K6_URL = "https://github.com/grafana/k6/releases/download/$K6_VERSION/k6-$K6_VERSION-windows-amd64.zip"
$K6_DIR = "$PSScriptRoot\k6-bin"
$K6_EXE = "$K6_DIR\k6.exe"

# Create k6 directory
if (!(Test-Path $K6_DIR)) {
    Write-Host "Creating k6 directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $K6_DIR -Force | Out-Null
}

# Download k6 if not exists
if (!(Test-Path $K6_EXE)) {
    Write-Host "Downloading k6 $K6_VERSION..." -ForegroundColor Yellow
    $zipFile = "$K6_DIR\k6.zip"
    
    try {
        Invoke-WebRequest -Uri $K6_URL -OutFile $zipFile -UseBasicParsing
        Write-Host "✓ Downloaded k6" -ForegroundColor Green
        
        Write-Host "Extracting k6..." -ForegroundColor Yellow
        Expand-Archive -Path $zipFile -DestinationPath $K6_DIR -Force
        
        # Move k6.exe from extracted folder to bin directory
        $extractedFolder = Get-ChildItem -Path $K6_DIR -Directory | Select-Object -First 1
        if ($extractedFolder) {
            Move-Item -Path "$($extractedFolder.FullName)\k6.exe" -Destination $K6_EXE -Force
        }
        
        Remove-Item $zipFile
        Write-Host "✓ k6 installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Failed to download k6: $_" -ForegroundColor Red
        Write-Host "Please install k6 manually from: https://k6.io/docs/get-started/installation/" -ForegroundColor Yellow
        exit 1
    }
}
else {
    Write-Host "✓ k6 already installed" -ForegroundColor Green
}

Write-Host ""

# Set environment variables
$env:BASE_URL = "https://babel-frontier.rahrus1977.workers.dev"
$env:USE_MOCK_AI = "true"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Base URL: $env:BASE_URL"
Write-Host "  Mock AI: $env:USE_MOCK_AI"
Write-Host "  k6 Path: $K6_EXE"
Write-Host ""

# Create reports directory
$REPORTS_DIR = "$PSScriptRoot\reports"
if (!(Test-Path $REPORTS_DIR)) {
    New-Item -ItemType Directory -Path $REPORTS_DIR -Force | Out-Null
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RUNNING TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Baseline (50 users)
Write-Host "[1/5] Running Baseline Test (50 users)..." -ForegroundColor Yellow
& $K6_EXE run --config load-testing/config/ramp-up-50.json `
    --out json="$REPORTS_DIR/k6-baseline-50.json" `
    load-testing/k6-scripts/speaking-stress-test.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Baseline test passed" -ForegroundColor Green
}
else {
    Write-Host "⚠ Baseline test had issues (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
}
Write-Host ""

# Test 2: Grading Latency (200 users)
Write-Host "[2/5] Running Grading Latency Test (200 users)..." -ForegroundColor Yellow
& $K6_EXE run --config load-testing/config/ramp-up-200.json `
    --out json="$REPORTS_DIR/k6-grading-200.json" `
    load-testing/k6-scripts/grading-latency-test.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Grading latency test passed" -ForegroundColor Green
}
else {
    Write-Host "⚠ Grading test had issues" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Writing Auto-Save Stress (500 users)
Write-Host "[3/5] Running Writing Stress Test (500 users)..." -ForegroundColor Yellow
& $K6_EXE run --config load-testing/config/ramp-up-500.json `
    --out json="$REPORTS_DIR/k6-stress-500.json" `
    load-testing/k6-scripts/writing-stress-test.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Stress test passed" -ForegroundColor Green
}
else {
    Write-Host "⚠ Stress test pushed limits (expected)" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Pedagogical Audits
Write-Host "[4/5] Running Pedagogical Audits..." -ForegroundColor Yellow

Write-Host "  - Cullen Checksum..." -ForegroundColor Gray
node pedagogical-audit/cullen-checksum.js 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Cullen Checksum complete" -ForegroundColor Green
}

Write-Host "  - AI Fuzzer..." -ForegroundColor Gray
node pedagogical-audit/fuzzer.js 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ AI Fuzzer complete" -ForegroundColor Green
}
Write-Host ""

# Test 5: Friction Analysis
Write-Host "[5/5] Running Friction Analysis..." -ForegroundColor Yellow

if (Test-Path "$REPORTS_DIR/k6-baseline-50.json") {
    Write-Host "  - Analyzing baseline..." -ForegroundColor Gray
    node pedagogical-audit/friction-analyzer.js "$REPORTS_DIR/k6-baseline-50.json" 2>&1 | Out-Null
}

if (Test-Path "$REPORTS_DIR/k6-stress-500.json") {
    Write-Host "  - Analyzing stress test..." -ForegroundColor Gray
    node pedagogical-audit/friction-analyzer.js "$REPORTS_DIR/k6-stress-500.json" 2>&1 | Out-Null
}

Write-Host "  ✓ Friction analysis complete" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ALL TESTS COMPLETE!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display results summary
Write-Host "📊 Generated Reports:" -ForegroundColor Yellow
Write-Host ""

if (Test-Path "$REPORTS_DIR\sim_friction_heatmap.json") {
    Write-Host "✓ sim_friction_heatmap.json" -ForegroundColor Green
    $heatmap = Get-Content "$REPORTS_DIR\sim_friction_heatmap.json" | ConvertFrom-Json
    
    if ($heatmap.criticalFriction -and $heatmap.criticalFriction.Count -gt 0) {
        Write-Host "  ⚠ CRITICAL FRICTION DETECTED: $($heatmap.criticalFriction.Count) issues" -ForegroundColor Red
        foreach ($friction in $heatmap.criticalFriction) {
            Write-Host "    - $($friction.type): $($friction.value)" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "  ✓ No critical friction detected" -ForegroundColor Green
    }
}

if (Test-Path "$REPORTS_DIR\cullen_checksum_report.json") {
    Write-Host "✓ cullen_checksum_report.json" -ForegroundColor Green
    $cullen = Get-Content "$REPORTS_DIR\cullen_checksum_report.json" | ConvertFrom-Json
    Write-Host "  Pass Rate: $($cullen.summary.passRate)%" -ForegroundColor $(if ($cullen.summary.passRate -ge 80) { "Green" } else { "Red" })
}

if (Test-Path "$REPORTS_DIR\fuzzer_report.json") {
    Write-Host "✓ fuzzer_report.json" -ForegroundColor Green
    $fuzzer = Get-Content "$REPORTS_DIR\fuzzer_report.json" | ConvertFrom-Json
    if ($fuzzer.summary.crashed -gt 0) {
        Write-Host "  ⚠ $($fuzzer.summary.crashed) crashes detected!" -ForegroundColor Red
    }
    else {
        Write-Host "  ✓ No crashes - all edge cases handled" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Full reports in: $REPORTS_DIR" -ForegroundColor Cyan
Write-Host ""
