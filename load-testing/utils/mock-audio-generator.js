/**
 * Mock Audio Generator for k6 Load Testing
 * 
 * Generates fake audio blobs to simulate WebM files without requiring actual audio processing.
 * This allows us to test the API under load without managing hundreds of real audio files.
 */

import encoding from 'k6/encoding';

/**
 * Generate a mock WebM audio blob
 * 
 * @param {number} durationSeconds - Duration of the audio in seconds
 * @param {number} quality - Quality level (affects file size): 'low', 'medium', 'high'
 * @returns {Object} - Mock audio file with binary data and metadata
 */
export function generateMockAudio(durationSeconds, quality = 'medium') {
    // Calculate approximate file size based on WebM Opus codec bitrate
    // Low quality: ~16 kbps, Medium: ~32 kbps, High: ~64 kbps
    const bitrateMap = {
        low: 16000,
        medium: 32000,
        high: 64000
    };

    const bitrate = bitrateMap[quality] || bitrateMap.medium;
    const fileSizeBytes = Math.floor((bitrate / 8) * durationSeconds);

    // Generate random binary data to simulate compressed audio
    const audioData = generateRandomBytes(fileSizeBytes);

    // Add minimal WebM header (real WebM headers are complex, this is a mock)
    const webmHeader = createWebMHeader(durationSeconds);
    const fullBlob = concatenateArrays(webmHeader, audioData);

    return {
        data: encoding.b64encode(fullBlob),
        filename: `mock-audio-${durationSeconds}s.webm`,
        mimeType: 'audio/webm;codecs=opus',
        size: fullBlob.length,
        duration: durationSeconds
    };
}

/**
 * Generate random bytes to simulate audio data
 */
function generateRandomBytes(size) {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
}

/**
 * Create a minimal WebM header
 * This is a simplified mock - real WebM headers use EBML format
 */
function createWebMHeader(duration) {
    // WebM magic number and minimal header
    const header = new Uint8Array([
        0x1A, 0x45, 0xDF, 0xA3, // EBML Header
        0x01, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x1F,
        0x42, 0x86, // DocType
        0x81, 0x01,
        0x42, 0xF7, // DocTypeVersion
        0x81, 0x04,
        0x42, 0xF2, // DocTypeReadVersion
        0x81, 0x02
    ]);

    return header;
}

/**
 * Concatenate two Uint8Arrays
 */
function concatenateArrays(a, b) {
    const result = new Uint8Array(a.length + b.length);
    result.set(a, 0);
    result.set(b, a.length);
    return result;
}

/**
 * Generate audio based on persona behavior
 * 
 * @param {Object} behavior - Persona speaking behavior from persona-behavior.js
 * @returns {Object} - Mock audio file
 */
export function generatePersonaAudio(behavior) {
    // Silent warriors have lower quality recordings (cheap phones)
    // Samarkand scholars have higher quality (better devices)
    let quality = 'medium';

    if (behavior.expectedBand < 5.0) {
        quality = 'low';
    } else if (behavior.expectedBand > 7.0) {
        quality = 'high';
    }

    return generateMockAudio(behavior.duration, quality);
}

/**
 * Create a multipart form data payload for k6
 * 
 * @param {Object} audioFile - Mock audio file from generateMockAudio()
 * @param {string} userId - User ID
 * @param {string} username - Username
 * @returns {Object} - Form data ready for k6 http.post()
 */
export function createAudioFormData(audioFile, userId, username) {
    // Note: In k6, we'll need to use http.file() to create the actual FormData
    // This function returns the necessary parameters
    return {
        audio: http.file(audioFile.data, audioFile.filename, audioFile.mimeType),
        user_id: userId,
        username: username
    };
}
