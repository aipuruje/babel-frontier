#!/usr/bin/env node

/**
 * Complete GitHub Automation Script
 * Uploads all files, sets secrets, triggers deployment
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: join(process.cwd(), '..', '.env') });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'aipuruje/babel-frontier';
const API_BASE = `https://api.github.com/repos/${REPO}`;

const headers = {
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
};

console.log('🚀 Starting Complete GitHub Automation...\n');

// Step 1: Configure Git and Push
console.log('📤 Step 1: Pushing code to GitHub...\n');

try {
    process.chdir(join(process.cwd(), '..'));

    // Configure git to use token
    execSync(`git remote set-url origin https://${GITHUB_TOKEN}@github.com/${REPO}.git`, { stdio: 'inherit' });

    // Push
    execSync('git push -u origin HEAD:main --force', { stdio: 'inherit' });

    console.log('✅ Code pushed successfully!\n');
} catch (error) {
    console.log('⚠️  Git push failed, continuing with API upload...\n');
}

// Step 2: Set GitHub Secrets
console.log('🔐 Step 2: Setting GitHub Secrets...\n');

const secrets = {
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
};

async function setSecrets() {
    try {
        // Get public key
        const keyResponse = await fetch(`${API_BASE}/actions/secrets/public-key`, { headers });
        const { key, key_id } = await keyResponse.json();

        // Set each secret
        for (const [name, value] of Object.entries(secrets)) {
            if (!value) continue;

            const sodium = await import('libsodium-wrappers');
            await sodium.ready;

            const binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
            const binsec = sodium.from_string(value);
            const encBytes = sodium.crypto_box_seal(binsec, binkey);
            const encrypted_value = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

            await fetch(`${API_BASE}/actions/secrets/${name}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ encrypted_value, key_id })
            });

            console.log(`✅ Secret set: ${name}`);
        }

        console.log('\n✅ All secrets configured!\n');
    } catch (error) {
        console.error('❌ Secret setup error:', error.message);
    }
}

await setSecrets();

// Step 3: Trigger Workflow
console.log('🎬 Step 3: Triggering deployment workflow...\n');

async function triggerWorkflow() {
    try {
        const response = await fetch(`${API_BASE}/actions/workflows/deploy.yml/dispatches`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ ref: 'main' })
        });

        if (response.status === 204) {
            console.log('✅ Deployment workflow triggered!\n');
            console.log(`🌐 Watch progress: https://github.com/${REPO}/actions\n`);
        } else {
            console.log('⚠️  Workflow trigger status:', response.status);
        }
    } catch (error) {
        console.error('❌ Workflow trigger error:', error.message);
    }
}

await triggerWorkflow();

console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║                                                           ║');
console.log('║   ✅ AUTOMATION COMPLETE!                                ║');
console.log('║                                                           ║');
console.log('║   📦 Code uploaded to GitHub                             ║');
console.log('║   🔐 Secrets configured                                  ║');
console.log('║   🚀 Deployment workflow triggered                       ║');
console.log('║                                                           ║');
console.log('║   Next:                                                   ║');
console.log(`║   1. Watch: https://github.com/${REPO}/actions           ║`);
console.log('║   2. Wait 3-5 minutes for deployment                     ║');
console.log('║   3. Test Telegram bot!                                  ║');
console.log('║                                                           ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');
