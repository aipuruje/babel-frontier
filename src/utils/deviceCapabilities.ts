/**
 * Device Capability Detection & Performance Monitoring
 * Optimized for Uzbekistan market (budget Android devices)
 */

export interface DeviceCapabilities {
    memory: number | 'unknown'; // GB of RAM
    cores: number;
    connection: string; // '4g', '3g', '2g', 'slow-2g', 'offline'
    deviceType: 'mobile' | 'tablet' | 'desktop';
    isLowEnd: boolean;
    isMidRange: boolean;
    isHighEnd: boolean;
    supportsWebP: boolean;
    supportsServiceWorker: boolean;
}

export interface PerformanceMetrics {
    // Core Web Vitals
    lcp: number | null; // Largest Contentful Paint
    fid: number | null; // First Input Delay  
    cls: number | null; // Cumulative Layout Shift

    // Additional metrics
    ttfb: number | null; // Time to First Byte
    fcp: number | null;  // First Contentful Paint
}

/**
 * Detect device capabilities
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
    const memory = (navigator as any).deviceMemory || 'unknown';
    const cores = navigator.hardwareConcurrency || 4;
    const connection = getConnectionType();
    const deviceType = getDeviceType();

    // Categorize device performance tier
    const isLowEnd = typeof memory === 'number' && memory <= 2;
    const isMidRange = typeof memory === 'number' && memory > 2 && memory <= 4;
    const isHighEnd = typeof memory === 'number' && memory > 4;

    return {
        memory,
        cores,
        connection,
        deviceType,
        isLowEnd,
        isMidRange,
        isHighEnd,
        supportsWebP: checkWebPSupport(),
        supportsServiceWorker: 'serviceWorker' in navigator,
    };
}

/**
 * Get connection type
 */
function getConnectionType(): string {
    const connection = (navigator as any).connection
        || (navigator as any).mozConnection
        || (navigator as any).webkitConnection;

    if (!connection) return 'unknown';

    return connection.effectiveType || 'unknown';
}

/**
 * Get device type
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent.toLowerCase();
    const width = window.innerWidth;

    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
        return width < 768 ? 'mobile' : 'tablet';
    }

    if (/ipad|tablet|kindle/i.test(userAgent)) {
        return 'tablet';
    }

    return 'desktop';
}

/**
 * Check WebP support
 */
function checkWebPSupport(): boolean {
    const canvas = document.createElement('canvas');
    if (!canvas.getContext || !canvas.getContext('2d')) {
        return false;
    }
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Monitor Core Web Vitals
 */
export function monitorPerformance(callback: (metrics: PerformanceMetrics) => void): void {
    const metrics: PerformanceMetrics = {
        lcp: null,
        fid: null,
        cls: null,
        ttfb: null,
        fcp: null,
    };

    // Largest Contentful Paint (LCP)
    try {
        const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
        console.warn('LCP monitoring not supported');
    }

    // First Input Delay (FID)
    try {
        const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
                metrics.fid = entry.processingStart - entry.startTime;
            });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
    } catch {
        console.warn('FID monitoring not supported');
    }

    // Cumulative Layout Shift (CLS)
    try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    metrics.cls = clsValue;
                }
            }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch {
        console.warn('CLS monitoring not supported');
    }

    // Navigation timing for TTFB and FCP
    if (window.performance && window.performance.timing) {
        window.addEventListener('load', () => {
            const timing = window.performance.timing;
            metrics.ttfb = timing.responseStart - timing.requestStart;

            // Get FCP from Paint Timing API
            const paintEntries = performance.getEntriesByType('paint');
            const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
                metrics.fcp = fcpEntry.startTime;
            }

            // Report metrics
            callback(metrics);
        });
    }

    // Report after 5 seconds
    setTimeout(() => callback(metrics), 5000);
}

/**
 * Apply optimizations based on device capabilities
 */
export function applyDeviceOptimizations(capabilities: DeviceCapabilities): void {
    console.log('Device capabilities:', capabilities);

    // Low-end device optimizations
    if (capabilities.isLowEnd) {
        console.log('🔧 Applying low-end device optimizations');

        // Disable heavy animations
        document.documentElement.classList.add('reduce-motion');

        // Reduce image quality
        document.documentElement.classList.add('low-quality-images');

        // Disable some visual effects
        document.documentElement.classList.add('minimal-effects');

        // Clear caches more aggressively
        setInterval(() => {
            // Clear old cached data
            if ('caches' in window) {
                caches.keys().then((names) => {
                    names.forEach((name) => {
                        if (!name.includes('ielts-mastery-v1')) {
                            caches.delete(name);
                        }
                    });
                });
            }
        }, 60000); // Every minute
    }

    // Slow connection optimizations
    if (capabilities.connection === '2g' || capabilities.connection === 'slow-2g') {
        console.log('🔧 Applying slow connection optimizations');
        document.documentElement.classList.add('data-saver');
    }
}

/**
 * Log performance metrics
 */
export async function logPerformance(metrics: PerformanceMetrics): Promise<void> {
    console.log('📊 Core Web Vitals:');
    console.log(`  LCP: ${metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'} (target: <2500ms)`);
    console.log(`  FID: ${metrics.fid ? `${Math.round(metrics.fid)}ms` : 'N/A'} (target: <100ms)`);
    console.log(`  CLS: ${metrics.cls !== null ? metrics.cls.toFixed(3) : 'N/A'} (target: <0.1)`);
    console.log(`  TTFB: ${metrics.ttfb ? `${Math.round(metrics.ttfb)}ms` : 'N/A'}`);
    console.log(`  FCP: ${metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'N/A'}`);

    // Report to analytics service
    if (metrics.lcp && metrics.fid && metrics.cls !== null) {
        // Send Core Web Vitals to analytics
        try {
            const { trackEvent } = await import('@/utils/analytics');
            trackEvent('performance_metrics', {
                lcp: Math.round(metrics.lcp),
                fid: Math.round(metrics.fid),
                cls: parseFloat(metrics.cls.toFixed(3)),
                ttfb: metrics.ttfb ? Math.round(metrics.ttfb) : null,
                fcp: metrics.fcp ? Math.round(metrics.fcp) : null,
                grade: getPerformanceGrade(metrics),
            });
            console.log('✅ Core Web Vitals sent to analytics');
        } catch (error) {
            console.warn('Analytics not available:', error);
        }
    }
}

/**
 * Get performance grade
 */
export function getPerformanceGrade(metrics: PerformanceMetrics): 'good' | 'needs-improvement' | 'poor' {
    const lcpGood = metrics.lcp ? metrics.lcp < 2500 : false;
    const fidGood = metrics.fid ? metrics.fid < 100 : false;
    const clsGood = metrics.cls !== null ? metrics.cls < 0.1 : false;

    const goodCount = [lcpGood, fidGood, clsGood].filter(Boolean).length;

    if (goodCount === 3) return 'good';
    if (goodCount >= 1) return 'needs-improvement';
    return 'poor';
}
