/**
 * Discount Service
 * Handles discount calculations, promo codes, and notifications
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    query,
    where,
    Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { sendDiscountAlert } from "./notifications"

export type DiscountType = "percentage" | "fixed"

export interface PromoCode {
    id: string
    code: string
    type: DiscountType
    value: number // Percentage (0-100) or fixed amount
    minOrderAmount?: number
    maxDiscount?: number // For percentage discounts
    usageLimit?: number
    usageCount: number
    validFrom: Date | Timestamp
    validTo: Date | Timestamp
    isActive: boolean
    branchId?: string // If null, applies to all branches
    restaurantId: string
    createdAt: Date | Timestamp
}

export interface DiscountResult {
    success: boolean
    type: DiscountType
    value: number
    discountAmount: number
    discountPercentage: number
    message?: string
    promoCode?: PromoCode
}

// Quick discount presets
export const QUICK_DISCOUNTS = [
    { label: "5%", value: 5, type: "percentage" as DiscountType },
    { label: "10%", value: 10, type: "percentage" as DiscountType },
    { label: "15%", value: 15, type: "percentage" as DiscountType },
    { label: "20%", value: 20, type: "percentage" as DiscountType },
    { label: "25%", value: 25, type: "percentage" as DiscountType },
    { label: "Custom", value: 0, type: "percentage" as DiscountType },
]

/**
 * Calculate discount amount from a percentage
 */
export function calculatePercentageDiscount(
    subtotal: number,
    percentage: number
): number {
    if (percentage < 0 || percentage > 100) return 0
    return (subtotal * percentage) / 100
}

/**
 * Calculate discount amount from a fixed amount
 */
export function calculateFixedDiscount(
    subtotal: number,
    amount: number
): number {
    if (amount < 0) return 0
    return Math.min(amount, subtotal) // Can't discount more than subtotal
}

/**
 * Apply discount and return result
 */
export function applyDiscount(
    subtotal: number,
    type: DiscountType,
    value: number
): DiscountResult {
    if (subtotal <= 0) {
        return {
            success: false,
            type,
            value,
            discountAmount: 0,
            discountPercentage: 0,
            message: "Cannot apply discount to empty order",
        }
    }

    let discountAmount: number
    let discountPercentage: number

    if (type === "percentage") {
        discountAmount = calculatePercentageDiscount(subtotal, value)
        discountPercentage = value
    } else {
        discountAmount = calculateFixedDiscount(subtotal, value)
        discountPercentage = (discountAmount / subtotal) * 100
    }

    return {
        success: true,
        type,
        value,
        discountAmount,
        discountPercentage,
        message: type === "percentage"
            ? `${value}% discount applied`
            : `${value.toFixed(2)} JOD discount applied`,
    }
}

/**
 * Validate and apply a promo code
 */
export async function applyPromoCode(
    code: string,
    subtotal: number,
    branchId: string,
    restaurantId: string
): Promise<DiscountResult> {
    try {
        const promoRef = collection(db, "promo_codes")
        const q = query(
            promoRef,
            where("code", "==", code.toUpperCase().trim()),
            where("isActive", "==", true)
        )

        const snapshot = await getDocs(q)

        if (snapshot.empty) {
            return {
                success: false,
                type: "percentage",
                value: 0,
                discountAmount: 0,
                discountPercentage: 0,
                message: "Invalid promo code",
            }
        }

        const promoDoc = snapshot.docs[0]
        const promo = { id: promoDoc.id, ...promoDoc.data() } as PromoCode

        // Check if promo is for this restaurant
        if (promo.restaurantId !== restaurantId) {
            return {
                success: false,
                type: "percentage",
                value: 0,
                discountAmount: 0,
                discountPercentage: 0,
                message: "Promo code not valid for this restaurant",
            }
        }

        // Check branch restriction
        if (promo.branchId && promo.branchId !== branchId) {
            return {
                success: false,
                type: "percentage",
                value: 0,
                discountAmount: 0,
                discountPercentage: 0,
                message: "Promo code not valid for this location",
            }
        }

        // Check validity period
        const now = new Date()
        const validFrom = promo.validFrom instanceof Timestamp
            ? promo.validFrom.toDate()
            : new Date(promo.validFrom)
        const validTo = promo.validTo instanceof Timestamp
            ? promo.validTo.toDate()
            : new Date(promo.validTo)

        if (now < validFrom || now > validTo) {
            return {
                success: false,
                type: "percentage",
                value: 0,
                discountAmount: 0,
                discountPercentage: 0,
                message: "Promo code has expired or not yet valid",
            }
        }

        // Check usage limit
        if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
            return {
                success: false,
                type: "percentage",
                value: 0,
                discountAmount: 0,
                discountPercentage: 0,
                message: "Promo code usage limit reached",
            }
        }

        // Check minimum order
        if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
            return {
                success: false,
                type: "percentage",
                value: 0,
                discountAmount: 0,
                discountPercentage: 0,
                message: `Minimum order of ${promo.minOrderAmount} JOD required`,
            }
        }

        // Calculate discount
        let discountAmount: number
        let discountPercentage: number

        if (promo.type === "percentage") {
            discountAmount = calculatePercentageDiscount(subtotal, promo.value)
            // Apply max discount cap if set
            if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
                discountAmount = promo.maxDiscount
            }
            discountPercentage = (discountAmount / subtotal) * 100
        } else {
            discountAmount = calculateFixedDiscount(subtotal, promo.value)
            discountPercentage = (discountAmount / subtotal) * 100
        }

        return {
            success: true,
            type: promo.type,
            value: promo.value,
            discountAmount,
            discountPercentage,
            message: `Promo code "${code}" applied!`,
            promoCode: promo,
        }
    } catch (error: any) {
        console.error("Error applying promo code:", error)
        return {
            success: false,
            type: "percentage",
            value: 0,
            discountAmount: 0,
            discountPercentage: 0,
            message: "Error applying promo code",
        }
    }
}

/**
 * Check if discount requires manager notification (>30%)
 */
export function requiresNotification(discountPercentage: number): boolean {
    return discountPercentage > 30
}

/**
 * Log discount applied and send notifications if needed
 */
export async function logDiscountApplied(params: {
    invoiceNumber: string
    invoiceTotal: number
    discountAmount: number
    discountPercentage: number
    discountType: DiscountType
    appliedBy: string
    appliedByName: string
    branchId: string
    restaurantId: string
    promoCode?: string
}): Promise<void> {
    // Log to discount_logs collection
    await addDoc(collection(db, "discount_logs"), {
        ...params,
        createdAt: Timestamp.now(),
    })

    // Send alert if large discount
    if (requiresNotification(params.discountPercentage)) {
        await sendDiscountAlert({
            discountPercentage: params.discountPercentage,
            discountAmount: params.discountAmount,
            invoiceTotal: params.invoiceTotal,
            invoiceNumber: params.invoiceNumber,
            appliedBy: params.appliedBy,
            appliedByName: params.appliedByName,
            branchId: params.branchId,
            restaurantId: params.restaurantId,
        })
    }
}
