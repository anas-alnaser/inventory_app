"use client"

import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import {
    FileText,
    Download,
    Printer,
    Calendar,
    DollarSign,
    CreditCard,
    TrendingUp,
    AlertTriangle,
    Clock,
    CheckCircle,
} from "lucide-react"
import { motion } from "framer-motion"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/services/tax"
import {
    generateEODReport,
    formatEODReportText,
    exportEODReportCSV,
    type EODReport,
} from "@/lib/services/eod-report"

interface EODReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    branchId: string
    generatedBy: string
    generatedByName: string
    businessName: string
}

export function EODReportDialog({
    open,
    onOpenChange,
    branchId,
    generatedBy,
    generatedByName,
    businessName,
}: EODReportDialogProps) {
    const { toast } = useToast()
    const [report, setReport] = useState<EODReport | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)

    const generateMutation = useMutation({
        mutationFn: async () => {
            return generateEODReport({
                date: new Date(),
                branchId,
                generatedBy,
                generatedByName,
            })
        },
        onSuccess: (result) => {
            setIsGenerating(false)
            if (result.success && result.report) {
                setReport(result.report)
                toast({
                    title: "Report Generated",
                    description: "End of Day report has been generated successfully.",
                })
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to generate report",
                    variant: "destructive",
                })
            }
        },
        onError: () => {
            setIsGenerating(false)
        },
    })

    // Auto-generate report when dialog opens
    useEffect(() => {
        if (open && !report && !isGenerating && !generateMutation.isPending) {
            setIsGenerating(true)
            generateMutation.mutate()
        }
    }, [open])

    const handlePrint = () => {
        if (!report) return
        const text = formatEODReportText(report, businessName)
        const printWindow = window.open("", "_blank")
        if (printWindow) {
            printWindow.document.write(`<pre style="font-family: monospace; font-size: 12px;">${text}</pre>`)
            printWindow.document.close()
            printWindow.print()
        }
    }

    const handleExportCSV = () => {
        if (!report) return
        const csv = exportEODReportCSV(report)
        const blob = new Blob([csv], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `eod-report-${format(new Date(), "yyyy-MM-dd")}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleClose = () => {
        setReport(null)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        End of Day Report
                    </DialogTitle>
                    <DialogDescription>
                        Generate a summary of today's sales and operations
                    </DialogDescription>
                </DialogHeader>

                {!report ? (
                    <div className="py-12 text-center space-y-4">
                        {generateMutation.isPending || isGenerating ? (
                            <>
                                <div className="w-16 h-16 mx-auto rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                                <div>
                                    <p className="text-lg font-medium">Generating Report...</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(), "EEEE, MMMM d, yyyy")}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto" />
                                <div>
                                    <p className="text-lg font-medium">Generate Today's Report</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(), "EEEE, MMMM d, yyyy")}
                                    </p>
                                </div>
                                <Button
                                    size="lg"
                                    onClick={() => generateMutation.mutate()}
                                    disabled={generateMutation.isPending}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                                >
                                    Generate Report
                                </Button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        {/* Date Header */}
                        <div className="text-center">
                            <Badge variant="outline" className="text-sm">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(report.date), "EEEE, MMMM d, yyyy")}
                            </Badge>
                        </div>

                        {/* Sales Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Card className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border-cyan-500/20">
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Total Sales</p>
                                    <p className="text-xl font-bold text-cyan-500">
                                        {formatCurrency(report.totalSales)} JOD
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {report.totalTransactions} transactions
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Tax Collected</p>
                                    <p className="text-xl font-bold">
                                        {formatCurrency(report.totalTax)} JOD
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Service Charge</p>
                                    <p className="text-xl font-bold">
                                        {formatCurrency(report.totalServiceCharge)} JOD
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Voided</p>
                                    <p className="text-xl font-bold text-red-500">
                                        {formatCurrency(report.voidedAmount)} JOD
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {report.voidedTransactions} transactions
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Payment Breakdown */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    Payment Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                            Cash
                                        </span>
                                        <span className="font-medium">{formatCurrency(report.cashTotal)} JOD</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                                            Card
                                        </span>
                                        <span className="font-medium">{formatCurrency(report.cardTotal)} JOD</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                                            CliQ
                                        </span>
                                        <span className="font-medium">{formatCurrency(report.cliqTotal)} JOD</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Shift Summary */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Shift Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold">{report.shiftsOpened}</p>
                                        <p className="text-xs text-muted-foreground">Shifts Opened</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{report.shiftsClosed}</p>
                                        <p className="text-xs text-muted-foreground">Shifts Closed</p>
                                    </div>
                                    <div>
                                        <p className={`text-2xl font-bold ${report.totalCashVariance >= 0 ? "text-emerald-500" : "text-red-500"
                                            }`}>
                                            {report.totalCashVariance >= 0 ? "+" : ""}
                                            {formatCurrency(report.totalCashVariance)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Cash Variance</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Selling Items */}
                        {report.topSellingItems.length > 0 && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Top Selling Items
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {report.topSellingItems.slice(0, 5).map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                                                        {idx + 1}
                                                    </Badge>
                                                    <span className="text-sm">{item.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-medium">{item.quantity} sold</span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {formatCurrency(item.revenue)} JOD
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose}>
                        Close
                    </Button>
                    {report && (
                        <>
                            <Button variant="outline" onClick={handleExportCSV}>
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                            <Button onClick={handlePrint}>
                                <Printer className="h-4 w-4 mr-2" />
                                Print Report
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
