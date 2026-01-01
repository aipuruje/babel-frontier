# Speech Analysis API

A FastAPI-based speech analysis service that transcribes audio using OpenAI's Whisper API and detects speech hesitations.

## Features

- **Audio Transcription**: Uses OpenAI Whisper API for accurate speech-to-text conversion
- **Word Count**: Calculates the number of words spoken
- **Pause Detection**: Identifies pauses longer than 2 seconds
- **Feedback System**: Returns damage points and feedback when hesitation is detected

## Setup

### Prerequisites

- Python 3.8+
- FFmpeg (required for pydub audio processing)

#### Installing FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
```

**Mac:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt update
sudo apt install ffmpeg
```

### Installation

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your OpenAI API key to `.env`

```bash
OPENAI_API_KEY=your-actual-api-key-here
```

### Running the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### `POST /analyze-speech`

Analyzes an audio file for transcription and speech patterns.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Audio file (supported formats: mp3, wav, m4a, ogg, etc.)

**Example using cURL:**
```bash
curl -X POST "http://localhost:8000/analyze-speech" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@path/to/your/audio.mp3"
```

**Example using Python:**
```python
import requests

url = "http://localhost:8000/analyze-speech"
files = {"audio": open("audio.mp3", "rb")}
response = requests.post(url, files=files)
print(response.json())
```

**Response (with hesitation):**
```json
{
  "transcription": "Hello, this is a test...",
  "word_count": 5,
  "max_pause_duration": 3.5,
  "pause_count": 1,
  "damage": 10,
  "feedback": "Hesitation detected"
}
```

**Response (fluent speech):**
```json
{
  "transcription": "Hello, this is a fluent test",
  "word_count": 6,
  "max_pause_duration": 0.8,
  "pause_count": 0,
  "damage": 0,
  "feedback": "Great fluency!"
}
```

### `GET /`

Health check endpoint.

### `GET /health`

Returns the API health status.

## Response Fields

- `transcription`: Full text transcription of the audio
- `word_count`: Total number of words spoken
- `max_pause_duration`: Longest pause detected (in seconds)
- `pause_count`: Number of pauses longer than 2 seconds
- `damage`: Damage points (10 if hesitation detected, 0 otherwise)
- `feedback`: Feedback message about speech quality

## Testing

You can test the API using the interactive documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Notes

- The pause detection threshold is set to 2 seconds
- Silence threshold is set to -40 dBFS (adjustable based on audio quality)
- Supported audio formats: mp3, wav, m4a, ogg, flac, and more
- Maximum file size depends on your server configuration

## Troubleshooting

**"Error processing audio":**
- Ensure FFmpeg is properly installed
- Check that the audio file format is supported
- Verify the audio file is not corrupted

**"OpenAI API Error":**
- Verify your API key is correct in the `.env` file
- Ensure you have sufficient credits in your OpenAI account
- Check your internet connection
