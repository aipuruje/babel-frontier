import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, X, AlertCircle } from 'lucide-react';
import { triggerHaptic } from '@/utils/telegram';
import { useUserStore } from '@/store/userStore';

// TFNG Practice questions targeting common errors
const PRACTICE_QUESTIONS = [
    {
        id: 1,
        passage: `The invention of the printing press by Johannes Gutenberg in the 15th century revolutionized the spread of information. Prior to this invention, books were painstakingly copied by hand, making them rare and expensive. The printing press allowed for mass production of books, which dramatically reduced their cost and increased accessibility. This technological advancement is often credited with facilitating the Renaissance and the Protestant Reformation by enabling the rapid dissemination of new ideas.`,
        questions: [
            {
                id: 1,
                statement: 'Books were expensive before the printing press was invented.',
                answer: 'TRUE',
                keywords: ['books', 'expensive', 'before'],
                qualifier: null,
                explanation: 'The text explicitly states books were "rare and expensive" before the printing press. This directly confirms the statement.',
                trap: null
            },
            {
                id: 2,
                statement: 'All books became affordable after the printing press was invented.',
                answer: 'NOT GIVEN',
                keywords: ['all books', 'affordable'],
                qualifier: 'all',
                explanation: 'The text says the printing press "dramatically reduced their cost" but does NOT say ALL books became affordable. Be careful with the qualifier "all".',
                trap: 'qualifier'
            },
            {
                id: 3,
                statement: 'The printing press caused the Renaissance.',
                answer: 'FALSE',
                keywords: ['printing press', 'caused', 'Renaissance'],
                qualifier: null,
                explanation: 'The text says the printing press is "credited with FACILITATING" the Renaissance, not CAUSING it. Facilitate ≠ Cause. This is a subtle contradiction.',
                trap: 'synonym'
            },
            {
                id: 4,
                statement: 'Johannes Gutenberg was a skilled engineer.',
                answer: 'NOT GIVEN',
                keywords: ['Johannes Gutenberg', 'skilled', 'engineer'],
                qualifier: null,
                explanation: 'While it might be "obvious" that inventing the printing press requires engineering skill, the text never explicitly states this. Don\'t use outside knowledge!',
                trap: 'inference'
            },
            {
                id: 5,
                statement: 'Before the printing press, books were copied by hand.',
                answer: 'TRUE',
                keywords: ['before', 'books', 'copied', 'hand'],
                qualifier: null,
                explanation: 'The text directly states "books were painstakingly copied by hand" before the printing press.',
                trap: null
            }
        ]
    },
    {
        id: 2,
        passage: `Recent studies have shown that some species of dolphins possess remarkable problem-solving abilities. In controlled experiments, dolphins have demonstrated the capacity to understand abstract concepts and even recognize themselves in mirrors, a trait shared by only a few animal species including great apes and elephants. Researchers believe that the dolphins' large brain-to-body ratio may contribute to their cognitive sophistication, though the exact mechanisms behind their intelligence remain unclear.`,
        questions: [
            {
                id: 6,
                statement: 'All dolphins can recognize themselves in mirrors.',
                answer: 'NOT GIVEN',
                keywords: ['all dolphins', 'recognize', 'mirrors'],
                qualifier: 'all',
                explanation: 'The text says "some species of dolphins" possess these abilities, not all. Also, it doesn\'t say all individuals of those species can do it.',
                trap: 'qualifier'
            },
            {
                id: 7,
                statement: 'Elephants can recognize themselves in mirrors.',
                answer: 'TRUE',
                keywords: ['elephants', 'recognize', 'mirrors'],
                qualifier: null,
                explanation: 'The text explicitly includes elephants in the list of species that can recognize themselves in mirrors.',
                trap: null
            },
            {
                id: 8,
                statement: 'Scientists fully understand why dolphins are intelligent.',
                answer: 'FALSE',
                keywords: ['scientists', 'understand', 'why', 'intelligent'],
                qualifier: 'fully',
                explanation: 'The text says "the exact mechanisms behind their intelligence remain unclear," which contradicts "fully understand."',
                trap: null
            },
            {
                id: 9,
                statement: 'Dolphins have larger brains than humans.',
                answer: 'NOT GIVEN',
                keywords: ['dolphins', 'larger brains', 'humans'],
                qualifier: null,
                explanation: 'The text mentions dolphins have a "large brain-to-body ratio" but never compares their brain size to humans. Don\'t assume!',
                trap: 'inference'
            },
            {
                id: 10,
                statement: 'Only a few animal species can recognize themselves in mirrors.',
                answer: 'TRUE',
                keywords: ['only', 'few', 'animal species', 'mirrors'],
                qualifier: 'only a few',
                explanation: 'The text explicitly states this trait is "shared by only a few animal species."',
                trap: null
            }
        ]
    },
    {
        id: 3,
        passage: `Sleep deprivation has become a significant health concern in modern society. Research conducted over the past two decades has consistently shown that adults require between seven and nine hours of sleep per night to maintain optimal health. Chronic sleep deprivation has been linked to numerous health problems, including weakened immune function, increased risk of cardiovascular disease, and impaired cognitive performance. Studies have also revealed that sleep plays a crucial role in memory consolidation, with the brain processing and storing information gathered during waking hours while we sleep. Furthermore, sleep researchers have identified that the quality of sleep is just as important as the quantity, with deep sleep and REM sleep serving distinct and vital functions.`,
        questions: [
            {
                id: 11,
                statement: 'Most adults need seven to nine hours of sleep each night.',
                answer: 'TRUE',
                keywords: ['adults', 'seven', 'nine', 'hours', 'sleep'],
                qualifier: null,
                explanation: 'The text explicitly states "adults require between seven and nine hours of sleep per night." This confirms the statement.',
                trap: null
            },
            {
                id: 12,
                statement: 'Lack of sleep can cause heart disease.',
                answer: 'FALSE',
                keywords: ['lack of sleep', 'cause', 'heart disease'],
                qualifier: null,
                explanation: 'The text says sleep deprivation is "linked to" increased risk, not that it CAUSES heart disease. Correlation ≠ Causation. Linked to = associated with, not necessarily a direct cause.',
                trap: 'synonym'
            },
            {
                id: 13,
                statement: 'Sleep deprivation affects everyone in the same way.',
                answer: 'NOT GIVEN',
                keywords: ['sleep deprivation', 'affects', 'everyone', 'same way'],
                qualifier: 'everyone',
                explanation: 'The text discusses general effects of sleep deprivation but never mentions whether these effects are the same for all people or vary by individual.',
                trap: 'inference'
            },
            {
                id: 14,
                statement: 'The brain consolidates memories during sleep.',
                answer: 'TRUE',
                keywords: ['brain', 'consolidates', 'memories', 'sleep'],
                qualifier: null,
                explanation: 'The text states "sleep plays a crucial role in memory consolidation, with the brain processing and storing information" during sleep.',
                trap: null
            },
            {
                id: 15,
                statement: 'All types of sleep serve the same purpose.',
                answer: 'FALSE',
                keywords: ['all types', 'sleep', 'same purpose'],
                qualifier: 'all',
                explanation: 'The text explicitly states "deep sleep and REM sleep serving distinct and vital functions," meaning they serve DIFFERENT purposes, not the same.',
                trap: 'qualifier'
            }
        ]
    },
    {
        id: 4,
        passage: `Urban planning has evolved significantly since the industrial revolution. Early city planners focused primarily on infrastructure and sanitation, responding to the health crises caused by rapid urbanization. In the 20th century, the emphasis shifted toward automobile-centric design, with wide roads and suburban sprawl becoming the norm in many Western countries. However, in recent decades, there has been a growing movement toward sustainable urban development. Many cities are now prioritizing pedestrian-friendly spaces, public transportation networks, and green infrastructure. Copenhagen, for instance, has become a model for bicycle-friendly urban design, with over 60% of residents commuting by bike. Urban planners increasingly recognize that well-designed cities can reduce carbon emissions, improve public health, and enhance quality of life.`,
        questions: [
            {
                id: 16,
                statement: 'Early city planners were mainly concerned with infrastructure and sanitation.',
                answer: 'TRUE',
                keywords: ['early', 'city planners', 'infrastructure', 'sanitation'],
                qualifier: 'primarily',
                explanation: 'The text states "Early city planners focused primarily on infrastructure and sanitation," directly confirming the statement.',
                trap: null
            },
            {
                id: 17,
                statement: 'All Western countries adopted automobile-centric urban design in the 20th century.',
                answer: 'NOT GIVEN',
                keywords: ['all', 'Western countries', 'automobile-centric'],
                qualifier: 'all',
                explanation: 'The text says automobile-centric design became "the norm in many Western countries," not ALL. "Many" ≠ "All."',
                trap: 'qualifier'
            },
            {
                id: 18,
                statement: 'More than half of Copenhagen residents cycle to work.',
                answer: 'TRUE',
                keywords: ['Copenhagen', 'residents', 'cycle', 'work'],
                qualifier: 'over 60%',
                explanation: 'The text states "over 60% of residents commuting by bike." 60% is indeed more than half (50%).',
                trap: null
            },
            {
                id: 19,
                statement: 'Sustainable urban development improves the economy.',
                answer: 'NOT GIVEN',
                keywords: ['sustainable', 'urban development', 'improves', 'economy'],
                qualifier: null,
                explanation: 'The text mentions benefits like reduced emissions, improved health, and enhanced quality of life, but never mentions economic impact.',
                trap: 'inference'
            },
            {
                id: 20,
                statement: 'Copenhagen is the only city with bicycle-friendly design.',
                answer: 'FALSE',
                keywords: ['Copenhagen', 'only', 'city', 'bicycle-friendly'],
                qualifier: 'only',
                explanation: 'The text says Copenhagen "has become a model," implying other cities are following this model. It doesn\'t say it\'s the ONLY one.',
                trap: 'qualifier'
            }
        ]
    },
    {
        id: 5,
        passage: `Artificial intelligence has made remarkable progress in recent years, with machine learning algorithms now capable of performing tasks that were once thought to require human intelligence. Image recognition systems can now identify objects with accuracy rates exceeding 95%, while natural language processing models can generate coherent text that is often indistinguishable from human writing. Despite these advances, experts caution that current AI systems lack true understanding and operate based on pattern recognition rather than comprehension. The question of whether machines can ever achieve genuine consciousness remains highly debated among philosophers and neuroscientists. Some researchers argue that consciousness may emerge from sufficiently complex computational systems, while others maintain that human consciousness involves phenomena that cannot be replicated by machines. What is certain, however, is that AI will continue to transform industries ranging from healthcare to transportation.`,
        questions: [
            {
                id: 21,
                statement: 'Modern AI systems can recognize images with over 95% accuracy.',
                answer: 'TRUE',
                keywords: ['AI', 'image recognition', '95%', 'accuracy'],
                qualifier: 'over 95%',
                explanation: 'The text explicitly states "Image recognition systems can now identify objects with accuracy rates exceeding 95%."',
                trap: null
            },
            {
                id: 22,
                statement: 'Current AI systems truly understand what they are doing.',
                answer: 'FALSE',
                keywords: ['current AI', 'truly understand'],
                qualifier: null,
                explanation: 'The text clearly states "current AI systems lack true understanding and operate based on pattern recognition rather than comprehension."',
                trap: null
            },
            {
                id: 23,
                statement: 'All experts agree that machines will never achieve consciousness.',
                answer: 'FALSE',
                keywords: ['all experts', 'machines', 'never', 'consciousness'],
                qualifier: 'all',
                explanation: 'The text shows there is DEBATE: "Some researchers argue that consciousness may emerge" while "others maintain" it cannot. This contradicts "all experts agree."',
                trap: 'qualifier'
            },
            {
                id: 24,
                statement: 'AI-generated text is always detectable as non-human.',
                answer: 'FALSE',
                keywords: ['AI-generated text', 'always', 'detectable'],
                qualifier: 'always',
                explanation: 'The text says AI text is "often indistinguishable from human writing," which contradicts "always detectable."',
                trap: 'qualifier'
            },
            {
                id: 25,
                statement: 'AI will have a positive impact on the healthcare industry.',
                answer: 'NOT GIVEN',
                keywords: ['AI', 'positive', 'impact', 'healthcare'],
                qualifier: null,
                explanation: 'The text says AI "will continue to transform industries ranging from healthcare to transportation" but doesn\'t specify whether this transformation is positive or negative.',
                trap: 'inference'
            }
        ]
    }
];

export default function PracticeExercise() {
    const [currentPassage, setCurrentPassage] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [highlightKeywords, setHighlightKeywords] = useState(true);
    const { updateXP } = useUserStore();

    const passage = PRACTICE_QUESTIONS[currentPassage];

    const handleAnswerChange = (questionId: number, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        triggerHaptic('selection');
    };

    const handleSubmit = () => {
        setShowResults(true);

        // Calculate score
        const correct = passage.questions.filter(
            (q) => answers[q.id] === q.answer
        ).length;

        const xpGained = correct * 15; // 15 XP per correct TFNG answer
        updateXP(xpGained);

        triggerHaptic('success');
    };

    const handleReset = () => {
        setAnswers({});
        setShowResults(false);
        triggerHaptic('selection');
    };

    const handleNextPassage = () => {
        setCurrentPassage((prev) => (prev + 1) % PRACTICE_QUESTIONS.length);
        setAnswers({});
        setShowResults(false);
        triggerHaptic('selection');
    };

    const correctCount = passage.questions.filter(
        (q) => answers[q.id] === q.answer
    ).length;

    // Highlight keywords in passage
    const highlightedPassage = highlightKeywords
        ? passage.passage
        : passage.passage;

    return (
        <div className="practice-exercise">
            {/* Feature Toggle */}
            <div className="feature-toggle">
                <label className="toggle-label">
                    <input
                        type="checkbox"
                        checked={highlightKeywords}
                        onChange={(e) => setHighlightKeywords(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-text">
                        <Sparkles size={16} />
                        Qualifier Highlighter
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
                <div className="passage-text">
                    {highlightedPassage}
                </div>
            </motion.div>

            {/* Questions */}
            <div className="practice-questions">
                <h3>Questions {passage.questions[0].id}-{passage.questions[passage.questions.length - 1].id}</h3>
                <p className="question-instruction">
                    Do the following statements agree with the information in the passage?
                </p>
                <p className="question-instruction-detail">
                    Write <strong>TRUE</strong> if the statement agrees with the information,
                    <strong>FALSE</strong> if it contradicts, or <strong>NOT GIVEN</strong> if there is no information.
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
                            {question.trap && showResults && (
                                <div className="trap-badge">
                                    <AlertCircle size={14} />
                                    {question.trap === 'qualifier' && 'Qualifier Trap'}
                                    {question.trap === 'inference' && 'Inference Trap'}
                                    {question.trap === 'synonym' && 'Synonym Trap'}
                                </div>
                            )}
                        </div>

                        <div className="question-text">{question.statement}</div>

                        {highlightKeywords && !showResults && (
                            <div className="keyword-hint">
                                <strong>Keywords:</strong> {question.keywords.join(', ')}
                                {question.qualifier && (
                                    <span className="qualifier-alert"> ⚠️ Watch the qualifier: "{question.qualifier}"</span>
                                )}
                            </div>
                        )}

                        <div className="answer-options">
                            {['TRUE', 'FALSE', 'NOT GIVEN'].map((option) => (
                                <label
                                    key={option}
                                    className={`answer-option ${answers[question.id] === option ? 'selected' : ''}`}
                                >
                                    <input
                                        type="radio"
                                        name={`question-${question.id}`}
                                        value={option}
                                        checked={answers[question.id] === option}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                        disabled={showResults}
                                    />
                                    <span>{option}</span>
                                    {showResults && option === question.answer && (
                                        <Check size={16} className="correct-indicator" />
                                    )}
                                    {showResults && option === answers[question.id] && option !== question.answer && (
                                        <X size={16} className="incorrect-indicator" />
                                    )}
                                </label>
                            ))}
                        </div>

                        {showResults && (
                            <div className={`explanation ${answers[question.id] === question.answer ? 'correct-exp' : 'incorrect-exp'}`}>
                                <strong>
                                    {answers[question.id] === question.answer ? '✓ Correct!' : '✗ Incorrect'}
                                </strong>
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
                            <div className="result-stat-value gradient-text">+{correctCount * 15}</div>
                        </div>
                        <div className="result-stat">
                            <div className="result-stat-label">Progress</div>
                            <div className="result-stat-value">
                                {currentPassage + 1}/{PRACTICE_QUESTIONS.length} Passages
                            </div>
                        </div>
                    </div>

                    <div className="result-actions">
                        <button className="btn-secondary" onClick={handleReset}>
                            Retry This Passage
                        </button>
                        {currentPassage < PRACTICE_QUESTIONS.length - 1 && (
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
