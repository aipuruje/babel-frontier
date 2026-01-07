# Babel Frontier - Final Setup Instructions

## ✅ What's Complete

- ✅ All code written (backend, frontend, automation)
- ✅ GitHub repository created: `aziyat1977/babel-frontier`
- ✅ GitHub Actions workflow configured
- ✅ Frontend built successfully
- ✅ D1 schema ready
- ✅ All dependencies installed

## 🚧 One-Time Manual Step Required

Your GitHub token lacks the `workflow` scope needed to push .github/workflows files.

### Option 1: Upload Workflow File Manually (2 minutes)

1. Go to: https://github.com/aziyat1977/babel-frontier

2. Click "Add file" → "Create new file"

3. File path: `.github/workflows/deploy.yml`

4. Copy contents from: `d:\apps\game\.github\workflows\deploy.yml`

5. Commit directly to `main` branch

### Option 2: Create New GitHub Token (3 minutes)

1. Go to: https://github.com/settings/tokens/new

2. Name: "Babel Frontier Deployment"

3. Scopes:
   - ✅ `repo` (Full control)
   - ✅ `workflow` (Update GitHub Action workflows)

4. Generate token

5. Update `.env`:
   ```
   GITHUB_TOKEN=new_token_here
   ```

6. Push again:
   ```bash
   git push origin HEAD:main --force
   ```

## 📝 Set GitHub Secrets

Go to: https://github.com/aziyat1977/babel-frontier/settings/secrets/actions

Click "New repository secret" and add:

| Name | Value |
|------|-------|
| `CLOUDFLARE_API_TOKEN` | `LGdkixH8XMl97IeNe3EA2Md1l33I-5ZwXGASyANb` |
| `CLOUDFLARE_ACCOUNT_ID` | `f44b6b0b72ff584884455831db9b666e` |
| `TELEGRAM_BOT_TOKEN` | `7871977412:AAGWGoENUckFYCLdCL0CsYE9z2bG7Jnc4HI` |
| `OPENAI_API_KEY` | Your OpenAI key from `.env` |

*(Leave `WORKER_URL` empty for now - will be set after first deployment)*

## 🚀 Trigger Deployment

### After workflow file is uploaded:

1. Go to: https://github.com/aziyat1977/babel-frontier/actions

2. Click "Deploy Babel Frontier to Cloudflare"

3. Click "Run workflow"

4. Select branch: `main`

5. Click "Run workflow"

**Watch the magic happen!** 🎉

The deployment will:
- ✅ Build Telegram Mini App
- ✅ Create D1 database
- ✅ Create KV namespace
- ✅ Deploy Workers
- ✅ Deploy Pages
- ✅ Apply D1 schema

## 📱 After Deployment

### Get Worker URL:

1. Check GitHub Actions logs (last step shows URLs)
   
   OR

2. Go to: https://dash.cloudflare.com → Workers & Pages

3. Click `babel-frontier`

4. Copy URL (e.g., `https://babel-frontier.xxx.workers.dev`)

### Set Worker URL Secret:

1. Go back to GitHub Secrets

2. Add new secret:
   - Name: `WORKER_URL`
   - Value: Your Worker URL

3. Re-run the workflow (webhook will be set automatically)

## ✅ Final Test

1. Open Telegram

2. Go to @ielts_rater_bot

3. Send `/start`

4. Click app launcher or menu button

5. **You should see the Babel Frontier Telegram Mini App!** 🎮

---

## 🔄 Future Updates

Once set up, deployment is FULLY automated:

```bash
# Make code changes
git add .
git commit -m "Added new feature"
git push
```

GitHub Actions automatically rebuilds and redeploys to Cloudflare! 🚀

---

## 📊 Deployment Checklist

- [ ] Upload `.github/workflows/deploy.yml` to GitHub (Option 1)
  
  **OR**
  
- [ ] Create new GitHub token with `workflow` scope (Option 2)

- [ ] Set all GitHub Secrets

- [ ] Manually trigger workflow

- [ ] Wait for deployment to complete (~3 min)

- [ ] Copy Worker URL from Cloudflare/GitHub logs

- [ ] Set `WORKER_URL` secret

- [ ] Re-run workflow

- [ ] Test Telegram bot

**When all checked ✅ → Babel Frontier is LIVE!** 🎉
