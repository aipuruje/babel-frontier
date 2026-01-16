import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Brain, CheckCircle, XCircle, Zap, AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '@/utils/telegram';
import { useUserStore } from '@/store/userStore';

// Passage 3-level texts (high lexical density, complex academic register)
const PASSAGE3_TEXTS = [
    {
        id: 1,
        title: "The Anthropocene Debate: Geological Epoch or Cultural Construct?",
        wordCount: 687,
        passage: `The proposition that humanity has ushered in a new geological epoch—the Anthropocene—represents one of contemporary science's most contentious debates. While the term, popularized by atmospheric chemist Paul Crutzen in 2000, has achieved widespread circulation in academic discourse, the International Commission on Stratigraphy has yet to officially ratify it as a formal chronostratigraphic unit. This hesitation stems not from denial of human impact on Earth systems, but from fundamental disagreements about stratigraphic markers and temporal boundaries.

Proponents argue that multiple concurrent signals—elevated atmospheric CO2 concentrations, radionuclide distribution from nuclear testing, microplastic sedimentation, and unprecedented biodiversity loss—constitute a clear stratigraphic signature distinguishable in future rock records. The Anthropocene Working Group proposes 1950 as the optimal boundary marker, coinciding with the "Great Acceleration" of industrial activity and nuclear weapons testing. They contend that plutonium-239 isotopes, globally distributed in mid-century, provide the kind of isochronous marker geologists traditionally require.

Critics, however, challenge this framework on multiple fronts. Some argue that diachronous human impacts—beginning with Neolithic agriculture 10,000 years ago or intensifying during the Industrial Revolution—defy the synchronous boundaries typically demarcating geological epochs. Others question whether anthropogenic changes, however dramatic, meet the magnitude threshold established by previous epoch transitions. The Holocene-Pleistocene boundary, for instance, corresponded to fundamental reorganization of global climate systems and biosphere composition over millennia, not decades.

Moreover, the debate extends beyond stratigraphic technicalities into epistemological territory. Critics suggest the Anthropocene concept conflates geological and historical timescales, importing anthropocentric narratives into Earth system science. They note that while human activity demonstrably alters biogeochemical cycles, framing this as an "epoch" may be premature—current changes might represent merely a brief "event" within the Holocene, analogous to the 8,200-year climate anomaly.

The controversy also encompasses political dimensions. Some scholars argue that universalizing "human" agency obscures differential responsibility: the carbon emissions and resource extraction driving putative Anthropocene markers disproportionately originate from industrialized nations and wealthy demographics, not humanity writ large. This has prompted alternative framings like "Capitalocene" or "Plantationocene," emphasizing specific economic systems rather than species-level causation.

Interestingly, the scientific deadlock hasn't diminished the term's cultural resonance. The Anthropocene has proliferated across humanities and social sciences as a conceptual framework for understanding human-nature relationships, regardless of its stratigraphic validity. This bifurcation—between geological formalism and cultural metaphor—itself reveals tensions about disciplinary boundaries and the relationship between scientific classification and public discourse.`,
        questions: [
            {
                id: 1,
                type: "TFNG",
                text: "The International Commission on Stratigraphy disputes the scale of human impact on Earth systems.",
                correctAnswer: "FALSE",
                explanation: "Text states hesitation stems 'not from denial of human impact' but from disagreements about markers and boundaries—they accept the impact."
            },
            {
                id: 2,
                type: "TFNG",
                text: "The Anthropocene Working Group suggests 1950 as the epoch boundary due to nuclear testing.",
                correctAnswer: "TRUE",
                explanation: "Text explicitly states they 'propose 1950 as optimal boundary marker, coinciding with...nuclear weapons testing' and plutonium-239 distribution."
            },
            {
                id: 3,
                type: "TFNG",
                text: "All geological epochs have been defined by synchronous global events.",
                correctAnswer: "NOT GIVEN",
                explanation: "Text mentions epochs are 'typically' demarcated by synchronous boundaries, but doesn't claim ALL epochs follow this pattern."
            },
            {
                id: 4,
                type: "TFNG",
                text: "The Holocene-Pleistocene transition occurred over thousands of years.",
                correctAnswer: "TRUE",
                explanation: "Text states it 'corresponded to fundamental reorganization...over millennia, not decades'—millennia = thousands of years."
            },
            {
                id: 5,
                type: "Multiple Choice",
                text: "According to critics, what is a key problem with the 1950 boundary date?",
                options: [
                    "It ignores nuclear weapons testing",
                    "Human impacts began earlier and varied by region",
                    "It conflicts with the Great Acceleration",
                    "Plutonium isotopes are unreliable markers"
                ],
                correctAnswer: 1,
                explanation: "Critics argue 'diachronous human impacts—beginning with Neolithic agriculture...or Industrial Revolution—defy synchronous boundaries.' Earlier + varied = option 2."
            }
        ],
        difficulty: "extreme",
        cognitiveLoad: "high"
    },
    {
        id: 2,
        title: "Quantum Coherence in Biological Systems: Paradigm or Artifact?",
        wordCount: 653,
        passage: `The possibility that quantum mechanical phenomena play functional roles in biological processes represents a provocative intersection of physics and life sciences. While quantum effects necessarily occur at molecular scales, the question is whether evolution has exploited quantum coherence—the superposition of states characteristic of quantum systems—for biological advantage, or whether such observations merely reflect experimental artifacts in non-physiological conditions.

The seminal hypothesis emerged from photosynthetic light-harvesting research. Conventional models assumed energy transfer between chromophores followed incoherent hopping mechanisms, but 2007 spectroscopic studies on Fenna-Matthews-Olson (FMO) protein complexes revealed long-lived quantum coherence at physiological temperatures. This challenged prevailing assumptions that thermal noise in warm, wet biological environments would rapidly decohere quantum states, limiting coherence lifetimes to femtoseconds.

Proponents interpret these findings as evidence that photosynthetic apparatus exploits quantum coherence to achieve near-perfect (>95%) energy transfer efficiency. The hypothesis posits that excitonic energy simultaneously samples multiple pathways in quantum superposition, effectively "testing" routes before collapsing to the optimal transfer pathway. This quantum walk mechanism could explain why photosynthesis exhibits efficiency exceeding classical predictions.

However, methodological critiques have proliferated. Skeptics note that many coherence observations derive from cryogenic conditions or isolated protein complexes, not functioning cells. They argue that coherence signatures might represent ground-state vibrational coherence—a quantum effect, but not relevant to biological function. Recent studies suggesting coherence persists in vivo remain controversial, with critics questioning whether spectroscopic techniques can definitively distinguish quantum coherence from classical oscillations in such noisy environments.

The debate extends to proposed quantum effects in avian magnetoreception, olfaction, and even neural microtubules. While radical pair mechanisms in magnetoreception have substantial empirical support, claims of quantum consciousness in microtubules face severe skepticism. Critics emphasize that demonstrating quantum effects exist is insufficient—one must show they provide functional advantages that natural selection could act upon, and that they operate reliably in biological temperature and timescale ranges.

Fundamentally, the controversy reflects broader questions about biological complexity. Does life merely tolerate quantum effects, or has evolution engineered quantum coherence as a computational resource? The answer likely varies across systems. While olfaction and consciousness claims remain speculative, photosynthetic quantum effects appear increasingly plausible, suggesting a more nuanced picture where quantum biology is neither ubiquitous nor absent, but contextually emergent in systems where quantum advantages outweigh decoherence costs.`,
        questions: [
            {
                id: 6,
                type: "TFNG",
                text: "The FMO protein research was conducted at room temperature.",
                correctAnswer: "NOT GIVEN",
                explanation: "Text says coherence was observed 'at physiological temperatures' but doesn't specify if the 2007 study itself used room temp or if critics cite non-physiological conditions."
            },
            {
                id: 7,
                type: "TFNG",
                text: "Photosynthesis achieves over 95% energy transfer efficiency.",
                correctAnswer: "TRUE",
                explanation: "Text explicitly states photosynthetic apparatus achieve 'near-perfect (>95%) energy transfer efficiency'—direct claim."
            },
            {
                id: 8,
                type: "TFNG",
                text: "All proposed quantum biological effects have equal empirical support.",
                correctAnswer: "FALSE",
                explanation: "Text states 'radical pair mechanisms have substantial empirical support' while microtubule claims 'face severe skepticism'—not equal support."
            },
            {
                id: 9,
                type: "Matching",
                text: "Match the concern to the appropriate quantum biology hypothesis:",
                pairs: [
                    { premise: "Requires demonstration of evolutionary advantage", answer: "All quantum biology claims" },
                    { premise: "May be ground-state vibrational effect rather than functional", answer: "Photosynthetic coherence" },
                    { premise: "Has substantial empirical support", answer: "Avian magnetoreception" }
                ],
                correctAnswer: ["All quantum biology claims", "Photosynthetic coherence", "Avian magnetoreception"],
                explanation: "Text states critics emphasize showing 'functional advantages that natural selection could act upon' (applies to all), 'ground-state vibrational coherence' critique for photosynthesis, and 'substantial empirical support' for magnetoreception."
            }
        ],
        difficulty: "extreme",
        cognitiveLoad: "very-high"
    }
];

export default function PracticeExercise() {
    const [currentPassage, setCurrentPassage] = useState(0);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [showResults, setShowResults] = useState(false);
    const [timeSpent, setTimeSpent] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const { updateXP } = useUserStore();

    const passage = PASSAGE3_TEXTS[currentPassage];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimeSpent((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const startPassage = () => {
        setHasStarted(true);
        setIsTimerRunning(true);
        setTimeSpent(0);
        triggerHaptic('selection');
    };

    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        triggerHaptic('selection');
    };

    const handleSubmit = () => {
        setIsTimerRunning(false);
        setShowResults(true);

        const correct = passage.questions.filter((q) => {
            if (q.type === "Multiple Choice") {
                return answers[q.id] === q.correctAnswer;
            }
            return answers[q.id] === q.correctAnswer;
        }).length;

        // Bonus XP for completing under 22 minutes (Passage 3 target)
        const timeBonus = timeSpent <= 22 * 60 ? 20 : 0;
        const baseXP = correct * 30;
        updateXP(baseXP + timeBonus);

        triggerHaptic('success');
    };

    const handleReset = () => {
        setAnswers({});
        setShowResults(false);
        setTimeSpent(0);
        setIsTimerRunning(false);
        setHasStarted(false);
        triggerHaptic('selection');
    };

    const handleNextPassage = () => {
        setCurrentPassage((prev) => (prev + 1) % PASSAGE3_TEXTS.length);
        setAnswers({});
        setShowResults(false);
        setTimeSpent(0);
        setIsTimerRunning(false);
        setHasStarted(false);
        triggerHaptic('selection');
    };

    const correctCount = passage.questions.filter((q) => {
        if (q.type === "Multiple Choice") {
            return answers[q.id] === q.correctAnswer;
        }
        return answers[q.id] === q.correctAnswer;
    }).length;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="practice-exercise">
            <div className="passage-header">
                <div className="passage-title">
                    <Brain size={24} />
                    <div>
                        <h3>{passage.title}</h3>
                        <div className="passage-meta">
                            <span className={`difficulty-badge ${passage.difficulty}`}>
                                {passage.difficulty.toUpperCase()}
                            </span>
                            <span className="word-count">{passage.wordCount} words</span>
                            <span className={`cognitive-badge ${passage.cognitiveLoad}`}>
                                {passage.cognitiveLoad.toUpperCase()} LOAD
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {!hasStarted && !showResults && (
                <div className="start-container">
                    <div className="protocol-reminder">
                        <h4>🎯 Apply the 4-Step Protocol:</h4>
                        <ol>
                            <li><strong>Micro-Break:</strong> Take 3 deep breaths</li>
                            <li><strong>Question Triage:</strong> Scan LOW → MEDIUM → HIGH cost</li>
                            <li><strong>Aggressive Skim:</strong> 3 minutes max for passage structure</li>
                            <li><strong>Surgical Strike:</strong> 90-second rule per question</li>
                        </ol>
                    </div>
                    <motion.button
                        className="start-passage-btn"
                        onClick={startPassage}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Zap size={20} />
                        Begin Passage 3 Challenge (22 min target)
                    </motion.button>
                </div>
            )}

            {hasStarted && !showResults && (
                <>
                    <div className="timer-display">
                        <Clock size={20} />
                        <span className={timeSpent > 22 * 60 ? 'overtime' : ''}>
                            Time: {formatTime(timeSpent)} / 22:00
                        </span>
                        {timeSpent > 22 * 60 && (
                            <span className="overtime-warning">
                                <AlertTriangle size={16} /> OVERTIME
                            </span>
                        )}
                    </div>

                    <div className="passage-content">
                        <h4>Passage:</h4>
                        <p className="passage-text">{passage.passage}</p>
                    </div>

                    <div className="questions-section">
                        <h4>Questions ({passage.questions.length} total):</h4>
                        {passage.questions.map((question) => (
                            <div key={question.id} className="question-card passage3">
                                <div className="question-header">
                                    <span className="question-number">Q{question.id}</span>
                                    <span className="question-type">{question.type}</span>
                                </div>
                                <div className="question-text">{question.text}</div>

                                {question.type === "TFNG" && (
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
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {question.type === "Multiple Choice" && (
                                    <div className="answer-options">
                                        {'options' in question && question.options?.map((option: string, idx: number) => (
                                            <label
                                                key={idx}
                                                className={`answer-option mc ${answers[question.id] === idx ? 'selected' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${question.id}`}
                                                    value={idx}
                                                    checked={answers[question.id] === idx}
                                                    onChange={() => handleAnswerChange(question.id, idx)}
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {Object.keys(answers).length === passage.questions.length && (
                            <motion.button
                                className="btn-submit"
                                onClick={handleSubmit}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                Submit Answers
                            </motion.button>
                        )}
                    </div>
                </>
            )}

            {showResults && (
                <motion.div
                    className="results-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3>Passage 3 Performance Report</h3>

                    <div className="performance-grid">
                        <div className="performance-item">
                            <div className="perf-label">Accuracy</div>
                            <div className={`perf-value ${correctCount >= 4 ? 'good' : 'needs-work'}`}>
                                {correctCount}/{passage.questions.length}
                                <div className="perf-percentage">
                                    ({Math.round((correctCount / passage.questions.length) * 100)}%)
                                </div>
                            </div>
                        </div>

                        <div className="performance-item">
                            <div className="perf-label">Time Management</div>
                            <div className={`perf-value ${timeSpent <= 22 * 60 ? 'good' : 'needs-work'}`}>
                                {formatTime(timeSpent)}
                            </div>
                            {timeSpent <= 22 * 60 ? (
                                <div className="perf-badge success">✅ Within target!</div>
                            ) : (
                                <div className="perf-badge warning">⚠️ {Math.floor((timeSpent - 22 * 60) / 60)}min over</div>
                            )}
                        </div>
                    </div>

                    <div className="answers-review">
                        <h4>Detailed Analysis:</h4>
                        {passage.questions.map((question) => {
                            const isCorrect = question.type === "Multiple Choice"
                                ? answers[question.id] === question.correctAnswer
                                : answers[question.id] === question.correctAnswer;

                            return (
                                <div
                                    key={question.id}
                                    className={`answer-review ${isCorrect ? 'correct' : 'incorrect'}`}
                                >
                                    <div className="review-header">
                                        <span>Q{question.id} ({question.type}): {question.text}</span>
                                        {isCorrect ? (
                                            <CheckCircle size={20} className="check-icon" />
                                        ) : (
                                            <XCircle size={20} className="x-icon" />
                                        )}
                                    </div>
                                    <div className="review-answer">
                                        <strong>Correct Answer:</strong>{' '}
                                        {question.type === "Multiple Choice" && 'options' in question && question.options
                                            ? question.options[question.correctAnswer as number]
                                            : String(question.correctAnswer)}
                                    </div>
                                    <div className="review-explanation">{question.explanation}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="results-stats">
                        <div className="result-stat">
                            <div className="result-stat-label">XP Earned</div>
                            <div className="result-stat-value gradient-text">
                                +{correctCount * 30 + (timeSpent <= 22 * 60 ? 20 : 0)}
                            </div>
                            {timeSpent <= 22 * 60 && <div className="bonus-note">(+20 time bonus)</div>}
                        </div>
                        <div className="result-stat">
                            <div className="result-stat-label">Progress</div>
                            <div className="result-stat-value">
                                {currentPassage + 1}/{PASSAGE3_TEXTS.length} Passages
                            </div>
                        </div>
                    </div>

                    <div className="result-actions">
                        <button className="btn-secondary" onClick={handleReset}>
                            Retry Passage
                        </button>
                        {currentPassage < PASSAGE3_TEXTS.length - 1 && (
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
