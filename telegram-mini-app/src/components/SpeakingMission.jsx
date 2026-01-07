import { useState } from 'react';
import { useR2Upload } from '../hooks/useR2Upload';

/**
 * SpeakingMission Component
 * Demo implementation of the Speaking Mission UI with R2 upload integration.
 */
const SpeakingMission = ({ userId = 'user_123', missionId = 'mission_speaking_01' }) => {
    const { uploadAudio, isUploading, progress, error } = useR2Upload();
    // const [isRecording, setIsRecording] = useState(false); // Unused - removed for build
    const [uploadComplete, setUploadComplete] = useState(false);

    // Mock recording stop and upload
    const handleFinishMission = async () => {
        // In a real app, this blob comes from MediaRecorder
        const mockAudioBlob = new Blob(['mock audio data'], { type: 'audio/webm' });

        try {
            setUploadComplete(false);
            const fileKey = await uploadAudio(userId, missionId, mockAudioBlob);

            // Successfully uploaded to R2

            // Notify backend that mission is ready for grading
            const finalizeRes = await fetch('/api/speaking/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, missionId, r2Key: fileKey }),
            });

            if (finalizeRes.ok) {
                setUploadComplete(true);
                // Mission finalized in D1
            } else {
                throw new Error('Failed to finalize mission');
            }

        } catch (err) {
            console.error("Mission submission failed:", err);
        }
    };

    return (
        <div className="p-8 bg-slate-900 text-white rounded-3xl max-w-md mx-auto shadow-2xl border border-slate-800">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Speaking Mission
            </h2>

            <p className="text-slate-400 mb-6">
                Describe a time you overcame a difficult challenge. You have 2 minutes.
            </p>

            {isUploading ? (
                <div className="text-center py-4">
                    <p className="mb-4 font-medium text-indigo-300 animate-pulse">
                        Transmitting to R2 Storage...
                    </p>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-3 text-sm text-slate-500 font-mono">{progress}% UPLOADED</p>
                </div>
            ) : uploadComplete ? (
                <div className="text-center py-6 bg-emerald-900/20 rounded-2xl border border-emerald-500/30">
                    <div className="text-emerald-400 text-4xl mb-2">✓</div>
                    <p className="font-bold text-emerald-400">Mission Uplinked!</p>
                    <p className="text-sm text-emerald-500/70 mt-1">Aura is now analyzing your performance.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <button
                        onClick={handleFinishMission}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                        Finish & Submit Mission
                    </button>
                    {error && <p className="text-red-400 text-sm mt-2 text-center">Error: {error}</p>}
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 uppercase tracking-widest">
                <span>Channel: Encrypted</span>
                <span>Latency: 12ms</span>
            </div>
        </div>
    );
};

export default SpeakingMission;
