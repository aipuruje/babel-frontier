import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Check, X, Clock } from 'lucide-react';
import { triggerHaptic } from '@/utils/telegram';
import { useUserStore } from '@/store/userStore';

// Timed reading passages with comprehension questions
const READING_PASSAGES = [
    {
        id: 1,
        title: "The Rise of Vertical Farming",
        wordCount: 245,
        text: "Urban agriculture has entered a new era with the advent of vertical farming—growing crops in vertically stacked layers within controlled indoor environments. Singapore, a nation with limited arable land, has become a global leader in this technology. Sky Greens, the world's first commercial vertical farm, produces vegetables using rotating hydroponic towers that maximize sunlight exposure while minimizing water usage. These systems use 95% less water than traditional farming and eliminate the need for pesticides. As urban populations swell and climate change threatens conventional agriculture, vertical farms offer a sustainable solution for food security in cities.",
        questions: [
            {
                id: 1,
                question: "Vertical farming uses more water than traditional farming.",
                answer: "FALSE",
                explanation: "The text states vertical farming uses 95% LESS water than traditional farming."
            },
            {
                id: 2,
                question: "Singapore has limited farmland.",
                answer: "TRUE",
                explanation: "The text explicitly mentions Singapore has 'limited arable land,' which is why they pioneered vertical farming."
            },
            {
                id: 3,
                question: "Sky Greens produces rice.",
                answer: "NOT GIVEN",
                explanation: "The text says Sky Greens 'produces vegetables' but never mentions rice specifically."
            }
        ]
    },
    {
        id: 2,
        title: "Sleep Deprivation and Memory",
        wordCount: 268,
        text: "Neuroscientific research has revealed a critical link between sleep and memory consolidation. During deep sleep stages, the brain replays neural patterns from daytime experiences, transferring information from temporary hippocampal storage to long-term cortical memory. A 2019 study at UC Berkeley found that participants who slept for eight hours after learning new information retained 40% more details than those who stayed awake. Chronic sleep deprivation disrupts this consolidation process, impairing both the encoding of new memories and the recall of existing ones. The researchers concluded that even a single night of poor sleep can reduce cognitive performance by up to 30%, with cumulative effects worsening over time.",
        questions: [
            {
                id: 4,
                question: "The hippocampus stores long-term memories.",
                answer: "FALSE",
                explanation: "The text says the hippocampus provides TEMPORARY storage, while the cortex handles long-term memory."
            },
            {
                id: 5,
                question: "Eight hours of sleep improved memory retention by 40%.",
                answer: "TRUE",
                explanation: "The UC Berkeley study explicitly found this 40% improvement with 8-hour sleep."
            },
            {
                id: 6,
                question: "One night of poor sleep reduces performance by 30%.",
                answer: "TRUE",
                explanation: "The text states 'even a single night of poor sleep can reduce cognitive performance by up to 30%.'"
            }
        ]
    },
    {
        id: 3,
        title: "Microplastics in the Ocean",
        wordCount: 289,
        text: "Microplastics—plastic fragments smaller than 5 millimeters—have emerged as a pervasive environmental threat. A 2020 study estimated that 24.4 trillion pieces of microplastics are floating in the world's oceans, weighing approximately 82,000 to 578,000 tons. These particles originate from the breakdown of larger plastic waste, synthetic clothing fibers, and microbeads in personal care products. Marine organisms mistake microplastics for food, leading to bioaccumulation up the food chain. Research has detected microplastics in 100% of sampled sea turtles and in 73% of fish species in the North Atlantic. More alarmingly, microplastics have been found in human blood, lungs, and even placentas, though the health implications remain uncertain. Scientists warn that without intervention, ocean microplastic pollution could triple by 2040.",
        questions: [
            {
                id: 7,
                question: "All sea turtles sampled contained microplastics.",
                answer: "TRUE",
                explanation: "The text states '100% of sampled sea turtles' contained microplastics—that means all of them."
            },
            {
                id: 8,
                question: "Microplastics cause cancer in humans.",
                answer: "NOT GIVEN",
                explanation: "The text says 'health implications remain uncertain'—no specific diseases like cancer are mentioned."
            },
            {
                id: 9,
                question: "Microplastic pollution will triple by 2040.",
                answer: "FALSE",
                explanation: "The text says pollution 'COULD triple'—this is a prediction, not a certainty. The question states it as fact."
            }
        ]
    },
    {
        id: 4,
        title: "The Scientific Publishing Crisis",
        wordCount: 267,
        text: "Academic scientists face an unprecedented publishing crisis. Analysis by Clarivate's Institute for Scientific Information reveals that research studies indexed on the Web of Science database rose by 48 percent, from 1.71 million to 2.53 million, between 2015 and 2024. Dr. Mark Hanson at the University of Exeter describes how researchers are increasingly overwhelmed by this volume. The demands of peer review, where academics volunteer time to vet each other's work, are now so intense that journal editors struggle to find willing experts. One recent study found that in 2020 alone, academics globally spent more than 100 million hours peer reviewing papers for journals. For US experts, this amounted to more than 1.5 billion dollars of free labor. The publish-or-perish culture incentivizes researchers to chase metrics rather than quality. They might run easier studies, hype eye-catching results, or split findings across multiple papers. Open access publishing, while democratizing research, creates perverse incentives. Between 2015 and 2018, researchers globally paid over one billion dollars in publication fees to the five major academic publishers. Some Swiss publishers now invite submissions to over 3,000 special issues for a single journal at 2,600 pounds per article. This has led to record retractions, predatory journals, and AI-generated fake papers contaminating scientific literature. As Venki Ramakrishnan, former Royal Society president and Nobel laureate, noted: 'Everybody agrees that the system is kind of broken and unsustainable, but nobody really knows what to do about it.'",
        questions: [
            {
                id: 10,
                question: "Scientific paper volume increased by nearly half between 2015 and 2024.",
                answer: "TRUE",
                explanation: "The text states papers rose by 48 percent, from 1.71M to 2.53M—48% is nearly half (50%)."
            },
            {
                id: 11,
                question: "Peer review costs journals more than 1.5 billion dollars annually.",
                answer: "FALSE",
                explanation: "The text says this is the value of FREE LABOR donated by academics, not a cost to journals. Journals get this work for free."
            },
            {
                id: 12,
                question: "The Royal Society has proposed a solution to the publishing crisis.",
                answer: "NOT GIVEN",
                explanation: "Ramakrishnan says 'nobody knows what to do about it,' but the text doesn't state whether the Royal Society specifically proposed solutions."
            }
        ]
    },
    {
        id: 5,
        title: "Urban River Restoration for Healthier Communities",
        wordCount: 258,
        text: "Restoring riverbanks is proving crucial for fostering healthier urban communities by improving ecosystems and human well-being. Medellín's award-winning Green Corridors project exemplifies this approach. Previously barren areas along 12 waterways and 18 roads were revitalized, transforming concrete walls into vertical gardens and replacing scrubland with native trees and palms. These created interconnected networks of green spaces, pavements, and cycle routes encouraging active lifestyles. Dr. Alejandro Restrepo-Montoya, who directed strategic urban projects in Medellín, noted that the river served as a starting point for integrating nature into the city. Over 30 million square meters of urban projects now incorporate local flora and fauna to create healthier urban environments. Beyond urban settings, allowing riparian zones in agricultural areas to recover yields significant benefits. Moving boundary fences away from river edges by even small distances enables regeneration of wet woodlands, attracts wetland birds and attracts wildfowl, and allows rivers to expand naturally. Experts link access to nature directly to physical and mental well-being. Communities with more natural, wild rivers where wildlife like beavers are encouraged show greater understanding of nature and are healthier and happier. When rivers thrive, communities gain safeguarded natural habitats, enhanced climate resilience, and improved quality of life. BBC Earth's 'Changing Planet: River Restoration' series showcases hopeful stories of global river revitalization, including the largest salmon restoration project in the American West and the Seine River's transformation in Paris.",
        questions: [
            {
                id: 13,
                question: "Medellín's project covered 12 waterways.",
                answer: "TRUE",
                explanation: "The text explicitly states the Green Corridors involved '12 waterways and 18 roads.'"
            },
            {
                id: 14,
                question: "Over 30 million urban residents benefit from Medellín's project.",
                answer: "FALSE",
                explanation: "The text says '30 million square METERS' of urban projects—this is area measurement, not number of residents."
            },
            {
                id: 15,
                question: "Beavers were reintroduced to all restored river communities.",
                answer: "NOT GIVEN",
                explanation: "The text mentions communities 'where wildlife like beavers are encouraged' but doesn't specify reintroduction or 'all' communities."
            }
        ]
    },
    {
        id: 6,
        title: "Deep-Sea 'Hot Tubs' Accelerate Octopus Reproduction",
        wordCount: 271,
        text: "Scientists have discovered that deep-sea hydrothermal vents act as crucial nurseries for octopus mothers, dramatically accelerating egg development. In the 'Octopus Garden' off the coast of Central California, thousands of pearl octopuses congregate near thermal springs warmed by volcanic activity. This behavior, documented by deep-sea ecologist Jim Barry and his team from the Monterey Bay Aquarium Research Institute in collaboration with BBC Earth's 'Planet Earth III' series, represents the largest known octopus nesting site on the planet. Normally, in near-freezing deep-sea waters, octopus egg incubation can require up to 10 years. However, the warmer temperatures provided by these thermal springs reduce hatching time to approximately two years or even less. This acceleration is vital because octopus mothers typically do not leave their eggs to feed during brooding and die shortly after offspring hatch. By shortening the vulnerable brooding period, warm waters improve eggs' survival chances while reducing the mother's prolonged starvation exposure. The discovery challenges conventional understanding of octopus behavior, as these creatures are generally solitary. Yet the evolutionary advantage of faster development near thermal vents outweighs typical territorial instincts. The congregation demonstrates how marine species exploit environmental features for reproductive success. These findings have implications for understanding deep-sea ecosystem dynamics and how animals adapt to extreme environments. The research also highlights the importance of protecting these unique habitats, as disruption to thermal vent systems could eliminate critical breeding grounds for vulnerable deep-sea species.",
        questions: [
            {
                id: 16,
                question: "Thermal springs reduce octopus egg incubation from 10 years to 2 years.",
                answer: "TRUE",
                explanation: "The text states normal incubation 'can require up to 10 years' but thermal springs 'reduce hatching time to approximately two years.'"
            },
            {
                id: 17,
                question: "Octopus mothers feed during the brooding period.",
                answer: "FALSE",
                explanation: "The text explicitly states mothers 'typically do NOT leave their eggs to feed during brooding.'"
            },
            {
                id: 18,
                question: "The Octopus Garden is the only deep-sea thermal nesting site.",
                answer: "NOT GIVEN",
                explanation: "The text says it's 'the largest known' nesting site but doesn't state whether others exist or if it's the only one."
            }
        ]
    },
    {
        id: 7,
        title: "Open Access Publishing and Perverse Incentives",
        wordCount: 264,
        text: "Open access publishing promised to democratize scientific knowledge by making research freely available beyond paywalls. While it successfully disseminates findings to broader audiences, the business model has created concerning incentives. Authors pay article processing charges, often reaching 10,000 pounds per paper, to make their work freely accessible online. Between 2015 and 2018, researchers globally paid over one billion dollars in such fees to the five major publishers: Elsevier, Sage, Springer Nature, Taylor and Francis, and Wiley. This revenue model encourages commercial publishers to maximize paper volume rather than quality. Some launch numerous journals or solicit contributions for vast numbers of special issues. One Swiss publisher, MDPI, invites submissions to over 3,000 special issues for a single journal, charging 2,600 pounds per article. The Swiss National Science Foundation now refuses to fund publication fees for special issues amid quality concerns. These unhelpful incentives contribute to record retractions, the rise of predatory journals that publish anything for fees, and the emergence of AI-generated studies and 'paper mills' selling fake papers to unscrupulous researchers. All contaminate scientific literature and risk damaging public trust in science. Dr. Mark Hanson warns that the far greater danger by volume is genuine but uninteresting, uninformative research that drains resources. He believes the strain could be substantially alleviated if funding agencies required work they support to be published only in non-profit journals. The challenge lies in reforming a system where career advancement depends on publication quantity rather than quality.",
        questions: [
            {
                id: 19,
                question: "Researchers paid over 1 billion dollars to five publishers in three years.",
                answer: "TRUE",
                explanation: "The text states 'between 2015 and 2018' (3 years), researchers paid 'over one billion dollars' to the big five publishers."
            },
            {
                id: 20,
                question: "Open access publishing has damaged public trust in science.",
                answer: "FALSE",
                explanation: "The text says fake papers and contamination 'RISK damaging trust'—it's a potential future consequence, not stated fact."
            },
            {
                id: 21,
                question: "Most funding agencies now require non-profit journal publication.",
                answer: "NOT GIVEN",
                explanation: "Hanson BELIEVES this would help and SUGGESTS funding agencies should do this, but the text doesn't state they actually have."
            }
        ]
    },
    {
        id: 8,
        title: "The Globalization of Scientific Research",
        wordCount: 269,
        text: "The scientific research landscape has undergone radical transformation, quadrupling in size over the past 25 years and becoming far more globally distributed. Long dominated by Western countries, research leadership has shifted dramatically, with China now surpassing the United States in contributions to prestigious journals like Nature and Science. Ritu Dhand, chief scientific officer at Springer Nature, rejects narratives of greedy publishers exploiting this expansion. She argues that the digital age facilitates unlimited publication capacity and questions whether limiting global research output is desirable. Her proposed solution involves better filtering, improved search tools and alerts to help researchers identify truly significant work, combined with global expansion of peer reviewer pools to absorb increased demand. However, critics maintain that volume itself creates problems. Andre Geim, a Nobel laureate at the University of Manchester, believes researchers publish too many useless papers and that the scientific community lacks flexibility to abandon declining research subjects where little new can be learned. He notes that after reaching critical mass, research communities become self-perpetuating due to emotional and financial interests of those involved. Despite disagreements about causes and solutions, there is consensus that current practices are unsustainable. Venki Ramakrishnan suggests technology may ultimately resolve some challenges, predicting that AI agents will eventually write papers while other AI agents read, analyze, and produce summaries for humans. Whether this vision represents salvation or further degradation of scientific discourse remains hotly debated among researchers concerned about maintaining research integrity in an era of exponential information growth.",
        questions: [
            {
                id: 22,
                question: "Scientific research has quadrupled in 25 years.",
                answer: "TRUE",
                explanation: "The text explicitly states the research landscape 'quadrupled in size over the past 25 years.'"
            },
            {
                id: 23,
                question: "China produces more Nature and Science articles than the US.",
                answer: "TRUE",
                explanation: "The text states China is 'now surpassing the United States in contributions to prestigious journals like Nature and Science.'"
            },
            {
                id: 24,
                question: "All researchers agree AI will improve scientific publishing.",
                answer: "FALSE",
                explanation: "Ramakrishnan predicts AI's role, but the text ends saying 'whether this vision represents salvation or further degradation remains HOTLY DEBATED'—not agreement."
            }
        ]
    }
];

export default function PracticeExercise() {
    const [currentPassage, setCurrentPassage] = useState(0);
    const [isReading, setIsReading] = useState(false);
    const [hasRead, setHasRead] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [readingTime, setReadingTime] = useState<number>(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    const { updateXP } = useUserStore();

    const passage = READING_PASSAGES[currentPassage];

    const startReading = () => {
        setIsReading(true);
        setStartTime(Date.now());
        triggerHaptic('selection');
    };

    const finishReading = () => {
        if (startTime) {
            const elapsed = (Date.now() - startTime) / 1000; // seconds
            setReadingTime(elapsed);
            setIsReading(false);
            setHasRead(true);
            triggerHaptic('success');
        }
    };

    const calculateWPM = () => {
        if (readingTime === 0) return 0;
        return Math.round((passage.wordCount / readingTime) * 60);
    };

    const handleAnswerChange = (questionId: number, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        triggerHaptic('selection');
    };

    const handleSubmit = () => {
        setShowResults(true);

        const correct = passage.questions.filter(
            (q) => answers[q.id] === q.answer
        ).length;

        const comprehensionRate = (correct / passage.questions.length) * 100;
        const wpm = calculateWPM();

        // XP based on both speed and comprehension
        let xpGained = 0;
        if (wpm >= 250 && comprehensionRate >= 67) {
            xpGained = correct * 30; // Bonus for good speed + comprehension
        } else {
            xpGained = correct * 20; // Standard XP
        }

        updateXP(xpGained);
        triggerHaptic('success');
    };

    const handleReset = () => {
        setIsReading(false);
        setHasRead(false);
        setStartTime(null);
        setReadingTime(0);
        setAnswers({});
        setShowResults(false);
        triggerHaptic('selection');
    };

    const handleNextPassage = () => {
        setCurrentPassage((prev) => (prev + 1) % READING_PASSAGES.length);
        setIsReading(false);
        setHasRead(false);
        setStartTime(null);
        setReadingTime(0);
        setAnswers({});
        setShowResults(false);
        triggerHaptic('selection');
    };

    const correctCount = passage.questions.filter(
        (q) => answers[q.id] === q.answer
    ).length;

    const wpm = calculateWPM();
    const comprehensionRate = (correctCount / passage.questions.length) * 100;

    return (
        <div className="practice-exercise">
            {/* Reading Section */}
            {!hasRead && (
                <div className="reading-section">
                    <div className="passage-header">
                        <h3>{passage.title}</h3>
                        <div className="word-count">{passage.wordCount} words</div>
                    </div>

                    {!isReading && (
                        <motion.button
                            className="start-reading-btn"
                            onClick={startReading}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Play size={20} />
                            Start Timed Reading
                        </motion.button>
                    )}

                    {isReading && (
                        <motion.div
                            className="reading-active"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="timer-display">
                                <Clock size={24} />
                                Reading...
                            </div>

                            <div className="reading-text">
                                {passage.text}
                            </div>

                            <button className="finish-reading-btn" onClick={finishReading}>
                                I Finished Reading
                            </button>

                            <div className="reading-tip">
                                💡 Read at your natural pace. Don't skim—maintain comprehension!
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Questions Section */}
            {hasRead && !showResults && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="speed-metrics">
                        <div className="metric-card">
                            <div className="metric-label">Your Speed</div>
                            <div className="metric-value">{wpm} WPM</div>
                            <div className="metric-target">
                                Target: 250+ WPM
                            </div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-label">Reading Time</div>
                            <div className="metric-value">{readingTime.toFixed(1)}s</div>
                            <div className="metric-target">
                                {passage.wordCount} words
                            </div>
                        </div>
                    </div>

                    <div className="comprehension-section">
                        <h3>Comprehension Check</h3>
                        <p className="instruction">
                            Answer these questions based on what you just read. TRUE/FALSE/NOT GIVEN.
                        </p>

                        {passage.questions.map((question) => (
                            <div key={question.id} className="question-card">
                                <div className="question-number">Q{question.id - passage.questions[0].id + 1}</div>
                                <div className="question-text">{question.question}</div>

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

                        {Object.keys(answers).length === passage.questions.length && (
                            <motion.button
                                className="btn-submit"
                                onClick={handleSubmit}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                Check Answers
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Results */}
            {showResults && (
                <motion.div
                    className="results-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3>Performance Report</h3>

                    <div className="performance-grid">
                        <div className="performance-item">
                            <div className="perf-label">Reading Speed</div>
                            <div className={`perf-value ${wpm >= 250 ? 'good' : 'needs-work'}`}>
                                {wpm} WPM
                            </div>
                            {wpm >= 350 && <div className="perf-badge">🔥 Excellent!</div>}
                            {wpm >= 250 && wpm < 350 && <div className="perf-badge">👍 Good</div>}
                            {wpm < 250 && <div className="perf-badge">⚠️ Practice More</div>}
                        </div>

                        <div className="performance-item">
                            <div className="perf-label">Comprehension</div>
                            <div className={`perf-value ${comprehensionRate >= 67 ? 'good' : 'needs-work'}`}>
                                {comprehensionRate.toFixed(0)}%
                            </div>
                            {comprehensionRate === 100 && <div className="perf-badge">💯 Perfect!</div>}
                            {comprehensionRate >= 67 && comprehensionRate < 100 && <div className="perf-badge">✓ Solid</div>}
                            {comprehensionRate < 67 && <div className="perf-badge">⚠️ Too Fast</div>}
                        </div>
                    </div>

                    <div className="answers-review">
                        <h4>Answer Review:</h4>
                        {passage.questions.map((question) => (
                            <div key={question.id} className={`answer-review ${answers[question.id] === question.answer ? 'correct' : 'incorrect'}`}>
                                <div className="review-header">
                                    <span>Q{question.id - passage.questions[0].id + 1}: {question.question}</span>
                                    {answers[question.id] === question.answer ? (
                                        <Check size={20} className="check-icon" />
                                    ) : (
                                        <X size={20} className="x-icon" />
                                    )}
                                </div>
                                <div className="review-answer">
                                    <strong>Correct Answer:</strong> {question.answer}
                                </div>
                                <div className="review-explanation">
                                    {question.explanation}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="results-stats">
                        <div className="result-stat">
                            <div className="result-stat-label">XP Earned</div>
                            <div className="result-stat-value gradient-text">
                                +{wpm >= 250 && comprehensionRate >= 67 ? correctCount * 30 : correctCount * 20}
                            </div>
                        </div>
                        <div className="result-stat">
                            <div className="result-stat-label">Progress</div>
                            <div className="result-stat-value">
                                {currentPassage + 1}/{READING_PASSAGES.length} Passages
                            </div>
                        </div>
                    </div>

                    <div className="result-actions">
                        <button className="btn-secondary" onClick={handleReset}>
                            Retry This Passage
                        </button>
                        {currentPassage < READING_PASSAGES.length - 1 && (
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
