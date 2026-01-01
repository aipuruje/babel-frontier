#!/usr/bin/env node

/**
 * Firebase Setup Script
 * Initializes Firestore with User Brain State schema
 */

import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '..', '.env') });

console.log(chalk.cyan('\n🔥 Firebase Setup\n'));

const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
    console.log(chalk.yellow('⚠️  No Firebase project specified in .env'));
    console.log(chalk.gray('   Skipping Firebase setup. You can manually configure later.\n'));
    process.exit(0);
}

const spinner = ora(`Configuring Firebase project: ${projectId}`).start();

// Firestore schema documentation
const firestoreSchema = `
Firestore Collections:

1. users/{user_id}
   - username: string
   - telegram_id: number
   - created_at: timestamp
   - last_active: timestamp

2. brain_state/{user_id}
   - speaking_band: number (default: 4.0)
   - listening_band: number (default: 0.0)
   - reading_band: number (default: 0.0)
   - writing_band: number (default: 0.0)
   - total_xp: number (default: 0)

3. equipment/{user_id}/items/{item_id}
   - item_type: string ("cape", "boots", "armor")
   - item_name: string
   - band_unlocked: number
   - equipped: boolean

4. mistakes/{user_id}/errors/{mistake_id}
   - skill_domain: string ("speaking", "listening", etc.)
   - error_type: string ("pronunciation", "grammar", etc.)
   - transcription: string
   - correction: string
   - created_at: timestamp

5. leaderboard/{entry_id}
   - user_id: string
   - username: string
   - total_xp: number
   - best_band: number
   - last_updated: timestamp
`;

// Save schema documentation
const { writeFileSync } = await import('fs');
writeFileSync(
    join(process.cwd(), '..', 'backend', 'firestore_schema.txt'),
    firestoreSchema
);

spinner.succeed('Firebase schema documented');
console.log(chalk.gray('   Schema saved to backend/firestore_schema.txt\n'));

// Firestore security rules
const securityRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /brain_state/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /equipment/{userId}/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /mistakes/{userId}/{document=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Leaderboard is public read, auth write
    match /leaderboard/{entry} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
`.trim();

writeFileSync(
    join(process.cwd(), '..', 'firestore.rules'),
    securityRules
);

console.log(chalk.green('✅ Firestore security rules generated: firestore.rules\n'));
console.log(chalk.yellow('📝 Manual steps required:\n'));
console.log(chalk.gray('   1. Go to https://console.firebase.google.com'));
console.log(chalk.gray(`   2. Select project: ${projectId}`));
console.log(chalk.gray('   3. Enable Firestore Database'));
console.log(chalk.gray('   4. Deploy rules: firebase deploy --only firestore:rules\n'));

console.log(chalk.green.bold('✅ Firebase Setup Complete!\n'));
