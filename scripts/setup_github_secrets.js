#!/usr/bin/env node

/**
 * GitHub Secrets Setup Script
 * Automatically configures all required secrets for GitHub Actions deployment
 */

import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';
import sodium from 'libsodium-wrappers';

// Load .env
dotenv.config({ path: join(process.cwd(), '..', '.env') });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'aziyat1977/babel-frontier';

const secrets = {
    CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    WORKER_URL: '' // Will be set after first deployment
};

async function getPublicKey() {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/secrets/public-key`, {
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json'
        }
    });
    return response.json();
}

async function encryptSecret(publicKey, secretValue) {
    await sodium.ready;
    const binkey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
    const binsec = sodium.from_string(secretValue);
    const encBytes = sodium.crypto_box_seal(binsec, binkey);
    return sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);
}

async function setSecret(secretName, secretValue, publicKey) {
    const encryptedValue = await encryptSecret(publicKey.key, secretValue);

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/secrets/${secretName}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            encrypted_value: encryptedValue,
            key_id: publicKey.key_id
        })
    });

    return response.status === 201 || response.status === 204;
}

async function main() {
    console.log('🔐 Setting up GitHub Secrets for babel-frontier...\n');

    try {
        const publicKey = await getPublicKey();

        for (const [name, value] of Object.entries(secrets)) {
            if (!value) {
                console.log(`⏭️  Skipping ${name} (empty value)`);
                continue;
            }

            process.stdout.write(`Setting ${name}... `);
            const success = await setSecret(name, value, publicKey);
            console.log(success ? '✅' : '❌');
        }

        console.log('\n✅ GitHub Secrets configured!');
        console.log('Next: Push code to GitHub to trigger deployment\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\nFallback: Set secrets manually at:');
        console.log(`https://github.com/${GITHUB_REPO}/settings/secrets/actions\n`);
    }
}

main();
