"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Pause,
    Play,
    Trash2,
    Clock,
    User,
    Hash,
    Package,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/services/tax"
import {
    getHoldOrders,
    deleteHoldOrder,
    type HoldOrder,
} from "@/lib/services/hold-orders"

interface HoldOrdersListProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    branchId: string
    onRecallOrder: (order: HoldOrder) => void
}

export function HoldOrdersList({
    open,
    onOpenChange,
    branchId,
    onRecallOrder,
}: HoldOrdersListProps) {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [selectedOrder, setSelectedOrder] = useState<HoldOrder | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const { data: holdOrders = [], isLoading } = useQuery({
        queryKey: ["hold-orders", branchId],
        queryFn: () => getHoldOrders(branchId),
        enabled: open && !!branchId,
        refetchInterval: 30000, // Refresh every 30 seconds
    })

    const deleteMutation = useMutation({
        mutationFn: async (orderId: string) => {
            return deleteHoldOrder(orderId)
        },
        onSuccess: (result) => {
            if (result.success) {
                toast({
                    title: "Order Removed",
                    description: "The held order has been removed.",
                })
                queryClient.invalidateQueries({ queryKey: ["hold-orders"] })
                setDeleteDialogOpen(false)
                setSelectedOrder(null)
            }
        },
    })

    const handleRecall = (order: HoldOrder) => {
        onRecallOrder(order)
        onOpenChange(false)
        // Delete the hold order after recalling
        deleteHoldOrder(order.id)
        queryClient.invalidateQueries({ queryKey: ["hold-orders"] })
    }

    const handleDeleteClick = (order: HoldOrder) => {
        setSelectedOrder(order)
        setDeleteDialogOpen(true)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-lg max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                                <Pause className="h-5 w-5 text-white" />
                            </div>
                            Held Orders
                            {holdOrders.length > 0 && (
                                <Badge variant="secondary" className="ml-2">
                                    {holdOrders.length}
                                </Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            Retrieve or manage saved orders
                        </DialogDescription>
                    </DialogHeader>

                    <div className="overflow-y-auto max-h-[50vh] space-y-3 py-4">
                        {isLoading ? (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-24 rounded-xl" />
                                ))}
                            </>
                        ) : holdOrders.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                <p className="text-muted-foreground">No held orders</p>
                                <p className="text-xs text-muted-foreground/70">
                                    Orders you put on hold will appear here
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {holdOrders.map((order) => (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="bg-card border rounded-xl p-4"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    {order.customerName && (
                                                        <div className="flex items-center gap-1 text-sm font-medium">
                                                            <User className="h-3 w-3" />
                                                            {order.customerName}
                                                        </div>
                                                    )}
                                                    {order.tableNumber && (
                                                        <Badge variant="outline" className="text-xs">
                                                            <Hash className="h-3 w-3 mr-1" />
                                                            {order.tableNumber}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(
                                                        order.createdAt instanceof Date
                                                            ? order.createdAt
                                                            : new Date(order.createdAt as any),
                                                        { addSuffix: true }
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-lg font-bold text-foreground">
                                                {formatCurrency(order.subtotal)} JOD
                                            </p>
                                        </div>

                                        <p className="text-sm text-muted-foreground mb-3">
                                            {order.items.length} items:{" "}
                                            {order.items.map((i) => i.name).join(", ").substring(0, 50)}
                                            {order.items.map((i) => i.name).join(", ").length > 50 && "..."}
                                        </p>

                                        {order.notes && (
                                            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mb-3">
                                                {order.notes}
                                            </p>
                                        )}

                                        <div className="flex gap-2">
                                            <Button
                                                className="flex-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                                                onClick={() => handleRecall(order)}
                                            >
                                                <Play className="h-4 w-4 mr-2" />
                                                Recall Order
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => handleDeleteClick(order)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Held Order?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this held order. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedOrder && deleteMutation.mutate(selectedOrder.id)}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
