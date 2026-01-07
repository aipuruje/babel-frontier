// ========== ENCRYPTION SERVICE ==========
// Field-level encryption for sensitive data using AES-256-GCM
// Protects PII in database at rest

/**
 * Encrypts data using AES-256-GCM
 * @param {string} plaintext - Data to encrypt
 * @param {string} masterKey - Base64-encoded 256-bit key
 * @returns {string} - Base64-encoded encrypted data with IV and auth tag
 */
export async function encrypt(plaintext, masterKey) {
    try {
        if (!plaintext || plaintext === '') {
            return plaintext; // Don't encrypt empty strings
        }

        // Generate random IV (12 bytes for GCM)
        const iv = crypto.getRandomValues(new Uint8Array(12));

        // Import master key
        const keyMaterial = base64ToArrayBuffer(masterKey);
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        // Encrypt
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            data
        );

        // Combine IV + ciphertext + auth tag into single blob
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encrypted), iv.length);

        // Return base64-encoded
        return arrayBufferToBase64(combined);

    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Encryption failed');
    }
}

/**
 * Decrypts data encrypted with encrypt()
 * @param {string} ciphertext - Base64-encoded encrypted data
 * @param {string} masterKey - Base64-encoded 256-bit key
 * @returns {string} - Decrypted plaintext
 */
export async function decrypt(ciphertext, masterKey) {
    try {
        if (!ciphertext || ciphertext === '') {
            return ciphertext; // Return empty strings as-is
        }

        // Decode base64
        const combined = base64ToArrayBuffer(ciphertext);

        // Extract IV (first 12 bytes) and encrypted data
        const iv = combined.slice(0, 12);
        const encryptedData = combined.slice(12);

        // Import master key
        const keyMaterial = base64ToArrayBuffer(masterKey);
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        // Decrypt
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            cryptoKey,
            encryptedData
        );

        // Decode to string
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);

    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Decryption failed - data may be corrupted or key is wrong');
    }
}

/**
 * Generate a new 256-bit encryption key
 * @returns {string} - Base64-encoded key
 */
export async function generateEncryptionKey() {
    const key = crypto.getRandomValues(new Uint8Array(32)); // 256 bits
    return arrayBufferToBase64(key);
}

/**
 * Encrypt multiple fields in an object
 * @param {Object} data - Data object
 * @param {Array<string>} fields - Fields to encrypt
 * @param {string} key - Encryption key
 * @returns {Object} - Object with encrypted fields
 */
export async function encryptFields(data, fields, key) {
    const encrypted = { ...data };

    for (const field of fields) {
        if (data[field] !== undefined && data[field] !== null) {
            encrypted[field] = await encrypt(data[field].toString(), key);
        }
    }

    return encrypted;
}

/**
 * Decrypt multiple fields in an object
 * @param {Object} data - Data object with encrypted fields
 * @param {Array<string>} fields - Fields to decrypt
 * @param {string} key - Encryption key
 * @returns {Object} - Object with decrypted fields
 */
export async function decryptFields(data, fields, key) {
    const decrypted = { ...data };

    for (const field of fields) {
        if (data[field] !== undefined && data[field] !== null) {
            try {
                decrypted[field] = await decrypt(data[field], key);
            } catch (error) {
                console.error(`Failed to decrypt field ${field}:`, error);
                decrypted[field] = '[ENCRYPTED]'; // Placeholder for failed decryption
            }
        }
    }

    return decrypted;
}

/**
 * Hash sensitive data for searching (one-way)
 * Useful for email/phone lookup without storing plaintext
 * @param {string} data - Data to hash
 * @returns {string} - Hex-encoded SHA-256 hash
 */
export async function hashForSearch(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    return arrayBufferToHex(hashBuffer);
}

/**
 * Utility: Base64 encode ArrayBuffer
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Utility: Base64 decode to ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Utility: ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Encrypted field configuration
 * Maps table -> fields that should be encrypted
 */
export const ENCRYPTED_FIELDS = {
    users: ['email', 'phone_number'],
    user_locations: ['region', 'district'], // Privacy: hide exact location
    institutional_partners: ['contact_email', 'contact_phone'],
    elite_profiles: ['user_id'], // Encrypted until claimed
    user_transactions: ['transaction_id', 'payment_details']
};

/**
 * Get encrypted fields for a table
 * @param {string} tableName
 * @returns {Array<string>}
 */
export function getEncryptedFields(tableName) {
    return ENCRYPTED_FIELDS[tableName] || [];
}

/**
 * Middleware: Auto-encrypt before DB insert/update
 * @param {string} tableName
 * @param {Object} data
 * @param {string} key
 * @returns {Object} - Data with encrypted fields
 */
export async function autoEncrypt(tableName, data, key) {
    const fields = getEncryptedFields(tableName);
    if (fields.length === 0) return data;
    return await encryptFields(data, fields, key);
}

/**
 * Middleware: Auto-decrypt after DB select
 * @param {string} tableName
 * @param {Object|Array} data
 * @param {string} key
 * @returns {Object|Array} - Data with decrypted fields
 */
export async function autoDecrypt(tableName, data, key) {
    const fields = getEncryptedFields(tableName);
    if (fields.length === 0) return data;

    if (Array.isArray(data)) {
        return Promise.all(data.map(row => decryptFields(row, fields, key)));
    } else {
        return await decryptFields(data, fields, key);
    }
}

/**
 * Key rotation: Re-encrypt data with new key
 * @param {string} ciphertext - Data encrypted with old key
 * @param {string} oldKey - Old encryption key
 * @param {string} newKey - New encryption key
 * @returns {string} - Data re-encrypted with new key
 */
export async function rotateKey(ciphertext, oldKey, newKey) {
    const plaintext = await decrypt(ciphertext, oldKey);
    return await encrypt(plaintext, newKey);
}

/**
 * Batch key rotation for a table
 * @param {Object} db - D1 database
 * @param {string} tableName
 * @param {string} oldKey
 * @param {string} newKey
 */
export async function rotateTableKeys(db, tableName, oldKey, newKey) {
    const fields = getEncryptedFields(tableName);
    if (fields.length === 0) return;

    console.log(`Rotating keys for ${tableName}...`);

    // Fetch all rows
    const rows = await db.prepare(`SELECT * FROM ${tableName}`).all();

    // Re-encrypt each row
    for (const row of rows.results) {
        const updates = [];
        const values = [];

        for (const field of fields) {
            if (row[field]) {
                const reEncrypted = await rotateKey(row[field], oldKey, newKey);
                updates.push(`${field} = ?`);
                values.push(reEncrypted);
            }
        }

        if (updates.length > 0) {
            values.push(row.id); // Assuming 'id' primary key
            await db.prepare(`
                UPDATE ${tableName}
                SET ${updates.join(', ')}
                WHERE id = ?
            `).bind(...values).run();
        }
    }

    console.log(`Key rotation complete for ${tableName}: ${rows.results.length} rows updated`);
}

export default {
    encrypt,
    decrypt,
    generateEncryptionKey,
    encryptFields,
    decryptFields,
    hashForSearch,
    autoEncrypt,
    autoDecrypt,
    rotateKey,
    rotateTableKeys,
    ENCRYPTED_FIELDS
};
