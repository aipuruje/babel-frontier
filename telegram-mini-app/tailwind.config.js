/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          gold: '#FFD700',
          'gold-light': '#FFA500',
          'gold-dark': '#FF8C00',
          black: '#0a0a0a',
          'gray-900': '#1a1a1a',
          'gray-800': '#2a2a2a',
          cyan: '#00ffff',
          'cyan-dark': '#00d4d4',
        },
        uzbek: {
          terracotta: '#D2691E',
          'terracotta-light': '#E88643',
          'terracotta-dark': '#B8551A',
          lapis: '#1E40AF',
          'lapis-light': '#3B82F6',
          'lapis-dark': '#1E3A8A',
          saffron: '#F59E0B',
          'saffron-light': '#FBBF24',
          turquoise: '#14B8A6',
          'silk-cream': '#FAF8F3',
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        arabic: ['Amiri', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 8s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': {
            boxShadow: '0 0 5px #FFD700, 0 0 10px #FFD700, 0 0 15px #FFD700',
          },
          '100%': {
            boxShadow: '0 0 10px #FFD700, 0 0 20px #FFD700, 0 0 30px #FFD700, 0 0 40px #FFA500',
          },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
}
