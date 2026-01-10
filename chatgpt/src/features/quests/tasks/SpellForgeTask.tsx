// SpellForgeTask - Grammar cloze/MCQ

import { useState } from 'react';
import type { Task } from '../../../lib/types';
import './TaskStyles.css';

interface SpellForgeTaskProps {
    task: Task;
    onSubmit: (answer: { choiceId: string }) => void;
}

export default function SpellForgeTask({ task, onSubmit }: SpellForgeTaskProps) {
    const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!selectedChoice) return;

        onSubmit({ choiceId: selectedChoice });
    };

    return (
        <div className="task-component spell-forge-task">
            <div className="task-icon">⚒️</div>
            <h3 className="task-title">Spell Forge</h3>

            <div className="task-prompt">
                <p className="spell-text">{task.prompt.en}</p>
            </div>

            <div className="task-choices spell-choices">
                {task.choices?.map(choice => (
                    <button
                        key={choice.id}
                        className={`choice-btn spell-choice ${selectedChoice === choice.id ? 'selected' : ''}`}
                        onClick={() => setSelectedChoice(choice.id)}
                    >
                        <span className="choice-id">{choice.id}</span>
                        <span className="choice-text spell-word">{choice.text.en}</span>
                    </button>
                ))}
            </div>

            <button
                className="btn btn-gold submit-btn"
                onClick={handleSubmit}
                disabled={!selectedChoice}
            >
                Cast Spell
            </button>
        </div>
    );
}
