"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { FileText } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { getClosedShifts, getShiftInvoicesDetailed } from "@/lib/services/shifts"
import { getAllUsers } from "@/lib/services/users"
import type { Shift } from "@/types/entities"
import { formatCurrency } from "@/lib/services/tax"
import { ShiftDetailModal } from "@/components/shifts/ShiftDetailModal"
import { cn } from "@/lib/utils"

// Helper to safely convert Firebase Timestamp/Date/String to Date object
function toDate(date: any): Date {
  if (!date) return new Date()
  if (date instanceof Date) return date
  if (date.toDate) return date.toDate() // Firebase Timestamp
  if (date.seconds) return new Date(date.seconds * 1000) // Firestore Timestamp
  return new Date(date)
}

export default function ShiftsReportPage() {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch closed shifts
  const { data: shifts = [], isLoading: isLoadingShifts } = useQuery({
    queryKey: ["closed-shifts"],
    queryFn: () => getClosedShifts(),
  })

  // Fetch users to map staffId to names
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
  })

  // Create user map for quick lookup
  const userMap = useMemo(() => {
    const map = new Map<string, string>()
    users.forEach((user) => {
      map.set(user.id, user.name)
    })
    return map
  }, [users])

  // Fetch invoices for all shifts to calculate total sales
  const invoiceQueries = useQuery({
    queryKey: ["shift-invoices-summary", shifts.map(s => s.id).join(",")],
    queryFn: async () => {
      const results = await Promise.all(
        shifts.map(async (shift) => {
          const invoiceData = await getShiftInvoicesDetailed(
            shift.staffId,
            shift.startTime,
            shift.endTime
          )
          // Calculate total sales (cash + card, excluding returns which are negative)
          const totalSales = invoiceData.allInvoices
            .filter(inv => (inv.grandTotal || 0) > 0)
            .reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
          return {
            shiftId: shift.id,
            totalSales,
          }
        })
      )
      return results
    },
    enabled: shifts.length > 0,
  })

  // Create map of shiftId to totalSales
  const salesMap = useMemo(() => {
    const map = new Map<string, number>()
    invoiceQueries.data?.forEach((item) => {
      map.set(item.shiftId, item.totalSales)
    })
    return map
  }, [invoiceQueries.data])

  // Combine shifts with their total sales
  const shiftsWithSales = useMemo(() => {
    return shifts.map((shift) => {
      const totalSales = salesMap.get(shift.id) || 0
      return {
        ...shift,
        totalSales,
      }
    })
  }, [shifts, salesMap])

  const handleRowClick = (shift: Shift) => {
    setSelectedShift(shift)
    setIsModalOpen(true)
  }

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "N/A"
    try {
      const d = toDate(date)
      return format(d, "MMM dd, yyyy HH:mm")
    } catch {
      return "Invalid Date"
    }
  }

  const isLoading = isLoadingShifts || isLoadingUsers

  if (isLoading) {
    return <ShiftsReportSkeleton />
  }

  if (shifts.length === 0) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-2xl font-bold text-foreground">Z-Report (Shift Report)</h1>
            <p className="text-muted-foreground">
              View and audit all closed cashier shifts
            </p>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No closed shifts found. Shifts will appear here once cashiers close their shifts.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Z-Report (Shift Report)</h1>
          <p className="text-muted-foreground">
            View and audit all closed cashier shifts. Click a row to see detailed breakdown.
          </p>
        </div>
      </motion.div>

      {/* Shifts Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead className="text-right">Total Sales (JOD)</TableHead>
                    <TableHead className="text-right">Cash Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shiftsWithSales.map((shift) => {
                    const staffName = userMap.get(shift.staffId) || "Unknown"
                    const variance = shift.variance || 0
                    const isNegative = variance < 0

                    return (
                      <TableRow
                        key={shift.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(shift)}
                      >
                        <TableCell className="font-medium">{staffName}</TableCell>
                        <TableCell>{formatDateTime(shift.startTime)}</TableCell>
                        <TableCell>{formatDateTime(shift.endTime)}</TableCell>
                        <TableCell className="text-right">
                          {invoiceQueries.isLoading ? (
                            <Skeleton className="h-4 w-16 inline-block" />
                          ) : (
                            formatCurrency(shift.totalSales)
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={isNegative ? "destructive" : "default"}
                            className={cn(
                              !isNegative && "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20 dark:text-green-400"
                            )}
                          >
                            {isNegative ? "-" : variance > 0 ? "+" : ""}
                            {formatCurrency(Math.abs(variance))} JOD
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Shift Detail Modal */}
      <ShiftDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        shift={selectedShift}
      />
    </div>
  )
}

function ShiftsReportSkeleton() {
  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

