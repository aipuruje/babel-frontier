import { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

// Custom tooltip component (moved outside to avoid recreation on each render)
const CustomTooltip = ({ active, payload, showComparison }) =\u003e {
    if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
    \u003cdiv style = {{
        background: 'rgba(0, 0, 0, 0.9)',
            border: '2px solid #667eea',
                borderRadius: '8px',
                    padding: '12px',
                        color: '#fff'
    }
} \u003e
\u003cp style = {{ margin: '0 0 4px 0', fontWeight: 'bold' }}\u003e{ data.criterion } \u003c / p\u003e
\u003cp style = {{ margin: '4px 0', color: '#66ff66' }}\u003eCurrent: { data.score.toFixed(1) } \u003c / p\u003e
{
    showComparison && data.previousScore \u003e 0 && (
    \u003cp style = {{ margin: '4px 0', color: '#ffd93d' }
} \u003e
Previous: { data.previousScore.toFixed(1) }
\u003c / p\u003e
                )}
\u003c / div\u003e
        );
    }
return null;
};

/**
 * Rubric Radar Component - Visualizes skill balance across IELTS criteria
 * 
 * Features:
 * - Radar chart showing 4 writing criteria (TR, CC, LR, GRA) or speaking criteria
 * - Auto-detects weakest criterion and suggests a mission
 * - Comparison mode to overlay previous attempt
 * 
 * Props:
 * - scores: Object with criteria scores {TR: 6.0, CC: 5.5, LR: 6.5, GRA: 5.0}
 *   Or for speaking: {FC: 6.0, LR: 5.5, GRA: 6.5, P: 5.0}
 * - previousScores: (optional) Object with previous attempt scores
 * - skillType: 'writing' or 'speaking'
 */
const RubricRadar = ({ scores, previousScores, skillType = 'writing' }) => {
    const [showComparison, setShowComparison] = useState(false);

    // Map criteria names
    const criteriaNames = skillType === 'writing'
        ? {
            TR: 'Task Response',
            CC: 'Coherence & Cohesion',
            LR: 'Lexical Resource',
            GRA: 'Grammar & Accuracy'
        }
        : {
            FC: 'Fluency & Coherence',
            LR: 'Lexical Resource',
            GRA: 'Grammatical Range',
            P: 'Pronunciation'
        };

    // Transform scores for chart
    const chartData = Object.keys(criteriaNames).map(key => ({
        criterion: criteriaNames[key],
        score: scores[key] || 0,
        previousScore: previousScores ? (previousScores[key] || 0) : 0,
        fullMark: 9
    }));

    // Find weakest criterion
    const weakestCriterion = Object.keys(scores).reduce((min, key) =>
        scores[key] < scores[min] ? key : min
    );
    const weakestScore = scores[weakestCriterion];
    const weakestName = criteriaNames[weakestCriterion];

    // Mission suggestions based on weakest criterion
    const missionSuggestions = {
        writing: {
            TR: 'Practice "Argument Development" missions to directly address all parts of the question',
            CC: 'Try "Cohesive Device Mastery" missions to improve linking and paragraph flow',
            LR: 'Unlock "Vocabulary Expansion" missions to use advanced collocations',
            GRA: 'Focus on "Grammar Structures" missions to eliminate errors and increase complexity'
        },
        speaking: {
            FC: 'Complete "Fluency Drills" to reduce pauses and filler words',
            LR: 'Try "Idiomatic Expression" missions to expand natural vocabulary',
            GRA: 'Practice "Complex Sentence" missions to improve grammatical variety',
            P: 'Work on "Pronunciation Clarity" missions to improve intelligibility'
        }
    };

    const suggestedMission = missionSuggestions[skillType][weakestCriterion];

    return (
        <div className="rubric-radar">
            <div className="radar-header">
                <h3>🎯 Skill Balance Radar</h3>
                {previousScores && (
                    <button
                        className="comparison-toggle"
                        onClick={() => setShowComparison(!showComparison)}
                    >
                        {showComparison ? '✓ Comparison On' : 'Compare with Previous'}
                    </button>
                )}
            </div>

            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={chartData}>
                        <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
                        <PolarAngleAxis
                            dataKey="criterion"
                            tick={{ fill: '#fff', fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 9]}
                            tick={{ fill: '#aaa', fontSize: 10 }}
                        />
                        <Radar
                            name="Current Score"
                            dataKey="score"
                            stroke="#667eea"
                            fill="#667eea"
                            fillOpacity={0.6}
                            strokeWidth={2}
                        />
                        {showComparison && previousScores && (
                            <Radar
                                name="Previous Score"
                                dataKey="previousScore"
                                stroke="#ffd93d"
                                fill="#ffd93d"
                                fillOpacity={0.3}
                                strokeWidth={2}
                                strokeDasharray="5 5"
                            />
                        )}
                        <Tooltip content={<CustomTooltip showComparison={showComparison} />} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="weakness-alert">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                    <h4>Skill Imbalance Detected</h4>
                    <p>
                        Your weakest criterion is <b className="weak-criterion">{weakestName}</b>
                        {' '}with a score of <b>{weakestScore.toFixed(1)}</b>.
                    </p>
                    <p className="suggested-mission">
                        <span className="mission-icon">🎯</span>
                        <b>Suggested Mission:</b> {suggestedMission}
                    </p>
                    <button className="start-mission-btn">
                        Start Targeted Mission →
                    </button>
                </div>
            </div>

            <style jsx>{`
                .rubric-radar {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px;
                    padding: 24px;
                    color: #fff;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }

                .radar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .radar-header h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0;
                    background: linear-gradient(135deg, #ffd93d 0%, #ff8c42 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .comparison-toggle {
                    background: rgba(102, 126, 234, 0.2);
                    border: 2px solid #667eea;
                    color: #fff;
                    border-radius: 8px;
                    padding: 8px 16px;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .comparison-toggle:hover {
                    background: rgba(102, 126, 234, 0.4);
                    transform: translateY(-2px);
                }

                .chart-wrapper {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 24px;
                }

                .weakness-alert {
                    background: linear-gradient(135deg, rgba(255, 140, 66, 0.2) 0%, rgba(255, 77, 77, 0.2) 100%);
                    border: 2px solid rgba(255, 140, 66, 0.4);
                    border-radius: 12px;
                    padding: 20px;
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                }

                .alert-icon {
                    font-size: 2.5rem;
                }

                .alert-content h4 {
                    font-size: 1.2rem;
                    margin: 0 0 8px 0;
                    color: #ff8c42;
                }

                .alert-content p {
                    margin: 6px 0;
                    font-size: 1rem;
                    line-height: 1.5;
                }

                .weak-criterion {
                    color: #ff8c42;
                    font-weight: 700;
                }

                .suggested-mission {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    padding: 12px;
                    margin-top: 12px !important;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                }

                .mission-icon {
                    font-size: 1.2rem;
                }

                .start-mission-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    padding: 12px 24px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    margin-top: 16px;
                    transition: all 0.3s ease;
                }

                .start-mission-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.4);
                }

                @media (max-width: 768px) {
                    .radar-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }

                    .comparison-toggle {
                        width: 100%;
                    }

                    .weakness-alert {
                        flex-direction: column;
                        text-align: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default RubricRadar;
