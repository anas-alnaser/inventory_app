"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { StatusTicker } from "@/components/dashboard/StatusTicker"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { AIInsightCard } from "@/components/dashboard/AIInsightCard"
import { getGreeting } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/useAuth"
import { 
  getIngredients, 
  getStockLogs, 
  listenToInventoryWithStock,
  calculateStockStatus,
  type InventoryItem 
} from "@/lib/services"
import { getAllUsers } from "@/lib/services"
import { getMostCriticalForecast } from "@/lib/ai/forecast"
import { Skeleton } from "@/components/ui/skeleton"

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

  // Real-time inventory listener
  useEffect(() => {
    const unsubscribe = listenToInventoryWithStock((inventoryData) => {
      setInventory(inventoryData)
    })
    return () => unsubscribe()
  }, [])

  // Calculate dashboard stats
  const totalItems = ingredients.length
  const lowStockItems = inventory.filter(item => 
    item.status === 'low' || item.status === 'critical' || item.status === 'out'
  )
  const outOfStockItems = inventory.filter(item => item.status === 'out')
  const criticalItems = inventory.filter(item => item.status === 'critical')
  
  const totalValue = inventory.reduce((sum, item) => {
    const stockQuantity = item.stock?.quantity || 0
    const costPerUnit = item.ingredient.cost_per_unit || 0
    // Convert stock quantity back to display units for calculation
    // For simplicity, we'll use the base unit cost
    return sum + (stockQuantity * costPerUnit)
  }, 0)

  // Build status items from real data
  const statusItems = []
  
  if (outOfStockItems.length > 0) {
    const itemNames = outOfStockItems.slice(0, 3).map(item => item.ingredient.name).join(", ")
    statusItems.push({
      id: "out-of-stock",
      type: "critical" as const,
      title: "Out of Stock",
      description: itemNames || `${outOfStockItems.length} items`,
      count: outOfStockItems.length,
    })
  }

  if (criticalItems.length > 0) {
    statusItems.push({
      id: "critical",
      type: "warning" as const,
      title: "Critical Stock",
      description: `${criticalItems.length} items need immediate attention`,
      count: criticalItems.length,
    })
  }

  if (lowStockItems.length > 0 && outOfStockItems.length === 0) {
    statusItems.push({
      id: "low-stock",
      type: "warning" as const,
      title: "Low Stock",
      description: `${lowStockItems.length} items below minimum level`,
      count: lowStockItems.length,
    })
  }

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
      description: `AI predicts you will run out of ${criticalForecast.ingredientName} by ${criticalForecast.predictedRunOutDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'soon'}. ${criticalForecast.recommendedReorderAmount ? `Consider ordering ${criticalForecast.recommendedReorderAmount.toFixed(0)} ${ingredients.find(i => i.id === criticalForecast.ingredientId)?.unit || 'units'} to maintain optimal stock levels.` : 'Consider reordering soon.'}`,
      action: {
        label: "View Forecasts",
        href: "/forecasts",
      },
      confidence: Math.round(criticalForecast.confidence),
    },
  ] : []

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-lg border p-4"
        >
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-2xl font-bold">{totalItems}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-lg border p-4"
        >
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <p className="text-2xl font-bold text-warning">{lowStockItems.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-lg border p-4"
        >
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold">{totalValue.toFixed(2)} JOD</p>
        </motion.div>
      </div>

      {/* Status Ticker */}
      <section>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
        >
          Needs Attention
        </motion.h2>
        {statusItems.length > 0 ? (
          <StatusTicker items={statusItems} />
        ) : (
          <div className="bg-card rounded-lg border p-4 text-center text-muted-foreground">
            All items are well stocked! 🎉
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
        >
          Quick Actions
        </motion.h2>
        <QuickActions />
      </section>

      {/* AI Insights */}
      <section>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
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
      <section>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3"
        >
          Recent Activity
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-lg border p-4 space-y-3"
        >
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">
                    {activity.item} by {activity.user}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No recent activity
            </div>
          )}
        </motion.div>
      </section>
    </div>
  )
}

