\
$ErrorActionPreference = "Stop"

function Require-Cmd($cmd) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $cmd"
  }
}

Require-Cmd node
Require-Cmd npm
Require-Cmd wrangler

Write-Host "==> Installing npm deps"
npm install

$d1Name = "archive_of_tongues"
Write-Host "==> Creating D1 database (if needed): $d1Name"
$d1Out = & wrangler d1 create $d1Name 2>&1
$d1Out = $d1Out | Out-String

$databaseId = $null
if ($d1Out -match 'database_id\s*=\s*"([^"]+)"') { $databaseId = $Matches[1] }

if (-not $databaseId) {
  Write-Host "Could not parse database_id from output."
  $databaseId = Read-Host "Paste D1 database_id for $d1Name"
}

Write-Host "==> Creating KV namespace: SESSIONS"
$kvOut = & wrangler kv namespace create "SESSIONS" 2>&1
$kvOut = $kvOut | Out-String

$kvId = $null
if ($kvOut -match 'id\s*=\s*"([^"]+)"') { $kvId = $Matches[1] }

if (-not $kvId) {
  Write-Host "Could not parse KV id from output."
  $kvId = Read-Host "Paste KV namespace id for SESSIONS"
}

Write-Host "==> Patching wrangler.toml"
$toml = Get-Content -Raw -Path "./wrangler.toml"
$toml = $toml -replace "__REPLACE_WITH_D1_ID__", $databaseId
$toml = $toml -replace "__REPLACE_WITH_KV_ID__", $kvId
Set-Content -Path "./wrangler.toml" -Value $toml -NoNewline

Write-Host "==> Set secrets (you will be prompted twice)"
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put SESSION_SIGNING_KEY

Write-Host "==> Apply schema + seed locally"
npm run db:schema:local
npm run db:seed:local

Write-Host "==> Start dev"
npm run dev
