"use client"

import { useState, useMemo, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  ArrowDown,
  ArrowUp,
  Minus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Truck,
  Trash2,
  PackagePlus,
  PackageMinus,
} from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/hooks/useAuth"
import { getInventoryWithStock, type InventoryItem } from "@/lib/services/inventory"
import { getStockLogsByDateRange } from "@/lib/services/logs"
import { formatStockQuantity } from "@/lib/services/utils"
import type { StockLog, Unit, StockLogReason } from "@/types/entities"

// Date range presets
const datePresets = [
  { label: "Today", value: "today", days: 0 },
  { label: "Last 7 Days", value: "week", days: 7 },
  { label: "Last 30 Days", value: "month", days: 30 },
]

// Reason icons and labels
const reasonConfig: Record<StockLogReason, { icon: React.ReactNode; label: string; color: string }> = {
  purchase: { icon: <PackagePlus className="h-4 w-4" />, label: "Purchase", color: "text-emerald-500" },
  sale: { icon: <PackageMinus className="h-4 w-4" />, label: "Sale", color: "text-blue-500" },
  waste: { icon: <Trash2 className="h-4 w-4" />, label: "Waste", color: "text-red-500" },
  adjustment: { icon: <RefreshCw className="h-4 w-4" />, label: "Adjustment", color: "text-yellow-500" },
  transfer: { icon: <Truck className="h-4 w-4" />, label: "Transfer", color: "text-purple-500" },
  consumption: { icon: <PackageMinus className="h-4 w-4" />, label: "Consumption", color: "text-orange-500" },
  expired: { icon: <AlertTriangle className="h-4 w-4" />, label: "Expired", color: "text-red-600" },
  correction: { icon: <RefreshCw className="h-4 w-4" />, label: "Correction", color: "text-gray-500" },
  other: { icon: <Package className="h-4 w-4" />, label: "Other", color: "text-gray-500" },
  restock: { icon: <PackagePlus className="h-4 w-4" />, label: "Restock", color: "text-emerald-600" },
  production: { icon: <Package className="h-4 w-4" />, label: "Production", color: "text-cyan-500" },
}

export default function InventoryReportsPage() {
  const { userData } = useAuth()
  const branchId = userData?.branchId || ""
  const [dateRange, setDateRange] = useState("week")
  const [activeTab, setActiveTab] = useState("overview")

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const now = new Date()
    const preset = datePresets.find((p) => p.value === dateRange)
    const days = preset?.days || 7
    return {
      startDate: startOfDay(subDays(now, days)),
      endDate: endOfDay(now),
    }
  }, [dateRange])

  // Fetch inventory data
  const { data: inventory = [], isLoading: inventoryLoading, refetch: refetchInventory } = useQuery({
    queryKey: ["inventory-reports", branchId],
    queryFn: () => getInventoryWithStock(branchId),
    enabled: !!branchId,
    staleTime: 30000,
  })

  // Fetch stock logs
  const { data: stockLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["stock-logs-reports", branchId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () => getStockLogsByDateRange(branchId, startDate, endDate),
    enabled: !!branchId,
  })

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalItems = inventory.length
    const lowStockItems = inventory.filter((i) => i.status === "low" || i.status === "critical")
    const outOfStockItems = inventory.filter((i) => i.status === "out")
    const healthyItems = inventory.filter((i) => i.status === "good")

    // Calculate stock value (cost_per_unit * quantity)
    const totalStockValue = inventory.reduce((sum, item) => {
      const quantity = item.stock?.quantity || 0
      const cost = item.ingredient?.cost_per_unit || 0
      return sum + quantity * cost
    }, 0)

    // Stock movement summary from logs
    const purchases = stockLogs.filter((log) => log.reason === "purchase" || log.reason === "restock")
    const sales = stockLogs.filter((log) => log.reason === "sale" || log.reason === "consumption")
    const waste = stockLogs.filter((log) => log.reason === "waste" || log.reason === "expired")

    const totalPurchased = purchases.reduce((sum, log) => sum + Math.abs(log.change_amount), 0)
    const totalSold = sales.reduce((sum, log) => sum + Math.abs(log.change_amount), 0)
    const totalWaste = waste.reduce((sum, log) => sum + Math.abs(log.change_amount), 0)

    return {
      totalItems,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      healthyCount: healthyItems.length,
      totalStockValue,
      stockHealth: totalItems > 0 ? (healthyItems.length / totalItems) * 100 : 0,
      totalPurchased,
      totalSold,
      totalWaste,
      movementCount: stockLogs.length,
    }
  }, [inventory, stockLogs])

  // Group logs by reason for chart
  const logsByReason = useMemo(() => {
    const grouped: Record<string, number> = {}
    stockLogs.forEach((log) => {
      grouped[log.reason] = (grouped[log.reason] || 0) + 1
    })
    return Object.entries(grouped)
      .map(([reason, count]) => ({ reason: reason as StockLogReason, count }))
      .sort((a, b) => b.count - a.count)
  }, [stockLogs])

  // Low stock items sorted by severity
  const lowStockItems = useMemo(() => {
    return inventory
      .filter((i) => i.status === "low" || i.status === "critical" || i.status === "out")
      .sort((a, b) => {
        const order = { out: 0, critical: 1, low: 2, good: 3 }
        return order[a.status] - order[b.status]
      })
  }, [inventory])

  // Recent stock movements
  const recentMovements = useMemo(() => {
    return stockLogs.slice(0, 20)
  }, [stockLogs])

  const handleExport = () => {
    // Create CSV data
    const headers = ["Ingredient", "Category", "Current Stock", "Unit", "Min Level", "Max Level", "Status", "Supplier", "Value"]
    const rows = inventory.map((item) => [
      item.ingredient.name,
      item.ingredient.category || "N/A",
      item.stock?.quantity || 0,
      item.ingredient.unit,
      item.ingredient.min_stock_level || 0,
      item.ingredient.max_stock_level || 0,
      item.status,
      item.supplier?.name || "N/A",
      ((item.stock?.quantity || 0) * (item.ingredient.cost_per_unit || 0)).toFixed(2),
    ])

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `inventory-report-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
  }

  const handleRefresh = () => {
    refetchInventory()
    refetchLogs()
  }

  const isLoading = inventoryLoading || logsLoading

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Inventory Reports</h1>
            <p className="text-muted-foreground">
              Stock levels, movements, and inventory analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {datePresets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-3xl font-bold">{summary.totalItems}</p>
                </div>
                <Package className="h-10 w-10 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>

          <Card className={summary.lowStockCount > 0 ? "border-yellow-500/50" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-3xl font-bold text-yellow-500">{summary.lowStockCount}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-yellow-500/30" />
              </div>
            </CardContent>
          </Card>

          <Card className={summary.outOfStockCount > 0 ? "border-red-500/50" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-500">{summary.outOfStockCount}</p>
                </div>
                <XCircle className="h-10 w-10 text-red-500/30" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Value</p>
                  <p className="text-3xl font-bold">{summary.totalStockValue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">JOD</p>
                </div>
                <TrendingUp className="h-10 w-10 text-emerald-500/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Stock Health
            </CardTitle>
            <CardDescription>
              {summary.healthyCount} of {summary.totalItems} items at healthy levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Health</span>
                <span className="font-medium">{summary.stockHealth.toFixed(1)}%</span>
              </div>
              <Progress value={summary.stockHealth} className="h-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Healthy ({summary.healthyCount})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Low ({summary.lowStockCount})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Out ({summary.outOfStockCount})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="movements">Movements</TabsTrigger>
            <TabsTrigger value="all-stock">All Items</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Stock Movement Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Stock Movement Summary
                  </CardTitle>
                  <CardDescription>
                    Activity in the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ArrowDown className="h-5 w-5 text-emerald-500" />
                      <span>Purchases/Restocks</span>
                    </div>
                    <span className="font-bold text-emerald-500">+{summary.totalPurchased.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ArrowUp className="h-5 w-5 text-blue-500" />
                      <span>Sales/Consumption</span>
                    </div>
                    <span className="font-bold text-blue-500">-{summary.totalSold.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Trash2 className="h-5 w-5 text-red-500" />
                      <span>Waste/Expired</span>
                    </div>
                    <span className="font-bold text-red-500">-{summary.totalWaste.toFixed(0)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Movement by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Activity by Type
                  </CardTitle>
                  <CardDescription>
                    {summary.movementCount} total movements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {logsByReason.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No movements in this period
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {logsByReason.slice(0, 6).map(({ reason, count }) => {
                        const config = reasonConfig[reason] || reasonConfig.other
                        return (
                          <div key={reason} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={config.color}>{config.icon}</span>
                              <span className="text-sm">{config.label}</span>
                            </div>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Low Stock Tab */}
          <TabsContent value="low-stock" className="space-y-4">
            {lowStockItems.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                    <p className="text-lg font-medium">All Stock Levels Healthy</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      No items are currently low on stock
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <Card key={item.id} className={
                    item.status === "out" ? "border-red-500/50" :
                      item.status === "critical" ? "border-orange-500/50" :
                        "border-yellow-500/50"
                  }>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${item.status === "out" ? "bg-red-500/10" :
                            item.status === "critical" ? "bg-orange-500/10" :
                              "bg-yellow-500/10"
                            }`}>
                            {item.status === "out" ? (
                              <XCircle className="h-6 w-6 text-red-500" />
                            ) : (
                              <AlertTriangle className={`h-6 w-6 ${item.status === "critical" ? "text-orange-500" : "text-yellow-500"
                                }`} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{item.ingredient.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.ingredient.category || "Uncategorized"} • {item.supplier?.name || "No supplier"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {formatStockQuantity(item.stock?.quantity || 0, item.ingredient.unit as Unit).display}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Min: {item.ingredient.min_stock_level || 0} {item.ingredient.unit}
                          </p>
                          <Badge variant={
                            item.status === "out" ? "destructive" :
                              item.status === "critical" ? "destructive" :
                                "secondary"
                          } className="mt-1">
                            {item.status === "out" ? "Out of Stock" :
                              item.status === "critical" ? "Critical" : "Low"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements" className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : recentMovements.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-lg font-medium text-muted-foreground">No Recent Movements</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Stock movements will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {recentMovements.map((log) => {
                      const config = reasonConfig[log.reason] || reasonConfig.other
                      const isPositive = log.change_amount > 0
                      return (
                        <div key={log.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
                              }`}>
                              <span className={config.color}>{config.icon}</span>
                            </div>
                            <div>
                              <p className="font-medium">{log.ingredient_id}</p>
                              <p className="text-sm text-muted-foreground">
                                {config.label} • {format(
                                  typeof (log.created_at as any)?.toDate === 'function'
                                    ? (log.created_at as any).toDate()
                                    : log.created_at instanceof Date
                                      ? log.created_at
                                      : new Date(log.created_at as string),
                                  "MMM d, h:mm a"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                              {isPositive ? "+" : ""}{log.change_amount}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* All Items Tab */}
          <TabsContent value="all-stock" className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {inventory.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.status === "good" ? "bg-emerald-500/10" :
                            item.status === "out" ? "bg-red-500/10" :
                              "bg-yellow-500/10"
                            }`}>
                            <Package className={`h-5 w-5 ${item.status === "good" ? "text-emerald-500" :
                              item.status === "out" ? "text-red-500" :
                                "text-yellow-500"
                              }`} />
                          </div>
                          <div>
                            <p className="font-medium">{item.ingredient.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.ingredient.category || "Uncategorized"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {formatStockQuantity(item.stock?.quantity || 0, item.ingredient.unit as Unit).display}
                          </p>
                          <Badge variant={
                            item.status === "good" ? "default" :
                              item.status === "out" ? "destructive" :
                                "secondary"
                          }>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
