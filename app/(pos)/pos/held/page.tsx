"use client"

import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Pause,
    Play,
    Trash2,
    Clock,
    User,
    Hash,
    Package,
    ArrowLeft
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { formatCurrency } from "@/lib/services/tax"
import {
    getHoldOrders,
    deleteHoldOrder,
    type HoldOrder,
} from "@/lib/services/hold-orders"
import { useAuth } from "@/lib/hooks/useAuth"
import { POSSidebar } from "@/components/pos/POSSidebar"
import { useState } from "react"

export default function HeldOrdersPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { userData } = useAuth()
    const queryClient = useQueryClient()
    const [selectedOrder, setSelectedOrder] = useState<HoldOrder | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const branchId = userData?.branchId || ""

    const { data: holdOrders = [], isLoading } = useQuery({
        queryKey: ["hold-orders", branchId],
        queryFn: () => getHoldOrders(branchId),
        enabled: !!branchId,
        refetchInterval: 30000,
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

    const handleRecall = async (order: HoldOrder) => {
        // Store order data in sessionStorage so the main POS page can restore it
        sessionStorage.setItem("recalledOrder", JSON.stringify(order))

        // Delete the hold order
        await deleteHoldOrder(order.id)
        queryClient.invalidateQueries({ queryKey: ["hold-orders"] })

        toast({
            title: "Order Recalled",
            description: order.customerName
                ? `Order for "${order.customerName}" will be restored`
                : "Your order will be restored",
        })

        // Navigate back to POS
        router.push("/pos")
    }

    const handleDeleteClick = (order: HoldOrder) => {
        setSelectedOrder(order)
        setDeleteDialogOpen(true)
    }

    return (
        <div className="h-screen flex bg-background text-foreground overflow-hidden">
            <POSSidebar
                onCloseShift={() => { }}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/pos")}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Held Orders</h1>
                            <p className="text-sm text-muted-foreground">
                                {holdOrders.length} orders waiting
                            </p>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-3xl mx-auto space-y-4">
                        {isLoading ? (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <Skeleton key={i} className="h-32 rounded-xl" />
                                ))}
                            </>
                        ) : holdOrders.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="py-12">
                                    <div className="text-center">
                                        <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-muted-foreground">No Held Orders</p>
                                        <p className="text-sm text-muted-foreground/70 mt-1">
                                            Orders you put on hold will appear here
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="mt-4"
                                            onClick={() => router.push("/pos")}
                                        >
                                            Back to POS
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {holdOrders.map((order) => (
                                    <motion.div
                                        key={order.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <Card className="overflow-hidden">
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            {order.customerName && (
                                                                <div className="flex items-center gap-1 text-base font-medium">
                                                                    <User className="h-4 w-4" />
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
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                                            <Clock className="h-3 w-3" />
                                                            {formatDistanceToNow(
                                                                typeof (order.createdAt as any)?.toDate === 'function'
                                                                    ? (order.createdAt as any).toDate()
                                                                    : order.createdAt instanceof Date
                                                                        ? order.createdAt
                                                                        : new Date(order.createdAt as any),
                                                                { addSuffix: true }
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {formatCurrency(order.subtotal)} JOD
                                                    </p>
                                                </div>

                                                <p className="text-sm text-muted-foreground mb-4">
                                                    {order.items.length} items:{" "}
                                                    {order.items.map((i) => i.name).join(", ").substring(0, 80)}
                                                    {order.items.map((i) => i.name).join(", ").length > 80 && "..."}
                                                </p>

                                                {order.notes && (
                                                    <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg mb-4">
                                                        {order.notes}
                                                    </p>
                                                )}

                                                <div className="flex gap-3">
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
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </main>
            </div>

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
        </div>
    )
}
