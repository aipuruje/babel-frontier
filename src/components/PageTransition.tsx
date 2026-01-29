import { motion } from 'framer-motion';
import React from 'react';

/**
 * Page transition variants (iOS-style slide)
 */
const pageVariants = {
    initial: {
        opacity: 0,
        x: 20,
        scale: 0.98
    },
    in: {
        opacity: 1,
        x: 0,
        scale: 1
    },
    out: {
        opacity: 0,
        x: -20,
        scale: 0.98
    }
};

/**
 * Telegram-optimized transition timing
 */
const pageTransition = {
    type: 'tween',
    ease: [0.42, 0, 0.58, 1], // Telegram's cubic-bezier
    duration: 0.3
};

interface PageTransitionProps {
    children: React.ReactNode;
}

/**
 * Wrapper component for smooth page transitions
 * Use this to wrap page content for iOS-style animations
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => (
    <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        style={{
            height: '100%',
            width: '100%'
        }}
    >
        {children}
    </motion.div>
);
