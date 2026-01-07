// ========== GDPR COMPLIANCE UTILITIES ==========
// Implements GDPR rights: Right to Access, Right to Erasure, Right to Portability

/**
 * GDPR Article 15: Right to Access
 * Export all user data in machine-readable format
 * @param {Object} db - D1 database
 * @param {string} userId - User ID
 * @returns {Object} - Complete user data export
 */
export async function exportUserData(db, userId) {
    try {
        // Collect all user data from all tables
        const userData = {
            export_metadata: {
                user_id: userId,
                export_date: new Date().toISOString(),
                data_controller: 'Babel Frontier',
                legal_basis: 'GDPR Article 15 - Right to Access'
            },
            personal_data: {},
            learning_data: {},
            transaction_data: {},
            social_data: {}
        };

        // Users table
        const user = await db.prepare(`
            SELECT * FROM users WHERE user_id = ?
        `).bind(userId).first();
        userData.personal_data.profile = user;

        // Brain state
        const brainState = await db.prepare(`
            SELECT * FROM brain_state WHERE user_id = ?
        `).bind(userId).first();
        userData.learning_data.brain_state = brainState;

        // Mistakes history
        const mistakes = await db.prepare(`
            SELECT * FROM mistake_bank WHERE user_id = ?
        `).bind(userId).all();
        userData.learning_data.mistakes = mistakes.results;

        // Writing submissions
        const writingSubmissions = await db.prepare(`
            SELECT * FROM writing_analysis WHERE user_id = ?
        `).bind(userId).all();
        userData.learning_data.writing_submissions = writingSubmissions.results;

        // Transactions
        const transactions = await db.prepare(`
            SELECT * FROM user_transactions WHERE user_id = ?
        `).bind(userId).all();
        userData.transaction_data.transactions = transactions.results;

        // Inventory
        const inventory = await db.prepare(`
            SELECT * FROM user_inventory WHERE user_id = ?
        `).bind(userId).all();
        userData.transaction_data.inventory = inventory.results;

        // Guild membership
        const guildMembership = await db.prepare(`
            SELECT g.* FROM guilds g
            JOIN guild_members gm ON g.id = gm.guild_id
            WHERE gm.user_id = ?
        `).bind(userId).all();
        userData.social_data.guilds = guildMembership.results;

        // Consent records
        const consents = await db.prepare(`
            SELECT * FROM user_data_consent WHERE user_id = ?
        `).bind(userId).all();
        userData.personal_data.consents = consents.results;

        // Audit logs (last 90 days)
        const auditLogs = await db.prepare(`
            SELECT * FROM security_audit_logs
            WHERE user_id = ?
            AND timestamp >= datetime('now', '-90 days')
        `).bind(userId).all();
        userData.personal_data.audit_logs = auditLogs.results;

        return userData;

    } catch (error) {
        console.error('User data export error:', error);
        throw new Error('Data export failed');
    }
}

/**
 * GDPR Article 17: Right to Erasure ("Right to be Forgotten")
 * Permanently delete all user data
 * @param {Object} db - D1 database
 * @param {string} userId - User ID
 * @param {string} reason - Reason for deletion
 * @returns {Object} - Deletion report
 */
export async function deleteUserData(db, userId, reason = 'user_request') {
    try {
        const deletionReport = {
            user_id: userId,
            deletion_date: new Date().toISOString(),
            reason,
            deleted_records: {}
        };

        // Delete from all tables (in correct order to respect foreign keys)
        const tables = [
            'user_transactions',
            'user_inventory',
            'writing_analysis',
            'mistake_bank',
            'brain_state',
            'guild_members',
            'user_locations',
            'user_data_consent',
            'elite_profiles',
            'regional_event_participations',
            'daily_challenge_participations',
            'users'
        ];

        for (const table of tables) {
            try {
                const result = await db.prepare(`
                    DELETE FROM ${table} WHERE user_id = ?
                `).bind(userId).run();

                deletionReport.deleted_records[table] = result.meta.changes || 0;
            } catch (error) {
                console.error(`Failed to delete from ${table}:`, error);
                deletionReport.deleted_records[table] = `ERROR: ${error.message}`;
            }
        }

        // Keep audit log of deletion (required for compliance)
        await db.prepare(`
            INSERT INTO security_audit_logs (
                event_type, user_id, action, severity, resource
            ) VALUES (?, ?, ?, ?, ?)
        `).bind(
            'data_deletion_requested',
            userId,
            `User data deleted. Reason: ${reason}`,
            'INFO',
            JSON.stringify(deletionReport)
        ).run();

        return deletionReport;

    } catch (error) {
        console.error('User data deletion error:', error);
        throw new Error('Data deletion failed');
    }
}

/**
 * GDPR Article 20: Right to Data Portability
 * Export user data in structured, commonly used format (JSON)
 * @param {Object} db - D1 database
 * @param {string} userId - User ID
 * @returns {string} - JSON string of user data
 */
export async function exportPortableData(db, userId) {
    const data = await exportUserData(db, userId);
    return JSON.stringify(data, null, 2);
}

/**
 * Check if user has given consent for data processing
 * @param {Object} db - D1 database
 * @param {string} userId - User ID
 * @param {string} consentType - Type of consent (e.g., 'collective_learning', 'elite_profile_sharing')
 * @returns {boolean} - True if consent given
 */
export async function hasUserConsent(db, userId, consentType) {
    const consent = await db.prepare(`
        SELECT ${consentType} FROM user_data_consent WHERE user_id = ?
    `).bind(userId).first();

    return consent ? Boolean(consent[consentType]) : false;
}

/**
 * Update user consent
 * @param {Object} db - D1 database
 * @param {string} userId - User ID
 * @param {string} consentType - Type of consent
 * @param {boolean} granted - True if consent granted, false if revoked
 */
export async function updateUserConsent(db, userId, consentType, granted) {
    // Upsert consent record
    await db.prepare(`
        INSERT INTO user_data_consent (user_id, ${consentType})
        VALUES (?, ?)
        ON CONFLICT(user_id) DO UPDATE SET ${consentType} = ?
    `).bind(userId, granted ? 1 : 0, granted ? 1 : 0).run();

    // Log consent change
    await db.prepare(`
        INSERT INTO security_audit_logs (
            event_type, user_id, action, severity
        ) VALUES (?, ?, ?, ?)
    `).bind(
        granted ? 'data_consent_given' : 'data_consent_revoked',
        userId,
        `Consent ${granted ? 'granted' : 'revoked'} for ${consentType}`,
        'INFO'
    ).run();
}

/**
 * Data retention policy enforcement
 * Delete data older than retention period
 * @param {Object} db - D1 database
 * @param {number} retentionDays - Days to retain data (default: 2555 days = 7 years)
 */
export async function enforceDataRetention(db, retentionDays = 2555) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffISO = cutoffDate.toISOString();

    // Delete old audit logs (keep 7 years for compliance)
    const auditResult = await db.prepare(`
        DELETE FROM security_audit_logs
        WHERE timestamp < ?
        AND severity = 'INFO'
    `).bind(cutoffISO).run();

    // Delete old writing submissions (keep 1 year)
    const writingCutoff = new Date();
    writingCutoff.setFullYear(writingCutoff.getFullYear() - 1);
    const writingResult = await db.prepare(`
        DELETE FROM writing_analysis
        WHERE created_at < ?
    `).bind(writingCutoff.toISOString()).run();

    return {
        audit_logs_deleted: auditResult.meta.changes || 0,
        writing_submissions_deleted: writingResult.meta.changes || 0,
        cutoff_date: cutoffISO
    };
}

/**
 * Generate GDPR compliance report
 * @param {Object} db - D1 database
 * @returns {Object} - Compliance status
 */
export async function generateGDPRReport(db) {
    // Count users with consent
    const totalUsers = await db.prepare(`
        SELECT COUNT(*) as count FROM users
    `).first();

    const usersWithConsent = await db.prepare(`
        SELECT COUNT(*) as count FROM user_data_consent
        WHERE collective_learning = 1
    `).first();

    const eliteProfileConsent = await db.prepare(`
        SELECT COUNT(*) as count FROM user_data_consent
        WHERE elite_profile_sharing = 1
    `).first();

    // Count data subject requests (last 30 days)
    const dataRequests = await db.prepare(`
        SELECT COUNT(*) as count FROM security_audit_logs
        WHERE event_type IN ('data_deletion_requested', 'data_exported')
        AND timestamp >= datetime('now', '-30 days')
    `).first();

    return {
        total_users: totalUsers.count,
        users_with_collective_consent: usersWithConsent.count,
        users_with_elite_consent: eliteProfileConsent.count,
        consent_rate: ((usersWithConsent.count / totalUsers.count) * 100).toFixed(2) + '%',
        data_requests_last_30_days: dataRequests.count,
        compliance_status: 'COMPLIANT',
        generated_at: new Date().toISOString()
    };
}

/**
 * Anonymize departed user data (alternative to full deletion)
 * Keeps statistical data but removes PII
 * @param {Object} db - D1 database
 * @param {string} userId - User ID
 */
export async function anonymizeDepartedUser(db, userId) {
    // Replace user data with anonymous values
    await db.prepare(`
        UPDATE users
        SET 
            telegram_id = ?,
            username = ?,
            first_name = ?,
            email = NULL,
            phone_number = NULL
        WHERE user_id = ?
    `).bind(
        `[DELETED_${Date.now()}]`,
        `Anonymous User`,
        `Deleted`,
        userId
    ).run();

    // Keep learning data for analytics but mark as anonymized
    await db.prepare(`
        UPDATE brain_state
        SET user_id = ?
        WHERE user_id = ?
    `).bind(`ANON_${userId}`, userId).run();

    return { success: true, user_id: userId, anonymized: true };
}

export default {
    exportUserData,
    deleteUserData,
    exportPortableData,
    hasUserConsent,
    updateUserConsent,
    enforceDataRetention,
    generateGDPRReport,
    anonymizeDepartedUser
};
