# Archive of Tongues — Cloudflare Workers + D1 MVP Skeleton

## What works (MVP)
- Telegram WebApp auth: `POST /auth/telegram` (validates initData)
- Session tokens in KV
- Canon quest progression Q001→Q015 stored in D1
- Objective scoring + XP/rank updates
- Clan Lite (create/join)
- Health + Me + Quest Next/Submit

## Prereqs
- Node.js 18+ (Node 20 recommended)
- Wrangler CLI (logged in)

## Fast start (Windows PowerShell)
```powershell
./setup.ps1
```

## Manual local dev
```bash
npm install
npm run db:schema:local
npm run db:seed:local
npm run dev
```

## Deploy
```bash
npm run db:schema
npm run db:seed
npm run deploy
```

## API quick test
- `GET /health`
- `POST /auth/telegram` body: `{ "initData":"<Telegram initData>", "locale":"uz" }`
- Use returned token: `Authorization: Bearer <sessionToken>`
- `POST /quest/next`
- `POST /quest/submit` body: `{ "questId":"Q001", "answers": {"T1":"A"} }`
