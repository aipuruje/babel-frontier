import { useState, useEffect } from 'react';

/**
 * Recollection Flashback
 * Shows the original context where a buffered phrase was encountered
 */
export default function RecollectionFlashback({ bufferId, onClose }) {
    const [flashbackData, setFlashbackData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!bufferId) return;

        const fetchFlashback = async () => {
            try {
                const response = await fetch('/api/golden-thread/flashback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ buffer_id: bufferId })
                });
                const data = await response.json();
                setFlashbackData(data.flashback);
            } catch (error) {
                console.error('Failed to fetch flashback:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFlashback();
    }, [bufferId]);

    if (!bufferId) return null;
    if (loading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!flashbackData) {
        return null;
    }

    // Highlight the target phrase in the original sentence
    const highlightPhrase = (text, phrase) => {
        const regex = new RegExp(`(${phrase})`, 'gi');
        return text.split(regex).map((part, index) =>
            regex.test(part)
                ? <span key={index} className="bg-yellow-400/30 text-yellow-200 font-bold px-1 rounded">{part}</span>
                : part
        );
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="relative max-w-2xl w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="text-center">
                        <div className="text-yellow-400 text-sm uppercase tracking-wider mb-2">
                            ✨ Recollection Flashback
                        </div>
                        <div className="text-2xl font-bold text-white">
                            "{flashbackData.phrase}"
                        </div>
                        <div className="text-sm text-gray-400 mt-2">
                            Band {flashbackData.band_value} • Learned {new Date(flashbackData.learned_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Source Title */}
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>From: {flashbackData.source_title}</span>
                    </div>

                    {/* Original Context (highlighted) */}
                    <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-500/20">
                        <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                            Original Context
                        </div>
                        <div className="text-gray-200 leading-relaxed">
                            {highlightPhrase(flashbackData.original_sentence, flashbackData.phrase)}
                        </div>
                    </div>

                    {/* AI Mentor Message */}
                    <div className="relative p-4 bg-gradient-to-r from-purple-800/20 to-blue-800/20 rounded-lg border border-purple-500/30">
                        {/* Avatar placeholder */}
                        <div className="absolute -top-3 left-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl">
                            🧙
                        </div>

                        <div className="ml-14">
                            <div className="text-xs text-purple-400 mb-1 font-semibold">AI Mentor</div>
                            <div className="text-sm text-gray-300 leading-relaxed">
                                {flashbackData.mentor_message}
                            </div>
                        </div>
                    </div>

                    {/* Call to Action */}
                    <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="text-yellow-400 font-bold mb-1">
                            💥 Deploy This Phrase to Deal Critical Damage!
                        </div>
                        <div className="text-xs text-gray-400">
                            Use it in your response to defeat the boss
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-900/50 border-t border-gray-700 text-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium"
                    >
                        Got it! Let's battle
                    </button>
                </div>
            </div>
        </div>
    );
}
