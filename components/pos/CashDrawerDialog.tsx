"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    Wallet,
    DollarSign,
    ArrowUpCircle,
    ArrowDownCircle,
    Clock,
    History,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format, formatDistanceToNow } from "date-fns"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/services/tax"
import {
    logDrawerOpen,
    getTodayDrawerEvents,
    getReasonLabel,
    type DrawerOpenReason,
    type DrawerEvent,
} from "@/lib/services/cash-drawer"

interface CashDrawerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    branchId: string
    shiftId?: string
    staffId: string
    staffName: string
}

export function CashDrawerDialog({
    open,
    onOpenChange,
    branchId,
    shiftId,
    staffId,
    staffName,
}: CashDrawerDialogProps) {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [action, setAction] = useState<"paid_in" | "paid_out" | "no_sale">("no_sale")
    const [amount, setAmount] = useState("")
    const [notes, setNotes] = useState("")

    const { data: events = [] } = useQuery({
        queryKey: ["drawer-events", branchId, shiftId],
        queryFn: () => getTodayDrawerEvents(branchId, shiftId),
        enabled: open,
    })

    const actionMutation = useMutation({
        mutationFn: async () => {
            const amountValue = action === "no_sale" ? undefined : parseFloat(amount)

            if (action !== "no_sale" && (!amountValue || amountValue <= 0)) {
                throw new Error("Please enter a valid amount")
            }

            return logDrawerOpen({
                reason: action,
                amount: amountValue,
                notes: notes.trim() || undefined,
                staffId,
                staffName,
                shiftId,
                branchId,
            })
        },
        onSuccess: (result) => {
            if (result.success) {
                toast({
                    title: "Drawer Opened",
                    description: action === "no_sale"
                        ? "Cash drawer opened"
                        : `${getReasonLabel(action)}: ${formatCurrency(parseFloat(amount))} JOD`,
                })
                queryClient.invalidateQueries({ queryKey: ["drawer-events"] })
                setAmount("")
                setNotes("")
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to open drawer",
                    variant: "destructive",
                })
            }
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            })
        },
    })

    const handleClose = () => {
        setAmount("")
        setNotes("")
        setAction("no_sale")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                        Cash Drawer
                    </DialogTitle>
                    <DialogDescription>
                        Manage cash drawer operations
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="actions" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="actions">Actions</TabsTrigger>
                        <TabsTrigger value="history">
                            History
                            {events.length > 0 && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                    {events.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="actions" className="space-y-4 mt-4">
                        {/* Action Type Selection */}
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant={action === "no_sale" ? "default" : "outline"}
                                onClick={() => setAction("no_sale")}
                                className={cn(
                                    "flex flex-col h-auto py-3 gap-1",
                                    action === "no_sale" && "bg-gradient-to-r from-slate-500 to-gray-500 border-0"
                                )}
                            >
                                <DollarSign className="h-5 w-5" />
                                <span className="text-xs">No Sale</span>
                            </Button>
                            <Button
                                variant={action === "paid_in" ? "default" : "outline"}
                                onClick={() => setAction("paid_in")}
                                className={cn(
                                    "flex flex-col h-auto py-3 gap-1",
                                    action === "paid_in" && "bg-gradient-to-r from-emerald-500 to-green-500 border-0"
                                )}
                            >
                                <ArrowDownCircle className="h-5 w-5" />
                                <span className="text-xs">Paid In</span>
                            </Button>
                            <Button
                                variant={action === "paid_out" ? "default" : "outline"}
                                onClick={() => setAction("paid_out")}
                                className={cn(
                                    "flex flex-col h-auto py-3 gap-1",
                                    action === "paid_out" && "bg-gradient-to-r from-orange-500 to-red-500 border-0"
                                )}
                            >
                                <ArrowUpCircle className="h-5 w-5" />
                                <span className="text-xs">Paid Out</span>
                            </Button>
                        </div>

                        {/* Amount Input (only for paid in/out) */}
                        {action !== "no_sale" && (
                            <div className="space-y-2">
                                <Label>Amount (JOD)</Label>
                                <Input
                                    type="number"
                                    placeholder="Enter amount..."
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    min="0"
                                    step="0.01"
                                    className="text-lg"
                                />
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Textarea
                                placeholder={action === "paid_out" ? "e.g., Supplier payment" : "Add notes..."}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={() => actionMutation.mutate()}
                            disabled={actionMutation.isPending || (action !== "no_sale" && !amount)}
                        >
                            {actionMutation.isPending
                                ? "Processing..."
                                : action === "no_sale"
                                    ? "Open Drawer"
                                    : `Record ${getReasonLabel(action)}`}
                        </Button>
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {events.length === 0 ? (
                                <div className="text-center py-8">
                                    <History className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No drawer events today</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {events.map((event) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-center justify-between p-3 bg-card border rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center",
                                                        event.reason === "paid_in" && "bg-emerald-500/10 text-emerald-500",
                                                        event.reason === "paid_out" && "bg-red-500/10 text-red-500",
                                                        event.reason === "no_sale" && "bg-gray-500/10 text-gray-500",
                                                        event.reason === "sale" && "bg-blue-500/10 text-blue-500",
                                                        event.reason === "refund" && "bg-orange-500/10 text-orange-500"
                                                    )}
                                                >
                                                    {event.reason === "paid_in" && <ArrowDownCircle className="h-4 w-4" />}
                                                    {event.reason === "paid_out" && <ArrowUpCircle className="h-4 w-4" />}
                                                    {event.reason === "no_sale" && <DollarSign className="h-4 w-4" />}
                                                    {event.reason === "sale" && <DollarSign className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{getReasonLabel(event.reason)}</p>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDistanceToNow(
                                                            event.createdAt instanceof Date
                                                                ? event.createdAt
                                                                : new Date(event.createdAt as any),
                                                            { addSuffix: true }
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {event.amount && (
                                                <span
                                                    className={cn(
                                                        "font-bold",
                                                        event.reason === "paid_in" && "text-emerald-500",
                                                        event.reason === "paid_out" && "text-red-500"
                                                    )}
                                                >
                                                    {event.reason === "paid_in" ? "+" : "-"}
                                                    {formatCurrency(event.amount)} JOD
                                                </span>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
