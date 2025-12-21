/**
 * Split Payment Service
 * Handles multiple payment methods for a single order
 */

import { Timestamp } from "firebase/firestore"

export type PaymentMethodType = "Cash" | "Visa" | "CliQ"

export interface SplitPaymentItem {
    id: string
    method: PaymentMethodType
    amount: number
    reference?: string // For card transactions
}

export interface SplitPaymentResult {
    payments: SplitPaymentItem[]
    totalPaid: number
    remaining: number
    isComplete: boolean
}

/**
 * Calculate remaining amount after split payments
 */
export function calculateRemaining(
    grandTotal: number,
    payments: SplitPaymentItem[]
): number {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    return Math.max(0, grandTotal - totalPaid)
}

/**
 * Check if split payment is complete
 */
export function isSplitPaymentComplete(
    grandTotal: number,
    payments: SplitPaymentItem[]
): boolean {
    const remaining = calculateRemaining(grandTotal, payments)
    return remaining < 0.01 // Allow for floating point issues
}

/**
 * Generate a unique payment ID
 */
export function generatePaymentId(): string {
    return `pay-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
}

/**
 * Create a new split payment item
 */
export function createPaymentItem(
    method: PaymentMethodType,
    amount: number,
    reference?: string
): SplitPaymentItem {
    return {
        id: generatePaymentId(),
        method,
        amount,
        reference,
    }
}

/**
 * Get summary of payments by method
 */
export function getPaymentSummary(
    payments: SplitPaymentItem[]
): Record<PaymentMethodType, number> {
    return payments.reduce(
        (acc, payment) => {
            acc[payment.method] = (acc[payment.method] || 0) + payment.amount
            return acc
        },
        { Cash: 0, Visa: 0, CliQ: 0 } as Record<PaymentMethodType, number>
    )
}

/**
 * Format split payment for invoice storage
 */
export function formatSplitPaymentForInvoice(
    payments: SplitPaymentItem[]
): {
    isSplitPayment: boolean
    payments: Array<{
        method: PaymentMethodType
        amount: number
        reference?: string
    }>
    primaryPaymentMethod: PaymentMethodType
} {
    // Primary method is the one with highest amount
    const summary = getPaymentSummary(payments)
    const primaryMethod = (Object.entries(summary) as [PaymentMethodType, number][])
        .filter(([_, amount]) => amount > 0)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "Cash"

    return {
        isSplitPayment: payments.length > 1,
        payments: payments.map((p) => ({
            method: p.method,
            amount: p.amount,
            reference: p.reference,
        })),
        primaryPaymentMethod: primaryMethod,
    }
}
