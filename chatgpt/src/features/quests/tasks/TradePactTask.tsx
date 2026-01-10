// TradePactTask - Short writing (1-2 sentences)

import { useState } from 'react';
import type { Task } from '../../../lib/types';
import './TaskStyles.css';

interface TradePactTaskProps {
    task: Task;
    onSubmit: (answer: { text: string }) => void;
}

export default function TradePactTask({ task, onSubmit }: TradePactTaskProps) {
    const [text, setText] = useState('');
    const maxWords = 28;

    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;

    const handleSubmit = () => {
        if (!text.trim() || wordCount > maxWords) return;

        onSubmit({ text: text.trim() });
    };

    return (
        <div className="task-component trade-pact-task">
            <div className="task-icon">✍️</div>
            <h3 className="task-title">Trade Pact</h3>

            <div className="task-prompt">
                <p>{task.prompt.en}</p>
            </div>

            <div className="writing-area">
                <textarea
                    className="writing-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write your answer here (1-2 sentences, max 28 words)..."
                    rows={4}
                />

                <div className="writing-stats">
                    <span className={`word-count ${wordCount > maxWords ? 'over-limit' : ''}`}>
                        {wordCount} / {maxWords} words
                    </span>
                </div>
            </div>

            <button
                className="btn btn-gold submit-btn"
                onClick={handleSubmit}
                disabled={!text.trim() || wordCount > maxWords}
            >
                Submit Answer
            </button>
        </div>
    );
}
