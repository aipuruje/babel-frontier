// ========== DATA PROTECTION INTEGRATION EXAMPLES ==========
// Shows how to integrate encryption, anonymization, and audit logging

import { autoEncrypt, autoDecrypt } from './encryption_service.js';
import { anonymizeUserProfile, anonymizeRegionalData } from './anonymization.js';
import { logDataAccess, logDataModification, logGDPREvent } from './audit_logger.js';
import { exportUserData, deleteUserData, hasUserConsent } from './gdpr_compliance.js';

/**
 * EXAMPLE 1: Secure User Registration with Encryption
 * - Encrypts PII before storing
 * - Logs creation event
 */
export async function handleSecureUserRegistration(userData, env) {
    try {
        // Encrypt sensitive fields before storing
        const encryptedData = await autoEncrypt('users', {
            user_id: userData.user_id,
            telegram_id: userData.telegram_id,
            username: userData.username,
            email: userData.email, // Will be encrypted
            phone_number: userData.phone_number, // Will be encrypted
            first_name: userData.first_name
        }, env.ENCRYPTION_KEY);

        // Insert into database
        await env.DB.prepare(`
            INSERT INTO users (user_id, telegram_id, username, email, phone_number, first_name)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            encryptedData.user_id,
            encryptedData.telegram_id,
            encryptedData.username,
            encryptedData.email,
            encryptedData.phone_number,
            encryptedData.first_name
        ).run();

        // Audit log
        await logDataAccess(
            env.DB,
            userData.user_id,
            'users',
            'User registered',
            userData.ip_address
        );

        return { success: true, user_id: userData.user_id };

    } catch (error) {
        console.error('Secure user registration error:', error);
        throw error;
    }
}

/**
 * EXAMPLE 2: Retrieve User Data with Auto-Decryption
 * - Decrypts PII after fetching
 * - Logs data access
 */
export async function handleSecureGetUser(userId, requestingUserId, env) {
    try {
        // Fetch from database
        const encryptedUser = await env.DB.prepare(`
            SELECT * FROM users WHERE user_id = ?
        `).bind(userId).first();

        if (!encryptedUser) {
            return { error: 'User not found' };
        }

        // Decrypt sensitive fields
        const decryptedUser = await autoDecrypt('users', encryptedUser, env.ENCRYPTION_KEY);

        // Audit log
        await logDataAccess(
            env.DB,
            requestingUserId,
            `users/${userId}`,
            'User data accessed',
            null
        );

        return { user: decryptedUser };

    } catch (error) {
        console.error('Secure get user error:', error);
        throw error;
    }
}

/**
 * EXAMPLE 3: Update User Data with Encryption and Audit Log
 * - Logs before/after values
 * - Encrypts new data
 */
export async function handleSecureUpdateUser(userId, updates, env) {
    try {
        // Fetch current data (for audit log)
        const currentUser = await env.DB.prepare(`
            SELECT * FROM users WHERE user_id = ?
        `).bind(userId).first();

        // Encrypt new data
        const encryptedUpdates = await autoEncrypt('users', updates, env.ENCRYPTION_KEY);

        // Build update query dynamically
        const fields = Object.keys(encryptedUpdates);
        const setClause = fields.map(f => `${f} = ?`).join(', ');
        const values = fields.map(f => encryptedUpdates[f]);

        await env.DB.prepare(`
            UPDATE users SET ${setClause} WHERE user_id = ?
        `).bind(...values, userId).run();

        // Audit log with before/after
        await logDataModification(
            env.DB,
            userId,
            `users/${userId}`,
            currentUser,
            encryptedUpdates,
            null
        );

        return { success: true };

    } catch (error) {
        console.error('Secure update user error:', error);
        throw error;
    }
}

/**
 * EXAMPLE 4: B2B API with Anonymization
 * - Checks consent before sharing
 * - Anonymizes data
 * - Logs data access
 */
export async function handleSecureEliteProfilesAPI(apiKey, env) {
    try {
        // Fetch partner info (already validated in auth middleware)
        const partner = await env.DB.prepare(`
            SELECT * FROM institutional_partners WHERE api_key = ?
        `).bind(apiKey).first();

        // Fetch elite users who consented to sharing
        const eliteUsers = await env.DB.prepare(`
            SELECT u.*, ep.*
            FROM users u
            JOIN elite_profiles ep ON u.user_id = ep.user_id
            JOIN user_data_consent udc ON u.user_id = udc.user_id
            WHERE ep.status = 'available'
            AND ep.overall_band >= 8.5
            AND udc.elite_profile_sharing = 1
            LIMIT 20
        `).all();

        // Decrypt encrypted fields first
        const decryptedUsers = [];
        for (const user of eliteUsers.results) {
            const decrypted = await autoDecrypt('users', user, env.ENCRYPTION_KEY);
            decryptedUsers.push(decrypted);
        }

        // Anonymize for B2B
        const anonymizedProfiles = decryptedUsers.map(user =>
            anonymizeUserProfile(user, 'elite')
        );

        // Audit log
        await logDataAccess(
            env.DB,
            null,
            'elite_profiles',
            `Partner ${partner.organization_name} accessed ${anonymizedProfiles.length} elite profiles`,
            null
        );

        return {
            elite_profiles: anonymizedProfiles,
            count: anonymizedProfiles.length,
            data_classification: 'ANONYMIZED',
            placement_fee_per_profile: 500000
        };

    } catch (error) {
        console.error('Secure elite profiles API error:', error);
        throw error;
    }
}

/**
 * EXAMPLE 5: Regional Heatmap with Anonymization
 * - Applies k-anonymity
 * - Adds differential privacy noise
 * - Returns aggregated data only
 */
export async function handleSecureRegionalHeatmap(env) {
    try {
        // Fetch raw regional performance data
        const rawData = await env.DB.prepare(`
            SELECT 
                region,
                skill_domain,
                AVG(avg_band) as avg_band,
                COUNT(*) as user_count
            FROM regional_performance_clusters
            GROUP BY region, skill_domain
        `).all();

        // Apply anonymization (k-anonymity + differential privacy)
        const anonymizedHeatmap = anonymizeRegionalData(rawData.results, 10);

        return {
            heatmap: anonymizedHeatmap,
            data_classification: 'ANONYMIZED - K >= 10',
            generated_at: new Date().toISOString()
        };

    } catch (error) {
        console.error('Secure regional heatmap error:', error);
        throw error;
    }
}

/**
 * EXAMPLE 6: GDPR Data Export Request
 * - Exports all user data
 * - Logs GDPR event
 */
export async function handleGDPRDataExportRequest(userId, env) {
    try {
        // Check if user exists
        const user = await env.DB.prepare(`
            SELECT user_id FROM users WHERE user_id = ?
        `).bind(userId).first();

        if (!user) {
            return { error: 'User not found' };
        }

        // Export all user data
        const userData = await exportUserData(env.DB, userId);

        // Decrypt encrypted fields for export
        if (userData.personal_data.profile) {
            userData.personal_data.profile = await autoDecrypt(
                'users',
                userData.personal_data.profile,
                env.ENCRYPTION_KEY
            );
        }

        // Log GDPR event
        await logGDPREvent(
            env.DB,
            userId,
            'data_exported',
            'User requested data export (GDPR Article 15)'
        );

        return {
            success: true,
            data: userData,
            file_name: `babel_frontier_data_export_${userId}_${Date.now()}.json`
        };

    } catch (error) {
        console.error('GDPR data export error:', error);
        throw error;
    }
}

/**
 * EXAMPLE 7: GDPR Data Deletion Request
 * - Verifies user identity
 * - Deletes all user data
 * - Logs deletion (required by law)
 */
export async function handleGDPRDataDeletionRequest(userId, verificationToken, env) {
    try {
        // Verify user identity (simplified - use proper auth in production)
        const user = await env.DB.prepare(`
            SELECT user_id FROM users WHERE user_id = ?
        `).bind(userId).first();

        if (!user) {
            return { error: 'User not found' };
        }

        // Optionally: Send confirmation email before deleting

        // Delete all user data
        const deletionReport = await deleteUserData(
            env.DB,
            userId,
            'gdpr_article_17_right_to_erasure'
        );

        // Log GDPR event (this is kept even after deletion)
        await logGDPREvent(
            env.DB,
            userId,
            'data_deletion_requested',
            `User data permanently deleted. Records affected: ${JSON.stringify(deletionReport.deleted_records)}`
        );

        return {
            success: true,
            message: 'All user data has been permanently deleted',
            deletion_report: deletionReport
        };

    } catch (error) {
        console.error('GDPR data deletion error:', error);
        throw error;
    }
}

/**
 * EXAMPLE 8: Consent Management
 * - Updates user consent
 * - Logs consent change
 */
export async function handleConsentUpdate(userId, consentType, granted, env) {
    try {
        // Update consent
        await env.DB.prepare(`
            INSERT INTO user_data_consent (user_id, ${consentType})
            VALUES (?, ?)
            ON CONFLICT(user_id) DO UPDATE SET ${consentType} = ?
        `).bind(userId, granted ? 1 : 0, granted ? 1 : 0).run();

        // Log GDPR event
        await logGDPREvent(
            env.DB,
            userId,
            granted ? 'data_consent_given' : 'data_consent_revoked',
            `Consent ${granted ? 'granted' : 'revoked'} for ${consentType}`
        );

        return {
            success: true,
            consent_type: consentType,
            granted
        };

    } catch (error) {
        console.error('Consent update error:', error);
        throw error;
    }
}

export default {
    handleSecureUserRegistration,
    handleSecureGetUser,
    handleSecureUpdateUser,
    handleSecureEliteProfilesAPI,
    handleSecureRegionalHeatmap,
    handleGDPRDataExportRequest,
    handleGDPRDataDeletionRequest,
    handleConsentUpdate
};
