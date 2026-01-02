import { useState, useRef } from 'react';

const ArchiveScavenger = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [selectedHeading, setSelectedHeading] = useState(null);
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [achievementProgress, setAchievementProgress] = useState({ completed: 0, required: 3 });

    const fileInputRef = useRef(null);
    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo_user';

    const handleImageCapture = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setScanResult(null);
        setQuizSubmitted(false);
        setSelectedHeading(null);

        const formData = new FormData();
        formData.append('image', file);
        formData.append('user_id', userId);
        formData.append('location', 'Tashkent');

        try {
            const response = await fetch('/api/vision/scan-object', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Scan error: ${response.statusText}`);
            }

            const data = await response.json();
            setScanResult(data);

        } catch (error) {
            console.error('AR Scan error:', error);
            alert('Failed to scan object. Please try again.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleQuizSubmit = async () => {
        if (selectedHeading === null || !scanResult) return;

        try {
            const response = await fetch('/api/vision/quiz-submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    passageId: scanResult.passage_id,
                    selectedHeading
                })
            });

            const data = await response.json();
            setQuizSubmitted(true);
            setAchievementProgress({
                completed: data.scans_completed,
                required: data.scans_required
            });

            if (data.achievement_unlocked) {
                alert('🎉 Samarkand Scholar rank unlocked!');
            }

        } catch (error) {
            console.error('Quiz submit error:', error);
        }
    };

    const triggerCamera = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-6">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    📸 Archive Scavenger
                </h1>
                <p className="text-slate-300 text-sm">
                    Scan real-world objects to unlock IELTS reading passages
                </p>
            </div>

            {/* Achievement Progress */}
            <div className="max-w-2xl mx-auto mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-slate-300">SAMARKAND SCHOLAR PROGRESS</span>
                    <span className="text-lg font-bold text-yellow-400">
                        {achievementProgress.completed}/{achievementProgress.required}
                    </span>
                </div>
                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                        style={{ width: `${(achievementProgress.completed / achievementProgress.required) * 100}%` }}
                    />
                </div>
                {achievementProgress.completed >= achievementProgress.required && (
                    <div className="mt-4 text-center text-yellow-400 font-bold animate-pulse">
                        ✨ Samarkand Scholar Unlocked! ✨
                    </div>
                )}
            </div>

            {/* Camera Button */}
            {!scanResult && (
                <div className="text-center mb-8">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageCapture}
                        className="hidden"
                    />
                    <button
                        onClick={triggerCamera}
                        disabled={isScanning}
                        className="px-12 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold rounded-2xl shadow-2xl shadow-purple-500/50 transform hover:scale-105 transition-all duration-200 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isScanning ? (
                            <span className="flex items-center gap-3">
                                <div className="animate-spin w-6 h-6 border-4 border-white border-t-transparent rounded-full"></div>
                                Scanning...
                            </span>
                        ) : (
                            '📷 Scan Object'
                        )}
                    </button>
                </div>
            )}

            {/* Scan Result */}
            {scanResult && (
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Object Detected */}
                    <div className="bg-gradient-to-r from-green-900/50 to-cyan-900/50 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-5xl">🔍</span>
                            <div>
                                <div className="text-xs font-bold text-green-300">OBJECT DETECTED</div>
                                <div className="text-2xl font-bold capitalize">{scanResult.object.replace('_', ' ')}</div>
                                <div className="text-sm text-slate-300 mt-1">Category: {scanResult.category}</div>
                            </div>
                        </div>
                    </div>

                    {/* Generated Passage */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">📖</span>
                            <h3 className="text-xl font-bold">Reading Fragment</h3>
                        </div>
                        <div className="text-xs font-bold text-purple-300 mb-2 uppercase tracking-wide">
                            Topic: {scanResult.topic}
                        </div>
                        <p className="text-slate-200 leading-relaxed text-sm">
                            {scanResult.passage}
                        </p>
                    </div>

                    {/* Heading Matching Quiz */}
                    <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>🎯</span> Heading Matching Task
                        </h3>
                        <p className="text-sm text-slate-300 mb-6">
                            Choose the heading that best summarizes the passage:
                        </p>

                        <div className="space-y-3">
                            {scanResult.headings.map((heading, index) => (
                                <button
                                    key={index}
                                    onClick={() => !quizSubmitted && setSelectedHeading(index)}
                                    disabled={quizSubmitted}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedHeading === index
                                            ? 'border-yellow-400 bg-yellow-400/20'
                                            : 'border-white/20 bg-white/5 hover:border-white/40'
                                        } ${quizSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedHeading === index ? 'border-yellow-400 bg-yellow-400' : 'border-white/40'
                                            }`}>
                                            {selectedHeading === index && <span className="text-black text-sm">✓</span>}
                                        </div>
                                        <span className="text-sm">{heading}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {!quizSubmitted ? (
                            <button
                                onClick={handleQuizSubmit}
                                disabled={selectedHeading === null}
                                className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                Submit Answer
                            </button>
                        ) : (
                            <div className={`mt-6 p-4 rounded-xl border-2 ${quizSubmitted ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/20'
                                }`}>
                                <div className="text-center font-bold">
                                    {quizSubmitted ? '✅ Correct! +1 Scan Progress' : '❌ Incorrect. Try again!'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Scan Another */}
                    <button
                        onClick={() => {
                            setScanResult(null);
                            setQuizSubmitted(false);
                            setSelectedHeading(null);
                        }}
                        className="w-full px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold rounded-xl transition-all"
                    >
                        📷 Scan Another Object
                    </button>
                </div>
            )}

            {/* Instructions */}
            <div className="max-w-2xl mx-auto mt-12 bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-sm text-slate-400">
                <h3 className="font-bold text-white mb-3">📚 How It Works:</h3>
                <ol className="space-y-2 list-decimal list-inside">
                    <li>Scan any real-world object (bottle, sign, book, etc.)</li>
                    <li>AI generates a 200-word IELTS reading passage about that object</li>
                    <li>Complete the heading-matching quiz</li>
                    <li>Scan 3 objects to unlock <strong className="text-purple-400">Samarkand Scholar</strong> rank</li>
                </ol>
                <p className="mt-4 italic text-xs">
                    💡 Try scanning: Pepsi bottles, street signs, phones, food packaging!
                </p>
            </div>
        </div>
    );
};

export default ArchiveScavenger;
