# Babel Frontier - Manual Deployment Guide

## ⚠️ Cloudflare API Token Issue

The API token provided lacks the required permissions for:
- Workers Scripts: Write
- D1: Edit
- KV: Edit
- Pages: Write

## 🚀 Alternative: Manual Deployment (5 Minutes)

### Step 1: Login to Wrangler

```bash
wrangler login
```

This will open your browser to authenticate with Cloudflare.

### Step 2: Create Resources

```bash
# Create D1 Database
wrangler d1 create babel-frontier-db
# Copy the database_id from output

# Create KV Namespace  
wrangler kv:namespace create babel-frontier-assets
# Copy the id from output
```

### Step 3: Update wrangler.toml

Edit `d:\apps\game\wrangler.toml` and replace:
- `YOUR_D1_DATABASE_ID` with your D1 database_id
- `YOUR_KV_NAMESPACE_ID` with your KV id

### Step 4: Apply D1 Schema

```bash
cd d:\apps\game
wrangler d1 execute babel-frontier-db --remote --file=backend\schema.sql
```

### Step 5: Deploy Workers

```bash
wrangler deploy
```

### Step 6: Build & Deploy Frontend

```bash
cd telegram-mini-app
npm run build
wrangler pages deploy dist --project-name=babel-frontier-app
```

### Step 7: Set Telegram Webhook

After deployment, Wrangler will show your Worker URL (e.g., `https://babel-frontier.your-subdomain.workers.dev`)

```bash
curl https://api.telegram.org/bot7871977412:AAGWGoENUckFYCLdCL0CsYE9z2bG7Jnc4HI/setWebhook \
  -d "url=YOUR_WORKER_URL/webhook"
```

## 🧪 Local Testing (No Deployment Needed)

### Test Backend Locally
```bash
cd d:\apps\game
wrangler dev backend\api\index.js
```

### Test Frontend Locally
```bash
cd d:\apps\game\telegram-mini-app
npm run dev
```

Open http://localhost:5173 to test the app!

## 📝 Next Steps

1. Test locally first (wrangler dev + npm run dev)
2. If local works, follow manual deployment steps above
3. Once deployed, test via Telegram bot

**OR** create a new Cloudflare API token with these permissions:
- Account > Workers Scripts > Edit
- Account > D1 > Edit  
- Account > Workers KV Storage > Edit
- Zone > Zone > Read
- Account > Cloudflare Pages > Edit

Then update `.env` and run `npm run genesis:automate` again!
