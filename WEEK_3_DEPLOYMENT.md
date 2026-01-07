# Week 3 Deployment Guide

## Overview

Week 3 implementation is complete. This guide covers deploying all three days:
- **Day 15**: Confidence Engine with prosody analysis
- **Day 16**: AR Scanner with Gemini Vision
- **Day 17**: B2B University Bridge

---

## Deployment Steps

### 1. Apply Database Schema

Apply the Week 3 schema to your D1 database:

```bash
# Local testing
wrangler d1 execute babel-frontier-db --local --file=backend/week3_schema.sql

# Production
wrangler d1 execute babel-frontier-db --remote --file=backend/week3_schema.sql
```

**Schema includes:**
- `confidence_scores`, `prosody_analytics`, `filler_suggestions` (Day 15)
- `ar_scans`, `generated_passages`, `ar_achievements` (Day 16)
- `university_partners`, `placement_leads`, `consultation_bookings`, `placement_fees` (Day 17)

---

### 2. Build Frontend

Navigate to the frontend directory and build the updated app:

```bash
cd telegram-mini-app
npm run build
```

**New Components Added:**
- `src/components/ConfidenceArena.jsx`
- `src/components/ArchiveScavenger.jsx`
- `src/components/UniversityBridge.jsx`
- `src/components/B2BDashboard.jsx`

---

### 3. Update App Routing

Add routes to your main app file (`App.jsx` or routing configuration):

```javascript
import ConfidenceArena from './components/ConfidenceArena';
import ArchiveScavenger from './components/ArchiveScavenger';
import UniversityBridge from './components/UniversityBridge';
import B2BDashboard from './components/B2BDashboard';

// Add to your routing:
<Route path="/confidence-arena" element={<ConfidenceArena />} />
<Route path="/ar-scanner" element={<ArchiveScavenger />} />
<Route path="/university-bridge" element={<UniversityBridge />} />
<Route path="/b2b-dashboard" element={<B2BDashboard />} />
```

---

### 4. Deploy to Cloudflare

Deploy the updated Worker with new API endpoints:

```bash
cd d:/apps/game
npm run deploy
# or
wrangler deploy
```

This deploys:
- Updated `backend/api/index.js` with 11 new API endpoints
- Frontend `dist` folder with new components
- Serves via Cloudflare Workers

---

### 5. Verify Deployment

**Backend API Endpoints (Test with curl or Postman):**

```bash
# Day 15: Confidence Analysis
POST https://babel-frontier.rahrus1977.workers.dev/api/confidence/analyze-stream
GET  https://babel-frontier.rahrus1977.workers.dev/api/confidence/history/{userId}
GET  https://babel-frontier.rahrus1977.workers.dev/api/confidence/filler-spell

# Day 16: AR Scanner
POST https://babel-frontier.rahrus1977.workers.dev/api/vision/scan-object
GET  https://babel-frontier.rahrus1977.workers.dev/api/vision/passages/{userId}
POST https://babel-frontier.rahrus1977.workers.dev/api/vision/quiz-submit

# Day 17: B2B Portal
POST https://babel-frontier.rahrus1977.workers.dev/api/b2b/partners/register
GET  https://babel-frontier.rahrus1977.workers.dev/api/b2b/partners/{partnerId}/leads
POST https://babel-frontier.rahrus1977.workers.dev/api/b2b/consultation/book
GET  https://babel-frontier.rahrus1977.workers.dev/api/b2b/analytics/{partnerId}
POST https://babel-frontier.rahrus1977.workers.dev/api/b2b/lead/trigger
```

**Frontend Routes:**

Visit these URLs in your browser or Telegram Mini App:
- `https://babel-frontier.rahrus1977.workers.dev/confidence-arena`
- `https://babel-frontier.rahrus1977.workers.dev/ar-scanner`
- `https://babel-frontier.rahrus1977.workers.dev/university-bridge`
- `https://babel-frontier.rahrus1977.workers.dev/b2b-dashboard`

---

## Testing Checklist

### Day 15: Confidence Arena

- [ ] Open Confidence Arena in Telegram Mini App
- [ ] Grant microphone permissions
- [ ] Click "Enter Combat Arena"
- [ ] Speak fluently for 5 seconds (expect Titan/Warrior Aura)
- [ ] Speak with "um" and "err" fillers (expect Spectre Attack + glitch effect)
- [ ] Pause for 3+ seconds (expect armor crack visual)
- [ ] Verify Grand Vizier whispers filler spell via TTS
- [ ] Check confidence index, prosody metrics display

### Day 16: AR Scanner

- [ ] Open Archive Scavenger
- [ ] Grant camera permissions
- [ ] Scan a Pepsi bottle (expect beverage marketing passage)
- [ ] Complete heading-matching quiz
- [ ] Scan 2 more objects (street sign, phone)
- [ ] Verify "Samarkand Scholar" unlocks after 3rd scan
- [ ] Check achievement progress bar updates

### Day 17: University Bridge

- [ ] Create test user with Band 7.5+ (via admin or DB insert)
- [ ] Open University Bridge for that user
- [ ] Verify "Embassy Mission Unlocked" message appears
- [ ] View 3 partner universities
- [ ] Click "Book Free Consultation" for Cambridge
- [ ] Fill consultation form and submit
- [ ] Verify booking confirmation

### B2B Dashboard

- [ ] Open B2B Dashboard
- [ ] Login with demo token: `partner_uk_001`
- [ ] Verify analytics cards display (leads, consultations, avg band)
- [ ] View leads table (should show test user from Embassy Mission)
- [ ] Check revenue projection calculator
- [ ] Test with other tokens: `partner_uz_001`, `partner_us_001`

---

## Environment Variables

Ensure these are set in Cloudflare Workers:

```bash
GEMINI_API_KEY="your_gemini_api_key"
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
```

**No additional secrets needed for Week 3** – uses existing Gemini API key for both prosody analysis and vision.

---

## Database Seeds

The schema includes pre-seeded data:

**Filler Suggestions (Day 15):**
- 10 filler phrases like "Actually...", "That's an interesting question...", etc.

**University Partners (Day 17):**
- Cambridge International College (UK) - `partner_uk_001`
- Westminster University Tashkent (UZ) - `partner_uz_001`
- American University of Central Asia (US) - `partner_us_001`

---

## Troubleshooting

### "Microphone access denied"
- Ensure HTTPS connection (Telegram Mini Apps require secure context)
- Grant permissions when browser prompts

### "Camera not working"
- Mobile devices: ensure camera permissions granted to Telegram app
- Desktop: allow camera access in browser settings

### "Gemini API error"
- Verify `GEMINI_API_KEY` is set correctly in Cloudflare Workers secrets
- Check API quota limits

### "Database error"
- Ensure D1 database binding is configured in `wrangler.toml`
- Verify schema was applied successfully

---

## Revenue Impact

**Week 3 B2B Model:**
- Shifts from student micro-transactions to institutional placement fees
- **Placement fee**: 1,000,000 UZS (~$85 USD) per Band 7.5+ lead
- **Projected**: 20-50 leads/month = $1,700 - $4,250/month
- **At scale (200 leads/month)**: ~$17,000/month

**This completes Project Alisher's transformation from student-focused to institution-focused monetization.**

---

## Next Steps

After deployment:
1. Monitor Cloudflare Workers logs for API errors
2. Test all three days end-to-end in production
3. Create walkthrough.md documenting results
4. Share B2B Dashboard link with potential university partners
5. Iterate based on user feedback

---

## Files Modified/Created

**Backend:**
- `backend/week3_schema.sql` (NEW)
- `backend/api/index.js` (MODIFIED - added 11 endpoints + handlers)

**Frontend:**
- `src/components/ConfidenceArena.jsx` (NEW)
- `src/components/ArchiveScavenger.jsx` (NEW)
- `src/components/UniversityBridge.jsx` (NEW)
- `src/components/B2BDashboard.jsx` (NEW)

**Total Lines Added**: ~2,300 lines of code across backend and frontend.

---

✅ **Week 3 implementation complete. Ready for deployment!**
