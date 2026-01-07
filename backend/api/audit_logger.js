// ========== AUDIT LOGGING SYSTEM ==========
// Immutable audit logs for compliance (GDPR, PCI-DSS, SOC 2)
// Tamper-proof with hash chaining

/**
 * Log security event to audit trail
 * @param {Object} db - D1 database
 * @param {Object} event - Event details
 * @returns {number} - Log ID
 */
export async function logAuditEvent(db, event) {
    try {
        // Get previous log hash for chaining
        const previousLog = await db.prepare(`
            SELECT log_hash FROM security_audit_logs
            ORDER BY id DESC LIMIT 1
        `).first();

        const previousHash = previousLog?.log_hash || '0000000000000000';

        // Create current log entry
        const logEntry = {
            timestamp: new Date().toISOString(),
            event_type: event.event_type,
            user_id: event.user_id || null,
            ip_address: event.ip_address || null,
            user_agent: event.user_agent || null,
            action: event.action,
            resource: event.resource || null,
            before_value: event.before_value || null,
            after_value: event.after_value || null,
            severity: event.severity || 'INFO',
            previous_log_hash: previousHash
        };

        // Compute hash of this log entry (tamper detection)
        const logHash = await computeLogHash(logEntry);
        logEntry.log_hash = logHash;

        // Insert into database
        const result = await db.prepare(`
            INSERT INTO security_audit_logs (
                timestamp, event_type, user_id, ip_address, user_agent,
                action, resource, before_value, after_value, severity,
                previous_log_hash, log_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            logEntry.timestamp,
            logEntry.event_type,
            logEntry.user_id,
            logEntry.ip_address,
            logEntry.user_agent,
            logEntry.action,
            logEntry.resource,
            logEntry.before_value,
            logEntry.after_value,
            logEntry.severity,
            logEntry.previous_log_hash,
            logEntry.log_hash
        ).run();

        return result.meta.last_row_id;

    } catch (error) {
        console.error('Audit logging error:', error);
        // CRITICAL: Never fail the main operation if logging fails
        return null;
    }
}

/**
 * Compute SHA-256 hash of log entry for integrity verification
 * @param {Object} logEntry
 * @returns {string} - Hex-encoded hash
 */
async function computeLogHash(logEntry) {
    const data = JSON.stringify({
        timestamp: logEntry.timestamp,
        event_type: logEntry.event_type,
        user_id: logEntry.user_id,
        action: logEntry.action,
        resource: logEntry.resource,
        previous_log_hash: logEntry.previous_log_hash
    });

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Verify audit log chain integrity
 * @param {Object} db - D1 database
 * @param {number} limit - Number of recent logs to verify
 * @returns {Object} - { valid: boolean, tamperedLogs: Array }
 */
export async function verifyAuditLogIntegrity(db, limit = 1000) {
    const logs = await db.prepare(`
        SELECT * FROM security_audit_logs
        ORDER BY id DESC LIMIT ?
    `).bind(limit).all();

    const tamperedLogs = [];

    for (let i = logs.results.length - 1; i >= 0; i--) {
        const log = logs.results[i];
        const computedHash = await computeLogHash(log);

        if (computedHash !== log.log_hash) {
            tamperedLogs.push({
                id: log.id,
                timestamp: log.timestamp,
                reason: 'Hash mismatch - log may have been tampered'
            });
        }

        // Verify chain linkage
        if (i < logs.results.length - 1) {
            const nextLog = logs.results[i + 1];
            if (nextLog.previous_log_hash !== log.log_hash) {
                tamperedLogs.push({
                    id: nextLog.id,
                    timestamp: nextLog.timestamp,
                    reason: 'Chain broken - previous hash mismatch'
                });
            }
        }
    }

    return {
        valid: tamperedLogs.length === 0,
        logsChecked: logs.results.length,
        tamperedLogs
    };
}

/**
 * Common audit event types
 */
export const AUDIT_EVENTS = {
    // Authentication
    LOGIN_SUCCESS: 'login_success',
    LOGIN_FAILED: 'login_failed',
    LOGOUT: 'logout',
    TOKEN_REFRESH: 'token_refresh',

    // Authorization
    PERMISSION_DENIED: 'permission_denied',
    PRIVILEGE_ESCALATION_ATTEMPT: 'privilege_escalation_attempt',

    // Data Access
    DATA_READ: 'data_read',
    DATA_CREATE: 'data_create',
    DATA_UPDATE: 'data_update',
    DATA_DELETE: 'data_delete',
    DATA_EXPORT: 'data_export',

    // Payment
    PAYMENT_INITIATED: 'payment_initiated',
    PAYMENT_COMPLETED: 'payment_completed',
    PAYMENT_FAILED: 'payment_failed',
    REFUND_PROCESSED: 'refund_processed',
    FRAUD_ATTEMPT: 'fraud_attempt',

    // Security
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
    BRUTE_FORCE_DETECTED: 'brute_force_detected',
    INJECTION_ATTEMPT: 'injection_attempt',
    WEBHOOK_SIGNATURE_FAILED: 'webhook_signature_failed',
    API_KEY_COMPROMISED: 'api_key_compromised',

    // Admin Actions
    USER_ROLE_CHANGED: 'user_role_changed',
    PARTNER_REGISTERED: 'partner_registered',
    API_KEY_ROTATED: 'api_key_rotated',
    ENCRYPTION_KEY_ROTATED: 'encryption_key_rotated',

    // GDPR
    DATA_CONSENT_GIVEN: 'data_consent_given',
    DATA_CONSENT_REVOKED: 'data_consent_revoked',
    DATA_DELETION_REQUESTED: 'data_deletion_requested',
    DATA_EXPORTED: 'data_exported',
    PERSONAL_DATA_BREACHED: 'personal_data_breached'
};

/**
 * Severity levels
 */
export const SEVERITY = {
    INFO: 'INFO',
    WARNING: 'WARNING',
    CRITICAL: 'CRITICAL'
};

/**
 * Convenient logging functions for common events
 */

export async function logLogin(db, userId, ipAddress, success) {
    return await logAuditEvent(db, {
        event_type: success ? AUDIT_EVENTS.LOGIN_SUCCESS : AUDIT_EVENTS.LOGIN_FAILED,
        user_id: userId,
        ip_address: ipAddress,
        action: success ? 'User logged in' : 'Login failed',
        severity: success ? SEVERITY.INFO : SEVERITY.WARNING
    });
}

export async function logDataAccess(db, userId, resource, action, ipAddress) {
    return await logAuditEvent(db, {
        event_type: AUDIT_EVENTS.DATA_READ,
        user_id: userId,
        ip_address: ipAddress,
        action,
        resource,
        severity: SEVERITY.INFO
    });
}

export async function logDataModification(db, userId, resource, before, after, ipAddress) {
    return await logAuditEvent(db, {
        event_type: AUDIT_EVENTS.DATA_UPDATE,
        user_id: userId,
        ip_address: ipAddress,
        action: `Modified ${resource}`,
        resource,
        before_value: JSON.stringify(before),
        after_value: JSON.stringify(after),
        severity: SEVERITY.INFO
    });
}

export async function logPaymentEvent(db, userId, transactionId, amount, status) {
    return await logAuditEvent(db, {
        event_type: status === 'completed' ? AUDIT_EVENTS.PAYMENT_COMPLETED : AUDIT_EVENTS.PAYMENT_FAILED,
        user_id: userId,
        action: `Payment ${status}: ${amount} UZS`,
        resource: transactionId,
        severity: status === 'completed' ? SEVERITY.INFO : SEVERITY.WARNING
    });
}

export async function logSecurityIncident(db, eventType, details, severity = SEVERITY.CRITICAL) {
    return await logAuditEvent(db, {
        event_type: eventType,
        user_id: details.user_id,
        ip_address: details.ip_address,
        action: details.action,
        resource: details.resource,
        severity
    });
}

export async function logGDPREvent(db, userId, eventType, details) {
    return await logAuditEvent(db, {
        event_type: eventType,
        user_id: userId,
        action: details,
        severity: SEVERITY.INFO
    });
}

/**
 * Query audit logs with filters
 * @param {Object} db - D1 database
 * @param {Object} filters - { user_id, event_type, severity, start_date, end_date, limit }
 * @returns {Array} - Matching logs
 */
export async function queryAuditLogs(db, filters = {}) {
    let query = 'SELECT * FROM security_audit_logs WHERE 1=1';
    const bindings = [];

    if (filters.user_id) {
        query += ' AND user_id = ?';
        bindings.push(filters.user_id);
    }

    if (filters.event_type) {
        query += ' AND event_type = ?';
        bindings.push(filters.event_type);
    }

    if (filters.severity) {
        query += ' AND severity = ?';
        bindings.push(filters.severity);
    }

    if (filters.start_date) {
        query += ' AND timestamp >= ?';
        bindings.push(filters.start_date);
    }

    if (filters.end_date) {
        query += ' AND timestamp <= ?';
        bindings.push(filters.end_date);
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    bindings.push(filters.limit || 100);

    const result = await db.prepare(query).bind(...bindings).all();
    return result.results;
}

/**
 * Generate compliance report
 * @param {Object} db - D1 database
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @returns {Object} - Compliance metrics
 */
export async function generateComplianceReport(db, startDate, endDate) {
    const logs = await queryAuditLogs(db, { start_date: startDate, end_date: endDate, limit: 10000 });

    const report = {
        period: { start: startDate, end: endDate },
        total_events: logs.length,
        by_severity: {
            INFO: logs.filter(l => l.severity === SEVERITY.INFO).length,
            WARNING: logs.filter(l => l.severity === SEVERITY.WARNING).length,
            CRITICAL: logs.filter(l => l.severity === SEVERITY.CRITICAL).length
        },
        security_incidents: logs.filter(l =>
            l.event_type.includes('attempt') ||
            l.event_type.includes('failed') ||
            l.severity === SEVERITY.CRITICAL
        ).length,
        gdpr_events: logs.filter(l =>
            l.event_type.startsWith('data_')
        ).length,
        payment_events: logs.filter(l =>
            l.event_type.includes('payment')
        ).length,
        unique_users: new Set(logs.map(l => l.user_id).filter(Boolean)).size,
        generated_at: new Date().toISOString()
    };

    return report;
}

export default {
    logAuditEvent,
    verifyAuditLogIntegrity,
    logLogin,
    logDataAccess,
    logDataModification,
    logPaymentEvent,
    logSecurityIncident,
    logGDPREvent,
    queryAuditLogs,
    generateComplianceReport,
    AUDIT_EVENTS,
    SEVERITY
};
