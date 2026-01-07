# Test Script: Neural Cross-Pollination System
# Test all components of Brain Evolution Step 4

Write-Host "=== NEURAL CROSS-POLLINATION SYSTEM TEST ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8787"
$testUserId = "test_neural_$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "Test User ID: $testUserId" -ForegroundColor Yellow
Write-Host ""

# Test 1: Golden Thread - Extract Phrases from Reading Content
Write-Host "TEST 1: Golden Thread Extraction" -ForegroundColor Green
Write-Host "--------------------------------------"

$readingContent = @{
    user_id      = $testUserId
    mission_id   = 1
    mission_type = "reading"
    full_content = @"
The economic crisis played a pivotal role in shaping government policy. Despite numerous challenges, 
officials managed to shed light on the underlying causes of the recession. With regard to future prevention, 
experts emphasized the need for comprehensive regulatory reform.
"@
    title        = "Cambridge IELTS Reading Test 1"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/golden-thread/extract" -Method Post -Body $readingContent -ContentType "application/json"
    Write-Host "✓ Phrases extracted successfully!" -ForegroundColor Green
    Write-Host "  Phrases found: $($response.phrases_extracted)" -ForegroundColor Cyan
    $response.phrases | ForEach-Object {
        Write-Host "  - '$($_.target_phrase)' (Band $($_.band_value), $($_.phrase_type))" -ForegroundColor White
    }
    Write-Host ""
}
catch {
    Write-Host "✗ Extraction failed: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Get Active Buffer
Write-Host "TEST 2: Retrieve Active Memory Buffer" -ForegroundColor Green
Write-Host "--------------------------------------"

try {
    $bufferResponse = Invoke-RestMethod -Uri "$baseUrl/api/golden-thread/active-buffer/$testUserId" -Method Get
    Write-Host "✓ Active buffer retrieved!" -ForegroundColor Green
    Write-Host "  Charged Spells count: $($bufferResponse.count)" -ForegroundColor Cyan
    
    if ($bufferResponse.charged_spells.Count -gt 0) {
        $firstSpell = $bufferResponse.charged_spells[0]
        Write-Host "  First spell: '$($firstSpell.target_phrase)'" -ForegroundColor White
        Write-Host "  Time remaining: $($firstSpell.seconds_remaining) seconds" -ForegroundColor White
        
        # Save for flashback test
        $bufferId = $firstSpell.id
    }
    Write-Host ""
}
catch {
    Write-Host "✗ Buffer retrieval failed: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Flashback
if ($bufferId) {
    Write-Host "TEST 3: Recollection Flashback" -ForegroundColor Green
    Write-Host "--------------------------------------"
    
    $flashbackRequest = @{
        buffer_id = $bufferId
    } | ConvertTo-Json
    
    try {
        $flashbackResponse = Invoke-RestMethod -Uri "$baseUrl/api/golden-thread/flashback" -Method Post -Body $flashbackRequest -ContentType "application/json"
        Write-Host "✓ Flashback retrieved!" -ForegroundColor Green
        Write-Host "  Phrase: $($flashbackResponse.flashback.phrase)" -ForegroundColor Cyan
        Write-Host "  Original context: $($flashbackResponse.flashback.original_sentence)" -ForegroundColor White
        Write-Host "  Mentor message: $($flashbackResponse.flashback.mentor_message)" -ForegroundColor Yellow
        Write-Host ""
    }
    catch {
        Write-Host "✗ Flashback failed: $_" -ForegroundColor Red
        Write-Host ""
    }
}

# Test 4: Verify Phrase Usage in Speaking
Write-Host "TEST 4: Golden Thread Verification" -ForegroundColor Green
Write-Host "--------------------------------------"

$speakingOutput = @{
    user_id      = $testUserId
    mission_id   = 2
    mission_type = "speaking"
    user_output  = "I believe education played a pivotal role in my decision to study abroad. The university shed light on many career opportunities."
} | ConvertTo-Json

try {
    $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/api/golden-thread/verify" -Method Post -Body $speakingOutput -ContentType "application/json"
    Write-Host "✓ Verification complete!" -ForegroundColor Green
    Write-Host "  Activated: $($verifyResponse.activated)" -ForegroundColor Cyan
    Write-Host "  Total damage: $($verifyResponse.total_damage)" -ForegroundColor Yellow
    Write-Host "  Total XP: $($verifyResponse.total_xp)" -ForegroundColor Yellow
    Write-Host "  Message: $($verifyResponse.message)" -ForegroundColor White
    Write-Host ""
}
catch {
    Write-Host "✗ Verification failed: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 5: Record Cognitive Metrics
Write-Host "TEST 5: Dynamic Scaffolding - Record Metrics" -ForegroundColor Green
Write-Host "--------------------------------------"

$cognitiveMetrics = @{
    user_id        = $testUserId
    mission_id     = 3
    mission_type   = "writing"
    typing_metrics = @{
        avg_typing_latency_ms = 3500
        max_pause_duration_ms = 7200
        backspace_frequency   = 15
    }
} | ConvertTo-Json -Depth 10

try {
    $metricsResponse = Invoke-RestMethod -Uri "$baseUrl/api/dsg/record-metrics" -Method Post -Body $cognitiveMetrics -ContentType "application/json"
    Write-Host "✓ Metrics recorded!" -ForegroundColor Green
    Write-Host "  Hesitation Index: $($metricsResponse.hesitation_index)" -ForegroundColor Cyan
    Write-Host "  Cognitive Load: $($metricsResponse.cognitive_load)" -ForegroundColor Yellow
    Write-Host ""
}
catch {
    Write-Host "✗ Metrics recording failed: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 6: Get Scaffolding Intervention
Write-Host "TEST 6: Dynamic Scaffolding - Get Intervention" -ForegroundColor Green
Write-Host "--------------------------------------"

$interventionRequest = @{
    user_id        = $testUserId
    mission_id     = 3
    mission_type   = "writing"
    current_prompt = "Discuss the advantages and disadvantages of technology in modern education."
} | ConvertTo-Json

try {
    $interventionResponse = Invoke-RestMethod -Uri "$baseUrl/api/dsg/get-intervention" -Method Post -Body $interventionRequest -ContentType "application/json"
    Write-Host "✓ Intervention retrieved!" -ForegroundColor Green
    Write-Host "  Needed: $($interventionResponse.intervention_needed)" -ForegroundColor Cyan
    
    if ($interventionResponse.intervention_needed) {
        Write-Host "  Type: $($interventionResponse.intervention_type)" -ForegroundColor Yellow
        Write-Host "  Visibility: $($interventionResponse.visibility_level * 100)%" -ForegroundColor Yellow
        Write-Host "  Sentence Starters:" -ForegroundColor White
        $interventionResponse.intervention_content.sentence_starters | ForEach-Object {
            Write-Host "    - $_" -ForegroundColor Gray
        }
    }
    Write-Host ""
}
catch {
    Write-Host "✗ Intervention retrieval failed: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 7: Weekly User Report
Write-Host "TEST 7: Neural Pulse - Weekly Report" -ForegroundColor Green
Write-Host "--------------------------------------"

try {
    $reportResponse = Invoke-RestMethod -Uri "$baseUrl/api/neural-pulse/weekly-report/$testUserId" -Method Get
    Write-Host "✓ Weekly report generated!" -ForegroundColor Green
    Write-Host "  Phrases captured: $($reportResponse.passive_to_active.phrases_captured)" -ForegroundColor Cyan
    Write-Host "  Phrases activated: $($reportResponse.passive_to_active.phrases_activated)" -ForegroundColor Cyan
    Write-Host "  Activation rate: $($reportResponse.passive_to_active.activation_rate_percent)%" -ForegroundColor Yellow
    Write-Host "  Autonomy score: $($reportResponse.scaffolding.current_autonomy_score)" -ForegroundColor Yellow
    Write-Host ""
}
catch {
    Write-Host "✗ Report generation failed: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 8: Population Insights
Write-Host "TEST 8: Neural Pulse - Population Insights" -ForegroundColor Green
Write-Host "--------------------------------------"

try {
    $popResponse = Invoke-RestMethod -Uri "$baseUrl/api/neural-pulse/population-insights" -Method Get
    Write-Host "✓ Population insights retrieved!" -ForegroundColor Green
    Write-Host "  Active users (7 days): $($popResponse.population_size)" -ForegroundColor Cyan
    Write-Host "  Global activation rate: $($popResponse.global_metrics.activation_rate_percent)%" -ForegroundColor Yellow
    Write-Host "  Cullen checksum pass rate: $($popResponse.quality_assurance.cullen_checksum_pass_rate_percent)%" -ForegroundColor Yellow
    Write-Host ""
}
catch {
    Write-Host "✗ Population insights failed: $_" -ForegroundColor Red
    Write-Host ""
}

Write-Host ""
Write-Host "=== TEST SUITE COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Apply database schema: wrangler d1 execute babel-frontier-db --file=backend/neural_cross_pollination_schema.sql --remote" -ForegroundColor White
Write-Host "2. Deploy to production: git push" -ForegroundColor White
Write-Host "3. Monitor Neural Pulse weekly reports for effectiveness" -ForegroundColor White
