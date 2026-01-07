import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import UzbekPattern from './UzbekPattern';

function Home() {
    const navigate = useNavigate();

    useEffect(() => {
        // Add entrance animation
        const timer = setTimeout(() => {
            document.getElementById('hero-content')?.classList.add('animate-in');
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleStart = () => {
        navigate('/battle');
    };

    const handleProfile = () => {
        navigate('/brain-state');
    };

    return (
        <div className="min-h-screen bg-cyber-black hex-pattern relative overflow-hidden">
            {/* Uzbek Geometric Pattern */}
            <UzbekPattern variant="samarkand" opacity={0.08} />

            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 left-10 w-64 h-64 bg-uzbek-saffron rounded-full filter blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-uzbek-lapis rounded-full filter blur-[120px] animate-pulse-slow"></div>
            </div>

            {/* Scan line effect */}
            <div className="scan-line absolute inset-0 pointer-events-none"></div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
                <div id="hero-content" className="text-center space-y-8 opacity-0 transition-all duration-1000 ease-out">
                    {/* Logo/Title */}
                    <div className="space-y-4">
                        <h1 className="font-orbitron font-black text-6xl md:text-8xl gradient-text text-shadow-glow">
                            SYNAPSE
                        </h1>
                        <div className="flex items-center justify-center gap-3">
                            <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-cyber-gold to-transparent"></div>
                            <p className="font-rajdhani text-cyber-gold-light text-xl md:text-2xl tracking-widest uppercase">
                                Telegram Mini App
                            </p>
                            <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-cyber-gold to-transparent"></div>
                        </div>
                    </div>

                    {/* Description */}
                    <p className="font-rajdhani text-gray-300 text-lg md:text-xl max-w-md mx-auto leading-relaxed">
                        Master all 4 IELTS skills through epic Uzbek-themed missions
                    </p>

                    {/* 4 Skills Grid */}
                    <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                        {/* Speaking */}
                        <button
                            onClick={() => navigate('/battle')}
                            className="group relative p-4 bg-gradient-to-br from-purple-900/40 to-purple-700/40
                                border-2 border-purple-500
                                rounded-xl transition-all duration-300
                                hover:scale-105 hover:shadow-xl hover:shadow-purple-500/30
                                active:scale-95"
                        >
                            <div className="text-4xl mb-2">🎤</div>
                            <div className="font-bold text-white text-sm">Speaking</div>
                            <div className="text-[10px] text-purple-300">Battle Arena (Gapirish)</div>
                        </button>

                        {/* Listening */}
                        <button
                            onClick={() => navigate('/listening')}
                            className="group relative p-4 bg-gradient-to-br from-cyan-900/40 to-cyan-700/40
                                border-2 border-cyan-500
                                rounded-xl transition-all duration-300
                                hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/30
                                active:scale-95"
                        >
                            <div className="text-4xl mb-2">👂</div>
                            <div className="font-bold text-white text-sm">Listening</div>
                            <div className="text-[10px] text-cyan-300">Spy Wiretap (Tinglash)</div>
                        </button>

                        {/* Reading */}
                        <button
                            onClick={() => navigate('/reading')}
                            className="group relative p-4 bg-gradient-to-br from-green-900/40 to-green-700/40
                                border-2 border-green-500
                                rounded-xl transition-all duration-300
                                hover:scale-105 hover:shadow-xl hover:shadow-green-500/30
                                active:scale-95"
                        >
                            <div className="text-4xl mb-2">📖</div>
                            <div className="font-bold text-white text-sm">Reading</div>
                            <div className="text-[10px] text-green-300">The Archive (O'qish)</div>
                        </button>

                        {/* Writing */}
                        <button
                            onClick={() => navigate('/writing')}
                            className="group relative p-4 bg-gradient-to-br from-orange-900/40 to-orange-700/40
                                border-2 border-orange-500
                                rounded-xl transition-all duration-300
                                hover:scale-105 hover:shadow-xl hover:shadow-orange-500/30
                                active:scale-95"
                        >
                            <div className="text-4xl mb-2">✍️</div>
                            <div className="font-bold text-white text-sm">Writing</div>
                            <div className="text-[10px] text-orange-300">Citadel (Yozish)</div>
                        </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex flex-col gap-3 w-full max-w-md">
                        <button
                            onClick={handleProfile}
                            className="group relative px-8 py-3 bg-gradient-to-r from-cyber-gold via-uzbek-saffron to-cyber-gold-dark
                                 font-orbitron font-bold text-cyber-black text-sm uppercase tracking-wider
                                 cyber-border cyber-glow rounded-lg
                                 transition-all duration-300 ease-out
                                 hover:scale-105 hover:shadow-2xl
                                 active:scale-95"
                        >
                            <span className="relative z-10">🧠 Brain State</span>
                        </button>

                        <button
                            onClick={() => navigate('/equipment')}
                            className="group relative px-8 py-3 bg-transparent
                                 font-orbitron font-semibold text-uzbek-terracotta text-sm uppercase tracking-wider
                                 border-2 border-uzbek-terracotta
                                 transition-all duration-300 ease-out
                                 hover:bg-uzbek-terracotta/10 hover:scale-105
                                 active:scale-95 rounded-lg"
                        >
                            <span className="relative z-10">⚔️ Equipment Vault</span>
                        </button>

                        <button
                            onClick={() => navigate('/boss')}
                            className="group relative px-8 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600
                                 font-orbitron font-bold text-white text-sm uppercase tracking-wider
                                 border-2 border-purple-400
                                 transition-all duration-300 ease-out
                                 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50
                                 active:scale-95 rounded-lg animate-pulse"
                        >
                            <span className="relative z-10">👻 BOSS BATTLE</span>
                        </button>

                        {/* Week 2: Marketplace */}
                        <button
                            onClick={() => navigate('/marketplace')}
                            className="group relative px-8 py-3 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600
                                 font-orbitron font-bold text-white text-sm uppercase tracking-wider
                                 border-2 border-emerald-400
                                 transition-all duration-300 ease-out
                                 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/50
                                 active:scale-95 rounded-lg"
                        >
                            <span className="relative z-10">🏪 Grand Bazaar</span>
                        </button>

                        {/* Week 2: Writing Foundry */}
                        <button
                            onClick={() => navigate('/writing-foundry')}
                            className="group relative px-8 py-3 bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600
                                 font-orbitron font-bold text-white text-sm uppercase tracking-wider
                                 border-2 border-yellow-400
                                 transition-all duration-300 ease-out
                                 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/50
                                 active:scale-95 rounded-lg"
                        >
                            <span className="relative z-10">✍️ Writing Foundry</span>
                        </button>

                        {/* Week 2: Regional Map */}
                        <button
                            onClick={() => navigate('/regional-map')}
                            className="group relative px-8 py-3 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600
                                 font-orbitron font-bold text-white text-sm uppercase tracking-wider
                                 border-2 border-teal-400
                                 transition-all duration-300 ease-out
                                 hover:scale-105 hover:shadow-2xl hover:shadow-teal-500/50
                                 active:scale-95 rounded-lg"
                        >
                            <span className="relative z-10">🗺️ Neo-Uzbekistan Map</span>
                        </button>
                    </div>

                    {/* Tech details */}
                    <div className="pt-8 flex flex-wrap justify-center gap-6 text-sm font-rajdhani text-cyber-gold-light">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-cyber-cyan animate-pulse"></div>
                            <span>NEURAL LINK ACTIVE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-cyber-gold animate-pulse"></div>
                            <span>VOICE COMBAT READY</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom hexagonal pattern */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyber-gray-900 to-transparent"></div>
        </div>
    );
}

// Add animation class
const style = document.createElement('style');
style.textContent = `
  .animate-in {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
  
  #hero-content {
    transform: translateY(30px);
  }
`;
document.head.appendChild(style);

export default Home;
