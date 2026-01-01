import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function Profile() {
    const navigate = useNavigate();
    const [bandScore] = useState(4.0);
    const [animateScore, setAnimateScore] = useState(false);

    useEffect(() => {
        // Animate score on mount
        const timer = setTimeout(() => {
            setAnimateScore(true);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const getScoreColor = (score) => {
        if (score >= 7.0) return 'text-green-400';
        if (score >= 5.5) return 'text-yellow-400';
        return 'text-cyber-gold';
    };

    const getProgressPercentage = (score) => {
        return (score / 9.0) * 100;
    };

    return (
        <div className="min-h-screen bg-cyber-black hex-pattern relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-20 right-10 w-72 h-72 bg-cyber-gold rounded-full filter blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-20 left-10 w-64 h-64 bg-cyber-cyan-dark rounded-full filter blur-[100px] animate-pulse-slow"></div>
            </div>

            {/* Scan line */}
            <div className="scan-line absolute inset-0 pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 pt-8 px-6">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-cyber-gold hover:text-cyber-gold-light transition-colors group"
                >
                    <svg
                        className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="font-rajdhani font-semibold uppercase tracking-wider">Back</span>
                </button>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-6 py-12">
                <div className="w-full max-w-md space-y-8">
                    {/* Profile Header */}
                    <div className="text-center space-y-3">
                        <h1 className="font-orbitron font-bold text-4xl gradient-text text-shadow-glow">
                            PROFILE DATA
                        </h1>
                        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyber-gold to-transparent"></div>
                    </div>

                    {/* Score Card */}
                    <div className="cyber-border bg-cyber-gray-900/50 backdrop-blur-sm p-8 relative">
                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-cyan"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-cyan"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-cyan"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-cyan"></div>

                        <div className="space-y-6">
                            {/* Score Display */}
                            <div className="text-center space-y-4">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 bg-cyber-cyan animate-pulse"></div>
                                    <p className="font-rajdhani text-cyber-gold-light uppercase tracking-widest text-sm">
                                        Band Score
                                    </p>
                                    <div className="w-2 h-2 bg-cyber-cyan animate-pulse"></div>
                                </div>

                                <div className={`font-orbitron font-black text-8xl ${getScoreColor(bandScore)} 
                              ${animateScore ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
                              transition-all duration-700 ease-out text-shadow-glow`}>
                                    {bandScore.toFixed(1)}
                                </div>

                                <p className="font-rajdhani text-gray-400 text-sm">
                                    OUT OF 9.0
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="h-3 bg-cyber-black cyber-border relative overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-cyber-gold-dark via-cyber-gold to-cyber-gold-light
                             cyber-glow transition-all duration-1000 ease-out relative"
                                        style={{ width: animateScore ? `${getProgressPercentage(bandScore)}%` : '0%' }}
                                    >
                                        {/* Animated shine effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between font-rajdhani text-xs text-cyber-gold-light">
                                    <span>BEGINNER</span>
                                    <span>INTERMEDIATE</span>
                                    <span>EXPERT</span>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="cyber-border bg-cyber-black/50 p-4 text-center">
                                    <p className="font-rajdhani text-cyber-cyan text-xs uppercase tracking-wider mb-1">Rank</p>
                                    <p className="font-orbitron text-2xl font-bold text-white">#156</p>
                                </div>
                                <div className="cyber-border bg-cyber-black/50 p-4 text-center">
                                    <p className="font-rajdhani text-cyber-cyan text-xs uppercase tracking-wider mb-1">Level</p>
                                    <p className="font-orbitron text-2xl font-bold text-white">12</p>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button className="w-full py-3 bg-gradient-to-r from-cyber-gold via-cyber-gold-light to-cyber-gold-dark 
                               font-orbitron font-bold text-cyber-black uppercase tracking-wider
                               cyber-glow hover:scale-[1.02] active:scale-95
                               transition-all duration-300">
                                Continue Training
                            </button>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex justify-center gap-6 text-xs font-rajdhani text-cyber-gold-light">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-400 animate-pulse"></div>
                            <span>SYNC: ACTIVE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-cyber-gold animate-pulse"></div>
                            <span>STATUS: ONLINE</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
