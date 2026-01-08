import { useState, useEffect } from 'react';

/**
 * Correction Toggle Component - Switches between "Show All" and "Focus Mode"
 * 
 * Features:
 * - "Show All": Traditional Track Changes view (all corrections)
 * - "Focus Mode": Only shows corrections for the weakest criterion
 * - Color-coded highlights (red strikethrough for original, green for replacement)
 * - Stores user preference in localStorage
 * 
 * Props:
 * - corrections: Array of {original, replacement, errorType, impact, reason}
 * - currentWeakness: String (e.g., "Grammar", "Punctuation", "Vocabulary")
 * - essayText: String (original essay text)
 */
const CorrectionToggle = ({ corrections, currentWeakness, essayText }) => {
    // Initialize from localStorage to avoid setState in effect
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('correctionViewMode') || 'showAll';
    });
    const [selectedErrorType, setSelectedErrorType] = useState(currentWeakness);

    // Save preference when changed
    const handleModeChange = (mode) => {
        setViewMode(mode);
        localStorage.setItem('correctionViewMode', mode);
    };

    // Filter corrections based on view mode
    const displayedCorrections = viewMode === 'focus'
        ? corrections.filter(c => c.errorType === selectedErrorType)
        : corrections;

    // Get unique error types for filter dropdown
    const errorTypes = [...new Set(corrections.map(c => c.errorType))];

    // Apply corrections to essay text with color coding
    const renderEssayWithCorrections = () => {
        let renderedText = essayText;
        const sortedCorrections = [...displayedCorrections].sort((a, b) =>
            renderedText.indexOf(b.original) - renderedText.indexOf(a.original)
        );

        sortedCorrections.forEach((correction, idx) => {
            const regex = new RegExp(escapeRegex(correction.original), 'g');
            const replacement = `<span class="correction-pair" data-index="${idx}">
                <span class="original-text" title="${correction.reason}">${correction.original}</span>
                <span class="replacement-text" title="Impact: +${correction.impact} points">${correction.replacement}</span>
            </span>`;
            renderedText = renderedText.replace(regex, replacement);
        });

        return { __html: renderedText };
    };

    return (
        <div className="correction-toggle">
            <div className="toggle-header">
                <h3>📝 Corrections & Suggestions</h3>
                <div className="toggle-controls">
                    <button
                        className={`mode-btn ${viewMode === 'showAll' ? 'active' : ''}`}
                        onClick={() => handleModeChange('showAll')}
                    >
                        Show All ({corrections.length})
                    </button>
                    <button
                        className={`mode-btn ${viewMode === 'focus' ? 'active' : ''}`}
                        onClick={() => handleModeChange('focus')}
                    >
                        Focus Mode
                    </button>
                </div>
            </div>

            {viewMode === 'focus' && (
                <div className="focus-mode-controls">
                    <label htmlFor="errorTypeSelect">Focus on:</label>
                    <select
                        id="errorTypeSelect"
                        value={selectedErrorType}
                        onChange={(e) => setSelectedErrorType(e.target.value)}
                        className="error-type-select"
                    >
                        {errorTypes.map(type => (
                            <option key={type} value={type}>
                                {type} ({corrections.filter(c => c.errorType === type).length})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="essay-with-corrections" dangerouslySetInnerHTML={renderEssayWithCorrections()} />

            <div className="corrections-list">
                <h4>Detailed Corrections ({displayedCorrections.length})</h4>
                {displayedCorrections.length === 0 ? (
                    <p className="no-corrections">No corrections in this category. Great job! 🎉</p>
                ) : (
                    <div className="corrections-grid">
                        {displayedCorrections.map((correction, idx) => (
                            <div key={idx} className="correction-card">
                                <div className="correction-header">
                                    <span className="error-type-badge">{correction.errorType}</span>
                                    <span className="impact-badge">
                                        +{correction.impact.toFixed(1)} points
                                    </span>
                                </div>
                                <div className="correction-content">
                                    <div className="correction-original">
                                        <span className="label">Original:</span>
                                        <span className="text">{correction.original}</span>
                                    </div>
                                    <div className="correction-arrow">→</div>
                                    <div className="correction-replacement">
                                        <span className="label">Better:</span>
                                        <span className="text">{correction.replacement}</span>
                                    </div>
                                </div>
                                <div className="correction-reason">
                                    <b>Why?</b> {correction.reason}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style jsx>{`
                .correction-toggle {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px;
                    padding: 24px;
                    color: #fff;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }

                .toggle-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .toggle-header h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0;
                    background: linear-gradient(135deg, #ffd93d 0%, #ff8c42 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .toggle-controls {
                    display: flex;
                    gap: 8px;
                }

                .mode-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                    color: #aaa;
                    border-radius: 8px;
                    padding: 8px 16px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .mode-btn.active {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-color: #667eea;
                    color: #fff;
                    font-weight: 600;
                }

                .mode-btn:hover:not(.active) {
                    background: rgba(255, 255, 255, 0.1);
                }

                .focus-mode-controls {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .focus-mode-controls label {
                    font-size: 0.9rem;
                    color: #ffd93d;
                    font-weight: 600;
                }

                .error-type-select {
                    flex: 1;
                    background: rgba(0, 0, 0, 0.3);
                    border: 2px solid rgba(102, 126, 234, 0.5);
                    color: #fff;
                    border-radius: 8px;
                    padding: 8px 12px;
                    font-size: 0.9rem;
                    cursor: pointer;
                }

                .essay-with-corrections {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 24px;
                    line-height: 1.8;
                    font-size: 1.05rem;
                }

                .essay-with-corrections :global(.correction-pair) {
                    display: inline;
                    position: relative;
                }

                .essay-with-corrections :global(.original-text) {
                    color: #ff6b6b;
                    text-decoration: line-through;
                    text-decoration-color: #ff4d4d;
                    text-decoration-thickness: 2px;
                    cursor: help;
                }

                .essay-with-corrections :global(.replacement-text) {
                    color: #66ff66;
                    font-weight: 600;
                    margin-left: 4px;
                    cursor: help;
                }

                .corrections-list h4 {
                    font-size: 1.2rem;
                    margin-bottom: 16px;
                    color: #ffd93d;
                }

                .no-corrections {
                    text-align: center;
                    padding: 32px;
                    color: #66ff66;
                    font-size: 1.1rem;
                }

                .corrections-grid {
                    display: grid;
                    gap: 16px;
                }

                .correction-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 16px;
                    transition: all 0.3s ease;
                }

                .correction-card:hover {
                    border-color: #667eea;
                    transform: translateY(-2px);
                }

                .correction-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .error-type-badge {
                    background: rgba(255, 140, 66, 0.3);
                    border: 1px solid #ff8c42;
                    color: #ff8c42;
                    border-radius: 6px;
                    padding: 4px 12px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .impact-badge {
                    background: rgba(102, 255, 102, 0.2);
                    border: 1px solid #66ff66;
                    color: #66ff66;
                    border-radius: 6px;
                    padding: 4px 12px;
                    font-size: 0.85rem;
                    font-weight: 600;
                }

                .correction-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                    flex-wrap: wrap;
                }

                .correction-original, .correction-replacement {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    flex: 1;
                    min-width: 150px;
                }

                .correction-original .label, .correction-replacement .label {
                    font-size: 0.75rem;
                    color: #aaa;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .correction-original .text {
                    color: #ff6b6b;
                    font-weight: 500;
                }

                .correction-replacement .text {
                    color: #66ff66;
                    font-weight: 600;
                }

                .correction-arrow {
                    font-size: 1.5rem;
                    color: #667eea;
                }

                .correction-reason {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 8px;
                    padding: 12px;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    color: #ccc;
                }

                .correction-reason b {
                    color: #ffd93d;
                    margin-right: 4px;
                }

                @media (max-width: 768px) {
                    .toggle-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }

                    .toggle-controls {
                        width: 100%;
                    }

                    .mode-btn {
                        flex: 1;
                    }

                    .correction-content {
                        flex-direction: column;
                    }

                    .correction-arrow {
                        transform: rotate(90deg);
                    }
                }
            `}</style>
        </div>
    );
};

// Helper function to escape regex special characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default CorrectionToggle;
