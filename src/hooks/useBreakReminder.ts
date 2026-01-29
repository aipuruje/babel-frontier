import { useEffect, useState, useRef } from 'react';
import { useUserStore } from '@/store/userStore';

/**
 * Custom hook to manage break reminders during focus sessions
 * Based on research: optimal focus intervals are 20-40 minutes for teens/young adults
 */
export function useBreakReminder() {
    const { preferences, currentSession, addBreakToSession } = useUserStore();
    const [showBreakModal, setShowBreakModal] = useState(false);
    const [breakMinutes, setBreakMinutes] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const triggeredIntervalsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        // Only enable if break reminders are on and we have an active session
        if (!preferences.breakRemindersEnabled || !currentSession) {
            return;
        }

        // Set up interval to check elapsed time every second
        const intervalId = setInterval(() => {
            const startTime = new Date(currentSession.startTime).getTime();
            const now = Date.now();
            const elapsedMs = now - startTime;
            const elapsedMin = Math.floor(elapsedMs / (60 * 1000));

            setElapsedSeconds(Math.floor(elapsedMs / 1000));

            // Check if we've hit a reminder interval
            const intervals = preferences.breakReminderInterval === 20
                ? [20, 40]
                : preferences.breakReminderInterval === 30
                    ? [30, 60]
                    : [40, 80];

            for (const interval of intervals) {
                // Trigger if we've reached the interval and haven't triggered it yet
                if (elapsedMin >= interval && !triggeredIntervalsRef.current.has(interval)) {
                    triggeredIntervalsRef.current.add(interval);
                    setBreakMinutes(interval);
                    setShowBreakModal(true);
                    break; // Only trigger one at a time
                }
            }
        }, 1000); // Check every second

        // Cleanup on unmount
        return () => {
            clearInterval(intervalId);
        };
    }, [preferences.breakRemindersEnabled, currentSession, preferences.breakReminderInterval]);

    const handleTakeBreak = () => {
        // Record that user took a break
        addBreakToSession();
        // Modal will handle the break timer countdown
    };

    const handleContinue = () => {
        // User chose to continue - just close modal
        setShowBreakModal(false);
    };

    const handleDismiss = () => {
        // User dismissed the reminder
        setShowBreakModal(false);
    };

    return {
        showBreakModal,
        breakMinutes,
        handleTakeBreak,
        handleContinue,
        handleDismiss,
        elapsedMinutes: Math.floor(elapsedSeconds / 60),
    };
}
