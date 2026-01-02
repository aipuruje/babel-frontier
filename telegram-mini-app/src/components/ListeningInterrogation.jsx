import { useState } from 'react';
import { motion } from 'framer-motion';
import UzbekPattern from './UzbekPattern';

const LISTENING_MISSIONS = [
    {
        id: 1,
        title: "The Tashkent Market",
        difficulty: "Band 4.5",
        description: "Intercept conversations at the bazaar. Complete missing words.",
        audio_url: "/audio/market.mp3", // Placeholder
        questions: [
            { text: "The vendor sells _____ and vegetables", answer: "fruits" },
            { text: "The price is _____ sum", answer: "5000" },
            { text: "Business is good on _____", answer: "weekends" }
        ],
        xp_reward: 150,
        icon: "🎧"
    },
    {
        id: 2,
        title: "University Lecture",
        difficulty: "Band 6.0",
        description: "Decode an academic lecture on Silk Road history.",
        audio_url: "/audio/lecture.mp3",
        questions: [
            { text: "The Silk Road connected East and _____", answer: "West" },
            { text: "Trade flourished during the _____ century", answer: "13th" },
            { text: "Samarkand was a major _____ center", answer: "trading" }
        ],
        xp_reward: 250,
        icon: "🎓"
    },
    {
        id: 3,
        title: "Phone Conversation",
        difficulty: "Band 7.0",
        description: "Listen to a complex discussion about travel plans.",
        audio_url: "/audio/phone.mp3",
        questions: [
            { text: "They plan to meet at _____ o'clock", answer: "three" },
            { text: "The destination is _____", answer: "Bukhara" },
            { text: "They will travel by _____", answer: "train" }
        ],
        xp_reward: 350,
        icon: "📞"
    }
];

export default function ListeningInterrogation() {
    const [selectedMission, setSelectedMission] = useState(null);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);

    const handleAnswerChange = (questionIndex, value) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: value }));
    };

    const submitAnswers = () => {
        if (!selectedMission) return;

        let correct = 0;
        selectedMission.questions.forEach((q, index) => {
            if (answers[index]?.toLowerCase().trim() === q.answer.toLowerCase()) {
                correct++;
            }
        });

        setScore(correct);
        setShowResults(true);
    };

    const resetMission = () => {
        setSelectedMission(null);
        setAnswers({});
        setShowResults(false);
        setScore(0);
    };

    if (selectedMission) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 relative overflow-hidden">
                <UzbekPattern variant="default" opacity={0.05} />

                <div className="max-w-3xl mx-auto relative z-10">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <button
                            onClick={resetMission}
                            className="mb-4 text-cyan-400 hover:text-cyan-300 text-sm"
                        >
                            ← Back to Missions
                        </button>
                        <h2 className="text-3xl font-bold text-center mb-2">
                            {selectedMission.icon} {selectedMission.title}
                        </h2>
                        <p className="text-center text-zinc-400">{selectedMission.description}</p>
                        <div className="text-center mt-2">
                            <span className="text-sm px-3 py-1 bg-uzbek-lapis rounded-full">
                                {selectedMission.difficulty}
                            </span>
                        </div>
                    </motion.div>

                    {!showResults ? (
                        <>
                            {/* Audio Player Placeholder */}
                            <div className="bg-zinc-800 rounded-xl p-6 mb-6 border border-zinc-700">
                                <h3 className="text-lg font-bold mb-4 text-center">🎧 Audio Wiretap</h3>
                                <div className="bg-black rounded-lg p-8 text-center">
                                    <p className="text-zinc-400 mb-4">
                                        Audio playback coming soon!<br />
                                        <span className="text-xs">Integration with audio API in progress</span>
                                    </p>
                                    <div className="flex justify-center items-center gap-4">
                                        <button className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-2xl">
                                            ▶️
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Questions */}
                            <div className="space-y-4 mb-6">
                                {selectedMission.questions.map((q, index) => (
                                    <div key={index} className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
                                        <label className="block text-sm font-semibold mb-2">
                                            Question {index + 1}
                                        </label>
                                        <p className="mb-3">{q.text}</p>
                                        <input
                                            type="text"
                                            value={answers[index] || ''}
                                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                                            placeholder="Your answer..."
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={submitAnswers}
                                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transition-all"
                            >
                                Submit Answers
                            </button>
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-800 rounded-xl p-8 border-2"
                            style={{
                                borderColor: score === selectedMission.questions.length ? '#10b981' : '#f59e0b'
                            }}
                        >
                            <h3 className="text-3xl font-bold text-center mb-4">
                                {score === selectedMission.questions.length ? '🎉 Perfect!' : '📊 Results'}
                            </h3>
                            <div className="text-center mb-6">
                                <div className="text-6xl font-bold" style={{
                                    color: score === selectedMission.questions.length ? '#10b981' : '#f59e0b'
                                }}>
                                    {score}/{selectedMission.questions.length}
                                </div>
                                <p className="text-zinc-400 mt-2">Correct Answers</p>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-bold mb-3">Correct Answers:</h4>
                                {selectedMission.questions.map((q, index) => (
                                    <div key={index} className="mb-2 text-sm">
                                        <span className="text-zinc-400">Q{index + 1}:</span>{' '}
                                        <span className="text-green-400">{q.answer}</span>
                                        {answers[index]?.toLowerCase().trim() !== q.answer.toLowerCase() && (
                                            <span className="text-red-400 ml-2">(You: {answers[index] || 'no answer'})</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mb-6">
                                <div className="text-yellow-400 text-xl font-bold">
                                    +{Math.floor(selectedMission.xp_reward * (score / selectedMission.questions.length))} XP
                                </div>
                            </div>

                            <button
                                onClick={resetMission}
                                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 rounded-xl hover:shadow-lg transition-all"
                            >
                                Back to Missions
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        );
    }

    // Mission Selection Screen
    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 relative overflow-hidden">
            <UzbekPattern variant="registan" opacity={0.06} />

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent mb-2">
                        🎧 Spy Wiretapping
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        IELTS Listening Missions - Intercept and decode
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {LISTENING_MISSIONS.map((mission, index) => (
                        <motion.div
                            key={mission.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setSelectedMission(mission)}
                            className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 hover:border-cyan-400 cursor-pointer transition-all hover:scale-105"
                        >
                            <div className="text-5xl text-center mb-4">{mission.icon}</div>
                            <h3 className="text-xl font-bold text-center mb-2">{mission.title}</h3>
                            <p className="text-sm text-zinc-400 text-center mb-4">{mission.description}</p>
                            <div className="flex justify-between items-center text-xs">
                                <span className="px-2 py-1 bg-uzbek-lapis rounded">{mission.difficulty}</span>
                                <span className="text-yellow-400">+{mission.xp_reward} XP</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
