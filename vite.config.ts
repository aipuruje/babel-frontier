import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
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
                        urlPattern: /^https:\/\/api\.*/i,
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
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor': ['react', 'react-dom', 'react-router-dom'],
                    'ui': ['framer-motion', 'lucide-react'],
                    'charts': ['recharts'],
                    'state': ['zustand']
                }
            }
        },
        chunkSizeWarningLimit: 1000 // 1MB warning threshold
    },
    optimizeDeps: {
        include: ['@twa-dev/sdk', 'zustand', 'framer-motion', 'recharts']
    }
});
