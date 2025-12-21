"use client"

import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
    BarChart3,
    ArrowLeft,
    Calendar,
    DollarSign,
    CreditCard,
    Banknote,
    Receipt,
    TrendingUp,
    ShoppingBag,
    RefreshCw
} from "lucide-react"
import { format, startOfDay, endOfDay } from "date-fns"
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/services/tax"
import { useAuth } from "@/lib/hooks/useAuth"
import { useStaff } from "@/lib/contexts/StaffContext"
import { getActiveShift, getShiftSalesSummary, getBranchShifts } from "@/lib/services/shift"
import { POSSidebar } from "@/components/pos/POSSidebar"
import type { Invoice, Shift, InvoiceItem } from "@/types/entities"

interface ItemSale {
    menuItemId: string
    name: string
    quantity: number
    revenue: number
}

export default function POSReportsPage() {
    const router = useRouter()
    const { userData } = useAuth()
    const { activeStaff } = useStaff()

    const branchId = userData?.branchId || ""
    const staffId = activeStaff?.id || userData?.id || ""

    // Fetch active shift (X-Report)
    const { data: activeShift, isLoading: shiftLoading, refetch: refetchShift } = useQuery({
        queryKey: ["active-shift-reports", staffId],
        queryFn: async () => {
            if (!staffId) return null
            return getActiveShift(staffId)
        },
        enabled: !!staffId,
    })

    // Fetch shift sales summary
    const { data: shiftSummary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
        queryKey: ["shift-sales-summary", activeShift?.id],
        queryFn: async () => {
            if (!activeShift?.id) return null
            return getShiftSalesSummary(activeShift.id)
        },
        enabled: !!activeShift?.id,
        refetchInterval: 30000, // Refresh every 30 seconds for live updates
    })

    // Fetch closed shifts (Z-Report)
    const { data: closedShifts = [], isLoading: closedLoading } = useQuery({
        queryKey: ["closed-shifts-reports", branchId],
        queryFn: async () => {
            if (!branchId) return []
            return getBranchShifts(branchId, { status: "closed", limit: 10 })
        },
        enabled: !!branchId,
    })

    // Fetch today's item sales
    const { data: todayItems = [], isLoading: itemsLoading, refetch: refetchItems } = useQuery({
        queryKey: ["today-item-sales", branchId],
        queryFn: async () => {
            if (!branchId) return []

            const today = new Date()
            const dayStart = startOfDay(today)
            const dayEnd = endOfDay(today)

            const invoicesRef = collection(db, "invoices")
            const q = query(
                invoicesRef,
                where("branchId", "==", branchId),
                where("created_at", ">=", Timestamp.fromDate(dayStart)),
                where("created_at", "<=", Timestamp.fromDate(dayEnd)),
                orderBy("created_at", "desc")
            )

            const snapshot = await getDocs(q)
            const invoices = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Invoice[]

            // Aggregate items sold using correct field names
            const itemMap = new Map<string, ItemSale>()

            invoices.forEach((invoice) => {
                if (invoice.items) {
                    invoice.items.forEach((item: InvoiceItem) => {
                        const existing = itemMap.get(item.menu_item_id)
                        if (existing) {
                            existing.quantity += item.quantity
                            existing.revenue += item.line_total
                        } else {
                            itemMap.set(item.menu_item_id, {
                                menuItemId: item.menu_item_id,
                                name: item.menu_item_name,
                                quantity: item.quantity,
                                revenue: item.line_total,
                            })
                        }
                    })
                }
            })

            // Sort by quantity descending
            return Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity)
        },
        enabled: !!branchId,
    })

    const handleRefreshAll = () => {
        refetchShift()
        refetchSummary()
        refetchItems()
    }

    const isXReportLoading = shiftLoading || summaryLoading

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
                            <h1 className="text-xl font-bold">POS Reports</h1>
                            <p className="text-sm text-muted-foreground">
                                Sales and shift reporting
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleRefreshAll}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto">
                        <Tabs defaultValue="x-report" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="x-report">X-Report</TabsTrigger>
                                <TabsTrigger value="z-report">Z-Report</TabsTrigger>
                                <TabsTrigger value="items">Today&apos;s Sales</TabsTrigger>
                            </TabsList>

                            {/* X-Report: Current Shift */}
                            <TabsContent value="x-report" className="space-y-6">
                                {isXReportLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-32" />
                                        <Skeleton className="h-48" />
                                    </div>
                                ) : !activeShift ? (
                                    <Card className="border-dashed">
                                        <CardContent className="py-12">
                                            <div className="text-center">
                                                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                                <p className="text-lg font-medium text-muted-foreground">No Active Shift</p>
                                                <p className="text-sm text-muted-foreground/70 mt-1">
                                                    Start a shift to see X-Report data
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <>
                                        {/* Live Badge */}
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-sm font-medium text-emerald-500">Live Data</span>
                                            <span className="text-xs text-muted-foreground">• Updates every 30 seconds</span>
                                        </div>

                                        {/* Sales Summary Cards */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <DollarSign className="h-4 w-4 text-emerald-500" />
                                                        <span className="text-sm text-muted-foreground">Total Sales</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">
                                                        {formatCurrency(shiftSummary?.totalSales || 0)} JOD
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Receipt className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">Transactions</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">
                                                        {shiftSummary?.transactionCount || 0}
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">Avg Transaction</span>
                                                    </div>
                                                    <p className="text-2xl font-bold">
                                                        {formatCurrency(
                                                            shiftSummary?.transactionCount
                                                                ? (shiftSummary.totalSales / shiftSummary.transactionCount)
                                                                : 0
                                                        )} JOD
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">Shift Started</span>
                                                    </div>
                                                    <p className="text-lg font-bold">
                                                        {format(new Date(activeShift.startTime), "h:mm a")}
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Payment Breakdown */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <CreditCard className="h-5 w-5" />
                                                    Payment Methods
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                        <div className="flex items-center gap-2">
                                                            <Banknote className="h-5 w-5 text-emerald-500" />
                                                            <span className="font-medium">Cash</span>
                                                        </div>
                                                        <span className="font-bold">
                                                            {formatCurrency(shiftSummary?.cashSales || 0)} JOD
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                                        <div className="flex items-center gap-2">
                                                            <CreditCard className="h-5 w-5 text-blue-500" />
                                                            <span className="font-medium">Card</span>
                                                        </div>
                                                        <span className="font-bold">
                                                            {formatCurrency(shiftSummary?.cardSales || 0)} JOD
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                                        <div className="flex items-center gap-2">
                                                            <Receipt className="h-5 w-5 text-purple-500" />
                                                            <span className="font-medium">CliQ</span>
                                                        </div>
                                                        <span className="font-bold">
                                                            {formatCurrency(shiftSummary?.cliqSales || 0)} JOD
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </>
                                )}
                            </TabsContent>

                            {/* Z-Report: Closed Shifts */}
                            <TabsContent value="z-report" className="space-y-4">
                                {closedLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <Skeleton key={i} className="h-24" />
                                        ))}
                                    </div>
                                ) : closedShifts.length === 0 ? (
                                    <Card className="border-dashed">
                                        <CardContent className="py-12">
                                            <div className="text-center">
                                                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                                <p className="text-lg font-medium text-muted-foreground">No Closed Shifts</p>
                                                <p className="text-sm text-muted-foreground/70 mt-1">
                                                    Previous shift reports will appear here
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    closedShifts.map((shift: Shift) => (
                                        <Card key={shift.id}>
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="font-medium">{activeStaff?.name || "Staff"}</p>
                                                            <Badge variant="secondary">Closed</Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {format(new Date(shift.startTime), "MMM d, yyyy")} •
                                                            {format(new Date(shift.startTime), " h:mm a")} -
                                                            {shift.endTime ? format(new Date(shift.endTime), " h:mm a") : " N/A"}
                                                        </p>
                                                        {shift.variance !== undefined && shift.variance !== null && shift.variance !== 0 && (
                                                            <p className={`text-xs mt-1 ${shift.variance < 0 ? "text-destructive" : "text-emerald-500"}`}>
                                                                Variance: {shift.variance >= 0 ? "+" : ""}{formatCurrency(shift.variance)} JOD
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold">
                                                            {formatCurrency(shift.expectedCash - shift.startingCash)} JOD
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Cash Sales
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </TabsContent>

                            {/* Today's Item Sales */}
                            <TabsContent value="items" className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium">Items Sold Today</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(), "EEEE, MMMM d")}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="text-lg px-3 py-1">
                                        {todayItems.reduce((sum, item) => sum + item.quantity, 0)} items
                                    </Badge>
                                </div>

                                {itemsLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <Skeleton key={i} className="h-16" />
                                        ))}
                                    </div>
                                ) : todayItems.length === 0 ? (
                                    <Card className="border-dashed">
                                        <CardContent className="py-12">
                                            <div className="text-center">
                                                <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                                <p className="text-lg font-medium text-muted-foreground">No Sales Yet</p>
                                                <p className="text-sm text-muted-foreground/70 mt-1">
                                                    Items sold today will appear here
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card>
                                        <CardContent className="p-0">
                                            <div className="divide-y">
                                                {todayItems.map((item, index) => (
                                                    <div
                                                        key={item.menuItemId}
                                                        className="flex items-center justify-between p-4 hover:bg-muted/50"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{item.name}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {item.quantity} sold
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <p className="text-lg font-bold">
                                                            {formatCurrency(item.revenue)} JOD
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Total Revenue */}
                                {todayItems.length > 0 && (
                                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">Total Revenue Today</span>
                                                <span className="text-2xl font-bold">
                                                    {formatCurrency(todayItems.reduce((sum, item) => sum + item.revenue, 0))} JOD
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}
