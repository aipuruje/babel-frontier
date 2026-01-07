#!/usr/bin/env node

/**
 * Deploy to Cloudflare Edge
 * Builds and deploys the entire Babel Frontier system
 */

import { execSync } from 'child_process';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';

dotenv.config({ path: join(process.cwd(), '..', '.env') });

const ROOT_DIR = join(process.cwd(), '..');
const TELEGRAM_APP_DIR = join(ROOT_DIR, 'telegram-mini-app');

console.log(chalk.cyan('\n🚀 Deploying to Cloudflare Edge\n'));

// Step 1: Apply D1 schema
console.log(chalk.yellow('Step 1: Applying D1 Schema...\n'));
const schemaSpinner = ora('Executing schema...').start();
try {
    execSync('wrangler d1 execute babel-frontier-db --remote --file=backend/schema.sql', {
        cwd: ROOT_DIR,
        stdio: 'inherit'
    });
    schemaSpinner.succeed('D1 schema applied');
} catch (error) {
    schemaSpinner.warn('Schema application skipped (run manually if needed)');
}

// Step 2: Deploy Workers
console.log(chalk.yellow('\nStep 2: Deploying Cloudflare Workers...\n'));
const workerSpinner = ora('Deploying backend...').start();
try {
    execSync('wrangler deploy', {
        cwd: ROOT_DIR,
        stdio: 'inherit'
    });
    workerSpinner.succeed('Workers deployed');
} catch (error) {
    workerSpinner.fail('Worker deployment failed');
    console.error(chalk.red(error.message));
    process.exit(1);
}

// Step 3: Deploy Telegram Mini App to Pages
console.log(chalk.yellow('\nStep 3: Deploying Telegram Mini App to Cloudflare Pages...\n'));
const pagesSpinner = ora('Deploying frontend...').start();
try {
    execSync('wrangler pages deploy dist --project-name=babel-frontier-app', {
        cwd: TELEGRAM_APP_DIR,
        stdio: 'inherit'
    });
    pagesSpinner.succeed('Telegram Mini App deployed');
} catch (error) {
    pagesSpinner.fail('Pages deployment failed');
    console.error(chalk.red(error.message));
    process.exit(1);
}

// Step 4: Set Telegram Webhook
console.log(chalk.yellow('\nStep 4: Setting Telegram Webhook...\n'));
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = `https://babel-frontier.${process.env.CLOUDFLARE_ACCOUNT_ID}.workers.dev/webhook`;

if (BOT_TOKEN) {
    const webhookSpinner = ora('Setting webhook...').start();
    try {
        const { default: fetch } = await import('node-fetch');
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: WEBHOOK_URL })
        });

        const data = await response.json();
        if (data.ok) {
            webhookSpinner.succeed(`Webhook set: ${WEBHOOK_URL}`);
        } else {
            webhookSpinner.warn(`Webhook issue: ${data.description}`);
        }
    } catch (error) {
        webhookSpinner.fail('Webhook configuration failed');
        console.error(chalk.red(error.message));
    }
} else {
    console.log(chalk.yellow('⚠️  Telegram bot token not found, skipping webhook setup\n'));
}

console.log(chalk.green.bold('\n✅ Deployment Complete!\n'));
console.log(chalk.cyan('Your Babel Frontier IELTS RPG is now live on Cloudflare Edge!\n'));
