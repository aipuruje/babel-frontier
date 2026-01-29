/**
 * Payment Integration for Uzbekistan Market
 * Supports: Telegram Stars, Click.uz, Payme
 */

import { getTelegramWebApp } from '@/utils/telegram';

export type PaymentProvider = 'telegram-stars' | 'click' | 'payme' | 'stripe';
export type PricingTier = 'free' | 'premium' | 'lifetime';

export interface PaymentAmount {
    usd: number;
    uzs: number;
    stars?: number; // Telegram Stars (1 Star ≈ $0.02)
}

export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    provider: PaymentProvider;
    tier: PricingTier;
    error?: string;
}

// Telegram Stars pricing (1 Star ≈ $0.02 USD)
const PRICING_STARS = {
    premium: 100,   // $2 USD
    lifetime: 500,  // $10 USD
};

// UZS pricing (1 USD ≈ 12,500 som)
const PRICING_UZS = {
    premium: 50000,   // ~$4 USD (affordable for students)
    lifetime: 200000, // ~$16 USD
};

/**
 * Purchase with Telegram Stars (recommended for Uzbekistan)
 */
export async function purchaseWithTelegramStars(
    tier: 'premium' | 'lifetime'
): Promise<PaymentResult> {
    try {
        const telegram = getTelegramWebApp();

        if (!telegram) {
            throw new Error('Telegram WebApp not available');
        }

        const stars = PRICING_STARS[tier];
        const title = tier === 'premium'
            ? 'IELTS Mastery Premium (Monthly)'
            : 'IELTS Mastery Lifetime Access';

        const description = tier === 'premium'
            ? 'Unlock all 9 modules + unlimited practice'
            : 'One-time payment • Lifetime access • All future modules';

        // Telegram Stars invoice
        const invoiceLink = createTelegramInvoice({
            title,
            description,
            currency: 'XTR', // Telegram Stars
            prices: [{ label: title, amount: stars }],
            payload: JSON.stringify({ tier, provider: 'telegram-stars' }),
        });

        // Open invoice in Telegram using the openInvoice API
        return new Promise((resolve) => {
            if (telegram.openInvoice) {
                telegram.openInvoice(invoiceLink, (status: string) => {
                    if (status === 'paid') {
                        // Payment successful - backend will verify and activate subscription
                        resolve({
                            success: true,
                            provider: 'telegram-stars',
                            tier,
                            transactionId: `tg-stars-${Date.now()}`,
                        });
                    } else if (status === 'cancelled') {
                        // User cancelled the payment
                        resolve({
                            success: false,
                            provider: 'telegram-stars',
                            tier,
                            error: 'Payment cancelled by user',
                        });
                    } else if (status === 'failed') {
                        // Payment failed
                        resolve({
                            success: false,
                            provider: 'telegram-stars',
                            tier,
                            error: 'Payment failed',
                        });
                    } else {
                        // Unknown status
                        resolve({
                            success: false,
                            provider: 'telegram-stars',
                            tier,
                            error: `Unknown payment status: ${status}`,
                        });
                    }
                });
            } else {
                // Fallback: openInvoice not available, open in browser
                window.open(invoiceLink, '_blank');
                resolve({
                    success: true,
                    provider: 'telegram-stars',
                    tier,
                });
            }
        });
    } catch (error) {
        console.error('Telegram Stars payment error:', error);
        return {
            success: false,
            provider: 'telegram-stars',
            tier,
            error: error instanceof Error ? error.message : 'Payment failed',
        };
    }
}

/**
 * Create Telegram invoice link
 */
function createTelegramInvoice(params: {
    title: string;
    description: string;
    currency: string;
    prices: Array<{ label: string; amount: number }>;
    payload: string;
}): string {
    // Format invoice URL for Telegram Bot API
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;

    if (!botToken) {
        throw new Error('Telegram bot token not configured');
    }

    const invoiceParams = new URLSearchParams({
        title: params.title,
        description: params.description,
        payload: params.payload,
        currency: params.currency,
        prices: JSON.stringify(params.prices),
    });

    return `https://t.me/$/${botToken}?start=invoice_${invoiceParams.toString()}`;
}

/**
 * Purchase with Click.uz (Uzbekistan local payment gateway)
 */
export async function purchaseWithClick(
    tier: 'premium' | 'lifetime'
): Promise<PaymentResult> {
    try {
        const amount = PRICING_UZS[tier];
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

        // Create payment order via backend
        const response = await fetch(`${apiBaseUrl}/api/payments/click/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tier,
                amount,
                currency: 'UZS',
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create Click.uz payment');
        }

        const data = await response.json();

        // Redirect to Click.uz payment page
        window.location.href = data.paymentUrl;

        return {
            success: true,
            provider: 'click',
            tier,
            transactionId: data.transactionId,
        };
    } catch (error) {
        console.error('Click.uz payment error:', error);
        return {
            success: false,
            provider: 'click',
            tier,
            error: error instanceof Error ? error.message : 'Payment failed',
        };
    }
}

/**
 * Purchase with Payme (Uzbekistan local payment gateway)
 */
export async function purchaseWithPayme(
    tier: 'premium' | 'lifetime'
): Promise<PaymentResult> {
    try {
        const amount = PRICING_UZS[tier];
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

        // Create payment order via backend
        const response = await fetch(`${apiBaseUrl}/api/payments/payme/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tier,
                amount,
                currency: 'UZS',
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create Payme payment');
        }

        const data = await response.json();

        // Redirect to Payme checkout
        window.location.href = data.checkoutUrl;

        return {
            success: true,
            provider: 'payme',
            tier,
            transactionId: data.transactionId,
        };
    } catch (error) {
        console.error('Payme payment error:', error);
        return {
            success: false,
            provider: 'payme',
            tier,
            error: error instanceof Error ? error.message : 'Payment failed',
        };
    }
}

/**
 * Get available payment methods based on user's location
 */
export function getAvailablePaymentMethods(languageCode?: string): PaymentProvider[] {
    const methods: PaymentProvider[] = ['telegram-stars'];

    // Add local payment methods for Uzbek speakers
    if (languageCode === 'uz' || languageCode === 'ru') {
        methods.push('click', 'payme');
    }

    // Stripe for international users
    if (languageCode === 'en') {
        methods.push('stripe');
    }

    return methods;
}

/**
 * Get pricing for a tier in preferred currency
 */
export function getPricing(tier: 'premium' | 'lifetime', currency: 'usd' | 'uzs' | 'stars'): number {
    if (currency === 'stars') {
        return PRICING_STARS[tier];
    } else if (currency === 'uzs') {
        return PRICING_UZS[tier];
    } else {
        // USD pricing
        return tier === 'premium' ? 2 : 10;
    }
}
