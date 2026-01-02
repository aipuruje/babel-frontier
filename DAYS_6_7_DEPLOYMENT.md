# Days 6 & 7 Deployment Guide

## What's New
This deployment adds **Days 6 & 7: The Ignition Protocol** to the Babel Frontier project, featuring:
- **Day 06: The Ghost Simulation** - Shadow agent profiles and AI-driven stress testing
- **Day 07: Ignition Sunday** - Launch checklist and final deployment protocol
- Interactive tabs to switch between Day 6 and Day 7 content
- Friction analysis chart showing user drop-off zones
- Intent prompts for AI-driven game refinement

## Files Added
- `telegram-mini-app/public/days-6-7.html` - Standalone HTML page for Days 6 & 7

## How to Deploy

### Option 1: Direct Deployment (When API rate limit clears)
```bash
# From the project root (d:\apps\game)
npx wrangler deploy
```

### Option 2: Use GitHub Actions (Recommended)
If you have GitHub Actions set up, simply push to the main branch:
```bash
git add .
git commit -m "Add Days 6 & 7: The Ignition Protocol"
git push origin main
```

### Option 3: Authenticate and Deploy
If you need to re-authenticate with Cloudflare:
```bash
# Login to Cloudflare
npx wrangler login

# Deploy to production
npx wrangler deploy
```

## Accessing the Pages

Once deployed, you can access:
- **Main App**: https://babel-frontier.rahrus1977.workers.dev/
- **Days 6 & 7**: https://babel-frontier.rahrus1977.workers.dev/days-6-7.html

## Build Process Completed ✓
The frontend has already been built successfully:
- ✓ Vite build completed (453 modules transformed)
- ✓ Output: `telegram-mini-app/dist/`
- ✓ Ready for deployment

## Current Status
⚠️ **Cloudflare API Rate Limit**: The API is currently rate-limited. Please wait a few minutes before deploying.

## Troubleshooting

### If deployment fails with authentication error:
1. Run `npx wrangler login` to re-authenticate
2. Ensure you have the correct permissions for the Cloudflare account
3. Check that the API token (if used) has Worker deployment permissions

### If the page doesn't load:
1. Check that the file exists in `telegram-mini-app/dist/days-6-7.html` after build
2. Verify the Cloudflare Worker is serving static assets correctly
3. Check browser console for any JavaScript errors

## Features of Days 6 & 7

### Day 6: The Ghost Simulation
- **Shadow Agent Profiles**: Simulated users with different IELTS band levels
- **Friction Analysis Chart**: Radar chart showing user drop-off zones
- **Intent Prompts**: Copy-pasteable prompts for AI-driven game refinement
- **Simulation Metrics**: Avg. playtime, vocabulary gain, engagement peaks

### Day 7: Ignition Sunday
- **Launch Checklist**: 3-step deployment protocol
- **Final Push Intent Prompt**: Production deployment instructions
- **Ignition Button**: Symbolic launch command
- **10-Year Vision**: Metrics showing simulated impact

## Design Features
- **Cyberpunk Aesthetic**: Absolute Zero blue, Samarkand gold, obsidian black
- **Glassmorphism**: Blurred glass cards with subtle borders
- **Interactive Tabs**: Seamless switching between Day 6 and Day 7
- **Responsive Design**: Works on desktop and mobile
- **Chart.js Integration**: Radar chart for friction analysis
- **FontAwesome Icons**: Premium iconography

## Next Steps
1. Wait for Cloudflare API rate limit to clear (typically 5-15 minutes)
2. Run `npx wrangler deploy` from the project root
3. Verify deployment at https://babel-frontier.rahrus1977.workers.dev/days-6-7.html
4. Share the link with your team or beta testers!

---
**Created**: 2026-01-02
**Status**: Ready for deployment (pending API rate limit clearance)
