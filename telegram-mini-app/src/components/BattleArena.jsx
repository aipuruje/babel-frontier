import { useState, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import RankBadge from './RankBadge';
import audioManager from '../utils/audioManager';
import { ParticleEffect, ScreenFlash } from './ParticleEffects';
import notificationManager from '../utils/notificationManager';

export default function BattleArena() {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [showParticles, setShowParticles] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const mediaRecorderRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                await analyzeAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);

            // Auto-stop after 30 seconds
            setTimeout(() => {
                if (recorder.state === 'recording') {
                    recorder.stop();
                    setIsRecording(false);
                }
            }, 30000);

        } catch (error) {
            console.error('Recording error:', error);
            WebApp.showAlert('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const analyzeAudio = async (audioBlob) => {
        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            formData.append('user_id', WebApp.initDataUnsafe?.user?.id || 'anonymous');
            formData.append('username', WebApp.initDataUnsafe?.user?.username || 'Player');

            const response = await fetch('/api/speech-analysis', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();
            setResult(data);

            // Haptic feedback
            if (data.damage === 0) {
                WebApp.HapticFeedback.notificationOccurred('success');
            } else if (data.damage > 20) {
                WebApp.HapticFeedback.notificationOccurred('error');
            } else {
                WebApp.HapticFeedback.notificationOccurred('warning');
            }

            // Dopamine loop triggers
            const bandValue = parseFloat(data.band_score.replace('band_', ''));

            // Audio feedback
            if (bandValue >= 7.0) {
                audioManager.playSuccess();
                notificationManager.triggerHaptic('success');
            } else if (bandValue >= 5.0) {
                audioManager.playXPGain();
            } else {
                audioManager.playFailure();
                notificationManager.triggerHaptic('warning');
            }

            // Particle effects for high scores
            if (bandValue >= 7.0) {
                setShowParticles(true);
                setShowFlash(true);
                setTimeout(() => setShowFlash(false), 500);

                // Achievement notification
                if (bandValue >= 8.5) {
                    notificationManager.notifyAchievement(
                        'Elite Performance!',
                        `Band ${bandValue} - You're speaking like a Sultan!`,
                        100
                    );
                }
            }

            // XP notification
            if (data.word_count >= 20) {
                notificationManager.triggerHaptic('success');
            }

        } catch (error) {
            console.error('Analysis error:', error);
            WebApp.showAlert('Failed to analyze speech. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4">
            {/* Particle effects */}
            <AnimatePresence>
                {showParticles && (
                    <ParticleEffect
                        type="victory"
                        value={result?.word_count}
                        x={window.innerWidth / 2}
                        y={window.innerHeight / 3}
                        onComplete={() => setShowParticles(false)}
                    />
                )}
                {showFlash && <ScreenFlash color="#00FF00" duration={0.5} />}
            </AnimatePresence>
            {/* Header */}
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        🎤 Battle Arena
                    </h1>
                    <p className="text-zinc-400 mt-2">Speak English, Deal Damage!</p>
                </motion.div>

                {/* Recording Interface */}
                <div className="bg-zinc-800 rounded-2xl p-8 mb-6 border border-zinc-700">
                    {!result && (
                        <div className="text-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isProcessing}
                                className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl transition-all duration-300 ${isRecording
                                    ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse'
                                    : 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50'
                                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isRecording ? '⏹️' : '🎤'}
                            </motion.button>

                            <p className="mt-6 text-zinc-300">
                                {isRecording
                                    ? 'Recording... Tap to stop'
                                    : isProcessing
                                        ? 'Analyzing your speech...'
                                        : 'Tap microphone to start'}
                            </p>

                            {isRecording && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-4 text-sm text-zinc-500"
                                >
                                    Auto-stops in 30 seconds
                                </motion.p>
                            )}
                        </div>
                    )}

                    {/* Results */}
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-6"
                        >
                            {/* Rank Badge */}
                            <div className="flex justify-center">
                                <RankBadge
                                    bandScore={result.band_score}
                                    size="large"
                                    showTitle={true}
                                    animated={true}
                                />
                            </div>

                            {/* Feedback */}
                            <div className="text-center">
                                <p className="text-xl font-bold text-white mb-2">{result.feedback}</p>
                            </div>

                            {/* Transcription */}
                            <div className="bg-zinc-900 p-4 rounded-xl">
                                <h3 className="text-sm font-semibold text-zinc-400 mb-2">Transcription:</h3>
                                <p className="text-lg">{result.transcription}</p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-bold text-blue-400">{result.word_count}</div>
                                    <div className="text-sm text-zinc-500">Words</div>
                                </div>
                                <div className="bg-zinc-900 p-4 rounded-xl text-center">
                                    <div className="text-3xl font-bold text-red-400">{result.damage}</div>
                                    <div className="text-sm text-zinc-500">Damage</div>
                                </div>
                            </div>

                            {/* Gemini AI Analysis */}
                            {result.gemini_analysis && (
                                <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-2 border-purple-500/30 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
                                        <span>✨</span> AI-Powered IELTS Analysis
                                    </h3>

                                    {/* Skill Scores Grid */}
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {result.gemini_analysis.fluency_score > 0 && (
                                            <div className="bg-black/30 p-2 rounded">
                                                <div className="text-xs text-zinc-400">Fluency</div>
                                                <div className="text-lg font-bold text-cyan-400">{result.gemini_analysis.fluency_score}/9</div>
                                            </div>
                                        )}
                                        {result.gemini_analysis.pronunciation_score > 0 && (
                                            <div className="bg-black/30 p-2 rounded">
                                                <div className="text-xs text-zinc-400">Pronunciation</div>
                                                <div className="text-lg font-bold text-green-400">{result.gemini_analysis.pronunciation_score}/9</div>
                                            </div>
                                        )}
                                        {result.gemini_analysis.grammar_score > 0 && (
                                            <div className="bg-black/30 p-2 rounded">
                                                <div className="text-xs text-zinc-400">Grammar</div>
                                                <div className="text-lg font-bold text-yellow-400">{result.gemini_analysis.grammar_score}/9</div>
                                            </div>
                                        )}
                                        {result.gemini_analysis.vocabulary_score > 0 && (
                                            <div className="bg-black/30 p-2 rounded">
                                                <div className="text-xs text-zinc-400">Vocabulary</div>
                                                <div className="text-lg font-bold text-orange-400">{result.gemini_analysis.vocabulary_score}/9</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Errors & Strengths */}
                                    {result.gemini_analysis.common_errors?.length > 0 && (
                                        <div className="mb-3">
                                            <div className="text-xs font-bold text-red-400 mb-1">⚠️ Areas to Improve:</div>
                                            <div className="space-y-1">
                                                {result.gemini_analysis.common_errors.map((error, i) => (
                                                    <div key={i} className="text-xs text-zinc-300 bg-red-900/20 px-2 py-1 rounded">
                                                        • {error}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {result.gemini_analysis.strengths?.length > 0 && (
                                        <div>
                                            <div className="text-xs font-bold text-green-400 mb-1">✅ Strengths:</div>
                                            <div className="space-y-1">
                                                {result.gemini_analysis.strengths.map((strength, i) => (
                                                    <div key={i} className="text-xs text-zinc-300 bg-green-900/20 px-2 py-1 rounded">
                                                        • {strength}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setResult(null)}
                                    className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 rounded-xl hover:shadow-lg transition-all"
                                >
                                    🔄 Try Again
                                </button>
                                <button
                                    onClick={() => WebApp.close()}
                                    className="flex-1 bg-zinc-700 text-white font-bold py-4 rounded-xl hover:bg-zinc-600 transition-all"
                                >
                                    🏠 Home
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
