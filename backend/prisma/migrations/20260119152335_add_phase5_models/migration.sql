-- CreateTable
CREATE TABLE "module_progress" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "accuracy" REAL NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "questions_completed" INTEGER NOT NULL DEFAULT 0,
    "mastery_level" REAL NOT NULL DEFAULT 0,
    "last_attempt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "module_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("telegram_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "is_lifetime" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" DATETIME,
    "battle_mode_count" INTEGER NOT NULL DEFAULT 0,
    "last_battle_reset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("telegram_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "referrer_code" TEXT NOT NULL,
    "referee_id" TEXT NOT NULL,
    "xp_awarded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referrals_referrer_code_fkey" FOREIGN KEY ("referrer_code") REFERENCES "users" ("referral_code") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "referrals_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "users" ("telegram_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analytics_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "module_id" TEXT,
    "duration" INTEGER NOT NULL,
    "xp_earned" INTEGER NOT NULL,
    "questions_answered" INTEGER NOT NULL,
    "accuracy" REAL NOT NULL,
    "started_at" DATETIME NOT NULL,
    "ended_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analytics_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("telegram_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telegram_id" TEXT NOT NULL,
    "username" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "auth_method" TEXT,
    "phone_number" TEXT,
    "email" TEXT,
    "referral_code" TEXT,
    "referred_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_active" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_users" ("auth_method", "created_at", "email", "first_name", "id", "last_active", "phone_number", "telegram_id", "updated_at", "username") SELECT "auth_method", "created_at", "email", "first_name", "id", coalesce("last_active", CURRENT_TIMESTAMP) AS "last_active", "phone_number", "telegram_id", "updated_at", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");
CREATE INDEX "users_telegram_id_idx" ON "users"("telegram_id");
CREATE INDEX "users_referral_code_idx" ON "users"("referral_code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "module_progress_user_id_idx" ON "module_progress"("user_id");

-- CreateIndex
CREATE INDEX "module_progress_module_id_idx" ON "module_progress"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "module_progress_user_id_module_id_key" ON "module_progress"("user_id", "module_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_user_id_key" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_expires_at_idx" ON "subscriptions"("expires_at");

-- CreateIndex
CREATE INDEX "referrals_referrer_code_idx" ON "referrals"("referrer_code");

-- CreateIndex
CREATE INDEX "referrals_referee_id_idx" ON "referrals"("referee_id");

-- CreateIndex
CREATE INDEX "analytics_sessions_user_id_idx" ON "analytics_sessions"("user_id");

-- CreateIndex
CREATE INDEX "analytics_sessions_module_id_idx" ON "analytics_sessions"("module_id");

-- CreateIndex
CREATE INDEX "analytics_sessions_created_at_idx" ON "analytics_sessions"("created_at");
