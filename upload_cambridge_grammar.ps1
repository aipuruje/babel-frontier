# Autopoietic Brain: Batch Upload Script
# Upload Cambridge Grammar IELTS MP3 files to Neural-Sync Worker
# Run this script when Gemini API quota has refreshed (~1 hour after rate limit)

$worker_url = "https://neural-sync-worker.rahruz1977.workers.dev/upload"
$base_path = "124_1- Cambridge Grammar for IELTS with answers_Hopkins Diane, Cullen Pauline_2008 -CD\124_1- Cambridge Grammar for IELTS with answers_Hopkins Diane, Cullen Pauline_2008 -CD"

$files = @(
    "01 Cambridge Grammar for IELTS.mp3",
    "02 Cambridge Grammar for IELTS.mp3",
    "03 Cambridge Grammar for IELTS.mp3",
    "04 Cambridge Grammar for IELTS.mp3",
    "05 Cambridge Grammar for IELTS.mp3",
    "06 Cambridge Grammar for IELTS.mp3",
    "07 Cambridge Grammar for IELTS.mp3",
    "08 Cambridge Grammar for IELTS.mp3",
    "09 Cambridge Grammar for IELTS.mp3",
    "10 Cambridge Grammar for IELTS.mp3"
)

Write-Host "🧠 Starting Batch Upload to Autopoietic Brain..." -ForegroundColor Cyan
Write-Host "Total files: $($files.Length)`n" -ForegroundColor Yellow

$success_count = 0
$failed_count = 0

foreach ($file in $files) {
    $file_path = Join-Path $base_path $file
    $file_number = $file.Substring(0, 2)
    
    Write-Host "[$file_number] Uploading: $file" -ForegroundColor White
    
    $response = curl -X POST `
        -F "file=@$file_path" `
        -F "user_id=cambridge_grammar_$file_number" `
        $worker_url 2>&1
    
    if ($response -match '"status":"success"') {
        Write-Host "  ✅ SUCCESS - Mission generated!" -ForegroundColor Green
        $success_count++
        
        # Extract transcription snippet
        if ($response -match '"transcription_snippet":"([^"]+)"') {
            Write-Host "  📝 Transcript: $($Matches[1])" -ForegroundColor Gray
        }
    }
    elseif ($response -match 'Too Many Requests') {
        Write-Host "  ⏳ Rate limit hit - waiting 60 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 60
        # Retry once
        $response = curl -X POST -F "file=@$file_path" -F "user_id=cambridge_grammar_$file_number" $worker_url 2>&1
        if ($response -match '"status":"success"') {
            Write-Host "  ✅ SUCCESS on retry!" -ForegroundColor Green
            $success_count++
        } else {
            Write-Host "  ❌ FAILED: $response" -ForegroundColor Red
            $failed_count++
        }
    }
    else {
        Write-Host "  ❌ FAILED: $response" -ForegroundColor Red
        $failed_count++
    }
    
    # Delay between uploads to avoid rate limits
    if ($files.IndexOf($file) -lt $files.Length - 1) {
        Write-Host "  ⏸️  Waiting 20 seconds before next upload...`n" -ForegroundColor Gray
        Start-Sleep -Seconds 20
    }
}

Write-Host "`n🎉 Upload Complete!" -ForegroundColor Cyan
Write-Host "Success: $success_count / Failed: $failed_count" -ForegroundColor Yellow

# Check database
Write-Host "`n🔍 Checking database for generated missions..." -ForegroundColor Cyan
Set-Location "d:\apps\game\neural-sync-worker"
npx wrangler d1 execute babel-frontier-db --command "SELECT COUNT(*) as mission_count FROM missions"
npx wrangler d1 execute babel-frontier-db --command "SELECT user_id, title, difficulty, created_at FROM missions ORDER BY created_at DESC LIMIT 10"
