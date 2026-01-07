from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
from typing import Dict, Optional
import tempfile
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
import io
from dotenv import load_dotenv
import json
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Speech Analysis API")

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# In-memory leaderboard (replace with database in production)
leaderboard = []

@app.get("/")
async def root():
    return {"message": "Speech Analysis API is running"}

@app.post("/analyze-speech")
async def analyze_speech(
    audio: UploadFile = File(...),
    user_id: Optional[str] = Form(None),
    username: Optional[str] = Form(None)
) -> Dict:
    """
    Analyze speech from an audio file.
    
    - Transcribes audio using OpenAI Whisper API
    - Calculates word count
    - Detects pauses longer than 2 seconds
    - Returns damage and feedback if hesitation is detected
    """
    try:
        # Read the uploaded file
        audio_bytes = await audio.read()
        
        # Save to temporary file for processing
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio.filename)[1]) as temp_audio:
            temp_audio.write(audio_bytes)
            temp_audio_path = temp_audio.name
        
        try:
            # Step 1: Transcribe using Whisper API
            with open(temp_audio_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="verbose_json",
                    timestamp_granularity=["word"]
                )
            
            # Step 2: Calculate word count
            transcribed_text = transcript.text
            word_count = len(transcribed_text.split())
            
            # Step 3: Analyze pause duration using audio segments
            audio_segment = AudioSegment.from_file(io.BytesIO(audio_bytes))
            
            # Detect non-silent parts (speech segments)
            # Parameters: min_silence_len in ms, silence_thresh in dBFS
            nonsilent_ranges = detect_nonsilent(
                audio_segment,
                min_silence_len=2000,  # 2 seconds
                silence_thresh=-40  # Adjust based on audio quality
            )
            
            # Calculate pauses between speech segments
            max_pause_duration = 0
            pause_count = 0
            
            for i in range(len(nonsilent_ranges) - 1):
                # Calculate pause between current segment end and next segment start
                pause_start = nonsilent_ranges[i][1]
                pause_end = nonsilent_ranges[i + 1][0]
                pause_duration_ms = pause_end - pause_start
                pause_duration_sec = pause_duration_ms / 1000
                
                if pause_duration_sec > max_pause_duration:
                    max_pause_duration = pause_duration_sec
                
                if pause_duration_sec > 2.0:
                    pause_count += 1
            
            # Step 4: Determine damage and feedback
            response_data = {
                "transcription": transcribed_text,
                "word_count": word_count,
                "max_pause_duration": round(max_pause_duration, 2),
                "pause_count": pause_count
            }
            
            # If pause > 2 seconds detected
            if max_pause_duration > 2.0:
                response_data["damage"] = 10
                response_data["feedback"] = "Hesitation detected"
            else:
                response_data["damage"] = 0
                response_data["feedback"] = "Great fluency!"
            
            # Update leaderboard if user info provided
            if user_id and username:
                await update_leaderboard(user_id, username, response_data["damage"])
            
            return response_data
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/leaderboard")
async def get_leaderboard(limit: int = 10):
    """Get top scores from leaderboard"""
    sorted_board = sorted(leaderboard, key=lambda x: x['total_damage'])
    return {"leaderboard": sorted_board[:limit]}

@app.post("/leaderboard/submit")
async def submit_score(
    user_id: str = Form(...),
    username: str = Form(...),
    total_damage: int = Form(...),
    band_score: str = Form(...)
):
    """Submit score to leaderboard"""
    await update_leaderboard(user_id, username, total_damage, band_score)
    return {"status": "success", "message": "Score submitted"}

async def update_leaderboard(user_id: str, username: str, damage: int, band_score: str = None):
    """Update or add user to leaderboard"""
    # Find existing user
    user_entry = next((x for x in leaderboard if x['user_id'] == user_id), None)
    
    if user_entry:
        # Update existing entry
        user_entry['total_damage'] += damage
        user_entry['attempts'] += 1
        user_entry['last_played'] = datetime.now().isoformat()
        if band_score:
            user_entry['best_band'] = band_score
    else:
        # Add new entry
        leaderboard.append({
            'user_id': user_id,
            'username': username,
            'total_damage': damage,
            'attempts': 1,
            'best_band': band_score or 'band_9.0',
            'last_played': datetime.now().isoformat()
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
