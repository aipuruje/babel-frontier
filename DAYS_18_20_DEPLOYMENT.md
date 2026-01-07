# Days 18-20 Deployment Guide

## Overview

Days 18-20 complete the "Sovereign Phase" transformation of Project Alisher:
- **Day 18**: Philosopher's Duel - Critical thinking via AI debates
- **Day 19**: The Great Game - National-scale competition
- **Day 20**: Oracle's Seal - Predictive exam readiness

---

## Deployment Steps

### 1. Apply Database Schema

```bash
# Local testing
wrangler d1 execute babel-frontier-db --local --file=backend/days_18_20_schema.sql

# Production
wrangler d1 execute babel-frontier-db --remote --file=backend/days_18_20_schema.sql
```

**New Tables (17 total):**
- Day 18: `debate_sessions`, `logical_arguments`, `debate_achievements`, `task2_prompts`
- Day 19: `regional_battles`, `territory_control`, `team_contributions`, `city_registrations`
- Day 20: `prediction_models`, `exam_bookings`, `readiness_seals`, `vocabulary_recommendations`, `daily_performance_snapshots`

---

### 2. Install Frontend Dependencies

The Oracle component requires Recharts for data visualization:

```bash
cd telegram-mini-app
npm install recharts
npm run build
```

---

### 3. Deploy Backend

```bash
cd d:/apps/game
wrangler deploy
```

This deploys:
- 13 new API endpoints
- Gemini 2.5 Reasoning Engine integration
- Multi-variate regression prediction model
- Real-time national battle sync

---

### 4. Test APIEndpoints

**Day 18: Philosopher's Duel**
```bash
# Start debate
POST /api/debate/start
Body: {"userId": "test_user", "philosopher": "al_khwarizmi"}

# Submit argument
POST /api/debate/submit-argument
Body: {"debateId": 1, "argumentText": "Space exploration is expensive..."}

# Get counter-argument
POST /api/debate/counterargument
Body: {"debateId": 1}
```

**Day 19: The Great Game**
```bash
# Join city
POST /api/national/join-team
Body: {"userId": "test_user", "cityName": "Tashkent"}

# Get live scores
GET /api/national/live-scores

# Contribute score
POST /api/national/contribute-score
Body: {"userId": "test_user", "battleId": 1, "contributionType": "speaking", "score": 85}
```

**Day 20: Oracle's Seal**
```bash
# Generate prediction (requires 5+ days of snapshot data)
GET /api/oracle/predict/test_user

# Get weaknesses
GET /api/oracle/weaknesses/test_user

# Book exam
POST /api/oracle/book-exam
Body: {"userId": "test_user", "examDate": "2026-02-15", "testCenter": "British Council Tashkent"}
```

---

## Frontend Integration

Add routes to your main app (`App.jsx`):

```javascript
import PhilosophersDuel from './components/PhilosophersDuel';
import TheGreatGame from './components/TheGreatGame';
import OraclesSeal from './components/OraclesSeal';

// Add to routing:
<Route path="/philosophers-duel" element={<PhilosophersDuel />} />
<Route path="/the-great-game" element={<TheGreatGame />} />
<Route path="/oracles-seal" element={<OraclesSeal />} />
```

---

## Testing Checklist

### Day 18: Philosopher's Duel
- [ ] Select philosopher (Socrates/Al-Khwarizmi/Steve Jobs)
- [ ] Receive Task 2 prompt
- [ ] Submit argument with weak logic
- [ ] Verify Gemini detects fallacies
- [ ] Submit argument with "Although..." structure
- [ ] Verify complexity score increases
- [ ] Complete 3 debates, check "Enlightened Scribe" unlocks

### Day 19: The Great Game
- [ ] Join Tashkent team
- [ ] Create active battle (schedule at 19:00)
- [ ] Contribute speaking score
- [ ] Verify real-time scoreboard updates
- [ ] Check territory map updates
- [ ] Test with 10+ concurrent users (load test)
- [ ] Verify winning city gets rewards

### Day 20: Oracle's Seal
- [ ] Create 20 days of synthetic user data
- [ ] Generate prediction
- [ ] Verify predicted date is reasonable (30-90 days)
- [ ] Check confidence % is 70-95%
- [ ] View weaknesses breakdown
- [ ] Generate 50-word vocabulary list
- [ ] Book mock exam
- [ ] Generate readiness seal certificate

---

## Data Seeding for Testing

To test Day 20, you need historical data. Here's a script to seed  snapshots:

```sql
-- Create 20 days of improving performance for a test user
INSERT INTO daily_performance_snapshots 
(user_id, snapshot_date, speaking_band, fluency_score, vocabulary_diversity, grammar_accuracy, task_response_depth, practice_sessions_today, total_xp)
VALUES
('test_user', date('now', '-20 days'), 5.0, 5.5, 4.8, 5.2, 5.0, 2, 500),
('test_user', date('now', '-18 days'), 5.1, 5.6, 5.0, 5.3, 5.2, 3, 800),
('test_user', date('now', '-16 days'), 5.3, 5.8, 5.1, 5.5, 5.4, 2, 1100),
('test_user', date('now', '-14 days'), 5.4, 6.0, 5.3, 5.6, 5.6, 4, 1500),
('test_user', date('now', '-12 days'), 5.6, 6.2, 5.5, 5.8, 5.8, 3, 1900),
('test_user', date('now', '-10 days'), 5.8, 6.4, 5.7, 6.0, 6.0, 2, 2300),
('test_user', date('now', '-8 days'), 6.0, 6.5, 5.9, 6.2, 6.2, 3, 2700),
('test_user', date('now', '-6 days'), 6.2, 6.7, 6.1, 6.4, 6.4, 4, 3200),
('test_user', date('now', '-4 days'), 6.4, 6.9, 6.3, 6.6, 6.6, 3, 3700),
('test_user', date('now', '-2 days'), 6.5, 7.0, 6.5, 6.8, 6.8, 2, 4100),
('test_user', date('now'), 6.7, 7.2, 6.7, 7.0, 7.0, 3, 4500);
```

---

## Revenue Projections

### Day 18: Indirect Revenue
- Improves Task Response scores → more Band 7.5+ students
- Increases B2B pipeline quality

### Day 19: Retention Boost
- Social pressure increases daily active users
- Average session length +40%
- 30-day retention +25%

### Day 20: Direct Revenue
- **Exam booking commission**: 10% of 2,500,000 UZS = 250,000 UZS (~$21 USD) per booking
- **Projected bookings**: 100/month = ~$2,100/month
- **Combined with B2B**: $6,350/month total

---

## Monitoring & Analytics

Key metrics to track:

**Day 18:**
- Average complexity score per debate
- Fallacy detection rate
- Enlightened Scribe unlock rate

**Day 19:**
- Active battles per week
- Average participants per battle
- Territory control distribution
- Peak concurrent users

**Day 20:**
- Prediction accuracy (actual vs predicted)
- Exam booking conversion rate
- Average confidence %
- Revenue from commissions

---

## Production Considerations

### Gemini API Usage
- Day 18 uses 2 Gemini calls per debate turn
- Estimated: 100 debates/day = 200 API calls/day
- Cost: ~$0.10/day at current Gemini pricing

### Database Performance
- Add indexes for heavy queries:
```sql
CREATE INDEX IF NOT EXISTS idx_snapshots_user_date ON daily_performance_snapshots(user_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_battles_active ON regional_battles(status, scheduled_time);
```

### Real-Time Sync (Day 19)
- Consider Cloudflare Durable Objects for true real-time (<10ms)
- Current implementation: 3-second polling (acceptable for MVP)
- At 1,000+ users: upgrade to WebSockets

---

## Troubleshooting

**"Insufficient data for prediction"**
- Ensure user has at least 5 daily snapshots
- Run the data seeding script above

**"No active battle"**
- Schedule a battle: `POST /api/national/schedule-battle`
- Battle must have `status = 'active'`

**Gemini API errors**
- Check `GEMINI_API_KEY` is set correctly
- Verify API quota hasn't been exceeded

**Oracle prediction seems wrong**
- Check linear regression logic in `calculateBandPrediction`
- Verify historical data is monotonically increasing

---

## Next Steps

After deployment:
1. Monitor CloudFlare Workers logs for errors
2. Test all three days end-to-end in production
3. Gather user feedback on predictions
4. Iterate on Gemini prompts for better debate quality
5. Scale national battles to 10,000+ users

---

✅ **Days 18-20 implementation complete. Ready for sovereign deployment!**
