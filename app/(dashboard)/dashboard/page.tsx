"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { QuickOperationDialog } from "@/components/dashboard/QuickOperationDialog"
import { AIInsightCard } from "@/components/dashboard/AIInsightCard"
import { useAuth } from "@/lib/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { 
  getIngredients, 
  getStockLogs, 
  getPurchaseOrders,
  listenToInventoryWithStock,
  type InventoryItem 
} from "@/lib/services"
import { getAllUsers } from "@/lib/services"
import { getMostCriticalForecast } from "@/lib/ai/forecast"
import { 
  Truck, 
  AlertTriangle, 
  DollarSign, 
  Package, 
  CheckCircle2, 
  Archive
} from "lucide-react"
import { cn } from "@/lib/utils"

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatTimeAgo(date: Date | string | any): string {
  try {
    let logDate: Date
    if (typeof date === 'string') {
      logDate = new Date(date)
    } else if (date?.toDate) {
      logDate = date.toDate()
    } else if (date instanceof Date) {
      logDate = date
    } else {
      return "Just now"
    }

    const now = new Date()
    const diffMs = now.getTime() - logDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return logDate.toLocaleDateString()
  } catch {
    return "Just now"
  }
}

export default function DashboardPage() {
  const { userData } = useAuth()
  const greeting = getGreeting()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [restockId, setRestockId] = useState<string | null>(null)

  // Fetch ingredients count
  const { data: ingredients = [] } = useQuery({
    queryKey: ["dashboard-ingredients"],
    queryFn: () => getIngredients(),
  })

  // Fetch recent stock logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ["dashboard-logs"],
    queryFn: () => getStockLogs(undefined, 5),
  })

  // Fetch users for activity display
  const { data: users = [] } = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: () => getAllUsers(),
  })

  // Fetch active purchase orders for incoming deliveries
  const { data: activeOrders = [] } = useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: () => getPurchaseOrders('active'),
  })

  // Real-time inventory listener
  useEffect(() => {
    const unsubscribe = listenToInventoryWithStock((inventoryData) => {
      setInventory(inventoryData)
    })
    return () => unsubscribe()
  }, [])

  // Calculate dashboard stats
  const totalItems = ingredients.length
  
  // Calculate incoming deliveries for today
  const today = new Date()
  const incomingDeliveries = activeOrders.filter(order => {
    if (!order.expected_delivery_date) return false
    
    // Handle Firestore timestamp or Date object or string
    let date: Date
    if (order.expected_delivery_date instanceof Date) {
      date = order.expected_delivery_date
    } else if ((order.expected_delivery_date as any).toDate) {
      date = (order.expected_delivery_date as any).toDate()
    } else {
      date = new Date(order.expected_delivery_date as any)
    }
    
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  })

  const uniqueSuppliers = new Set(incomingDeliveries.map(o => o.supplier_name)).size

  const lowStockItems = inventory.filter(item => {
    const minLevel = item.ingredient.min_stock_level || 0
    // Only include items that are low but NOT out of stock
    return item.stock?.quantity! > 0 && item.stock?.quantity! <= minLevel
  })
  const outOfStockItems = inventory.filter(item => (item.stock?.quantity || 0) <= 0)
  
  const totalValue = inventory.reduce((sum, item) => {
    const stockQuantity = item.stock?.quantity || 0
    const costPerUnit = item.ingredient.cost_per_unit || 0
    return sum + (stockQuantity * costPerUnit)
  }, 0)

  // Needs Attention items (Out of Stock + Low Stock)
  const needsAttentionItems = [...outOfStockItems, ...lowStockItems]

  // Format recent activity from stock logs
  const recentActivity = recentLogs.map((log) => {
    const user = users.find(u => u.id === log.user_id)
    const ingredient = ingredients.find(i => i.id === log.ingredient_id)
    const userName = user?.name || "Unknown User"
    const ingredientName = ingredient?.name || "Unknown Item"
    
    const isPositive = log.change_amount > 0
    const action = isPositive ? "Stock Added" : "Stock Used"
    const amount = Math.abs(log.change_amount)
    
    // Format time
    const timeAgo = formatTimeAgo(log.created_at)

    return {
      action,
      item: `${ingredientName} (${amount.toFixed(0)} ${ingredient?.unit || 'units'})`,
      user: userName,
      time: timeAgo,
    }
  })

  // Fetch most critical forecast for AI Insight
  const { data: criticalForecast, isLoading: forecastLoading } = useQuery({
    queryKey: ["critical-forecast"],
    queryFn: () => getMostCriticalForecast(),
    refetchInterval: 60000, // Refetch every minute
  })

  // Build AI insights from real forecast data
  const aiInsights = criticalForecast ? [
    {
      id: criticalForecast.ingredientId,
      type: "forecast" as const,
      title: `${criticalForecast.ingredientName} Running Low`,
      description: `AI predicts you will run out of ${criticalForecast.ingredientName} by ${criticalForecast.predictedRunOutDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'soon'}.`,
      action: {
        label: "View Forecasts",
        href: "/forecasts",
      },
      confidence: Math.round(criticalForecast.confidence),
    },
  ] : []

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-8 pb-20">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {greeting}, {userData?.name || "User"}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s your inventory overview.
        </p>
      </motion.div>

      {/* Top KPI Cards (Hero) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Value - Star Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-card to-cyan-950/20 p-6 shadow-[0_0_20px_rgba(8,145,178,0.1)]"
        >
          <div className="relative z-10">
            <p className="text-sm font-medium text-cyan-500 mb-1">Total Inventory Value</p>
            <h3 className="text-3xl font-bold tracking-tight text-foreground">
              {totalValue.toLocaleString('en-US', { style: 'currency', currency: 'JOD' })}
            </h3>
          </div>
          <DollarSign className="absolute -bottom-4 -right-4 h-32 w-32 text-cyan-500/5 rotate-12" />
        </motion.div>

        {/* Incoming Today */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-muted p-6"
        >
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">Incoming Today</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold tracking-tight text-foreground">
                {incomingDeliveries.length}
              </h3>
              <span className="text-sm text-muted-foreground">deliveries</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {uniqueSuppliers > 0 
                ? `${uniqueSuppliers} Supplier${uniqueSuppliers !== 1 ? 's' : ''} arriving`
                : 'No deliveries expected'
              }
            </p>
          </div>
          <Truck className="absolute -bottom-4 -right-4 h-32 w-32 text-primary/5 rotate-12" />
        </motion.div>

        {/* Total Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-muted p-6"
        >
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Items</p>
            <h3 className="text-3xl font-bold tracking-tight text-foreground">
              {totalItems}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Active ingredients
            </p>
          </div>
          <Package className="absolute -bottom-4 -right-4 h-32 w-32 text-primary/5 rotate-12" />
        </motion.div>
      </div>

      {/* Stock Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Out of Stock - Red */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-red-500/20 bg-red-500/5 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="font-semibold text-red-500">Out of Stock</h3>
            </div>
            <span className="text-2xl font-bold text-red-500 tracking-tight">
              {outOfStockItems.length}
            </span>
          </div>
          
          {outOfStockItems.length > 0 ? (
            <div className="space-y-3">
              <div className="max-h-[120px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {outOfStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-background/50 border border-red-500/10">
                    <span className="text-sm font-medium truncate flex-1 mr-2">{item.ingredient.name}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => setRestockId(item.id)}
                    >
                      Restock
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">All clear, fully stocked.</span>
            </div>
          )}
        </motion.div>

        {/* Low Stock - Amber */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-yellow-500/10">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
              <h3 className="font-semibold text-yellow-500">Low Stock</h3>
            </div>
            <span className="text-2xl font-bold text-yellow-500 tracking-tight">
              {lowStockItems.length}
            </span>
          </div>

          {lowStockItems.length > 0 ? (
            <div className="space-y-3">
              <div className="max-h-[120px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-background/50 border border-yellow-500/10">
                    <div className="flex flex-col overflow-hidden mr-2">
                      <span className="text-sm font-medium truncate">{item.ingredient.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.stock?.quantity} {item.ingredient.unit} left
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10"
                      onClick={() => setRestockId(item.id)}
                    >
                      Restock
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm">Stock levels look good.</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Needs Attention Section (Mini Cards) */}
      {needsAttentionItems.length > 0 && (
        <section className="space-y-3">
           <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1"
          >
            Needs Attention
          </motion.h2>
          
          <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 custom-scrollbar scroll-smooth">
            {needsAttentionItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
                className="flex-shrink-0 w-[180px] bg-card rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col h-full justify-between gap-3">
                  <div>
                    <h4 className="font-semibold truncate text-sm mb-1" title={item.ingredient.name}>
                      {item.ingredient.name}
                    </h4>
                    <p className={cn(
                      "text-xs font-medium",
                      (item.stock?.quantity || 0) <= 0 ? "text-red-500" : "text-yellow-500"
                    )}>
                      {(item.stock?.quantity || 0) <= 0 ? "Out of Stock" : `${item.stock?.quantity} ${item.ingredient.unit} left`}
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full h-8 text-xs"
                    onClick={() => setRestockId(item.id)}
                  >
                    Order
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="space-y-3">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1"
        >
          Quick Actions
        </motion.h2>
        <QuickActions />
      </section>

      {/* AI Insights & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <section className="space-y-3">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1"
          >
            AI Insights
          </motion.h2>
          <AIInsightCard 
            insights={aiInsights} 
            isLoading={forecastLoading}
            isEligible={aiInsights.length > 0 || !forecastLoading} 
          />
        </section>

        {/* Recent Activity */}
        <section className="space-y-3">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pl-1"
          >
            Recent Activity
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-card rounded-xl border p-4 space-y-1 h-full min-h-[160px]"
          >
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      activity.action === "Stock Added" ? "bg-green-500/10 text-green-500" : "bg-orange-500/10 text-orange-500"
                    )}>
                      {activity.action === "Stock Added" ? <Archive className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{activity.item}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.action} by {activity.user}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
                <Archive className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </motion.div>
        </section>
      </div>

      <QuickOperationDialog
        isOpen={!!restockId}
        onClose={() => setRestockId(null)}
        mode="add"
        preselectedIngredientId={restockId || undefined}
      />
    </div>
  )
}
