// Audio feedback system for Babel Frontier
class AudioManager {
    constructor() {
        this.enabled = true;
        this.volume = 0.5;

        // Audio context for Web Audio API
        this.audioContext = null;
        this.sounds = {};

        this.init();
    }

    init() {
        // Initialize on user interaction (required by browsers)
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }

    // Generate sounds using Web Audio API (no external files needed)
    playSuccess() {
        if (!this.enabled || !this.audioContext) return;

        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5

        gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
    }

    playFailure() {
        if (!this.enabled || !this.audioContext) return;

        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4
        oscillator.frequency.setValueAtTime(349.23, ctx.currentTime + 0.1); // F4
        oscillator.frequency.setValueAtTime(261.63, ctx.currentTime + 0.2); // C4

        gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
    }

    playXPGain() {
        if (!this.enabled || !this.audioContext) return;

        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    }

    playLevelUp() {
        if (!this.enabled || !this.audioContext) return;

        const ctx = this.audioContext;

        // Ascending arpeggio
        [261.63, 329.63, 392.00, 523.25].forEach((freq, i) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
            gainNode.gain.setValueAtTime(this.volume * 0.4, ctx.currentTime + i * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);

            oscillator.start(ctx.currentTime + i * 0.1);
            oscillator.stop(ctx.currentTime + i * 0.1 + 0.3);
        });
    }

    playBossDamage() {
        if (!this.enabled || !this.audioContext) return;

        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.2);

        gainNode.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    }

    playClick() {
        if (!this.enabled || !this.audioContext) return;

        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
        gainNode.gain.setValueAtTime(this.volume * 0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Create singleton instance
const audioManager = new AudioManager();

export default audioManager;
