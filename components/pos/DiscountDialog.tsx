"use client"

import { useState } from "react"
import {
    Percent,
    DollarSign,
    Tag,
    AlertTriangle,
    Check,
    X,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/services/tax"
import {
    QUICK_DISCOUNTS,
    applyDiscount,
    applyPromoCode,
    requiresNotification,
    type DiscountType,
    type DiscountResult,
} from "@/lib/services/discount"

interface DiscountDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    subtotal: number
    branchId: string
    restaurantId: string
    onApplyDiscount: (
        type: DiscountType,
        value: number,
        discountAmount: number
    ) => void
}

export function DiscountDialog({
    open,
    onOpenChange,
    subtotal,
    branchId,
    restaurantId,
    onApplyDiscount,
}: DiscountDialogProps) {
    const [discountType, setDiscountType] = useState<DiscountType>("percentage")
    const [customValue, setCustomValue] = useState("")
    const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
    const [promoCode, setPromoCode] = useState("")
    const [promoLoading, setPromoLoading] = useState(false)
    const [promoResult, setPromoResult] = useState<DiscountResult | null>(null)

    // Calculate preview
    const getPreviewDiscount = (): { amount: number; percentage: number } => {
        if (selectedPreset !== null) {
            const preset = QUICK_DISCOUNTS[selectedPreset]
            const result = applyDiscount(subtotal, preset.type, preset.value)
            return { amount: result.discountAmount, percentage: result.discountPercentage }
        }

        if (customValue) {
            const value = parseFloat(customValue)
            if (!isNaN(value)) {
                const result = applyDiscount(subtotal, discountType, value)
                return { amount: result.discountAmount, percentage: result.discountPercentage }
            }
        }

        return { amount: 0, percentage: 0 }
    }

    const preview = getPreviewDiscount()
    const showWarning = requiresNotification(preview.percentage)

    const handlePresetClick = (index: number) => {
        setSelectedPreset(index)
        setCustomValue("")
        if (QUICK_DISCOUNTS[index].label === "Custom") {
            setSelectedPreset(null)
        }
    }

    const handleCustomChange = (value: string) => {
        setCustomValue(value)
        setSelectedPreset(null)
    }

    const handleApplyPromoCode = async () => {
        if (!promoCode.trim()) return

        setPromoLoading(true)
        const result = await applyPromoCode(promoCode, subtotal, branchId, restaurantId)
        setPromoResult(result)
        setPromoLoading(false)

        if (result.success) {
            // Auto-apply successful promo
            setTimeout(() => {
                onApplyDiscount(result.type, result.value, result.discountAmount)
                handleClose()
            }, 1000)
        }
    }

    const handleApply = () => {
        if (preview.amount > 0) {
            const type = selectedPreset !== null ? QUICK_DISCOUNTS[selectedPreset].type : discountType
            const value = selectedPreset !== null
                ? QUICK_DISCOUNTS[selectedPreset].value
                : parseFloat(customValue)

            onApplyDiscount(type, value, preview.amount)
            handleClose()
        }
    }

    const handleClose = () => {
        setSelectedPreset(null)
        setCustomValue("")
        setPromoCode("")
        setPromoResult(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                            <Percent className="h-5 w-5 text-white" />
                        </div>
                        Apply Discount
                    </DialogTitle>
                    <DialogDescription>
                        Order subtotal: <strong>{formatCurrency(subtotal)} JOD</strong>
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="quick" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="quick">Quick</TabsTrigger>
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                        <TabsTrigger value="promo">Promo Code</TabsTrigger>
                    </TabsList>

                    {/* Quick Discounts */}
                    <TabsContent value="quick" className="space-y-4 mt-4">
                        <div className="grid grid-cols-3 gap-2">
                            {QUICK_DISCOUNTS.filter(d => d.label !== "Custom").map((preset, idx) => (
                                <motion.button
                                    key={preset.label}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handlePresetClick(idx)}
                                    className={cn(
                                        "py-3 px-4 rounded-xl border-2 text-center transition-all",
                                        selectedPreset === idx
                                            ? "border-cyan-500 bg-cyan-500/10 text-cyan-500"
                                            : "border-border hover:border-muted-foreground/50"
                                    )}
                                >
                                    <span className="text-lg font-bold">{preset.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Custom Discount */}
                    <TabsContent value="custom" className="space-y-4 mt-4">
                        <div className="flex gap-2">
                            <Button
                                variant={discountType === "percentage" ? "default" : "outline"}
                                onClick={() => setDiscountType("percentage")}
                                className="flex-1"
                            >
                                <Percent className="h-4 w-4 mr-2" />
                                Percentage
                            </Button>
                            <Button
                                variant={discountType === "fixed" ? "default" : "outline"}
                                onClick={() => setDiscountType("fixed")}
                                className="flex-1"
                            >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Fixed Amount
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                {discountType === "percentage" ? "Discount %" : "Amount (JOD)"}
                            </Label>
                            <Input
                                type="number"
                                placeholder={discountType === "percentage" ? "Enter percentage..." : "Enter amount..."}
                                value={customValue}
                                onChange={(e) => handleCustomChange(e.target.value)}
                                min="0"
                                max={discountType === "percentage" ? "100" : undefined}
                                className="text-lg"
                            />
                        </div>
                    </TabsContent>

                    {/* Promo Code */}
                    <TabsContent value="promo" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Enter Promo Code</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="PROMO2024"
                                    value={promoCode}
                                    onChange={(e) => {
                                        setPromoCode(e.target.value.toUpperCase())
                                        setPromoResult(null)
                                    }}
                                    className="flex-1 uppercase"
                                />
                                <Button
                                    onClick={handleApplyPromoCode}
                                    disabled={promoLoading || !promoCode.trim()}
                                >
                                    {promoLoading ? "..." : "Apply"}
                                </Button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {promoResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={cn(
                                        "p-3 rounded-lg flex items-center gap-2",
                                        promoResult.success
                                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                            : "bg-red-500/10 text-red-500 border border-red-500/20"
                                    )}
                                >
                                    {promoResult.success ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <X className="h-4 w-4" />
                                    )}
                                    <span className="text-sm">{promoResult.message}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </TabsContent>
                </Tabs>

                {/* Discount Preview */}
                {preview.amount > 0 && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Discount Amount</span>
                            <span className="text-lg font-bold text-cyan-500">
                                -{formatCurrency(preview.amount)} JOD
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">New Total</span>
                            <span className="text-lg font-bold">
                                {formatCurrency(subtotal - preview.amount)} JOD
                            </span>
                        </div>

                        {/* Warning for large discounts */}
                        {showWarning && (
                            <div className="flex items-center gap-2 p-2 bg-amber-500/10 rounded-lg text-amber-500 mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-xs">
                                    Discount over 30% - Manager notification will be sent
                                </span>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApply}
                        disabled={preview.amount <= 0}
                        className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                    >
                        Apply Discount
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
