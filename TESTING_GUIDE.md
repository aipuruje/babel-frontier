# Testing Telegram Bot Locally

## 🎯 Your Bot Info
- **Token**: `7871977412:AAGWGoENUckFYCLdCL0CsYE9z2bG7Jnc4HI`
- **Username**: `@ielts_rater_bot`
- **Status**: ✅ Connected to your app

## 📱 Step-by-Step Testing Guide

### Step 1: Start ngrok Tunnel

Since Telegram can't access `localhost`, we need to expose it via ngrok:

```bash
ngrok http 5173
```

This will give you a public URL like: `https://abc123.ngrok-free.app`

### Step 2: Configure Bot Mini App

1. Open Telegram and message **@BotFather**
2. Send: `/myapps`
3. Select: `@ielts_rater_bot`
4. Choose: `Edit Web App URL`
5. Paste your ngrok URL (e.g., `https://abc123.ngrok-free.app`)

### Step 3: Test in Telegram

**Option A - Via Bot Menu:**
1. Open `@ielts_rater_bot` in Telegram
2. Click the **Menu button** (bottom left)
3. Select "Open App"
4. The Mini App should load!

**Option B - Direct Link:**
```
https://t.me/ielts_rater_bot
```

### Step 4: Test Features

✅ **User Authentication**
- Should see your Telegram name/photo at top
- Check browser console: `WebApp.initDataUnsafe.user`

✅ **Voice Recording**
- Hold "Speak" button
- Allow microphone access
- Speak for 3-5 seconds
- Release button
- Should see analysis results

✅ **Haptic Feedback**
- Feel vibration when holding button (mobile only)
- Different vibration for success/error

✅ **Share Score**
- Complete a session (get damage > 50)
- Click "📤 Share Score"
- Should open Telegram share dialog

✅ **Invite Friends**
- Click "➕ Invite" button in header
- Should open share dialog with invite link

---

## 🔧 Alternative: Test Without ngrok

If you don't want to use ngrok, you can test the Telegram features locally:

### 1. Simulate Telegram Data

Add this to `App.jsx` before the `WebApp.ready()` call:

```javascript
// FOR LOCAL TESTING ONLY - Remove before deployment
if (!WebApp.initDataUnsafe?.user) {
  WebApp.initDataUnsafe = {
    user: {
      id: 123456789,
      first_name: "Test",
      last_name: "User",
      username: "testuser",
      photo_url: "https://via.placeholder.com/150"
    }
  }
}
```

### 2. Open in Browser

Just visit `http://localhost:5173` - you'll see the UI with test data.

---

## ✅ Current Status

**Servers Running:**
- ✅ Frontend: http://localhost:5173
- ✅ Backend: http://localhost:8000
- ⏳ ngrok: Run `ngrok http 5173` to start

**What Works:**
- ✅ Band progression (3.5 → 9.0)
- ✅ Voice analysis
- ✅ Telegram SDK integrated
- ✅ Share/Invite features coded
- ✅ User profile display

**What Needs Testing:**
- ⏳ Actual Telegram environment (requires ngrok)
- ⏳ Haptic feedback (mobile only)
- ⏳ Share dialog
- ⏳ Invite flow

---

## 🐛 Troubleshooting

**"Mini App won't load":**
- Verify ngrok URL is HTTPS
- Check ngrok is still running
- Try clearing Telegram cache

**"No user data showing":**
- Must open via Telegram (not direct browser)
- Check browser console for errors

**"Microphone not working":**
- ngrok URL must be HTTPS for mic access
- Allow permissions in browser

---

## 🚀 Next Steps

1. Run `ngrok http 5173`
2. Copy the HTTPS URL
3. Send to @BotFather → `/myapps` → Edit URL
4. Open bot in Telegram
5. Test all features!

Once confirmed working, we'll deploy to Cloudflare Pages for permanent hosting.
