/**
 * Currency Conversion Utilities
 * Converts between USD and UZS (Uzbekistan Som)
 */

// Exchange rate: 1 USD ≈ 12,500 UZS (approximate as of 2024)
// This should ideally be fetched from an API in production
const USD_TO_UZS_RATE = 12500;

export interface Price {
    usd: number;
    uzs: number;
}

/**
 * Convert USD to UZS
 */
export function usdToUzs(usdAmount: number): number {
    return Math.round(usdAmount * USD_TO_UZS_RATE);
}

/**
 * Convert UZS to USD
 */
export function uzsToUsd(uzsAmount: number): number {
    return Math.round((uzsAmount / USD_TO_UZS_RATE) * 100) / 100;
}

/**
 * Get price in both currencies
 */
export function getPrice(usdAmount: number): Price {
    return {
        usd: usdAmount,
        uzs: usdToUzs(usdAmount)
    };
}

/**
 * Format price for display based on current language
 */
export function formatPrice(price: Price, currency: 'usd' | 'uzs', locale?: string): string {
    if (currency === 'uzs') {
        // Format UZS with thousand separators
        return new Intl.NumberFormat(locale || 'uz-UZ', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price.uzs);
    } else {
        // Format USD with 2 decimal places
        return new Intl.NumberFormat(locale || 'en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price.usd);
    }
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: 'usd' | 'uzs'): string {
    return currency === 'uzs' ? "so'm" : '$';
}

/**
 * Get preferred currency based on user's language
 */
export function getPreferredCurrency(languageCode: string): 'usd' | 'uzs' {
    // Show UZS for Uzbek speakers, USD for everyone else
    return languageCode === 'uz' ? 'uzs' : 'usd';
}

/**
 * Format full price string with currency symbol
 */
export function formatPriceWithCurrency(
    price: Price,
    currency: 'usd' | 'uzs',
    locale?: string
): string {
    const amount = formatPrice(price, currency, locale);
    const symbol = getCurrencySymbol(currency);

    if (currency === 'uzs') {
        return `${amount} ${symbol}`;
    } else {
        return `${symbol}${amount}`;
    }
}
