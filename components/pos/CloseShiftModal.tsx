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
} from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
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
import { closeShift, calculateShiftTotals, type ShiftTotals } from "@/lib/services/shifts"
import { updateAttendanceClockOut } from "@/lib/services/attendance"
import { formatCurrency } from "@/lib/services/tax"
import { useStaff } from "@/lib/contexts/StaffContext"
import { cn } from "@/lib/utils"
import type { Shift } from "@/types/entities"

interface CloseShiftModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shift: Shift
    staffName: string
    attendanceId?: string | null
    onShiftClosed?: () => void
}

/**
 * CloseShiftModal for POS
 * 
 * Shows shift summary and asks for counted cash.
 * Uses userId-based closeShift which atomically:
 * 1. Calculates expected cash
 * 2. Updates shift with variance
 * 3. Sets user's active_shift_id to null
 */
export function CloseShiftModal({
    open,
    onOpenChange,
    shift,
    staffName,
    attendanceId,
    onShiftClosed,
}: CloseShiftModalProps) {
    const router = useRouter()
    const { activeStaff, clearActiveStaff } = useStaff()
    const [actualCash, setActualCash] = useState<string>("")
    const [error, setError] = useState<string | null>(null)
    const [isClosing, setIsClosing] = useState(false)
    const [shiftTotals, setShiftTotals] = useState<ShiftTotals | null>(null)

    // Fetch shift totals using the new calculator engine
    useEffect(() => {
        if (open && shift?.id) {
            calculateShiftTotals(shift.id).then((result) => {
                if (result.success && result.totals) {
                    setShiftTotals(result.totals)
                }
            })
        }
    }, [open, shift?.id])

    // Use calculated expected cash from the calculator engine
    const expectedCash = shiftTotals?.expectedCash || (shift?.startingCash || 0)
    const actualCashNumber = parseFloat(actualCash) || 0
    const variance = actualCashNumber - expectedCash

    // Calculate shift duration
    const shiftDuration = () => {
        if (!shift?.startTime) return "0h 0m"
        const start = new Date(shift.startTime)
        const now = new Date()
        const diff = now.getTime() - start.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        return `${hours}h ${minutes}m`
    }

    const handleCloseShift = async () => {
        if (!activeStaff) {
            setError("No active staff member")
            return
        }

        if (!actualCash || actualCashNumber < 0) {
            setError("Please enter a valid cash amount")
            return
        }

        console.log('[CloseShiftModal] Starting shift close:', {
            userId: activeStaff.id,
            actualCash: actualCashNumber,
            shiftId: shift?.id,
        });

        setError(null)
        setIsClosing(true)

        try {
            // Use userId-based closeShift (atomically handles everything)
            console.log('[CloseShiftModal] Calling closeShift service...');
            const result = await closeShift(activeStaff.id, actualCashNumber)

            if (!result.success) {
                console.error('[CloseShiftModal] Close shift failed:', result.error);
                setError(result.error || "Failed to close shift")
                setIsClosing(false)
                return
            }

            console.log('[CloseShiftModal] Shift closed successfully:', result.shift);

            // Update attendance if available
            if (attendanceId) {
                await updateAttendanceClockOut(attendanceId)
            }

            // Callback
            onShiftClosed?.()
            onOpenChange(false)

            // Clear staff and redirect to lock screen
            clearActiveStaff()
            router.replace("/lock-screen")
        } catch (err: any) {
            console.error('[CloseShiftModal] Exception during shift close:', err);
            setError(err.message || "Failed to close shift")
            setIsClosing(false)
        }
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
                                {shift?.startTime && new Date(shift.startTime).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Transactions</span>
                            <span className="font-semibold">{shiftTotals?.transactionCount || 0}</span>
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
                                    {formatCurrency(shiftTotals?.cashSales || 0)}
                                </p>
                            </div>
                            <div className="bg-muted/50 rounded-xl p-3 text-center">
                                <CreditCard className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                                <p className="text-xs text-muted-foreground">Card</p>
                                <p className="font-bold text-foreground">
                                    {formatCurrency(shiftTotals?.cardSales || 0)}
                                </p>
                            </div>
                            <div className="bg-muted/50 rounded-xl p-3 text-center">
                                <QrCode className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                                <p className="text-xs text-muted-foreground">CliQ</p>
                                <p className="font-bold text-foreground">
                                    {formatCurrency(shiftTotals?.cliqSales || 0)}
                                </p>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-xl p-4 text-center border border-cyan-500/20">
                            <p className="text-sm text-muted-foreground">Total Sales</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                                {formatCurrency(shiftTotals?.totalSales || 0)} JOD
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
                                <span>{formatCurrency(shift?.startingCash || 0)} JOD</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">+ Cash Sales</span>
                                <span>{formatCurrency(shiftTotals?.cashSales || 0)} JOD</span>
                            </div>
                            {(shiftTotals?.payIns || 0) > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">+ Pay-Ins</span>
                                    <span className="text-emerald-500">+{formatCurrency(shiftTotals?.payIns || 0)} JOD</span>
                                </div>
                            )}
                            {(shiftTotals?.payOuts || 0) > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">- Pay-Outs</span>
                                    <span className="text-red-500">-{formatCurrency(shiftTotals?.payOuts || 0)} JOD</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex items-center justify-between font-semibold">
                                <span>Expected Cash</span>
                                <span className="text-lg">{formatCurrency(expectedCash)} JOD</span>
                            </div>
                        </div>

                        {/* Actual Cash Input */}
                        <div className="space-y-2">
                            <Label htmlFor="actualCash">Counted Cash in Drawer</Label>
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
                                    disabled={isClosing}
                                    autoFocus
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
                        disabled={isClosing}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCloseShift}
                        disabled={isClosing || !actualCash}
                        className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                    >
                        {isClosing ? (
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
