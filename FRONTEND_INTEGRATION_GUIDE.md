# Frontend Integration Guide: Async Grading System

This guide shows how to integrate the asynchronous grading pipeline into your Telegram Mini App frontend.

## Overview

The async grading system uses a **polling pattern** to retrieve essay grading results:

1. **Submit**: POST `/api/writing/submit` → Get `submissionId`
2. **Poll**: GET `/api/submissions/:submissionId` every 3 seconds
3. **Display**: Show results when `status === 'COMPLETED'`

---

## React Component (Recommended)

I've created a complete React component: [AsyncEssaySubmission.jsx](file:///d:/apps/game/telegram-mini-app/src/components/AsyncEssaySubmission.jsx)

### Usage

```jsx
import AsyncEssaySubmission from './components/AsyncEssaySubmission';

function WritingPage() {
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 999;
    const username = window.Telegram?.WebApp?.initDataUnsafe?.user?.username || 'Student';
    
    return (
        <div className="page">
            <AsyncEssaySubmission 
                userId={userId} 
                username={username} 
            />
        </div>
    );
}
```

### Features

- ✅ Real-time word count
- ✅ Essay submission with validation
- ✅ Animated polling status ("AI Examiner is reviewing...")
- ✅ Smooth reveal animation for results
- ✅ Detailed band scores (TR, CC, LR, GRA)
- ✅ Examiner feedback with strengths and improvements
- ✅ Reset functionality to write another essay

---

## Vanilla JavaScript Implementation

If you're not using React, here's a vanilla JS version:

```javascript
class AsyncEssayGrader {
    constructor(apiBaseUrl = '') {
        this.apiBaseUrl = apiBaseUrl;
        this.pollingInterval = null;
    }

    /**
     * Submit essay for grading
     */
    async submitEssay(userId, username, essay, prompt) {
        const response = await fetch(`${this.apiBaseUrl}/api/writing/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, username, essay, prompt })
        });

        if (response.status !== 202) {
            const error = await response.json();
            throw new Error(error.error || 'Submission failed');
        }

        const data = await response.json();
        return data.submissionId;
    }

    /**
     * Check submission status
     */
    async checkStatus(submissionId, userId) {
        const response = await fetch(
            `${this.apiBaseUrl}/api/submissions/${submissionId}?userId=${userId}`
        );
        return await response.json();
    }

    /**
     * Start polling for results
     */
    startPolling(submissionId, userId, onUpdate, onComplete, onError) {
        let pollCount = 0;

        this.pollingInterval = setInterval(async () => {
            try {
                pollCount++;
                const data = await this.checkStatus(submissionId, userId);

                // Callback for each poll
                onUpdate(data, pollCount);

                if (data.status === 'COMPLETED') {
                    this.stopPolling();
                    onComplete(data);
                } else if (data.status === 'FAILED') {
                    this.stopPolling();
                    onError(data.error || 'Grading failed');
                }

            } catch (err) {
                console.error('Polling error:', err);
                // Don't stop polling on network errors
            }
        }, 3000); // Poll every 3 seconds
    }

    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
}

// Usage Example
const grader = new AsyncEssayGrader();

async function handleSubmit() {
    const essay = document.getElementById('essay-input').value;
    const userId = 999; // Get from Telegram
    
    try {
        // Show loading state
        showLoadingUI();
        
        // Submit essay
        const submissionId = await grader.submitEssay(
            userId,
            'Student',
            essay,
            'Discuss the impact of technology on society.'
        );
        
        // Start polling
        grader.startPolling(
            submissionId,
            userId,
            (data, pollCount) => {
                // Update UI on each poll
                updatePollingStatus(pollCount);
            },
            (results) => {
                // Show results
                displayResults(results);
            },
            (error) => {
                // Show error
                showError(error);
            }
        );
        
    } catch (err) {
        showError(err.message);
    }
}

function showLoadingUI() {
    document.getElementById('status').innerHTML = `
        <div class="spinner"></div>
        <p>AI Examiner is reviewing your essay...</p>
    `;
}

function updatePollingStatus(pollCount) {
    document.getElementById('poll-count').textContent = `Check #${pollCount}`;
}

function displayResults(results) {
    document.getElementById('results').innerHTML = `
        <div class="band-score">
            <h2>${results.band_score}</h2>
            <p>${getBandLabel(results.band_score)}</p>
        </div>
        <div class="criteria-scores">
            <p>Task Achievement: ${results.task_achievement}</p>
            <p>Coherence: ${results.coherence}</p>
            <p>Vocabulary: ${results.vocabulary}</p>
            <p>Grammar: ${results.grammar}</p>
        </div>
        <div class="feedback">
            <h3>Feedback</h3>
            <p>${results.feedback.summary}</p>
        </div>
    `;
}

function showError(message) {
    document.getElementById('error').textContent = message;
}
```

---

## API Reference

### Submit Essay

**Endpoint**: `POST /api/writing/submit`

**Request Body**:
```json
{
    "userId": 999,
    "username": "Student",
    "essay": "Technology has transformed our lives...",
    "prompt": "Discuss the impact of technology on society."
}
```

**Response** (202 Accepted):
```json
{
    "status": "queued",
    "submissionId": 123,
    "message": "Your essay is being graded by our AI examiner.",
    "polling_endpoint": "/api/submissions/123",
    "estimated_time_seconds": 30,
    "word_count": 287
}
```

### Check Status (Polling)

**Endpoint**: `GET /api/submissions/:submissionId?userId=999`

**Response (PENDING)**:
```json
{
    "status": "PENDING",
    "submissionId": 123,
    "message": "Your essay is being graded. Please wait...",
    "submitted_at": "2026-01-04 09:14:00",
    "estimated_completion": "10-30 seconds"
}
```

**Response (COMPLETED)**:
```json
{
    "status": "COMPLETED",
    "submissionId": 123,
    "band_score": 6.5,
    "task_achievement": 6.0,
    "coherence": 7.0,
    "vocabulary": 6.5,
    "grammar": 6.5,
    "feedback": {
        "summary": "Good attempt with clear structure and logical flow...",
        "strengths": [
            "Clear introduction with topic statement",
            "Logical paragraph organization"
        ],
        "actionable_improvements": [
            "Expand your examples with more detail",
            "Use more complex sentence structures"
        ]
    },
    "word_count": 287,
    "submitted_at": "2026-01-04 09:14:00",
    "completed_at": "2026-01-04 09:14:28",
    "grading_duration_seconds": 28
}
```

**Response (FAILED)**:
```json
{
    "status": "FAILED",
    "submissionId": 123,
    "error": "AI grading failed: Timeout",
    "retry_count": 3,
    "message": "Grading encountered an error. Our team has been notified."
}
```

---

## Best Practices

### 1. Polling Interval

**Recommended**: 3 seconds

```javascript
setInterval(pollFunction, 3000); // 3 seconds
```

**Why?**
- Too fast (< 2s): Wastes bandwidth, increases database load
- Too slow (> 5s): Poor UX, students feel anxious

### 2. Timeout Handling

Set a maximum polling time (e.g., 60 seconds):

```javascript
let pollCount = 0;
const MAX_POLLS = 20; // 20 polls × 3 seconds = 60 seconds

const interval = setInterval(async () => {
    pollCount++;
    
    if (pollCount >= MAX_POLLS) {
        clearInterval(interval);
        showError('Grading is taking longer than expected. Please refresh.');
        return;
    }
    
    // ... poll logic
}, 3000);
```

### 3. Error Recovery

Don't stop polling on network errors:

```javascript
try {
    const data = await checkStatus(submissionId);
    // ... handle response
} catch (err) {
    console.error('Network error:', err);
    // Don't clear interval - might be temporary
}
```

### 4. Optimistic UI

Show instant feedback before polling starts:

```javascript
// User clicks submit
showSuccessMessage("Essay submitted! Grading in progress...");
// Then start polling
```

### 5. Cleanup

Always clear intervals when component unmounts:

```javascript
useEffect(() => {
    return () => {
        clearInterval(pollingInterval.current);
    };
}, []);
```

---

## UX Tips

### Loading State

Show an animated spinner with encouraging text:

```html
<div class="grading-status">
    <div class="spinner"></div>
    <h3>🤖 AI Examiner is Reviewing Your Essay</h3>
    <p>Analyzing grammar, vocabulary, coherence...</p>
    <p class="poll-info">Check #3</p>
</div>
```

### Result Animation

Use CSS animations for dramatic reveal:

```css
.results-container {
    animation: reveal 0.6s ease-out;
}

@keyframes reveal {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

### Progress Indicators

Show progress while polling:

```javascript
const stages = [
    "Analyzing grammar...",
    "Checking vocabulary...",
    "Evaluating coherence...",
    "Calculating band score..."
];

function updateStage(pollCount) {
    const stageIndex = Math.min(pollCount % 4, 3);
    document.getElementById('stage').textContent = stages[stageIndex];
}
```

---

## Testing

### Test Polling Flow

1. **Submit a short essay** (50-100 words)
2. **Verify 202 response** with `submissionId`
3. **Open browser DevTools** → Network tab
4. **Watch polling requests** every 3 seconds
5. **Verify results** appear when status changes to `COMPLETED`

### Test Error Handling

Simulate API failure:

```javascript
// In your polling function
if (pollCount === 5) {
    throw new Error('Simulated network error');
}
```

Verify the UI doesn't break and polling continues.

---

## Performance Considerations

- **Batch Queries**: If showing multiple submissions, poll them together
- **Cache Results**: Store completed results in localStorage
- **Debounce Submission**: Prevent double-clicks with disabled state
- **Minimize Re-renders**: Use `useMemo` for expensive calculations

---

## Next Steps

1. **Install Component**: Copy `AsyncEssaySubmission.jsx` and `.css` to your project
2. **Test Locally**: Submit essays and verify polling works
3. **Deploy**: Push to production and monitor Cloudflare Queue metrics
4. **Iterate**: Gather user feedback on the polling UX

---

**The async grading system is ready to eliminate timeouts!** 🚀

Students will love the instant feedback and smooth result reveal.
