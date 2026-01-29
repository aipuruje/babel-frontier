# IELTS Reading Mastery - Deployment Guide

## 🚀 Quick Deployment (Recommended: Railway + Cloudflare Pages)

### Prerequisites
- GitHub account
- Railway account (railway.app)
- Cloudflare account (cloudflare.com)

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Project
```bash
# Push code to GitHub first (if not already done)
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 1.2 Railway Setup
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect the backend

### 1.3 Add PostgreSQL Database
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will create a database and set `DATABASE_URL` automatically

### 1.4 Configure Environment Variables
In Railway dashboard, add these variables:
```
FRONTEND_URL=https://your-app.pages.dev (update after frontend deployment)
PORT=3001
NODE_ENV=production
```

### 1.5 Run Database Migration
In Railway terminal (Settings → Terminal):
```bash
npx prisma migrate deploy
```

### 1.6 Get Backend URL
- Find your backend URL in Railway dashboard (e.g., `https://ielts-backend.up.railway.app`)
- Copy this URL for frontend configuration

---

## Step 2: Deploy Frontend to Cloudflare Pages

### 2.1 Create Cloudflare Pages Project
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click "Pages" → "Create a project"
3. Connect to your GitHub repository
4. Select your repository

### 2.2 Build Configuration
```
Build command: npm run build
Build output directory: dist
Root directory: (leave empty or use project root)
```

### 2.3 Environment Variables
Add this variable before deploying:
```
VITE_API_BASE_URL=https://your-backend.up.railway.app
```
(Use the Railway URL from Step 1.6)

### 2.4 Deploy
- Click "Save and Deploy"
- Wait for build to complete (~2 minutes)
- Get your Cloudflare Pages URL (e.g., `https://ielts-reading-mastery.pages.dev`)

### 2.5 Update Backend CORS
Go back to Railway and update the `FRONTEND_URL` environment variable:
```
FRONTEND_URL=https://your-app.pages.dev
```

Redeploy the backend for the change to take effect.

---

## Step 3: Verify Deployment

### 3.1 Test Backend
```bash
curl https://your-backend.up.railway.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 3.2 Test Frontend
- Open your Cloudflare Pages URL
- Try registering a user
- Complete a module exercise
- Verify data persists on refresh

### 3.3 Check Database
- Go to Railway → PostgreSQL → Connect
- Use Prisma Studio locally:
  ```bash
  # Update backend/.env with Railway's DATABASE_URL
  cd backend
  npx prisma studio
  ```

---

## Alternative Deployment Options

### Option 2: Render (Backend) + Netlify (Frontend)

**Backend on Render:**
1. Go to render.com
2. New → Web Service
3. Connect GitHub repo
4. Build Command: `cd backend && npm install && npm run build`
5. Start Command: `node dist/server.js`
6. Add PostgreSQL database
7. Set environment variables

**Frontend on Netlify:**
1. Go to netlify.com
2. Sites → Import from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add `VITE_API_BASE_URL` environment variable

### Option 3: Self-Hosted (VPS)

**Requirements:** Ubuntu/Debian VPS with Node.js

```bash
# On VPS
git clone your-repo
cd your-repo

# Backend
cd backend
npm install
npm run build
```

**Install PM2:**
```bash
npm install -g pm2
pm2 start dist/server.js --name ielts-backend
pm2 save
pm2 startup
```

**Setup Nginx:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/dist;
    index index.html;
}
```

---

## Database Migration (SQLite → PostgreSQL)

If you have local data in SQLite:

1. Export data from SQLite:
   ```bash
   cd backend
   npm exec prisma db pull
   ```

2. Update `schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Run migration to PostgreSQL:
   ```bash
   npx prisma migrate deploy
   ```

---

## Environment Variables Reference

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://your-backend-url.com
```

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
```

---

## Troubleshooting

**CORS errors:**
- Verify `FRONTEND_URL` in backend matches your Cloudflare Pages URL exactly
- Redeploy backend after changing environment variables

**Database connection errors:**
- Check `DATABASE_URL` is correct in Railway
- Ensure migration has been run: `npx prisma migrate deploy`

**Frontend can't reach backend:**
- Verify `VITE_API_BASE_URL` is set correctly
- Check backend is responding: `curl https://backend-url/health`

**Build failures:**
- Check build logs in Railway/Cloudflare
- Verify all dependencies are in package.json
- Try building locally first: `npm run build`

---

## Post-Deployment Checklist

- [ ] Backend health endpoint responds
- [ ] Frontend loads without errors
- [ ] User registration works
- [ ] Progress saves to database
- [ ] Battle mode limits enforced
- [ ] Referral system functional
- [ ] Analytics tracking working

---

## Monitoring & Maintenance

**Railway:**
- Built-in logging and metrics
- Set up deploy notifications
- Monitor database usage

**Cloudflare Pages:**
- Analytics dashboard
- Deploy previews for PRs
- Automatic deployments on push

**Database Backups:**
- Railway PostgreSQL has automatic backups
- Export manually: `pg_dump` or Prisma Studio

---

## Cost Estimate

**Free Tier:**
- Railway: $5 credit/month (enough for small apps)
- Cloudflare Pages: Unlimited bandwidth
- Total: FREE for hobby projects

**Paid (if needed):**
- Railway: ~$5-10/month for backend + database
- Cloudflare Pages: Free
- **Total: ~$5-10/month**

---

## Support

If you encounter issues:
1. Check deployment logs in Railway/Cloudflare
2. Verify environment variables are correct
3. Test locally first with production environment
4. Check CORS and database connectivity

Your app is now live! 🎉
