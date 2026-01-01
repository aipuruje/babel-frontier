#!/usr/bin/env node

/**
 * Babel Frontier - Genesis Automation Script
 * Zero-manual-work deployment for the entire IELTS RPG system
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// ASCII Art Banner
console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗  █████╗ ██████╗ ███████╗██╗         ███████╗      ║
║   ██╔══██╗██╔══██╗██╔══██╗██╔════╝██║         ██╔════╝      ║
║   ██████╔╝███████║██████╔╝█████╗  ██║         █████╗        ║
║   ██╔══██╗██╔══██║██╔══██╗██╔══╝  ██║         ██╔══╝        ║
║   ██████╔╝██║  ██║██████╔╝███████╗███████╗    ██║           ║
║   ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝    ╚═╝           ║
║                                                               ║
║              FRONTIER - Genesis Week Automation              ║
║                    IELTS RPG for Uzbekistan                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));

// Step 1: Check for credentials
console.log(chalk.yellow.bold('\n🔐 Step 1: Credential Verification\n'));

const envPath = join(ROOT_DIR, '.env');
if (!existsSync(envPath)) {
    console.log(chalk.red('❌ .env file not found!'));
    console.log(chalk.yellow('Creating .env from template...\n'));

    const response = await prompts([
        {
            type: 'text',
            name: 'OPENAI_API_KEY',
            message: 'OpenAI API Key (for Whisper, will migrate to Gemini):',
            validate: value => value.length > 0 || 'Required'
        },
        {
            type: 'text',
            name: 'CLOUDFLARE_API_TOKEN',
            message: 'Cloudflare API Token:',
            validate: value => value.length > 0 || 'Required'
        },
        {
            type: 'text',
            name: 'CLOUDFLARE_ACCOUNT_ID',
            message: 'Cloudflare Account ID:',
            validate: value => value.length > 0 || 'Required'
        },
        {
            type: 'text',
            name: 'TELEGRAM_BOT_TOKEN',
            message: 'Telegram Bot Token:',
            validate: value => value.length > 0 || 'Required'
        },
        {
            type: 'text',
            name: 'FIREBASE_PROJECT_ID',
            message: 'Firebase Project ID (or press Enter to create new):',
        }
    ]);

    const envContent = Object.entries(response)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    execSync(`echo "${envContent}" > ${envPath}`, { cwd: ROOT_DIR });
    console.log(chalk.green('✅ .env file created!\n'));
} else {
    console.log(chalk.green('✅ .env file found!\n'));
}

// Step 2: Install dependencies
console.log(chalk.yellow.bold('📦 Step 2: Installing Dependencies\n'));

const spinner = ora('Installing Node.js dependencies...').start();
try {
    execSync('npm install', { cwd: join(ROOT_DIR, 'scripts'), stdio: 'pipe' });
    execSync('npm install', { cwd: join(ROOT_DIR, 'telegram-mini-app'), stdio: 'pipe' });
    spinner.succeed('Node.js dependencies installed');
} catch (error) {
    spinner.fail('Failed to install Node dependencies');
    console.error(chalk.red(error.message));
    process.exit(1);
}

// Step 3: Provision Cloudflare Infrastructure
console.log(chalk.yellow.bold('\n☁️  Step 3: Provisioning Cloudflare Infrastructure\n'));

const cfSpinner = ora('Creating Workers, KV, D1...').start();
try {
    execSync('node provision_infrastructure.js', { cwd: join(ROOT_DIR, 'scripts'), stdio: 'inherit' });
    cfSpinner.succeed('Cloudflare infrastructure provisioned');
} catch (error) {
    cfSpinner.fail('Cloudflare provisioning failed');
    console.error(chalk.red(error.message));
    process.exit(1);
}

// Step 4: Setup Firebase
console.log(chalk.yellow.bold('\n🔥 Step 4: Setting Up Firebase\n'));

const fbSpinner = ora('Initializing Firestore...').start();
try {
    execSync('node setup_firebase.js', { cwd: join(ROOT_DIR, 'scripts'), stdio: 'inherit' });
    fbSpinner.succeed('Firebase configured');
} catch (error) {
    fbSpinner.fail('Firebase setup failed');
    console.error(chalk.red(error.message));
    process.exit(1);
}

// Step 5: Build Frontend
console.log(chalk.yellow.bold('\n🎨 Step 5: Building Telegram Mini App\n'));

const buildSpinner = ora('Building with Vite...').start();
try {
    execSync('npm run build', { cwd: join(ROOT_DIR, 'telegram-mini-app'), stdio: 'pipe' });
    buildSpinner.succeed('Frontend built successfully');
} catch (error) {
    buildSpinner.fail('Build failed');
    console.error(chalk.red(error.message));
    process.exit(1);
}

// Step 6: Deploy to Edge
console.log(chalk.yellow.bold('\n🚀 Step 6: Deploying to Cloudflare Edge\n'));

const deploySpinner = ora('Deploying Workers and Pages...').start();
try {
    execSync('node deploy_to_edge.js', { cwd: join(ROOT_DIR, 'scripts'), stdio: 'inherit' });
    deploySpinner.succeed('Deployed to Cloudflare Edge');
} catch (error) {
    deploySpinner.fail('Deployment failed');
    console.error(chalk.red(error.message));
    process.exit(1);
}

// Step 7: Open Genesis War Room
console.log(chalk.yellow.bold('\n🎯 Step 7: Opening Genesis War Room\n'));

const warRoomPath = join(ROOT_DIR, 'genesis_week_titan_orchestrator.html');
if (existsSync(warRoomPath)) {
    console.log(chalk.green('✅ Genesis War Room HTML found'));
    console.log(chalk.cyan(`\n📂 Open in browser: file:///${warRoomPath}\n`));

    // Auto-open in default browser (Windows)
    try {
        execSync(`start ${warRoomPath}`, { cwd: ROOT_DIR });
    } catch (e) {
        // Silently fail if not Windows
    }
} else {
    console.log(chalk.yellow('⚠️  Genesis War Room HTML not found, generating...'));
}

// Success Summary
console.log(chalk.green.bold(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ✅ GENESIS AUTOMATION COMPLETE!                            ║
║                                                               ║
║   Next Steps:                                                 ║
║   1. Open Genesis War Room HTML for day-by-day guide         ║
║   2. Test Telegram Mini App                                   ║
║   3. Verify Cloudflare Edge latency (<15ms from Tashkent)    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`));

console.log(chalk.cyan('\n📖 View implementation plan:'));
console.log(chalk.gray('   C:\\Users\\GL75\\.gemini\\antigravity\\brain\\29195efb-cb05-49d8-af7b-1a69d241b753\\implementation_plan.md\n'));
