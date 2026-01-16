# IELTS Reading Mastery - Telegram Mini App

A comprehensive Telegram Mini App for mastering IELTS Academic Reading with AI-powered personalized training.

## Features

- **9 Interactive Learning Modules** targeting IELTS pain points
- **Cinematic Onboarding** with auto-play storytelling
- **Gamification System** (XP, levels, streaks, achievements)
- **Premium UI/UX** with glassmorphism and micro-animations
- **Progress Analytics** tracking 8 key metrics
- **Offline Support** with local caching

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: CSS Modules with CSS Variables
- **Animations**: Framer Motion
- **State**: Zustand with localStorage persistence
- **Telegram**: @twa-dev/sdk
- **Backend** (planned): Cloudflare Workers + D1 + R2 + KV

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── pages/          # Page components
├── components/     # Reusable components
├── modules/        # Learning module implementations
├── store/          # Zustand stores
├── utils/          # Utility functions
├── styles/         # Global styles and tokens
├── types/          # TypeScript definitions
└── ai/             # AI features
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `VITE_TELEGRAM_BOT_TOKEN` - Your Telegram Bot token
- `VITE_API_BASE_URL` - Backend API endpoint

## Deployment

This app is designed to be deployed to Cloudflare Pages with Workers integration.

## License

MIT
