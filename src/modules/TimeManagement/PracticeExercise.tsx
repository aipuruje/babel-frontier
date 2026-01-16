import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Pause, RotateCcw, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '@/utils/telegram';
import { useUserStore } from '@/store/userStore';

interface Question {
    id: number;
    question: string;
    type: string;
    answer: string;
    explanation: string;
}

interface Passage {
    id: number;
    title: string;
    text: string;
    wordCount: number;
    targetTime: number; // in seconds
    questions: Question[];
}

// Sample IELTS passages for practice
const PRACTICE_PASSAGES: Passage[] = [
    {
        id: 1,
        title: "The History of Timekeeping",
        wordCount: 245,
        targetTime: 6 * 60,
        text: `The measurement of time has been a crucial aspect of human civilization since ancient times. Early humans relied on natural phenomena such as the movement of the sun and the changing seasons to organize their activities. The development of more sophisticated timekeeping devices marked a significant advancement in human progress.

The earliest known timekeeping devices were sundials, which used the position of the sun's shadow to indicate the time of day. Ancient Egyptians are credited with creating some of the first sundials around 1500 BCE. However, these devices had obvious limitations—they were useless at night or on cloudy days.

The invention of mechanical clocks in medieval Europe revolutionized timekeeping. The first mechanical clocks, appearing in the 13th century, were large tower clocks that served entire communities. These early clocks were not particularly accurate, often losing or gaining several minutes per day. The introduction of the pendulum by Christiaan Huygens in 1656 dramatically improved accuracy, reducing errors to less than one minute per day.

The development of portable timepieces began in the 16th century with the creation of the first pocket watches. These devices, powered by springs rather than weights, allowed individuals to carry time with them. The subsequent miniaturization of these mechanisms eventually led to the creation of wristwatches in the early 20th century.`,
        questions: [
            {
                id: 1,
                question: "Sundials could not function during nighttime.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The passage explicitly states sundials 'were useless at night or on cloudy days.'"
            },
            {
                id: 2,
                question: "The first mechanical clocks were extremely accurate.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The passage says early mechanical clocks 'were not particularly accurate, often losing or gaining several minutes per day.'"
            },
            {
                id: 3,
                question: "Pocket watches were invented before pendulum clocks.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "Pendulum clocks were introduced in 1656, while pocket watches appeared in the 16th century (1500s)."
            },
            {
                id: 4,
                question: "Wristwatches became popular in the 19th century.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The passage states wristwatches were created in the 'early 20th century,' not the 19th."
            },
            {
                id: 5,
                question: "Ancient Egyptians created sundials around 1500 BCE.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "This is stated directly: 'Ancient Egyptians are credited with creating some of the first sundials around 1500 BCE.'"
            }
        ]
    },
    {
        id: 6,
        title: "The Lancet Countdown: Health Impacts of Climate Change",
        wordCount: 312,
        targetTime: 8 * 60,
        text: `The Lancet Countdown's 2026 report reveals alarming evidence of global backsliding on climate commitments, with direct and measurable consequences for human health. Published in October 2025, the study documents a troubling correlation between rising global temperatures and surging rates of vector-borne diseases, heat-related mortality, and food insecurity.

The report highlights that heat-related deaths among vulnerable populations increased by 68% between 2000 and 2024, with elderly populations experiencing the most significant impact. Agricultural productivity has declined in 103 countries due to extreme heat exposure, threatening food security for an estimated 520 million people worldwide. The geographic range of disease-carrying mosquitoes has expanded dramatically, with dengue fever transmission zones now documented in regions previously considered climatically unsuitable, including parts of southern Europe and high-altitude areas in East Africa.

Particulate matter from wildfires—events whose frequency and intensity have tripled since 2005—contributed to an additional 37,000 premature deaths in 2024 alone. The economic burden of climate-related health impacts now exceeds $820 billion annually, consuming approximately 1.2% of global GDP. Low-income nations bear disproportionate costs despite contributing minimally to historical emissions.

The report employs sophisticated data visualization techniques, including flowcharts illustrating the causal pathways from carbon emissions to health outcomes, and diagrams labeling the interconnected systems affected by climate change—from agricultural disruption to mental health crises in climate-displaced populations. Despite these stark findings, fossil fuel subsidies increased by 4% in 2024, contradicting international climate commitments. The researchers conclude that reversing these health trends requires immediate, coordinated action to limit warming to 1.5°C above pre-industrial levels, a target that current policies will miss by a significant margin.`,
        questions: [
            {
                id: 1,
                question: "Heat-related deaths increased by 68% among all age groups between 2000 and 2024.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The passage states heat-related deaths increased by 68% among 'vulnerable populations,' with elderly people experiencing the 'most significant impact'—not all age groups equally."
            },
            {
                id: 2,
                question: "Dengue fever has spread to southern Europe according to the report.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The passage explicitly states dengue transmission zones are 'now documented in regions previously considered climatically unsuitable, including parts of southern Europe.'"
            },
            {
                id: 3,
                question: "Wildfire frequency has tripled since 2005.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The text states: 'Particulate matter from wildfires—events whose frequency and intensity have tripled since 2005.'"
            },
            {
                id: 4,
                question: "Climate-related health costs exceed $1 trillion annually.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The passage states the economic burden 'now exceeds $820 billion annually,' which is less than $1 trillion."
            },
            {
                id: 5,
                question: "The report predicts achieving the 1.5°C warming target.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The researchers conclude that 'current policies will miss' the 1.5°C target 'by a significant margin'—the opposite of achieving it."
            },
            {
                id: 6,
                question: "Agricultural productivity declined in over 100 countries due to extreme heat.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The passage states 'Agricultural productivity has declined in 103 countries due to extreme heat exposure,' which is over 100."
            }
        ]
    },
    {
        id: 7,
        title: "As an Idea, the 'Anthropocene' Era Is Dead",
        wordCount: 328,
        targetTime: 8 * 60,
        text: `In November 2025, prominent earth scientists published a provocative critique arguing that the "Anthropocene"—the proposed geological epoch defined by human impact on Earth's geology and ecosystems—is scientifically untenable and should be abandoned as a formal stratigraphic designation.

The controversy centers on fundamental disagreements about temporal boundaries and stratigraphic markers. Proponents of the Anthropocene concept typically propose 1950 as the epoch's starting point, coinciding with the "Great Acceleration" of industrialization and nuclear weapons testing. They argue that plutonium isotopes from mid-century atomic tests provide a globally synchronous marker visible in geological strata. However, critics contend that geological epochs traditionally span millions of years and mark fundamental reorganizations of Earth systems—the transition from the Pleistocene to our current Holocene epoch, for instance, unfolded over millennia and involved dramatic climate shifts and mass species redistributions.

The recent critique challenges whether anthropogenic changes, however dramatic on human timescales, meet the magnitude threshold for epochal designation. Some scientists argue that diachronous human impacts—beginning with Neolithic agriculture 10,000 years ago, intensifying during 18th-century industrialization, and accelerating in the 20th century—defy the synchronous global boundaries that define geological time units. The International Commission on Stratigraphy has repeatedly declined to ratify the Anthropocene as an official chronostratigraphic unit, though not from denial of human environmental impact.

Moreover, critics suggest the concept conflates geological and cultural timescales inappropriately. While human activity demonstrably alters biogeochemical cycles, framing this as an "epoch" may be premature—current changes might represent merely a brief "event" within the Holocene, analogous to short-term climate anomalies visible in ice cores. The debate extends beyond technical stratigraphy into philosophical territory, with some scholars arguing that universalizing "human" agency obscures differential responsibility: carbon emissions driving putative Anthropocene markers originate disproportionately from industrialized nations, not humanity uniformly. This has prompted alternative framings like "Capitalocene," emphasizing specific economic systems rather than species-level causation.`,
        questions: [
            {
                id: 7,
                question: "Proponents suggest 1950 as the start date due to nuclear testing.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The passage states proponents 'propose 1950 as the epoch's starting point, coinciding with...nuclear weapons testing' and that 'plutonium isotopes from mid-century atomic tests provide a globally synchronous marker.'"
            },
            {
                id: 8,
                question: "Geological epochs typically span millions of years.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The passage explicitly states that 'geological epochs traditionally span millions of years.'"
            },
            {
                id: 9,
                question: "The International Commission on Stratigraphy has officially recognized the Anthropocene.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The text states the Commission 'has repeatedly declined to ratify the Anthropocene as an official chronostratigraphic unit.'"
            },
            {
                id: 10,
                question: "The Pleistocene-Holocene transition occurred rapidly over a few decades.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The passage indicates this transition 'unfolded over millennia'—thousands of years, not decades."
            },
            {
                id: 11,
                question: "Some scientists propose 'Capitalocene' as an alternative term.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The final paragraph mentions 'alternative framings like \"Capitalocene,\" emphasizing specific economic systems.'"
            },
            {
                id: 12,
                question: "Critics deny that human activity has impacted the environment.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The passage clarifies the Commission declined to ratify the Anthropocene 'though not from denial of human environmental impact,' and critics acknowledge human activity 'demonstrably alters biogeochemical cycles.'"
            }
        ]
    },
    {
        id: 8,
        title: "New Dietary Guidelines Flip the Food Pyramid",
        wordCount: 295,
        targetTime: 7 * 60,
        text: `In January 2026, public health authorities in multiple countries released revised dietary guidelines that fundamentally reconceptualize nutritional advice. The new framework de-emphasizes traditional nutrient counting—calories, fats, carbohydrates—in favor of food processing levels as the primary determinant of dietary healthiness.

This paradigm shift stems from mounting epidemiological evidence linking ultra-processed foods (UPFs) to chronic disease, independent of nutrient profiles. The NOVA classification system, which categorizes foods by processing extent rather than nutritional composition, now forms the backbone of official recommendations. Group 1 includes unprocessed or minimally processed foods like fresh fruits, vegetables, grains, and meat. Group 4—ultra-processed foods—encompasses industrially manufactured products containing ingredients rarely used in home cooking: modified starches, hydrogenated oils, protein isolates, and various additives for palatability and shelf-life.

Large-scale cohort studies demonstrate that individuals consuming the highest proportion of UPFs face a 62% increased risk of cardiovascular mortality and a 51% elevated risk of depression, even when controlling for total calorie intake and nutrient balance. Researchers hypothesize that the health impacts stem from food matrix disruption, additive interactions, and the displacement of whole foods rather than any single nutritional deficiency. Ultra-processing typically strips fiber, destroys phytochemicals, and creates hyperpalatable combinations that override satiety mechanisms, promoting overconsumption.

The updated guidelines recommend limiting UPFs to less than 15% of daily caloric intake, a dramatic departure from previous advice that focused primarily on reducing saturated fats and sodium. Critics argue this approach oversimplifies nutrition science and unfairly stigmatizes convenient, affordable food options essential for time-constrained and lower-income populations. Proponents counter that the processing-centric framework better aligns with biological evidence and provides clearer, more actionable guidance than complex nutrient calculations.`,
        questions: [
            {
                id: 13,
                question: "The new guidelines prioritize nutrient counting over processing levels.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The passage states the new framework 'de-emphasizes traditional nutrient counting' and instead uses 'food processing levels as the primary determinant.'"
            },
            {
                id: 14,
                question: "The NOVA system classifies foods into four groups.",
                type: "TFNG",
                answer: "NOT GIVEN",
                explanation: "The passage mentions Group 1 and Group 4 but doesn't explicitly state the total number of groups in the NOVA system."
            },
            {
                id: 15,
                question: "High UPF consumption is linked to increased cardiovascular mortality risk.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The text states individuals consuming the highest proportion of UPFs face 'a 62% increased risk of cardiovascular mortality.'"
            },
            {
                id: 16,
                question: "The new guidelines recommend limiting UPFs to under 15% of daily calories.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "This is explicitly stated: 'The updated guidelines recommend limiting UPFs to less than 15% of daily caloric intake.'"
            },
            {
                id: 17,
                question: "All nutritional scientists support the processing-centric approach.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The passage mentions 'Critics argue this approach oversimplifies nutrition science,' indicating not all scientists support it."
            }
        ]
    },
    {
        id: 9,
        title: "Free Will vs. the Totalitarian Temptation",
        wordCount: 341,
        targetTime: 8 * 60,
        text: `In January 2026, a philosophical controversy erupted over the implications of advanced neuroscience for concepts of human agency and moral responsibility. Proponents of hard determinism increasingly cite brain imaging studies to argue that conscious decision-making is epiphenomenal—decisions emerge from unconscious neural activity that precedes and determines conscious awareness, rendering free will illusory.

The debate intensified following publication of studies using real-time fMRI to decode intentions up to seven seconds before subjects report conscious awareness of their choices. Neuroscientist Benjamin Libet's classic experiments, which demonstrated readiness potentials in motor cortex preceding conscious intention, have been extended to complex cognitive decisions. Determinists argue these findings demonstrate that neural correlates of consciousness are causally inert—the subjective experience of choosing is merely an after-the-fact narrative constructed by the brain to create coherence, not a genuine causal force.

The philosophical implications extend far beyond academic discourse into legal and political domains. If human behavior is entirely determined by prior neural states shaped by genetics and environment—factors beyond individual control—traditional notions of moral culpability collapse. Some radical reformers propose abandoning retributive justice in favor of purely consequentialist frameworks focused on behavior modification and public safety, treating criminal acts as symptomatic of neurological dysfunction or adverse environmental conditioning rather than freely chosen moral transgressions.

Critics warn of a "totalitarian temptation"—if individuals lack genuine agency, paternalistic governance becomes philosophically justified. Why respect autonomy if cognitive autonomy is illusory? Defenders of compatibilist free will argue that determinism and moral responsibility are compatible: even if choices emerge from prior causes, the capacity for rational deliberation and value-consistent decision-making constitutes meaningful freedom. They contend that dismantling moral responsibility based on neuroscience misunderstands both the philosophical problem and the empirical evidence.

The societal stakes are profound. Widespread acceptance of hard determinism could erode motivation, civic participation, and interpersonal accountability. Conversely, ignoring neuroscientific insights might perpetuate unjust punishment of individuals whose behavior reflects neurological conditions beyond their control. Philosophers emphasize that scientific findings underdetermine philosophical conclusions—empirical data about neural mechanisms cannot, by themselves, resolve normative questions about how societies should structure legal and moral frameworks.`,
        questions: [
            {
                id: 18,
                question: "Hard determinists believe free will is an illusion.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The passage states proponents of hard determinism argue 'conscious decision-making is epiphenomenal' and 'free will illusory.'"
            },
            {
                id: 19,
                question: "Brain imaging can decode intentions seven seconds before conscious awareness.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The text explicitly states: 'studies using real-time fMRI to decode intentions up to seven seconds before subjects report conscious awareness of their choices.'"
            },
            {
                id: 20,
                question: "All neuroscientists support abandoning retributive justice.",
                type: "TFNG",
                answer: "NOT GIVEN",
                explanation: "The passage mentions 'some radical reformers propose' this, but doesn't indicate all or most neuroscientists support it."
            },
            {
                id: 21,
                question: "Compatibilists believe determinism and moral responsibility can coexist.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The passage states: 'Defenders of compatibilist free will argue that determinism and moral responsibility are compatible.'"
            },
            {
                id: 22,
                question: "The passage suggests neuroscience definitively resolves the free will debate.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The final paragraph emphasizes 'scientific findings underdetermine philosophical conclusions' and 'empirical data about neural mechanisms cannot, by themselves, resolve normative questions.'"
            },
            {
                id: 23,
                question: "Libet's experiments focused on complex cognitive decisions.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The passage states Libet demonstrated 'readiness potentials in motor cortex' and that his experiments 'have been extended to complex cognitive decisions'—his original work was on motor decisions, not complex cognition."
            }
        ]
    },
    {
        id: 10,
        title: "Could We Move Data Centers to Space?",
        wordCount: 318,
        targetTime: 8 * 60,
        text: `Late 2025 research explored the technical and economic feasibility of relocating energy-intensive data centers to orbital platforms, potentially alleviating terrestrial environmental impacts while exploiting unique advantages of the space environment. The proposal targets the escalating energy demands and heat generation of cloud computing infrastructure, which currently consumes approximately 2% of global electricity and produces carbon emissions comparable to the aviation industry.

Data centers generate enormous waste heat—a single large facility can produce thermal output equivalent to a small city, requiring extensive cooling systems that further increase energy consumption. In space, passive radiative cooling becomes dramatically more efficient in the near-vacuum environment. Without atmospheric convection limiting heat dissipation, orbital data centers could radiate waste heat directly into space through large thermal radiator panels, potentially reducing cooling energy requirements by 80-90% compared to terrestrial facilities.

Solar energy availability represents another compelling advantage. Orbital platforms experience nearly continuous sunlight, eliminating the intermittency challenges plaguing ground-based solar installations. Photovoltaic arrays in geostationary orbit could generate power 24/7 at efficiency levels 30-40% higher than terrestrial solar due to absence of atmospheric filtering and optimal sun angle. The study estimates that a constellation of orbital data centers could theoretically meet projected 2040 global computing demand with net-zero carbon emissions.

However, formidable obstacles remain. Launch costs, while declining, still exceed $1,500 per kilogram to low Earth orbit, making initial deployment prohibitively expensive. Radiation hardening of electronics adds significant mass and cost. Communication latency—even at data transmission speeds, the minimum 240-millisecond round-trip delay for geostationary orbit—renders real-time applications like video conferencing impractical. Maintenance and physical upgrades require costly space operations.

The researchers propose a hybrid model: latency-insensitive workloads like machine learning training, data archiving, and blockchain processing migrate to orbit, while latency-critical applications remain terrestrial. They conclude that orbital data centers could become economically viable by 2035-2040 if launch costs continue to decline and carbon pricing increases the relative cost of terrestrial operations.`,
        questions: [
            {
                id: 24,
                question: "Data centers currently consume 2% of global electricity.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The passage explicitly states cloud computing infrastructure 'currently consumes approximately 2% of global electricity.'"
            },
            {
                id: 25,
                question: "Orbital data centers could reduce cooling energy needs by over 70%.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The text states orbital facilities 'could radiate waste heat directly into space...potentially reducing cooling energy requirements by 80-90%,' which exceeds 70%."
            },
            {
                id: 26,
                question: "Geostationary orbit has a minimum round-trip communication delay of 240 milliseconds.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The passage states: 'Communication latency—even at data transmission speeds, the minimum 240-millisecond round-trip delay for geostationary orbit.'"
            },
            {
                id: 27,
                question: "Current launch costs are below $1,000 per kilogram to low Earth orbit.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The text states 'Launch costs...still exceed $1,500 per kilogram to low Earth orbit,' which is above $1,000, not below."
            },
            {
                id: 28,
                question: "All computing applications could be moved to orbital data centers immediately.",
                type: "TFNG",
                answer: "FALSE",
                explanation: "The passage proposes a 'hybrid model' where 'latency-insensitive workloads' migrate to orbit while 'latency-critical applications remain terrestrial'—not all applications."
            },
            {
                id: 29,
                question: "Orbital data centers could become economically viable by 2035-2040.",
                type: "TFNG",
                answer: "TRUE",
                explanation: "The researchers conclude 'orbital data centers could become economically viable by 2035-2040 if launch costs continue to decline.'"
            }
        ]
    }
];

export default function PracticeExercise() {
    const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    const { updateXP } = useUserStore();

    const currentPassage = PRACTICE_PASSAGES[currentPassageIndex];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimeElapsed((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        setIsTimerRunning(true);
        triggerHaptic('light');
    };

    const handlePause = () => {
        setIsTimerRunning(false);
        triggerHaptic('light');
    };

    const handleReset = () => {
        setIsTimerRunning(false);
        setTimeElapsed(0);
        setAnswers({});
        setShowResults(false);
        triggerHaptic('selection');
    };

    const handlePassageChange = (direction: 'prev' | 'next') => {
        if (direction === 'prev' && currentPassageIndex > 0) {
            setCurrentPassageIndex(currentPassageIndex - 1);
        } else if (direction === 'next' && currentPassageIndex < PRACTICE_PASSAGES.length - 1) {
            setCurrentPassageIndex(currentPassageIndex + 1);
        }
        handleReset();
        triggerHaptic('selection');
    };

    const handleAnswerChange = (questionId: number, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
        triggerHaptic('selection');
    };

    const handleSubmit = () => {
        setIsTimerRunning(false);
        setShowResults(true);

        const correct = currentPassage.questions.filter(
            (q) => answers[q.id] === q.answer
        ).length;

        const xpGained = correct * 15;
        updateXP(xpGained);

        triggerHaptic('success');
    };

    const correctCount = currentPassage.questions.filter(
        (q) => answers[q.id] === q.answer
    ).length;

    const timeColor = timeElapsed > currentPassage.targetTime ? 'var(--color-danger)' : 'var(--color-success)';

    return (
        <div className="practice-exercise">
            {/* Passage Navigation */}
            <div className="passage-navigation">
                <button
                    className="btn-ghost"
                    onClick={() => handlePassageChange('prev')}
                    disabled={currentPassageIndex === 0}
                >
                    <ChevronLeft size={20} />
                    Previous
                </button>
                <div className="passage-indicator">
                    Passage {currentPassageIndex + 1} of {PRACTICE_PASSAGES.length}
                </div>
                <button
                    className="btn-ghost"
                    onClick={() => handlePassageChange('next')}
                    disabled={currentPassageIndex === PRACTICE_PASSAGES.length - 1}
                >
                    Next
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Timer */}
            <div className="practice-timer">
                <div className="timer-display" style={{ color: timeColor }}>
                    <Clock size={24} />
                    <span className="timer-time">{formatTime(timeElapsed)}</span>
                    <span className="timer-target">/ {formatTime(currentPassage.targetTime)}</span>
                </div>

                <div className="timer-controls">
                    {!isTimerRunning && timeElapsed === 0 && (
                        <button className="btn-primary" onClick={handleStart}>
                            <Play size={18} />
                            Start Practice
                        </button>
                    )}
                    {isTimerRunning && (
                        <button className="btn-secondary" onClick={handlePause}>
                            <Pause size={18} />
                            Pause
                        </button>
                    )}
                    {!isTimerRunning && timeElapsed > 0 && !showResults && (
                        <button className="btn-primary" onClick={handleStart}>
                            <Play size={18} />
                            Resume
                        </button>
                    )}
                    {timeElapsed > 0 && (
                        <button className="btn-ghost" onClick={handleReset}>
                            <RotateCcw size={18} />
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Passage */}
            <motion.div
                className="practice-passage"
                key={currentPassage.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <h3 className="passage-title">{currentPassage.title}</h3>
                <div className="passage-meta">
                    <span>{currentPassage.wordCount} words</span>
                    <span>•</span>
                    <span>Target: {Math.floor(currentPassage.targetTime / 60)} minutes</span>
                </div>
                <div className="passage-text">{currentPassage.text}</div>
            </motion.div>

            {/* Questions */}
            <div className="practice-questions">
                <h3>Questions 1-{currentPassage.questions.length}</h3>
                <p className="question-instruction">
                    Do the following statements agree with the information in the passage?
                </p>
                <p className="question-instruction-detail">
                    Write <strong>TRUE</strong> if the statement agrees with the information,
                    <strong>FALSE</strong> if it contradicts, or <strong>NOT GIVEN</strong> if there is no information.
                </p>

                {currentPassage.questions.map((question, index) => (
                    <motion.div
                        key={question.id}
                        className={`question-card ${showResults ? (answers[question.id] === question.answer ? 'correct' : 'incorrect') : ''}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="question-number">Q{index + 1}</div>
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
                                        disabled={showResults}
                                    />
                                    <span>{option}</span>
                                    {showResults && option === question.answer && (
                                        <Check size={16} className="correct-indicator" />
                                    )}
                                </label>
                            ))}
                        </div>

                        {showResults && (
                            <div className="explanation">
                                <strong>Explanation:</strong> {question.explanation}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Submit/Results */}
            {!showResults && Object.keys(answers).length === currentPassage.questions.length && (
                <motion.button
                    className="btn-submit"
                    onClick={handleSubmit}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    Submit Answers
                </motion.button>
            )}

            {showResults && (
                <motion.div
                    className="results-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3>Results</h3>
                    <div className="results-score">
                        <div className="score-circle">
                            <span className="score-value">{correctCount}/{currentPassage.questions.length}</span>
                            <span className="score-label">Correct</span>
                        </div>
                    </div>

                    <div className="results-stats">
                        <div className="result-stat">
                            <div className="result-stat-label">Time Taken</div>
                            <div className="result-stat-value" style={{ color: timeColor }}>
                                {formatTime(timeElapsed)}
                            </div>
                        </div>
                        <div className="result-stat">
                            <div className="result-stat-label">Target Time</div>
                            <div className="result-stat-value">{formatTime(currentPassage.targetTime)}</div>
                        </div>
                        <div className="result-stat">
                            <div className="result-stat-label">XP Earned</div>
                            <div className="result-stat-value gradient-text">+{correctCount * 15}</div>
                        </div>
                    </div>

                    <div className="result-actions">
                        <button className="btn-secondary" onClick={handleReset}>
                            Try Again
                        </button>
                        {currentPassageIndex < PRACTICE_PASSAGES.length - 1 && (
                            <button className="btn-primary" onClick={() => handlePassageChange('next')}>
                                Next Passage
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
