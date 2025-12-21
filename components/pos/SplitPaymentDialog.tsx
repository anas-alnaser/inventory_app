"use client"

import { useState, useMemo } from "react"
import {
    Banknote,
    CreditCard,
    QrCode,
    Plus,
    Trash2,
    Check,
    Split,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/services/tax"
import {
    type PaymentMethodType,
    type SplitPaymentItem,
    createPaymentItem,
    calculateRemaining,
    isSplitPaymentComplete,
    getPaymentSummary,
} from "@/lib/services/split-payment"

interface SplitPaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    grandTotal: number
    onComplete: (payments: SplitPaymentItem[]) => void
}

const paymentMethods: {
    method: PaymentMethodType
    label: string
    icon: React.ReactNode
    color: string
}[] = [
        {
            method: "Cash",
            label: "Cash",
            icon: <Banknote className="h-5 w-5" />,
            color: "from-emerald-500 to-green-500",
        },
        {
            method: "Visa",
            label: "Card",
            icon: <CreditCard className="h-5 w-5" />,
            color: "from-blue-500 to-indigo-500",
        },
        {
            method: "CliQ",
            label: "CliQ",
            icon: <QrCode className="h-5 w-5" />,
            color: "from-purple-500 to-pink-500",
        },
    ]

export function SplitPaymentDialog({
    open,
    onOpenChange,
    grandTotal,
    onComplete,
}: SplitPaymentDialogProps) {
    const [payments, setPayments] = useState<SplitPaymentItem[]>([])
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("Cash")
    const [amount, setAmount] = useState("")

    const remaining = useMemo(
        () => calculateRemaining(grandTotal, payments),
        [grandTotal, payments]
    )

    const isComplete = useMemo(
        () => isSplitPaymentComplete(grandTotal, payments),
        [grandTotal, payments]
    )

    const handleAddPayment = () => {
        const paymentAmount = parseFloat(amount)
        if (isNaN(paymentAmount) || paymentAmount <= 0) return

        // Don't allow paying more than remaining
        const finalAmount = Math.min(paymentAmount, remaining)

        setPayments((prev) => [
            ...prev,
            createPaymentItem(selectedMethod, finalAmount),
        ])
        setAmount("")
    }

    const handleRemovePayment = (id: string) => {
        setPayments((prev) => prev.filter((p) => p.id !== id))
    }

    const handlePayRemaining = () => {
        if (remaining > 0) {
            setPayments((prev) => [
                ...prev,
                createPaymentItem(selectedMethod, remaining),
            ])
        }
    }

    const handleComplete = () => {
        if (isComplete) {
            onComplete(payments)
            handleClose()
        }
    }

    const handleClose = () => {
        setPayments([])
        setAmount("")
        setSelectedMethod("Cash")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                            <Split className="h-5 w-5 text-white" />
                        </div>
                        Split Payment
                    </DialogTitle>
                    <DialogDescription>
                        Total: <strong>{formatCurrency(grandTotal)} JOD</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Payment Method Selection */}
                    <div className="grid grid-cols-3 gap-2">
                        {paymentMethods.map((pm) => (
                            <Button
                                key={pm.method}
                                variant={selectedMethod === pm.method ? "default" : "outline"}
                                onClick={() => setSelectedMethod(pm.method)}
                                className={cn(
                                    "flex flex-col h-auto py-3 gap-1",
                                    selectedMethod === pm.method &&
                                    `bg-gradient-to-r ${pm.color} text-white border-0`
                                )}
                            >
                                {pm.icon}
                                <span className="text-xs">{pm.label}</span>
                            </Button>
                        ))}
                    </div>

                    {/* Amount Input */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                type="number"
                                placeholder="Enter amount..."
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddPayment()}
                                className="text-lg"
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <Button onClick={handleAddPayment} disabled={!amount || remaining <= 0}>
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handlePayRemaining}
                            disabled={remaining <= 0}
                        >
                            Remaining
                        </Button>
                    </div>

                    {/* Remaining Badge */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Remaining</span>
                        <Badge
                            variant={remaining > 0 ? "destructive" : "default"}
                            className={remaining <= 0 ? "bg-emerald-500" : ""}
                        >
                            {formatCurrency(remaining)} JOD
                        </Badge>
                    </div>

                    {/* Payment List */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        <AnimatePresence>
                            {payments.map((payment, idx) => {
                                const pm = paymentMethods.find((m) => m.method === payment.method)
                                return (
                                    <motion.div
                                        key={payment.id}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="flex items-center justify-between p-3 bg-card border rounded-lg"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r text-white",
                                                    pm?.color
                                                )}
                                            >
                                                {pm?.icon}
                                            </div>
                                            <span className="font-medium">{pm?.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">
                                                {formatCurrency(payment.amount)} JOD
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => handleRemovePayment(payment.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>

                        {payments.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground py-4">
                                No payments added yet
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleComplete}
                        disabled={!isComplete}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Complete Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
