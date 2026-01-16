import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle, Eye } from 'lucide-react';
import { triggerHaptic } from '@/utils/telegram';
import { useUserStore } from '@/store/userStore';

// Practice passages with paraphrasing at all 5 levels
const PRACTICE_PASSAGES = [
    {
        id: 1,
        passage: `Climate change has emerged as one of the most pressing challenges facing humanity in the 21st century. Global temperatures have risen by approximately 1.1 degrees Celsius since the pre-industrial era, primarily due to the increased concentration of greenhouse gases in the atmosphere. Scientists have observed that polar ice caps are melting at an accelerated rate, contributing to rising sea levels. Coastal communities around the world are particularly vulnerable to these changes, with some island nations facing the prospect of complete submersion within the next century. The economic consequences of climate change are substantial, with agricultural productivity declining in many regions and the frequency of extreme weather events increasing significantly.`,
        questions: [
            {
                id: 1,
                question: 'In which paragraph is information about temperature increases mentioned?',
                answer: '1',
                paraphraseLevel: 1,
                originalText: 'risen by approximately 1.1 degrees',
                paraphrasedText: 'temperature increases',
                explanation: 'Level 1 paraphrasing: "risen" → "increases." Simple synonym substitution.'
            },
            {
                id: 2,
                question: 'Which paragraph discusses the vulnerability of seaside populations?',
                answer: '1',
                paraphraseLevel: 4,
                originalText: 'Coastal communities',
                paraphrasedText: 'seaside populations',
                explanation: 'Level 4 paraphrasing: "Coastal communities" → "seaside populations." Generalization/specification change.'
            },
            {
                id: 3,
                question: 'Where is the reduction in farm output addressed?',
                answer: '1',
                paraphraseLevel: 2,
                originalText: 'agricultural productivity declining',
                paraphrasedText: 'reduction in farm output',
                explanation: 'Level 2 + 1: "agricultural" → "farm" (word class change), "declining" → "reduction" (noun from verb), "productivity" → "output" (synonym).'
            }
        ]
    },
    {
        id: 2,
        passage: `The human brain possesses remarkable plasticity, allowing it to adapt and reorganize itself throughout an individual's lifetime. Neurological research has demonstrated that learning new skills can lead to structural changes in brain tissue, with regions associated with specific abilities growing more dense as those abilities are practiced. This phenomenon, known as neuroplasticity, challenges the long-held belief that brain development ceases in early adulthood. Studies involving musicians, for example, have revealed that individuals who engage in regular practice exhibit enlarged areas in the cortex responsible for motor control and auditory processing. These findings suggest that cognitive decline in aging populations is not inevitable and can be mitigated through continued mental stimulation.`,
        questions: [
            {
                id: 4,
                question: 'Which paragraph mentions the brain\'s ability to change and adapt?',
                answer: '1',
                paraphraseLevel: 1,
                originalText: 'remarkable plasticity, allowing it to adapt and reorganize',
                paraphrasedText: 'ability to change and adapt',
                explanation: 'Level 1: "plasticity...reorganize" → "change and adapt." Direct synonyms.'
            },
            {
                id: 5,
                question: 'Where is the old assumption about brain development contradicted?',
                answer: '1',
                paraphraseLevel: 5,
                originalText: 'challenges the long-held belief that brain development ceases in early adulthood',
                paraphrasedText: 'old assumption about brain development contradicted',
                explanation: 'Level 5: Complete conceptual paraphrasing. "Challenges the long-held belief" = "old assumption...contradicted"'
            },
            {
                id: 6,
                question: 'Which paragraph discusses people who play instruments regularly?',
                answer: '1',
                paraphraseLevel: 4,
                originalText: 'musicians...engage in regular practice',
                paraphrasedText: 'people who play instruments regularly',
                explanation: 'Level 4: "musicians" (specific profession) → "people who play instruments" (descriptive specification).'
            }
        ]
    },
    {
        id: 3,
        passage: `The proliferation of social media platforms has fundamentally altered patterns of human communication. Traditional face-to-face interactions have diminished as digital exchanges become increasingly prevalent. Researchers have noted a correlation between extensive social media use and feelings of isolation, particularly among younger demographics. While these platforms facilitate connections across geographical boundaries, critics argue that such connections lack the depth and authenticity of in-person relationships. Additionally, the constant availability of information has been associated with reduced attention spans and difficulty maintaining focus on singular tasks. Despite these concerns, social media continues to dominate the communication landscape, with billions of users actively engaging on various platforms daily.`,
        questions: [
            {
                id: 7,
                question: 'Which paragraph contains information about the reduction of personal meetings?',
                answer: '1',
                paraphraseLevel: 3,
                originalText: 'Traditional face-to-face interactions have diminished',
                paraphrasedText: 'reduction of personal meetings',
                explanation: 'Level 3: Antonym + negation concept. "Diminished" = "reduction," "face-to-face" = "personal meetings"'
            },
            {
                id: 8,
                question: 'Where is the connection between platform usage and loneliness discussed?',
                answer: '1',
                paraphraseLevel: 5,
                originalText: 'correlation between extensive social media use and feelings of isolation',
                paraphrasedText: 'connection between platform usage and loneliness',
                explanation: 'Level 5: Multiple transformations. "Correlation" → "connection," "extensive social media use" → "platform usage," "feelings of isolation" → "loneliness"'
            },
            {
                id: 9,
                question: 'Which paragraph mentions difficulties with concentration on individual activities?',
                answer: '1',
                paraphraseLevel: 2,
                originalText: 'difficulty maintaining focus on singular tasks',
                paraphrasedText: 'difficulties with concentration on individual activities',
                explanation: 'Level 2: Word class changes. "Difficulty" → "difficulties," "maintaining focus" → "concentration," "singular tasks" → "individual activities"'
            }
        ]
    },
    {
        id: 4,
        passage: `Renewable energy sources have become increasingly vital in the global effort to reduce carbon emissions and combat climate change. Solar power technology has advanced significantly over the past decade, with photovoltaic panels becoming more efficient and cost-effective. Wind energy installations have proliferated across numerous countries, with offshore wind farms proving particularly productive due to consistent ocean breezes. Hydroelectric power remains a cornerstone of renewable energy generation in regions with suitable geography, though environmental concerns regarding ecosystem disruption have led to more cautious implementation of new dam projects. The intermittent nature of some renewable sources presents challenges for grid stability, necessitating the development of advanced energy storage solutions and smart grid technologies to ensure reliable power supply.`,
        questions: [
            {
                id: 10,
                question: 'Which paragraph mentions the growing importance of clean energy?',
                answer: '1',
                paraphraseLevel: 5,
                originalText: 'Renewable energy sources have become increasingly vital',
                paraphrasedText: 'growing importance of clean energy',
                explanation: 'Level 5: Complete conceptual transformation. "Renewable energy sources...increasingly vital" → "growing importance of clean energy"'
            },
            {
                id: 11,
                question: 'Where is the expansion of wind power facilities discussed?',
                answer: '1',
                paraphraseLevel: 2,
                originalText: 'Wind energy installations have proliferated',
                paraphrasedText: 'expansion of wind power facilities',
                explanation: 'Level 2: Word class change. "Installations" (noun) → "facilities" (noun), "proliferated" (verb) → "expansion" (noun from verb)'
            },
            {
                id: 12,
                question: 'Which paragraph addresses unreliable power generation from certain sources?',
                answer: '1',
                paraphraseLevel: 3,
                originalText: 'intermittent nature of some renewable sources',
                paraphrasedText: 'unreliable power generation from certain sources',
                explanation: 'Level 3: Antonym concept. "Intermittent" = "not reliable" → "unreliable"'
            }
        ]
    },
    {
        id: 5,
        passage: `Ancient civilizations developed sophisticated urban planning systems long before the modern era. The Indus Valley civilization, flourishing around 2500 BCE, constructed cities with remarkably advanced drainage systems and grid-pattern streets. Roman engineers pioneered the use of concrete in large-scale construction projects, enabling the creation of enduring structures such as aqueducts and amphitheaters. Archaeological evidence suggests that Mayan cities incorporated astronomical observations into their architectural designs, aligning important buildings with celestial events. These early innovations in urban design and engineering demonstrate that ancient peoples possessed considerable technical knowledge and organizational capabilities, challenging previous assumptions about the primitive nature of pre-modern societies.`,
        questions: [
            {
                id: 13,
                question: 'Which paragraph contains information about old societies creating complex city layouts?',
                answer: '1',
                paraphraseLevel: 1,
                originalText: 'Ancient civilizations developed sophisticated urban planning systems',
                paraphrasedText: 'old societies creating complex city layouts',
                explanation: 'Level 1: Direct synonyms. "Ancient civilizations" → "old societies," "sophisticated urban planning" → "complex city layouts"'
            },
            {
                id: 14,
                question: 'Where is the introduction of cement in building mentioned?',
                answer: '1',
                paraphraseLevel: 4,
                originalText: 'pioneered the use of concrete in large-scale construction',
                paraphrasedText: 'introduction of cement in building',
                explanation: 'Level 4: Generalization. "Concrete" (specific material) → "cement" (general/related), "pioneered the use" → "introduction," "large-scale construction" → "building"'
            },
            {
                id: 15,
                question: 'Which paragraph discusses structures that have lasted over time?',
                answer: '1',
                paraphraseLevel: 5,
                originalText: 'enabling the creation of enduring structures',
                paraphrasedText: 'structures that have lasted over time',
                explanation: 'Level 5: Semantic restructuring. "Enduring" (adjective) → "have lasted over time" (descriptive phrase)'
            }
        ]
    },
    {
        id: 6,
        passage: `Workplace productivity has emerged as a critical concern for modern organizations seeking competitive advantages. Research indicates that employee well-being directly correlates with performance outcomes, with companies investing in wellness programs reporting measurable improvements in output. The traditional nine-to-five work schedule has been questioned by recent studies showing that flexible arrangements often yield superior results. Remote work capabilities, accelerated by recent global events, have demonstrated that location-independent employment can maintain or even enhance efficiency for many roles. However, the absence of face-to-face collaboration has been identified as a potential drawback, particularly for tasks requiring creative problem-solving and innovation. Organizations are now experimenting with hybrid models that attempt to balance the benefits of both remote and in-person work environments.`,
        questions: [
            {
                id: 16,
                question: 'Where is the relationship between worker health and job performance explored?',
                answer: '1',
                paraphraseLevel: 2,
                originalText: 'employee well-being directly correlates with performance outcomes',
                paraphrasedText: 'relationship between worker health and job performance',
                explanation: 'Level 2: Word class changes. "Employee well-being" → "worker health," "correlates with" (verb) → "relationship" (noun), "performance outcomes" → "job performance"'
            },
            {
                id: 17,
                question: 'Which paragraph mentions work arrangements that are not rigid?',
                answer: '1',
                paraphraseLevel: 3,
                originalText: 'flexible arrangements',
                paraphrasedText: 'work arrangements that are not rigid',
                explanation: 'Level 3: Antonym + negation. "Flexible" = "not rigid"'
            },
            {
                id: 18,
                question: 'Where is the lack of in-person interaction discussed?',
                answer: '1',
                paraphraseLevel: 1,
                originalText: 'absence of face-to-face collaboration',
                paraphrasedText: 'lack of in-person interaction',
                explanation: 'Level 1: Synonym substitution. "Absence" → "lack," "face-to-face collaboration" → "in-person interaction"'
            }
        ]
    },
    {
        id: 7,
        passage: `Marine ecosystems play an indispensable role in maintaining global environmental stability. Coral reefs, often described as the rainforests of the sea, support extraordinary biodiversity despite occupying less than one percent of the ocean floor. Phytoplankton, microscopic organisms floating near the water's surface, are responsible for producing approximately half of the world's oxygen through photosynthesis. The ocean's capacity to absorb carbon dioxide serves as a crucial mechanism for mitigating atmospheric greenhouse gas concentrations. Unfortunately, rising water temperatures attributable to climate change have triggered widespread coral bleaching events, threatening these vibrant ecosystems. Overfishing has depleted numerous fish populations, disrupting food chains and compromising the ocean's ability to sustain marine life diversity.`,
        questions: [
            {
                id: 19,
                question: 'Which paragraph describes undersea habitats as essential?',
                answer: '1',
                paraphraseLevel: 5,
                originalText: 'Marine ecosystems play an indispensable role',
                paraphrasedText: 'undersea habitats as essential',
                explanation: 'Level 5: Complete semantic change. "Marine ecosystems" → "undersea habitats," "play an indispensable role" → "as essential"'
            },
            {
                id: 20,
                question: 'Where is information about tiny floating sea organisms provided?',
                answer: '1',
                paraphraseLevel: 4,
                originalText: 'Phytoplankton, microscopic organisms floating near the water\'s surface',
                paraphrasedText: 'tiny floating sea organisms',
                explanation: 'Level 4: Specification to generalization. "Phytoplankton, microscopic organisms floating" → "tiny floating sea organisms" (more general description)'
            },
            {
                id: 21,
                question: 'Which paragraph mentions increasing ocean heat?',
                answer: '1',
                paraphraseLevel: 1,
                originalText: 'rising water temperatures',
                paraphrasedText: 'increasing ocean heat',
                explanation: 'Level 1: Direct synonyms. "Rising" → "increasing," "water temperatures" → "ocean heat"'
            }
        ]
    },
    {
        id: 8,
        passage: `Medical research methodologies have undergone substantial transformation in recent decades. Randomized controlled trials remain the gold standard for evaluating treatment efficacy, providing the most reliable evidence for clinical decision-making. The advent of genetic sequencing technologies has revolutionized personalized medicine, allowing treatments to be tailored to individual patients' genetic profiles. Big data analytics applied to healthcare records enables researchers to identify patterns and correlations that would be impossible to detect through traditional observational studies. Ethical considerations surrounding patient privacy and informed consent have become increasingly complex as medical research incorporates more sophisticated data collection methods. The lengthy timeline required to bring new medications from laboratory discovery to market approval continues to frustrate both researchers and patients seeking access to innovative therapies.`,
        questions: [
            {
                id: 22,
                question: 'Which paragraph discusses tests that evaluate how well treatments work?',
                answer: '1',
                paraphraseLevel: 2,
                originalText: 'trials...for evaluating treatment efficacy',
                paraphrasedText: 'tests that evaluate how well treatments work',
                explanation: 'Level 2: Word class and structure change. "Trials" → "tests," "efficacy" (noun) → "how well...work" (descriptive phrase)'
            },
            {
                id: 23,
                question: 'Where is customized healthcare based on DNA mentioned?',
                answer: '1',
                paraphraseLevel: 5,
                originalText: 'personalized medicine...treatments tailored to individual patients\' genetic profiles',
                paraphrasedText: 'customized healthcare based on DNA',
                explanation: 'Level 5: Complete conceptual paraphrasing. "Personalized medicine...genetic profiles" → "customized healthcare based on DNA"'
            },
            {
                id: 24,
                question: 'Which paragraph addresses the extended period for drug development?',
                answer: '1',
                paraphraseLevel: 1,
                originalText: 'lengthy timeline required to bring new medications from laboratory discovery to market approval',
                paraphrasedText: 'extended period for drug development',
                explanation: 'Level 1: Synonym substitution. "Lengthy timeline" → "extended period," "bring new medications...to market" → "drug development"'
            }
        ]
    }
];

export default function PracticeExercise() {
    const [currentPassage, setCurrentPassage] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [showHints, setShowHints] = useState(true);
    const { updateXP } = useUserStore();

    const passage = PRACTICE_PASSAGES[currentPassage];

    const handleAnswerChange = (questionId: number, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        triggerHaptic('selection');
    };

    const handleSubmit = () => {
        setShowResults(true);

        const correct = passage.questions.filter(
            (q) => answers[q.id] === q.answer
        ).length;

        const xpGained = correct * 20; // 20 XP per correct paraphrasing match
        updateXP(xpGained);

        triggerHaptic('success');
    };

    const handleReset = () => {
        setAnswers({});
        setShowResults(false);
        triggerHaptic('selection');
    };

    const handleNextPassage = () => {
        setCurrentPassage((prev) => (prev + 1) % PRACTICE_PASSAGES.length);
        setAnswers({});
        setShowResults(false);
        triggerHaptic('selection');
    };

    const correctCount = passage.questions.filter(
        (q) => answers[q.id] === q.answer
    ).length;

    const getLevelColor = (level: number) => {
        const colors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];
        return colors[level - 1] || '#6b7280';
    };

    const getLevelName = (level: number) => {
        const names = ['Synonym', 'Word Class', 'Antonym+Not', 'General/Specific', 'Conceptual'];
        return names[level - 1] || 'Unknown';
    };

    return (
        <div className="practice-exercise">
            {/* Hint Toggle */}
            <div className="feature-toggle">
                <label className="toggle-label">
                    <input
                        type="checkbox"
                        checked={showHints}
                        onChange={(e) => setShowHints(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">
                        <Eye size={16} />
                        Show Paraphrase Hints
                    </span>
                </label>
            </div>

            {/* Passage */}
            <motion.div
                className="practice-passage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <h3 className="passage-title">Passage {currentPassage + 1}</h3>
                <div className="passage-text">{passage.passage}</div>
            </motion.div>

            {/* Questions */}
            <div className="practice-questions">
                <h3>Matching Information</h3>
                <p className="question-instruction">
                    The passage has only ONE paragraph. In which paragraph does the following information appear?
                </p>
                <p className="question-instruction-detail">
                    Write <strong>1</strong> for all correct answers. Focus on finding the <em>paraphrased version</em> in the text.
                </p>

                {passage.questions.map((question, index) => (
                    <motion.div
                        key={question.id}
                        className={`question-card ${showResults ? (answers[question.id] === question.answer ? 'correct' : 'incorrect') : ''}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="question-header">
                            <div className="question-number">Q{question.id}</div>
                            {showResults && (
                                <div
                                    className="level-badge"
                                    style={{ backgroundColor: getLevelColor(question.paraphraseLevel) }}
                                >
                                    Level {question.paraphraseLevel}: {getLevelName(question.paraphraseLevel)}
                                </div>
                            )}
                        </div>

                        <div className="question-text">{question.question}</div>

                        {showHints && !showResults && (
                            <div className="paraphrase-hint">
                                <AlertCircle size={14} />
                                <strong>Hint:</strong> Look for paraphrased version of: "{question.paraphrasedText}"
                            </div>
                        )}

                        <div className="answer-input">
                            <label>
                                Paragraph:
                                <input
                                    type="number"
                                    min="1"
                                    max="1"
                                    value={answers[question.id] || ''}
                                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                    disabled={showResults}
                                    className="paragraph-input"
                                    placeholder="1"
                                />
                            </label>
                            {showResults && (
                                <span className="answer-indicator">
                                    {answers[question.id] === question.answer ? (
                                        <Check size={20} className="correct-icon" />
                                    ) : (
                                        <X size={20} className="incorrect-icon" />
                                    )}
                                </span>
                            )}
                        </div>

                        {showResults && (
                            <div className={`explanation ${answers[question.id] === question.answer ? 'correct-exp' : 'incorrect-exp'}`}>
                                <strong>
                                    {answers[question.id] === question.answer ? '✓ Correct!' : '✗ Incorrect'}
                                </strong>
                                <div className="paraphrase-comparison">
                                    <div className="comparison-row">
                                        <span className="label">Question says:</span>
                                        <span className="text">{question.paraphrasedText}</span>
                                    </div>
                                    <div className="comparison-row">
                                        <span className="label">Text says:</span>
                                        <span className="text">{question.originalText}</span>
                                    </div>
                                </div>
                                <p>{question.explanation}</p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Submit/Results */}
            {!showResults && Object.keys(answers).length === passage.questions.length && (
                <motion.button
                    className="btn-submit"
                    onClick={handleSubmit}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    Check Answers
                </motion.button>
            )}

            {showResults && (
                <motion.div
                    className="results-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3>Results: Passage {currentPassage + 1}</h3>
                    <div className="results-score">
                        <div className="score-circle">
                            <span className="score-value">{correctCount}/{passage.questions.length}</span>
                            <span className="score-label">Correct</span>
                        </div>
                        <div className="score-percentage">
                            {Math.round((correctCount / passage.questions.length) * 100)}% Accuracy
                        </div>
                    </div>

                    <div className="results-stats">
                        <div className="result-stat">
                            <div className="result-stat-label">XP Earned</div>
                            <div className="result-stat-value gradient-text">+{correctCount * 20}</div>
                        </div>
                        <div className="result-stat">
                            <div className="result-stat-label">Progress</div>
                            <div className="result-stat-value">
                                {currentPassage + 1}/{PRACTICE_PASSAGES.length} Passages
                            </div>
                        </div>
                    </div>

                    <div className="result-actions">
                        <button className="btn-secondary" onClick={handleReset}>
                            Retry This Passage
                        </button>
                        {currentPassage < PRACTICE_PASSAGES.length - 1 && (
                            <button className="btn-primary" onClick={handleNextPassage}>
                                Next Passage →
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
