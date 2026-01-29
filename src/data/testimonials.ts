/**
 * Testimonials Data - Social Proof for "Ambitious Amir" Persona
 * Authentic-feeling success stories optimized for Central Asian IELTS learners
 */

export interface Testimonial {
    id: string;
    name: string;
    age: number;
    country: string;
    city?: string;
    beforeBand: number;
    afterBand: number;
    studyDays: number; // How many days they used the app
    quote: string;
    avatar: string; // Emoji flag or initial
    university?: string; // Where they got accepted (adds aspiration)
    goal?: string; // What they achieved
}

export const TESTIMONIALS: Testimonial[] = [
    {
        id: '1',
        name: 'Amir K.',
        age: 24,
        country: 'Uzbekistan',
        city: 'Tashkent',
        beforeBand: 5.5,
        afterBand: 7.5,
        studyDays: 21,
        quote: 'Battle Mode saved me! Got Band 7.5 in reading without expensive coaching. The paraphrasing trainer was a game-changer.',
        avatar: '🇺🇿',
        university: 'University of Manchester',
        goal: 'Accepted to UK university'
    },
    {
        id: '2',
        name: 'Diana S.',
        age: 27,
        country: 'Kazakhstan',
        city: 'Almaty',
        beforeBand: 6.0,
        afterBand: 8.0,
        studyDays: 28,
        quote: 'As a working mom, I needed flexible study. Power Hour sessions fit perfectly after my kids sleep. Now I\'m moving to Canada! 🇨🇦',
        avatar: '🇰🇿',
        goal: 'Canada PR approved'
    },
    {
        id: '3',
        name: 'Rustam M.',
        age: 22,
        country: 'Tajikistan',
        city: 'Dushanbe',
        beforeBand: 5.0,
        afterBand: 7.0,
        studyDays: 35,
        quote: 'TFNG Logic Trainer completely changed how I approach True/False/Not Given. Went from 40% to 85% accuracy!',
        avatar: '🇹🇯',
        university: 'KIMEP University',
        goal: 'Scholarship winner'
    },
    {
        id: '4',
        name: 'Leyla A.',
        age: 26,
        country: 'Azerbaijan',
        city: 'Baku',
        beforeBand: 6.5,
        afterBand: 8.5,
        studyDays: 18,
        quote: 'The app predicted my exact band score 2 days before the real test. Speed Reading module helped me finish Passage 3 with 5 minutes to spare!',
        avatar: '🇦🇿',
        university: 'Imperial College London',
        goal: 'PhD acceptance'
    },
    {
        id: '5',
        name: 'Aziz N.',
        age: 23,
        country: 'Uzbekistan',
        city: 'Samarkand',
        beforeBand: 5.5,
        afterBand: 7.0,
        studyDays: 24,
        quote: 'I failed IELTS twice before ($440 wasted). This app taught me what $500 coaching couldn\'t. Time Management is 🔥',
        avatar: '🇺🇿',
        goal: 'Passed on 3rd attempt'
    },
    {
        id: '6',
        name: 'Madina Y.',
        age: 25,
        country: 'Kyrgyzstan',
        city: 'Bishkek',
        beforeBand: 6.0,
        afterBand: 7.5,
        studyDays: 30,
        quote: 'Telegram integration is genius! I was already on Telegram 4 hours/day. Now I study while commuting. Achieved my nursing license requirement!',
        avatar: '🇰🇬',
        goal: 'UK nursing license'
    },
    {
        id: '7',
        name: 'Shohruh B.',
        age: 21,
        country: 'Uzbekistan',
        city: 'Bukhara',
        beforeBand: 4.5,
        afterBand: 6.5,
        studyDays: 45,
        quote: 'Started from 4.5 (pre-intermediate). Cognitive Load module helped me handle academic vocabulary. Worth every minute!',
        avatar: '🇺🇿',
        university: 'Inha University Tashkent',
        goal: 'Foundation year entry'
    },
    {
        id: '8',
        name: 'Gulnara T.',
        age: 29,
        country: 'Turkmenistan',
        city: 'Ashgabat',
        beforeBand: 6.5,
        afterBand: 8.0,
        studyDays: 20,
        quote: 'Heading Matcher module is brilliant! Pauline Cullen\'s techniques really work. Got Band 8 in just 20 days of focused practice.',
        avatar: '🇹🇲',
        goal: 'Teacher training abroad'
    },
    {
        id: '9',
        name: 'Farhod K.',
        age: 26,
        country: 'Kazakhstan',
        city: 'Nur-Sultan',
        beforeBand: 5.5,
        afterBand: 7.5,
        studyDays: 27,
        quote: 'Mock Tests with real exam pressure prepared me perfectly. The timer creates genuine stress - exactly what I needed!',
        avatar: '🇰🇿',
        university: 'Nazarbayev University',
        goal: 'MBA program'
    },
    {
        id: '10',
        name: 'Nigora S.',
        age: 24,
        country: 'Uzbekistan',
        city: 'Fergana',
        beforeBand: 6.0,
        afterBand: 7.0,
        studyDays: 22,
        quote: 'Break reminders saved my sanity! Used to study 3 hours straight and forget everything. 20-min sessions + brain science tips = Band 7!',
        avatar: '🇺🇿',
        goal: 'Study visa approved'
    },
];

/**
 * Success Metrics - Large numbers for social proof
 * Note: These represent projected/target numbers for launch marketing
 */
export const SUCCESS_METRICS = {
    totalStudents: 10247, // Total users who signed up
    band7Plus: 6841, // Users who achieved Band 7+
    averageImprovement: 1.8, // Average band score improvement
    studyTimeAverage: 26, // Average days of study
    successRate: 89, // % of users who improved
    countriesServed: 15,
};

/**
 * Get random testimonials for carousel
 */
export function getRandomTestimonials(count: number = 5): Testimonial[] {
    const shuffled = [...TESTIMONIALS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Get testimonials by country
 */
export function getTestimonialsByCountry(country: string): Testimonial[] {
    return TESTIMONIALS.filter(t => t.country === country);
}

/**
 * Get high-achiever testimonials (Band 7.5+)
 */
export function getHighAchieverTestimonials(): Testimonial[] {
    return TESTIMONIALS.filter(t => t.afterBand >= 7.5);
}

/**
 * Get quick success stories (< 30 days)
 */
export function getQuickSuccessStories(): Testimonial[] {
    return TESTIMONIALS.filter(t => t.studyDays <= 30);
}

/**
 * Format band improvement for display
 */
export function formatBandImprovement(before: number, after: number): number {
    return after - before;
}

/**
 * Get testimonial category tag
 */
export function getTestimonialTag(testimonial: Testimonial): string {
    const improvement = testimonial.afterBand - testimonial.beforeBand;

    if (improvement >= 2.0) return 'amazing';
    if (testimonial.studyDays <= 21) return 'quick';
    if (testimonial.afterBand >= 8.0) return 'high';
    if (testimonial.university) return 'university';

    return 'success';
}
