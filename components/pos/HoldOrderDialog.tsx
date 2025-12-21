"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
    Pause,
    User,
    Hash,
    FileText,
} from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
    createHoldOrder,
    type HoldOrderItem,
} from "@/lib/services/hold-orders"
import type { CartItem } from "@/lib/stores/pos-cart"

interface HoldOrderDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    cartItems: CartItem[]
    discountType?: "percentage" | "fixed"
    discountValue?: number
    branchId: string
    createdBy: string
    createdByName: string
    onOrderHeld: () => void
}

export function HoldOrderDialog({
    open,
    onOpenChange,
    cartItems,
    discountType,
    discountValue,
    branchId,
    createdBy,
    createdByName,
    onOrderHeld,
}: HoldOrderDialogProps) {
    const { toast } = useToast()
    const [customerName, setCustomerName] = useState("")
    const [tableNumber, setTableNumber] = useState("")
    const [notes, setNotes] = useState("")

    const holdMutation = useMutation({
        mutationFn: async () => {
            // Convert cart items to hold order items
            const holdItems: HoldOrderItem[] = cartItems.map((item) => ({
                menuItemId: item.menuItemId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                taxRate: item.taxRate,
                isTaxExempt: item.isTaxExempt,
                modifiers: item.modifiers,
                notes: item.notes,
            }))

            return createHoldOrder({
                items: holdItems,
                customerName: customerName.trim() || undefined,
                tableNumber: tableNumber.trim() || undefined,
                notes: notes.trim() || undefined,
                discountType,
                discountValue,
                createdBy,
                createdByName,
                branchId,
            })
        },
        onSuccess: (result) => {
            if (result.success) {
                toast({
                    title: "Order Held",
                    description: customerName
                        ? `Order for "${customerName}" has been saved`
                        : "Your order has been saved",
                })
                onOrderHeld()
                handleClose()
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to hold order",
                    variant: "destructive",
                })
            }
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to hold order",
                variant: "destructive",
            })
        },
    })

    const handleClose = () => {
        setCustomerName("")
        setTableNumber("")
        setNotes("")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                            <Pause className="h-5 w-5 text-white" />
                        </div>
                        Hold Order
                    </DialogTitle>
                    <DialogDescription>
                        Save this order to retrieve later. {cartItems.length} items will be held.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Customer Name (Optional)
                        </Label>
                        <Input
                            placeholder="Enter customer name..."
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            Table Number (Optional)
                        </Label>
                        <Input
                            placeholder="Enter table number..."
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Notes (Optional)
                        </Label>
                        <Textarea
                            placeholder="Add any notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                        />
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Order will expire after 4 hours if not retrieved.
                    </p>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => holdMutation.mutate()}
                        disabled={cartItems.length === 0 || holdMutation.isPending}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    >
                        {holdMutation.isPending ? "Saving..." : "Hold Order"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
