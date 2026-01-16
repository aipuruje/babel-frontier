import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { triggerHaptic } from '@/utils/telegram';
import { useUserStore } from '@/store/userStore';

// Practice passages with heading matching
const PRACTICE_PASSAGES = [
    {
        id: 1,
        paragraphs: [
            {
                id: 'A',
                text: "The concept of sustainable development emerged in the 1980s as a response to growing environmental concerns. The Brundtland Report of 1987 defined it as development that meets the needs of the present without compromising the ability of future generations to meet their own needs. This landmark definition shifted the global discourse from purely economic growth to a more holistic approach that balances environmental protection, social equity, and economic prosperity."
            },
            {
                id: 'B',
                text: "Implementing sustainable practices in urban planning presents numerous challenges. City planners must balance the demands of a growing population with the need to reduce carbon emissions and preserve green spaces. Infrastructure projects often require significant upfront investment, and the long-term benefits may not be immediately apparent to taxpayers. Additionally, conflicting interests among various stakeholders—developers, residents, environmental groups—can slow down decision-making processes."
            },
            {
                id: 'C',
                text: "Several cities worldwide have successfully demonstrated that sustainable development is achievable. Copenhagen has invested heavily in cycling infrastructure, resulting in over 60% of residents commuting by bicycle. Singapore's extensive green building program has reduced energy consumption in new constructions by up to 30%. These examples prove that with political will and proper resource allocation, cities can transition to more sustainable models while maintaining economic vitality."
            },
            {
                id: 'D',
                text: "The private sector plays an increasingly important role in driving sustainable development. Many corporations now publish annual sustainability reports and set ambitious environmental targets. Companies like Patagonia and Interface have built their entire business models around environmental responsibility, proving that profitability and sustainability are not mutually exclusive. Consumer demand for ethical products has further incentivized businesses to adopt greener practices."
            }
        ],
        headings: [
            { id: 1, text: "The obstacles facing sustainable city design" },
            { id: 2, text: "Historical origins of sustainability concepts" },
            { id: 3, text: "Corporate contributions to environmental goals" },
            { id: 4, text: "Successful urban sustainability initiatives" },
            { id: 5, text: "The economic costs of going green" },
            { id: 6, text: "Government regulations for businesses" },
            { id: 7, text: "Public transportation improvements" }
        ],
        correctAnswers: {
            'A': 2,
            'B': 1,
            'C': 4,
            'D': 3
        },
        explanations: {
            'A': "Paragraph A discusses when sustainable development emerged (1980s) and defines it (Brundtland Report). Heading 2 captures this historical origin perfectly.",
            'B': "Paragraph B focuses entirely on CHALLENGES: balancing demands, investment costs, stakeholder conflicts. Heading 1 matches this theme.",
            'C': "Paragraph C provides EXAMPLES of successful sustainable cities (Copenhagen, Singapore). Heading 4 matches this positive demonstration.",
            'D': "Paragraph D discusses how businesses contribute to sustainability through reports, targets, and ethical practices. Heading 3 captures this corporate role."
        }
    },
    {
        id: 2,
        paragraphs: [
            {
                id: 'A',
                text: "Artificial intelligence systems are increasingly being deployed in medical diagnosis, often outperforming human doctors in detecting certain conditions. Machine learning algorithms trained on thousands of medical images can identify patterns that might escape even experienced radiologists. For instance, AI systems have demonstrated over 95% accuracy in detecting diabetic retinopathy from eye scans, potentially preventing blindness in millions of patients."
            },
            {
                id: 'B',
                text: "Despite impressive technological capabilities, significant ethical concerns surround AI in healthcare. Questions about liability when AI systems make errors, patient privacy in data-intensive systems, and the potential for algorithmic bias remain unresolved. Healthcare professionals worry that over-reliance on AI could lead to deskilling of medical practitioners and erosion of the doctor-patient relationship. These concerns must be addressed before AI can be fully integrated into clinical practice."
            },
            {
                id: 'C',
                text: "The integration of AI in healthcare requires substantial infrastructure investment and systemic changes. Hospitals need to upgrade their IT systems, train staff in new technologies, and establish protocols for AI-assisted decision-making. Smaller clinics and healthcare facilities in developing countries often lack the resources for such transformations. This digital divide could exacerbate existing healthcare inequalities between wealthy and poor regions."
            },
            {
                id: 'D',
                text: "Looking ahead, experts predict that AI will become an indispensable tool in personalized medicine. By analyzing patients' genetic data, lifestyle factors, and medical histories, AI systems could tailor treatments to individual needs with unprecedented precision. Predictive algorithms might identify disease risks years in advance, enabling preventive interventions. This shift from reactive to predictive healthcare could fundamentally transform medical practice by 2030."
            }
        ],
        headings: [
            { id: 1, text: "AI's superior diagnostic performance" },
            { id: 2, text: "Moral and practical dilemmas in medical AI" },
            { id: 3, text: "Resource requirements for healthcare AI adoption" },
            { id: 4, text: "Future applications of AI in treatment" },
            { id: 5, text: "The cost of medical technology" },
            { id: 6, text: "Training doctors to use computers" },
            { id: 7, text: "Patient resistance to automated care" }
        ],
        correctAnswers: {
            'A': 1,
            'B': 2,
            'C': 3,
            'D': 4
        },
        explanations: {
            'A': "Paragraph A emphasizes AI outperforming doctors (95% accuracy example). Heading 1 captures this superior diagnostic capability.",
            'B': "Paragraph B lists ethical concerns: liability, privacy, bias, deskilling. Heading 2 matches these moral/practical dilemmas.",
            'C': "Paragraph C discusses infrastructure needs, costs, training, and resource inequalities. Heading 3 captures these adoption requirements.",
            'D': "Paragraph D is future-focused: personalized medicine, predictive prevention by 2030. Heading 4 matches future applications."
        }
    },
    {
        id: 3,
        paragraphs: [
            {
                id: 'A',
                text: "Behavioral economics has fundamentally challenged the assumption that humans are rational decision-makers. Traditional economic theory posited that individuals systematically weigh costs and benefits to maximize utility. However, research by Daniel Kahneman and Amos Tversky demonstrated that cognitive biases and heuristics—mental shortcuts—often lead to predictably irrational choices. Their prospect theory revealed that people fear losses more intensely than they value equivalent gains, a phenomenon known as loss aversion."
            },
            {
                id: 'B',
                text: "The application of behavioral insights has transformed public policy in numerous countries. The UK's Behavioural Insights Team, nicknamed the 'Nudge Unit,' has successfully increased organ donation registrations by changing default options on driver's license applications. Similarly, automatically enrolling employees in pension schemes while allowing them to opt out has dramatically boosted retirement savings rates. These 'nudges' preserve freedom of choice while steering people toward decisions that benefit their long-term welfare."
            },
            {
                id: 'C',
                text: "Critics argue that behavioral interventions raise ethical concerns about manipulation and paternalism. When governments design choice architectures that influence behavior without explicit persuasion, some philosophers question whether this respects individual autonomy. There are also practical limitations: nudges that work in controlled experiments may fail in complex real-world environments. Furthermore, behavioral effects can diminish over time as people habituate to interventions or recognize the manipulation attempt."
            },
            {
                id: 'D',
                text: "Despite controversies, behavioral economics continues to expand into new domains. Retailers use insights about anchoring effects to influence pricing perceptions. Digital platforms employ choice architecture to guide user behavior, from default privacy settings to the presentation of content feeds. As our understanding of decision-making psychology deepens, the boundary between helpful guidance and manipulative coercion remains a subject of ongoing debate among ethicists, policymakers, and behavioral scientists."
            }
        ],
        headings: [
            { id: 1, text: "Questioning the rationality assumption in economics" },
            { id: 2, text: "Practical use of behavioral science in governance" },
            { id: 3, text: "Moral and methodological objections to nudging" },
            { id: 4, text: "Expanding applications in commerce and technology" },
            { id: 5, text: "The history of economic thought" },
            { id: 6, text: "Mathematical models in decision theory" },
            { id: 7, text: "Consumer protection legislation" }
        ],
        correctAnswers: {
            'A': 1,
            'B': 2,
            'C': 3,
            'D': 4
        },
        explanations: {
            'A': "Paragraph A challenges traditional rational choice theory and introduces cognitive biases. Heading 1 captures this questioning of rationality assumptions.",
            'B': "Paragraph B provides specific examples of behavioral policies (organ donation, pensions) in real governance. Heading 2 matches practical policy applications.",
            'C': "Paragraph C discusses ethical objections (manipulation, paternalism) and practical limitations. Heading 3 captures these moral/methodological concerns.",
            'D': "Paragraph D shows expansion into retail, digital platforms despite debates. Heading 4 matches expanding commercial/tech applications."
        }
    },
    {
        id: 4,
        paragraphs: [
            {
                id: 'A',
                text: "Neuroplasticity—the brain's ability to reorganize itself by forming new neural connections—has revolutionized our understanding of brain development and recovery. For decades, neuroscientists believed that the adult brain was relatively fixed, with limited capacity for change. Groundbreaking research in the 1990s overturned this dogma, revealing that the brain continually remodels its structure in response to experience, learning, and even injury. This discovery has profound implications for rehabilitation, education, and our conception of human potential."
            },
            {
                id: 'B',
                text: "Brain-training programs have proliferated on the promise of enhancing cognitive function through targeted mental exercises. Companies market apps and games claiming to improve memory, attention, and problem-solving abilities. Some studies suggest modest improvements in specific trained tasks. However, a controversial 2016 meta-analysis found minimal evidence that such gains transfer to broader cognitive abilities or everyday functioning. The consensus among neuroscientists is that while the brain is plastic, commercial brain-training benefits are often oversold."
            },
            {
                id: 'C',
                text: "Stroke survivors have benefited significantly from neuroplasticity-based therapies. Constraint-induced movement therapy, which forces patients to use affected limbs, can trigger reorganization of motor cortex regions. Similarly, intensive language therapy following stroke-induced aphasia has shown remarkable results, with brain scans revealing activation in previously dormant areas. These clinical successes demonstrate that with appropriate intervention, the brain can compensate for damaged regions by recruiting alternative neural pathways."
            },
            {
                id: 'D',
                text: "Environmental factors play a crucial role in shaping neural plasticity throughout the lifespan. Enriched environments—characterized by physical activity, social interaction, and cognitive stimulation—promote neurogenesis and synaptic density. Conversely, chronic stress and social isolation can impair plastic processes, contributing to conditions like depression and cognitive decline. Understanding these environmental influences has led to holistic approaches in mental health treatment that emphasize lifestyle modifications alongside traditional interventions."
            }
        ],
        headings: [
            { id: 1, text: "The paradigm shift in brain science" },
            { id: 2, text: "Doubts about commercial cognitive enhancement claims" },
            { id: 3, text: "Recovery mechanisms in stroke patients" },
            { id: 4, text: "Environmental determinants of brain adaptability" },
            { id: 5, text: "Surgical treatments for brain damage" },
            { id: 6, text: "Genetic factors in intelligence" },
            { id: 7, text: "Brain imaging technology advances" }
        ],
        correctAnswers: {
            'A': 1,
            'B': 2,
            'C': 3,
            'D': 4
        },
        explanations: {
            'A': "Paragraph A describes how neuroplasticity overturned the fixed-brain belief. Heading 1 captures this paradigm shift in neuroscience.",
            'B': "Paragraph B discusses brain-training apps, studies showing limited transfer, overselling. Heading 2 matches skepticism about commercial claims.",
            'C': "Paragraph C focuses on stroke therapy successes (motor, language) via neural reorganization. Heading 3 matches recovery mechanisms.",
            'D': "Paragraph D explains how environment (exercise, stress) shapes plasticity. Heading 4 captures environmental determinants."
        }
    },
    {
        id: 5,
        paragraphs: [
            {
                id: 'A',
                text: "Biodiversity loss is accelerating at an unprecedented rate, with species extinction occurring at levels comparable to the five major mass extinction events in Earth's geological history. The 2019 IPBES Global Assessment reported that one million animal and plant species are threatened with extinction, many within decades. Unlike previous mass extinctions caused by natural phenomena like asteroid impacts or volcanic eruptions, the current crisis is driven almost entirely by human activities: habitat destruction, overexploitation, pollution, invasive species, and climate change."
            },
            {
                id: 'B',
                text: "Ecosystem services—the benefits nature provides to humanity—are profoundly threatened by biodiversity decline. Pollination by insects contributes an estimated $577 billion annually to global agriculture. Wetlands filter water and buffer coastal communities against storm surges. Diverse forests regulate climate and prevent soil erosion. As species disappear, these critical services degrade, often irreversibly. The economic costs of biodiversity loss, while difficult to quantify comprehensively, likely run into trillions of dollars when ecosystem collapse is factored in."
            },
            {
                id: 'C',
                text: "Conservation strategies are evolving to address the biodiversity crisis at multiple scales. Protected areas, which cover roughly 15% of terrestrial and 7% of marine environments, remain a cornerstone approach. However, scientists increasingly emphasize the importance of habitat corridors that allow species migration and gene flow between reserves. Community-based conservation, which involves local populations in stewardship, has shown promise in regions where traditional top-down protection failed. Rewilding initiatives in Europe and North America aim to restore ecosystem function by reintroducing apex predators and allowing natural processes to resume."
            },
            {
                id: 'D',
                text: "Technological innovations offer new tools for biodiversity monitoring and protection. Environmental DNA (eDNA) sampling enables scientists to detect species presence from water or soil samples, dramatically reducing survey costs. Satellite imagery combined with machine learning algorithms can track deforestation and illegal wildlife trade in near real-time. Genetic rescue techniques, including assisted gene flow and even de-extinction efforts, represent controversial frontiers. While technology cannot substitute for habitat preservation and sustainable resource use, it enhances our capacity to understand and respond to ecological threats."
            }
        ],
        headings: [
            { id: 1, text: "The human-driven extinction crisis" },
            { id: 2, text: "Economic value of natural systems" },
            { id: 3, text: "Multi-scale approaches to species protection" },
            { id: 4, text: "High-tech solutions for ecological surveillance" },
            { id: 5, text: "Ancient extinction events" },
            { id: 6, text: "Farming practices and wildlife" },
            { id: 7, text: "Ocean acidification impacts" }
        ],
        correctAnswers: {
            'A': 1,
            'B': 2,
            'C': 3,
            'D': 4
        },
        explanations: {
            'A': "Paragraph A discusses unprecedented species loss driven by human activities. Heading 1 captures this human-driven extinction crisis.",
            'B': "Paragraph B quantifies ecosystem services ($577B pollination) and economic costs. Heading 2 matches economic value of nature.",
            'C': "Paragraph C describes protected areas, corridors, community-based efforts, rewilding. Heading 3 matches multi-scale protection strategies.",
            'D': "Paragraph D covers eDNA, satellite tracking, genetic techniques. Heading 4 matches high-tech ecological monitoring solutions."
        }
    },
    {
        id: 6,
        paragraphs: [
            {
                id: 'A',
                text: "Quantum computing represents a fundamental departure from classical information processing. While classical computers encode data as binary bits (0 or 1), quantum computers use quantum bits, or qubits, which can exist in superposition—simultaneously representing multiple states. This property, combined with quantum entanglement, enables quantum computers to perform certain calculations exponentially faster than the most powerful classical supercomputers. Theoretically, quantum machines could revolutionize fields from cryptography to drug discovery by solving problems currently deemed intractable."
            },
            {
                id: 'B',
                text: "The technical challenges of building stable quantum computers are formidable. Qubits are extremely fragile, susceptible to decoherence from the slightest environmental interference—vibrations, temperature fluctuations, or electromagnetic radiation. Maintaining quantum states requires cooling systems that reach temperatures colder than outer space. Error rates in current quantum processors remain high, necessitating complex error-correction protocols that consume additional qubits. Despite billions in investment from tech giants and governments, no quantum computer has yet demonstrated practical advantage over classical systems for real-world applications."
            },
            {
                id: 'C',
                text: "Specific algorithms have been developed to exploit quantum computational advantages. Shor's algorithm could factor large numbers exponentially faster, potentially breaking widely-used encryption systems like RSA. Grover's algorithm offers quadratic speedup for database searches. In chemistry and materials science, quantum computers could simulate molecular interactions with a precision impossible for classical machines, accelerating drug development and materials engineering. However, these applications require quantum processors with thousands of error-corrected qubits—a milestone still years away."
            },
            {
                id: 'D',
                text: "The race for quantum supremacy has geopolitical implications as nations recognize its strategic importance. China has invested heavily in quantum communication networks and research facilities. The United States maintains leadership in quantum software and algorithm development through companies like IBM and Google. The European Union has launched a billion-euro quantum flagship initiative. This competition reflects not only commercial potential but concerns about cryptographic security: the nation that achieves large-scale quantum computing first could decrypt rivals' secure communications and gain unprecedented intelligence advantages."
            }
        ],
        headings: [
            { id: 1, text: "Core principles distinguishing quantum from classical computing" },
            { id: 2, text: "Engineering obstacles in quantum hardware development" },
            { id: 3, text: "Algorithms designed for quantum acceleration" },
            { id: 4, text: "International competition in quantum technology" },
            { id: 5, text: "History of computer science" },
            { id: 6, text: "Quantum physics education" },
            { id: 7, text: "Consumer electronics trends" }
        ],
        correctAnswers: {
            'A': 1,
            'B': 2,
            'C': 3,
            'D': 4
        },
        explanations: {
            'A': "Paragraph A explains qubits, superposition, entanglement vs classical bits. Heading 1 captures core quantum/classical distinctions.",
            'B': "Paragraph B discusses fragility, decoherence, cooling requirements, error rates. Heading 2 matches engineering obstacles.",
            'C': "Paragraph C describes Shor's, Grover's algorithms and quantum simulation apps. Heading 3 matches quantum-specific algorithms.",
            'D': "Paragraph D covers China, US, EU investments and cryptographic security implications. Heading 4 matches international competition."
        }
    },
    {
        id: 7,
        paragraphs: [
            {
                id: 'A',
                text: "Intrinsic motivation—engaging in activities for inherent satisfaction rather than external rewards—has long been recognized as superior to extrinsic motivation in workplace contexts. Self-determination theory posits that autonomy, competence, and relatedness are fundamental psychological needs that, when satisfied, foster intrinsic motivation. Employees who feel ownership over their work, believe they are developing skills, and experience meaningful connections with colleagues demonstrate higher job satisfaction, creativity, and performance. This contrasts sharply with motivation driven solely by pay, bonuses, or threat of punishment."
            },
            {
                id: 'B',
                text: "Paradoxically, traditional incentive structures may undermine intrinsic motivation through a phenomenon called the 'overjustification effect.' When extrinsic rewards are introduced for activities people already find enjoyable, the external incentive can displace internal interest. A classic study showed that children who were rewarded for drawing—an activity they initially enjoyed—subsequently drew less when rewards were removed. Similarly, performance-based pay systems can reduce employee engagement if they shift focus from the intrinsic meaning of work to purely transactional outcomes."
            },
            {
                id: 'C',
                text: "Organizations are experimenting with alternative management approaches that prioritize intrinsic motivation. Google's famous '20% time' policy allows engineers to spend one day per week on passion projects, fostering autonomy and yielding innovations like Gmail. Results-Only Work Environments (ROWE) eliminate fixed schedules, measuring employees solely on output rather than hours worked. Job crafting initiatives empower workers to redesign aspects of their roles to better align with personal strengths and interests. These practices aim to create conditions where high performance emerges from genuine engagement rather than compliance."
            },
            {
                id: 'D',
                text: "Critics caution against oversimplifying the intrinsic versus extrinsic motivation dichotomy. In reality, most workplace motivation is multifaceted, combining internal drives with external factors. Fair compensation remains essential—it is difficult to feel intrinsically motivated when struggling financially. Moreover, extrinsic rewards can be effective when designed to support rather than control, such as bonuses that recognize achievement without micromanaging processes. The challenge for organizations is crafting motivational systems that integrate meaningful work with appropriate external recognition."
            }
        ],
        headings: [
            { id: 1, text: "The psychological foundations of internal work drive" },
            { id: 2, text: "How external rewards can diminish natural interest" },
            { id: 3, text: "Innovative practices fostering employee autonomy" },
            { id: 4, text: "Balancing internal and external motivational factors" },
            { id: 5, text: "Unemployment statistics analysis" },
            { id: 6, text: "Remote work technology tools" },
            { id: 7, text: "Corporate hierarchy structures" }
        ],
        correctAnswers: {
            'A': 1,
            'B': 2,
            'C': 3,
            'D': 4
        },
        explanations: {
            'A': "Paragraph A introduces self-determination theory, autonomy/competence/relatedness. Heading 1 captures psychological foundations of intrinsic motivation.",
            'B': "Paragraph B explains overjustification effect with drawing study example. Heading 2 matches how external rewards diminish interest.",
            'C': "Paragraph C describes Google's 20% time, ROWE, job crafting initiatives. Heading 3 matches innovative autonomy-fostering practices.",
            'D': "Paragraph D argues motivation is multifaceted, fair pay essential, can integrate both types. Heading 4 matches balancing internal/external factors."
        }
    }
];

export default function PracticeExercise() {
    const [currentPassage, setCurrentPassage] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number | null>>({});
    const [showResults, setShowResults] = useState(false);
    const { updateXP } = useUserStore();

    const passage = PRACTICE_PASSAGES[currentPassage];

    const handleAnswerChange = (paragraphId: string, headingId: number) => {
        setAnswers((prev) => ({ ...prev, [paragraphId]: headingId }));
        triggerHaptic('selection');
    };

    const handleSubmit = () => {
        setShowResults(true);

        // Calculate score
        const correct = Object.keys(passage.correctAnswers).filter(
            (paraId) => answers[paraId] === passage.correctAnswers[paraId as keyof typeof passage.correctAnswers]
        ).length;

        const xpGained = correct * 25; // 25 XP per correct heading match
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

    const correctCount = Object.keys(passage.correctAnswers).filter(
        (paraId) => answers[paraId] === passage.correctAnswers[paraId as keyof typeof passage.correctAnswers]
    ).length;

    const isAnswered = passage.paragraphs.every((para) => answers[para.id] !== undefined && answers[para.id] !== null);

    return (
        <div className="practice-exercise">
            {/* Instructions */}
            <div className="heading-instructions">
                <h3>Matching Headings to Paragraphs</h3>
                <p>
                    The passage has {passage.paragraphs.length} paragraphs labeled A-{String.fromCharCode(64 + passage.paragraphs.length)}.
                    Choose the correct heading for each paragraph from the list of headings below.
                </p>
                <p className="instruction-note">
                    There are more headings than paragraphs, so you will not use all of them.
                </p>
            </div>

            {/* Headings List */}
            <div className="headings-list">
                <h4>List of Headings:</h4>
                {passage.headings.map((heading) => {
                    const isUsed = Object.values(answers).includes(heading.id);
                    const isCorrect = showResults && Object.entries(passage.correctAnswers).some(
                        ([, correctId]) => correctId === heading.id
                    );

                    return (
                        <div
                            key={heading.id}
                            className={`heading-item ${isUsed ? 'used' : ''} ${showResults && isCorrect ? 'correct-heading' : ''}`}
                        >
                            <span className="heading-number">#{heading.id}</span>
                            <span className="heading-text">{heading.text}</span>
                            {showResults && isCorrect && <Check size={16} className="correct-mark" />}
                        </div>
                    );
                })}
            </div>

            {/* Paragraphs */}
            <div className="paragraphs-section">
                {passage.paragraphs.map((paragraph, index) => (
                    <motion.div
                        key={paragraph.id}
                        className={`paragraph-card ${showResults ? (answers[paragraph.id] === passage.correctAnswers[paragraph.id as keyof typeof passage.correctAnswers] ? 'correct' : 'incorrect') : ''}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="paragraph-header">
                            <div className="paragraph-label">Paragraph {paragraph.id}</div>
                            {showResults && (
                                <div className="answer-status">
                                    {answers[paragraph.id] === passage.correctAnswers[paragraph.id as keyof typeof passage.correctAnswers] ? (
                                        <Check size={20} className="status-correct" />
                                    ) : (
                                        <X size={20} className="status-incorrect" />
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="paragraph-text">{paragraph.text}</div>

                        <div className="heading-selector">
                            <label>Choose heading:</label>
                            <select
                                value={answers[paragraph.id] || ''}
                                onChange={(e) => handleAnswerChange(paragraph.id, Number(e.target.value))}
                                disabled={showResults}
                                className="heading-dropdown"
                            >
                                <option value="">-- Select a heading --</option>
                                {passage.headings.map((heading) => (
                                    <option key={heading.id} value={heading.id}>
                                        #{heading.id}: {heading.text}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {showResults && (
                            <div className={`explanation ${answers[paragraph.id] === passage.correctAnswers[paragraph.id as keyof typeof passage.correctAnswers] ? 'correct-exp' : 'incorrect-exp'}`}>
                                <strong>
                                    {answers[paragraph.id] === passage.correctAnswers[paragraph.id as keyof typeof passage.correctAnswers] ? '✓ Correct!' : '✗ Incorrect'}
                                </strong>
                                <p>
                                    <strong>Correct heading:</strong> #{passage.correctAnswers[paragraph.id as keyof typeof passage.correctAnswers]} -
                                    {passage.headings.find((h) => h.id === passage.correctAnswers[paragraph.id as keyof typeof passage.correctAnswers])?.text}
                                </p>
                                <p>{passage.explanations[paragraph.id as keyof typeof passage.explanations]}</p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Submit/Results */}
            {!showResults && isAnswered && (
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
                            <span className="score-value">{correctCount}/{passage.paragraphs.length}</span>
                            <span className="score-label">Correct</span>
                        </div>
                        <div className="score-percentage">
                            {Math.round((correctCount / passage.paragraphs.length) * 100)}% Accuracy
                        </div>
                    </div>

                    <div className="results-stats">
                        <div className="result-stat">
                            <div className="result-stat-label">XP Earned</div>
                            <div className="result-stat-value gradient-text">+{correctCount * 25}</div>
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
