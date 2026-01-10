# Brain Pack Setup Script
# Run this script to initialize Brain Pack infrastructure

Write-Host "🧠 Initializing Brain Pack Infrastructure..." -ForegroundColor Cyan

# Step 1: Create KV Namespace for brain pack versioning
Write-Host "`n📦 Creating KV namespace..." -ForegroundColor Yellow
wrangler kv namespace create brain
wrangler kv namespace create brain --preview

# Step 2: Create R2 Bucket for brain pack storage
Write-Host "`n📦 Creating R2 bucket..." -ForegroundColor Yellow
wrangler r2 bucket create babel-frontier-brain

# Step 3: Upload initial brain pack to R2
Write-Host "`n📤 Uploading brain_pack_v1.json to R2..." -ForegroundColor Yellow
wrangler r2 object put babel-frontier-brain/brain/packs/brain_pack_v1.json --file=content/brain_pack_v1.json

# Step 4: Set current version pointer in KV
Write-Host "`n🔗 Setting version pointer in KV..." -ForegroundColor Yellow
$version = "v1.0.0"
wrangler kv key put "brain/current_version" $version --binding=KV

# Step 5: Apply learner state schema to D1
Write-Host "`n🗄️  Applying learner state schema to D1..." -ForegroundColor Yellow
wrangler d1 execute babel-frontier-db --file=db/schema_learner_state.sql --local
wrangler d1 execute babel-frontier-db --file=db/seed_learner_state.sql --local

# Step 6: Test BrainPackLoader
Write-Host "`n✅ Brain Pack infrastructure initialized!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update wrangler.toml with KV namespace ID and R2 bucket"
Write-Host "  2. Run 'npm run dev' to test BrainPackLoader"
Write-Host "  3. Test endpoint: GET /api/brain/status"
