# IELTS Speech Fighter - Frontend

A React-based web game that helps improve IELTS speaking skills by analyzing speech fluency in real-time.

## Features

- 🎤 **Hold-to-Record**: Press and hold the speak button to record your voice
- 🤖 **AI Analysis**: Uses OpenAI Whisper API to transcribe and analyze speech
- 💥 **Damage System**: Hesitations (pauses > 2 seconds) cause damage
- 🎮 **Game Over**: If total damage exceeds 50, game ends with Band 4.5 score
- 📊 **Real-time Feedback**: See transcription, word count, and pause duration
- ✨ **Premium UI**: Modern, animated interface with smooth transitions

## Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

## Installation

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Open your browser:**
Navigate to `http://localhost:5173`

## Usage

1. **Allow Microphone Access**: The browser will ask for microphone permission on first use
2. **Hold to Speak**: Press and hold the "Hold to Speak" button
3. **Speak Clearly**: Talk naturally while holding the button
4. **Release**: Let go of the button when done speaking
5. **View Results**: See your transcription, word count, pause duration, and damage
6. **Keep Playing**: Continue until you reach Game Over (damage > 50)

## Game Mechanics

### Health System
- Starting Health: **100%**
- Each hesitation (pause > 2 seconds): **-10 HP**
- Game Over when Health drops below 50%

### Scoring
- **Pass**: Keep total damage ≤ 50
- **Fail**: Total damage > 50 → Band Score 4.5

### Visual Feedback
- 🟢 **Green Health Bar**: Healthy (> 50%)
- 🟡 **Yellow Health Bar**: Warning (25-50%)
- 🔴 **Red Health Bar**: Critical (< 25%)
- 💥 **Damage Animation**: Shows damage taken after each analysis
- 💀 **Game Over Screen**: Displays when you fail

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx           # Main game component
│   ├── App.css           # Game-specific styles
│   ├── index.css         # Global styles and design system
│   └── main.jsx          # React entry point
├── index.html            # HTML template
├── vite.config.js        # Vite configuration with API proxy
└── package.json          # Dependencies
```

## Technologies Used

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Framer Motion**: Smooth animations
- **Axios**: HTTP client for API calls
- **MediaRecorder API**: Browser audio recording
- **Inter Font**: Premium typography

## API Integration

The frontend connects to the backend via proxy configuration:

```javascript
// vite.config.js
proxy: {
  '/analyze-speech': {
    target: 'http://localhost:8000',
    changeOrigin: true
  }
}
```

Requests to `/analyze-speech` are automatically proxied to the FastAPI backend.

## Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

## Tips for Best Results

1. **Clear Speech**: Speak clearly and at a moderate pace
2. **Avoid Long Pauses**: Keep pauses under 2 seconds
3. **Natural Flow**: Try to maintain a conversational rhythm
4. **Good Microphone**: Use a quality microphone for better accuracy
5. **Quiet Environment**: Minimize background noise

## Troubleshooting

**Microphone not working:**
- Check browser permissions
- Ensure HTTPS or localhost (required for MediaRecorder API)
- Try a different browser (Chrome/Edge recommended)

**API connection errors:**
- Verify backend is running on port 8000
- Check CORS settings if deploying separately
- Ensure OpenAI API key is configured in backend

**No audio recorded:**
- Speak for at least 1-2 seconds
- Check microphone input level in system settings
- Verify browser supports MediaRecorder API

## Browser Support

- ✅ Chrome/Edge 85+
- ✅ Firefox 89+
- ✅ Safari 14.1+
- ⚠️ Requires HTTPS in production (except localhost)
