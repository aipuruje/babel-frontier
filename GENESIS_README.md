# 🎮 Babel Frontier - IELTS RPG for Uzbekistan

## Genesis Week: Zero-Coding Automated Deployment

Welcome to the **Babel Frontier** project - a revolutionary AAA IELTS RPG optimized for Uzbekistan, built using the **Genesis Week** methodology where AI orchestrates everything and you write **ZERO CODE**.

![Babel Frontier Logo](./babel_frontier_concept.png)

## 🚀 Quick Start (One Command!)

```bash
cd scripts
npm run genesis:automate
```

That's it! This single command will:
- ✅ Check/create .env credentials
- ✅ Install all dependencies
- ✅ Provision Cloudflare infrastructure (Workers, KV, D1)
- ✅ Set up Firebase (Firestore schemas, security rules)
- ✅ Build Telegram Mini App
- ✅ Deploy to Cloudflare Edge
- ✅ Configure Telegram bot webhook
- ✅ Open Genesis War Room in your browser

## 📋 Prerequisites

Before running the automation, ensure you have:

1. **API Credentials** (will be prompted if missing):
   - OpenAI API Key (temporary, will migrate to Gemini 2.5 Flash)
   - Cloudflare API Token & Account ID
   - Telegram Bot Token
   - Firebase Project ID (optional, can create new)

2. **Tools Installed**:
   - Node.js 18+ ([Download](https://nodejs.org/))
   - Wrangler CLI (auto-installed)
   - Git (for version control)

## 🏗️ Architecture Overview

```
Babel Frontier
├── frontend (Telegram Mini App)
│   ├── React + Tailwind CSS
│   ├── Framer Motion animations
│   └── Telegram WebApp SDK
│
├── backend (Cloudflare Workers)
│   ├── Speech Analysis API
│   ├── Pedagogy Engine
│   ├── D1 Database (User Brain State)
│   └── KV Store (Asset Caching)
│
└── scripts (Automation)
    ├── genesis_automate.js (Master orchestrator)
    ├── provision_infrastructure.js
    ├── setup_firebase.js
    └── deploy_to_edge.js
```

## 🎯 Genesis Week Roadmap

### Day 1: Spiritual Alignment ✅
- ✅ Pedagogy knowledge base integration
- ✅ CELTA/IELTS methodology infusion
- ✅ Automation infrastructure

### Day 2: Tashkent Handshake 🚧
- Provision Cloudflare Orbit nodes
- Optimize for <15ms latency
- Configure edge routing tables

### Day 3: Dopamine Sculpting
- Design 1,000 CSS armor pieces
- Implement Loot Loop system
- Build equipment progression

### Day 4: Neural Voice Core
- Migrate to Gemini 2.5 Flash Voice
- Implement emotion detection
- Build Uzbek accent mapping

### Day 5-6: Self-Healing Ghost Simulation
- Run 10,000 AI bot tests
- Auto-adjust difficulty curves
- Generate analytics dashboard

### Day 7: Closed Alpha Launch 🎉
- Deploy to 5 top students
- Collect feedback
- Monitor analytics

## 🛠️ Manual Steps (If Automation Fails)

If the one-command automation doesn't work, follow these steps:

### 1. Install Dependencies
```bash
cd scripts && npm install
cd ../telegram-mini-app && npm install
```

### 2. Configure Environment
Edit `.env` file:
```env
OPENAI_API_KEY=your-key-here
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
TELEGRAM_BOT_TOKEN=your-bot-token
FIREBASE_PROJECT_ID=your-project-id
```

### 3. Provision Cloudflare
```bash
cd scripts
node provision_infrastructure.js
```

### 4. Setup Firebase
```bash
node setup_firebase.js
```

### 5. Build & Deploy
```bash
cd ../telegram-mini-app
npm run build
cd ../scripts
node deploy_to_edge.js
```

## 📚 Key Files

| File | Purpose |
|------|---------|
| `scripts/genesis_automate.js` | Master automation orchestrator |
| `backend/api/index.js` | Cloudflare Worker (speech analysis) |
| `backend/pedagogy/knowledge_graph.js` | IELTS pedagogical engine |
| `telegram-mini-app/src/components/BattleArena.jsx` | Voice recording & analysis UI |
| `telegram-mini-app/src/components/UserBrainState.jsx` | 4-skill progression dashboard |
| `pedagogy-manifest.json` | Band 3.5-9.0 scoring system |
| `wrangler.toml` | Cloudflare Worker configuration |

## 🎮 Features

### Completed ✅
- Real-time speech analysis (OpenAI Whisper)
- Band score calculation (3.5 - 9.0)
- 4-skill domain tracking (Speaking, Listening, Reading, Writing)
- User Brain State dashboard
- Leaderboard system
- L1 interference detection (Uzbek → English)
- Equipment unlocking system
- Automated deployment pipeline

### In Progress 🚧
- Gemini 2.5 Flash Voice integration
- Emotion & accent mapping
- 1,000 procedural armor pieces
- Tashkent edge optimization (<15ms)
- Neural voice profiles

### Planned 📝
- Listening comprehension missions
- Reading T/F/NG battles
- Writing essay fortress builder
- 10,000 AI bot testing
- Analytics dashboard

## 🧪 Testing

### Local Development
```bash
# Backend (Cloudflare Worker)
wrangler dev backend/api/index.js

# Frontend (Telegram Mini App)
cd telegram-mini-app
npm run dev
```

### Test Speech Analysis
```bash
curl -X POST http://localhost:8787/api/speech-analysis \
  -F "audio=@test_audio.webm" \
  -F "user_id=test_user" \
  -F "username=TestPlayer"
```

## 🌍 Deployment Targets

- **Frontend**: Cloudflare Pages
- **Backend**: Cloudflare Workers (12 nodes)
- **Database**: D1 (SQL)
- **Cache**: KV Store (Tashkent replication)
- **CDN**: Cloudflare Edge Network

## 📖 Documentation

- [Implementation Plan](C:\Users\GL75\.gemini\antigravity\brain\29195efb-cb05-49d8-af7b-1a69d241b753\implementation_plan.md)
- [Task Breakdown](C:\Users\GL75\.gemini\antigravity\brain\29195efb-cb05-49d8-af7b-1a69d241b753\task.md)
- [Genesis War Room Guide](./GENESIS_WAR_ROOM.md) ← **START HERE**

## 💡 Pedagogy Philosophy

This project is built on the **Cullen-Ng Hybrid Method**:
- Active immersion over passive study
- Real-time error correction
- L1 interference detection (Uzbek/Russian → English)
- Band-specific progression (4.5 bottleneck → 7.0 breakthrough)
- Gamified dopamine loops (equipment > grades)

## 🤝 Contributing

This is a solo project orchestrated by AI. For questions or feedback:
- Open an issue
- Contact via Telegram: [Your Bot Username]

## 📄 License

MIT License - Built with Google Antigravity (Nov 2025+)

---

**Remember**: You don't write code. You **orchestrate** the system. The AI is your infrastructure engineer, pedagogy expert, and game designer. You are the **vision holder**.

🚀 Run `npm run genesis:automate` and watch the magic happen!
