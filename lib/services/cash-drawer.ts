/**
 * Cash Drawer Service
 * Handles cash drawer operations and logging
 */

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { startOfDay, endOfDay } from "date-fns"

export type DrawerOpenReason =
    | "sale"
    | "refund"
    | "no_sale"
    | "paid_out"
    | "paid_in"
    | "float"
    | "pickup"

export interface DrawerEvent {
    id?: string
    type: "open" | "close"
    reason: DrawerOpenReason
    amount?: number
    notes?: string
    staffId: string
    staffName: string
    shiftId?: string
    branchId: string
    invoiceNumber?: string
    createdAt: Date | Timestamp
}

/**
 * Log a cash drawer open event
 */
export async function logDrawerOpen(params: {
    reason: DrawerOpenReason
    amount?: number
    notes?: string
    staffId: string
    staffName: string
    shiftId?: string
    branchId: string
    invoiceNumber?: string
}): Promise<{ success: boolean; error?: string }> {
    try {
        await addDoc(collection(db, "drawer_events"), {
            type: "open",
            reason: params.reason,
            amount: params.amount || null,
            notes: params.notes || null,
            staffId: params.staffId,
            staffName: params.staffName,
            shiftId: params.shiftId || null,
            branchId: params.branchId,
            invoiceNumber: params.invoiceNumber || null,
            createdAt: Timestamp.now(),
        })

        return { success: true }
    } catch (error: any) {
        console.error("Error logging drawer open:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Get drawer events for today
 */
export async function getTodayDrawerEvents(
    branchId: string,
    shiftId?: string
): Promise<DrawerEvent[]> {
    try {
        const today = new Date()
        const eventsRef = collection(db, "drawer_events")

        let q = query(
            eventsRef,
            where("branchId", "==", branchId)
        )

        const snapshot = await getDocs(q)
        const events = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
            } as DrawerEvent
        })

        // Filter to today and optionally by shift
        const dayStart = startOfDay(today)
        const dayEnd = endOfDay(today)

        return events
            .filter((event) => {
                const eventDate = new Date(event.createdAt as Date)
                const isToday = eventDate >= dayStart && eventDate <= dayEnd
                if (!shiftId) return isToday
                return isToday && event.shiftId === shiftId
            })
            .sort((a, b) =>
                new Date(b.createdAt as Date).getTime() - new Date(a.createdAt as Date).getTime()
            )
    } catch (error) {
        console.error("Error fetching drawer events:", error)
        return []
    }
}

/**
 * Calculate drawer balance for a shift
 */
export async function calculateDrawerBalance(
    branchId: string,
    shiftId: string,
    openingCash: number
): Promise<{
    openingCash: number
    cashSales: number
    paidOut: number
    paidIn: number
    expectedCash: number
}> {
    try {
        const events = await getTodayDrawerEvents(branchId, shiftId)

        let paidOut = 0
        let paidIn = 0

        events.forEach((event) => {
            if (event.reason === "paid_out" && event.amount) {
                paidOut += event.amount
            }
            if (event.reason === "paid_in" && event.amount) {
                paidIn += event.amount
            }
        })

        // We'd need to get cash sales from invoices for the shift
        // For now, return 0 for cash sales (will be calculated separately)
        const cashSales = 0

        const expectedCash = openingCash + cashSales + paidIn - paidOut

        return {
            openingCash,
            cashSales,
            paidOut,
            paidIn,
            expectedCash,
        }
    } catch (error) {
        console.error("Error calculating drawer balance:", error)
        return {
            openingCash,
            cashSales: 0,
            paidOut: 0,
            paidIn: 0,
            expectedCash: openingCash,
        }
    }
}

/**
 * Get reason label for display
 */
export function getReasonLabel(reason: DrawerOpenReason): string {
    const labels: Record<DrawerOpenReason, string> = {
        sale: "Cash Sale",
        refund: "Cash Refund",
        no_sale: "No Sale (Manual Open)",
        paid_out: "Paid Out",
        paid_in: "Paid In",
        float: "Float",
        pickup: "Cash Pickup",
    }
    return labels[reason] || reason
}
