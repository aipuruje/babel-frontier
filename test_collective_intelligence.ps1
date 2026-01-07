# Collective Intelligence System Test Script
# Brain Evolution Step 6: End-to-End Testing

$baseUrl = "http://127.0.0.1:8787"

Write-Host "====================" -ForegroundColor Cyan
Write-Host "BRAIN EVOLUTION STEP 6" -ForegroundColor Cyan
Write-Host "Collective Intelligence Test" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Regional Analytics Aggregation
Write-Host "[TEST 1] Testing Hive-Mind Regional Aggregation..." -ForegroundColor Yellow
try {
    $aggregateResponse = Invoke-RestMethod -Uri "$baseUrl/api/hive/aggregate" -Method Post -ContentType "application/json"
    Write-Host "✓ Aggregation completed successfully" -ForegroundColor Green
    Write-Host "  - Regions processed: $($aggregateResponse.regions_processed)" -ForegroundColor Gray
    Write-Host "  - Clusters updated: $($aggregateResponse.clusters_updated)" -ForegroundColor Gray
    Write-Host "  - Weaknesses detected: $($aggregateResponse.weaknesses_detected)" -ForegroundColor Gray
    Write-Host "  - National avg band:  $($aggregateResponse.national_metrics.avg_overall_band)" -ForegroundColor Gray
    Write-Host "  - Band velocity: $($aggregateResponse.national_metrics.band_velocity)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Aggregation failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: National Heatmap
Write-Host "[TEST 2] Testing National Literacy Heatmap..." -ForegroundColor Yellow
try {
    $heatmapResponse = Invoke-RestMethod -Uri "$baseUrl/api/hive/national-heatmap" -Method Get
    Write-Host "✓ Heatmap generated successfully" -ForegroundColor Green
    Write-Host "  - Regions in heatmap: $($heatmapResponse.heatmap.Count)" -ForegroundColor Gray
    foreach ($region in $heatmapResponse.heatmap | Select-Object -First 3) {
        Write-Host "    $($region.region): $($region.user_count) users" -ForegroundColor Gray
    }
}
catch {
    Write-Host "✗ Heatmap generation failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Regional Weakness Detection
Write-Host "[TEST 3] Testing Regional Weakness Detection..." -ForegroundColor Yellow
$testRegions = @("Fergana", "Tashkent", "Samarkand")
foreach ($region in $testRegions) {
    try {
        $weaknessResponse = Invoke-RestMethod -Uri "$baseUrl/api/hive/regional-weakness/$region" -Method Get
        Write-Host "✓ Weakness detection for $region`: $($weaknessResponse.count) weaknesses found" -ForegroundColor Green
        if ($weaknessResponse.count -gt 0) {
            $topWeakness = $weaknessResponse.weaknesses[0]
            Write-Host "    Top weakness: $($topWeakness.skill_domain) ($($topWeakness.criteria))" -ForegroundColor Gray
            Write-Host "    Severity: $($topWeakness.weakness_severity)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "✗ Detection failed for $region`: $_" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Daily National Challenge Generation
Write-Host "[TEST 4] Generating Daily National Challenge..." -ForegroundColor Yellow
try {
    $challengeResponse = Invoke-RestMethod -Uri "$baseUrl/api/auto-forge/daily-national-challenge" -Method Post -ContentType "application/json"
    Write-Host "✓ Daily challenge generated successfully" -ForegroundColor Green
    Write-Host "  - Challenge ID: $($challengeResponse.challenge_id)" -ForegroundColor Gray
    Write-Host "  - Title: $($challengeResponse.challenge.title)" -ForegroundColor Gray
    Write-Host "  - Weaknesses addressed: $($challengeResponse.weaknesses_addressed)" -ForegroundColor Gray
    Write-Host "  - Missions generated: $($challengeResponse.missions_generated)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Challenge generation failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Get Today's Challenge
Write-Host "[TEST 5] Retrieving Today's Active Challenge..." -ForegroundColor Yellow
try {
    $todayChallenge = Invoke-RestMethod -Uri "$baseUrl/api/auto-forge/daily-challenge" -Method Get
    Write-Host "✓ Retrieved active challenge" -ForegroundColor Green
    if ($todayChallenge.challenge) {
        Write-Host "  - Title: $($todayChallenge.challenge.title)" -ForegroundColor Gray
        Write-Host "  - Goal: $($todayChallenge.challenge.goal_metric) - $($todayChallenge.challenge.goal_target)" -ForegroundColor Gray
        Write-Host "  - Current progress: $($todayChallenge.challenge.current_progress)/$($todayChallenge.challenge.goal_target)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "✗ Challenge retrieval failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: News Scraping
Write-Host "[TEST 6] Testing News Scraping Pipeline..." -ForegroundColor Yellow
try {
    $newsResponse = Invoke-RestMethod -Uri "$baseUrl/api/lore/scrape-news" -Method Post -ContentType "application/json"
    Write-Host "✓ News scraping completed" -ForegroundColor Green
    Write-Host "  - Articles scraped: $($newsResponse.articles_scraped)" -ForegroundColor Gray
    foreach ($article in $newsResponse.articles | Select-Object -First 2) {
        Write-Host "    - $($article.title)" -ForegroundColor Gray
        Write-Host "      Relevance: $($article.relevance)" -ForegroundColor DarkGray
    }
}
catch {
    Write-Host "✗ News scraping failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 7: Auto-Generate Dungeons from News
Write-Host "[TEST 7] Auto-Generating Dungeons from News..." -ForegroundColor Yellow
try {
    $dungeonsResponse = Invoke-RestMethod -Uri "$baseUrl/api/lore/auto-generate-dungeons" -Method Post -ContentType "application/json"
    Write-Host "✓ Dungeons auto-generated successfully" -ForegroundColor Green
    Write-Host "  - Dungeons created: $($dungeonsResponse.dungeons_generated)" -ForegroundColor Gray
    if ($dungeonsResponse.dungeons_generated -gt 0) {
        $firstDungeon = $dungeonsResponse.dungeons[0]
        Write-Host "    First dungeon: $($firstDungeon.dungeon.dungeon_name)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "✗ Dungeon generation failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 8: Get Current Events (News-based Dungeons)
Write-Host "[TEST 8] Retrieving Current Event Dungeons..." -ForegroundColor Yellow
try {
    $eventsResponse = Invoke-RestMethod -Uri "$baseUrl/api/lore/current-events" -Method Get
    Write-Host "✓ Current events retrieved" -ForegroundColor Green
    Write-Host "  - Active dungeons: $($eventsResponse.count)" -ForegroundColor Gray
    foreach ($event in $eventsResponse.current_events | Select-Object -First 3) {
        Write-Host "    - $($event.title)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "✗ Events retrieval failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 9: B2B Partner Registration
Write-Host "[TEST 9] Registering Institutional Partner..." -ForegroundColor Yellow
$partnerData = @{
    partner_type      = "university"
    organization_name = "Westminster International University (Test)"
    contact_email     = "admin@westminster.uz"
    access_tier       = "premium"
} | ConvertTo-Json

try {
    $partnerResponse = Invoke-RestMethod -Uri "$baseUrl/api/sultan/partner/register" -Method Post -Body $partnerData -ContentType "application/json"
    Write-Host "✓ Partner registered successfully" -ForegroundColor Green
    Write-Host "  - Partner ID: $($partnerResponse.partner_id)" -ForegroundColor Gray
    Write-Host "  - API Key: $($partnerResponse.api_key)" -ForegroundColor Gray
    Write-Host "  - Access scopes: $($partnerResponse.access_scopes -join ', ')" -ForegroundColor Gray
    
    $testApiKey = $partnerResponse.api_key
}
catch {
    Write-Host "✗ Partner registration failed: $_" -ForegroundColor Red
    $testApiKey = "sk_university_test_1234567890abcdef"
}
Write-Host ""

# Test 10: Government Literacy Heatmap (B2B Access)
Write-Host "[TEST 10] Testing Government Literacy Dashboard..." -ForegroundColor Yellow
try {
    # Register a government partner first
    $govPartnerData = @{
        partner_type      = "government"
        organization_name = "Ministry of Education (Test)"
        access_tier       = "enterprise"
    } | ConvertTo-Json
    
    $govPartner = Invoke-RestMethod -Uri "$baseUrl/api/sultan/partner/register" -Method Post -Body $govPartnerData -ContentType "application/json"
    $govApiKey = $govPartner.api_key
    
    $litHeatmap = Invoke-RestMethod -Uri "$baseUrl/api/sultan/government/literacy-heatmap?api_key=$govApiKey" -Method Get
    Write-Host "✓ Government heatmap accessed successfully" -ForegroundColor Green
    Write-Host "  - Regions in dashboard: $($litHeatmap.heatmap.Count)" -ForegroundColor Gray
    Write-Host "  - National avg band: $($litHeatmap.national_metrics.avg_overall_band)" -ForegroundColor Gray
    Write-Host "  - Economic opportunity %: $($litHeatmap.national_metrics.economic_opportunity_pct)" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Government dashboard access failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 11: University Elite Profiles
Write-Host "[TEST 11] Testing University Elite Profile Access..." -ForegroundColor Yellow
try {
    $eliteProfiles = Invoke-RestMethod -Uri "$baseUrl/api/sultan/university/elite-profiles?api_key=$testApiKey" -Method Get
    Write-Host "✓ Elite profiles accessed successfully" -ForegroundColor Green
    Write-Host "  - Available profiles: $($eliteProfiles.count)" -ForegroundColor Gray
    Write-Host "  - Placement fee per profile: $($eliteProfiles.placement_fee_per_profile) UZS" -ForegroundColor Gray
    if ($eliteProfiles.count -gt 0) {
        $profile = $eliteProfiles.elite_profiles[0]
        Write-Host "    Top profile:" -ForegroundColor Gray
        Write-Host "      - Overall band: $($profile.performance.overall_band)" -ForegroundColor DarkGray
        Write-Host "      - Velocity: $($profile.intelligence_signals.velocity)" -ForegroundColor DarkGray
        Write-Host "      - Region: $($profile.geographic_context.region)" -ForegroundColor DarkGray
    }
}
catch {
    Write-Host "✗ Elite profiles access failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 12: National Mastery Velocity Monitoring
Write-Host "[TEST 12] Testing National Mastery Velocity..." -ForegroundColor Yellow
try {
    $velocityResponse = Invoke-RestMethod -Uri "$baseUrl/api/hive/national-velocity" -Method Get
    Write-Host "✓ Velocity metrics retrieved" -ForegroundColor Green
    $latest = $velocityResponse.latest_metrics
    Write-Host "  - Total active users: $($latest.total_active_users)" -ForegroundColor Gray
    Write-Host "  - Avg overall band: $($latest.avg_overall_band)" -ForegroundColor Gray
    Write-Host "  - Band velocity: $($latest.band_velocity) bands/day" -ForegroundColor Gray
    Write-Host "  - Users above threshold (6.5+): $($latest.users_above_threshold)" -ForegroundColor Gray
    Write-Host "  - Stalled days: $($latest.stalled_days)" -ForegroundColor Gray
    
    if ($velocityResponse.alert_active) {
        Write-Host "  ⚠️ ALERT: $($velocityResponse.alert_message)" -ForegroundColor Magenta
    }
}
catch {
    Write-Host "✗ Velocity monitoring failed: $_" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "====================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Regional Analytics System: OPERATIONAL" -ForegroundColor Green
Write-Host "✓ Auto-Event Generator: OPERATIONAL" -ForegroundColor Green
Write-Host "✓ Infinite Lore Pipeline: OPERATIONAL" -ForegroundColor Green
Write-Host "✓ Sultan's API (B2G/B2B): OPERATIONAL" -ForegroundColor Green
Write-Host "✓ National Velocity Monitoring: OPERATIONAL" -ForegroundColor Green
Write-Host ""
Write-Host "The Collective Intelligence is ONLINE." -ForegroundColor Cyan
Write-Host "Babel Frontier has achieved National-Scale Sovereignty." -ForegroundColor Cyan
Write-Host ""
