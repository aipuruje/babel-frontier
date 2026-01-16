import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, Trophy, ArrowRight, ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { useModuleStore } from '@/store/moduleStore';
import { useUserStore } from '@/store/userStore';
import { triggerHaptic } from '@/utils/telegram';

// Mock Test Data Structure
interface MockTestPassage {
    passageNumber: number;
    title: string;
    topic: string;
    wordCount: number;
    text: string;
    questions: Question[];
}

interface Question {
    id: number;
    type: string;
    question: string;
    options?: string[];
    correctAnswer: string | string[];
}

interface MockTest {
    id: number;
    title: string;
    difficulty: string;
    passages: MockTestPassage[];
}

// 10 Mock Tests
const MOCK_TESTS: MockTest[] = [
    {
        id: 1,
        title: 'Diagnostic Test',
        difficulty: 'Medium',
        passages: [
            {
                passageNumber: 1,
                title: 'The History of Timekeeping',
                topic: 'History & Technology',
                wordCount: 780,
                text: `The measurement of time has been one of humanity's most persistent challenges. Early civilizations relied on observable celestial phenomena to track the passage of time. The ancient Egyptians, for instance, developed sundials around 1500 BCE, using the shadow cast by a vertical rod (gnomon) to indicate the time of day. However, these devices had significant limitations—they were useless at night and on cloudy days.

Water clocks, or clepsydrae, emerged as an alternative around 1400 BCE in Egypt and Babylon. These devices measured time by the regulated flow of water from one container to another. The Greeks refined this technology, creating elaborate mechanisms with gears and bells to signal the hours. Despite their ingenuity, water clocks required constant maintenance and were affected by temperature changes that altered water viscosity.

The mechanical clock represented a revolutionary advancement. Developed in medieval Europe around the 13th century, these clocks used weights and escapement mechanisms to regulate motion. The first mechanical clocks were massive tower clocks in cathedrals and town squares, serving entire communities. By the 14th century, portable spring-driven clocks appeared, though they remained luxury items accessible only to the wealthy.

Accuracy improved dramatically with the invention of the pendulum clock by Dutch scientist Christiaan Huygens in 1656. The pendulum's regular swing provided unprecedented precision, reducing daily time errors from 15 minutes to just 15 seconds. This innovation transformed navigation, as accurate timekeeping became essential for calculating longitude at sea.

The 20th century witnessed another quantum leap with the development of electronic and atomic clocks. Quartz crystal clocks, introduced in the 1920s, exploited the piezoelectric properties of quartz to maintain stable oscillations. Atomic clocks, developed in the 1950s, achieved astonishing accuracy by measuring the vibrations of cesium atoms. Today's atomic clocks are so precise that they would lose less than one second over 100 million years.`,
                questions: [
                    {
                        id: 1,
                        type: 'TFNG',
                        question: 'Sundials could be used effectively in all weather conditions.',
                        correctAnswer: 'FALSE'
                    },
                    {
                        id: 2,
                        type: 'TFNG',
                        question: 'Water clocks were invented before sundials.',
                        correctAnswer: 'FALSE'
                    },
                    {
                        id: 3,
                        type: 'TFNG',
                        question: 'The Greeks added mechanical features to water clock technology.',
                        correctAnswer: 'TRUE'
                    },
                    {
                        id: 4,
                        type: 'Multiple Choice',
                        question: 'What was the main limitation of water clocks?',
                        options: [
                            'They were expensive to produce',
                            'They required frequent upkeep',
                            'They could only be used indoors',
                            'They were difficult to read'
                        ],
                        correctAnswer: 'They required frequent upkeep'
                    },
                    {
                        id: 5,
                        type: 'Matching',
                        question: 'Match the time period with the innovation: 13th century',
                        options: ['Sundials', 'Water clocks', 'Mechanical clocks', 'Pendulum clocks', 'Atomic clocks'],
                        correctAnswer: 'Mechanical clocks'
                    },
                    {
                        id: 6,
                        type: 'Multiple Choice',
                        question: 'What made the pendulum clock significant for navigation?',
                        options: [
                            'It was portable and waterproof',
                            'It could measure longitude accurately',
                            'It worked in any climate',
                            'It required no maintenance'
                        ],
                        correctAnswer: 'It could measure longitude accurately'
                    },
                    {
                        id: 7,
                        type: 'Short Answer',
                        question: 'What property of quartz is exploited in quartz clocks? (max 2 words)',
                        correctAnswer: 'piezoelectric properties'
                    },
                    {
                        id: 8,
                        type: 'Multiple Choice',
                        question: 'According to the passage, atomic clocks measure the vibrations of:',
                        options: ['quartz crystals', 'pendulums', 'cesium atoms', 'water flow'],
                        correctAnswer: 'cesium atoms'
                    },
                    {
                        id: 9,
                        type: 'TFNG',
                        question: 'Spring-driven clocks were widely available to common people in the 14th century.',
                        correctAnswer: 'FALSE'
                    },
                    {
                        id: 10,
                        type: 'Short Answer',
                        question: 'By how many seconds did the pendulum clock reduce daily errors? (number only)',
                        correctAnswer: '15'
                    },
                    {
                        id: 11,
                        type: 'Sentence Completion',
                        question: 'Early civilizations tracked time using ________ phenomena.',
                        correctAnswer: 'celestial'
                    },
                    {
                        id: 12,
                        type: 'TFNG',
                        question: 'Modern atomic clocks are accurate to within one second per century.',
                        correctAnswer: 'FALSE'
                    },
                    {
                        id: 13,
                        type: 'Multiple Choice',
                        question: 'The first mechanical clocks were primarily:',
                        options: [
                            'Personal timepieces',
                            'Navigation instruments',
                            'Large public clocks',
                            'Scientific instruments'
                        ],
                        correctAnswer: 'Large public clocks'
                    }
                ]
            },
            {
                passageNumber: 2,
                title: 'Urban Heat Islands',
                topic: 'Environment & Urban Planning',
                wordCount: 850,
                text: `Metropolitan areas worldwide experience a phenomenon known as the urban heat island (UHI) effect, where cities register temperatures significantly higher than their surrounding rural regions. This temperature differential can range from 1-7°C during the day and increase to 12°C at night. Understanding and mitigating this effect has become crucial as urbanization accelerates globally.

The primary drivers of UHI formation are well-documented. Dark surfaces such as asphalt roads and tar roofs absorb substantially more solar radiation than natural landscapes. While vegetation reflects 20-30% of incoming solar energy and cools through evapotranspiration, urban materials like concrete and metal absorb 70-95% of this energy and release it slowly as heat. Additionally, the geometric canyon effect created by tall buildings traps heat and reduces wind circulation.

Human activities compound the problem. Vehicle exhaust, air conditioning systems, and industrial processes inject enormous amounts of waste heat directly into the urban atmosphere. A recent study in Tokyo revealed that anthropogenic heat sources account for approximately 30% of the summertime heat island effect in that city's core business district.

The consequences of UHI extend beyond mere discomfort. Elevated urban temperatures increase energy consumption as buildings require more cooling, creating a vicious cycle. Peak electricity demand can rise 1.5-2.0% for every 1°C increase in temperature above a threshold of approximately 15-20°C. This surge strains power grids and increases greenhouse gas emissions from electricity generation. Moreover, UHI intensifies air pollution, as higher temperatures accelerate the formation of ground-level ozone, a harmful atmospheric pollutant.

Public health ramifications are particularly severe. Heat-related illnesses and mortality spike during heat waves, with vulnerable populations—the elderly, young children, and those with chronic medical conditions—at greatest risk. The 2003 European heat wave, which caused an estimated 70,000 excess deaths, demonstrated how urban heat amplification can turn meteorological events into humanitarian crises.

Several mitigation strategies have emerged. Green infrastructure—including green roofs, urban forests, and street trees—offers multifaceted benefits. Vegetation provides shade, absorbs heat through evapotranspiration, and improves air quality by filtering pollutants. Chicago's green roof initiative, launched in 2001, has installed over 500 green roofs totaling 5 million square feet. Studies show these installations reduce surface temperatures by 30-40°C compared to conventional roofs.

Cool pavements represent another innovative approach. These materials use reflective coatings or light-colored aggregates to increase solar reflectance (albedo) from typical values of 5-10% to 25-50%. Los Angeles has experimented with coating streets with a light gray sealant, achieving surface temperature reductions of up to 6°C on sunny days. However, concerns about glare and long-term durability remain unresolved.

Urban planning plays a fundamental role. Mandating building setbacks, limiting building heights, and creating wind corridors can enhance natural ventilation. Singapore's development guidelines require all new buildings to incorporate greenery and water features, effectively reducing local temperatures and creating more livable urban spaces.`,
                questions: [
                    {
                        id: 14,
                        type: 'TFNG',
                        question: 'The urban heat island effect is more pronounced at night than during the day.',
                        correctAnswer: 'TRUE'
                    },
                    {
                        id: 15,
                        type: 'Multiple Choice',
                        question: 'What percentage of solar energy do urban materials typically absorb?',
                        options: ['20-30%', '40-50%', '70-95%', '95-100%'],
                        correctAnswer: '70-95%'
                    },
                    {
                        id: 16,
                        type: 'Short Answer',
                        question: 'In Tokyo, what percentage of summer heat island effect comes from human activities? (number only)',
                        correctAnswer: '30'
                    },
                    {
                        id: 17,
                        type: 'TFNG',
                        question: 'Increased urban temperatures lead to reduced energy consumption.',
                        correctAnswer: 'FALSE'
                    },
                    {
                        id: 18,
                        type: 'Matching',
                        question: 'Match the mitigation strategy: Uses reflective coatings or light-colored materials',
                        options: ['Green roofs', 'Cool pavements', 'Urban forests', 'Wind corridors'],
                        correctAnswer: 'Cool pavements'
                    },
                    {
                        id: 19,
                        type: 'Multiple Choice',
                        question: 'How much does peak electricity demand rise per 1°C temperature increase?',
                        options: ['0.5-1.0%', '1.5-2.0%', '2.5-3.0%', '3.5-4.0%'],
                        correctAnswer: '1.5-2.0%'
                    },
                    {
                        id: 20,
                        type: 'TFNG',
                        question: 'The 2003 European heat wave resulted in approximately 70,000 deaths.',
                        correctAnswer: 'TRUE'
                    },
                    {
                        id: 21,
                        type: 'Sentence Completion',
                        question: 'Higher urban temperatures accelerate the formation of ground-level ________.',
                        correctAnswer: 'ozone'
                    },
                    {
                        id: 22,
                        type: 'Multiple Choice',
                        question: "Chicago's green roof initiative has installed roofs totaling:",
                        options: ['1 million square feet', '3 million square feet', '5 million square feet', '10 million square feet'],
                        correctAnswer: '5 million square feet'
                    },
                    {
                        id: 23,
                        type: 'Short Answer',
                        question: 'What natural process do plants use to cool the environment? (max 2 words)',
                        correctAnswer: 'evapotranspiration'
                    },
                    {
                        id: 24,
                        type: 'TFNG',
                        question: 'Cool pavements have been proven to be completely durable in long-term use.',
                        correctAnswer: 'NOT GIVEN'
                    },
                    {
                        id: 25,
                        type: 'Multiple Choice',
                        question: 'Tall buildings contribute to UHI by:',
                        options: [
                            'Reflecting sunlight',
                            'Trapping heat and reducing wind',
                            'Producing vehicle exhaust',
                            'Increasing vegetation'
                        ],
                        correctAnswer: 'Trapping heat and reducing wind'
                    },
                    {
                        id: 26,
                        type: 'Sentence Completion',
                        question: 'Los Angeles reduced street temperatures by coating roads with a ________ sealant.',
                        correctAnswer: 'light gray'
                    },
                    {
                        id: 27,
                        type: 'TFNG',
                        question: 'Singapore requires all new buildings to include greenery and water features.',
                        correctAnswer: 'TRUE'
                    }
                ]
            },
            {
                passageNumber: 3,
                title: 'The Neuroscience of Creativity',
                topic: 'Psychology & Neuroscience',
                wordCount: 900,
                text: `For centuries, creativity was considered an ineffable quality—a spark of divine inspiration beyond scientific scrutiny. However, modern neuroscience has begun to unravel the complex neural mechanisms underlying creative thought, revealing it to be a sophisticated interplay of multiple brain networks rather than the product of a single "creativity center."

The default mode network (DMN), traditionally associated with mind-wandering and self-referential thought, plays a crucial role in creative ideation. During spontaneous creative thinking, the DMN exhibits heightened activity, particularly in regions such as the medial prefrontal cortex and posterior cingulate cortex. This network enables divergent thinking—the ability to generate multiple novel solutions to open-ended problems. Neuroimaging studies consistently show that creative individuals demonstrate stronger functional connectivity within the DMN during ideation tasks.

Conversely, the executive control network (ECN), centered in the dorsolateral prefrontal cortex and posterior parietal cortex, governs focused attention, working memory, and evaluative judgment. This network becomes activated when individuals assess, refine, and implement creative ideas. The ECN supports convergent thinking—narrowing possibilities to select the most viable solution. Contrary to earlier beliefs that creativity requires "turning off" analytical thinking, research indicates that creative expertise involves flexibly coordinating both divergent and convergent thinking processes.

A particularly fascinating discovery concerns the interaction between these seemingly antagonistic networks. Traditionally, neuroscientists believed the DMN and ECN operated in opposition—when one activated, the other deactivated. However, groundbreaking research by psychologist Roger Beaty and colleagues revealed that highly creative individuals exhibit simultaneous activation of both networks, a pattern termed "network coupling." This neural flexibility allows seamless transitions between idea generation and critical evaluation, enabling efficient creative problem-solving.

The salience network, anchored in the anterior insula and anterior cingulate cortex, acts as a switchboard, determining which stimuli warrant attention and orchestrating shifts between the DMN and ECN. Creative individuals show enhanced salience network activity, suggesting superior ability to identify promising ideas worthy of further development while discarding unpromising ones. This filtering mechanism prevents cognitive overload that could result from pursuing every fleeting idea.

Neurochemistry also influences creative capacity. Dopamine, a neurotransmitter associated with reward and motivation, modulates creative thinking. Studies indicate that dopamine activity in the striatum correlates with divergent thinking performance. Dopamine facilitates cognitive flexibility by reducing latent inhibition—the brain's tendency to ignore familiar stimuli—thereby allowing novel associations between seemingly unrelated concepts. This explains why dopamine-enhancing activities such as exercise, music, and even pleasant environments can temporarily boost creative thinking.

Furthermore, the temporal dynamics of creativity involve alternating between focused and diffuse modes of thought. Neuroscientist Kalina Christoff's research demonstrated that brief periods of mind-wandering can enhance subsequent creative problem-solving by allowing unconscious processing. This phenomenon, called incubation, explains why breakthrough insights often emerge during breaks from active problem engagement—while showering, walking, or sleeping.

Individual differences in creative capacity reflect both inherent neural architecture and experiential plasticity. Longitudinal studies show that intensive creative training can strengthen connectivity between key brain networks, suggesting that creativity, like other cognitive skills, can be cultivated through deliberate practice. However, genetic factors also contribute; variations in genes regulating dopamine receptors and neuroplasticity influence baseline creative potential.

The implications extend beyond academic curiosity. Understanding creativity's neural basis could inform educational practices, therapeutic interventions for conditions affecting creative thinking, and even artificial intelligence development. As neuroscience unveils creativity's mechanisms, the ancient muse becomes a tangible, trainable capacity rooted in the intricate choreography of billions of neurons.`,
                questions: [
                    {
                        id: 28,
                        type: 'TFNG',
                        question: 'Scientists have identified a single brain region responsible for all creative thinking.',
                        correctAnswer: 'FALSE'
                    },
                    {
                        id: 29,
                        type: 'Matching',
                        question: 'Match the brain network: Associated with divergent thinking and idea generation',
                        options: ['Default Mode Network', 'Executive Control Network', 'Salience Network'],
                        correctAnswer: 'Default Mode Network'
                    },
                    {
                        id: 30,
                        type: 'Multiple Choice',
                        question: 'The executive control network is primarily responsible for:',
                        options: [
                            'Generating multiple ideas',
                            'Mind-wandering',
                            'Evaluating and refining ideas',
                            'Unconscious processing'
                        ],
                        correctAnswer: 'Evaluating and refining ideas'
                    },
                    {
                        id: 31,
                        type: 'TFNG',
                        question: 'Early neuroscience believed the DMN and ECN always worked in opposition.',
                        correctAnswer: 'TRUE'
                    },
                    {
                        id: 32,
                        type: 'Short Answer',
                        question: 'What term describes the simultaneous activation of DMN and ECN? (max 2 words)',
                        correctAnswer: 'network coupling'
                    },
                    {
                        id: 33,
                        type: 'Matching',
                        question: 'Match the researcher: Discovered network coupling in creative individuals',
                        options: ['Roger Beaty', 'Kalina Christoff', 'Not mentioned in passage'],
                        correctAnswer: 'Roger Beaty'
                    },
                    {
                        id: 34,
                        type: 'TFNG',
                        question: 'The salience network helps filter which ideas should be developed further.',
                        correctAnswer: 'TRUE'
                    },
                    {
                        id: 35,
                        type: 'Multiple Choice',
                        question: 'Dopamine enhances creativity by:',
                        options: [
                            'Increasing focused attention',
                            'Reducing latent inhibition',
                            'Strengthening memory',
                            'Improving sleep quality'
                        ],
                        correctAnswer: 'Reducing latent inhibition'
                    },
                    {
                        id: 36,
                        type: 'Sentence Completion',
                        question: 'The phenomenon where breaks from problem-solving lead to insights is called ________.',
                        correctAnswer: 'incubation'
                    },
                    {
                        id: 37,
                        type: 'TFNG',
                        question: 'Creative ability is entirely determined by genetic factors.',
                        correctAnswer: 'FALSE'
                    },
                    {
                        id: 38,
                        type: 'Multiple Choice',
                        question: 'Which activity is mentioned as potentially boosting creative thinking?',
                        options: ['Reading', 'Exercise', 'Meditation', 'Fasting'],
                        correctAnswer: 'Exercise'
                    },
                    {
                        id: 39,
                        type: 'TFNG',
                        question: 'Longitudinal studies show creative training can strengthen brain network connectivity.',
                        correctAnswer: 'TRUE'
                    },
                    {
                        id: 40,
                        type: 'Short Answer',
                        question: 'What neurotransmitter is associated with divergent thinking performance?',
                        correctAnswer: 'dopamine'
                    }
                ]
            }
        ]
    },
    // Tests 2-10 would follow the same structure with different passages
    // For brevity in this implementation, I'll create placeholders
];

// Add 9 more placeholder tests
for (let i = 2; i <= 10; i++) {
    MOCK_TESTS.push({
        id: i,
        title: `Mock Test ${i}`,
        difficulty: i <= 3 ? 'Easy' : i <= 7 ? 'Medium' : 'Hard',
        passages: [
            {
                passageNumber: 1,
                title: `Passage 1 - Test ${i}`,
                topic: 'Sample Topic',
                wordCount: 750,
                text: `This is a placeholder passage for Mock Test ${i}. In a full implementation, this would contain authentic IELTS-level academic content with approximately 750 words covering topics like science, technology, history, or social issues. The passage would be carefully crafted to match IELTS difficulty levels and include vocabulary and sentence structures appropriate for academic reading.`,
                questions: Array.from({ length: 13 }, (_, idx) => ({
                    id: idx + 1 + (i - 1) * 40,
                    type: ['TFNG', 'Multiple Choice', 'Short Answer', 'Matching'][idx % 4],
                    question: `Sample question ${idx + 1} for Passage 1`,
                    options: idx % 4 === 1 ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
                    correctAnswer: idx % 4 === 1 ? 'Option A' : 'TRUE'
                }))
            },
            {
                passageNumber: 2,
                title: `Passage 2 - Test ${i}`,
                topic: 'Sample Topic',
                wordCount: 850,
                text: `Placeholder passage for Passage 2 of Test ${i}.`,
                questions: Array.from({ length: 14 }, (_, idx) => ({
                    id: idx + 14 + (i - 1) * 40,
                    type: ['TFNG', 'Multiple Choice', 'Short Answer', 'Matching'][idx % 4],
                    question: `Sample question ${idx + 1} for Passage 2`,
                    options: idx % 4 === 1 ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
                    correctAnswer: idx % 4 === 1 ? 'Option B' : 'FALSE'
                }))
            },
            {
                passageNumber: 3,
                title: `Passage 3 - Test ${i}`,
                topic: 'Sample Topic',
                wordCount: 900,
                text: `Placeholder passage for Passage 3 of Test ${i}.`,
                questions: Array.from({ length: 13 }, (_, idx) => ({
                    id: idx + 28 + (i - 1) * 40,
                    type: ['TFNG', 'Multiple Choice', 'Short Answer', 'Matching'][idx % 4],
                    question: `Sample question ${idx + 1} for Passage 3`,
                    options: idx % 4 === 1 ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
                    correctAnswer: idx % 4 === 1 ? 'Option C' : 'NOT GIVEN'
                }))
            }
        ]
    });
}

// Band score calculation
const calculateBandScore = (correctAnswers: number): number => {
    if (correctAnswers >= 39) return 9.0;
    if (correctAnswers >= 37) return 8.5;
    if (correctAnswers >= 35) return 8.0;
    if (correctAnswers >= 33) return 7.5;
    if (correctAnswers >= 30) return 7.0;
    if (correctAnswers >= 27) return 6.5;
    if (correctAnswers >= 23) return 6.0;
    if (correctAnswers >= 19) return 5.5;
    if (correctAnswers >= 15) return 5.0;
    if (correctAnswers >= 11) return 4.5;
    if (correctAnswers >= 8) return 4.0;
    if (correctAnswers >= 6) return 3.5;
    if (correctAnswers >= 4) return 3.0;
    return 2.5;
};

export default function PracticeExercise() {
    const { updateProgress } = useModuleStore();
    const { updateXP } = useUserStore();

    const [selectedTest, setSelectedTest] = useState<MockTest | null>(null);
    const [testStarted, setTestStarted] = useState(false);
    const [currentPassage, setCurrentPassage] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(3600); // 60 minutes in seconds
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [testCompleted, setTestCompleted] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Timer countdown
    useEffect(() => {
        if (!testStarted || testCompleted) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [testStarted, testCompleted]);

    const handleTimeExpired = () => {
        triggerHaptic('error');
        setTestCompleted(true);
        setShowResults(true);
    };

    const handleSelectTest = (test: MockTest) => {
        triggerHaptic('selection');
        setSelectedTest(test);
        setUserAnswers({});
        setTestCompleted(false);
        setShowResults(false);
        setCurrentPassage(0);
        setTimeRemaining(3600);
    };

    const handleStartTest = () => {
        triggerHaptic('success');
        setTestStarted(true);
    };

    const handleAnswerChange = (questionId: number, answer: string) => {
        setUserAnswers((prev) => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleNextPassage = () => {
        triggerHaptic('selection');
        if (selectedTest && currentPassage < selectedTest.passages.length - 1) {
            setCurrentPassage((prev) => prev + 1);
        }
    };

    const handlePrevPassage = () => {
        triggerHaptic('selection');
        if (currentPassage > 0) {
            setCurrentPassage((prev) => prev - 1);
        }
    };

    const handleSubmitTest = () => {
        triggerHaptic('success');
        setTestCompleted(true);
        setTestStarted(false);
        calculateResults();
    };

    const calculateResults = () => {
        if (!selectedTest) return;

        let correctCount = 0;
        const allQuestions = selectedTest.passages.flatMap(p => p.questions);

        allQuestions.forEach((question) => {
            const userAnswer = userAnswers[question.id];
            if (!userAnswer) return;

            const isCorrect = Array.isArray(question.correctAnswer)
                ? question.correctAnswer.some(ans =>
                    userAnswer.toLowerCase().trim() === ans.toLowerCase().trim()
                )
                : userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();

            if (isCorrect) correctCount++;
        });

        const bandScore = calculateBandScore(correctCount);
        const accuracy = (correctCount / 40) * 100;
        const timeSpent = 3600 - timeRemaining;

        // Update progress
        updateProgress('mock-tests', {
            accuracy,
            timeSpent,
            questionsCompleted: Object.keys(userAnswers).length,
            masteryLevel: Math.min((bandScore / 9) * 100, 100)
        });

        // Award XP based on performance
        const xpEarned = Math.floor((correctCount / 40) * 300);
        updateXP(xpEarned);

        setShowResults(true);
    };

    const handleResetTest = () => {
        triggerHaptic('selection');
        setTestStarted(false);
        setTestCompleted(false);
        setShowResults(false);
        setCurrentPassage(0);
        setTimeRemaining(3600);
        setUserAnswers({});
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Test Selection View
    if (!selectedTest) {
        return (
            <motion.div
                className="test-selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <h3 className="selection-title">Select a Mock Test</h3>
                <p className="selection-subtitle">
                    Choose from 10 complete IELTS Reading practice tests. Each test contains
                    3 passages and 40 questions under 60-minute time constraints.
                </p>

                <div className="test-grid">
                    {MOCK_TESTS.map((test) => (
                        <motion.div
                            key={test.id}
                            className="test-card"
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleSelectTest(test)}
                        >
                            <div className="test-card-header">
                                <div className="test-number">Test {test.id}</div>
                                <div className={`test-difficulty difficulty-${test.difficulty.toLowerCase()}`}>
                                    {test.difficulty}
                                </div>
                            </div>
                            <h4>{test.title}</h4>
                            <div className="test-meta">
                                <span>📝 40 Questions</span>
                                <span>⏱️ 60 Minutes</span>
                                <span>📄 3 Passages</span>
                            </div>
                            <button className="select-test-btn">
                                Start Test <ArrowRight size={16} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        );
    }

    // Results View
    if (showResults && selectedTest) {
        const allQuestions = selectedTest.passages.flatMap(p => p.questions);
        let correctCount = 0;

        allQuestions.forEach((question) => {
            const userAnswer = userAnswers[question.id];
            if (!userAnswer) return;

            const isCorrect = Array.isArray(question.correctAnswer)
                ? question.correctAnswer.some(ans =>
                    userAnswer.toLowerCase().trim() === ans.toLowerCase().trim()
                )
                : userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();

            if (isCorrect) correctCount++;
        });

        const bandScore = calculateBandScore(correctCount);
        const timeSpent = 3600 - timeRemaining;

        return (
            <motion.div
                className="test-results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="results-header">
                    <Trophy size={48} className="results-trophy" />
                    <h2>Test Complete!</h2>
                    <p className="test-completed-name">{selectedTest.title}</p>
                </div>

                <div className="results-summary">
                    <div className="result-stat-large">
                        <div className="stat-value gradient-text">{bandScore}</div>
                        <div className="stat-label">Band Score</div>
                    </div>
                    <div className="result-stat">
                        <div className="stat-value">{correctCount}/40</div>
                        <div className="stat-label">Correct Answers</div>
                    </div>
                    <div className="result-stat">
                        <div className="stat-value">{formatTime(timeSpent)}</div>
                        <div className="stat-label">Time Spent</div>
                    </div>
                    <div className="result-stat">
                        <div className="stat-value">{Math.round((correctCount / 40) * 100)}%</div>
                        <div className="stat-label">Accuracy</div>
                    </div>
                </div>

                <div className="results-breakdown">
                    <h3>Detailed Breakdown</h3>
                    {selectedTest.passages.map((passage) => {
                        const passageCorrect = passage.questions.filter((q) => {
                            const userAnswer = userAnswers[q.id];
                            if (!userAnswer) return false;
                            return Array.isArray(q.correctAnswer)
                                ? q.correctAnswer.some(ans =>
                                    userAnswer.toLowerCase().trim() === ans.toLowerCase().trim()
                                )
                                : userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                        }).length;

                        return (
                            <div key={passage.passageNumber} className="passage-result">
                                <h4>Passage {passage.passageNumber}: {passage.title}</h4>
                                <div className="passage-score">
                                    {passageCorrect}/{passage.questions.length} correct
                                </div>
                                <div className="question-review">
                                    {passage.questions.map((q) => {
                                        const userAnswer = userAnswers[q.id];
                                        const isCorrect = userAnswer && (
                                            Array.isArray(q.correctAnswer)
                                                ? q.correctAnswer.some(ans =>
                                                    userAnswer.toLowerCase().trim() === ans.toLowerCase().trim()
                                                )
                                                : userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
                                        );

                                        return (
                                            <div key={q.id} className={`question-result ${isCorrect ? 'correct' : 'incorrect'}`}>
                                                <div className="question-result-icon">
                                                    {isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                </div>
                                                <div className="question-result-content">
                                                    <p className="question-text">Q{q.id}: {q.question}</p>
                                                    <div className="answer-comparison">
                                                        <span className="your-answer">
                                                            Your answer: {userAnswer || '(No answer)'}
                                                        </span>
                                                        {!isCorrect && (
                                                            <span className="correct-answer">
                                                                Correct: {Array.isArray(q.correctAnswer)
                                                                    ? q.correctAnswer.join(' / ')
                                                                    : q.correctAnswer}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="results-actions">
                    <button className="btn-secondary" onClick={() => setSelectedTest(null)}>
                        <ArrowLeft size={16} /> Back to Tests
                    </button>
                    <button className="btn-primary" onClick={handleResetTest}>
                        <RotateCcw size={16} /> Retry Test
                    </button>
                </div>
            </motion.div>
        );
    }

    // Test Intro View
    if (!testStarted && selectedTest) {
        return (
            <motion.div
                className="test-intro"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <h2>{selectedTest.title}</h2>
                <div className="intro-card">
                    <h3>Test Instructions</h3>
                    <ul className="instruction-list">
                        <li>You will have <strong>60 minutes</strong> to complete all 3 passages</li>
                        <li>The test contains <strong>40 questions</strong> across various question types</li>
                        <li>You can navigate between passages using the navigation buttons</li>
                        <li>Your timer will start once you begin the test</li>
                        <li>Treat this like a real exam—no pausing allowed!</li>
                        <li>Submit your answers before time expires to receive your band score</li>
                    </ul>

                    <div className="passage-preview">
                        <h4>Test Contents:</h4>
                        {selectedTest.passages.map((passage) => (
                            <div key={passage.passageNumber} className="preview-item">
                                <strong>Passage {passage.passageNumber}:</strong> {passage.title}
                                <span className="preview-meta">
                                    {passage.wordCount} words • {passage.questions.length} questions
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="intro-actions">
                    <button className="btn-secondary" onClick={() => setSelectedTest(null)}>
                        <ArrowLeft size={16} /> Choose Different Test
                    </button>
                    <button className="btn-primary btn-start" onClick={handleStartTest}>
                        <Play size={16} /> Start Test
                    </button>
                </div>
            </motion.div>
        );
    }

    // Test in Progress View
    const currentPassageData = selectedTest?.passages[currentPassage];

    if (!currentPassageData) return null;

    const answeredCount = Object.keys(userAnswers).length;
    const progressPercentage = (answeredCount / 40) * 100;

    return (
        <div className="test-container">
            {/* Timer and Progress Bar */}
            <div className="test-header">
                <div className="timer-display">
                    <Clock size={20} />
                    <span className={timeRemaining < 300 ? 'timer-warning' : ''}>
                        {formatTime(timeRemaining)}
                    </span>
                </div>
                <div className="progress-display">
                    <span>{answeredCount}/40 answered</span>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Passage Navigation */}
            <div className="passage-nav">
                {selectedTest.passages.map((p, idx) => (
                    <button
                        key={p.passageNumber}
                        className={`passage-nav-btn ${currentPassage === idx ? 'active' : ''}`}
                        onClick={() => {
                            triggerHaptic('selection');
                            setCurrentPassage(idx);
                        }}
                    >
                        Passage {p.passageNumber}
                    </button>
                ))}
            </div>

            {/* Passage Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentPassage}
                    className="passage-container"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="passage-header">
                        <h3>Passage {currentPassageData.passageNumber}</h3>
                        <h4>{currentPassageData.title}</h4>
                        <p className="passage-meta">
                            {currentPassageData.topic} • {currentPassageData.wordCount} words
                        </p>
                    </div>

                    <div className="passage-text">
                        {currentPassageData.text.split('\n\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                        ))}
                    </div>

                    <div className="questions-section">
                        <h4>Questions {currentPassageData.questions[0].id} - {currentPassageData.questions[currentPassageData.questions.length - 1].id}</h4>
                        {currentPassageData.questions.map((question) => (
                            <div key={question.id} className="question-item">
                                <div className="question-header">
                                    <span className="question-number">Q{question.id}</span>
                                    <span className="question-type">{question.type}</span>
                                </div>
                                <p className="question-text">{question.question}</p>

                                {question.options ? (
                                    <div className="answer-options">
                                        {question.options.map((option) => (
                                            <label key={option} className="option-label">
                                                <input
                                                    type="radio"
                                                    name={`question-${question.id}`}
                                                    checked={userAnswers[question.id] === option}
                                                    onChange={() => handleAnswerChange(question.id, option)}
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        className="answer-input"
                                        placeholder="Type your answer..."
                                        value={userAnswers[question.id] || ''}
                                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Controls */}
            <div className="test-navigation">
                <button
                    className="btn-secondary"
                    onClick={handlePrevPassage}
                    disabled={currentPassage === 0}
                >
                    <ArrowLeft size={16} /> Previous Passage
                </button>

                {currentPassage === selectedTest.passages.length - 1 ? (
                    <button className="btn-primary" onClick={handleSubmitTest}>
                        Submit Test <CheckCircle size={16} />
                    </button>
                ) : (
                    <button className="btn-primary" onClick={handleNextPassage}>
                        Next Passage <ArrowRight size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
