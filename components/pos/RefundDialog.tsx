"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
    Search,
    Receipt,
    AlertCircle,
    Check,
    RefreshCw,
    X,
    Minus,
    Plus,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
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
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/services/tax"
import {
    searchInvoice,
    canRefundInvoice,
    processRefund,
    calculateRefundAmounts,
    type RefundItem,
} from "@/lib/services/refund"
import type { Invoice } from "@/types/entities"

interface RefundDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    branchId: string
    restaurantId: string
    processedBy: string
    processedByName: string
    onRefundComplete?: () => void
}

export function RefundDialog({
    open,
    onOpenChange,
    branchId,
    restaurantId,
    processedBy,
    processedByName,
    onRefundComplete,
}: RefundDialogProps) {
    const [step, setStep] = useState<"search" | "select" | "confirm">("search")
    const [searchQuery, setSearchQuery] = useState("")
    const [foundInvoice, setFoundInvoice] = useState<Invoice | null>(null)
    const [selectedItems, setSelectedItems] = useState<RefundItem[]>([])
    const [reason, setReason] = useState("")
    const [searchError, setSearchError] = useState("")
    const [searching, setSearching] = useState(false)

    // Calculate totals
    const amounts = foundInvoice
        ? calculateRefundAmounts(selectedItems, foundInvoice)
        : { subtotal: 0, taxAmount: 0, totalAmount: 0 }

    const handleSearch = async () => {
        if (!searchQuery.trim()) return

        setSearching(true)
        setSearchError("")
        setFoundInvoice(null)

        const invoice = await searchInvoice(searchQuery, branchId)
        setSearching(false)

        if (!invoice) {
            setSearchError("Invoice not found")
            return
        }

        const canRefund = canRefundInvoice(invoice)
        if (!canRefund.canRefund) {
            setSearchError(canRefund.reason || "Cannot refund this invoice")
            return
        }

        setFoundInvoice(invoice)
        // Pre-select all items
        setSelectedItems(
            invoice.items.map((item) => ({
                menu_item_id: item.menu_item_id,
                menu_item_name: item.menu_item_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                refund_amount: item.line_total,
            }))
        )
        setStep("select")
    }

    const toggleItemSelection = (itemId: string) => {
        const item = foundInvoice?.items.find((i) => i.menu_item_id === itemId)
        if (!item) return

        const existingIndex = selectedItems.findIndex(
            (i) => i.menu_item_id === itemId
        )

        if (existingIndex >= 0) {
            setSelectedItems((prev) => prev.filter((i) => i.menu_item_id !== itemId))
        } else {
            setSelectedItems((prev) => [
                ...prev,
                {
                    menu_item_id: item.menu_item_id,
                    menu_item_name: item.menu_item_name,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    refund_amount: item.line_total,
                },
            ])
        }
    }

    const updateItemQuantity = (itemId: string, newQuantity: number) => {
        const originalItem = foundInvoice?.items.find(
            (i) => i.menu_item_id === itemId
        )
        if (!originalItem) return

        if (newQuantity <= 0) {
            setSelectedItems((prev) => prev.filter((i) => i.menu_item_id !== itemId))
            return
        }

        if (newQuantity > originalItem.quantity) {
            newQuantity = originalItem.quantity
        }

        setSelectedItems((prev) =>
            prev.map((item) =>
                item.menu_item_id === itemId
                    ? {
                        ...item,
                        quantity: newQuantity,
                        refund_amount: item.unit_price * newQuantity,
                    }
                    : item
            )
        )
    }

    const refundMutation = useMutation({
        mutationFn: async () => {
            if (!foundInvoice) throw new Error("No invoice selected")

            return processRefund({
                originalInvoice: foundInvoice,
                refundItems: selectedItems,
                reason,
                processedBy,
                processedByName,
                branchId,
                restaurantId,
            })
        },
        onSuccess: (result) => {
            if (result.success) {
                onRefundComplete?.()
                handleClose()
            }
        },
    })

    const handleClose = () => {
        setStep("search")
        setSearchQuery("")
        setFoundInvoice(null)
        setSelectedItems([])
        setReason("")
        setSearchError("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                            <RefreshCw className="h-5 w-5 text-white" />
                        </div>
                        Process Refund
                    </DialogTitle>
                    <DialogDescription>
                        Search for an invoice by number to process a refund
                    </DialogDescription>
                </DialogHeader>

                <AnimatePresence mode="wait">
                    {/* Step 1: Search */}
                    {step === "search" && (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4 py-4"
                        >
                            <div className="space-y-2">
                                <Label>Invoice Number</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="INV-2024-1234"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        className="flex-1 uppercase"
                                    />
                                    <Button onClick={handleSearch} disabled={searching}>
                                        {searching ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </motion.div>
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {searchError && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm">{searchError}</span>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Step 2: Select Items */}
                    {step === "select" && foundInvoice && (
                        <motion.div
                            key="select"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4 py-4"
                        >
                            {/* Invoice Info */}
                            <div className="bg-muted/50 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{foundInvoice.invoiceNumber}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(foundInvoice.created_at), "PPp")}
                                        </p>
                                    </div>
                                    <Badge variant="outline">{foundInvoice.paymentMethod}</Badge>
                                </div>
                            </div>

                            {/* Item Selection */}
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                <Label>Select Items to Refund</Label>
                                {foundInvoice.items.map((item) => {
                                    const isSelected = selectedItems.some(
                                        (s) => s.menu_item_id === item.menu_item_id
                                    )
                                    const selectedItem = selectedItems.find(
                                        (s) => s.menu_item_id === item.menu_item_id
                                    )

                                    return (
                                        <div
                                            key={item.menu_item_id}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-lg border transition-all",
                                                isSelected
                                                    ? "border-orange-500/50 bg-orange-500/10"
                                                    : "border-border hover:bg-muted/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() =>
                                                        toggleItemSelection(item.menu_item_id)
                                                    }
                                                />
                                                <div>
                                                    <p className="font-medium">{item.menu_item_name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatCurrency(item.unit_price)} × {item.quantity}
                                                    </p>
                                                </div>
                                            </div>

                                            {isSelected && selectedItem && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() =>
                                                            updateItemQuantity(
                                                                item.menu_item_id,
                                                                selectedItem.quantity - 1
                                                            )
                                                        }
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <span className="w-8 text-center">
                                                        {selectedItem.quantity}
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() =>
                                                            updateItemQuantity(
                                                                item.menu_item_id,
                                                                selectedItem.quantity + 1
                                                            )
                                                        }
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Reason */}
                            <div className="space-y-2">
                                <Label>Refund Reason</Label>
                                <Textarea
                                    placeholder="Enter reason for refund..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <Separator />

                            {/* Total */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(amounts.subtotal)} JOD</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>{formatCurrency(amounts.taxAmount)} JOD</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-orange-500">
                                    <span>Refund Total</span>
                                    <span>{formatCurrency(amounts.totalAmount)} JOD</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <DialogFooter className="gap-2 sm:gap-0">
                    {step === "search" && (
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                    )}

                    {step === "select" && (
                        <>
                            <Button variant="outline" onClick={() => setStep("search")}>
                                Back
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => refundMutation.mutate()}
                                disabled={selectedItems.length === 0 || !reason.trim() || refundMutation.isPending}
                            >
                                {refundMutation.isPending ? "Processing..." : "Process Refund"}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
