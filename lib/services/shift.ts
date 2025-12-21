/**
 * Shift Management Service
 * Handles opening, closing, and managing cashier shifts
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
    limit,
    Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Shift, Invoice } from "@/types/entities"

// Collection reference
const shiftsCollection = collection(db, "shifts")

/**
 * Open a new shift for a staff member
 */
export async function openShift(params: {
    staffId: string
    startingCash: number
    branchId: string
}): Promise<{ success: boolean; shift?: Shift; error?: string }> {
    try {
        // Check if staff already has an open shift
        const existingShift = await getActiveShift(params.staffId)
        if (existingShift) {
            return { success: false, error: "Staff already has an open shift" }
        }

        const now = Timestamp.now()
        const shiftData = {
            staffId: params.staffId,
            branchId: params.branchId,
            startTime: now,
            endTime: null,
            startingCash: params.startingCash,
            expectedCash: params.startingCash, // Will be updated as cash sales come in
            actualCash: null,
            variance: null,
            status: "open" as const,
            created_at: now,
        }

        const docRef = await addDoc(shiftsCollection, shiftData)

        const shift: Shift = {
            id: docRef.id,
            ...shiftData,
            startTime: now.toDate(),
            created_at: now.toDate(),
        }

        return { success: true, shift }
    } catch (error: any) {
        console.error("Error opening shift:", error)
        return { success: false, error: error.message || "Failed to open shift" }
    }
}

/**
 * Close an active shift
 */
export async function closeShift(params: {
    shiftId: string
    actualCash: number
}): Promise<{ success: boolean; shift?: Shift; error?: string }> {
    try {
        const shiftRef = doc(db, "shifts", params.shiftId)
        const shiftSnap = await getDoc(shiftRef)

        if (!shiftSnap.exists()) {
            return { success: false, error: "Shift not found" }
        }

        const shiftData = shiftSnap.data()
        if (shiftData.status === "closed") {
            return { success: false, error: "Shift is already closed" }
        }

        const now = Timestamp.now()
        const expectedCash = shiftData.expectedCash || shiftData.startingCash
        const variance = params.actualCash - expectedCash

        await updateDoc(shiftRef, {
            endTime: now,
            actualCash: params.actualCash,
            variance: variance,
            status: "closed",
        })

        const closedShift: Shift = {
            id: params.shiftId,
            staffId: shiftData.staffId,
            startTime: shiftData.startTime.toDate(),
            endTime: now.toDate(),
            startingCash: shiftData.startingCash,
            expectedCash: expectedCash,
            actualCash: params.actualCash,
            variance: variance,
            status: "closed",
            created_at: shiftData.created_at.toDate(),
        }

        return { success: true, shift: closedShift }
    } catch (error: any) {
        console.error("Error closing shift:", error)
        return { success: false, error: error.message || "Failed to close shift" }
    }
}

/**
 * Get active (open) shift for a staff member
 */
export async function getActiveShift(staffId: string): Promise<Shift | null> {
    try {
        const q = query(
            shiftsCollection,
            where("staffId", "==", staffId),
            where("status", "==", "open"),
            limit(1)
        )

        const snapshot = await getDocs(q)
        if (snapshot.empty) {
            return null
        }

        const doc = snapshot.docs[0]
        const data = doc.data()

        return {
            id: doc.id,
            staffId: data.staffId,
            startTime: data.startTime?.toDate(),
            endTime: data.endTime?.toDate() || null,
            startingCash: data.startingCash,
            expectedCash: data.expectedCash,
            actualCash: data.actualCash,
            variance: data.variance,
            status: data.status,
            created_at: data.created_at?.toDate(),
        }
    } catch (error) {
        console.error("Error getting active shift:", error)
        return null
    }
}

/**
 * Get shift history for a staff member
 */
export async function getShiftHistory(
    staffId: string,
    limitCount: number = 10
): Promise<Shift[]> {
    try {
        const q = query(
            shiftsCollection,
            where("staffId", "==", staffId),
            orderBy("startTime", "desc"),
            limit(limitCount)
        )

        const snapshot = await getDocs(q)
        return snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                id: doc.id,
                staffId: data.staffId,
                startTime: data.startTime?.toDate(),
                endTime: data.endTime?.toDate() || null,
                startingCash: data.startingCash,
                expectedCash: data.expectedCash,
                actualCash: data.actualCash,
                variance: data.variance,
                status: data.status,
                created_at: data.created_at?.toDate(),
            }
        })
    } catch (error) {
        console.error("Error getting shift history:", error)
        return []
    }
}

/**
 * Get all shifts for a branch (for managers)
 */
export async function getBranchShifts(
    branchId: string,
    options?: {
        status?: "open" | "closed"
        startDate?: Date
        endDate?: Date
        limit?: number
    }
): Promise<Shift[]> {
    try {
        let q = query(
            shiftsCollection,
            where("branchId", "==", branchId),
            orderBy("startTime", "desc")
        )

        if (options?.limit) {
            q = query(q, limit(options.limit))
        }

        const snapshot = await getDocs(q)
        let shifts = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                id: doc.id,
                staffId: data.staffId,
                startTime: data.startTime?.toDate(),
                endTime: data.endTime?.toDate() || null,
                startingCash: data.startingCash,
                expectedCash: data.expectedCash,
                actualCash: data.actualCash,
                variance: data.variance,
                status: data.status,
                created_at: data.created_at?.toDate(),
            } as Shift
        })

        // Apply filters in memory (Firestore doesn't support multiple inequality filters)
        if (options?.status) {
            shifts = shifts.filter((s) => s.status === options.status)
        }
        if (options?.startDate) {
            shifts = shifts.filter((s) => s.startTime >= options.startDate!)
        }
        if (options?.endDate) {
            shifts = shifts.filter((s) => s.startTime <= options.endDate!)
        }

        return shifts
    } catch (error) {
        console.error("Error getting branch shifts:", error)
        return []
    }
}

/**
 * Update expected cash when a cash sale is made
 */
export async function updateShiftExpectedCash(
    shiftId: string,
    cashAmount: number
): Promise<boolean> {
    try {
        const shiftRef = doc(db, "shifts", shiftId)
        const shiftSnap = await getDoc(shiftRef)

        if (!shiftSnap.exists()) {
            return false
        }

        const currentExpected = shiftSnap.data().expectedCash || 0
        await updateDoc(shiftRef, {
            expectedCash: currentExpected + cashAmount,
        })

        return true
    } catch (error) {
        console.error("Error updating shift expected cash:", error)
        return false
    }
}

/**
 * Get shift sales summary
 */
export async function getShiftSalesSummary(shiftId: string): Promise<{
    totalSales: number
    cashSales: number
    cardSales: number
    cliqSales: number
    transactionCount: number
    invoices: Invoice[]
}> {
    try {
        // Get the shift first
        const shiftRef = doc(db, "shifts", shiftId)
        const shiftSnap = await getDoc(shiftRef)

        if (!shiftSnap.exists()) {
            return {
                totalSales: 0,
                cashSales: 0,
                cardSales: 0,
                cliqSales: 0,
                transactionCount: 0,
                invoices: [],
            }
        }

        const shiftData = shiftSnap.data()
        const startTime = shiftData.startTime
        const endTime = shiftData.endTime || Timestamp.now()

        // Query invoices during this shift
        const invoicesRef = collection(db, "invoices")
        const q = query(
            invoicesRef,
            where("cashier_id", "==", shiftData.staffId),
            where("created_at", ">=", startTime),
            where("created_at", "<=", endTime),
            orderBy("created_at", "desc")
        )

        const snapshot = await getDocs(q)
        const invoices: Invoice[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Invoice[]

        // Calculate totals
        let cashSales = 0
        let cardSales = 0
        let cliqSales = 0

        invoices.forEach((inv) => {
            switch (inv.paymentMethod) {
                case "Cash":
                    cashSales += inv.grandTotal
                    break
                case "Visa":
                    cardSales += inv.grandTotal
                    break
                case "CliQ":
                    cliqSales += inv.grandTotal
                    break
            }
        })

        return {
            totalSales: cashSales + cardSales + cliqSales,
            cashSales,
            cardSales,
            cliqSales,
            transactionCount: invoices.length,
            invoices,
        }
    } catch (error) {
        console.error("Error getting shift sales summary:", error)
        return {
            totalSales: 0,
            cashSales: 0,
            cardSales: 0,
            cliqSales: 0,
            transactionCount: 0,
            invoices: [],
        }
    }
}
