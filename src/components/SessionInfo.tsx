import React from 'react';
import './SessionInfo.css';

interface SessionInfoProps {
    duration: number;        // minutes
    variant?: 'card' | 'header';
    className?: string;
}

/**
 * SessionInfo Component
 * Displays estimated session duration based on educational psychology research
 * Shows users how long a module/activity will take to manage attention
 */
export const SessionInfo: React.FC<SessionInfoProps> = ({
    duration,
    variant = 'card',
    className = ''
}) => {
    const formatDuration = (minutes: number): string => {
        if (minutes < 15) {
            return `~${minutes} min`;
        } else if (minutes < 30) {
            const lower = Math.floor(minutes / 5) * 5;
            const upper = lower + 5;
            return `~${lower}-${upper} min`;
        } else if (minutes < 60) {
            const lower = Math.floor(minutes / 10) * 10;
            const upper = lower + 10;
            return `~${lower}-${upper} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMins = minutes % 60;
            if (remainingMins === 0) {
                return `~${hours} hr`;
            }
            return `~${hours}h ${remainingMins}m`;
        }
    };

    return (
        <div className={`session-info session-info--${variant} ${className}`}>
            <svg
                className="session-info__icon"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
            >
                <circle
                    cx="8"
                    cy="8"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                />
                <path
                    d="M8 4v4l3 2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
            </svg>
            <span className="session-info__text">
                {formatDuration(duration)}
            </span>
        </div>
    );
};

export default SessionInfo;
