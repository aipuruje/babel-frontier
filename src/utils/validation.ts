/**
 * Validation utilities for sign-up forms
 */

/**
 * Validates Uzbekistan phone numbers
 * Format: +998 XX XXX XX XX
 * Valid operators: 90, 91, 93, 94, 95, 97, 98, 99, 33, 88
 */
export const validateUzbekPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, '');
    const uzbekPhoneRegex = /^\+998(90|91|93|94|95|97|98|99|33|88)\d{7}$/;
    return uzbekPhoneRegex.test(cleaned);
};

/**
 * Formats Uzbekistan phone number as user types
 * Example: +998901234567 → +998 90 123 45 67
 */
export const formatUzbekPhone = (input: string): string => {
    // Remove all non-digits
    let digits = input.replace(/\D/g, '');

    // Ensure it starts with 998
    if (!digits.startsWith('998')) {
        if (digits.startsWith('998')) {
            // Already correct
        } else if (digits.length > 0) {
            digits = '998' + digits;
        }
    }

    // Remove 998 prefix for formatting
    if (digits.startsWith('998')) {
        const phoneDigits = digits.slice(3);

        if (phoneDigits.length === 0) return '+998 ';
        if (phoneDigits.length <= 2) return `+998 ${phoneDigits}`;
        if (phoneDigits.length <= 5) {
            return `+998 ${phoneDigits.slice(0, 2)} ${phoneDigits.slice(2)}`;
        }
        if (phoneDigits.length <= 7) {
            return `+998 ${phoneDigits.slice(0, 2)} ${phoneDigits.slice(2, 5)} ${phoneDigits.slice(5)}`;
        }
        // Full format
        return `+998 ${phoneDigits.slice(0, 2)} ${phoneDigits.slice(2, 5)} ${phoneDigits.slice(5, 7)} ${phoneDigits.slice(7, 9)}`;
    }

    return '+998 ';
};

/**
 * Validates international phone numbers (E.164 format)
 * Format: +[country code][number]
 * Example: +998901234567, +12125551234
 */
export const validateInternationalPhone = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, '');
    // E.164 format: + followed by 1-15 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(cleaned);
};

/**
 * Validates email addresses (RFC 5322 compliant)
 * More comprehensive than simple regex
 */
export const validateEmail = (email: string): boolean => {
    const trimmed = email.trim();

    // RFC 5322 compliant email regex (simplified but robust)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    // Additional checks
    if (trimmed.length === 0 || trimmed.length > 254) return false;
    if (!emailRegex.test(trimmed)) return false;

    // Check local part length (before @)
    const [localPart] = trimmed.split('@');
    if (localPart.length > 64) return false;

    return true;
};

/**
 * Sanitize input to prevent XSS
 */
export const sanitizeInput = (input: string): string => {
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .slice(0, 500); // Limit length
};

export const getValidationError = (
    type: 'phone' | 'email',
    value: string
): string | null => {
    const trimmed = value.trim();

    if (!trimmed) {
        return type === 'phone' ? 'auth.phoneRequired' : 'auth.emailRequired';
    }

    if (type === 'phone' && !validateUzbekPhone(value)) {
        return 'auth.invalidPhone';
    }

    if (type === 'email' && !validateEmail(value)) {
        return 'auth.invalidEmail';
    }

    return null;
};
