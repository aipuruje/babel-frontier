import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Globe, Award } from 'lucide-react';
import { SUCCESS_METRICS } from '@/data/testimonials';
import './SuccessMetricsBadge.css';

interface SuccessMetricsBadgeProps {
    variant?: 'default' | 'compact';
}

/**
 * Success Metrics Badge - Social Proof Component
 * Displays impressive numbers to build credibility ("10,000+ students achieved Band 7+")
 */
export const SuccessMetricsBadge: React.FC<SuccessMetricsBadgeProps> = ({ variant = 'default' }) => {
    const metrics = [
        {
            icon: Users,
            value: SUCCESS_METRICS.totalStudents.toLocaleString(),
            label: 'Active Students',
            color: '#6366f1',
        },
        {
            icon: Award,
            value: SUCCESS_METRICS.band7Plus.toLocaleString(),
            label: 'Achieved Band 7+',
            color: '#22c55e',
            highlight: true,
        },
        {
            icon: TrendingUp,
            value: `+${SUCCESS_METRICS.averageImprovement}`,
            label: 'Avg Improvement',
            color: '#f59e0b',
        },
        {
            icon: Globe,
            value: `${SUCCESS_METRICS.countriesServed}`,
            label: 'Countries',
            color: '#8b5cf6',
        },
    ];

    if (variant === 'compact') {
        return (
            <motion.div
                className="success-badge-compact"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="success-badge-highlight">
                    <Award size={20} />
                    <span className="success-badge-number">
                        {SUCCESS_METRICS.band7Plus.toLocaleString()}+
                    </span>
                    <span className="success-badge-text">
                        students achieved Band 7+ this month
                    </span>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="success-metrics-badge">
            <motion.div
                className="metrics-container"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <h3 className="metrics-title">Trusted by Thousands of IELTS Learners</h3>

                <div className="metrics-grid">
                    {metrics.map((metric, index) => (
                        <motion.div
                            key={index}
                            className={`metric-item ${metric.highlight ? 'metric-highlight' : ''}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 0.5,
                                delay: 0.3 + index * 0.1,
                                type: 'spring',
                                stiffness: 200,
                            }}
                        >
                            <div className="metric-icon" style={{ color: metric.color }}>
                                <metric.icon size={32} />
                            </div>
                            <div className="metric-content">
                                <div className="metric-value" style={{ color: metric.color }}>
                                    {metric.value}
                                </div>
                                <div className="metric-label">{metric.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <p className="metrics-footer">
                    Join {SUCCESS_METRICS.successRate}% of students who improved their band scores!
                </p>
            </motion.div>
        </div>
    );
};

export default SuccessMetricsBadge;
