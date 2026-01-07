import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import RecordRTC from 'recordrtc';

/**
 * Grammar Boss Component
 * Audio-based grammar challenges using Cambridge Grammar for IELTS resources
 */
export default function GrammarBoss() {
    const navigate = useNavigate();

    // Game state
    const [bossHp, setBossHp] = useState(300);
    const [playerHp, setPlayerHp] = useState(100);
    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [combatLog, setCombatLog] = useState([]);
    const [gameState, setGameState] = useState('ready'); // ready, playing, victory, defeat

    // Recording
    const recorderRef = useRef(null);
    const audioRef = useRef(null);

    // Load a random grammar challenge
    async function loadChallenge() {
        try {
            const response = await fetch('/api/resources/knowledge-base?skill=grammar&type=grammar_rule&limit=1');
            const data = await response.json();

            if (data.chunks && data.chunks.length > 0) {
                setCurrentChallenge(data.chunks[0]);
                addLog('📖 New grammar challenge loaded!', 'system');
            }
        } catch (error) {
            console.error('Failed to load challenge:', error);
            addLog('❌ Failed to load challenge', 'system');
        }
    }

    // Start battle
    function startBattle() {
        setGameState('playing');
        setBossHp(300);
        setPlayerHp(100);
        setCombatLog([]);
        loadChallenge();
        addLog('⚔️ Grammar Boss Battle begins!', 'system');
    }

    // Add combat log entry
    function addLog(message, type = 'system') {
        setCombatLog(prev => [...prev, { message, type, id: Date.now() }]);
    }

    // Start recording
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new RecordRTC(stream, {
                type: 'audio',
                mimeType: 'audio/webm',
                recorderType: RecordRTC.StereoAudioRecorder
            });

            recorder.startRecording();
            recorderRef.current = recorder;
            setIsRecording(true);
            addLog('🎤 Recording your answer...', 'player');
        } catch (error) {
            console.error('Recording failed:', error);
            addLog('❌ Microphone access denied', 'system');
        }
    }

    // Stop recording and analyze
    async function stopRecording() {
        if (!recorderRef.current) return;

        recorderRef.current.stopRecording(async () => {
            const blob = recorderRef.current.getBlob();
            recorderRef.current.getInternalRecorder().stream.getTracks().forEach(track => track.stop());

            setIsRecording(false);
            await analyzeAnswer(blob);
        });
    }

    // Analyze grammar answer using enhanced AI
    async function analyzeAnswer(audioBlob) {
        try {
            addLog('🔍 Grammar Boss is evaluating...', 'boss');

            const formData = new FormData();
            formData.append('audio', audioBlob);
            formData.append('user_id', 'grammar_boss_player');
            formData.append('username', 'Warrior');

            // First transcribe
            const transcribeResponse = await fetch('/api/speech-analysis', {
                method: 'POST',
                body: formData
            });
            const transcribeData = await transcribeResponse.json();

            if (!transcribeData.transcription) {
                addLog('❌ No speech detected', 'system');
                return;
            }

            // Then analyze with context from current challenge
            const analysisResponse = await fetch('/api/speaking/analyze-enhanced', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcription: transcribeData.transcription,
                    topic: currentChallenge ? currentChallenge.title : 'Grammar Exercise',
                    userId: 'grammar_boss_player'
                })
            });

            const analysisData = await analysisResponse.json();

            // Calculate damage based on grammar accuracy
            const grammarScore = analysisData.gemini_analysis?.grammatical_range_score || 5;
            let damage = Math.floor(grammarScore * 15); // Max 135 damage for perfect grammar

            if (grammarScore >= 8) {
                damage *= 1.5;
                addLog(`💥 CRITICAL HIT! Grammar mastery: ${grammarScore}/9`, 'player');
            } else if (grammarScore >= 6) {
                addLog(`⚡ Good grammar! Score: ${grammarScore}/9`, 'player');
            } else {
                damage = Math.floor(damage * 0.5);
                addLog(`😓 Grammar needs work. Score: ${grammarScore}/9`, 'player');
            }

            // Apply damage to boss
            const newBossHp = Math.max(0, bossHp - damage);
            setBossHp(newBossHp);
            addLog(`🗡️ You dealt ${damage} damage to Grammar Boss!`, 'player');

            // Boss counterattack (random)
            if (newBossHp > 0) {
                const bossAttack = Math.floor(Math.random() * 30) + 10;
                const newPlayerHp = Math.max(0, playerHp - bossAttack);
                setPlayerHp(newPlayerHp);
                addLog(`🔥 Grammar Boss strikes back for ${bossAttack} damage!`, 'boss');

                // Check defeat
                if (newPlayerHp <= 0) {
                    setGameState('defeat');
                    addLog('💀 You have been defeated!', 'system');
                    setTimeout(() => loadChallenge(), 2000);
                } else {
                    // Load next challenge
                    setTimeout(() => loadChallenge(), 1500);
                }
            } else {
                // Victory!
                setGameState('victory');
                addLog('🏆 Victory! Grammar Boss defeated!', 'system');

                // Unlock the grammar rule as equipment
                if (currentChallenge) {
                    await unlockGrammarRule(currentChallenge.id);
                }
            }

        } catch (error) {
            console.error('Analysis failed:', error);
            addLog('❌ Analysis failed, try again', 'system');
        }
    }

    // Unlock grammar rule as equipment
    async function unlockGrammarRule(ruleId) {
        try {
            await fetch('/api/resources/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'grammar_boss_player',
                    resourceId: ruleId,
                    resourceType: 'grammar_rule'
                })
            });
            addLog('📜 Grammar Grimoire unlocked!', 'system');
        } catch (error) {
            console.error('Failed to unlock:', error);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-black text-white p-6">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-6">
                <button
                    onClick={() => navigate('/home')}
                    className="px-4 py-2 bg-purple-800/50 rounded-lg hover:bg-purple-700 transition-all"
                >
                    ← Back to Home
                </button>
                <h1 className="text-4xl font-bold text-center mt-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ⚔️ Grammar Boss Battle
                </h1>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Boss HP Bar */}
                <div className="bg-gradient-to-br from-red-900/40 to-purple-900/40 p-6 rounded-xl border border-red-500">
                    <h2 className="text-2xl font-bold mb-4">🧙 Grammar Boss</h2>
                    <div className="w-full bg-gray-700 rounded-full h-6 mb-2">
                        <div
                            className="bg-gradient-to-r from-red-500 to-red-700 h-6 rounded-full transition-all duration-500"
                            style={{ width: `${(bossHp / 300) * 100}%` }}
                        />
                    </div>
                    <p className="text-right text-sm">{bossHp} / 300 HP</p>
                </div>

                {/* Player HP Bar */}
                <div className="bg-gradient-to-br from-green-900/40 to-blue-900/40 p-6 rounded-xl border border-green-500">
                    <h2 className="text-2xl font-bold mb-4">🛡️ You</h2>
                    <div className="w-full bg-gray-700 rounded-full h-6 mb-2">
                        <div
                            className="bg-gradient-to-r from-green-500 to-green-700 h-6 rounded-full transition-all duration-500"
                            style={{ width: `${playerHp}%` }}
                        />
                    </div>
                    <p className="text-right text-sm">{playerHp} / 100 HP</p>
                </div>
            </div>

            {/* Challenge Display */}
            {currentChallenge && gameState === 'playing' && (
                <div className="max-w-4xl mx-auto mt-6 bg-gradient-to-br from-yellow-900/30 to-purple-900/30 p-6 rounded-xl border border-yellow-500">
                    <h3 className="text-xl font-bold mb-2">{currentChallenge.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{currentChallenge.content.substring(0, 300)}...</p>
                    <p className="text-sm text-yellow-400 mt-4">📚 From: {currentChallenge.source_book}</p>
                </div>
            )
            }

            {/* Controls */}
            <div className="max-w-4xl mx-auto mt-6 text-center">
                {gameState === 'ready' && (
                    <button
                        onClick={startBattle}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-xl hover:scale-105 transition-all shadow-lg"
                    >
                        ⚔️ Challenge Grammar Boss
                    </button>
                )}

                {gameState === 'playing' && (
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`px-8 py-4 rounded-xl font-bold text-xl hover:scale-105 transition-all shadow-lg ${isRecording
                            ? 'bg-gradient-to-r from-red-600 to-red-800 animate-pulse'
                            : 'bg-gradient-to-r from-green-600 to-green-800'
                            }`}
                    >
                        {isRecording ? '⏹️ Stop & Submit Answer' : '🎤 Record Answer'}
                    </button>
                )}

                {(gameState === 'victory' || gameState === 'defeat') && (
                    <div className="space-y-4">
                        <p className="text-3xl font-bold">
                            {gameState === 'victory' ? '🏆 Victory!' : '💀 Defeat!'}
                        </p>
                        <button
                            onClick={startBattle}
                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold hover:scale-105 transition-all"
                        >
                            Battle Again
                        </button>
                    </div>
                )}
            </div>

            {/* Combat Log */}
            <div className="max-w-4xl mx-auto mt-6 bg-black/50 p-6 rounded-xl max-h-64 overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">Combat Log</h3>
                {combatLog.map(entry => (
                    <div
                        key={entry.id}
                        className={`mb-2 p-2 rounded ${entry.type === 'player' ? 'bg-green-900/30 text-green-300' :
                            entry.type === 'boss' ? 'bg-red-900/30 text-red-300' :
                                'bg-gray-800/30 text-gray-300'
                            }`}
                    >
                        {entry.message}
                    </div>
                ))}
            </div>
        </div >
    );
}
