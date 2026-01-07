# Babel Frontier - Automated GitHub Actions Deployment

## 🚀 Fully Automated Deployment via GitHub Actions

This project uses GitHub Actions for zero-manual-work deployment to Cloudflare!

### One-Time Setup (5 minutes)

#### 1. Create GitHub Repository

```bash
# Already initialized locally, now create on GitHub
gh repo create babel-frontier --public --source=. --remote=origin --push
```

Or manually:
1. Go to https://github.com/new
2. Name: `babel-frontier`  
3. Don't initialize with README (we already have code)
4. Create repository

#### 2. Set GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Value | Where to Get |
|------------|-------|--------------|
| `CLOUDFLARE_API_TOKEN` | `LGdkixH8XMl97IeNe3EA2Md1l33I-5ZwXGASyANb` | Already provided |
| `CLOUDFLARE_ACCOUNT_ID` | `f44b6b0b72ff584884455831db9b666e` | Already retrieved |
| `TELEGRAM_BOT_TOKEN` | `7871977412:AAGWGoENUckFYCLdCL0CsYE9z2bG7Jnc4HI` | From .env |
| `OPENAI_API_KEY` | `sk-proj-...` | From .env |
| `WORKER_URL` | *(leave empty initially)* | After first deploy |

#### 3. Push to GitHub

```bash
cd d:\apps\game

# Add all files
git add .

# Commit
git commit -m "Initial commit: Babel Frontier IELTS RPG"

# Add remote (use your GitHub username)
git remote add origin https://github.com/aipuruje/babel-frontier.git

# Push
git push -u origin main
```

#### 4. Watch the Magic! 🎉

GitHub Actions will automatically:
1. ✅ Build the Telegram Mini App
2. ✅ Create D1 database (if it doesn't exist)
3. ✅ Create KV namespace (if it doesn't exist)
4. ✅ Apply D1 schema
5. ✅ Deploy Cloudflare Workers
6. ✅ Deploy Telegram Mini App to Cloudflare Pages
7. ✅ Set Telegram webhook

Go to: `https://github.com/aipuruje/babel-frontier/actions` to watch the deployment!

---

## 📦 What Happens on Every Push

Whenever you push to the `main` branch:

```bash
git add .
git commit -m "Updated feature"
git push
```

GitHub Actions will:
- Automatically rebuild
- Redeploy Workers
- Redeploy Pages
- Update D1 schema (if changed)

**Zero manual steps!**

---

## 🔧 Manual Trigger

You can also manually trigger deployment:

1. Go to: `https://github.com/aipuruje/babel-frontier/actions`
2. Click "Deploy Babel Frontier to Cloudflare"
3. Click "Run workflow"
4. Select branch: `main`
5. Click "Run workflow"

---

## 📝 After First Deployment

### Get Worker URL

After the first deployment completes:

1. Go to https://dash.cloudflare.com
2. Navigate to Workers & Pages
3. Click `babel-frontier`
4. Copy the URL (e.g., `https://babel-frontier.your-subdomain.workers.dev`)

### Update WORKER_URL Secret

1. Go to GitHub → Settings → Secrets
2. Add new secret:
   - Name: `WORKER_URL`
   - Value: `https://babel-frontier.your-subdomain.workers.dev`

3. Re-run the workflow (or make a new commit)

This will automatically set your Telegram webhook!

---

## 🧪 Testing Deployment

### Check Workflow Status

`https://github.com/aipuruje/babel-frontier/actions`

Look for green checkmarks ✅

### Test Telegram Bot

1. Open Telegram
2. Go to @ielts_rater_bot
3. Send `/start`
4. Click "Launch App" or use bot menu button

### View Logs

- **GitHub Actions**: See deployment logs in Actions tab
- **Cloudflare Workers**: https://dash.cloudflare.com → Workers → babel-frontier → Logs

---

## 🎯 Complete Automation Achieved!

**Before**: Manual Wrangler commands, credential issues  
**After**: `git push` = automatic deployment

**Commands needed**: Just 3!
```bash
git add .
git commit -m "message"
git push
```

Everything else is automated! 🚀

---

## 🔍 Troubleshooting

### "Deployment failed"
- Check GitHub Actions logs
- Verify all secrets are set correctly
- Ensure Cloudflare API token has required permissions

### "Webhook not set"
- Add `WORKER_URL` secret after first deployment
- Re-run workflow

### "D1/KV already exists errors"
- These are expected! The workflow continues with `continue-on-error: true`

---

## 📊 Deployment Checklist

After pushing to GitHub, verify:

- [ ] GitHub Actions workflow completes successfully
- [ ] Worker deployed to Cloudflare
- [ ] Telegram Mini App deployed to Pages
- [ ] D1 database contains tables (check Cloudflare dashboard)
- [ ] Telegram bot responds to `/start`
- [ ] Bot menu button launches Mini App

**If all checked ✅ → You're live!** 🎉
