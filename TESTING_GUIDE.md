# Local Testing Guide

## ✅ Server Status

**Backend:** Running on http://localhost:3001
**Frontend:** Running on http://localhost:5173

**Health Check:** Backend operational with CORS enabled for frontend origin.

---

## Manual Testing Checklist

### Phase 6.2: API Integration Testing

Test these features in your browser at http://localhost:5173:

#### 1. User Registration
- [ ] Open the app in browser
- [ ] Complete onboarding/signup
- [ ] Check if user is created (use Prisma Studio: `cd backend && npm exec prisma studio`)
- [ ] Verify `referralCode` is generated in `users` table

#### 2. Progress Tracking
- [ ] Complete some exercise questions in a module
- [ ] Refresh the page
- [ ] Verify progress persists
- [ ] Check `module_progress` table in Prisma Studio

#### 3. Battle Mode
- [ ] Play a battle mode challenge
- [ ] Check if score is saved
- [ ] Verify daily limit (should allow 3 battles for free users)
- [ ] Check `analytics_sessions` and `subscriptions` tables

#### 4. Referral System
- [ ] Find your referral code in the app
- [ ] Open another browser (incognito mode)
- [ ] Register with the referral code
- [ ] Check `referrals` table for the new entry

#### 5. Subscription Management
- [ ] Check your subscription status (should be "free" tier)
- [ ] Verify battle mode counter increments
- [ ] Check `subscriptions` table

---

## Prisma Studio Access

To view the database in a GUI:

```bash
cd backend
npm exec prisma studio
```

Opens at: http://localhost:5555

Tables to check:
- **users** - See all registered users
- **module_progress** - View saved progress
- **subscriptions** - Check tiers and battle mode counts
- **referrals** - See referral tracking
- **analytics_sessions** - View learning session data

---

## API Testing (Manual cURL)

### Test User Registration
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"telegramId\":\"999\",\"firstName\":\"TestUser\",\"authMethod\":\"email\",\"email\":\"test@test.com\"}"
```

### Test Progress Save
```bash
curl -X POST http://localhost:3001/api/progress \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"999\",\"moduleId\":\"time-management\",\"accuracy\":85,\"timeSpent\":15,\"questionsCompleted\":10,\"masteryLevel\":75}"
```

### Get Progress
```bash
curl http://localhost:3001/api/progress/999
```

### Get Subscription
```bash
curl http://localhost:3001/api/subscription/999
```

---

## Known URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001
- **Prisma Studio:** http://localhost:5555 (when running)
- **Health Check:** http://localhost:3001/health

---

## Next Steps After Testing

Once manual testing is complete:

1. **Phase 6.4:** Create production environment files
2. **Phase 6.5:** Choose deployment platform
3. **Phase 6.6:** Deploy to production
4. **Phase 6.7:** Verify production deployment

---

## Troubleshooting

**Frontend can't connect to backend:**
- Check `VITE_API_BASE_URL` is set to `http://localhost:3001`
- Verify backend console shows no CORS errors

**Database errors:**
- Run `cd backend && npm exec prisma migrate dev` to ensure migrations are applied
- Check `backend/prisma/dev.db` exists

**Port already in use:**
- Backend: Change `PORT` in `backend/.env`
- Frontend: Vite will auto-increment port if 5173 is busy

---

## Testing Complete?

When all manual tests pass, you're ready for deployment! 🚀
