import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

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
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-10 left-10 w-64 h-64 bg-cyber-gold rounded-full filter blur-[100px] animate-pulse-slow"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyber-cyan rounded-full filter blur-[120px] animate-pulse-slow"></div>
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
                        Enter the cyberpunk realm. Track your progress, level up your skills, and dominate the leaderboard.
                    </p>

                    {/* Start Button */}
                    <div className="flex flex-col gap-4 w-full max-w-sm">
                        <button
                            onClick={handleStart}
                            className="group relative px-12 py-4 bg-gradient-to-r from-cyber-gold via-cyber-gold-light to-cyber-gold-dark 
                         font-orbitron font-bold text-cyber-black text-lg uppercase tracking-wider
                         cyber-border cyber-glow rounded-none
                         transition-all duration-300 ease-out
                         hover:scale-105 hover:shadow-2xl
                         active:scale-95
                         animate-glow"
                        >
                            <span className="relative z-10">Start Battle</span>

                            {/* Button corner accents */}
                            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyber-cyan"></div>
                            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyber-cyan"></div>
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyber-cyan"></div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyber-cyan"></div>
                        </button>

                        <button
                            onClick={handleProfile}
                            className="group relative px-12 py-3 bg-transparent
                         font-orbitron font-semibold text-cyber-gold text-base uppercase tracking-wider
                         cyber-border
                         transition-all duration-300 ease-out
                         hover:bg-cyber-gold/10 hover:scale-105
                         active:scale-95"
                        >
                            <span className="relative z-10">Brain State</span>
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
                            <span>SYSTEM ONLINE</span>
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
