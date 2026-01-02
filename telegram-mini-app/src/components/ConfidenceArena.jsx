import { useState, useRef, useEffect } from 'react';

const ConfidenceArena = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [confidenceData, setConfidenceData] = useState(null);
    const [sessionId] = useState(`session_${Date.now()}`);
    const [chunkNumber, setChunkNumber] = useState(0);
    const [showFillerSpell, setShowFillerSpell] = useState(false);
    const [auraIntensity, setAuraIntensity] = useState(50);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const analyzeIntervalRef = useRef(null);

    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo_user';

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                analyzeConfidenceChunk(audioBlob);
                audioChunksRef.current = [];
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Analyze every 2 seconds
            analyzeIntervalRef.current = setInterval(() => {
                if (mediaRecorderRef.current?.state === 'recording') {
                    mediaRecorderRef.current.stop();
                    setTimeout(() => {
                        mediaRecorderRef.current?.start();
                        setChunkNumber(prev => prev + 1);
                    }, 100);
                }
            }, 2000);

        } catch (error) {
            console.error('Microphone access error:', error);
            alert('Please allow microphone access to use Confidence Arena');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (analyzeIntervalRef.current) {
            clearInterval(analyzeIntervalRef.current);
        }
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
    };

    const analyzeConfidenceChunk = async (audioBlob) => {
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('user_id', userId);
        formData.append('session_id', sessionId);
        formData.append('chunk_number', chunkNumber);

        try {
            const response = await fetch('/api/confidence/analyze-stream', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();
            setConfidenceData(data);
            setAuraIntensity(data.confidence_index);

            // Show filler spell if hesitation detected
            if (data.filler_spell && data.prosody.hesitation_count > 0) {
                setShowFillerSpell(true);
                speakFillerSpell(data.filler_spell);
                setTimeout(() => setShowFillerSpell(false), 3000);
            }

        } catch (error) {
            console.error('Confidence analysis error:', error);
        }
    };

    const speakFillerSpell = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    };

    const getAuraColor = () => {
        if (!confidenceData) return 'rgba(100, 100, 255, 0.3)';

        switch (confidenceData.aura_tier) {
            case 'titan': return 'rgba(255, 215, 0, 0.8)'; // Golden
            case 'warrior': return 'rgba(56, 189, 248, 0.7)'; // Blue
            case 'novice': return 'rgba(156, 163, 175, 0.5)'; // Gray
            case 'spectre': return 'rgba(220, 38, 38, 0.6)'; // Red
            default: return 'rgba(100, 100, 255, 0.3)';
        }
    };

    const getVisualEffect = () => {
        if (!confidenceData) return '';

        if (confidenceData.visual_effect === 'screen_glitch') {
            return 'glitch';
        } else if (confidenceData.visual_effect === 'golden_glow') {
            return 'golden-glow';
        }
        return '';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    ⚔️ Confidence Arena
                </h1>
                <p className="text-slate-300 text-sm">
                    Your aura reflects your confidence. Speak fluently to unlock 2x damage!
                </p>
            </div>

            {/* Combat Avatar with Aura */}
            <div className="flex justify-center mb-12">
                <div className="relative">
                    <div
                        className={`absolute inset-0 rounded-full blur-3xl transition-all duration-500 ${getVisualEffect()}`}
                        style={{
                            backgroundColor: getAuraColor(),
                            width: '300px',
                            height: '300px',
                            opacity: auraIntensity / 100
                        }}
                    />
                    <div className="relative z-10 w-64 h-64  bg-gradient-to-br from-slate-800 to-slate-900 rounded-full border-4 border-yellow-500/30 flex items-center justify-center shadow-2xl">
                        <span className="text-8xl">🛡️</span>
                    </div>
                </div>
            </div>

            {/* Confidence Meter */}
            {confidenceData && (
                <div className="max-w-2xl mx-auto mb-8 bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold text-slate-400">CONFIDENCE INDEX</span>
                        <span className={`text-2xl font-bold ${confidenceData.confidence_index >= 85 ? 'text-yellow-400' :
                                confidenceData.confidence_index >= 70 ? 'text-blue-400' :
                                    confidenceData.confidence_index >= 50 ? 'text-gray-400' :
                                        'text-red-400'
                            }`}>
                            {Math.round(confidenceData.confidence_index)}%
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-yellow-400 transition-all duration-500"
                            style={{ width: `${confidenceData.confidence_index}%` }}
                        />
                    </div>

                    {/* Aura Tier Badge */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">
                                {confidenceData.aura_tier === 'titan' ? '👑' :
                                    confidenceData.aura_tier === 'warrior' ? '⚔️' :
                                        confidenceData.aura_tier === 'novice' ? '🎯' : '☠️'}
                            </span>
                            <div>
                                <div className="text-lg font-bold capitalize">{confidenceData.aura_tier} Aura</div>
                                <div className="text-xs text-slate-400">Damage Multiplier: {confidenceData.damage_multiplier}x</div>
                            </div>
                        </div>
                    </div>

                    {/* Prosody Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-900/50 rounded-lg p-3">
                            <div className="text-slate-400 text-xs mb-1">Speech Rate</div>
                            <div className="text-lg font-bold">{confidenceData.prosody.speech_rate} WPM</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                            <div className="text-slate-400 text-xs mb-1">Pitch Variance</div>
                            <div className="text-lg font-bold">{Math.round(confidenceData.prosody.pitch_variance)} Hz</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                            <div className="text-slate-400 text-xs mb-1">Hesitations</div>
                            <div className="text-lg font-bold text-orange-400">{confidenceData.prosody.hesitation_count}</div>
                        </div>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                            <div className="text-slate-400 text-xs mb-1">Long Pauses</div>
                            <div className="text-lg font-bold text-red-400">{confidenceData.prosody.long_pauses}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Grand Vizier Whisper (Filler Spell) */}
            {showFillerSpell && confidenceData?.filler_spell && (
                <div className="max-w-2xl mx-auto mb-8 bg-gradient-to-r from-purple-900/80 to-pink-900/80 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/50 animate-pulse">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl">🧙‍♂️</span>
                        <div>
                            <div className="text-xs font-bold text-purple-200 mb-1">GRAND VIZIER WHISPERS:</div>
                            <div className="text-xl font-bold  text-white italic">"{confidenceData.filler_spell}"</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recording Controls */}
            <div className="max-w-2xl mx-auto text-center">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        className="px-12 py-5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-2xl shadow-2xl shadow-yellow-500/50 transform hover:scale-105 transition-all duration-200 text-lg"
                    >
                        🎤 Enter Combat Arena
                    </button>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3 text-red-400 animate-pulse">
                            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                            <span className="font-bold">Recording... Speak confidently!</span>
                        </div>
                        <button
                            onClick={stopRecording}
                            className="px-12 py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200 text-lg"
                        >
                            ⏹️ End Session
                        </button>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="max-w-2xl mx-auto mt-12 bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-white/5 text-sm text-slate-400">
                <h3 className="font-bold text-white mb-3">🎯 Arena Rules:</h3>
                <ul className="space-y-2 list-disc list-inside">
                    <li><strong className="text-yellow-400">Titan Aura (85%+):</strong> Golden glow. 2x damage multiplier. Near-native fluency.</li>
                    <li><strong className="text-blue-400">Warrior Aura (70-84%):</strong> Blue aura. 1.5x damage. Strong confidence.</li>
                    <li><strong className="text-gray-400">Novice Aura (50-69%):</strong> Normal damage. Room for improvement.</li>
                    <li><strong className="text-red-400">Spectre Attack (&lt;50%):</strong> Screen glitch. 0.5x damage. High hesitation.</li>
                </ul>
                <p className="mt-4 italic text-xs">
                    💡 Tip: Avoid "um", "err", and long pauses. Use the Grand Vizier's filler spells to maintain flow!
                </p>
            </div>

            <style jsx>{`
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }

        .glitch {
          animation: glitch 0.3s infinite;
          filter: hue-rotate(180deg) brightness(1.5);
        }

        .golden-glow {
          box-shadow: 0 0 100px rgba(255, 215, 0, 0.8);
        }
      `}</style>
        </div>
    );
};

export default ConfidenceArena;
