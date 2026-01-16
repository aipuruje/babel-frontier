import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '@/utils/telegram';
import { useUserStore } from '@/store/userStore';

// Cognitive load scenarios with decision-making challenges
const COGNITIVE_SCENARIOS = [
    {
        id: 1,
        title: "Fatigue Simulation: Question 28-32",
        description: "You're at the 45-minute mark. Mental fatigue is setting in. Apply cognitive load strategies.",
        passage: "The phenomenon of urban heat islands has become increasingly concerning as cities expand globally. Metropolitan areas can be 1-7°C warmer than surrounding rural regions due to heat-absorbing surfaces like asphalt and concrete, reduced vegetation, and anthropogenic heat from vehicles and air conditioning systems. Studies in Singapore revealed that strategic tree planting reduced surface temperatures by up to 5°C in targeted zones. However, implementation faces challenges: mature trees require 15-20 years to provide maximum cooling benefits, and underground utility networks often restrict root space. Some urban planners advocate for 'cool roofs' with reflective coatings as a faster alternative, though their effectiveness diminishes in humid climates where moisture absorption negates reflective benefits.",
        questions: [
            {
                id: 1,
                text: "Urban areas are always 7 degrees warmer than rural areas.",
                correctAnswer: "FALSE",
                explanation: "The text says cities 'CAN BE 1-7°C warmer'—this is a range, not a constant. 'Always 7 degrees' is an overstatement."
            },
            {
                id: 2,
                text: "Tree planting provides immediate cooling benefits.",
                correctAnswer: "FALSE",
                explanation: "Trees need '15-20 years to provide MAXIMUM cooling benefits'—not immediate."
            },
            {
                id: 3,
                text: "Cool roofs work best in dry climates.",
                correctAnswer: "NOT GIVEN",
                explanation: "The text says effectiveness 'diminishes in HUMID climates,' implying they work better when not humid, but 'best in dry climates' is not explicitly stated."
            }
        ],
        cognitiveChallenge: "decision-fatigue",
        loadFactor: "high"
    },
    {
        id: 2,
        title: "Bond Market Crisis: Economic Complexity",
        description: "Dense fiscal terminology challenges working memory. Extract key facts without full comprehension.",
        passage: "According to The Economist's 'World Ahead 2026' report, rich countries face growing risk of bond-market crisis due to unsustainable debt levels and continued spending beyond their means. Bond markets have become skittish as investors demand greater compensation for absorbing increasing government debt. US government borrowing approaches 6 percent of GDP, indicating significant fiscal challenge. Declining birth rates and increasing life expectancy narrow the tax base in developed countries, putting additional pressure on public finances concerning social security. Demographic trends combined with unpredictable global landscape necessitate significant increases in defense spending. While global inflation is projected to fall to 3.1 percent in 2026, concerns remain that it could rekindle, limiting central banks' scope to cut rates further. Long-term interest rates globally have moved higher even in heavily indebted nations like Japan, UK, Germany, France, and US, reflecting that debts and deficits now matter to bond investors who are not entirely convinced by central bank narratives.",
        questions: [
            {
                id: 4,
                text: "US government borrowing exceeds 6 percent of GDP.",
                correctAnswer: "FALSE",
                explanation: "Text says borrowing 'APPROACHES' 6%—this means it's close to but hasn't exceeded 6%. 'Exceeds' is an overstatement."
            },
            {
                id: 5,
                text: "Central banks will cut rates in 2026.",
                correctAnswer: "NOT GIVEN",
                explanation: "Text says rate cuts may be LIMITED if inflation rekindles, but doesn't confirm whether cuts will actually happen."
            },
            {
                id: 6,
                text: "Bond investors are skeptical of central bank messaging.",
                correctAnswer: "TRUE",
                explanation: "Text explicitly states investors are 'not entirely convinced by central bank narratives'—this is skepticism."
            }
        ],
        cognitiveChallenge: "information-overload",
        loadFactor: "high"
    },
    {
        id: 3,
        title: "Permafrost Climate Threat: Causal Chains",
        description: "Track multiple cause-effect relationships. Avoid confusing correlation with causation.",
        passage: "Thawing permafrost beneath Arctic lakes poses surprise climate threat by releasing potent greenhouse gases. Phenomenon known as 'abrupt thaw' rapidly melts thick permafrost layers beneath thermokarst lakes formed by thawing permafrost itself. This process can occur over decades, significantly accelerating carbon release compared to gradual thawing. Emissions from expanding Yedoma-type thermokarst lakes contribute between 30 and 90 million metric tons of carbon annually, comparable to substantial portion of global passenger vehicle emissions. Methane released is particularly concerning due to its high global warming potential, being approximately 30 times more potent than carbon dioxide in trapping heat. Some studies suggest greenhouse gas load from rapid thaw beneath Arctic lake beds could more than double emissions expected from gradually thawing terrestrial permafrost. This creates dangerous positive feedback loop: increased methane and carbon dioxide release raises global temperatures, which causes more permafrost to thaw, intensifying additional greenhouse gas release in self-reinforcing cycle.",
        questions: [
            {
                id: 7,
                text: "Thermokarst lakes annually emit 90 million tons of carbon.",
                correctAnswer: "FALSE",
                explanation: "Text says emissions 'CONTRIBUTE BETWEEN 30 and 90 million tons'—it's a range, not a fixed 90M figure."
            },
            {
                id: 8,
                text: "Methane is more dangerous to climate than carbon dioxide.",
                correctAnswer: "TRUE",
                explanation: "Text states methane is '30 times more potent than CO2 in trapping heat'—explicitly more dangerous."
            },
            {
                id: 9,
                text: "Current climate models accurately predict permafrost emissions.",
                correctAnswer: "NOT GIVEN",
                explanation: "Text mentions the threat has been 'underestimated' but doesn't specify whether CURRENT models are now accurate."
            }
        ],
        cognitiveChallenge: "choice-paralysis",
        loadFactor: "high"
    },
    {
        id: 4,
        title: "Ancient Script Decipherment: Historical Details",
        description: "Track dates, names, and methods. Don't confuse successful vs. failed decipherments.",
        passage: "Decoding lost scripts remains complex endeavor shedding light on forgotten civilizations. Most famous breakthrough used bilingual inscriptions like Rosetta Stone, which contained same decree in Egyptian hieroglyphs, Demotic script, and Ancient Greek, allowing scholars to use known Greek text to decipher other two. Jean-François Champollion deciphered hieroglyphs in 1820s using this method. Linear B was deciphered by Michael Ventris and John Chadwick in 1950s, revealing it as early form of Greek. However, numerous scripts remain undeciphered: Linear A (ancient Minoan civilization script from Crete), Indus Script (Harappan civilization, lacking bilingual Rosetta Stone equivalent), and Voynich Manuscript (15th-century document with unknown author and script). Advanced imaging techniques like CT scans are being used to virtually unroll damaged ancient texts. Artificial intelligence increasingly assists by analyzing vast databases, identifying patterns, and even restoring illegible texts, accelerating decipherment process significantly.",
        questions: [
            {
                id: 10,
                text: "Champollion deciphered hieroglyphs in the 1950s.",
                correctAnswer: "FALSE",
                explanation: "Text says Champollion did it in the 1820s. The 1950s is when Linear B was deciphered by Ventris/Chadwick."
            },
            {
                id: 11,
                text: "Linear A has been successfully deciphered.",
                correctAnswer: "FALSE",
                explanation: "Linear A is listed among scripts that 'remain UNDECIPHERED'—it hasn't been decoded."
            },
            {
                id: 12,
                text: "The Indus Script was written in an early form of Greek.",
                correctAnswer: "NOT GIVEN",
                explanation: "Text says Indus Script remains undeciphered and lacks a Rosetta Stone. Linear B was Greek, but there's no claim about Indus."
            }
        ],
        cognitiveChallenge: "information-overload",
        loadFactor: "medium"
    },
    {
        id: 5,
        title: "UV Light Immune Therapy: Scientific Mechanisms",
        description: "Distinguish between mechanisms, correlations, and speculative treatments.",
        passage: "Sunlight and ultraviolet light offer surprising immune system benefits, particularly for those with Multiple Sclerosis. UV radiation powerfully suppresses immune system, affecting not only skin but systemic immunity. Mechanism works by influencing circulation of immune cells, specifically T cells, by trapping them in lymph nodes. This prevents cells contributing to MS immune response from entering bloodstream and causing damage, similar to some current MS medications. UV exposure increases sphingosine-1-phosphate levels in lymph nodes and reduces S1P receptor on T cells, hindering their exit from lymph nodes. Populations living in regions with higher UV exposure, such as those closer to Equator, tend to have lower MS incidence. Greater lifetime sun exposure can reduce risk of developing MS and positively influence disease course in early stages. While sunlight crucial for vitamin D synthesis, studies suggest immune benefits of UV light extend beyond just vitamin D production through other biological pathways. Narrowband UV-B light therapy, historically used for skin conditions like psoriasis, is now investigated for treating systemic autoimmune diseases. However, excessive sun exposure carries known risks including increased skin cancer risk.",
        questions: [
            {
                id: 13,
                text: "UV light benefits work only through vitamin D production.",
                correctAnswer: "FALSE",
                explanation: "Text says immune benefits 'extend BEYOND just vitamin D production through other biological pathways'—not only vitamin D."
            },
            {
                id: 14,
                text: "Equatorial populations have lower Multiple Sclerosis rates.",
                correctAnswer: "TRUE",
                explanation: "Text explicitly states 'populations closer to Equator tend to have lower MS incidence'—direct statement."
            },
            {
                id: 15,
                text: "UV-B therapy has FDA approval for treating MS.",
                correctAnswer: "NOT GIVEN",
                explanation: "Text says therapy is 'NOW INVESTIGATED' for autoimmune diseases but doesn't mention FDA approval or confirmed treatment status."
            }
        ],
        cognitiveChallenge: "decision-fatigue",
        loadFactor: "high"
    },
    {
        id: 6,
        title: "Fast Food Industry: Social Commentary",
        description: "Separate factual claims from author's opinions and value judgments.",
        passage: "Eric Schlosser's 'Fast Food Nation' meticulously dissects industrial food system using fast-food industry as primary lens. Book argues that fast food's rise has profoundly reshaped how American food is produced, marketed, and consumed with far-reaching negative consequences. Central argument is that fast-food corporations prioritize bottom line above public health, worker welfare, and environmental sustainability. Book exposes harsh realities faced by workers throughout industrial food supply chain, including exploitative labor practices in fast-food restaurants employing vulnerable populations like teenagers and immigrants, offering low wages and poor working conditions. Schlosser details dangerous conditions in meatpacking plants where workers suffer high injury rates due to demand for fast production. Industrial scale of food production facilitates rapid spread of foodborne pathogens like E. coli, with ground beef outbreaks occurring due to centralized processing. Book links fast food consumption to national epidemic of obesity and health problems, emphasizing low nutritional value and high fat content. Companies employ manipulative marketing strategies particularly targeting children. Published in 2001, book's arguments have proven prescient as recent reports continue linking ultra-processed foods to heart disease, cancer, diabetes, and mental health disorders.",
        questions: [
            {
                id: 16,
                text: "Fast Food Nation was published in 2001.",
                correctAnswer: "TRUE",
                explanation: "Text explicitly states 'Published in 2001'—direct factual claim."
            },
            {
                id: 17,
                text: "All fast-food workers are teenagers or immigrants.",
                correctAnswer: "FALSE",
                explanation: "Text says restaurants employ 'vulnerable populations LIKE teenagers and immigrants'—these are examples, not the only workers."
            },
            {
                id: 18,
                text: "Schlosser worked in the fast-food industry before writing the book.",
                correctAnswer: "NOT GIVEN",
                explanation: "The text describes what Schlosser wrote but never states his employment history or background before authorship."
            }
        ],
        cognitiveChallenge: "choice-paralysis",
        loadFactor: "medium"
    },
    {
        id: 7,
        title: "Helicoprion: Paleontological Reconstruction",
        description: "Track scientific progress. Distinguish confirmed facts from historical misconceptions.",
        passage: "Prehistoric marine animal Helicoprion renowned for distinctive 'buzz saw' jaws, which were actually unique spiral-shaped tooth whorl embedded in lower jaw. While often called 'shark,' it was not true shark but rather shark-like cartilaginous fish more closely related to modern chimaeras (ratfishes or ghost sharks). Tooth whorl, from which genus gets name 'spiral saw,' was highly specialized for capturing and slicing soft-bodied prey such as squid. For many years, exact placement and function of bizarre dental structure puzzled scientists, with early reconstructions placing it in various locations including snout or even dorsal fin. However, advanced imaging techniques including CT scans in 2013 confirmed tooth whorl was situated at back of lower jaw. Fossil evidence primarily consists of these unique tooth whorls, as cartilaginous skeleton rarely preserved over millions of years. First documented specimen discovered in Kazakhstan in late 19th century and named by Russian geologist Alexander Karpinsky in 1899. Helicoprion inhabited oceans from approximately 290 to 225 million years ago, spanning Permian and Triassic periods. It ultimately became extinct around 225 million years ago during Permian-Triassic extinction event, often called 'Great Dying,' which led to demise of roughly 96 percent of all marine species.",
        questions: [
            {
                id: 19,
                text: "Helicoprion is classified as a true shark species.",
                correctAnswer: "FALSE",
                explanation: "Text explicitly states it 'was NOT true shark but rather shark-like cartilaginous fish' related to chimaeras."
            },
            {
                id: 20,
                text: "The tooth whorl's location was confirmed using CT scans.",
                correctAnswer: "TRUE",
                explanation: "Text states 'CT scans in 2013 confirmed tooth whorl was situated at back of lower jaw'—explicit confirmation."
            },
            {
                id: 21,
                text: "Karpinsky discovered the first Helicoprion fossil in 1899.",
                correctAnswer: "FALSE",
                explanation: "Text says specimen was 'DISCOVERED in late 19th century and NAMED by Karpinsky in 1899'—he named it, not discovered it."
            }
        ],
        cognitiveChallenge: "information-overload",
        loadFactor: "medium"
    },
    {
        id: 8,
        title: "AI in Science: Reproducibility vs. Efficiency",
        description: "Balance competing claims. Recognize both benefits and concerns about same technology.",
        passage: "Artificial intelligence significantly impacts scientific research landscape, offering solutions to save time and money while addressing reproducibility crisis. AI can process vast amounts of data quickly, accelerating discovery across various fields. In medical research, AI revolutionizes drug discovery by analyzing large datasets to identify potential candidates and optimize clinical trial designs, reducing time and cost of bringing new drugs to market. Scientific community faces 'reproducibility crisis' where many published results are difficult or impossible to reproduce, leading to substantial financial losses undermining trust. AI algorithms can predict likely replicability of studies with high accuracy by analyzing research paper text, helping scientists and funding agencies assess research strength. However, concerns exist that AI itself could exacerbate reproducibility crisis due to issues like biased models, lack of generalizability, and limited transparency of 'black box' algorithms. Regarding peer review, AI can automate tasks including reviewer selection, manuscript screening, plagiarism detection, and accuracy checks. Studies indicate AI technology can reduce peer review duration significantly. While AI cannot fully replicate nuanced analysis and critical thinking of human reviewers, it can provide quantitative support and lessen administrative burden.",
        questions: [
            {
                id: 22,
                text: "AI has eliminated the reproducibility crisis in science.",
                correctAnswer: "FALSE",
                explanation: "Text says AI 'COULD EXACERBATE' the crisis due to biased models and black box algorithms—it hasn't eliminated it."
            },
            {
                id: 23,
                text: "AI can predict which studies are likely to be replicable.",
                correctAnswer: "TRUE",
                explanation: "Text states 'AI algorithms can predict likely replicability of studies with HIGH ACCURACY'—explicit capability."
            },
            {
                id: 24,
                text: "Human peer reviewers will be completely replaced by AI.",
                correctAnswer: "NOT GIVEN",
                explanation: "Text says AI 'CANNOT fully replicate nuanced analysis' of humans but can support them. Full replacement isn't discussed."
            }
        ],
        cognitiveChallenge: "decision-fatigue",
        loadFactor: "high"
    },
    {
        id: 9,
        title: "Choice Overload: Multiple Similar Options",
        description: "Practice eliminating extraneous cognitive load when faced with similar answer choices.",
        passage: "Blockchain technology's potential extends far beyond cryptocurrency. Supply chain management represents one promising application: IBM's Food Trust network tracks products from farm to consumer, recording each transaction on an immutable ledger. When contaminated romaine lettuce caused illness outbreaks in 2018, traditional tracking systems required weeks to identify the source. With blockchain, Walmart traced contaminated produce to its origin in seconds. Despite these advantages, widespread adoption faces hurdles. Implementation costs can exceed five million dollars for large corporations, and smaller suppliers often lack the technical infrastructure to participate. Interoperability between different blockchain systems remains problematic.",
        questions: [
            {
                id: 25,
                text: "Blockchain is only useful for cryptocurrency.",
                correctAnswer: "FALSE",
                explanation: "The opening sentence says potential 'extends FAR BEYOND cryptocurrency'—explicit contradiction."
            },
            {
                id: 26,
                text: "Walmart's blockchain system cost five million dollars.",
                correctAnswer: "NOT GIVEN",
                explanation: "The text says implementation 'CAN EXCEED' $5M for large corporations, but doesn't specify Walmart's actual cost."
            },
            {
                id: 27,
                text: "Different blockchain systems cannot communicate with each other.",
                correctAnswer: "TRUE",
                explanation: "Text states 'interoperability between different blockchain systems remains problematic'—they can't communicate effectively."
            }
        ],
        cognitiveChallenge: "choice-paralysis",
        loadFactor: "medium"
    },
    {
        id: 10,
        title: "Information Overload: Dense Technical Text",
        description: "Extract only what's needed. Don't try to understand everything.",
        passage: "Neuroplasticity—the brain's ability to reorganize neural pathways—was once thought to cease in early adulthood. However, research by Dr. Eleanor Maguire on London taxi drivers challenged this assumption. Drivers who spent years navigating the city's 25,000 streets showed significantly enlarged hippocampi compared to control groups. The enlargement correlated directly with years of experience, suggesting continuous neuronal adaptation throughout life. Remarkably, retired drivers experienced hippocampal reduction, indicating plasticity works bidirectionally. These findings have implications for stroke recovery and age-related cognitive decline, though translating spatial navigation benefits to other cognitive domains remains uncertain.",
        questions: [
            {
                id: 28,
                text: "Scientists previously believed neuroplasticity stopped in childhood.",
                correctAnswer: "FALSE",
                explanation: "Text says it was 'thought to cease in EARLY ADULTHOOD'—not childhood."
            },
            {
                id: 29,
                text: "London has 25,000 streets.",
                correctAnswer: "TRUE",
                explanation: "Explicitly stated: drivers navigated 'the city's 25,000 streets.'"
            },
            {
                id: 30,
                text: "Spatial navigation training can improve all types of cognitive function.",
                correctAnswer: "NOT GIVEN",
                explanation: "Text says 'translating benefits to OTHER cognitive domains remains UNCERTAIN'—not confirmed or denied."
            }
        ],
        cognitiveChallenge: "information-overload",
        loadFactor: "high"
    }
];

export default function PracticeExercise() {
    const [currentScenario, setCurrentScenario] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [timeSpent, setTimeSpent] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const { updateXP } = useUserStore();

    const scenario = COGNITIVE_SCENARIOS[currentScenario];

    const startScenario = () => {
        setIsTimerRunning(true);
        setTimeSpent(0);
        triggerHaptic('selection');

        const interval = setInterval(() => {
            setTimeSpent((prev) => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 1;
            });
        }, 1000);
    };

    const handleAnswerChange = (questionId: number, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        triggerHaptic('selection');
    };

    const handleSubmit = () => {
        setIsTimerRunning(false);
        setShowResults(true);

        const correct = scenario.questions.filter(
            (q) => answers[q.id] === q.correctAnswer
        ).length;

        // Bonus XP for completing under 90 seconds (good cognitive efficiency)
        const bonusXP = timeSpent <= 90 ? 10 : 0;
        const baseXP = correct * 20;
        updateXP(baseXP + bonusXP);

        triggerHaptic('success');
    };

    const handleReset = () => {
        setAnswers({});
        setShowResults(false);
        setTimeSpent(0);
        setIsTimerRunning(false);
        triggerHaptic('selection');
    };

    const handleNextScenario = () => {
        setCurrentScenario((prev) => (prev + 1) % COGNITIVE_SCENARIOS.length);
        setAnswers({});
        setShowResults(false);
        setTimeSpent(0);
        setIsTimerRunning(false);
        triggerHaptic('selection');
    };

    const correctCount = scenario.questions.filter(
        (q) => answers[q.id] === q.correctAnswer
    ).length;

    return (
        <div className="practice-exercise">
            <div className="scenario-header">
                <div className="scenario-title">
                    <Brain size={24} />
                    <h3>{scenario.title}</h3>
                </div>
                <div className="scenario-meta">
                    <div className={`load-badge load-${scenario.loadFactor}`}>
                        {scenario.loadFactor.toUpperCase()} LOAD
                    </div>
                    <div className="challenge-badge">
                        {scenario.cognitiveChallenge.replace('-', ' ').toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="scenario-description">
                <AlertTriangle size={18} />
                <p>{scenario.description}</p>
            </div>

            {!isTimerRunning && !showResults && (
                <motion.button
                    className="start-scenario-btn"
                    onClick={startScenario}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Clock size={20} />
                    Start 90-Second Challenge
                </motion.button>
            )}

            {isTimerRunning && (
                <>
                    <div className="timer-bar">
                        <div className="timer-label">
                            <Clock size={18} />
                            Time: {timeSpent}s / 90s
                        </div>
                        <div className="timer-progress">
                            <div
                                className="timer-fill"
                                style={{ width: `${(timeSpent / 90) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="passage-box">
                        <h4>Passage:</h4>
                        <p className="passage-text">{scenario.passage}</p>
                    </div>

                    <div className="questions-section">
                        <h4>Questions: TRUE / FALSE / NOT GIVEN</h4>
                        {scenario.questions.map((question) => (
                            <div key={question.id} className="question-card cognitive">
                                <div className="question-number">Q{question.id}</div>
                                <div className="question-text">{question.text}</div>

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
                            </div>
                        ))}

                        {Object.keys(answers).length === scenario.questions.length && (
                            <motion.button
                                className="btn-submit"
                                onClick={handleSubmit}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                Complete Scenario
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
                    <h3>Cognitive Performance Report</h3>

                    <div className="performance-grid">
                        <div className="performance-item">
                            <div className="perf-label">Accuracy</div>
                            <div className={`perf-value ${correctCount === scenario.questions.length ? 'perfect' : correctCount >= 2 ? 'good' : 'needs-work'}`}>
                                {correctCount}/{scenario.questions.length}
                            </div>
                        </div>

                        <div className="performance-item">
                            <div className="perf-label">Time Efficiency</div>
                            <div className={`perf-value ${timeSpent <= 90 ? 'good' : 'needs-work'}`}>
                                {timeSpent}s
                            </div>
                            {timeSpent <= 90 && <div className="perf-badge">⚡ Efficient!</div>}
                            {timeSpent > 90 && <div className="perf-badge">⚠️ Over time</div>}
                        </div>
                    </div>

                    <div className="answers-review">
                        <h4>Answer Analysis:</h4>
                        {scenario.questions.map((question) => (
                            <div
                                key={question.id}
                                className={`answer-review ${answers[question.id] === question.correctAnswer ? 'correct' : 'incorrect'}`}
                            >
                                <div className="review-header">
                                    <span>Q{question.id}: {question.text}</span>
                                    {answers[question.id] === question.correctAnswer ? (
                                        <CheckCircle size={20} className="check-icon" />
                                    ) : (
                                        <XCircle size={20} className="x-icon" />
                                    )}
                                </div>
                                <div className="review-answer">
                                    <strong>Correct Answer:</strong> {question.correctAnswer}
                                    {answers[question.id] !== question.correctAnswer && (
                                        <span className="your-answer"> (You answered: {answers[question.id]})</span>
                                    )}
                                </div>
                                <div className="review-explanation">{question.explanation}</div>
                            </div>
                        ))}
                    </div>

                    <div className="cognitive-tips">
                        <h4>💡 Cognitive Load Tip:</h4>
                        {scenario.cognitiveChallenge === 'decision-fatigue' && (
                            <p>When fatigued, trust your first instinct. Over-thinking depletes remaining cognitive resources.</p>
                        )}
                        {scenario.cognitiveChallenge === 'choice-paralysis' && (
                            <p>Eliminate obviously wrong options first. Choosing between 2 options uses 60% less mental energy than 4.</p>
                        )}
                        {scenario.cognitiveChallenge === 'information-overload' && (
                            <p>Don't try to understand everything. Extract ONLY the information needed for the questions.</p>
                        )}
                    </div>

                    <div className="results-stats">
                        <div className="result-stat">
                            <div className="result-stat-label">XP Earned</div>
                            <div className="result-stat-value gradient-text">
                                +{correctCount * 20 + (timeSpent <= 90 ? 10 : 0)}
                            </div>
                            {timeSpent <= 90 && <div className="bonus-note">(+10 speed bonus)</div>}
                        </div>
                        <div className="result-stat">
                            <div className="result-stat-label">Progress</div>
                            <div className="result-stat-value">
                                {currentScenario + 1}/{COGNITIVE_SCENARIOS.length} Scenarios
                            </div>
                        </div>
                    </div>

                    <div className="result-actions">
                        <button className="btn-secondary" onClick={handleReset}>
                            Retry Scenario
                        </button>
                        {currentScenario < COGNITIVE_SCENARIOS.length - 1 && (
                            <button className="btn-primary" onClick={handleNextScenario}>
                                Next Scenario →
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
