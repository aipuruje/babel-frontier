#!/bin/bash

echo "🛰️ Initializing Babel Frontier Deployment..."

# 1. Create R2 Bucket
echo "📦 Creating R2 Bucket..."
npx wrangler r2 bucket create babel-frontier-audio

# 2. Create KV Namespaces
echo "⚡ Creating KV Namespaces..."
DRAFTS_KV_ID=$(npx wrangler kv:namespace create DRAFTS_KV --json | jq -r '.id')
LEADERBOARD_KV_ID=$(npx wrangler kv:namespace create LEADERBOARD_KV --json | jq -r '.id')

# 3. Create D1 Database
echo "📊 Creating D1 Database..."
D1_INFO=$(npx wrangler d1 create babel-frontier-db --json)
D1_ID=$(echo $D1_INFO | jq -r '.database_id')

# 4. Create Queue
echo "📥 Creating Grading Queue..."
npx wrangler queues create ielts-grading-tasks

# 5. Initialize Database Schema
echo "📝 Applying SQL Schema..."
npx wrangler d1 execute babel-frontier-db --file=./backend/schema.sql --remote

echo "------------------------------------------------"
echo "✅ INFRASTRUCTURE READY"
echo "D1 ID: $D1_ID"
echo "Drafts KV ID: $DRAFTS_KV_ID"
echo "Leaderboard KV ID: $LEADERBOARD_KV_ID"
echo "------------------------------------------------"
echo "👉 Update your wrangler.toml with these IDs and run 'npx wrangler deploy'"
