import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const OraclesSeal = () => {
    const [prediction, setPrediction] = useState(null);
    const [weaknesses, setWeaknesses] = useState(null);
    const [vocabulary, setVocabulary] = useState([]);
    const [seal, setSeal] = useState(null);
    const [examBookingForm, setExamBookingForm] = useState({
        examDate: '',
        testCenter: 'British Council Tashkent'
    });
    const [bookingConfirmed, setBookingConfirmed] = useState(false);

    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo_user';

    useEffect(() => {
        loadPrediction();
        loadWeaknesses();
        loadVocabulary();
    }, []);

    const loadPrediction = async () => {
        try {
            const response = await fetch(`/api/oracle/predict/${userId}`);
            const data = await response.json();

            if (data.prediction) {
                setPrediction(data.prediction);
            }
        } catch (error) {
            console.error('Load prediction error:', error);
        }
    };

    const loadWeaknesses = async () => {
        try {
            const response = await fetch(`/api/oracle/weaknesses/${userId}`);
            const data = await response.json();
            setWeaknesses(data.weaknesses);
        } catch (error) {
            console.error('Load weaknesses error:', error);
        }
    };

    const loadVocabulary = async () => {
        try {
            const response = await fetch(`/api/oracle/vocabulary-rec?user_id=${userId}`);
            const data = await response.json();
            setVocabulary(data.vocabulary || []);
        } catch (error) {
            console.error('Load vocabulary error:', error);
        }
    };

    const generateSeal = async () => {
        try {
            const response = await fetch(`/api/oracle/seal/${userId}`);
            const data = await response.json();
            setSeal(data.seal);
        } catch (error) {
            console.error('Generate seal error:', error);
        }
    };

    const bookExam = async () => {
        try {
            const response = await fetch('/api/oracle/book-exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    examDate: examBookingForm.examDate,
                    testCenter: examBookingForm.testCenter
                })
            });

            const data = await response.json();
            if (response.ok) {
                setBookingConfirmed(true);
                alert(`Exam booked! Reference: ${data.booking_id}`);
            }
        } catch (error) {
            console.error('Book exam error:', error);
        }
    };

    // Mock trajectory data for chart
    const trajectoryData = prediction ? [
        { day: 'Day 1', band: prediction.currentBand - 0.5 },
        { day: 'Day 5', band: prediction.currentBand - 0.3 },
        { day: 'Day 10', band: prediction.currentBand - 0.1 },
        { day: 'Today', band: prediction.currentBand },
        { day: `+${Math.floor(prediction.daysToTarget / 3)}d`, band: prediction.currentBand + (prediction.targetBand - prediction.currentBand) * 0.33 },
        { day: `+${Math.floor(prediction.daysToTarget * 2 / 3)}d`, band: prediction.currentBand + (prediction.targetBand - prediction.currentBand) * 0.66 },
        { day: 'Target', band: prediction.targetBand }
    ] : [];

    const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];

    if (!prediction) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Consulting the Oracle...</p>
                    <p className="text-xs text-slate-500 mt-2">Analyzing 20 days of performance data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-6">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="text-8xl mb-4">🔮</div>
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                    The Oracle's Seal
                </h1>
                <p className="text-slate-300 text-lg">
                    Your destiny revealed through predictive mastery
                </p>
            </div>

            {/* Main Prediction */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-lg rounded-3xl p-12 border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/20">
                    <div className="text-center">
                        <div className="text-sm font-bold text-yellow-300 mb-4">🔮 ORACLE'S PROPHECY</div>
                        <h2 className="text-4xl font-bold mb-6">
                            You will reach Band <span className="text-yellow-400">{prediction.targetBand}</span> on
                        </h2>
                        <div className="text-7xl font-bold text-yellow-400 mb-6">
                            {new Date(prediction.predictedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-xl text-slate-300 mb-2">
                            {prediction.daysToTarget} days from now • {prediction.confidencePct}% confidence*
                        </div>
                        <div className="text-xs text-slate-500 italic mb-8">
                            *This is a statistical projection based on your current trajectory. Actual exam results may vary due to test-day conditions.
                        </div>

                        {/* Confidence Bar */}
                        <div className="max-w-md mx-auto mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-400">Prediction Confidence</span>
                                <span className="text-sm font-bold text-yellow-400">{prediction.confidencePct}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                                    style={{ width: `${prediction.confidencePct}%` }}
                                />
                            </div>
                        </div>

                        {/* Current Status */}
                        <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
                            <div className="bg-white/10 rounded-xl p-4">
                                <div className="text-sm text-slate-400 mb-1">Current Band</div>
                                <div className="text-3xl font-bold text-blue-400">{prediction.currentBand}</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <div className="text-sm text-slate-400 mb-1">Target Band</div>
                                <div className="text-3xl font-bold text-yellow-400">{prediction.targetBand}</div>
                            </div>
                            <div className="bg-white/10 rounded-xl p-4">
                                <div className="text-sm text-slate-400 mb-1">Growth Rate</div>
                                <div className="text-3xl font-bold text-green-400">+{prediction.improvementRate}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trajectory Chart */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span>📈</span> Performance Trajectory
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trajectoryData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="day" stroke="#94A3B8" />
                            <YAxis domain={[4, 9]} stroke="#94A3B8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                labelStyle={{ color: '#F1F5F9' }}
                            />
                            <Line type="monotone" dataKey="band" stroke="#FBBF24" strokeWidth={3} dot={{ fill: '#FBBF24', r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Weaknesses Analysis */}
                {weaknesses && (
                    <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <span>⚠️</span> Weakness Analysis
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(weaknesses).map(([key, data]) => (
                                <div key={key}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold capitalize">{data.label}</span>
                                        <span className={`text-sm font-bold ${data.score >= 7 ? 'text-green-400' :
                                            data.score >= 5 ? 'text-yellow-400' :
                                                'text-red-400'
                                            }`}>{data.score}/9</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${data.score >= 7 ? 'bg-green-500' :
                                                data.score >= 5 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`}
                                            style={{ width: `${(data.score / 9) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                            <div className="text-sm font-bold text-red-300 mb-1">🎯 Priority Focus:</div>
                            <div className="text-lg font-bold capitalize">{prediction.weakestArea}</div>
                        </div>
                    </div>
                )}

                {/* Vocabulary Recommendations */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span>📚</span> Essential Vocabulary
                    </h3>
                    <div className="text-sm text-slate-400 mb-4">
                        Master these {vocabulary.length} words to stay on track:
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {vocabulary.map((word, index) => (
                            <div key={index} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all">
                                <div className="font-bold text-purple-300">{word.word}</div>
                                <div className="text-xs text-slate-400 mt-1">{word.definition}</div>
                                <div className="text-xs text-slate-500 italic mt-1">"{word.example}"</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Exam Booking */}
            {!bookingConfirmed ? (
                <div className="max-w-3xl mx-auto mb-8">
                    <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 backdrop-blur-lg rounded-2xl p-8 border-2 border-green-500/50">
                        <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <span>📅</span> Book Your Official IELTS Exam
                        </h3>
                        <p className="text-slate-300 mb-6">
                            Based on your predicted readiness date, we recommend booking for <strong className="text-yellow-400">{prediction.predictedDate}</strong> or later.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-300 mb-2">Exam Date</label>
                                <input
                                    type="date"
                                    value={examBookingForm.examDate}
                                    onChange={(e) => setExamBookingForm({ ...examBookingForm, examDate: e.target.value })}
                                    min={prediction.predictedDate}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-300 mb-2">Test Center</label>
                                <select
                                    value={examBookingForm.testCenter}
                                    onChange={(e) => setExamBookingForm({ ...examBookingForm, testCenter: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                                >
                                    <option value="British Council Tashkent">British Council Tashkent</option>
                                    <option value="IDP Tashkent">IDP Tashkent</option>
                                    <option value="British Council Samarkand">British Council Samarkand</option>
                                </select>
                            </div>

                            <button
                                onClick={bookExam}
                                disabled={!examBookingForm.examDate}
                                className="w-full px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 font-bold rounded-xl text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                📝 Book Exam (2,500,000 UZS)
                            </button>

                            <div className="text-xs text-slate-500 text-center">
                                Mock booking for demo. In production, integrates with British Council/IDP.
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto mb-8 bg-green-500/20 border-2 border-green-500 rounded-2xl p-8 text-center">
                    <div className="text-7xl mb-4">✅</div>
                    <h3 className="text-3xl font-bold mb-2">Exam Booked Successfully!</h3>
                    <p className="text-slate-300">You'll receive confirmation via Telegram</p>
                </div>
            )}

            {/* Readiness Seal */}
            {!seal ? (
                <div className="max-w-3xl mx-auto text-center">
                    <button
                        onClick={generateSeal}
                        className="px-12 py-5 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 hover:from-purple-400 hover:via-pink-400 hover:to-yellow-400 font-bold rounded-2xl text-xl shadow-2xl shadow-purple-500/50 transition-all transform hover:scale-105"
                    >
                        🏆 Generate Certified Readiness Seal
                    </button>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto">
                    <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 backdrop-blur-lg rounded-2xl p-8 border-2 border-yellow-500/50 text-center">
                        <div className="text-7xl mb-4">🏆</div>
                        <h3 className="text-3xl font-bold mb-4">Readiness Forecast</h3>
                        <div className="font-mono text-sm text-yellow-300 mb-6">{seal.seal_number}</div>

                        <div className="bg-white/10 rounded-xl p-6 mb-6">
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div>
                                    <div className="text-xs text-slate-400">Current Band</div>
                                    <div className="text-2xl font-bold">{seal.current_band}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400">Predicted Band</div>
                                    <div className="text-2xl font-bold text-yellow-400">{seal.predicted_band}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400">Readiness</div>
                                    <div className="text-2xl font-bold text-green-400">{seal.readiness_percentage}%</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400">Confidence</div>
                                    <div className="text-2xl font-bold text-purple-400">{seal.confidence}%</div>
                                </div>
                            </div>
                        </div>

                        <button className="w-full px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 font-bold rounded-xl transition-all">
                            📥 Download Report (PDF)
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OraclesSeal;
