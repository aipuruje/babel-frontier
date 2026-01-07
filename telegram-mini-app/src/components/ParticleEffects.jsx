import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Particle effect component for XP gains, victories, etc.
export function ParticleEffect({ type = 'xp', value, x = 50, y = 50, onComplete }) {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        // Generate particles based on type
        const count = type === 'victory' ? 30 : type === 'levelup' ? 20 : 10;
        const newParticles = Array.from({ length: count }, (_, i) => ({
            id: i,
            x: x + (Math.random() - 0.5) * 100,
            y: y + (Math.random() - 0.5) * 100,
            vx: (Math.random() - 0.5) * 4,
            vy: -Math.random() * 6 - 2,
            size: Math.random() * 8 + 4,
            color: getParticleColor(type),
            rotation: Math.random() * 360,
            life: 1
        }));

        setParticles(newParticles);

        // Auto cleanup after animation
        const timer = setTimeout(() => {
            if (onComplete) onComplete();
        }, 2000);

        return () => clearTimeout(timer);
    }, [type, x, y, onComplete]);

    const getParticleColor = (type) => {
        switch (type) {
            case 'xp': return '#FFD700';
            case 'victory': return '#00FF00';
            case 'damage': return '#FF0000';
            case 'levelup': return '#00F2FF';
            case 'equipment': return '#BC13FE';
            default: return '#FFFFFF';
        }
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            <AnimatePresence>
                {particles.map(particle => (
                    <motion.div
                        key={particle.id}
                        className="absolute"
                        initial={{
                            x: particle.x,
                            y: particle.y,
                            scale: 1,
                            opacity: 1,
                            rotate: particle.rotation
                        }}
                        animate={{
                            x: particle.x + particle.vx * 50,
                            y: particle.y + particle.vy * 50,
                            scale: 0,
                            opacity: 0,
                            rotate: particle.rotation + 360
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 2,
                            ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                        style={{
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                            borderRadius: type === 'victory' ? '50%' : '2px',
                            boxShadow: `0 0 ${particle.size}px ${particle.color}`
                        }}
                    />
                ))}
            </AnimatePresence>

            {/* Value text (for XP) */}
            {value && (
                <motion.div
                    className="absolute text-4xl font-bold"
                    initial={{ x: x - 50, y: y - 30, opacity: 1, scale: 0.5 }}
                    animate={{ y: y - 100, opacity: 0, scale: 1.5 }}
                    transition={{ duration: 1.5 }}
                    style={{
                        color: getParticleColor(type),
                        textShadow: `0 0 20px ${getParticleColor(type)}`,
                        pointerEvents: 'none'
                    }}
                >
                    +{value}
                </motion.div>
            )}
        </div>
    );
}

// Screen flash effect for victories/defeats
export function ScreenFlash({ color = '#00FF00', duration = 0.5 }) {
    return (
        <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration }}
            style={{ backgroundColor: color }}
        />
    );
}

// Confetti burst for major achievements
export function ConfettiBurst({ x = window.innerWidth / 2, y = 0 }) {
    const confettiCount = 50;
    const colors = ['#FFD700', '#00F2FF', '#BC13FE', '#00FF00', '#FF3131'];

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {Array.from({ length: confettiCount }).map((_, i) => {
                const angle = (i / confettiCount) * Math.PI * 2;
                const velocity = 300 + Math.random() * 200;
                const endX = x + Math.cos(angle) * velocity;
                const endY = y + Math.sin(angle) * velocity + 500; // Gravity effect

                return (
                    <motion.div
                        key={i}
                        className="absolute w-3 h-3"
                        initial={{
                            x,
                            y,
                            rotate: 0,
                            opacity: 1
                        }}
                        animate={{
                            x: endX,
                            y: endY,
                            rotate: Math.random() * 720,
                            opacity: 0
                        }}
                        transition={{
                            duration: 2 + Math.random(),
                            ease: "easeOut"
                        }}
                        style={{
                            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                            borderRadius: Math.random() > 0.5 ? '50%' : '2px'
                        }}
                    />
                );
            })}
        </div>
    );
}

// Ripple effect for button clicks
export function RippleEffect({ x, y, color = '#00F2FF' }) {
    return (
        <motion.div
            className="absolute rounded-full pointer-events-none"
            initial={{
                x: x - 20,
                y: y - 20,
                width: 40,
                height: 40,
                opacity: 0.8,
                scale: 0
            }}
            animate={{
                scale: 3,
                opacity: 0
            }}
            transition={{ duration: 0.6 }}
            style={{
                border: `2px solid ${color}`,
                boxShadow: `0 0 20px ${color}`
            }}
        />
    );
}
