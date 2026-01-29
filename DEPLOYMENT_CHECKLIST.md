# Deployment Checklist

## Pre-Deployment Steps

### 1. Environment Setup
- [ ] Copy `.env.production.template` to `.env.production`
- [ ] Fill in actual values for all environment variables
- [ ] Get Telegram Bot Token from @BotFather
- [ ] (Optional) Set up PostHog and Sentry accounts

### 2. Backend Deployment (Cloudflare Workers)

```bash
# Navigate to api directory
cd api

# Create D1 database
npx wrangler d1 create ielts-reading-db

# Update wrangler.toml with the database_id from above

# Create KV namespace
npx wrangler kv:namespace create SESSIONS

# Update wrangler.toml with the KV id from above

# Apply database schema
npx wrangler d1 execute ielts-reading-db --file=schema.sql

# Set Telegram bot token secret
npx wrangler secret put TELEGRAM_BOT_TOKEN

# Deploy to Cloudflare Workers
npx wrangler deploy

# Note the deployed URL (e.g., https://ielts-reading-api.your-subdomain.workers.dev)
```

### 3. Frontend Deployment (Cloudflare Pages)

```bash
# Update .env.production with backend URL from step 2
VITE_API_BASE_URL=https://ielts-reading-api.your-subdomain.workers.dev

# Build the project
npm run build

# Deploy to Cloudflare Pages (option 1: via CLI)
npm run deploy

# OR (option 2: via GitHub)
# 1. Push code to GitHub
# 2. Connect repository to Cloudflare Pages
# 3. Set build command: npm run build
# 4. Set build output directory: dist
# 5. Add environment variables from .env.production
```

### 4. Telegram Bot Configuration

```bash
# Set bot menu button to open your Mini App
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{
    "menu_button": {
      "type": "web_app",
      "text": "Open IELTS Mastery",
      "web_app": {
        "url": "https://your-app.pages.dev"
      }
    }
  }'

# Set bot commands
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "Start learning IELTS Reading"},
      {"command": "progress", "description": "View your progress"},
      {"command": "help", "description": "Get help"}
    ]
  }'
```

## Post-Deployment Verification

### 1. Backend Health Check
```bash
curl https://your-backend-url.workers.dev/api/health
# Expected: {"status":"ok"}
```

### 2. Frontend Accessibility
- [ ] Visit https://your-app.pages.dev
- [ ] Verify app loads without errors
- [ ] Check console for any errors

### 3. Telegram Integration
- [ ] Open bot in Telegram
- [ ] Click menu button
- [ ] Verify Mini App opens correctly
- [ ] Test user authentication

### 4. Functional Testing
- [ ] Complete onboarding flow
- [ ] Test at least 2 modules
- [ ] Verify XP tracking
- [ ] Test referral code generation
- [ ] Check offline functionality
- [ ] Test PWA installation

### 5. Performance Check
- [ ] Run Lighthouse audit
- [ ] Verify Core Web Vitals:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1

## Rollback Plan

If issues occur:
1. **Frontend**: Cloudflare Pages → Deployments → Rollback to previous
2. **Backend**: `npx wrangler rollback`
3. **Database**: Restore from backup (if available)

## Monitoring

- [ ] Set up error monitoring (Sentry)
- [ ] Configure analytics (PostHog)
- [ ] Monitor Cloudflare Analytics
- [ ] Check Cloudflare Workers logs: `npx wrangler tail`

## Notes

- Keep `.env.production` secure and never commit it to git
- Update `VITE_API_BASE_URL` in Cloudflare Pages environment variables if backend URL changes
- Monitor usage to stay within Cloudflare free tier limits
