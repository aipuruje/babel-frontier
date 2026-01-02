import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ZenGarden = () => {
    const navigate = useNavigate();
    const [breathText, setBreathText] = useState("Breathe In...");

    useEffect(() => {
        const interval = setInterval(() => {
            setBreathText(prev => prev === "Breathe In..." ? "Breathe Out..." : "Breathe In...");
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-teal-900 to-emerald-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-10 left-10 text-9xl animate-pulse">🍃</div>
                <div className="absolute bottom-20 right-20 text-9xl animate-pulse" style={{ animationDelay: '2s' }}>🎋</div>
            </div>

            <h1 className="text-4xl font-bold text-emerald-100 mb-12 relative z-10 text-center">
                Garden of Samarkand
            </h1>

            {/* Breathing Circle */}
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 1, 0.7],
                    rotate: [0, 180, 360]
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="w-64 h-64 rounded-full bg-gradient-to-tr from-emerald-400/30 to-teal-400/30 backdrop-blur-md border border-emerald-300/50 flex items-center justify-center mb-12 shadow-[0_0_50px_rgba(52,211,153,0.3)]"
            >
                <span className="text-2xl font-light text-white tracking-widest uppercase">
                    {breathText}
                </span>
            </motion.div>

            <div className="text-center max-w-md text-emerald-200/80 mb-12 relative z-10">
                "Even the mightiest warrior sets down their sword. Let your mind rest, Alisher."
            </div>

            <button
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white transition-all backdrop-blur-sm z-10"
            >
                Return to the Citadel
            </button>
        </div>
    );
};

export default ZenGarden;
