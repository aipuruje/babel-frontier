# Week 2 Deployment Instructions

## Current Status

✅ **Frontend Build**: Complete (490 KB bundle)  
✅ **Backend Code**: Complete (9 new API endpoints)  
✅ **Database Schema**: Ready to deploy  
⚠️ **Deployment**: Blocked by Cloudflare API token permissions

---

## Quick Deploy Options

### Option 1: Fix API Token (2 minutes)

The current API token needs these permissions:

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Find your token or create new "Edit Cloudflare Workers" token
3. Required permissions:
   - **Account** → **Workers Scripts** → **Edit**
   - **Account** → **D1** → **Edit**
   - **Account** → **Workers KV Storage** → **Edit**
4. Save and update your `.env`:
   ```
   CLOUDFLARE_API_TOKEN=your_new_token_here
   ```
5. Deploy:
   ```bash
   cd d:\apps\game
   npx wrangler deploy
   ```

### Option 2: GitHub Actions (RECOMMENDED)

Already set up! Just push:

```bash
cd d:\apps\game
git add .
git commit -m "Week 2: Monetization & Writing Foundry"
git push origin main
```

GitHub Actions will handle everything automatically.

### Option 3: Cloudflare Dashboard Manual Deploy

1. Go to: https://dash.cloudflare.com
2. Navigate to Workers & Pages
3. Find "babel-frontier"
4. Upload `backend/api/index.js` manually
5. Upload `telegram-mini-app/dist/` as static assets

---

## After Deployment

### Test URLs

- **Main App**: https://babel-frontier.rahrus1977.workers.dev/
- **Marketplace**: https://babel-frontier.rahrus1977.workers.dev/marketplace
- **Writing Foundry**: https://babel-frontier.rahrus1977.workers.dev/writing-foundry

### Quick Test Script

```bash
# Test marketplace products endpoint
curl https://babel-frontier.rahrus1977.workers.dev/api/marketplace/products

# Test writing real-time analysis
curl -X POST https://babel-frontier.rahrus1977.workers.dev/api/writing/analyze-realtime \
  -H "Content-Type: application/json" \
  -d '{"text":"This is good essay about technology.","userId":"test","textHash":"abc123"}'

# Test inventory
curl https://babel-frontier.rahrus1977.workers.dev/api/inventory/test_user
```

### Initialize Database Tables

If tables aren't auto-created, run this ONCE after deployment:

```bash
wrangler d1 execute DB --remote --command="
-- Copy the CREATE TABLE statements from backend/schema.sql
-- Starting from line 63 (transactions table)
"
```

Or use GitHub Actions which handles this automatically.

---

## Sunday Night Checklist

Before going live with students:

- [ ] Deploy successfully
- [ ] Test all 3 marketplace products (buy each once)
- [ ] Test Writing Foundry with 250+ word essay
- [ ] Verify Grand Vizier feedback is in-character
- [ ] Check database has data (transactions, inventory, writing_submissions)
- [ ] Test on actual Telegram (not just browser)
- [ ] Verify payment amounts in UZS are correct for your market
- [ ] Set up Click.uz/Payme.uz merchant accounts (or keep mock for beta)

---

## Support

If deployment fails:
1. Check `wrangler.toml` has correct project name
2. Verify `GEMINI_API_KEY` is set in Cloudflare Workers secrets
3. Check browser console (F12) for JavaScript errors
4. Review deployment logs in Cloudflare dashboard

Your frontend is BUILT and ready (in `telegram-mini-app/dist/`). Just need to get it deployed! 🚀
