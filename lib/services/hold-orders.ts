/**
 * Hold Orders Service
 * Manages pending/held orders in the POS system
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { CartItemModifier } from "@/lib/stores/pos-cart"

export interface HoldOrderItem {
    menuItemId: string
    name: string
    price: number
    quantity: number
    taxRate: number
    isTaxExempt: boolean
    modifiers: CartItemModifier[]
    notes?: string
}

export interface HoldOrder {
    id: string
    customerName?: string
    tableNumber?: string
    notes?: string
    items: HoldOrderItem[]
    subtotal: number
    discountType?: "percentage" | "fixed"
    discountValue?: number
    createdBy: string
    createdByName: string
    branchId: string
    expiresAt: Date | Timestamp // Auto-expire after X hours
    createdAt: Date | Timestamp
}

/**
 * Calculate subtotal for held items
 */
function calculateSubtotal(items: HoldOrderItem[]): number {
    return items.reduce((total, item) => {
        const itemTotal = item.price * item.quantity
        const modifiersTotal = item.modifiers.reduce((sum, mod) => sum + mod.price, 0) * item.quantity
        return total + itemTotal + modifiersTotal
    }, 0)
}

/**
 * Hold the current cart
 */
export async function createHoldOrder(params: {
    items: HoldOrderItem[]
    customerName?: string
    tableNumber?: string
    notes?: string
    discountType?: "percentage" | "fixed"
    discountValue?: number
    createdBy: string
    createdByName: string
    branchId: string
    expirationHours?: number // Default 4 hours
}): Promise<{ success: boolean; holdOrderId?: string; error?: string }> {
    try {
        const {
            items,
            customerName,
            tableNumber,
            notes,
            discountType,
            discountValue,
            createdBy,
            createdByName,
            branchId,
            expirationHours = 4,
        } = params

        if (items.length === 0) {
            return { success: false, error: "Cannot hold an empty order" }
        }

        const now = new Date()
        const expiresAt = new Date(now.getTime() + expirationHours * 60 * 60 * 1000)

        // Sanitize items to ensure no undefined values (Firestore doesn't allow undefined)
        const sanitizedItems = items.map(item => ({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            taxRate: item.taxRate ?? 0,
            isTaxExempt: item.isTaxExempt ?? false,
            modifiers: item.modifiers || [],
            notes: item.notes || null,
        }))

        const holdOrderData = {
            customerName: customerName || null,
            tableNumber: tableNumber || null,
            notes: notes || null,
            items: sanitizedItems,
            subtotal: calculateSubtotal(items),
            discountType: discountType || null,
            discountValue: discountValue ?? null,
            createdBy,
            createdByName,
            branchId,
            expiresAt: Timestamp.fromDate(expiresAt),
            createdAt: Timestamp.now(),
        }

        const docRef = await addDoc(collection(db, "hold_orders"), holdOrderData)

        return { success: true, holdOrderId: docRef.id }
    } catch (error: any) {
        console.error("Error creating hold order:", error)
        return { success: false, error: error.message || "Failed to hold order" }
    }
}

/**
 * Get all active hold orders for a branch
 */
export async function getHoldOrders(branchId: string): Promise<HoldOrder[]> {
    try {
        const now = new Date()
        const holdOrdersRef = collection(db, "hold_orders")
        const q = query(
            holdOrdersRef,
            where("branchId", "==", branchId),
            orderBy("createdAt", "desc")
        )

        const snapshot = await getDocs(q)
        const orders = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || data.createdAt,
                expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
            } as HoldOrder
        })

        // Filter out expired orders (but don't delete them here)
        return orders.filter((order) => {
            const expiresDate = order.expiresAt instanceof Date
                ? order.expiresAt
                : new Date(order.expiresAt as any)
            return expiresDate > now
        })
    } catch (error) {
        console.error("Error fetching hold orders:", error)
        return []
    }
}

/**
 * Get a single hold order by ID
 */
export async function getHoldOrderById(orderId: string): Promise<HoldOrder | null> {
    try {
        const docRef = doc(db, "hold_orders", orderId)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) return null

        const data = docSnap.data()
        return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt,
            expiresAt: data.expiresAt?.toDate?.() || data.expiresAt,
        } as HoldOrder
    } catch (error) {
        console.error("Error fetching hold order:", error)
        return null
    }
}

/**
 * Delete (recall/complete) a hold order
 */
export async function deleteHoldOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await deleteDoc(doc(db, "hold_orders", orderId))
        return { success: true }
    } catch (error: any) {
        console.error("Error deleting hold order:", error)
        return { success: false, error: error.message || "Failed to delete hold order" }
    }
}

/**
 * Get hold order count for a branch (for badge display)
 */
export async function getHoldOrderCount(branchId: string): Promise<number> {
    try {
        const orders = await getHoldOrders(branchId)
        return orders.length
    } catch (error) {
        console.error("Error getting hold order count:", error)
        return 0
    }
}

/**
 * Clean up expired hold orders
 */
export async function cleanupExpiredHoldOrders(branchId: string): Promise<number> {
    try {
        const now = new Date()
        const holdOrdersRef = collection(db, "hold_orders")
        const q = query(
            holdOrdersRef,
            where("branchId", "==", branchId)
        )

        const snapshot = await getDocs(q)
        let deletedCount = 0

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data()
            const expiresAt = data.expiresAt?.toDate?.() || new Date(data.expiresAt)

            if (expiresAt < now) {
                await deleteDoc(doc(db, "hold_orders", docSnap.id))
                deletedCount++
            }
        }

        return deletedCount
    } catch (error) {
        console.error("Error cleaning up hold orders:", error)
        return 0
    }
}
