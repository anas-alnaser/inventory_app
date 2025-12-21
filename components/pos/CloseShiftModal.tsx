"use client"

import { useState, useEffect } from "react"
import {
    Calculator,
    Clock,
    AlertCircle,
    Banknote,
    CreditCard,
    QrCode,
    CheckCircle2,
    TrendingUp,
    TrendingDown,
    Minus
} from "lucide-react"
import { motion } from "framer-motion"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { closeShift, getShiftSalesSummary } from "@/lib/services/shift"
import { formatCurrency } from "@/lib/services/tax"
import { cn } from "@/lib/utils"
import type { Shift } from "@/types/entities"

interface CloseShiftModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shift: Shift
    staffName: string
    onShiftClosed: () => void
}

export function CloseShiftModal({
    open,
    onOpenChange,
    shift,
    staffName,
    onShiftClosed,
}: CloseShiftModalProps) {
    const [actualCash, setActualCash] = useState<string>("")
    const [error, setError] = useState<string | null>(null)

    // Fetch shift sales summary
    const { data: salesSummary, isLoading: summaryLoading } = useQuery({
        queryKey: ["shift-summary", shift.id],
        queryFn: () => getShiftSalesSummary(shift.id),
        enabled: open && !!shift.id,
    })

    // Calculate expected cash (starting cash + cash sales)
    const expectedCash = (shift.startingCash || 0) + (salesSummary?.cashSales || 0)
    const actualCashNumber = parseFloat(actualCash) || 0
    const variance = actualCashNumber - expectedCash

    // Calculate shift duration
    const shiftDuration = () => {
        const start = new Date(shift.startTime)
        const now = new Date()
        const diff = now.getTime() - start.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        return `${hours}h ${minutes}m`
    }

    const closeShiftMutation = useMutation({
        mutationFn: async () => {
            return closeShift({
                shiftId: shift.id,
                actualCash: actualCashNumber,
            })
        },
        onSuccess: (result) => {
            if (result.success) {
                onShiftClosed()
                onOpenChange(false)
            } else {
                setError(result.error || "Failed to close shift")
            }
        },
        onError: (err: any) => {
            setError(err.message || "Failed to close shift")
        },
    })

    const handleCloseShift = () => {
        if (!actualCash || actualCashNumber < 0) {
            setError("Please enter a valid cash amount")
            return
        }
        setError(null)
        closeShiftMutation.mutate()
    }

    // Variance status
    const getVarianceStatus = () => {
        if (variance === 0) return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Perfect" }
        if (variance > 0) return { icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", label: "Over" }
        return { icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10", label: "Short" }
    }

    const varianceStatus = getVarianceStatus()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-white" />
                        </div>
                        <span>Close Your Shift</span>
                    </DialogTitle>
                    <DialogDescription>
                        End of shift for <span className="font-semibold text-foreground">{staffName}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Shift Summary Card */}
                    <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Shift Duration</span>
                            <span className="font-semibold">{shiftDuration()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Start Time</span>
                            <span className="font-medium">
                                {new Date(shift.startTime).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Transactions</span>
                            <span className="font-semibold">{salesSummary?.transactionCount || 0}</span>
                        </div>
                    </div>

                    {/* Sales Breakdown */}
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Sales Breakdown</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-muted/50 rounded-xl p-3 text-center">
                                <Banknote className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
                                <p className="text-xs text-muted-foreground">Cash</p>
                                <p className="font-bold text-foreground">
                                    {formatCurrency(salesSummary?.cashSales || 0)}
                                </p>
                            </div>
                            <div className="bg-muted/50 rounded-xl p-3 text-center">
                                <CreditCard className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                                <p className="text-xs text-muted-foreground">Card</p>
                                <p className="font-bold text-foreground">
                                    {formatCurrency(salesSummary?.cardSales || 0)}
                                </p>
                            </div>
                            <div className="bg-muted/50 rounded-xl p-3 text-center">
                                <QrCode className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                                <p className="text-xs text-muted-foreground">CliQ</p>
                                <p className="font-bold text-foreground">
                                    {formatCurrency(salesSummary?.cliqSales || 0)}
                                </p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-xl p-4 text-center border border-cyan-500/20">
                            <p className="text-sm text-muted-foreground">Total Sales</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                                {formatCurrency(salesSummary?.totalSales || 0)} JOD
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Cash Counting Section */}
                    <div className="space-y-4">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Cash Counting
                        </h4>

                        {/* Expected Cash */}
                        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Starting Cash</span>
                                <span>{formatCurrency(shift.startingCash)} JOD</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">+ Cash Sales</span>
                                <span>{formatCurrency(salesSummary?.cashSales || 0)} JOD</span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between font-semibold">
                                <span>Expected Cash</span>
                                <span className="text-lg">{formatCurrency(expectedCash)} JOD</span>
                            </div>
                        </div>

                        {/* Actual Cash Input */}
                        <div className="space-y-2">
                            <Label htmlFor="actualCash">Actual Cash in Drawer</Label>
                            <div className="relative">
                                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="actualCash"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={actualCash}
                                    onChange={(e) => setActualCash(e.target.value)}
                                    className="pl-10 text-lg h-12 font-semibold"
                                    placeholder="Count your cash..."
                                />
                            </div>
                        </div>

                        {/* Variance Display */}
                        {actualCash && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "rounded-xl p-4 flex items-center justify-between",
                                    varianceStatus.bg
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <varianceStatus.icon className={cn("h-5 w-5", varianceStatus.color)} />
                                    <span className="font-medium">Variance</span>
                                </div>
                                <div className="text-right">
                                    <p className={cn("text-lg font-bold", varianceStatus.color)}>
                                        {variance >= 0 ? "+" : ""}{formatCurrency(variance)} JOD
                                    </p>
                                    <p className="text-xs text-muted-foreground">{varianceStatus.label}</p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCloseShift}
                        disabled={closeShiftMutation.isPending || !actualCash}
                        className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    >
                        {closeShiftMutation.isPending ? (
                            <div className="flex items-center gap-2">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                                Closing Shift...
                            </div>
                        ) : (
                            "Close Shift"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
