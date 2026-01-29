import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Star, TrendingUp } from 'lucide-react';
import { Testimonial, getTestimonialTag } from '@/data/testimonials';
import './TestimonialsCarousel.css';

interface TestimonialsCarouselProps {
    testimonials: Testimonial[];
    autoPlay?: boolean;
    interval?: number; // milliseconds
}

/**
 * Testimonials Carousel Component
 * Auto-playing carousel optimized for Gen Z attention span (4-second intervals)
 */
export const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({
    testimonials,
    autoPlay = true,
    interval = 5000, // 5 seconds per testimonial
}) => {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);

    const currentTestimonial = testimonials[currentIndex];

    const handleNext = useCallback(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, [testimonials.length]);

    // Auto-play functionality
    useEffect(() => {
        if (!autoPlay) return;

        const timer = setInterval(() => {
            handleNext();
        }, interval);

        return () => clearInterval(timer);
    }, [currentIndex, autoPlay, interval, handleNext]);

    const handlePrev = () => {
        setDirection(-1);
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const handleDotClick = (index: number) => {
        setDirection(index > currentIndex ? 1 : -1);
        setCurrentIndex(index);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction > 0 ? -300 : 300,
            opacity: 0,
        }),
    };

    return (
        <div className="testimonials-carousel">
            <div className="carousel-container">
                {/* Navigation Arrows */}
                <button
                    className="carousel-arrow carousel-arrow-left"
                    onClick={handlePrev}
                    aria-label={t('testimonials.accessibility.prev')}
                >
                    <ChevronLeft size={24} />
                </button>

                <button
                    className="carousel-arrow carousel-arrow-right"
                    onClick={handleNext}
                    aria-label={t('testimonials.accessibility.next')}
                >
                    <ChevronRight size={24} />
                </button>

                {/* Testimonial Card with Animation */}
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                        }}
                        className="testimonial-card"
                    >
                        {/* Tag */}
                        <div className="testimonial-tag">
                            {t(`testimonials.tags.${getTestimonialTag(currentTestimonial)}`)}
                        </div>

                        {/* Avatar & Info */}
                        <div className="testimonial-header">
                            <div className="testimonial-avatar">
                                {currentTestimonial.avatar}
                            </div>
                            <div className="testimonial-info">
                                <h3 className="testimonial-name">
                                    {currentTestimonial.name}
                                </h3>
                                <p className="testimonial-location">
                                    {currentTestimonial.city}, {currentTestimonial.country} • {currentTestimonial.age}
                                </p>
                            </div>
                        </div>

                        {/* Band Score Display */}
                        <div className="band-score-display">
                            <div className="band-score-item band-before">
                                <div className="band-label">{t('testimonials.before')}</div>
                                <div className="band-value">{currentTestimonial.beforeBand}</div>
                            </div>
                            <div className="band-arrow">
                                <TrendingUp size={32} />
                            </div>
                            <div className="band-score-item band-after">
                                <div className="band-label">{t('testimonials.after')}</div>
                                <div className="band-value">{currentTestimonial.afterBand}</div>
                            </div>
                        </div>

                        <div className="band-improvement">
                            {t('testimonials.improvement', {
                                count: parseFloat((currentTestimonial.afterBand - currentTestimonial.beforeBand).toFixed(1)),
                                unit: t('testimonials.unit')
                            })}{' '}
                            {t('testimonials.inDays', { days: currentTestimonial.studyDays })}
                        </div>

                        {/* Quote */}
                        <blockquote className="testimonial-quote">
                            "{currentTestimonial.quote}"
                        </blockquote>

                        {/* Achievement */}
                        {currentTestimonial.goal && (
                            <div className="testimonial-achievement">
                                <Star size={16} />
                                {currentTestimonial.goal}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Dots Indicator */}
                <div className="carousel-dots">
                    {testimonials.map((_, index) => (
                        <button
                            key={index}
                            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => handleDotClick(index)}
                            aria-label={t('testimonials.accessibility.goTo', { index: index + 1 })}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TestimonialsCarousel;
