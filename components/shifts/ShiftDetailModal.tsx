"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { getShiftInvoicesDetailed } from "@/lib/services/shifts"
import type { Shift } from "@/types/entities"
import { formatCurrency } from "@/lib/services/tax"
import { Loader2 } from "lucide-react"

interface ShiftDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shift: Shift | null
}

export function ShiftDetailModal({
  open,
  onOpenChange,
  shift,
}: ShiftDetailModalProps) {
  // Fetch invoices for this shift
  const { data: invoiceData, isLoading } = useQuery({
    queryKey: ["shift-invoices-detailed", shift?.id],
    queryFn: async () => {
      if (!shift) return null
      return getShiftInvoicesDetailed(
        shift.staffId,
        shift.startTime,
        shift.endTime
      )
    },
    enabled: open && !!shift,
  })

  if (!shift) return null

  // Calculate totals
  const cashSales = invoiceData?.cashInvoices.reduce(
    (sum, inv) => sum + (inv.grandTotal || 0),
    0
  ) || 0

  const cardSales = invoiceData?.cardInvoices.reduce(
    (sum, inv) => sum + (inv.grandTotal || 0),
    0
  ) || 0

  const returns = Math.abs(
    invoiceData?.returnInvoices.reduce(
      (sum, inv) => sum + (inv.grandTotal || 0),
      0
    ) || 0
  )

  const expectedCash = shift.startingCash + cashSales - returns
  const actualCash = shift.actualCash || 0
  const variance = shift.variance || 0

  const formatDate = (date: Date | string | null) => {
    if (!date) return "N/A"
    try {
      const d = date instanceof Date ? date : new Date(date)
      return format(d, "MMM dd, yyyy HH:mm")
    } catch {
      return "Invalid Date"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Shift Report Details</DialogTitle>
          <DialogDescription>
            Detailed breakdown of shift transactions and cash reconciliation
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Shift Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Shift Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start Time:</span>
                    <p className="font-medium">{formatDate(shift.startTime)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Time:</span>
                    <p className="font-medium">{formatDate(shift.endTime)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial Breakdown */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Financial Breakdown</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Starting Cash:</span>
                    <span className="font-medium">
                      {formatCurrency(shift.startingCash)} JOD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cash Sales:</span>
                    <span className="font-medium">
                      +{formatCurrency(cashSales)} JOD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Card Sales:</span>
                    <span className="font-medium text-muted-foreground">
                      {formatCurrency(cardSales)} JOD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Returns:</span>
                    <span className="font-medium text-destructive">
                      -{formatCurrency(returns)} JOD
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Expected Cash:</span>
                    <span>{formatCurrency(expectedCash)} JOD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actual Cash:</span>
                    <span className="font-medium">
                      {formatCurrency(actualCash)} JOD
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">Variance:</span>
                    <span
                      className={`font-bold ${
                        variance < 0
                          ? "text-destructive"
                          : variance === 0
                          ? "text-green-600"
                          : "text-green-600"
                      }`}
                    >
                      {variance < 0 ? "-" : variance > 0 ? "+" : ""}
                      {formatCurrency(Math.abs(variance))} JOD
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Transaction Summary */}
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Transaction Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cash Invoices:</span>
                    <p className="font-medium">
                      {invoiceData?.cashInvoices.length || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Card Invoices:</span>
                    <p className="font-medium">
                      {invoiceData?.cardInvoices.length || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Returns:</span>
                    <p className="font-medium">
                      {invoiceData?.returnInvoices.length || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Sales:</span>
                    <p className="font-medium">
                      {formatCurrency(cashSales + cardSales)} JOD
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  )
}

