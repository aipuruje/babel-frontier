/**
 * Pedagogical Knowledge Graph
 * Loads pedagogy-manifest.json and creates intelligent error correction
 */

import pedagogyManifest from '../../pedagogy-manifest.json';

export class PedagogyEngine {
    constructor() {
        this.manifest = pedagogyManifest;
        this.bandProgression = this.manifest.band_progression;
    }

    /**
     * Determine band score based on total damage
     */
    getBandFromDamage(totalDamage) {
        for (const [bandName, bandData] of Object.entries(this.bandProgression)) {
            const [minDamage, maxDamage] = bandData.damage_range;
            if (totalDamage >= minDamage && totalDamage <= maxDamage) {
                return {
                    band: bandName,
                    label: bandData.label,
                    color: bandData.color,
                    icon: bandData.icon,
                    description: bandData.description
                };
            }
        }
        return this.bandProgression['band_3.5'];
    }

    /**
     * Calculate XP based on performance
     */
    calculateXP(wordCount, pauseCount, pronunciationAccuracy = 100) {
        const baseXP = wordCount * 10;
        const pausePenalty = pauseCount * 20;
        const pronunciationBonus = (pronunciationAccuracy / 100) * 50;

        return Math.max(0, baseXP - pausePenalty + pronunciationBonus);
    }

    /**
     * Detect L1 interference patterns (Uzbek/Russian → English)
     */
    detectL1Interference(transcription) {
        const errors = [];

        // V-W confusion (Russian/Uzbek speakers)
        const vwPattern = /\b(wery|wictory|wideo|walue|wisa)\b/gi;
        if (vwPattern.test(transcription)) {
            errors.push({
                type: 'pronunciation',
                pattern: 'V-W confusion',
                correction: 'Practice: "very", "victory", "video" (V sound)',
                severity: 'high'
            });
        }

        // Omitted articles (common in Uzbek)
        const articlePattern = /\b(I am|I go|I like)\s+(teacher|student|doctor|to)\b/gi;
        if (articlePattern.test(transcription)) {
            errors.push({
                type: 'grammar',
                pattern: 'Missing article',
                correction: 'Use "a/an/the" before nouns',
                severity: 'medium'
            });
        }

        // Hard "R" pronunciation
        const hardRPattern = /\b(vork|vorld|vords)\b/gi;
        if (hardRPattern.test(transcription)) {
            errors.push({
                type: 'pronunciation',
                pattern: 'Hard R → W substitution',
                correction: 'Practice soft "w" sound in "work", "world"',
                severity: 'high'
            });
        }

        return errors;
    }

    /**
     * Generate personalized feedback
     */
    generateFeedback(bandData, errors, wordCount) {
        let feedback = [];

        // Band-specific feedback
        if (bandData.band === 'band_9.0') {
            feedback.push('🎉 Perfect fluency! You are an IELTS master!');
        } else if (bandData.band.startsWith('band_8')) {
            feedback.push('⭐ Excellent! Minor improvements will get you to Band 9.');
        } else if (bandData.band.startsWith('band_7')) {
            feedback.push('💫 Good work! Focus on reducing hesitation.');
        } else if (bandData.band.startsWith('band_6')) {
            feedback.push('⚡ Competent! Practice speaking longer without pauses.');
        } else {
            feedback.push('🔥 Keep practicing! Build your vocabulary and fluency.');
        }

        // Error-specific feedback
        errors.forEach(error => {
            feedback.push(`⚠️ ${error.pattern}: ${error.correction}`);
        });

        // Word count feedback
        if (wordCount < 20) {
            feedback.push('💬 Try to speak more! Aim for 30+ words per response.');
        }

        return feedback.join('\n');
    }

    /**
     * Unlock equipment based on band level
     */
    getUnlockedEquipment(bandName) {
        const bandNum = parseFloat(bandName.replace('band_', ''));
        const equipment = [];

        if (bandNum >= 4.5) {
            equipment.push({
                type: 'cape',
                name: 'Basic Lexical Cape',
                glow: 'dim',
                color: '#f97316'
            });
        }
        if (bandNum >= 6.0) {
            equipment.push({
                type: 'boots',
                name: 'Fluency Boots',
                glow: 'medium',
                color: '#eab308'
            });
        }
        if (bandNum >= 7.0) {
            equipment.push({
                type: 'armor',
                name: 'Advanced Rhetoric Armor',
                glow: 'bright',
                color: '#22c55e'
            });
        }
        if (bandNum >= 8.5) {
            equipment.push({
                type: 'crown',
                name: 'Crown of Eloquence',
                glow: 'radiant',
                color: '#00ff00'
            });
        }

        return equipment;
    }
}

export default PedagogyEngine;
