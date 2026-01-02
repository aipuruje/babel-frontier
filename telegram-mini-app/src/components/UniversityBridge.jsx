import { useState, useEffect } from 'react';

const UniversityBridge = () => {
    const [embassyMission, setEmbassyMission] = useState(null);
    const [partners, setPartners] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [consultationForm, setConsultationForm] = useState({
        date: '',
        notes: ''
    });
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo_user';
    const userName = window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || 'Student';

    useEffect(() => {
        // Check if user qualifies for Embassy Mission (Band 7.5+)
        checkEmbassyEligibility();
        loadPartners();
    }, []);

    const checkEmbassyEligibility = async () => {
        try {
            const response = await fetch(`/api/user/${userId}`);
            const userData = await response.json();

            if (userData.speaking_band >= 7.5) {
                setEmbassyMission({
                    triggered: true,
                    bandScore: userData.speaking_band
                });
            }
        } catch (error) {
            console.error('Check eligibility error:', error);
        }
    };

    const loadPartners = async () => {
        try {
            // Mock partners - in production, fetch from /api/b2b/partners/list
            setPartners([
                {
                    id: 1,
                    name: 'Cambridge International College',
                    nameUz: 'Kembrij Xalqaro Kolleji',
                    country: 'UK',
                    logo: '🎓',
                    offer: 'Up to 50% scholarship for Band 7.5+ students'
                },
                {
                    id: 2,
                    name: 'Westminster University Tashkent',
                    nameUz: 'Vestminster Universiteti Toshkent',
                    country: 'UZ',
                    logo: '🏛️',
                    offer: 'Full scholarship opportunities available'
                },
                {
                    id: 3,
                    name: 'American University of Central Asia',
                    nameUz: 'Markaziy Osiyo Amerika Universiteti',
                    country: 'US',
                    logo: '🦅',
                    offer: 'Priority admission for high scorers'
                }
            ]);
        } catch (error) {
            console.error('Load partners error:', error);
        }
    };

    const handleBookConsultation = async (partnerId) => {
        try {
            const response = await fetch('/api/b2b/consultation/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    partnerId,
                    consultationDate: consultationForm.date,
                    studentNotes: consultationForm.notes || 'Interested in admission opportunities'
                })
            });

            if (response.ok) {
                setBookingSuccess(true);
                setSelectedPartner(null);
                setTimeout(() => setBookingSuccess(false), 5000);
            }

        } catch (error) {
            console.error('Booking error:', error);
            alert('Failed to book consultation. Please try again.');
        }
    };

    if (!embassyMission?.triggered) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-6 flex items-center justify-center">
                <div className="max-w-2xl text-center">
                    <span className="text-8xl mb-6 block">🏰</span>
                    <h2 className="text-3xl font-bold mb-4">Embassy Mission Locked</h2>
                    <p className="text-slate-300 text-lg mb-6">
                        Reach Band 7.5+ to unlock exclusive university partnerships and scholarship opportunities.
                    </p>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
                        <div className="text-sm text-slate-400 mb-2">Your Current Band:</div>
                        <div className="text-4xl font-bold text-blue-400">6.5</div>
                        <div className="text-xs text-slate-500 mt-2">Keep practicing to unlock!</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-6">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="text-7xl mb-4">🏛️</div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Embassy Mission Unlocked!
                </h1>
                <p className="text-slate-300 text-lg">
                    Your Band {embassyMission.bandScore} qualifies you for exclusive university partnerships
                </p>
            </div>

            {/* Success Message */}
            {bookingSuccess && (
                <div className="max-w-3xl mx-auto mb-8 bg-green-500/20 border-2 border-green-500 rounded-2xl p-6 animate-pulse">
                    <div className="text-center">
                        <span className="text-5xl block mb-3">✅</span>
                        <div className="text-xl font-bold">Consultation Booked Successfully!</div>
                        <div className="text-sm text-slate-300 mt-2">The university will contact you via Telegram</div>
                    </div>
                </div>
            )}

            {/* University Partners */}
            <div className="max-w-5xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span>🎓</span> Guild Partners (Universities)
                </h2>

                {partners.map(partner => (
                    <div key={partner.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-yellow-400/50 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <span className="text-5xl">{partner.logo}</span>
                                <div>
                                    <h3 className="text-2xl  font-bold">{partner.name}</h3>
                                    <div className="text-sm text-slate-300">{partner.nameUz}</div>
                                    <div className="text-xs text-purple-300 mt-1">📍 {partner.country}</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-4 mb-4">
                            <div className="text-xs font-bold text-yellow-300 mb-1">🎁 EXCLUSIVE OFFER</div>
                            <div className="font-bold">{partner.offer}</div>
                        </div>

                        {selectedPartner === partner.id ? (
                            <div className="bg-slate-900/50 rounded-xl p-6 border border-white/20">
                                <h4 className="font-bold mb-4">📅 Book Scholarship Consultation</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-2">Preferred Date & Time</label>
                                        <input
                                            type="datetime-local"
                                            value={consultationForm.date}
                                            onChange={(e) => setConsultationForm({ ...consultationForm, date: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-2">Your Questions (Optional)</label>
                                        <textarea
                                            value={consultationForm.notes}
                                            onChange={(e) => setConsultationForm({ ...consultationForm, notes: e.target.value })}
                                            placeholder="e.g., Interested in Computer Science programs..."
                                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white resize-none"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleBookConsultation(partner.id)}
                                            disabled={!consultationForm.date}
                                            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ✅ Confirm Booking
                                        </button>
                                        <button
                                            onClick={() => setSelectedPartner(null)}
                                            className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 font-bold rounded-xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setSelectedPartner(partner.id)}
                                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 font-bold rounded-xl shadow-lg transform hover:scale-105 transition-all"
                            >
                                📞 Book Free Consultation
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* How It Works */}
            <div className="max-w-3xl mx-auto mt-12 bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-sm text-slate-400">
                <h3 className="font-bold text-white mb-3">🎯 How Embassy Missions Work:</h3>
                <ol className="space-y-2 list-decimal list-inside">
                    <li>You reached Band 7.5+ – universities now see you as a qualified candidate</li>
                    <li>Book a free consultation with partner universities</li>
                    <li>Discuss scholarship opportunities and admission requirements</li>
                    <li>Universities pay placement fees to Babel Frontier for connecting high-achieving students</li>
                </ol>
                <p className="mt-4 italic text-xs">
                    💡 This service is 100% free for students. Universities cover all costs.
                </p>
            </div>
        </div>
    );
};

export default UniversityBridge;
