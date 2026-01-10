// RuneScanTask - Reading comprehension (MCQ)

import { useState } from 'react';
import type { Task } from '../../../lib/types';
import './TaskStyles.css';

interface RuneScanTaskProps {
    task: Task;
    onSubmit: (answer: { choiceId: string }) => void;
}

export default function RuneScanTask({ task, onSubmit }: RuneScanTaskProps) {
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!selectedChoice) return;

        onSubmit({ choiceId: selectedChoice });
    };

    return (
        <div className="task-component rune-scan-task">
            <div className="task-icon">📖</div>
            <h3 className="task-title">Rune Scan</h3>

            <div className="task-prompt card-parchment">
                <p>{task.prompt.en}</p>
            </div>

            <div className="task-choices">
                {task.choices?.map(choice => (
                    <button
                        key={choice.id}
                        className={`choice-btn ${selectedChoice === choice.id ? 'selected' : ''}`}
                        onClick={() => setSelectedChoice(choice.id)}
                    >
                        <span className="choice-id">{choice.id}</span>
                        <span className="choice-text">{choice.text.en}</span>
                    </button>
                ))}
            </div>

            <button
                className="btn btn-gold submit-btn"
                onClick={handleSubmit}
                disabled={!selectedChoice}
            >
                Submit Answer
            </button>
        </div>
    );
}
