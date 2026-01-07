// Uzbek Geometric Pattern Overlay Component
export default function UzbekPattern({ opacity = 0.05, variant = 'default' }) {
    const patterns = {
        default: (
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="uzbek-geometric" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        {/* Central Star */}
                        <polygon
                            points="50,20 55,45 80,45 60,60 70,85 50,70 30,85 40,60 20,45 45,45"
                            fill="#FFD700"
                            opacity={opacity * 2}
                        />
                        {/* Corner ornaments */}
                        <circle cx="10" cy="10" r="5" fill="#14B8A6" opacity={opacity} />
                        <circle cx="90" cy="10" r="5" fill="#14B8A6" opacity={opacity} />
                        <circle cx="10" cy="90" r="5" fill="#14B8A6" opacity={opacity} />
                        <circle cx="90" cy="90" r="5" fill="#14B8A6" opacity={opacity} />
                        {/* Connecting lines */}
                        <path
                            d="M 10 10 L 90 10 L 90 90 L 10 90 Z"
                            fill="none"
                            stroke="#D2691E"
                            strokeWidth="1"
                            opacity={opacity}
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#uzbek-geometric)" />
            </svg>
        ),
        samarkand: (
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="samarkand-mosaic" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                        {/* Islamic geometric pattern */}
                        <g opacity={opacity}>
                            <circle cx="60" cy="60" r="40" fill="none" stroke="#1E40AF" strokeWidth="2" />
                            <circle cx="60" cy="60" r="30" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                            <path d="M 60 20 L 60 100 M 20 60 L 100 60" stroke="#14B8A6" strokeWidth="1" />
                            <path d="M 35 35 L 85 85 M 85 35 L 35 85" stroke="#FFD700" strokeWidth="1" />
                        </g>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#samarkand-mosaic)" />
            </svg>
        ),
        registan: (
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="registan-arch" x="0" y="0" width="150" height="150" patternUnits="userSpaceOnUse">
                        <g opacity={opacity}>
                            {/* Arch shape */}
                            <path
                                d="M 30 150 L 30 80 Q 30 30, 75 30 Q 120 30, 120 80 L 120 150"
                                fill="none"
                                stroke="#D2691E"
                                strokeWidth="3"
                            />
                            <path
                                d="M 40 150 L 40 85 Q 40 45, 75 45 Q 110 45, 110 85 L 110 150"
                                fill="none"
                                stroke="#1E40AF"
                                strokeWidth="2"
                            />
                            {/* Decorative stars */}
                            <polygon points="75,60 78,68 86,68 80,73 82,81 75,76 68,81 70,73 64,68 72,68" fill="#FFD700" />
                        </g>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#registan-arch)" />
            </svg>
        )
    };

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {patterns[variant] || patterns.default}
        </div>
    );
}
