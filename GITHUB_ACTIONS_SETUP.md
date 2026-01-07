# GitHub Secrets Setup for Cloudflare Deployment

## Required Secrets

You need to add these secrets to your GitHub repository:

### 1. Cloudflare Credentials

**CLOUDFLARE_API_TOKEN**
- Go to: https://dash.cloudflare.com/profile/api-tokens
- Click "Create Token"
- Use template: "Edit Cloudflare Workers"
- Account: Your account (7f497d52d236b552a4eb07ab6e4a7039)
- Permissions:
  - Account > Workers Scripts > Edit
  - Account > Workers KV Storage > Edit
  - Account > Workers R2 Storage > Edit
  - Account > D1 > Edit
  - Account > Queues > Edit
- Create token and copy it

**CLOUDFLARE_ACCOUNT_ID**
- Value: `7f497d52d236b552a4eb07ab6e4a7039`

### 2. Application Secrets

From your `.env` file, add these as GitHub secrets:

**GEMINI_API_KEY**
- Your Gemini API key

**OPENAI_API_KEY**  
- Your OpenAI API key

**TELEGRAM_BOT_TOKEN**
- Your Telegram bot token

**JWT_SECRET**
- Your JWT secret key

**ENCRYPTION_KEY**
- Your encryption key

## How to Add Secrets

1. Go to: https://github.com/aziyat1977/babel-frontier/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret listed above
4. Name must match exactly (case-sensitive)

## After Adding Secrets

1. Go to Actions tab: https://github.com/aziyat1977/babel-frontier/actions
2. Click "Deploy to Cloudflare" workflow
3. Click "Run workflow" > "Run workflow"
4. Watch the deployment progress

## Deployment Process

The workflow will automatically:
1. ✅ Build the frontend
2. ✅ Create KV namespaces
3. ✅ Create R2 buckets
4. ✅ Create D1 database
5. ✅ Run database migrations
6. ✅ Create message queue
7. ✅ Set worker secrets
8. ✅ Deploy to Cloudflare

## Manual Deployment (Fallback)

If GitHub Actions doesn't work, deploy manually:

```bash
# Get your Cloudflare API token
export CLOUDFLARE_API_TOKEN="your_token_here"

# Deploy
wrangler deploy
```
