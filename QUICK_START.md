# Babel Frontier - Quick Start Guide

## 🚀 Deploy in 3 Steps

### Step 1: Get Cloudflare Credentials

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template
4. Copy the API token

5. Get your Account ID:
   - Go to https://dash.cloudflare.com
   - Select any site (or Workers & Pages)
   - Copy Account ID from the right sidebar

### Step 2: Update .env File

Edit `d:\apps\game\.env` and add:
```
CLOUDFLARE_API_TOKEN=your-token-here
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
```

The Telegram bot token and OpenAI key are already configured.

### Step 3: Run Automation

```bash
cd d:\apps\game\scripts
npm run genesis:automate
```

That's it! The script will:
- ✅ Provision Cloudflare Workers, KV, D1
- ✅ Generate wrangler.toml configuration
- ✅ Set up Firebase schemas
- ✅ Build Telegram Mini App  
- ✅ Deploy to Cloudflare Edge
- ✅ Configure Telegram webhook

## 📝 Manual Deployment (If Automation Fails)

```bash
# 1. Install Wrangler CLI globally
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Create D1 database
wrangler d1 create babel-frontier-db

# 4. Create KV namespace
wrangler kv:namespace create babel-frontier-assets

# 5. Update wrangler.toml with IDs from steps 3-4

# 6. Apply D1 schema
wrangler d1 execute babel-frontier-db --remote --file=backend/schema.sql

# 7. Deploy backend
wrangler deploy

# 8. Build and deploy frontend
cd telegram-mini-app
npm run build
wrangler pages deploy dist --project-name=babel-frontier-app
```

## 🧪 Local Testing

```bash
# Backend
wrangler dev backend/api/index.js

# Frontend
cd telegram-mini-app
npm run dev
```

## 📖 Documentation

- [Implementation Plan](.gemini/antigravity/brain/.../implementation_plan.md)
- [Genesis War Room](GENESIS_WAR_ROOM.md) - Day-by-day guide
- [Full README](GENESIS_README.md)
- [Walkthrough](.gemini/antigravity/brain/.../walkthrough.md)

## ❓ Need Help?

Check [GENESIS_WAR_ROOM.md](GENESIS_WAR_ROOM.md) for troubleshooting and detailed instructions!
