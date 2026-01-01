# Telegram Bot Setup Guide

## Step 1: Create Your Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Choose a name: `IELTS Speech Fighter`
4. Choose a username: `IELTSSpeechFighterBot` (or your preferred name)
5. **Save the bot token** you receive (you'll need this for deployment)

## Step 2: Configure Bot Settings

Send these commands to @BotFather:

### Set Description
```
/setdescription
```
Then paste:
```
🎤 Master IELTS Speaking through an epic RPG adventure!

🎯 Track your Band score (3.5-9.0)
🎮 Battle hesitation and improve fluency  
🏆 Compete with friends on the leaderboard
⚡ Get instant AI feedback

Transform IELTS prep into an addictive game!
```

### Set About Text
```
/setabouttext
```
Then paste:
```
IELTS Speech Fighter - The gamified IELTS speaking trainer. Powered by AI, designed for Uzbek students preparing for IELTS.
```

### Set Bot Picture
```
/setuserpic
```
Upload a logo/icon for your bot (create one with an AI image generator if needed)

## Step 3: Set Up Mini App

```
/newapp
```
Select your bot, then provide:

- **Web App URL**: `https://your-cloudflare-pages-url.pages.dev`
- **Short name**: `ielts_fighter`
- **Title**: `IELTS Speech Fighter`
- **Description**: See Step 2 description
- **Photo**: Upload screenshot of your game UI

## Step 4: Configure Menu Button

```
/setmenubutton
```
Select your bot, then:
- **Button text**: `🎮 Start Training`
- **Web App URL**: `https://your-cloudflare-pages-url.pages.dev`

## Step 5: Environment Variables

Add these to your `.env` file:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_BOT_USERNAME=IELTSSpeechFighterBot
```

## Step 6: Update App.jsx

Replace this line in `App.jsx`:
```javascript
const inviteUrl = `https://t.me/YourBotName?start=invite_${user?.id || 'guest'}`
```

With:
```javascript
const inviteUrl = `https://t.me/IELTSSpeechFighterBot?start=invite_${user?.id || 'guest'}`
```

## Step 7: Test

1. Open your bot in Telegram
2. Click the menu button or send `/start`
3. The Mini App should open
4. Test voice recording, share, and invite features

## Step 8: Go Viral! 🚀

Share your bot link in:
- IELTS preparation groups in Uzbekistan
- University student chats
- English learning communities
- LinkedIn/Facebook/Instagram

---

## Troubleshooting

**Mini App doesn't open:**
- Verify Web App URL is correct
- Check HTTPS (required for Telegram Mini Apps)
- Ensure Cloudflare deployment is complete

**Share button doesn't work:**
- Make sure bot username is correct in code
- Test with actual Telegram app (not web version)

**No user data:**
- Mini App must be opened via Telegram (not direct URL)
- Check browser console for errors

---

## Next Steps

After deployment:
1. Set up webhook for bot messages (optional)
2. Add push notifications
3. Implement daily challenges
4. Create referral rewards system
