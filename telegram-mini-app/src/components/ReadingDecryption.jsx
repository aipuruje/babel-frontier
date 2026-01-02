import { useState } from 'react';
import { motion } from 'framer-motion';
import UzbekPattern from './UzbekPattern';

const READING_PASSAGES = [
    {
        id: 1,
        title: "The Silk Road Legacy",
        difficulty: "Band 5.0",
        passage: `The Silk Road was an ancient network of trade routes that connected the East and West. It was central to cultural, commercial, and technological exchange between civilizations. The routes were not only used for trading silk from China, but also for spices, gold, and ideas.

Samarkand, located in present-day Uzbekistan, was one of the most important cities along the Silk Road. Traders from across Asia and Europe would stop there to rest and trade goods. The city became wealthy and culturally diverse, with influences from Persian, Chinese, and Arab civilizations.

Today, Samarkand remains a symbol of the historical importance of Central Asia in global trade and culture.`,
        questions: [
            { text: "The Silk Road only transported silk.", type: "TF", answer: "FALSE" },
            { text: "Samarkand was an important trading city.", type: "TF", answer: "TRUE" },
            { text: "The passage mentions that Samarkand is in Kazakhstan.", type: "TF", answer: "FALSE" },
            { text: "Cultural exchange happened along the Silk Road.", type: "TF", answer: "TRUE" }
        ],
        xp_reward: 200,
        icon: "📜"
    },
    {
        id: 2,
        title: "IELTS Preparation Strategies",
        difficulty: "Band 6.5",
        passage: `Preparing for the IELTS exam requires a strategic approach. First, understand the test format thoroughly - knowing what to expect reduces anxiety. Second, practice regularly with authentic materials. Mock tests help identify weaknesses and track progress.

Time management is crucial. In the Reading section, spend no more than 20 minutes per passage. Skim the text first for main ideas, then read questions carefully. Many candidates lose marks not because they lack English skills, but because they misunderstand what is being asked.

Vocabulary building should be systematic. Instead of memorizing random words, learn them in context through reading newspapers, academic articles, and quality online content.`,
        questions: [
            { text: "Understanding the test format helps reduce anxiety.", type: "TF", answer: "TRUE" },
            { text: "Each reading passage should take 30 minutes.", type: "TF", answer: "FALSE" },
            { text: "Vocabulary should be learned through random memorization.", type: "TF", answer: "FALSE" },
            { text: "Many candidates fail due to misunderstanding questions.", type: "TF", answer: "TRUE" }
        ],
        xp_reward: 300,
        icon: "📖"
    }
];

export default function ReadingDecryption() {
    const [selectedPassage, setSelectedPassage] = useState(null);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);

    const handleAnswerChange = (questionIndex, value) => {
        setAnswers(prev => ({ ...prev, [questionIndex]: value }));
    };

    const submitAnswers = () => {
        if (!selectedPassage) return;

        let correct = 0;
        selectedPassage.questions.forEach((q, index) => {
            if (answers[index] === q.answer) {
                correct++;
            }
        });

        setScore(correct);
        setShowResults(true);
    };

    const resetPassage = () => {
        setSelectedPassage(null);
        setAnswers({});
        setShowResults(false);
        setScore(0);
    };

    if (selectedPassage) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 relative overflow-hidden">
                <UzbekPattern variant="samarkand" opacity={0.05} />

                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <button
                            onClick={resetPassage}
                            className="mb-4 text-green-400 hover:text-green-300 text-sm"
                        >
                            ← Back to Archive
                        </button>
                        <h2 className="text-3xl font-bold text-center mb-2">
                            {selectedPassage.icon} {selectedPassage.title}
                        </h2>
                        <div className="text-center mt-2">
                            <span className="text-sm px-3 py-1 bg-uzbek-saffron text-black rounded-full font-bold">
                                {selectedPassage.difficulty}
                            </span>
                        </div>
                    </motion.div>

                    {!showResults ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Passage */}
                            <div className="bg-uzbek-silk-cream text-black rounded-xl p-6 border-2 border-uzbek-terracotta">
                                <h3 className="text-lg font-bold mb-4 text-uzbek-terracotta">🔍 Ancient Text</h3>
                                <div className="prose prose-sm leading-relaxed whitespace-pre-line">
                                    {selectedPassage.passage}
                                </div>
                            </div>

                            {/* Questions */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold mb-4 text-green-400">❓ True / False / Not Given</h3>
                                {selectedPassage.questions.map((q, index) => (
                                    <div key={index} className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
                                        <p className="mb-3 font-medium">{index + 1}. {q.text}</p>
                                        <div className="flex gap-2">
                                            {['TRUE', 'FALSE', 'NOT GIVEN'].map(option => (
                                                <button
                                                    key={option}
                                                    onClick={() => handleAnswerChange(index, option)}
                                                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${answers[index] === option
                                                            ? 'bg-green-500 text-black'
                                                            : 'bg-zinc-700 text-white hover:bg-zinc-600'
                                                        }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={submitAnswers}
                                    disabled={Object.keys(answers).length < selectedPassage.questions.length}
                                    className={`w-full font-bold py-4 rounded-xl transition-all ${Object.keys(answers).length < selectedPassage.questions.length
                                            ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg'
                                        }`}
                                >
                                    Decrypt Answers
                                </button>
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-800 rounded-xl p-8 border-2"
                            style={{
                                borderColor: score === selectedPassage.questions.length ? '#10b981' : '#f59e0b'
                            }}
                        >
                            <h3 className="text-3xl font-bold text-center mb-4">
                                {score === selectedPassage.questions.length ? '🎉 Decryption Complete!' : '📊 Decryption Results'}
                            </h3>
                            <div className="text-center mb-6">
                                <div className="text-6xl font-bold" style={{
                                    color: score === selectedPassage.questions.length ? '#10b981' : '#f59e0b'
                                }}>
                                    {score}/{selectedPassage.questions.length}
                                </div>
                                <p className="text-zinc-400 mt-2">Correct Answers</p>
                            </div>

                            <div className="mb-6 space-y-2">
                                {selectedPassage.questions.map((q, index) => {
                                    const isCorrect = answers[index] === q.answer;
                                    return (
                                        <div key={index} className={`p-3 rounded-lg ${isCorrect ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                                            <p className="text-sm mb-1">{q.text}</p>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-green-400">Correct: {q.answer}</span>
                                                <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>
                                                    Your answer: {answers[index]}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="text-center mb-6">
                                <div className="text-yellow-400 text-xl font-bold">
                                    +{Math.floor(selectedPassage.xp_reward * (score / selectedPassage.questions.length))} XP
                                </div>
                            </div>

                            <button
                                onClick={resetPassage}
                                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 rounded-xl hover:shadow-lg transition-all"
                            >
                                Return to Archive
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        );
    }

    // Passage Selection
    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 relative overflow-hidden">
            <UzbekPattern variant="default" opacity={0.06} />

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent mb-2">
                        📖 The Archive
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        IELTS Reading Missions - Decrypt ancient wisdom
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {READING_PASSAGES.map((passage, index) => (
                        <motion.div
                            key={passage.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setSelectedPassage(passage)}
                            className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 hover:border-green-400 cursor-pointer transition-all hover:scale-105"
                        >
                            <div className="text-5xl text-center mb-4">{passage.icon}</div>
                            <h3 className="text-xl font-bold text-center mb-2">{passage.title}</h3>
                            <p className="text-sm text-zinc-400 text-center mb-4">
                                {passage.questions.length} True/False/NG Questions
                            </p>
                            <div className="flex justify-between items-center text-xs">
                                <span className="px-2 py-1 bg-uzbek-saffron text-black rounded font-bold">{passage.difficulty}</span>
                                <span className="text-yellow-400">+{passage.xp_reward} XP</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
