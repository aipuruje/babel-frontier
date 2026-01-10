// GateSpeakTask - Speaking (simplified for MVP - text input placeholder)

import { useState } from 'react';
import type { Task } from '../../../lib/types';
import './TaskStyles.css';

interface GateSpeakTaskProps {
    task: Task;
    onSubmit: (answer: { text: string; type: string }) => void;
}

export default function GateSpeakTask({ task, onSubmit }: GateSpeakTaskProps) {
    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);

    // For MVP, we'll just use text input as a placeholder for speech
    // In production, this would use MediaRecorder API and send audio to backend

    const handleStartRecording = () => {
        setIsRecording(true);
        // Placeholder: In production, would start MediaRecorder
        setTimeout(() => setIsRecording(false), 3000);
    };

    const handleSubmit = () => {
        if (!text.trim()) return;

        onSubmit({ text: text.trim(), type: 'speech_simulation' });
    };

    return (
        <div className="task-component gate-speak-task">
            <div className="task-icon">🗣️</div>
            <h3 className="task-title">Gate Speak</h3>

            <div className="task-prompt">
                <p>{task.prompt.en}</p>
                <div className="speak-hint">
                    Speak the phrase clearly to open the gate
                </div>
            </div>

            <div className="speak-area">
                {/* MVP: Text input as placeholder */}
                <div className="mvp-notice">
                    ⚠️ MVP Mode: Type the phrase (audio recording coming in production)
                </div>

                <textarea
                    className="speak-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type the required phrase..."
                    rows={3}
                />

                {/* Placeholder for future audio recording UI */}
                <div className="recording-controls" style={{ display: 'none' }}>
                    <button
                        className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'} record-btn`}
                        onClick={handleStartRecording}
                        disabled={isRecording}
                    >
                        {isRecording ? '⏺️ Recording...' : '🎤 Start Recording'}
                    </button>
                </div>
            </div>

            <button
                className="btn btn-gold submit-btn"
                onClick={handleSubmit}
                disabled={!text.trim()}
            >
                Submit
            </button>
        </div>
    );
}
