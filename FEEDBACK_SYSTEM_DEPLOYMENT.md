# Professional-Grade Feedback System Deployment Guide

## Step 1: Run Database Migrations

```powershell
# Navigate to project root
cd d:\apps\game

# Apply the feedback system schema to D1 database
wrangler d1 execute DB --file=backend/feedback_system_schema.sql --remote

# Verify tables were created
wrangler d1 execute DB --command="SELECT name FROM sqlite_master WHERE type='table' AND name IN ('speaking_submissions', 'progress_history')" --remote
```

## Step 2: Deploy Cloudflare Worker

```powershell
# Deploy the updated worker with new API routes
wrangler deploy
```

Expected output:
```
✔ Built successfully!
✔ Uploaded 1 file (X MB)
✔ Worker deployed at https://babel-frontier.YOURNAME.workers.dev/
```

## Step 3: Test the New Endpoints

### Test Speaking Feedback API

```powershell
# Test with a sample audio file
curl -X POST https://babel-frontier.YOURNAME.workers.dev/api/speaking/submit-advanced `
  -F "audio=@test_audio.mp3" `
  -F "user_id=test_user_123"
```

Expected response:
```json
{
  "success": true,
  "submissionId": 1,
  "sanitizedTranscript": "hello [unclear] world",
  "fillerCount": 2,
  "longPauseCount": 1,
  "fluency_score": 6.5,
  "overall_band": 6.0,
  "raw_band_score": 6.22
}
```

### Test Progress History API

```powershell
curl https://babel-frontier.YOURNAME.workers.dev/api/progress/test_user_123/speaking
```

Expected response:
```json
{
  "progressData": [
    {
      "raw_score": 6.12,
      "rounded_band": 6.0,
      "submission_id": 1,
      "submission_type": "speaking",
      "date": "2026-01-04T10:00:00.000Z"
    }
  ]
}
```

## Step 4: Frontend Integration

### Import Components in Your App

```javascript
// In your main App.jsx or relevant page
import SpeechMap from './components/SpeechMap';
import ProgressAnalytics from './components/ProgressAnalytics';
import RubricRadar from './components/RubricRadar';
import CorrectionToggle from './components/CorrectionToggle';
```

### Example Usage - Speaking Mission Page

```jsx
import { useState, useEffect } from 'react';
import SpeechMap from '../components/SpeechMap';
import ProgressAnalytics from '../components/ProgressAnalytics';

function SpeakingMissionPage({ userId }) {
    const [submissionData, setSubmissionData] = useState(null);
    const [progressData, setProgressData] = useState([]);

    useEffect(() => {
        // Fetch latest submission
        fetch(`/api/speaking/submission/${latestSubmissionId}`)
            .then(res => res.json())
            .then(data => setSubmissionData(data));

        // Fetch progress history
        fetch(`/api/progress/${userId}/speaking`)
            .then(res => res.json())
            .then(data => setProgressData(data.progressData));
    }, [userId]);

    return (
        <div>
            {submissionData && (
                <SpeechMap
                    confidenceData={submissionData.confidence_data}
                    pauseData={submissionData.pause_data}
                    fillerCount={submissionData.filler_count}
                    audioUrl={submissionData.audio_url}
                    totalDuration={submissionData.total_duration_seconds}
                />
            )}
            
            <ProgressAnalytics
                progressData={progressData}
                skillDomain="speaking"
            />
        </div>
    );
}
```

### Example Usage - Writing Foundry Page

```jsx
import { useState, useEffect } from 'react';
import RubricRadar from '../components/RubricRadar';
import CorrectionToggle from '../components/CorrectionToggle';

function WritingFoundryPage({ submissionId }) {
    const [writingData, setWritingData] = useState(null);

    useEffect(() => {
        fetch(`/api/submissions/${submissionId}`)
            .then(res => res.json())
            .then(data => setWritingData(data));
    }, [submissionId]);

    const scores = writingData ? {
        TR: writingData.task_achievement,
        CC: writingData.coherence_cohesion,
        LR: writingData.lexical_resource,
        GRA: writingData.grammatical_range_accuracy
    } : null;

    const corrections = writingData ? JSON.parse(writingData.detailed_corrections) : [];

    return (
        <div>
            {scores && <RubricRadar scores={scores} skillType="writing" />}
            
            {corrections.length > 0 && (
                <CorrectionToggle
                    corrections={corrections}
                    currentWeakness={writingData.improvement_priority}
                    essayText={writingData.essay_text}
                />
            )}
        </div>
    );
}
```

## Step 5: Install Frontend Dependencies

The new components require recharts:

```powershell
cd telegram-mini-app
npm install recharts
```

## Step 6: Verify Everything Works

1. **Database Check**: Run a query to verify data is being stored
```powershell
wrangler d1 execute DB --command="SELECT COUNT(*) as count FROM speaking_submissions" --remote
```

2. **API Check**: Test all 3 new endpoints (speaking-advanced, speaking/submission/:id, progress/:userId/:skillDomain)

3. **UI Check**: Open the Telegram Mini App and navigate to Speaking Mission page to see the Speech Map component

## Rollback Plan

If anything goes wrong:

```powershell
# Rollback database (if you have a backup)
wrangler d1 execute DB --file=backend/schema_backup.sql --remote

# Rollback worker deployment (revert to previous version in wrangler.toml)
git checkout HEAD~1 backend/api/index.js
wrangler deploy
```

## Environment Variables

Make sure these are set in your Cloudflare Worker:

- `GEMINI_API_KEY` - For Gemini 2.0 Flash transcription and grading
- `R2_BUCKET` - For audio storage (already configured)
- `DB` - D1 database binding (already configured)

Check with:
```powershell
wrangler secret list
```

## Performance Monitoring

After deployment, monitor:
- Average response time for `/api/speaking/submit-advanced` (should be <5s)
- Database query performance for progress history (should be <100ms)
- R2 audio upload success rate (should be >99%)

Use Cloudflare Analytics dashboard to track these metrics.
