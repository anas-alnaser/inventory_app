"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  AlertTriangle 
} from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"
import { format, subDays, startOfDay, isSameDay, eachDayOfInterval } from "date-fns"

import { getStockLogsByDateRange, getIngredients, type StockLog, type Ingredient } from "@/lib/services"

// Helper to safely convert Firebase Timestamp/Date/String to Date object
function toDate(date: any): Date {
  if (!date) return new Date()
  if (date instanceof Date) return date
  if (date.toDate) return date.toDate() // Firebase Timestamp
  return new Date(date)
}

const COLORS = {
  primary: "#06b6d4", // Cyan-500
  success: "#22c55e", // Green-500
  warning: "#f97316", // Orange-500
  destructive: "#ef4444", // Red-500
  secondary: "#94a3b8", // Slate-400
}

export default function ReportsPage() {
  const [dateRange] = useState(30) // Default to 30 days

  // Fetch data
  const { data: ingredients = [], isLoading: isLoadingIngredients } = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => getIngredients(),
  })

  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ["stock-logs", dateRange],
    queryFn: async () => {
      const endDate = new Date()
      const startDate = subDays(endDate, dateRange)
      return getStockLogsByDateRange(startDate, endDate)
    },
  })

  const isLoading = isLoadingIngredients || isLoadingLogs

  // Process Data
  const stats = useMemo(() => {
    if (isLoading) return null

    let totalSpend = 0
    let totalWasteValue = 0
    let totalWasteCount = 0
    let netUsageCount = 0

    const ingredientMap = new Map<string, Ingredient>(
      ingredients.map(i => [i.id, i])
    )

    logs.forEach(log => {
      const ingredient = ingredientMap.get(log.ingredient_id)
      const cost = ingredient?.cost_per_unit || 0
      const amount = Math.abs(log.change_amount)
      
      if (log.reason === 'purchase') {
        totalSpend += amount * cost
      } else if (log.reason === 'waste' || log.reason === 'expired') {
        totalWasteValue += amount * cost
        totalWasteCount += amount
      } else if (log.change_amount < 0) {
        // Usage (sale, production, etc.)
        netUsageCount += 1 // Counting transactions
      }
    })

    return {
      totalSpend,
      totalWasteValue,
      totalWasteCount,
      netUsageCount
    }
  }, [logs, ingredients, isLoading])

  // Chart 1: Activity Over Time
  const activityData = useMemo(() => {
    if (isLoading) return []

    const endDate = new Date()
    const startDate = subDays(endDate, dateRange)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return days.map(day => {
      const dayLogs = logs.filter(log => isSameDay(toDate(log.created_at), day))
      
      const added = dayLogs
        .filter(l => l.change_amount > 0)
        .reduce((sum, l) => sum + l.change_amount, 0)
        
      const removed = dayLogs
        .filter(l => l.change_amount < 0)
        .reduce((sum, l) => sum + Math.abs(l.change_amount), 0)

      return {
        date: format(day, "MMM dd"),
        added,
        removed
      }
    })
  }, [logs, dateRange, isLoading])

  // Chart 2: Top 5 Most Used Ingredients
  const topIngredientsData = useMemo(() => {
    if (isLoading) return []

    const usageMap = new Map<string, number>()
    const ingredientMap = new Map<string, string>(
      ingredients.map(i => [i.id, i.name])
    )

    logs.forEach(log => {
      if (log.change_amount < 0 && log.reason !== 'waste' && log.reason !== 'expired') {
        const current = usageMap.get(log.ingredient_id) || 0
        usageMap.set(log.ingredient_id, current + Math.abs(log.change_amount))
      }
    })

    return Array.from(usageMap.entries())
      .map(([id, amount]) => ({
        name: ingredientMap.get(id) || "Unknown",
        amount
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
  }, [logs, ingredients, isLoading])

  // Chart 3: Usage Reasons
  const reasonsData = useMemo(() => {
    if (isLoading) return []

    const reasons = {
      consumption: 0,
      waste: 0,
      expired: 0,
      adjustment: 0
    }

    logs.forEach(log => {
      if (log.change_amount < 0) {
        const amount = Math.abs(log.change_amount)
        if (log.reason === 'waste') reasons.waste += amount
        else if (log.reason === 'expired') reasons.expired += amount
        else if (log.reason === 'adjustment') reasons.adjustment += amount
        else reasons.consumption += amount // sale, production, etc.
      }
    })

    return [
      { name: "Consumption", value: reasons.consumption, color: COLORS.primary },
      { name: "Waste", value: reasons.waste, color: COLORS.warning },
      { name: "Expired", value: reasons.expired, color: COLORS.destructive },
      { name: "Adjustment", value: reasons.adjustment, color: COLORS.secondary },
    ].filter(item => item.value > 0)
  }, [logs, isLoading])

  if (isLoading) {
    return <ReportsSkeleton />
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Overview for the last {dateRange} days</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Spend"
          value={`${stats?.totalSpend.toFixed(2)} JOD`}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="Cost of purchased stock"
        />
        <StatsCard
          title="Total Waste"
          value={`${stats?.totalWasteValue.toFixed(2)} JOD`}
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          description={`${stats?.totalWasteCount.toFixed(0)} units wasted`}
          className="border-destructive/20 bg-destructive/5"
        />
        <StatsCard
          title="Net Usage Transactions"
          value={stats?.netUsageCount.toString() || "0"}
          icon={<TrendingUp className="h-4 w-4 text-success" />}
          description="Total usage events recorded"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-1 lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Stock Activity</CardTitle>
              <CardDescription>Stock Added vs Removed over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRemoved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)" 
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="added" 
                      name="Stock Added"
                      stroke={COLORS.success} 
                      fillOpacity={1} 
                      fill="url(#colorAdded)" 
                      strokeWidth={2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="removed" 
                      name="Stock Used"
                      stroke={COLORS.primary} 
                      fillOpacity={1} 
                      fill="url(#colorRemoved)" 
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chart 2: Top Ingredients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Top 5 Most Used Items</CardTitle>
              <CardDescription>By quantity consumed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topIngredientsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100}
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)" 
                      }}
                    />
                    <Bar dataKey="amount" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chart 3: Usage Reasons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Usage Breakdown</CardTitle>
              <CardDescription>Consumption vs Waste</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasonsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {reasonsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "var(--radius)" 
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon, description, className }: any) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function ReportsSkeleton() {
  return (
    <div className="px-4 py-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] col-span-2 rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>
  )
}
