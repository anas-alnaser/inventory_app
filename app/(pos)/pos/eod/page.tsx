"use client"

import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
    FileText,
    ArrowLeft,
    Calendar,
    DollarSign,
    CreditCard,
    Banknote,
    Receipt,
    Printer
} from "lucide-react"
import { format } from "date-fns"
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
import type { Shift } from "@/types/entities"

export default function EODPage() {
    const router = useRouter()
    const { userData } = useAuth()
    const { activeStaff } = useStaff()

    const branchId = userData?.branchId || ""
    const staffId = activeStaff?.id || userData?.id || ""

    // Fetch active shift
    const { data: activeShift, isLoading: shiftLoading } = useQuery({
        queryKey: ["active-shift-eod", staffId],
        queryFn: async () => {
            if (!staffId) return null
            return getActiveShift(staffId)
        },
        enabled: !!staffId,
    })

    // Fetch sales summary for active shift
    const { data: salesSummary, isLoading: summaryLoading } = useQuery({
        queryKey: ["shift-sales-eod", activeShift?.id],
        queryFn: async () => {
            if (!activeShift?.id) return null
            return getShiftSalesSummary(activeShift.id)
        },
        enabled: !!activeShift?.id,
    })

    // Fetch closed shifts
    const { data: closedShifts = [], isLoading: closedLoading } = useQuery({
        queryKey: ["closed-shifts-eod", branchId],
        queryFn: async () => {
            if (!branchId) return []
            return getBranchShifts(branchId, { status: "closed", limit: 10 })
        },
        enabled: !!branchId,
    })

    const handlePrint = () => {
        window.print()
    }

    const isLoading = shiftLoading || summaryLoading

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
                            <h1 className="text-xl font-bold">End of Day Report</h1>
                            <p className="text-sm text-muted-foreground">
                                {activeShift ? "Current Shift Summary" : "View Shift Reports"}
                            </p>
                        </div>
                    </div>
                    {salesSummary && (
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                    )}
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto">
                        <Tabs defaultValue="current" className="space-y-6">
                            <TabsList>
                                <TabsTrigger value="current">Current Shift</TabsTrigger>
                                <TabsTrigger value="history">Shift History</TabsTrigger>
                            </TabsList>

                            <TabsContent value="current" className="space-y-6">
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-32" />
                                        <Skeleton className="h-48" />
                                        <Skeleton className="h-48" />
                                    </div>
                                ) : !activeShift ? (
                                    <Card className="border-dashed">
                                        <CardContent className="py-12">
                                            <div className="text-center">
                                                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                                <p className="text-lg font-medium text-muted-foreground">No Active Shift</p>
                                                <p className="text-sm text-muted-foreground/70 mt-1">
                                                    Start a shift to see the EOD report
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <>
                                        {/* Shift Info */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Calendar className="h-5 w-5" />
                                                    Shift Information
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Started</p>
                                                        <p className="font-medium">
                                                            {format(new Date(activeShift.startTime), "h:mm a")}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Date</p>
                                                        <p className="font-medium">
                                                            {format(new Date(activeShift.startTime), "MMM d, yyyy")}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Staff ID</p>
                                                        <p className="font-medium">{activeStaff?.name || "Staff"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Status</p>
                                                        <Badge className="bg-emerald-500">Active</Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Sales Summary */}
                                        {salesSummary && (
                                            <>
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2">
                                                            <DollarSign className="h-5 w-5" />
                                                            Sales Summary
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                                                <p className="text-sm text-muted-foreground">Total Sales</p>
                                                                <p className="text-2xl font-bold text-foreground">
                                                                    {formatCurrency(salesSummary.totalSales)} JOD
                                                                </p>
                                                            </div>
                                                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                                                <p className="text-sm text-muted-foreground">Transactions</p>
                                                                <p className="text-2xl font-bold text-foreground">
                                                                    {salesSummary.transactionCount}
                                                                </p>
                                                            </div>
                                                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                                                <p className="text-sm text-muted-foreground">Avg Transaction</p>
                                                                <p className="text-2xl font-bold text-foreground">
                                                                    {formatCurrency(
                                                                        salesSummary.transactionCount > 0
                                                                            ? salesSummary.totalSales / salesSummary.transactionCount
                                                                            : 0
                                                                    )} JOD
                                                                </p>
                                                            </div>
                                                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                                                                <p className="text-sm text-muted-foreground">Starting Cash</p>
                                                                <p className="text-2xl font-bold text-foreground">
                                                                    {formatCurrency(activeShift.startingCash)} JOD
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                {/* Payment Breakdown */}
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2">
                                                            <CreditCard className="h-5 w-5" />
                                                            Payment Methods
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                                <div className="flex items-center gap-3">
                                                                    <Banknote className="h-5 w-5 text-emerald-500" />
                                                                    <span className="font-medium">Cash</span>
                                                                </div>
                                                                <span className="text-lg font-bold">
                                                                    {formatCurrency(salesSummary.cashSales)} JOD
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                                                <div className="flex items-center gap-3">
                                                                    <CreditCard className="h-5 w-5 text-blue-500" />
                                                                    <span className="font-medium">Card</span>
                                                                </div>
                                                                <span className="text-lg font-bold">
                                                                    {formatCurrency(salesSummary.cardSales)} JOD
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                                                <div className="flex items-center gap-3">
                                                                    <Receipt className="h-5 w-5 text-purple-500" />
                                                                    <span className="font-medium">CliQ</span>
                                                                </div>
                                                                <span className="text-lg font-bold">
                                                                    {formatCurrency(salesSummary.cliqSales)} JOD
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </>
                                        )}
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="history" className="space-y-4">
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
                                                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                                                <p className="text-lg font-medium text-muted-foreground">No Shift History</p>
                                                <p className="text-sm text-muted-foreground/70 mt-1">
                                                    Previous shifts will appear here
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
                                                            <p className="font-medium">Staff: {shift.staffId.slice(0, 8)}...</p>
                                                            <Badge variant="secondary">Closed</Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {format(new Date(shift.startTime), "MMM d, yyyy")} •
                                                            {format(new Date(shift.startTime), " h:mm a")} -
                                                            {shift.endTime ? format(new Date(shift.endTime), " h:mm a") : " N/A"}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold">
                                                            {formatCurrency(shift.expectedCash - shift.startingCash)} JOD
                                                        </p>
                                                        {shift.variance !== null && shift.variance !== 0 && (
                                                            <p className={`text-sm ${shift.variance < 0 ? "text-destructive" : "text-emerald-500"}`}>
                                                                Variance: {shift.variance >= 0 ? "+" : ""}{formatCurrency(shift.variance)} JOD
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}
