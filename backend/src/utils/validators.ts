/**
 * Validate Uzbekistan phone number
 * Format: +998 XX XXX XX XX or 998XXXXXXXXX
 */
export function validatePhone(phone: string): boolean {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Check if it starts with 998 and has correct length (12 digits total)
    return /^998\d{9}$/.test(cleaned);
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
