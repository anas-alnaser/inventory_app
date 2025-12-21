"use client"

import { useState } from "react"
import { DollarSign, Clock, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { useMutation } from "@tanstack/react-query"
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
import { openShift } from "@/lib/services/shift"
import { formatCurrency } from "@/lib/services/tax"
import type { Shift } from "@/types/entities"

interface OpenShiftModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    staffId: string
    staffName: string
    branchId: string
    onShiftOpened: (shift: Shift) => void
}

// Quick cash buttons
const quickCashAmounts = [0, 50, 100, 150, 200, 250]

export function OpenShiftModal({
    open,
    onOpenChange,
    staffId,
    staffName,
    branchId,
    onShiftOpened,
}: OpenShiftModalProps) {
    const [startingCash, setStartingCash] = useState<string>("100")
    const [error, setError] = useState<string | null>(null)

    const openShiftMutation = useMutation({
        mutationFn: async () => {
            const cashAmount = parseFloat(startingCash) || 0
            return openShift({
                staffId,
                startingCash: cashAmount,
                branchId,
            })
        },
        onSuccess: (result) => {
            if (result.success && result.shift) {
                onShiftOpened(result.shift)
                onOpenChange(false)
            } else {
                setError(result.error || "Failed to open shift")
            }
        },
        onError: (err: any) => {
            setError(err.message || "Failed to open shift")
        },
    })

    const handleQuickCash = (amount: number) => {
        setStartingCash(amount.toString())
    }

    const handleOpenShift = () => {
        setError(null)
        openShiftMutation.mutate()
    }

    const currentTime = new Date()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-white" />
                        </div>
                        <span>Start Your Shift</span>
                    </DialogTitle>
                    <DialogDescription>
                        Welcome, <span className="font-semibold text-foreground">{staffName}</span>!
                        Enter your starting cash to begin.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Current Time Display */}
                    <div className="bg-muted/50 rounded-xl p-4 text-center">
                        <p className="text-sm text-muted-foreground">Shift Start Time</p>
                        <p className="text-2xl font-bold text-foreground">
                            {currentTime.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                            })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {currentTime.toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                            })}
                        </p>
                    </div>

                    {/* Starting Cash Input */}
                    <div className="space-y-3">
                        <Label htmlFor="startingCash">Starting Cash (JOD)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="startingCash"
                                type="number"
                                step="0.01"
                                min="0"
                                value={startingCash}
                                onChange={(e) => setStartingCash(e.target.value)}
                                className="pl-10 text-lg h-12 font-semibold"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Quick Cash Buttons */}
                    <div className="space-y-2">
                        <Label>Quick Select</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {quickCashAmounts.map((amount) => (
                                <motion.button
                                    key={amount}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleQuickCash(amount)}
                                    className={`
                    p-3 rounded-xl border text-center font-medium transition-all
                    ${startingCash === amount.toString()
                                            ? "border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                                            : "border-border hover:border-cyan-500/50"
                                        }
                  `}
                                >
                                    {formatCurrency(amount)} JOD
                                </motion.button>
                            ))}
                        </div>
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
                        onClick={handleOpenShift}
                        disabled={openShiftMutation.isPending}
                        className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                    >
                        {openShiftMutation.isPending ? (
                            <div className="flex items-center gap-2">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                />
                                Opening Shift...
                            </div>
                        ) : (
                            <>Start Shift with {formatCurrency(parseFloat(startingCash) || 0)} JOD</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
