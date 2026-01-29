import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { compression } from 'vite-plugin-compression2';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
            manifest: {
                name: 'IELTS Reading Mastery',
                short_name: 'IELTS Master',
                description: 'Master IELTS Academic Reading with AI-powered training',
                theme_color: '#667eea',
                background_color: '#0f172a',
                display: 'standalone',
                icons: [
                    {
                        src: '/icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/api\..*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 // 1 hour
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            }
        }),
        // Gzip compression
        compression({
            algorithm: 'gzip',
            exclude: [/\.(br)$/, /\.(gz)$/],
            threshold: 1024, // Only compress files > 1KB
            deleteOriginalAssets: false
        }),
        // Brotli compression (better than gzip)
        compression({
            algorithm: 'brotliCompress',
            exclude: [/\.(br)$/, /\.(gz)$/],
            threshold: 1024,
            deleteOriginalAssets: false
        })
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@modules': path.resolve(__dirname, './src/modules'),
            '@store': path.resolve(__dirname, './src/store'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@styles': path.resolve(__dirname, './src/styles'),
            '@ai': path.resolve(__dirname, './src/ai')
        }
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        https: false // Set to true and provide certs for local HTTPS testing with Telegram
    },
    build: {
        outDir: 'dist',
        sourcemap: false, // Disable for production
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remove console.logs
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info'], // Remove specific functions
                passes: 2 // Multiple passes for better compression
            },
            mangle: {
                safari10: true // Safari 10+ compatibility
            },
            format: {
                comments: false // Remove all comments
            }
        },
        rollupOptions: {
            output: {
                // Optimized chunk splitting strategy
                manualChunks: (id) => {
                    // Vendor libraries
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                            return 'vendor'; // Core React libs
                        }
                        if (id.includes('framer-motion') || id.includes('lucide-react')) {
                            return 'ui'; // UI libraries
                        }
                        if (id.includes('recharts')) {
                            return 'charts'; // Charts (lazy loaded with Analytics)
                        }
                        if (id.includes('zustand')) {
                            return 'state'; // State management
                        }
                        if (id.includes('idb')) {
                            return 'storage'; // IndexedDB (lazy loaded)
                        }
                        // All other node_modules
                        return 'vendor-misc';
                    }

                    // Module-specific chunks (already lazy loaded by route)
                    if (id.includes('/modules/')) {
                        const moduleName = id.split('/modules/')[1].split('/')[0];
                        return `module-${moduleName}`;
                    }
                },
                // Optimized file naming
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]'
            },
            // Tree shaking
            treeshake: {
                moduleSideEffects: false,
                propertyReadSideEffects: false,
                tryCatchDeoptimization: false
            }
        },
        chunkSizeWarningLimit: 500, // Warn for chunks > 500KB
        assetsInlineLimit: 4096, // Inline assets < 4KB as base64
        cssCodeSplit: true, // Split CSS per route
        reportCompressedSize: true, // Report gzipped size
        target: 'es2015', // Support older browsers while still being modern
        cssMinify: true
    },
    optimizeDeps: {
        include: ['@twa-dev/sdk', 'zustand', 'framer-motion'], // Pre-bundle these
        exclude: ['recharts'] // Don't pre-bundle heavy chart library
    },
    // Enable tree shaking for CSS
    css: {
        devSourcemap: false
    }
});
