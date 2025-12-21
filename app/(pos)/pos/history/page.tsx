"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Receipt,
    Search,
    Calendar,
    Filter,
    ChevronDown,
    Eye,
    RotateCcw,
    Download,
    Clock,
    Banknote,
    CreditCard,
    QrCode,
    User,
    XCircle,
    CheckCircle,
    AlertCircle,
    RefreshCw,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    updateDoc,
    Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/hooks/useAuth"
import { useStaff } from "@/lib/contexts/StaffContext"
import { getEffectiveRole, canVoidTransactions } from "@/lib/utils/role-permissions"
import { formatCurrency } from "@/lib/services/tax"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { RefundDialog } from "@/components/pos/RefundDialog"
import { cn } from "@/lib/utils"
import { POSSidebar } from "@/components/pos/POSSidebar"
import type { Invoice, PaymentMethod } from "@/types/entities"

// Payment method icons
const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
    Cash: <Banknote className="h-4 w-4 text-emerald-500" />,
    Visa: <CreditCard className="h-4 w-4 text-blue-500" />,
    CliQ: <QrCode className="h-4 w-4 text-purple-500" />,
}

// Date range presets
const datePresets = [
    { label: "Today", days: 0 },
    { label: "Last 7 days", days: 7 },
    { label: "Last 30 days", days: 30 },
    { label: "All time", days: -1 },
]

export default function HistoryPage() {
    const { userData } = useAuth()
    const { activeStaff } = useStaff()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    // Get effective role
    const effectiveRole = getEffectiveRole(
        userData?.role,
        activeStaff?.role,
        userData?.is_store_device === true
    )
    const canVoid = canVoidTransactions(effectiveRole)

    // Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [dateRange, setDateRange] = useState(0) // days ago
    const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | "all">("all")
    const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "voided">("all")

    // Dialogs
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false)
    const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)

    // Fetch invoices - simplified query without composite index requirement
    const { data: invoices = [], isLoading, error } = useQuery({
        queryKey: ["invoices", userData?.branchId, dateRange],
        queryFn: async () => {
            if (!userData?.branchId) return []

            const invoicesRef = collection(db, "invoices")

            // Simple query - just get by branch_id, sort in memory
            const q = query(
                invoicesRef,
                where("branch_id", "==", userData.branchId)
            )

            const snapshot = await getDocs(q)
            let results = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    ...data,
                    created_at: data.created_at?.toDate?.() || data.created_at,
                } as Invoice
            })

            // Sort by created_at descending in memory
            results.sort((a, b) => {
                const dateA = new Date(a.created_at).getTime()
                const dateB = new Date(b.created_at).getTime()
                return dateB - dateA
            })

            // If cashier, filter to their own transactions
            if (effectiveRole === "cashier") {
                const cashierId = activeStaff?.id || userData?.id
                results = results.filter(inv => inv.cashier_id === cashierId)
            }

            return results
        },
        enabled: !!userData?.branchId,
    })

    // Void invoice mutation
    const voidMutation = useMutation({
        mutationFn: async (invoiceId: string) => {
            const invoiceRef = doc(db, "invoices", invoiceId)
            await updateDoc(invoiceRef, {
                status: "voided",
                voidedAt: Timestamp.now(),
                voidedBy: activeStaff?.id || userData?.id,
            })
        },
        onSuccess: () => {
            toast({
                title: "Invoice Voided",
                description: "The transaction has been voided successfully.",
            })
            setIsVoidDialogOpen(false)
            setSelectedInvoice(null)
            queryClient.invalidateQueries({ queryKey: ["invoices"] })
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to void the transaction.",
                variant: "destructive",
            })
        },
    })

    // Filter invoices
    const filteredInvoices = useMemo(() => {
        let result = invoices

        // Date filter
        if (dateRange >= 0) {
            const startDate = startOfDay(subDays(new Date(), dateRange))
            result = result.filter((inv) => new Date(inv.created_at) >= startDate)
        }

        // Payment filter
        if (paymentFilter !== "all") {
            result = result.filter((inv) => inv.paymentMethod === paymentFilter)
        }

        // Status filter
        if (statusFilter !== "all") {
            result = result.filter((inv) =>
                statusFilter === "voided" ? inv.status === "voided" : inv.status !== "voided"
            )
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(
                (inv) =>
                    inv.invoiceNumber.toLowerCase().includes(query) ||
                    inv.items.some((item) => item.menu_item_name.toLowerCase().includes(query))
            )
        }

        return result
    }, [invoices, dateRange, paymentFilter, statusFilter, searchQuery])

    // Calculate totals
    const totals = useMemo(() => {
        const completed = filteredInvoices.filter((inv) => inv.status !== "voided")
        return {
            count: completed.length,
            total: completed.reduce((sum, inv) => sum + inv.grandTotal, 0),
            cash: completed.filter((inv) => inv.paymentMethod === "Cash").reduce((sum, inv) => sum + inv.grandTotal, 0),
            card: completed.filter((inv) => inv.paymentMethod === "Visa").reduce((sum, inv) => sum + inv.grandTotal, 0),
            cliq: completed.filter((inv) => inv.paymentMethod === "CliQ").reduce((sum, inv) => sum + inv.grandTotal, 0),
        }
    }, [filteredInvoices])

    const handleViewDetails = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setIsDetailOpen(true)
    }

    const handleVoidClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setIsVoidDialogOpen(true)
    }

    const exportToCSV = () => {
        const headers = ["Invoice #", "Date", "Time", "Items", "Payment", "Total", "Status"]
        const rows = filteredInvoices.map((inv) => [
            inv.invoiceNumber,
            format(new Date(inv.created_at), "yyyy-MM-dd"),
            format(new Date(inv.created_at), "HH:mm"),
            inv.items.map((i) => `${i.quantity}x ${i.menu_item_name}`).join("; "),
            inv.paymentMethod,
            inv.grandTotal.toFixed(2),
            inv.status || "completed",
        ])

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`
        a.click()
    }

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* POS Sidebar */}
            <POSSidebar />

            {/* Main Content */}
            <div className="flex-1 h-full flex flex-col bg-background overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                                    <Receipt className="h-5 w-5 text-white" />
                                </div>
                                Transaction History
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                View and manage all transactions
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={exportToCSV} className="gap-2">
                                <Download className="h-4 w-4" />
                                Export CSV
                            </Button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
                        <Card className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border-cyan-500/20">
                            <CardContent className="p-4">
                                <p className="text-xs text-muted-foreground">Total Sales</p>
                                <p className="text-2xl font-bold text-foreground">{formatCurrency(totals.total)} JOD</p>
                                <p className="text-xs text-muted-foreground">{totals.count} transactions</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Banknote className="h-4 w-4 text-emerald-500" />
                                    <span className="text-xs text-muted-foreground">Cash</span>
                                </div>
                                <p className="text-xl font-bold text-foreground">{formatCurrency(totals.cash)} JOD</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <CreditCard className="h-4 w-4 text-blue-500" />
                                    <span className="text-xs text-muted-foreground">Card</span>
                                </div>
                                <p className="text-xl font-bold text-foreground">{formatCurrency(totals.card)} JOD</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <QrCode className="h-4 w-4 text-purple-500" />
                                    <span className="text-xs text-muted-foreground">CliQ</span>
                                </div>
                                <p className="text-xl font-bold text-foreground">{formatCurrency(totals.cliq)} JOD</p>
                            </CardContent>
                        </Card>
                        <Card className="col-span-2 lg:col-span-1">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-xs text-muted-foreground">Voided</span>
                                </div>
                                <p className="text-xl font-bold text-foreground">
                                    {filteredInvoices.filter((inv) => inv.status === "voided").length}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mt-6">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by invoice # or item..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={dateRange.toString()} onValueChange={(v) => setDateRange(parseInt(v))}>
                            <SelectTrigger className="w-[150px]">
                                <Calendar className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {datePresets.map((preset) => (
                                    <SelectItem key={preset.days} value={preset.days.toString()}>
                                        {preset.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={paymentFilter} onValueChange={(v) => setPaymentFilter(v as PaymentMethod | "all")}>
                            <SelectTrigger className="w-[130px]">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Payments</SelectItem>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Visa">Card</SelectItem>
                                <SelectItem value="CliQ">CliQ</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                            <SelectTrigger className="w-[130px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="voided">Voided</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Invoice List */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-20 rounded-xl" />
                            ))}
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <Receipt className="h-16 w-16 text-muted-foreground/50 mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">No transactions found</p>
                            <p className="text-sm text-muted-foreground/70">
                                {searchQuery ? "Try adjusting your search" : "Transactions will appear here"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {filteredInvoices.map((invoice) => {
                                    const isVoided = invoice.status === "voided"
                                    return (
                                        <motion.div
                                            key={invoice.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className={cn(
                                                "bg-card rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer",
                                                isVoided && "opacity-60 bg-red-500/5 border-red-500/20"
                                            )}
                                            onClick={() => handleViewDetails(invoice)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                                        isVoided
                                                            ? "bg-red-500/10 text-red-500"
                                                            : "bg-cyan-500/10 text-cyan-500"
                                                    )}>
                                                        {isVoided ? (
                                                            <XCircle className="h-6 w-6" />
                                                        ) : (
                                                            <Receipt className="h-6 w-6" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-foreground">
                                                                {invoice.invoiceNumber}
                                                            </span>
                                                            {isVoided && (
                                                                <Badge variant="secondary" className="bg-red-500/10 text-red-500 text-xs">
                                                                    Voided
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {invoice.items.length} items • {invoice.items.map((i) => i.menu_item_name).join(", ").substring(0, 50)}...
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className={cn(
                                                            "font-bold text-lg",
                                                            isVoided ? "text-muted-foreground line-through" : "text-foreground"
                                                        )}>
                                                            {formatCurrency(invoice.grandTotal)} JOD
                                                        </p>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            {paymentIcons[invoice.paymentMethod]}
                                                            <span>{invoice.paymentMethod}</span>
                                                        </div>
                                                    </div>

                                                    <div className="text-right text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(invoice.created_at), "HH:mm")}
                                                        </div>
                                                        <span>{format(new Date(invoice.created_at), "MMM d")}</span>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleViewDetails(invoice)
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {canVoid && !isVoided && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleVoidClick(invoice)
                                                                }}
                                                                title="Void Transaction"
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {!isVoided && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-orange-500 hover:text-orange-600"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setSelectedInvoice(invoice)
                                                                    setIsRefundDialogOpen(true)
                                                                }}
                                                                title="Refund"
                                                            >
                                                                <RefreshCw className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Invoice Detail Dialog */}
                <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Receipt className="h-5 w-5" />
                                {selectedInvoice?.invoiceNumber}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedInvoice && format(new Date(selectedInvoice.created_at), "PPp")}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedInvoice && (
                            <div className="space-y-4 py-4">
                                {/* Status */}
                                {selectedInvoice.status === "voided" && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-500">
                                        <XCircle className="h-5 w-5" />
                                        <span className="font-medium">This transaction has been voided</span>
                                    </div>
                                )}

                                {/* Items */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm">Items</h4>
                                    <div className="bg-muted/50 rounded-lg divide-y divide-border">
                                        {selectedInvoice.items.map((item, idx) => (
                                            <div key={idx} className="p-3 flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium">{item.menu_item_name}</span>
                                                    <span className="text-muted-foreground ml-2">×{item.quantity}</span>
                                                </div>
                                                <span className="font-medium">{formatCurrency(item.line_total)} JOD</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Separator />

                                {/* Totals */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>{formatCurrency(selectedInvoice.subtotal)} JOD</span>
                                    </div>
                                    {selectedInvoice.serviceChargeAmount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Service Charge</span>
                                            <span>{formatCurrency(selectedInvoice.serviceChargeAmount)} JOD</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>{formatCurrency(selectedInvoice.taxAmount)} JOD</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span>{formatCurrency(selectedInvoice.grandTotal)} JOD</span>
                                    </div>
                                </div>

                                {/* Payment Info */}
                                <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {paymentIcons[selectedInvoice.paymentMethod]}
                                        <span className="font-medium">{selectedInvoice.paymentMethod}</span>
                                    </div>
                                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            {canVoid && selectedInvoice && selectedInvoice.status !== "voided" && (
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        setIsDetailOpen(false)
                                        handleVoidClick(selectedInvoice)
                                    }}
                                >
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Void Transaction
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Void Confirmation Dialog */}
                <AlertDialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                Void Transaction?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will void invoice <strong>{selectedInvoice?.invoiceNumber}</strong> for{" "}
                                <strong>{formatCurrency(selectedInvoice?.grandTotal || 0)} JOD</strong>.
                                This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => selectedInvoice && voidMutation.mutate(selectedInvoice.id)}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                {voidMutation.isPending ? "Voiding..." : "Void Transaction"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Refund Dialog */}
                <RefundDialog
                    open={isRefundDialogOpen}
                    onOpenChange={setIsRefundDialogOpen}
                    branchId={userData?.branchId || ''}
                    restaurantId={''}
                    processedBy={activeStaff?.id || userData?.id || ''}
                    processedByName={activeStaff?.name || userData?.name || 'Staff'}
                    onRefundComplete={() => {
                        toast({
                            title: "Refund Processed",
                            description: "The refund has been processed successfully.",
                        })
                        queryClient.invalidateQueries({ queryKey: ["invoices"] })
                    }}
                />
            </div>
        </div>
    )
}
