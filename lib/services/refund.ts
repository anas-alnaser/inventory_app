/**
 * Refund Service
 * Handles refunds for completed transactions from previous shifts
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Invoice, InvoiceItem } from "@/types/entities"
import { sendVoidTransactionNotification } from "./notifications"

export interface RefundItem {
    menu_item_id: string
    menu_item_name: string
    quantity: number
    unit_price: number
    refund_amount: number
}

export interface Refund {
    id: string
    originalInvoiceId: string
    originalInvoiceNumber: string
    refundNumber: string
    refundType: "full" | "partial"
    items: RefundItem[]
    subtotal: number
    taxAmount: number
    totalAmount: number
    reason: string
    processedBy: string
    processedByName: string
    branchId: string
    restaurantId: string
    createdAt: Date | Timestamp
}

/**
 * Generate a unique refund number
 */
export function generateRefundNumber(): string {
    const now = new Date()
    const year = now.getFullYear()
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `REF-${year}-${random}`
}

/**
 * Search for an invoice by number
 */
export async function searchInvoice(
    invoiceNumber: string,
    branchId: string
): Promise<Invoice | null> {
    try {
        const invoicesRef = collection(db, "invoices")
        const q = query(
            invoicesRef,
            where("branch_id", "==", branchId),
            where("invoiceNumber", "==", invoiceNumber.trim().toUpperCase())
        )

        const snapshot = await getDocs(q)
        if (snapshot.empty) return null

        const doc = snapshot.docs[0]
        const data = doc.data()
        return {
            id: doc.id,
            ...data,
            created_at: data.created_at?.toDate?.() || data.created_at,
        } as Invoice
    } catch (error) {
        console.error("Error searching invoice:", error)
        return null
    }
}

/**
 * Check if invoice can be refunded
 */
export function canRefundInvoice(invoice: Invoice): {
    canRefund: boolean
    reason?: string
} {
    // Already voided
    if (invoice.status === "voided") {
        return { canRefund: false, reason: "Invoice has already been voided" }
    }

    // Already refunded
    if (invoice.status === "refunded") {
        return { canRefund: false, reason: "Invoice has already been refunded" }
    }

    // Check if too old (e.g., more than 30 days)
    const invoiceDate = new Date(invoice.created_at)
    const daysSinceInvoice = Math.floor(
        (Date.now() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceInvoice > 30) {
        return {
            canRefund: false,
            reason: "Invoice is too old to refund (more than 30 days)"
        }
    }

    return { canRefund: true }
}

/**
 * Calculate refund amounts
 */
export function calculateRefundAmounts(
    items: RefundItem[],
    originalInvoice: Invoice
): { subtotal: number; taxAmount: number; totalAmount: number } {
    const subtotal = items.reduce((sum, item) => sum + item.refund_amount, 0)

    // Calculate proportional tax
    const originalTaxRate = originalInvoice.taxAmount / originalInvoice.subtotal
    const taxAmount = subtotal * originalTaxRate

    return {
        subtotal,
        taxAmount,
        totalAmount: subtotal + taxAmount,
    }
}

/**
 * Process a refund
 */
export async function processRefund(params: {
    originalInvoice: Invoice
    refundItems: RefundItem[]
    reason: string
    processedBy: string
    processedByName: string
    branchId: string
    restaurantId: string
}): Promise<{ success: boolean; refund?: Refund; error?: string }> {
    try {
        const { originalInvoice, refundItems, reason, processedBy, processedByName, branchId, restaurantId } = params

        // Validate
        const canRefund = canRefundInvoice(originalInvoice)
        if (!canRefund.canRefund) {
            return { success: false, error: canRefund.reason }
        }

        if (refundItems.length === 0) {
            return { success: false, error: "No items selected for refund" }
        }

        // Calculate amounts
        const amounts = calculateRefundAmounts(refundItems, originalInvoice)

        // Determine refund type
        const isFullRefund = Math.abs(amounts.subtotal - originalInvoice.subtotal) < 0.01

        // Create refund record
        const refundData: Omit<Refund, "id"> = {
            originalInvoiceId: originalInvoice.id,
            originalInvoiceNumber: originalInvoice.invoiceNumber,
            refundNumber: generateRefundNumber(),
            refundType: isFullRefund ? "full" : "partial",
            items: refundItems,
            subtotal: amounts.subtotal,
            taxAmount: amounts.taxAmount,
            totalAmount: amounts.totalAmount,
            reason,
            processedBy,
            processedByName,
            branchId,
            restaurantId,
            createdAt: Timestamp.now(),
        }

        const refundRef = await addDoc(collection(db, "refunds"), refundData)

        // Update original invoice status
        await updateDoc(doc(db, "invoices", originalInvoice.id), {
            status: isFullRefund ? "refunded" : "partial_refund",
            refundId: refundRef.id,
            refundedAt: Timestamp.now(),
            refundedBy: processedBy,
        })

        // Send notification
        await sendVoidTransactionNotification({
            invoiceNumber: `${originalInvoice.invoiceNumber} (Refund)`,
            invoiceTotal: amounts.totalAmount,
            voidedBy: processedBy,
            voidedByName: processedByName,
            reason: `Refund: ${reason}`,
            branchId,
            restaurantId,
        })

        return {
            success: true,
            refund: { id: refundRef.id, ...refundData },
        }
    } catch (error: any) {
        console.error("Error processing refund:", error)
        return { success: false, error: error.message || "Failed to process refund" }
    }
}

/**
 * Get refund history for a branch
 */
export async function getRefundHistory(
    branchId: string,
    limit: number = 50
): Promise<Refund[]> {
    try {
        const refundsRef = collection(db, "refunds")
        const q = query(
            refundsRef,
            where("branchId", "==", branchId),
            orderBy("createdAt", "desc")
        )

        const snapshot = await getDocs(q)
        return snapshot.docs.slice(0, limit).map((doc) => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
            } as Refund
        })
    } catch (error) {
        console.error("Error fetching refund history:", error)
        return []
    }
}
