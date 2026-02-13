/**
 * End of Day (EOD) Report Service
 * Generates daily summary reports for POS
 */

import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { startOfDay, endOfDay, format } from "date-fns"
import type { Invoice, PaymentMethod } from "@/types/entities"

export interface EODReport {
    id?: string
    date: Date
    branchId: string
    generatedBy: string
    generatedByName: string
    generatedAt: Date | Timestamp

    // Sales Summary
    totalTransactions: number
    totalSales: number
    totalTax: number
    totalServiceCharge: number

    // Payment Breakdown
    cashTotal: number
    cardTotal: number
    cliqTotal: number

    // Voids
    voidedTransactions: number
    voidedAmount: number

    // Shift Summary
    shiftsOpened: number
    shiftsClosed: number
    totalCashVariance: number

    // Top Items
    topSellingItems: Array<{
        name: string
        quantity: number
        revenue: number
    }>

    // Hourly Breakdown
    hourlyBreakdown: Array<{
        hour: number
        transactions: number
        revenue: number
    }>
}

/**
 * Generate EOD report for a specific date
 */
export async function generateEODReport(params: {
    date: Date
    branchId: string
    generatedBy: string
    generatedByName: string
}): Promise<{ success: boolean; report?: EODReport; error?: string }> {
    try {
        const { date, branchId, generatedBy, generatedByName } = params
        const dayStart = startOfDay(date)
        const dayEnd = endOfDay(date)

        // Fetch invoices for the day
        const invoicesRef = collection(db, "invoices")
        const q = query(
            invoicesRef,
            where("branch_id", "==", branchId)
        )

        const snapshot = await getDocs(q)
        const allInvoices = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                created_at: data.created_at?.toDate?.() || new Date(data.created_at),
            } as Invoice
        })

        // Filter to just today's invoices
        const invoices = allInvoices.filter((inv) => {
            const invDate = new Date(inv.created_at)
            return invDate >= dayStart && invDate <= dayEnd
        })

        // Separate completed and voided
        const completed = invoices.filter((inv) => inv.status !== "voided")
        const voided = invoices.filter((inv) => inv.status === "voided")

        // Calculate totals
        const totalSales = completed.reduce((sum, inv) => sum + inv.grandTotal, 0)
        const totalTax = completed.reduce((sum, inv) => sum + inv.taxAmount, 0)
        const totalServiceCharge = completed.reduce(
            (sum, inv) => sum + (inv.serviceChargeAmount || 0),
            0
        )

        // Payment breakdown
        const cashTotal = completed
            .filter((inv) => inv.paymentMethod === "Cash")
            .reduce((sum, inv) => sum + inv.grandTotal, 0)
        const cardTotal = completed
            .filter((inv) => inv.paymentMethod === "Visa")
            .reduce((sum, inv) => sum + inv.grandTotal, 0)
        const cliqTotal = completed
            .filter((inv) => inv.paymentMethod === "CliQ")
            .reduce((sum, inv) => sum + inv.grandTotal, 0)

        // Top selling items
        const itemCounts: Record<string, { name: string; quantity: number; revenue: number }> = {}
        completed.forEach((inv) => {
            inv.items.forEach((item) => {
                if (!itemCounts[item.menu_item_id]) {
                    itemCounts[item.menu_item_id] = {
                        name: item.menu_item_name,
                        quantity: 0,
                        revenue: 0,
                    }
                }
                itemCounts[item.menu_item_id].quantity += item.quantity
                itemCounts[item.menu_item_id].revenue += item.line_total
            })
        })
        const topSellingItems = Object.values(itemCounts)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10)

        // Hourly breakdown
        const hourlyData: Record<number, { transactions: number; revenue: number }> = {}
        for (let h = 0; h < 24; h++) {
            hourlyData[h] = { transactions: 0, revenue: 0 }
        }
        completed.forEach((inv) => {
            const hour = new Date(inv.created_at).getHours()
            hourlyData[hour].transactions++
            hourlyData[hour].revenue += inv.grandTotal
        })
        const hourlyBreakdown = Object.entries(hourlyData).map(([hour, data]) => ({
            hour: parseInt(hour),
            ...data,
        }))

        // Fetch shifts for the day (query all and filter by date due to branchId possibly missing on old shifts)
        const shiftsRef = collection(db, "shifts")
        // Try to query by branchId first, fallback to getting all and filtering
        let shifts: { id: string; status?: string; variance?: number; startTime: Date; endTime: Date | null }[] = []

        try {
            // First try with branchId
            const shiftsQuery = query(
                shiftsRef,
                where("branchId", "==", branchId)
            )
            const shiftsSnapshot = await getDocs(shiftsQuery)

            if (!shiftsSnapshot.empty) {
                shifts = shiftsSnapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        status: data.status as string | undefined,
                        variance: data.variance as number | undefined,
                        startTime: data.startTime?.toDate?.() || new Date(data.startTime),
                        endTime: data.endTime?.toDate?.() || (data.endTime ? new Date(data.endTime) : null),
                    }
                }).filter((shift) => {
                    const shiftDate = new Date(shift.startTime)
                    return shiftDate >= dayStart && shiftDate <= dayEnd
                })
            } else {
                // Fallback: get all shifts and filter by date (for old shifts without branchId)
                console.log('[EOD] No shifts found with branchId, falling back to date-based filter')
                const allShiftsQuery = query(shiftsRef)
                const allShiftsSnapshot = await getDocs(allShiftsQuery)

                shifts = allShiftsSnapshot.docs.map((doc) => {
                    const data = doc.data()
                    return {
                        id: doc.id,
                        status: data.status as string | undefined,
                        variance: data.variance as number | undefined,
                        startTime: data.startTime?.toDate?.() || new Date(data.startTime),
                        endTime: data.endTime?.toDate?.() || (data.endTime ? new Date(data.endTime) : null),
                    }
                }).filter((shift) => {
                    const shiftDate = new Date(shift.startTime)
                    return shiftDate >= dayStart && shiftDate <= dayEnd
                })
            }
        } catch (error) {
            console.error('[EOD] Error fetching shifts:', error)
        }

        const shiftsOpened = shifts.length
        const shiftsClosed = shifts.filter((s) => s.status === "closed").length
        const totalCashVariance = shifts
            .filter((s) => s.status === "closed" && s.variance !== undefined)
            .reduce((sum, s) => sum + (s.variance || 0), 0)

        // Build report
        const report: EODReport = {
            date: dayStart,
            branchId,
            generatedBy,
            generatedByName,
            generatedAt: new Date(),
            totalTransactions: completed.length,
            totalSales,
            totalTax,
            totalServiceCharge,
            cashTotal,
            cardTotal,
            cliqTotal,
            voidedTransactions: voided.length,
            voidedAmount: voided.reduce((sum, inv) => sum + inv.grandTotal, 0),
            shiftsOpened,
            shiftsClosed,
            totalCashVariance,
            topSellingItems,
            hourlyBreakdown,
        }

        // Save report to Firestore
        const reportDoc = await addDoc(collection(db, "eod_reports"), {
            ...report,
            date: Timestamp.fromDate(dayStart),
            generatedAt: Timestamp.now(),
        })

        return {
            success: true,
            report: { ...report, id: reportDoc.id },
        }
    } catch (error: any) {
        console.error("Error generating EOD report:", error)
        return { success: false, error: error.message || "Failed to generate report" }
    }
}

/**
 * Format EOD report for printing/viewing
 */
export function formatEODReportText(report: EODReport, businessName: string): string {
    const divider = "=".repeat(40)
    const lines: string[] = [
        divider,
        businessName.toUpperCase(),
        "END OF DAY REPORT",
        divider,
        `Date: ${format(new Date(report.date), "EEEE, MMMM d, yyyy")}`,
        `Generated: ${format(new Date(report.generatedAt as Date), "PPp")}`,
        `By: ${report.generatedByName}`,
        divider,
        "",
        "SALES SUMMARY",
        "-".repeat(40),
        `Transactions:    ${report.totalTransactions}`,
        `Total Sales:     ${report.totalSales.toFixed(2)} JOD`,
        `Tax Collected:   ${report.totalTax.toFixed(2)} JOD`,
        `Service Charge:  ${report.totalServiceCharge.toFixed(2)} JOD`,
        "",
        "PAYMENT BREAKDOWN",
        "-".repeat(40),
        `Cash:            ${report.cashTotal.toFixed(2)} JOD`,
        `Card:            ${report.cardTotal.toFixed(2)} JOD`,
        `CliQ:            ${report.cliqTotal.toFixed(2)} JOD`,
        "",
        "VOIDS",
        "-".repeat(40),
        `Voided Count:    ${report.voidedTransactions}`,
        `Voided Amount:   ${report.voidedAmount.toFixed(2)} JOD`,
        "",
        "SHIFT SUMMARY",
        "-".repeat(40),
        `Shifts Opened:   ${report.shiftsOpened}`,
        `Shifts Closed:   ${report.shiftsClosed}`,
        `Cash Variance:   ${report.totalCashVariance >= 0 ? "+" : ""}${report.totalCashVariance.toFixed(2)} JOD`,
        "",
        "TOP SELLING ITEMS",
        "-".repeat(40),
    ]

    report.topSellingItems.slice(0, 5).forEach((item, idx) => {
        lines.push(`${idx + 1}. ${item.name} (${item.quantity} sold) - ${item.revenue.toFixed(2)} JOD`)
    })

    lines.push("")
    lines.push(divider)
    lines.push("*** END OF REPORT ***")
    lines.push(divider)

    return lines.join("\n")
}

/**
 * Export EOD report as CSV
 */
export function exportEODReportCSV(report: EODReport): string {
    const headers = [
        "Metric",
        "Value",
    ]

    const rows = [
        ["Date", format(new Date(report.date), "yyyy-MM-dd")],
        ["Total Transactions", report.totalTransactions.toString()],
        ["Total Sales (JOD)", report.totalSales.toFixed(2)],
        ["Tax Collected (JOD)", report.totalTax.toFixed(2)],
        ["Service Charge (JOD)", report.totalServiceCharge.toFixed(2)],
        ["Cash Total (JOD)", report.cashTotal.toFixed(2)],
        ["Card Total (JOD)", report.cardTotal.toFixed(2)],
        ["CliQ Total (JOD)", report.cliqTotal.toFixed(2)],
        ["Voided Transactions", report.voidedTransactions.toString()],
        ["Voided Amount (JOD)", report.voidedAmount.toFixed(2)],
        ["Shifts Opened", report.shiftsOpened.toString()],
        ["Shifts Closed", report.shiftsClosed.toString()],
        ["Cash Variance (JOD)", report.totalCashVariance.toFixed(2)],
    ]

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
}
