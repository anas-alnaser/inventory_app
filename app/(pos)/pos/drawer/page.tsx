"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Wallet,
    ArrowLeft,
    Plus,
    Banknote,
    ArrowUpRight,
    ArrowDownLeft,
    Coins
} from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/services/tax"
import { useAuth } from "@/lib/hooks/useAuth"
import { useStaff } from "@/lib/contexts/StaffContext"
import { getActiveShift } from "@/lib/services/shift"
import {
    getTodayDrawerEvents,
    logDrawerOpen,
    type DrawerEvent,
} from "@/lib/services/cash-drawer"
import { POSSidebar } from "@/components/pos/POSSidebar"

export default function CashDrawerPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { userData } = useAuth()
    const { activeStaff } = useStaff()
    const queryClient = useQueryClient()

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [entryType, setEntryType] = useState<"paid_in" | "paid_out">("paid_in")
    const [amount, setAmount] = useState("")
    const [notes, setNotes] = useState("")

    const branchId = userData?.branchId || ""
    const staffId = activeStaff?.id || userData?.id || ""
    const staffName = activeStaff?.name || userData?.name || "Staff"

    // Fetch active shift
    const { data: activeShift } = useQuery({
        queryKey: ["active-shift-drawer", staffId],
        queryFn: async () => {
            if (!staffId) return null
            return getActiveShift(staffId)
        },
        enabled: !!staffId,
    })

    // Fetch drawer events
    const { data: drawerEvents = [], isLoading } = useQuery({
        queryKey: ["drawer-events", branchId, activeShift?.id],
        queryFn: async () => {
            if (!branchId) return []
            return getTodayDrawerEvents(branchId, activeShift?.id)
        },
        enabled: !!branchId,
        refetchInterval: 30000,
    })

    // Calculate balance from events
    const balance = drawerEvents.reduce((acc, event) => {
        if (event.reason === "paid_in" && event.amount) {
            return acc + event.amount
        }
        if (event.reason === "paid_out" && event.amount) {
            return acc - event.amount
        }
        return acc
    }, activeShift?.startingCash || 0)

    const addEntryMutation = useMutation({
        mutationFn: async () => {
            const amountValue = parseFloat(amount)
            if (isNaN(amountValue) || amountValue <= 0) {
                throw new Error("Please enter a valid amount")
            }

            return logDrawerOpen({
                reason: entryType,
                amount: amountValue,
                notes: notes.trim() || undefined,
                staffId,
                staffName,
                shiftId: activeShift?.id,
                branchId,
            })
        },
        onSuccess: (result) => {
            if (result.success) {
                toast({
                    title: entryType === "paid_in" ? "Cash Added" : "Cash Removed",
                    description: `${formatCurrency(parseFloat(amount))} JOD ${entryType === "paid_in" ? "added to" : "removed from"} drawer`,
                })
                queryClient.invalidateQueries({ queryKey: ["drawer-events"] })
                setIsAddDialogOpen(false)
                setAmount("")
                setNotes("")
            }
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update drawer",
                variant: "destructive",
            })
        },
    })

    return (
        <div className="h-screen flex bg-background text-foreground overflow-hidden">
            <POSSidebar onCloseShift={() => { }} />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/pos")}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Cash Drawer</h1>
                            <p className="text-sm text-muted-foreground">
                                {activeShift ? "Active Shift" : "No Active Shift"}
                            </p>
                        </div>
                    </div>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Entry
                    </Button>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Balance Card */}
                        <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                            <CardContent className="py-8">
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                                        <Wallet className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">Estimated Balance</p>
                                    <p className="text-4xl font-bold text-foreground">
                                        {formatCurrency(balance)} <span className="text-lg font-normal text-muted-foreground">JOD</span>
                                    </p>
                                    {activeShift && (
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Starting: {formatCurrency(activeShift.startingCash)} JOD
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant="outline"
                                className="h-24 flex-col gap-2"
                                onClick={() => {
                                    setEntryType("paid_in")
                                    setIsAddDialogOpen(true)
                                }}
                            >
                                <ArrowDownLeft className="h-6 w-6 text-emerald-500" />
                                <span>Pay In</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-24 flex-col gap-2"
                                onClick={() => {
                                    setEntryType("paid_out")
                                    setIsAddDialogOpen(true)
                                }}
                            >
                                <ArrowUpRight className="h-6 w-6 text-orange-500" />
                                <span>Pay Out</span>
                            </Button>
                        </div>

                        {/* Recent Entries */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Coins className="h-5 w-5" />
                                    Recent Entries
                                </CardTitle>
                                <CardDescription>Cash movements during this shift</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {drawerEvents.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Banknote className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                        <p className="text-muted-foreground">No entries yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {drawerEvents.slice(0, 10).map((event: DrawerEvent, index: number) => (
                                            <motion.div
                                                key={event.id || index}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${event.reason === "paid_in"
                                                            ? "bg-emerald-500/10 text-emerald-500"
                                                            : "bg-orange-500/10 text-orange-500"
                                                        }`}>
                                                        {event.reason === "paid_in"
                                                            ? <ArrowDownLeft className="h-5 w-5" />
                                                            : <ArrowUpRight className="h-5 w-5" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="font-medium capitalize">{event.reason.replace("_", " ")}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {event.notes || "No notes"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className={`text-lg font-bold ${event.reason === "paid_in" ? "text-emerald-500" : "text-orange-500"
                                                    }`}>
                                                    {event.reason === "paid_in" ? "+" : "-"}{formatCurrency(event.amount || 0)} JOD
                                                </p>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>

            {/* Add Entry Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {entryType === "paid_in" ? "Add Cash to Drawer" : "Remove Cash from Drawer"}
                        </DialogTitle>
                        <DialogDescription>
                            {entryType === "paid_in"
                                ? "Enter the amount you're adding to the drawer"
                                : "Enter the amount you're removing from the drawer"
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={entryType} onValueChange={(v) => setEntryType(v as "paid_in" | "paid_out")}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paid_in">Pay In (Add Cash)</SelectItem>
                                    <SelectItem value="paid_out">Pay Out (Remove Cash)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Amount (JOD)</Label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                step="0.01"
                                min="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Textarea
                                placeholder="Enter notes for this transaction..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => addEntryMutation.mutate()}
                            disabled={!amount || addEntryMutation.isPending}
                            className={entryType === "paid_in"
                                ? "bg-emerald-500 hover:bg-emerald-600"
                                : "bg-orange-500 hover:bg-orange-600"
                            }
                        >
                            {addEntryMutation.isPending ? "Processing..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
