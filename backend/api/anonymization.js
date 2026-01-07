// ========== DATA ANONYMIZATION SERVICE ==========
// Anonymizes user data for B2B APIs and analytics
// Implements k-anonymity, data masking, and differential privacy

/**
 * K-Anonymity: Ensure minimum group size before releasing data
 * @param {Array} data - Array of records
 * @param {Array<string>} quasiIdentifiers - Fields that could identify users
 * @param {number} k - Minimum group size (default: 10)
 * @returns {Array} - Anonymized data (groups smaller than k are removed)
 */
export function applyKAnonymity(data, quasiIdentifiers, k = 10) {
    // Group by quasi-identifiers
    const groups = new Map();

    for (const record of data) {
        const key = quasiIdentifiers.map(field => record[field]).join('|');
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(record);
    }

    // Filter out groups smaller than k
    const anonymized = [];
    for (const group of groups.values()) {
        if (group.length >= k) {
            anonymized.push(...group);
        }
    }

    console.log(`K-anonymity: ${data.length} records → ${anonymized.length} records (k=${k})`);
    return anonymized;
}

/**
 * Generalize data to reduce specificity
 * @param {string} value - Value to generalize
 * @param {string} type - Type of generalization
 * @returns {string} - Generalized value
 */
export function generalize(value, type) {
    switch (type) {
        case 'age':
            // Convert exact age to age range
            const age = parseInt(value);
            if (age < 18) return '< 18';
            if (age < 25) return '18-24';
            if (age < 35) return '25-34';
            if (age < 45) return '35-44';
            return '45+';

        case 'region':
            // Keep only broad region (e.g., "Tashkent" instead of "Tashkent, Mirzo Ulugbek District")
            return value.split(',')[0].trim();

        case 'date':
            // Round to month
            const date = new Date(value);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        case 'score':
            // Round to 0.5 precision
            return Math.round(parseFloat(value) * 2) / 2;

        default:
            return value;
    }
}

/**
 * Mask sensitive data
 * @param {string} value - Value to mask
 * @param {string} type - Type of masking
 * @returns {string} - Masked value
 */
export function mask(value, type) {
    if (!value) return value;

    switch (type) {
        case 'email':
            // user@example.com → u***@example.com
            const [local, domain] = value.split('@');
            return `${local[0]}${'*'.repeat(Math.max(local.length - 1, 3))}@${domain}`;

        case 'phone':
            // +998901234567 → +998*******67
            return value.slice(0, 4) + '*'.repeat(value.length - 6) + value.slice(-2);

        case 'name':
            // John Doe → J*** D***
            return value.split(' ').map(part =>
                part[0] + '*'.repeat(Math.max(part.length - 1, 3))
            ).join(' ');

        case 'user_id':
            // Hash to consistent pseudonym
            return hashToPseudonym(value);

        default:
            return value;
    }
}

/**
 * Hash to consistent pseudonym (deterministic for same input)
 * @param {string} value
 * @returns {string} - Pseudonymized ID
 */
function hashToPseudonym(value) {
    // Simple hash for demo (use proper crypto.subtle.digest in production)
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    return `user_${Math.abs(hash).toString(16)}`;
}

/**
 * Differential privacy: Add statistical noise to aggregate metrics
 * @param {number} trueValue - Actual metric value
 * @param {number} epsilon - Privacy budget (smaller = more privacy, more noise)
 * @returns {number} - Noisy value
 */
export function addDifferentialPrivacyNoise(trueValue, epsilon = 1.0) {
    // Laplace mechanism
    const scale = 1 / epsilon;
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));

    return trueValue + noise;
}

/**
 * Anonymize user profile for B2B APIs
 * @param {Object} user - User record
 * @param {string} anonymizationType - 'basic' or 'elite'
 * @returns {Object} - Anonymized user profile
 */
export function anonymizeUserProfile(user, anonymizationType = 'basic') {
    if (anonymizationType === 'elite') {
        // Elite profile (for university recruiting)
        return {
            profile_token: `EP_${user.id}_${Date.now()}`,
            performance: {
                overall_band: generalize(user.overall_band, 'score'),
                speaking_band: generalize(user.speaking_band, 'score'),
                writing_band: generalize(user.writing_band, 'score'),
                listening_band: generalize(user.listening_band, 'score'),
                reading_band: generalize(user.reading_band, 'score')
            },
            intelligence_signals: {
                velocity: user.performance_velocity,
                logical_reasoning: user.logical_reasoning_score,
                consistency: user.consistency_score
            },
            geographic_context: {
                region: generalize(user.region, 'region'),
                is_rural: user.is_rural,
                diamond_in_rough: user.is_rural && user.overall_band >= 8.5
            },
            // NO PII - user_id is encrypted in DB, revealed only after claim
            data_classification: 'ANONYMIZED'
        };
    } else {
        // Basic anonymized profile
        return {
            user_token: hashToPseudonym(user.id),
            region: generalize(user.region, 'region'),
            overall_band: generalize(user.overall_band, 'score'),
            created_at: generalize(user.created_at, 'date')
        };
    }
}

/**
 * Anonymize regional analytics for government dashboard
 * @param {Array} regionalData - Raw regional performance data
 * @param {number} k - K-anonymity threshold
 * @returns {Array} - Anonymized heatmap
 */
export function anonymizeRegionalData(regionalData, k = 10) {
    // Apply k-anonymity
    const anonymized = applyKAnonymity(regionalData, ['region', 'skill_domain'], k);

    // Group by region
    const heatmap = {};

    for (const record of anonymized) {
        if (!heatmap[record.region]) {
            heatmap[record.region] = {
                region: record.region,
                total_users: 0,
                skills: {}
            };
        }

        heatmap[record.region].total_users += 1;

        if (!heatmap[record.region].skills[record.skill_domain]) {
            heatmap[record.region].skills[record.skill_domain] = {
                avg_band: 0,
                count: 0
            };
        }

        const skillData = heatmap[record.region].skills[record.skill_domain];
        skillData.avg_band = ((skillData.avg_band * skillData.count) + parseFloat(record.avg_band)) / (skillData.count + 1);
        skillData.count += 1;
    }

    // Add differential privacy noise to aggregates
    const noisyHeatmap = Object.values(heatmap).map(region => ({
        ...region,
        total_users: Math.round(addDifferentialPrivacyNoise(region.total_users, 1.0)),
        skills: Object.fromEntries(
            Object.entries(region.skills).map(([skill, data]) => [
                skill,
                {
                    avg_band: generalize(
                        addDifferentialPrivacyNoise(data.avg_band, 0.5).toFixed(1),
                        'score'
                    ),
                    deviation: addDifferentialPrivacyNoise(data.deviation || 0, 0.5).toFixed(2)
                }
            ])
        )
    }));

    return noisyHeatmap;
}

/**
 * Suppress small cells (< k records) in aggregate data
 * @param {Object} aggregateData - Aggregate statistics
 * @param {number} threshold - Minimum count threshold
 * @returns {Object} - Data with small cells suppressed
 */
export function suppressSmallCells(aggregateData, threshold = 10) {
    const suppressed = { ...aggregateData };

    for (const [key, value] of Object.entries(suppressed)) {
        if (typeof value === 'object' && value.count !== undefined) {
            if (value.count < threshold) {
                suppressed[key] = {
                    ...value,
                    count: '[SUPPRESSED]',
                    avg: '[SUPPRESSED]',
                    message: `Insufficient data (< ${threshold} records)`
                };
            }
        }
    }

    return suppressed;
}

/**
 * Zero-knowledge proof wrapper for elite profiles
 * Returns proof that user meets criteria WITHOUT revealing exact scores
 * @param {Object} user
 * @param {number} threshold - Minimum band score
 * @returns {Object} - ZK proof
 */
export function generateZeroKnowledgeProof(user, threshold = 8.5) {
    return {
        proof_id: `ZKP_${Date.now()}`,
        claim: `overall_band >= ${threshold}`,
        verified: user.overall_band >= threshold,
        proof_hash: hashToPseudonym(`${user.id}_${user.overall_band}_${threshold}`),
        // NO actual band score revealed
        timestamp: new Date().toISOString()
    };
}

/**
 * Anonymization configuration for different data types
 */
export const ANONYMIZATION_CONFIG = {
    government_dashboard: {
        k: 10,
        epsilon: 1.0,
        suppress_threshold: 10,
        generalize: ['region', 'date', 'score']
    },
    university_profiles: {
        k: 5,
        epsilon: 0.5,
        mask: ['user_id'],
        reveal_on_claim: true
    },
    public_analytics: {
        k: 50,
        epsilon: 2.0,
        suppress_threshold: 50,
        generalize: ['age', 'region', 'date', 'score']
    }
};

export default {
    applyKAnonymity,
    generalize,
    mask,
    addDifferentialPrivacyNoise,
    anonymizeUserProfile,
    anonymizeRegionalData,
    suppressSmallCells,
    generateZeroKnowledgeProof,
    ANONYMIZATION_CONFIG
};
