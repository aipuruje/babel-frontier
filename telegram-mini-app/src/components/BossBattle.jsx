import { useRef, useState, useEffect, useCallback } from 'react';
import RecordRTC from 'recordrtc';
import { motion, AnimatePresence } from 'framer-motion';
import UzbekPattern from './UzbekPattern';
import PaymentModal from './PaymentModal';

const BOSS_DATA = {
    id: 1,
    name: "The Silence Spectre",
    title: "Guardian of Samarkand Citadel",
    maxHp: 1000,
    weaknesses: ['discourse_markers', 'complex_sentences', 'fluency'],
    phase1_hp: 666,
    phase2_hp: 333,
    phase3_hp: 0
};

const IELTS_PART2_TOPICS = [
    {
        id: 1,
        title: "Describe a person who has influenced you",
        prompt: "You should say:\n• Who this person is\n• How you met them\n• What they taught you\n• And explain why they influenced you",
        time_limit: 120,
        difficulty: "Band 6.5"
    },
    {
        id: 2,
        title: "Describe a memorable journey you took",
        prompt: "You should say:\n• Where you went\n• Who you went with\n• What made it memorable\n• And explain how it changed you",
        time_limit: 120,
        difficulty: "Band 7.0"
    },
    {
        id: 3,
        title: "Describe a global environmental problem",
        prompt: "You should say:\n• What the problem is\n• Its causes and effects\n• How it can be solved\n• And give your opinion",
        time_limit: 120,
        difficulty: "BAND 8.0 (LOCKED)",
        isLocked: true
    }
];

const DISCOURSE_MARKERS = ['furthermore', 'in addition', 'consequently', 'moreover', 'nevertheless', 'however'];

export default function BossBattle() {
    const [gameState, setGameState] = useState('lobby'); // lobby, battle, victory, defeat
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [bossHp, setBossHp] = useState(BOSS_DATA.maxHp);
    const [playerHp, setPlayerHp] = useState(100);
    const [isRecording, setIsRecording] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(120);
    const [combatLog, setCombatLog] = useState([]);
    const [fluencyStreak, setFluencyStreak] = useState(0);
    const [showPayment, setShowPayment] = useState(false);

    const currentPhase = (() => {
        if (bossHp > BOSS_DATA.phase1_hp) return 1;
        if (bossHp > BOSS_DATA.phase2_hp) return 2;
        if (bossHp > 0) return 3;
        return 3;
    })();

    const recorderRef = useRef(null);
    const streamRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const gameStateRef = useRef(gameState);
    const timeRemainingRef = useRef(timeRemaining);
    const analysisTimeoutRef = useRef(null);

    useEffect(() => {
        gameStateRef.current = gameState;
        timeRemainingRef.current = timeRemaining;
    }, [gameState, timeRemaining]);

    const addCombatLog = useCallback((message, type = 'player') => {
        setCombatLog(prev => [...prev, { message, type, timestamp: Date.now() }]);
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            recorderRef.current = new RecordRTC(stream, {
                type: 'audio',
                mimeType: 'audio/webm', // RecordRTC handles iOS nuances internally
                recorderType: RecordRTC.StereoAudioRecorder, // Better for speech analysis
                numberOfAudioChannels: 1,
                desiredSampRate: 16000,
                timeSlice: 3000, // Get data every 3s
                ondataavailable: async (blob) => {
                    if (gameStateRef.current === 'battle' && timeRemainingRef.current > 0) {
                        // Safety Timeout: If analysis hangs > 5s, ignore it to prevent UI freeze
                        const timeoutId = setTimeout(() => {
                            addCombatLog('⚠️ Network slow. Retrying...', 'system');
                        }, 5000);

                        try {
                            await analyzeAudio(blob);
                        } catch (e) {
                            console.error("Analysis failed", e);
                        } finally {
                            clearTimeout(timeoutId);
                        }
                    }
                }
            });

            recorderRef.current.startRecording();
            setIsRecording(true);
            addCombatLog('🎤 Battle begins! Speak continuously to damage the boss!', 'system');

        } catch (error) {
            console.error('Recording error:', error);
            addCombatLog('❌ Microphone access denied! (Check OS settings)', 'system');
            setIsRecording(false);
        }
    };

    const stopRecording = useCallback(() => {
        if (recorderRef.current) {
            recorderRef.current.stopRecording(() => {
                // Final blob handling if needed
            });
            recorderRef.current.destroy();
            recorderRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setIsRecording(false);
    }, []);

    const analyzeAudio = async (audioBlob) => {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob);
            formData.append('user_id', 'battle_mode');
            formData.append('username', 'warrior');

            const response = await fetch('/api/speech-analysis', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            // Calculate damage based on Gemini analysis
            let damage = 0;
            let multiplier = 1.0;

            // Base damage from word count
            if (data.word_count >= 15) damage += 50;
            else if (data.word_count >= 10) damage += 30;
            else if (data.word_count >= 5) damage += 15;

            // Fluency bonus
            if (data.gemini_analysis?.fluency_score >= 7) {
                damage += 40;
                setFluencyStreak(prev => prev + 1);

                // Note: using direct check for multiplier since state update is async
                if (fluencyStreak >= 2) { // Logic check: if previous was 2, now 3
                    multiplier = 2.5;
                    addCombatLog('🔥 FLUENCY STREAK! 2.5x damage multiplier!', 'player');
                }
            } else {
                setFluencyStreak(0);
            }

            // Vocabulary bonus (Lexical Flare)
            if (data.gemini_analysis?.vocabulary_score >= 7) {
                damage += 35;
                addCombatLog('✨ Lexical Flare activated!', 'player');
            }

            // Grammar bonus (Grammar Bastion)
            if (data.gemini_analysis?.grammar_score >= 7) {
                damage += 30;
                addCombatLog('🛡️ Grammar Bastion shields you!', 'player');
            }

            // Discourse marker detection (2.5x multiplier)
            if (data.transcription) {
                const transcription = data.transcription.toLowerCase();
                const usedMarkers = DISCOURSE_MARKERS.filter(marker => transcription.includes(marker));
                if (usedMarkers.length > 0) {
                    multiplier = 2.5;
                    addCombatLog(`💫 Discourse markers detected: ${usedMarkers.join(', ')}! 2.5x damage!`, 'player');
                }
            }

            const finalDamage = Math.floor(damage * multiplier);

            // Apply damage to boss
            if (finalDamage > 0) {
                setBossHp(prev => Math.max(0, prev - finalDamage));
                addCombatLog(`⚔️ You dealt ${finalDamage} damage! (${data.word_count} words)`, 'player');
            }

            // Boss counter-attack based on pauses/errors
            const errors = data.gemini_analysis?.common_errors?.length || 0;
            const hesitations = data.gemini_analysis?.hesitations || 0;

            if (hesitations > 2 || errors > 1) {
                const bossDamage = Math.min(20, hesitations * 5 + errors * 3);
                setPlayerHp(prev => Math.max(0, prev - bossDamage));
                addCombatLog(`💀 The Silence Spectre casts Mute Spell! -${bossDamage} HP`, 'boss');
            }

        } catch (error) {
            console.error('Analysis error:', error);
            addCombatLog('❌ Analysis failed!', 'system');
        }
    };

    const startBattle = (topic) => {
        setSelectedTopic(topic);
        setBossHp(BOSS_DATA.maxHp);
        setPlayerHp(100);
        setTimeRemaining(topic.time_limit);
        setCombatLog([]);
        setFluencyStreak(0);
        setGameState('battle');
        // Delay startRecording slightly to ensure state updates
        setTimeout(startRecording, 100);
    };



    // Victory/Defeat conditions
    useEffect(() => {
        if (gameState !== 'battle') return;

        if (bossHp <= 0) {
            setTimeout(() => {
                setGameState('victory');
                stopRecording();
            }, 0);
        } else if (playerHp <= 0) {
            setTimeout(() => {
                setGameState('defeat');
                stopRecording();
            }, 0);
        } else if (timeRemaining <= 0) {
            setTimeout(() => {
                setGameState('defeat');
                stopRecording();
                addCombatLog('⏱️ Time expired! The Silence Spectre wins!', 'boss');
            }, 0);
        }
    }, [bossHp, playerHp, timeRemaining, gameState, stopRecording, addCombatLog]);

    // Battle timer
    useEffect(() => {
        if (gameState === 'battle') {
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => Math.max(0, prev - 1));
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState]);

    const getBossPhaseText = () => {
        switch (currentPhase) {
            case 1: return "WEAKENED PHASE";
            case 2: return "ENRAGED PHASE";
            case 3: return "DESPERATE PHASE";
            default: return "";
        }
    };

    // Lobby View
    if (gameState === 'lobby') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-purple-950 to-black text-white p-4 relative overflow-hidden">
                <UzbekPattern variant="default" opacity={0.08} />

                <div className="max-w-5xl mx-auto relative z-10 py-12">
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-7xl font-bold mb-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                                BOSS BATTLE
                            </span>
                        </h1>
                        <p className="text-xl text-gray-400">The Orator's Duel - IELTS Part 2 Combat Mode</p>
                    </motion.div>

                    {/* Boss Preview */}
                    <div className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-2 border-purple-500/30 rounded-xl p-12 mb-12 text-center">
                        <div className="text-8xl mb-6">👻</div>
                        <h2 className="text-4xl font-bold mb-2">{BOSS_DATA.name}</h2>
                        <p className="text-cyan-400 text-lg mb-6">{BOSS_DATA.title}</p>
                        <div className="max-w-2xl mx-auto text-gray-300 leading-relaxed">
                            To defeat this boss, you must speak continuously for 2 minutes using the IELTS Part 2 cue card format.
                            Use discourse markers and complex grammar to deal massive damage!
                        </div>
                    </div>

                    {/* Topic Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {IELTS_PART2_TOPICS.map((topic) => (
                            <motion.div
                                key={topic.id}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => topic.isLocked ? setShowPayment(true) : startBattle(topic)}
                                className={`bg-zinc-800 border-2 ${topic.isLocked ? 'border-red-500/30 opacity-75' : 'border-cyan-500/30'} rounded-xl p-8 cursor-pointer hover:border-cyan-500 transition-all relative overflow-hidden`}
                            >
                                {topic.isLocked && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                                        <div className="text-center">
                                            <div className="text-3xl mb-1">🔒</div>
                                            <div className="font-bold text-yellow-400">SULTAN'S PASS</div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold">{topic.title}</h3>
                                    <span className={`text-xs px-3 py-1 ${topic.isLocked ? 'bg-red-900 text-red-200' : 'bg-cyan-500 text-black'} rounded-full font-bold`}>
                                        {topic.difficulty}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 whitespace-pre-line mb-4">{topic.prompt}</p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <span>Vaqt: {topic.time_limit}s</span>
                                    <span className={topic.isLocked ? 'text-red-400' : 'text-cyan-400'}>
                                        {topic.isLocked ? 'Unlock (49,000 UZS)' : 'Jangni Boshlash →'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <PaymentModal
                        isOpen={showPayment}
                        onClose={() => setShowPayment(false)}
                        itemName="Band 8.0 Protocol"
                    />
                </div>
            </div>
        );
    }

    // Battle View
    if (gameState === 'battle') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black text-white p-4 relative overflow-hidden">
                <UzbekPattern variant="samarkand" opacity={0.05} />

                <div className="max-w-6xl mx-auto relative z-10">
                    {/* Boss HP Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h2 className="text-2xl font-bold">{BOSS_DATA.name}</h2>
                                <span className="text-xs text-purple-400">{getBossPhaseText()}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold">{bossHp}/{BOSS_DATA.maxHp}</div>
                                <div className="text-xs text-gray-500">HP</div>
                            </div>
                        </div>
                        <div className="w-full h-6 bg-zinc-800 rounded-full overflow-hidden border-2 border-purple-500">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                initial={{ width: '100%' }}
                                animate={{ width: `${(bossHp / BOSS_DATA.maxHp) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cue Card */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-yellow-900/20 border-2 border-yellow-500 rounded-xl p-6">
                                <h3 className="text-xl font-bold mb-4">📋 Your Task:</h3>
                                <p className="text-lg font-bold mb-2">{selectedTopic?.title}</p>
                                <p className="text-sm text-gray-300 whitespace-pre-line">{selectedTopic?.prompt}</p>

                                <div className="mt-6 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        {isRecording && (
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} className="w-1 h-4 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                                                ))}
                                            </div>
                                        )}
                                        <span className="text-cyan-400 font-bold">
                                            {isRecording ? '🎤 RECORDING...' : '⏸️ PAUSED'}
                                        </span>
                                    </div>
                                    <div className="text-3xl font-bold mono" style={{ color: timeRemaining < 30 ? '#FF3131' : '#00F2FF' }}>
                                        {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                                    </div>
                                </div>
                            </div>

                            {/* Combat Log */}
                            <div className="bg-black/50 border border-zinc-700 rounded-xl p-4 h-64 overflow-y-auto">
                                <h4 className="text-sm font-bold text-gray-500 mb-3">COMBAT LOG</h4>
                                <div className="space-y-2">
                                    {combatLog.slice(-10).reverse().map((log) => (
                                        <div key={log.timestamp} className={`text-xs ${log.type === 'player' ? 'text-cyan-400' :
                                            log.type === 'boss' ? 'text-red-400' : 'text-gray-400'
                                            }`}>
                                            {log.message}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Player Status */}
                        <div className="space-y-6">
                            <div className="bg-zinc-800 border border-cyan-500/30 rounded-xl p-6">
                                <h4 className="text-sm font-bold mb-4">YOUR HP</h4>
                                <div className="text-4xl font-bold text-center mb-2">{playerHp}%</div>
                                <div className="w-full h-4 bg-zinc-900 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-500"
                                        style={{ width: `${playerHp}%` }}
                                    />
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 border border-cyan-500/30 rounded-xl p-6">
                                <h4 className="text-sm font-bold mb-4 text-cyan-400">ACTIVE BUFFS</h4>
                                {fluencyStreak >= 3 && (
                                    <div className="mb-2 text-xs bg-yellow-500/20 border border-yellow-500 rounded p-2">
                                        🔥 Fluency Streak x{fluencyStreak}
                                    </div>
                                )}
                                <div className="text-xs text-gray-400 space-y-1">
                                    <div>💬 Discourse Markers: 2.5x damage</div>
                                    <div>🛡️ Grammar Bastion: +30 damage</div>
                                    <div>✨ Lexical Flare: +35 damage</div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setGameState('lobby');
                                    stopRecording();
                                }}
                                className="w-full px-6 py-3 bg-red-500/20 border border-red-500 text-red-400 rounded-xl hover:bg-red-500/30 transition"
                            >
                                Retreat
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Victory/Defeat View
    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 flex items-center justify-center relative overflow-hidden">
            <UzbekPattern variant="registan" opacity={0.08} />

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center relative z-10"
            >
                <div className="text-9xl mb-8">{gameState === 'victory' ? '🏆' : '💀'}</div>
                <h1 className="text-6xl font-bold mb-4">
                    {gameState === 'victory' ? 'VICTORY!' : 'DEFEATED'}
                </h1>
                <p className="text-2xl text-gray-400 mb-12">
                    {gameState === 'victory'
                        ? 'You defeated The Silence Spectre!'
                        : 'The Silence Spectre prevails...'}
                </p>
                <button
                    onClick={() => setGameState('lobby')}
                    className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-black font-bold rounded-xl text-lg hover:scale-105 transition"
                >
                    Return to Lobby
                </button>
            </motion.div>
        </div>
    );
}
