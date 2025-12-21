/**
 * Notification Service
 * Handles sending email notifications for various events
 */

import {
    collection,
    addDoc,
    Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export type NotificationType = "discount_alert" | "shift_variance" | "void_transaction" | "low_stock"

interface NotificationData {
    type: NotificationType
    recipientEmail?: string
    recipientRole?: string
    subject: string
    message: string
    metadata?: Record<string, any>
    branchId: string
    restaurantId: string
}

// Collection reference for notifications (these can be processed by a cloud function to send emails)
const notificationsCollection = collection(db, "notifications")

/**
 * Create a notification record
 * In production, a Cloud Function would listen to this collection and send actual emails
 */
export async function createNotification(
    data: NotificationData
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
        const notificationDoc = {
            ...data,
            status: "pending",
            created_at: Timestamp.now(),
        }

        const docRef = await addDoc(notificationsCollection, notificationDoc)

        return { success: true, notificationId: docRef.id }
    } catch (error: any) {
        console.error("Error creating notification:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Generic notification sender for various event types
 */
export async function sendNotification(params: {
    type: NotificationType
    title: string
    message: string
    data?: Record<string, any>
    branchId: string
    restaurantId: string
    priority?: "low" | "normal" | "high"
    recipients?: string[]
}): Promise<void> {
    await createNotification({
        type: params.type,
        subject: params.title,
        message: params.message,
        metadata: {
            ...params.data,
            priority: params.priority || "normal",
            recipients: params.recipients,
        },
        branchId: params.branchId,
        restaurantId: params.restaurantId,
    })
    console.log(`[Notification] ${params.type} notification sent: ${params.title}`)
}

/**
 * Send discount alert notification
 * Triggered when a discount over 30% is applied
 */
export async function sendDiscountAlert(params: {
    discountPercentage: number
    discountAmount: number
    invoiceTotal: number
    invoiceNumber: string
    appliedBy: string
    appliedByName: string
    branchId: string
    restaurantId: string
}): Promise<void> {
    // Only send alert for discounts over 30%
    if (params.discountPercentage <= 30) {
        return
    }

    await createNotification({
        type: "discount_alert",
        recipientRole: "owner", // Send to owner and managers
        subject: `Large Discount Alert: ${params.discountPercentage}% discount applied`,
        message: `
A large discount of ${params.discountPercentage}% (${params.discountAmount.toFixed(2)} JOD) was applied.

Invoice Details:
- Invoice #: ${params.invoiceNumber}
- Total After Discount: ${params.invoiceTotal.toFixed(2)} JOD
- Applied By: ${params.appliedByName}
- Time: ${new Date().toLocaleString()}

Please review if this discount was authorized.
    `.trim(),
        metadata: {
            discountPercentage: params.discountPercentage,
            discountAmount: params.discountAmount,
            invoiceNumber: params.invoiceNumber,
            appliedBy: params.appliedBy,
        },
        branchId: params.branchId,
        restaurantId: params.restaurantId,
    })

    console.log(`[Notification] Large discount alert sent: ${params.discountPercentage}%`)
}

/**
 * Send shift variance alert
 * Triggered when a shift closes with significant cash variance
 */
export async function sendShiftVarianceAlert(params: {
    variance: number
    expectedCash: number
    actualCash: number
    staffName: string
    staffId: string
    shiftId: string
    branchId: string
    restaurantId: string
}): Promise<void> {
    // Only send alert for variance over 5 JOD
    if (Math.abs(params.variance) <= 5) {
        return
    }

    const isShort = params.variance < 0

    await createNotification({
        type: "shift_variance",
        recipientRole: "manager",
        subject: `Shift Variance Alert: ${isShort ? "Short" : "Over"} ${Math.abs(params.variance).toFixed(2)} JOD`,
        message: `
A shift was closed with a cash ${isShort ? "shortage" : "overage"}.

Details:
- Staff: ${params.staffName}
- Expected Cash: ${params.expectedCash.toFixed(2)} JOD
- Actual Cash: ${params.actualCash.toFixed(2)} JOD
- Variance: ${params.variance >= 0 ? "+" : ""}${params.variance.toFixed(2)} JOD
- Time: ${new Date().toLocaleString()}

Please investigate this discrepancy.
    `.trim(),
        metadata: {
            variance: params.variance,
            expectedCash: params.expectedCash,
            actualCash: params.actualCash,
            staffId: params.staffId,
            shiftId: params.shiftId,
        },
        branchId: params.branchId,
        restaurantId: params.restaurantId,
    })

    console.log(`[Notification] Shift variance alert sent: ${params.variance} JOD`)
}

/**
 * Send void transaction notification
 */
export async function sendVoidTransactionNotification(params: {
    invoiceNumber: string
    invoiceTotal: number
    voidedBy: string
    voidedByName: string
    reason?: string
    branchId: string
    restaurantId: string
}): Promise<void> {
    await createNotification({
        type: "void_transaction",
        recipientRole: "owner",
        subject: `Transaction Voided: Invoice #${params.invoiceNumber}`,
        message: `
A transaction has been voided.

Details:
- Invoice #: ${params.invoiceNumber}
- Amount: ${params.invoiceTotal.toFixed(2)} JOD
- Voided By: ${params.voidedByName}
- Reason: ${params.reason || "Not specified"}
- Time: ${new Date().toLocaleString()}
    `.trim(),
        metadata: {
            invoiceNumber: params.invoiceNumber,
            invoiceTotal: params.invoiceTotal,
            voidedBy: params.voidedBy,
        },
        branchId: params.branchId,
        restaurantId: params.restaurantId,
    })

    console.log(`[Notification] Void transaction notification sent: ${params.invoiceNumber}`)
}
