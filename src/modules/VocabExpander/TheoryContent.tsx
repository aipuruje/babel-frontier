import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, Lightbulb, Zap, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TheoryContent() {
    const { t } = useTranslation();

    return (
        <motion.div
            className="theory-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h2 className="theory-title">{t('modules.vocabulary.theory.title')}</h2>

            <div className="theory-intro">
                <p dangerouslySetInnerHTML={{ __html: t('modules.vocabulary.theory.intro') }} />
            </div>

            {/* Pain Point */}
            <section className="theory-section pain-point-section">
                <h3>
                    <AlertCircle size={20} />
                    {t('modules.vocabulary.theory.painPointTitle')}
                </h3>
                <div className="pain-point-card">
                    <h4>{t('modules.vocabulary.theory.painPointDesc')}</h4>
                    <p dangerouslySetInnerHTML={{ __html: t('modules.vocabulary.theory.trap1Desc') }} />

                    <div className="trap-list">
                        <div className="trap-item">
                            <div className="trap-number">1</div>
                            <div className="trap-content">
                                <h5>{t('modules.vocabulary.theory.trap1Title')}</h5>
                                <p>{t('modules.vocabulary.theory.trap1Desc')}</p>
                                <div className="example">{t('modules.vocabulary.theory.trap1Example')}</div>
                            </div>
                        </div>

                        <div className="trap-item">
                            <div className="trap-number">2</div>
                            <div className="trap-content">
                                <h5>{t('modules.vocabulary.theory.trap2Title')}</h5>
                                <p>{t('modules.vocabulary.theory.trap2Desc')}</p>
                                <div className="example">{t('modules.vocabulary.theory.trap2Example')}</div>
                            </div>
                        </div>

                        <div className="trap-item">
                            <div className="trap-number">3</div>
                            <div className="trap-content">
                                <h5>{t('modules.vocabulary.theory.trap3Title')}</h5>
                                <p>{t('modules.vocabulary.theory.trap3Desc')}</p>
                                <div className="example">{t('modules.vocabulary.theory.trap3Example')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Solution */}
            <section className="theory-section">
                <h3>
                    <Lightbulb size={20} />
                    {t('modules.vocabulary.theory.solutionTitle')}
                </h3>
                <p className="section-intro">
                    {t('modules.vocabulary.theory.solutionIntro')}
                </p>

                <div className="method-steps">
                    <div className="method-step">
                        <div className="step-icon">📖</div>
                        <div className="step-content">
                            <h4>{t('modules.vocabulary.theory.step1')}</h4>
                            <p>{t('modules.vocabulary.theory.step1Desc')}</p>
                            <div className="method-example">
                                <div className="context-sentence" dangerouslySetInnerHTML={{ __html: t('modules.vocabulary.theory.step1Example') }} />
                                <div className="inference">
                                    <strong>{t('modules.vocabulary.theory.step1Inference')}</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="method-step">
                        <div className="step-icon">🔍</div>
                        <div className="step-content">
                            <h4>{t('modules.vocabulary.theory.step2')}</h4>
                            <p>{t('modules.vocabulary.theory.step2Desc')}</p>
                        </div>
                    </div>

                    <div className="method-step">
                        <div className="step-icon">🔗</div>
                        <div className="step-content">
                            <h4>{t('modules.vocabulary.theory.step3')}</h4>
                            <p>{t('modules.vocabulary.theory.step3Desc')}</p>
                        </div>
                    </div>

                    <div className="method-step">
                        <div className="step-icon">♻️</div>
                        <div className="step-content">
                            <h4>{t('modules.vocabulary.theory.step4')}</h4>
                            <p>{t('modules.vocabulary.theory.step4Desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* The 500 Words */}
            <section className="theory-section">
                <h3>
                    <TrendingUp size={20} />
                    {t('modules.vocabulary.theory.listTitle')}
                </h3>
                <p className="section-intro">
                    {t('modules.vocabulary.theory.listIntro')}
                </p>

                <div className="word-categories">
                    <div className="word-category">
                        <h4>{t('modules.vocabulary.theory.cat1')}</h4>
                        <p>
                            hypothesis, methodology, empirical, replicate, anomaly, substantiate, refute, postulate,
                            deduce, corroborate
                        </p>
                    </div>

                    <div className="word-category">
                        <h4>{t('modules.vocabulary.theory.cat2')}</h4>
                        <p>
                            quantify, aggregate, extrapolate, correlation, discrepancy, negligible, marginal,
                            fluctuate, plateau, trajectory
                        </p>
                    </div>

                    <div className="word-category">
                        <h4>{t('modules.vocabulary.theory.cat3')}</h4>
                        <p>
                            infrastructure, paradigm, hierarchy, demographic, stratification, cohesion, disparity,
                            integration, segregation, autonomy
                        </p>
                    </div>

                    <div className="word-category">
                        <h4>{t('modules.vocabulary.theory.cat4')}</h4>
                        <p>
                            abstract, conceptual, pragmatic, paradox, dichotomy, synthesis, juxtapose, analogous,
                            inherent, intrinsic
                        </p>
                    </div>

                    <div className="word-category">
                        <h4>{t('modules.vocabulary.theory.cat5')}</h4>
                        <p>
                            precipitate, catalyst, instigate, undermine, perpetuate, accelerate, impede, mitigate,
                            exacerbate, ameliorate
                        </p>
                    </div>
                </div>
            </section>

            {/* Strategy */}
            <section className="theory-section">
                <h3>
                    <Zap size={20} />
                    {t('modules.vocabulary.theory.strategyTitle')}
                </h3>
                <div className="strategy-card">
                    <h4>{t('modules.vocabulary.theory.strategyMethod')}</h4>
                    <p>
                        {t('modules.vocabulary.theory.strategyDesc')}

                    </p>

                    <div className="timeline">
                        <div className="timeline-item">
                            <div className="timeline-day">{t('modules.vocabulary.theory.timeline1')}</div>
                        </div>
                        <div className="timeline-item">
                            <div className="timeline-day">{t('modules.vocabulary.theory.timeline2')}</div>
                        </div>
                        <div className="timeline-item">
                            <div className="timeline-day">{t('modules.vocabulary.theory.timeline3')}</div>
                        </div>
                        <div className="timeline-result">
                            <strong>{t('modules.vocabulary.theory.timelineResult')}</strong>
                        </div>
                    </div>

                    <div className="pro-tip">
                        <BookOpen size={18} />
                        <strong>{t('modules.vocabulary.practice.proTip')}</strong>
                    </div>
                </div>
            </section>

            {/* Practice CTA */}
            <div className="theory-cta">
                <h4>{t('modules.vocabulary.theory.cta')}</h4>
                <p dangerouslySetInnerHTML={{ __html: t('modules.vocabulary.theory.ctaDesc') }} />
            </div>
        </motion.div>
    );
}
