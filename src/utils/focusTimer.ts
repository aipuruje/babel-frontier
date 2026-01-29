/**
 * Focus Timer Utility
 * Tracks continuous focus time and triggers break reminders at 20 and 40 minutes
 * Based on research: teens/young adults optimal focus is 20-45 min with breaks
 */

export class FocusTimer {
    private startTime: number = 0;
    private intervalId: number | null = null;
    private reminderIntervals: Set<number> = new Set();
    private onBreakReminderCallback: ((minutes: number) => void) | null = null;
    private onTickCallback: ((elapsed: number) => void) | null = null;

    constructor(
        onBreakReminder?: (minutes: number) => void,
        onTick?: (elapsed: number) => void
    ) {
        this.onBreakReminderCallback = onBreakReminder || null;
        this.onTickCallback = onTick || null;
    }

    /**
     * Start the focus timer
     */
    start(reminderIntervals: number[] = [20, 40]): void {
        if (this.intervalId !== null) {
            console.warn('Timer already running');
            return;
        }

        this.startTime = Date.now();
        this.reminderIntervals = new Set(reminderIntervals);

        // Check every second
        this.intervalId = window.setInterval(() => {
            const elapsed = this.getElapsedMinutes();

            // Trigger tick callback
            if (this.onTickCallback) {
                this.onTickCallback(elapsed);
            }

            // Check if we've hit a reminder interval
            this.reminderIntervals.forEach(interval => {
                const prevElapsed = Math.floor(elapsed - (1 / 60)); // Previous second
                const currentElapsed = Math.floor(elapsed);

                // Trigger reminder when we cross the interval threshold
                if (prevElapsed < interval && currentElapsed >= interval) {
                    this.triggerReminder(interval);
                }
            });
        }, 1000);
    }

    /**
     * Stop the timer
     */
    stop(): number {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        return this.getElapsedMinutes();
    }

    /**
     * Reset the timer
     */
    reset(): void {
        this.stop();
        this.startTime = 0;
    }

    /**
     * Get elapsed time in minutes
     */
    getElapsedMinutes(): number {
        if (this.startTime === 0) return 0;
        return (Date.now() - this.startTime) / (1000 * 60);
    }

    /**
     * Get elapsed time formatted as MM:SS
     */
    getFormattedTime(): string {
        const totalSeconds = Math.floor(this.getElapsedMinutes() * 60);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Check if timer is currently running
     */
    isRunning(): boolean {
        return this.intervalId !== null;
    }

    /**
     * Trigger break reminder callback
     */
    private triggerReminder(minutes: number): void {
        if (this.onBreakReminderCallback) {
            this.onBreakReminderCallback(minutes);
        }
        // Remove this interval so it doesn't trigger again
        this.reminderIntervals.delete(minutes);
    }

    /**
     * Update reminder callback (useful for component updates)
     */
    setOnBreakReminder(callback: (minutes: number) => void): void {
        this.onBreakReminderCallback = callback;
    }

    /**
     * Update tick callback
     */
    setOnTick(callback: (elapsed: number) => void): void {
        this.onTickCallback = callback;
    }
}

/**
 * Create a global focus timer instance
 */
export const globalFocusTimer = new FocusTimer();
