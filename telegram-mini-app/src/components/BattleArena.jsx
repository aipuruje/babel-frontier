import { useState } from 'react';
import { motion } from 'framer-motion';
import WebApp from '@twa-dev/sdk';

export default function BattleArena() {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);

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

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setAudioChunks(chunks);

            // Auto-stop after 30 seconds
            setTimeout(() => {
                if (recorder.state === 'recording') {
                    stopRecording();
                }
            }, 30000);

        } catch (error) {
            console.error('Recording error:', error);
            WebApp.showAlert('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
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

        } catch (error) {
            console.error('Analysis error:', error);
            WebApp.showAlert('Failed to analyze speech. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const getBandColor = (bandScore) => {
        const colors = {
            'band_9.0': '#00ff00',
            'band_8.5': '#10b981',
            'band_8.0': '#22c55e',
            'band_7.5': '#84cc16',
            'band_7.0': '#eab308',
            'band_6.5': '#f59e0b',
            'band_6.0': '#f97316',
            'band_5.5': '#ef4444',
            'band_5.0': '#dc2626',
            'band_4.5': '#b91c1c',
            'band_4.0': '#991b1b',
            'band_3.5': '#7f1d1d'
        };
        return colors[bandScore] || '#6b7280';
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4">
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
                            className="space-y-4"
                        >
                            {/* Band Score */}
                            <div
                                className="p-6 rounded-xl text-center border-2"
                                style={{
                                    borderColor: getBandColor(result.band_score),
                                    backgroundColor: `${getBandColor(result.band_score)}10`
                                }}
                            >
                                <div className="text-5xl font-bold" style={{ color: getBandColor(result.band_score) }}>
                                    {result.band_score?.replace('band_', '')} Band
                                </div>
                                <p className="text-zinc-400 mt-2">{result.feedback}</p>
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
