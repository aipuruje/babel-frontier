import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
    {
        ignores: ['dist/**', 'node_modules/**', 'build/**', 'api/**', 'backend/dist/**', 'public/**'],
    },
    js.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                fetch: 'readonly',
                Headers: 'readonly',
                Request: 'readonly',
                Response: 'readonly',
                console: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                // Node.js globals (for types)
                NodeJS: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                // TypeScript globals
                RequestInit: 'readonly',
                // Additional Browser Globals
                navigator: 'readonly',
                performance: 'readonly',
                caches: 'readonly',
                ServiceWorkerRegistration: 'readonly',
                MessageEvent: 'readonly',
                CustomEvent: 'readonly',
                Event: 'readonly',
                history: 'readonly',
                location: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                screen: 'readonly',
                HeadersInit: 'readonly',
                PerformanceObserver: 'readonly',
                self: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            // Disable some overly strict rules
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
        },
    },
];
