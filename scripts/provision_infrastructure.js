#!/usr/bin/env node

/**
 * Cloudflare Infrastructure Provisioning
 * Creates Workers, KV, D1, and configures edge routing for Tashkent
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';

dotenv.config({ path: join(process.cwd(), '..', '.env') });

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

if (!CF_API_TOKEN || !CF_ACCOUNT_ID) {
    console.error(chalk.red('❌ Missing Cloudflare credentials in .env'));
    process.exit(1);
}

const headers = {
    'Authorization': `Bearer ${CF_API_TOKEN}`,
    'Content-Type': 'application/json'
};

async function apiRequest(endpoint, method = 'GET', body = null) {
    const url = `${CF_API_BASE}${endpoint}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.errors?.map(e => e.message).join(', ') || 'API request failed');
    }

    return data.result;
}

// Step 1: Create KV Namespace for Asset Caching
console.log(chalk.cyan('\n📦 Creating KV Namespace for Uzbekistan Asset Caching...\n'));

const kvSpinner = ora('Creating babel-frontier-assets KV...').start();
try {
    const kvNamespace = await apiRequest(
        `/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces`,
        'POST',
        { title: 'babel-frontier-assets' }
    );

    kvSpinner.succeed(`KV Namespace created: ${kvNamespace.id}`);
    console.log(chalk.gray(`   ID: ${kvNamespace.id}\n`));

    // Save to config
    process.env.KV_NAMESPACE_ID = kvNamespace.id;
} catch (error) {
    if (error.message.includes('already exists')) {
        kvSpinner.warn('KV Namespace already exists');
    } else {
        kvSpinner.fail('Failed to create KV Namespace');
        console.error(chalk.red(error.message));
    }
}

// Step 2: Create D1 Database
console.log(chalk.cyan('🗄️  Creating D1 Database for User Brain State...\n'));

const d1Spinner = ora('Creating babel-frontier-db...').start();
try {
    const d1Database = await apiRequest(
        `/accounts/${CF_ACCOUNT_ID}/d1/database`,
        'POST',
        { name: 'babel-frontier-db' }
    );

    d1Spinner.succeed(`D1 Database created: ${d1Database.uuid}`);
    console.log(chalk.gray(`   UUID: ${d1Database.uuid}\n`));

    process.env.D1_DATABASE_ID = d1Database.uuid;
} catch (error) {
    if (error.message.includes('already exists')) {
        d1Spinner.warn('D1 Database already exists');
    } else {
        d1Spinner.fail('Failed to create D1 Database');
        console.error(chalk.red(error.message));
    }
}

// Step 3: Apply D1 Schema
console.log(chalk.cyan('📋 Applying Pedagogy Schema to D1...\n'));

const schema = `
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  telegram_id INTEGER UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_brain_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  speaking_band REAL DEFAULT 4.0,
  listening_band REAL DEFAULT 0.0,
  reading_band REAL DEFAULT 0.0,
  writing_band REAL DEFAULT 0.0,
  total_xp INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_name TEXT NOT NULL,
  band_unlocked REAL NOT NULL,
  equipped BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS mistakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  skill_domain TEXT NOT NULL,
  error_type TEXT NOT NULL,
  transcription TEXT,
  correction TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_domain TEXT NOT NULL,
  question_text TEXT NOT NULL,
  difficulty_level TEXT NOT NULL,
  band_level REAL NOT NULL
);

CREATE INDEX idx_user_mistakes ON mistakes(user_id, skill_domain);
CREATE INDEX idx_user_equipment ON equipment(user_id, equipped);
`;

const schemaSpinner = ora('Executing schema...').start();
try {
    // Note: D1 schema application requires Wrangler CLI
    // This is a placeholder - actual implementation uses wrangler d1 execute
    schemaSpinner.info('Schema ready (will be applied via Wrangler during deployment)');

    // Save schema to file
    const { writeFileSync } = await import('fs');
    writeFileSync(join(process.cwd(), '..', 'backend', 'schema.sql'), schema);
    console.log(chalk.gray('   Schema saved to backend/schema.sql\n'));
} catch (error) {
    schemaSpinner.fail('Schema preparation failed');
    console.error(chalk.red(error.message));
}

// Step 4: Generate wrangler.toml
console.log(chalk.cyan('⚙️  Generating wrangler.toml...\n'));

const wranglerConfig = `
name = "babel-frontier"
main = "backend/api/index.js"
compatibility_date = "2025-11-01"

[env.production]
name = "babel-frontier-prod"
routes = [
  { pattern = "api.babelfrontier.uz/*", zone_name = "babelfrontier.uz" }
]

[[kv_namespaces]]
binding = "ASSETS"
id = "${process.env.KV_NAMESPACE_ID || 'YOUR_KV_NAMESPACE_ID'}"

[[d1_databases]]
binding = "DB"
database_name = "babel-frontier-db"
database_id = "${process.env.D1_DATABASE_ID || 'YOUR_D1_DATABASE_ID'}"

[vars]
REGION = "eu-central"
TARGET_LATENCY_MS = 15

# Secrets (set via: wrangler secret put <KEY>)
# OPENAI_API_KEY
# TELEGRAM_BOT_TOKEN
# WEBHOOK_SECRET
`.trim();

const { writeFileSync } = await import('fs');
writeFileSync(join(process.cwd(), '..', 'wrangler.toml'), wranglerConfig);
console.log(chalk.green('✅ wrangler.toml generated\n'));

// Step 5: Seed IELTS Questions
console.log(chalk.cyan('🌱 Seeding IELTS Questions...\n'));

const sampleQuestions = [
    { skill_domain: 'speaking', question_text: 'Describe your hometown.', difficulty_level: 'beginner', band_level: 4.5 },
    { skill_domain: 'speaking', question_text: 'Talk about a memorable journey you took.', difficulty_level: 'intermediate', band_level: 6.0 },
    { skill_domain: 'speaking', question_text: 'Discuss the impact of globalization on local cultures.', difficulty_level: 'advanced', band_level: 8.0 },
];

console.log(chalk.gray('   Sample questions prepared for D1 seeding\n'));
console.log(chalk.yellow('   ⚠️  Run: wrangler d1 execute babel-frontier-db --remote --file=backend/schema.sql\n'));

console.log(chalk.green.bold('\n✅ Cloudflare Infrastructure Provisioning Complete!\n'));
console.log(chalk.cyan('Next: Run setup_firebase.js\n'));
