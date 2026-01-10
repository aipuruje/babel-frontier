# FINAL DEPLOYMENT COMMANDS
# Execute these commands in order after completing OAuth login in browser

# Step 1: Verify you're logged in
wrangler whoami

# Step 2: Create BRAIN_KV namespace
wrangler kv namespace create BRAIN_KV
# IMPORTANT: Copy the ID from output, you'll need it below

# Step 3: Set version pointer in KV (replace <ID> with actual ID from step 2)
wrangler kv key put --namespace-id=<YOUR_KV_ID> "brain/current_version" "v1.0.0"

# Step 4: Apply D1 migration
wrangler d1 execute archive_of_tongues --file=".\api\db\migrations\002_brain_telemetry.sql"

# Step 5: Deploy to Pages
wrangler pages deploy dist --project-name=babel-frontier

# Step 6: Configure bindings in dashboard
# Go to: https://dash.cloudflare.com/7f497d52d236b552a4eb07ab6e4a7039/pages/view/babel-frontier/settings/functions
# Add:
#   BRAIN (R2) -> brain-packs
#   BRAIN_KV (KV) -> <ID from step 2>
#   DB (D1) -> archive_of_tongues
#   SESSIONS (KV) -> (existing)

Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "Visit: https://babel-frontier.pages.dev" -ForegroundColor Cyan
