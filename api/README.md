# IELTS Reading Mastery - Backend API

Complete backend infrastructure built with Cloudflare Workers, D1, and KV storage.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create database
npx wrangler d1 create ielts-reading-db

# 3. Update wrangler.toml with database_id from step 2

# 4. Create KV namespace  
npx wrangler kv:namespace create SESSIONS

# 5. Update wrangler.toml with KV id from step 4

# 6. Apply schema
npx wrangler d1 execute ielts-reading-db --file=schema.sql --local

# 7. Set bot token secret
npx wrangler secret put TELEGRAM_BOT_TOKEN

# 8. Run development server
npx wrangler dev

# 9. Test health check
curl http://localhost:8787/api/health
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with Telegram initData
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### User & Stats
- `GET /api/user/profile` - User profile
- `GET /api/user/stats` - Overall statistics
- `GET /api/user/progress` - All module progress

### Progress
- `GET /api/progress/:moduleId` - Module progress
- `POST /api/progress/:moduleId/start` - Start module
- `PUT /api/progress/:moduleId` - Update progress  
- `POST /api/progress/attempt` - Record attempt

### Analytics
- `POST /api/analytics/event` - Track event
- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/performance` - Performance metrics

## Database Schema

- **users** - Telegram user profiles
- **user_progress** - Module completion tracking
- **practice_attempts** - Individual practice sessions
- **analytics_events** - Event tracking
- **user_streaks** - Daily streak management

## Deployment

```bash
# Deploy to production
npx wrangler deploy

# View logs
npx wrangler tail
```

## Environment Variables

See `.env.example` and configure in `wrangler.toml`
