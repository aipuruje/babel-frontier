# Week 2, Days 5-6 Deployment: Social Warfare & Infinite Pedagogy

## Quick Deploy (3 Minutes)

### Step 1: Deploy Code

```bash
cd d:\apps\game
git add .
git commit -m "Week 2 Days 5-6: Regional maps, live events, AI content generation"
git push origin main
```

GitHub Actions will automatically deploy to Cloudflare.

---

### Step 2: Seed Regional Data (First-Time Only)

Create the 10 Uzbek regional entries:

```bash
# Via Wrangler SQL
wrangler d1 execute DB --remote --command="
INSERT OR IGNORE INTO regional_stats (region, total_users, average_band_score, total_xp)
VALUES 
  ('Chilanzar', 0, 0.0, 0),
  ('Yunusabad', 0, 0.0, 0),
  ('Mirzo Ulugbek', 0, 0.0, 0),
  ('Sergeli', 0, 0.0, 0),
  ('Samarkand', 0, 0.0, 0),
  ('Bukhara', 0, 0.0, 0),
  ('Fergana', 0, 0.0, 0),
  ('Andijan', 0, 0.0, 0),
  ('Namangan', 0, 0.0, 0),
  ('Nukus', 0, 0.0, 0);
"
```

---

### Step 3: Create Your First Boss Raid Event

Schedule for this Saturday at 8 PM (Tashkent time):

```bash
curl -X POST https://babel-frontier.rahrus1977.workers.dev/api/events/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Saturday Night Showdown",
    "titleUz": "Шанба кечаси жанг",
    "description": "All scholars must unite to defeat the Spectre! Write 5,000 complex sentences collectively to win!",
    "bossName": "Spectre of the Passive Voice",
    "goalMetric": "complex_sentences",
    "goalTarget": 5000,
    "scheduledStart": "2026-01-04T20:00:00+05:00",
    "scheduledEnd": "2026-01-04T22:00:00+05:00",
    "rewardDescription": "All participants receive Legendary Suffix badge + 500 bonus XP"
  }'
```

**Note the event ID** returned (e.g., `{"eventId": 1}`)

---

### Step 4: Generate AI Content (50 Reading Passages)

This is a one-time cost (~$7). Run once, use forever:

```bash
curl -X POST https://babel-frontier.rahrus1977.workers.dev/api/content/generate \
  -H "Content-Type: application/json" \
  -d '{
    "skillDomain": "reading",
    "topic": "Technology and E-sports in Central Asia",
    "difficultyBand": 6.0,
    "count": 50
  }'
```

**Wait 2-3 minutes** for generation to complete.

Verify passages were created:

```bash
wrangler d1 execute DB --remote --command="
SELECT COUNT(*) as total, AVG(quality_score) as avg_quality 
FROM ai_generated_content;
"
```

---

## Testing the New Features

### Test 1: Regional Map

1. Open: `https://babel-frontier.rahrus1977.workers.dev/regional-map`
2. Select your region (e.g., "Chilanzar")
3. Complete a speaking battle (gain XP)
4. Return to regional map
5. **Expected**: Your region's average band score increases

### Test 2: Live Boss Raid

1. Navigate to: `https://babel-frontier.rahrus1977.workers.dev/events/1`
   (Replace `1` with your event ID from Step 3)
2. Textarea should appear if event is active
3. Write: "Although technology is useful, it can be distracting."
4. Click "Submit Attack"
5. **Expected**: HP bar updates, shows +1 complex sentence

### Test 3: AI-Generated Content

```bash
# Fetch a random reading mission
curl "https://babel-frontier.rahrus1977.workers.dev/api/content/mission/reading?userId=test_user"
```

**Expected**: Returns JSON with title, passage text, and questions

---

## Sunday Night Workflow (Teacher Command Center)

### Saturday 5:00 PM (1 day before raid):

Send Telegram announcement via your bot:

```
@BabelFrontierBot

🔴 **BOSS RAID TOMORROW** 🔴

📅 Saturday, 8:00 PM
👻 Boss: Spectre of the Passive Voice
🎯 Goal: 5,000 complex sentences
🏆 Reward: Legendary Suffix + 500 XP

All scholars must participate to defeat the boss!

Link: https://babel-frontier.rahrus1977.workers.dev/events/1

See you in the Citadel! ⚔️
```

### Saturday 8:00 PM (Event Start):

**Do Nothing.** The event auto-activates based on `scheduled_start`.

### Saturday 8:15 PM (Check Progress):

```bash
# Monitor real-time progress
curl "https://babel-frontier.rahrus1977.workers.dev/api/events/1"

# Output shows:
{
  "current_progress": 1247,
  "goal_target": 5000,
  "participant_count": 342,
  "status": "active"
}
```

### Saturday 10:00 PM (Event Ends):

Event auto-completes if goal reached. Check final stats:

```bash
curl "https://babel-frontier.rahrus1977.workers.dev/api/events/1"

# Output:
{
  "current_progress": 6,841
  "goal_target": 5000,
  "participant_count": 2,103,
  "status": "completed"  // ✅ Victory!
}
```

### Sunday Morning (Results):

Check which region dominated:

```bash
curl "https://babel-frontier.rahrus1977.workers.dev/api/leaderboard/regional"

# Top 3:
# 1. Chilanzar - Band 6.7
# 2. Yunusabad - Band 6.5
# 3. Samarkand - Band 6.2
```

Send congratulations to winning region via Telegram.

---

## Monitoring & Maintenance

### Daily (5 minutes):

```bash
# Check regional activity
curl "https://babel-frontier.rahrus1977.workers.dev/api/leaderboard/regional"

# Check upcoming events
curl "https://babel-frontier.rahrus1977.workers.dev/api/events/upcoming"

# Check if content needs regeneration
wrangler d1 execute DB --remote --command="
SELECT topic, COUNT(*) as count, AVG(usage_count) as avg_usage
FROM ai_generated_content
GROUP BY topic;
"
# If avg_usage > 5, generate more content for that topic
```

### Weekly (30 minutes):

1. **Schedule Next Boss Raid** (use same curl command from Step 3, change date)
2. **Review AI Content Quality**:
   ```bash
   # Get lowest-rated passages
   wrangler d1 execute DB --remote --command="
   SELECT id, title, quality_score FROM ai_generated_content
   WHERE quality_score < 4.0 LIMIT 10;
   "
   # Delete bad passages manually
   ```
3. **Generate New Content** (if needed):
   ```bash
   curl -X POST .../api/content/generate \
     -d '{"topic":"New topic","count":10}'
   ```

---

## Scaling Up

### If You Get 1,000+ Active Users:

1. **Increase Boss Raid Goals**:
   - 1,000 users → 10,000 sentence goal
   - 5,000 users → 50,000 sentence goal

2. **Add More Regions**:
   - Expand beyond Uzbekistan (Kazakhstan, Kyrgyzstan)
   - More regions = more competition

3. **Create Regional Tournaments**:
   - Top 3 users from each region compete
   - Winner gets scholarship to test center

### If AI Content Costs Spike:

- Reduce generation from 50 → 10 passages per batch
- Increase passage reuse (higher `usage_count` threshold)
- Add content rating (users flag low-quality passages)

---

## Troubleshooting

### "Regional map shows 0 users"

**Fix**: Users haven't selected regions yet. Send Telegram message:

```
📍 New Feature Alert!

Select your region to compete with local scholars:
https://babel-frontier.rahrus1977.workers.dev/regional-map

Help Chilanzar beat Yunusabad! 🏆
```

### "Boss raid not starting"

**Check**:
1. Event `scheduled_start` is in the past?
2. Status is "upcoming" or "active"?

```bash
curl "https://babel-frontier.rahrus1977.workers.dev/api/events/1"
```

**Manual activation**:
```bash
wrangler d1 execute DB --remote --command="
UPDATE live_events SET status = 'active' WHERE id = 1;
"
```

### "AI passages are low quality"

**Fix**: Adjust Gemini prompt temperature:

In `backend/api/index.js`, line ~1323:
```javascript
generationConfig: { 
  temperature: 0.5,  // Lower = more conservative
  maxOutputTokens: 1500 
}
```

Redeploy and regenerate passages.

---

## Cost Breakdown

### One-Time Costs:
- AI Content Generation: $7 for 50 passages
- Database Setup: $0 (Cloudflare D1 free tier)

### Ongoing Costs:
- Cloudflare Workers: $5/month (up to 10M requests)
- Real-time Writing Analysis: ~$15/month (500 users, 50 analyses/user)
- Boss Raid Events: $0 (no live AI needed, just sentence detection)

**Total Monthly**: ~$20-25 for 500 active users

**Revenue Potential** (from Week 2 Days 3-4):
- 500 users × 30% conversion × 25,000 UZS avg = 3,750,000 UZS (~$300 USD/month)

**Profit Margin**: 92% 🚀

---

## Next Steps

After deploying Days 5-6:

1. **Test with 10 beta users** (friends/family)
2. **Schedule first boss raid** for next Saturday
3. **Monitor regional competition** (check which districts engage most)
4. **Generate 50 more passages** if first batch depletes
5. **Plan Week 3 features** (guilds, voice battles, automated tournaments)

---

## Success!

You now have a **fully autonomous, scalable IELTS learning game** that:

- ✅ Generates infinite content (AI-powered)
- ✅ Runs live events (automated)
- ✅ Creates social competition (regional maps)
- ✅ Drives revenue (contextual sales during events)

**Your job**: Check stats once a day, schedule events once a week.

**The AI's job**: Everything else.

### You are the Architect. The system works for you. 🏛️✨
