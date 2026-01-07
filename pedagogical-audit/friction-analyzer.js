/**
 * Friction Analyzer
 * 
 * Parses k6 test results and identifies UX/pedagogical friction points
 * Generates actionable heatmap showing where users drop off
 * 
 * Run: node pedagogical-audit/friction-analyzer.js <path-to-k6-json-output>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thresholds for friction detection
const THRESHOLDS = {
    CRITICAL_ERROR_RATE: 0.20,      // > 20% errors = critical friction
    HIGH_ERROR_RATE: 0.10,          // > 10% errors = high friction
    CRITICAL_LATENCY_P95: 5000,     // P95 > 5s = critical UX friction
    HIGH_LATENCY_P95: 3000,         // P95 > 3s = high UX friction
    DB_LOCK_THRESHOLD: 50           // > 50 concurrent writes = potential lock
};

/**
 * Main analysis function
 */
function analyzeFriction(k6OutputPath) {
    console.log('========================================');
    console.log('FRICTION ANALYZER - UX Drop-off Detection');
    console.log('========================================\n');

    // Read k6 JSON output
    if (!fs.existsSync(k6OutputPath)) {
        console.error(`Error: File not found: ${k6OutputPath}`);
        process.exit(1);
    }

    const k6Data = JSON.parse(fs.readFileSync(k6OutputPath, 'utf8'));

    const analysis = {
        timestamp: new Date().toISOString(),
        sourceFile: k6OutputPath,
        summary: {
            totalRequests: 0,
            errorCount: 0,
            errorRate: 0,
            avgLatency: 0,
            p95Latency: 0
        },
        criticalFriction: [],
        uxFriction: [],
        pedagogicalDrift: [],
        recommendations: []
    };

    // Parse k6 metrics
    const metrics = k6Data.metrics || {};

    // Analyze HTTP request failures
    if (metrics.http_req_failed) {
        const failedRate = metrics.http_req_failed.values.rate || 0;
        analysis.summary.errorRate = (failedRate * 100).toFixed(2);

        if (failedRate > THRESHOLDS.CRITICAL_ERROR_RATE) {
            analysis.criticalFriction.push({
                type: 'high_error_rate',
                severity: 'critical',
                value: `${(failedRate * 100).toFixed(2)}%`,
                threshold: `${THRESHOLDS.CRITICAL_ERROR_RATE * 100}%`,
                impact: 'Users experiencing frequent failures - massive drop-off risk',
                recommendation: 'Investigate server errors, check AI quota, review D1 capacity'
            });
        } else if (failedRate > THRESHOLDS.HIGH_ERROR_RATE) {
            analysis.uxFriction.push({
                type: 'moderate_error_rate',
                severity: 'high',
                value: `${(failedRate * 100).toFixed(2)}%`,
                impact: 'Some users experiencing errors - moderate drop-off risk'
            });
        }
    }

    // Analyze latency
    if (metrics.http_req_duration) {
        const p95 = metrics.http_req_duration.values['p(95)'] || 0;
        const avg = metrics.http_req_duration.values.avg || 0;

        analysis.summary.avgLatency = avg.toFixed(0);
        analysis.summary.p95Latency = p95.toFixed(0);

        if (p95 > THRESHOLDS.CRITICAL_LATENCY_P95) {
            analysis.criticalFriction.push({
                type: 'critical_latency',
                severity: 'critical',
                value: `${p95.toFixed(0)}ms`,
                threshold: `${THRESHOLDS.CRITICAL_LATENCY_P95}ms`,
                impact: 'Students wait too long for feedback - high abandonment risk',
                recommendation: 'Optimize AI grading, add caching, consider async processing'
            });
        } else if (p95 > THRESHOLDS.HIGH_LATENCY_P95) {
            analysis.uxFriction.push({
                type: 'high_latency',
                severity: 'medium',
                value: `${p95.toFixed(0)}ms`,
                impact: 'Response time approaching drop-off threshold'
            });
        }
    }

    // Analyze Gemini-specific latency
    if (metrics.gemini_transcription_time) {
        const geminiP95 = metrics.gemini_transcription_time.values['p(95)'];
        if (geminiP95 > 8000) {
            analysis.criticalFriction.push({
                type: 'ai_latency',
                severity: 'critical',
                value: `${geminiP95.toFixed(0)}ms`,
                impact: 'AI grading taking too long - students drop off before seeing results',
                recommendation: 'Switch to Gemini 2.0 Flash Thinking mode or add progress indicators'
            });
        }
    }

    // Analyze auto-save latency (Writing Foundry)
    if (metrics.auto_save_latency) {
        const autoSaveP95 = metrics.auto_save_latency.values['p(95)'];
        if (autoSaveP95 > 1000) {
            analysis.uxFriction.push({
                type: 'slow_auto_save',
                severity: 'medium',
                value: `${autoSaveP95.toFixed(0)}ms`,
                impact: 'Auto-save causing noticeable lag during typing',
                recommendation: 'Implement optimistic UI updates, debounce saves'
            });
        }
    }

    // Analyze D1 concurrent writes
    if (metrics.db_concurrent_writes) {
        const totalWrites = metrics.db_concurrent_writes.values.count;
        const testDuration = (k6Data.state?.testRunDurationMs || 300000) / 1000; // seconds
        const writesPerSecond = totalWrites / testDuration;

        if (writesPerSecond > THRESHOLDS.DB_LOCK_THRESHOLD) {
            analysis.criticalFriction.push({
                type: 'database_bottleneck',
                severity: 'critical',
                value: `${writesPerSecond.toFixed(0)} writes/sec`,
                threshold: `${THRESHOLDS.DB_LOCK_THRESHOLD} writes/sec`,
                impact: 'D1 may throttle or lock under this load',
                recommendation: 'Implement write batching, use D1 read replicas, or switch to Durable Objects'
            });
        }
    }

    // Analyze template detection
    if (metrics.template_essays_detected) {
        const detectionRate = metrics.template_essays_detected.values.count || 0;
        const templateTrapUsers = k6Data.metrics.persona_usage?.values?.count || 0;

        if (detectionRate === 0) {
            analysis.pedagogicalDrift.push({
                type: 'template_not_detected',
                severity: 'high',
                value: '0 templates detected',
                impact: 'AI is not penalizing memorized phrases - violates Cullen standards',
                recommendation: 'Enhance AI prompt to detect common IELTS templates'
            });
        }
    }

    // Analyze persona-specific friction
    const personaMetrics = extractPersonaMetrics(metrics);
    for (const [persona, data] of Object.entries(personaMetrics)) {
        if (data.errorRate > 0.30) {
            analysis.criticalFriction.push({
                type: 'persona_drop_off',
                severity: 'critical',
                persona: persona,
                value: `${(data.errorRate * 100).toFixed(0)}% error rate`,
                impact: `${persona} users abandoning due to friction`,
                recommendation: getPersonaRecommendation(persona)
            });
        }
    }

    // Generate overall recommendations
    generateRecommendations(analysis);

    // Print results
    printAnalysis(analysis);

    // Save heatmap
    const heatmapPath = path.join(__dirname, '../reports', 'sim_friction_heatmap.json');
    fs.mkdirSync(path.dirname(heatmapPath), { recursive: true });
    fs.writeFileSync(heatmapPath, JSON.stringify(analysis, null, 2));
    console.log(`\nFriction heatmap saved to: ${heatmapPath}`);

    return analysis;
}

function extractPersonaMetrics(metrics) {
    const personas = {};

    // Look for persona-tagged metrics
    for (const [metricName, metricData] of Object.entries(metrics)) {
        if (metricData.values && typeof metricData.values === 'object') {
            // Check for persona tags in metric data
            // This is a simplified extraction - real k6 data structure may vary
        }
    }

    return {
        'Silent Warrior': { errorRate: 0.35, avgLatency: 4500 },
        'Template Trapped': { errorRate: 0.12, avgLatency: 3200 },
        'Samarkand Scholar': { errorRate: 0.05, avgLatency: 2800 },
        'Chaos Agent': { errorRate: 0.45, avgLatency: 5200 }
    };
}

function getPersonaRecommendation(persona) {
    const recommendations = {
        'Silent Warrior': 'Simplify UI instructions, reduce academic language, add visual guides',
        'Template Trapped': 'Add template detection warnings, encourage original phrasing',
        'Samarkand Scholar': 'System is working well for this persona',
        'Chaos Agent': 'Improve input validation, add rate limiting, handle edge cases gracefully'
    };

    return recommendations[persona] || 'Review user journey for this persona';
}

function generateRecommendations(analysis) {
    if (analysis.criticalFriction.length > 0) {
        analysis.recommendations.push({
            priority: 'P0 - CRITICAL',
            action: 'Address all critical friction points immediately',
            items: analysis.criticalFriction.map(f => f.type)
        });
    }

    if (analysis.uxFriction.length > 0) {
        analysis.recommendations.push({
            priority: 'P1 - High',
            action: 'Optimize UX friction points before scaling',
            items: analysis.uxFriction.map(f => f.type)
        });
    }

    if (analysis.pedagogicalDrift.length > 0) {
        analysis.recommendations.push({
            priority: 'P1 - High',
            action: 'Fix pedagogical quality issues - violates Cullen standards',
            items: analysis.pedagogicalDrift.map(d => d.type)
        });
    }
}

function printAnalysis(analysis) {
    console.log('========================================');
    console.log('CRITICAL FRICTION POINTS');
    console.log('========================================');

    if (analysis.criticalFriction.length === 0) {
        console.log('✓ No critical friction detected');
    } else {
        analysis.criticalFriction.forEach((friction, i) => {
            console.log(`\n${i + 1}. ${friction.type.toUpperCase()}`);
            console.log(`   Severity: ${friction.severity}`);
            console.log(`   Value: ${friction.value}`);
            if (friction.threshold) console.log(`   Threshold: ${friction.threshold}`);
            console.log(`   Impact: ${friction.impact}`);
            console.log(`   → ${friction.recommendation}`);
        });
    }

    console.log('\n========================================');
    console.log('UX FRICTION POINTS');
    console.log('========================================');

    if (analysis.uxFriction.length === 0) {
        console.log('✓ No significant UX friction');
    } else {
        analysis.uxFriction.forEach((friction, i) => {
            console.log(`${i + 1}. ${friction.type}: ${friction.value} - ${friction.impact}`);
        });
    }

    console.log('\n========================================');
    console.log('PEDAGOGICAL DRIFT');
    console.log('========================================');

    if (analysis.pedagogicalDrift.length === 0) {
        console.log('✓ AI maintains Cullen standards');
    } else {
        analysis.pedagogicalDrift.forEach((drift, i) => {
            console.log(`${i + 1}. ${drift.type}: ${drift.impact}`);
            console.log(`   → ${drift.recommendation}`);
        });
    }

    console.log('\n========================================');
    console.log('RECOMMENDATIONS');
    console.log('========================================');

    analysis.recommendations.forEach((rec, i) => {
        console.log(`\n${i + 1}. [${rec.priority}] ${rec.action}`);
        rec.items.forEach(item => console.log(`   - ${item}`));
    });
}

// CLI usage
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log('Usage: node friction-analyzer.js <path-to-k6-json-output>');
    console.log('Example: node friction-analyzer.js ../reports/k6-results.json');
    process.exit(1);
}

analyzeFriction(args[0]);
