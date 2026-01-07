import { useState, useRef, useEffect } from 'react';
import './SpeechMap.css';

/**
 * Speech Map Component - Visualizes speaking submission with confidence heatmap
 * 
 * Features:
 * - Confidence heatmap (orange underlines for low-confidence words)
 * - Pause markers (vertical red lines for >2s pauses)
 * - Filler counter badge
 * - Interactive audio playback timeline
 * 
 * Props:
 * - confidenceData: Array of {word, confidence, start, end}
 * - pauseData: Array of {start, end, duration}
 * - fillerCount: Number
 * - audioUrl: String (R2 URL)
 * - totalDuration: Number (seconds)
 */
const SpeechMap = ({ confidenceData, pauseData, fillerCount, audioUrl, totalDuration }) => {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const timelineRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, []);

    const handleTimelineClick = (e) => {
        const rect = timelineRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * totalDuration;

        if (audioRef.current) {
            audioRef.current.currentTime = newTime;
        }
    };

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return 'high';
        if (confidence >= 0.6) return 'medium';
        return 'low';
    };

    return (
        <div className="speech-map">
            <div className="speech-map-header">
                <h3>🎤 Speech Analysis Map</h3>
                <div className="filler-badge">
                    <span className="badge-label">Fillers Detected:</span>
                    <span className="badge-count">{fillerCount}</span>
                    <span className="badge-desc">(um, ah, er)</span>
                </div>
            </div>

            {/* Audio player */}
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            {/* Playback controls */}
            <div className="playback-controls">
                <button className="play-btn" onClick={togglePlayPause}>
                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>
                <span className="time-display">
                    {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>
            </div>

            {/* Interactive timeline */}
            <div className="timeline" ref={timelineRef} onClick={handleTimelineClick}>
                <div className="timeline-progress" style={{ width: `${(currentTime / totalDuration) * 100}%` }} />

                {/* Pause markers */}
                {pauseData.map((pause, idx) => (
                    <div
                        key={`pause-${idx}`}
                        className="pause-marker"
                        style={{ left: `${(pause.start / totalDuration) * 100}%` }}
                        title={`Pause: ${pause.duration.toFixed(1)}s`}
                    >
                        <div className="pause-line" />
                    </div>
                ))}

                {/* Current time indicator */}
                <div className="current-time-marker" style={{ left: `${(currentTime / totalDuration) * 100}%` }} />
            </div>

            {/* Transcript with confidence heatmap */}
            <div className="transcript-container">
                <h4>Transcript with Confidence Analysis</h4>
                <div className="transcript-words">
                    {confidenceData.map((wordData, idx) => (
                        <span
                            key={idx}
                            className={`word confidence-${getConfidenceColor(wordData.confidence)}`}
                            title={`Confidence: ${(wordData.confidence * 100).toFixed(0)}%`}
                            onClick={() => {
                                if (audioRef.current) {
                                    audioRef.current.currentTime = wordData.start;
                                }
                            }}
                        >
                            {wordData.text}
                        </span>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="speech-map-legend">
                <div className="legend-item">
                    <span className="legend-color confidence-high"></span>
                    <span>High Confidence (&gt;80%)</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color confidence-medium"></span>
                    <span>Medium Confidence (60-80%)</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color confidence-low"></span>
                    <span>Low Confidence (&lt;60%) - Tagged as [unclear]</span>
                </div>
                <div className="legend-item">
                    <span className="legend-color pause-indicator"></span>
                    <span>Long Pause (&gt;2s)</span>
                </div>
            </div>
        </div>
    );
};

// Helper function to format time (seconds -> MM:SS)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default SpeechMap;
