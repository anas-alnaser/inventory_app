"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign,
  Ghost,
  RefreshCw,
  Sparkles,
  Check,
  X,
  Clock
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/lib/hooks/use-toast"
import { collection, query, where, orderBy, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { runAnomalyDetection } from "@/lib/services/ai-functions"
import { getIngredientById } from "@/lib/services"
import { cn } from "@/lib/utils"

interface Anomaly {
  id: string
  type: 'usage_spike' | 'theoretical_variance' | 'price_creep' | 'ghost_inventory' | 'expiry_risk' | 'stock_shortage' | 'excessive_waste' | 'price_anomaly' | 'sales_anomaly' | 'other'
  ingredient_id: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  details: {
    expected_value?: number
    actual_value?: number
    deviation_percent?: number
    z_score?: number
    supplier_id?: string
    price_change_percent?: number
    days_inactive?: number
  }
  ai_recommendation?: string
  created_at: any
  resolved: boolean
  ingredientName?: string
}

const anomalyTypeConfig = {
  usage_spike: {
    icon: TrendingUp,
    label: "Usage Spike",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  theoretical_variance: {
    icon: TrendingDown,
    label: "Usage Variance",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  price_creep: {
    icon: DollarSign,
    label: "Price Creep",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  ghost_inventory: {
    icon: Ghost,
    label: "Ghost Inventory",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  expiry_risk: {
    icon: Clock,
    label: "Expiry Risk",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  stock_shortage: {
    icon: Package,
    label: "Stock Shortage",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  excessive_waste: {
    icon: AlertTriangle,
    label: "Excessive Waste",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  price_anomaly: {
    icon: DollarSign,
    label: "Price Anomaly",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  sales_anomaly: {
    icon: TrendingDown,
    label: "Sales Anomaly",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  other: {
    icon: AlertTriangle,
    label: "Other",
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
  },
}

const severityConfig = {
  low: { color: "bg-blue-500/10 text-blue-600 border-blue-200", label: "Low" },
  medium: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", label: "Medium" },
  high: { color: "bg-orange-500/10 text-orange-600 border-orange-200", label: "High" },
  critical: { color: "bg-red-500/10 text-red-600 border-red-200", label: "Critical" },
}

async function fetchAnomalies(): Promise<Anomaly[]> {
  const anomaliesRef = collection(db, 'anomalies')
  const q = query(
    anomaliesRef,
    where('resolved', '==', false),
    orderBy('created_at', 'desc')
  )
  
  const snapshot = await getDocs(q)
  const anomalies = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Anomaly[]
  
  // Fetch ingredient names
  const enrichedAnomalies = await Promise.all(
    anomalies.map(async (anomaly) => {
      if (anomaly.ingredient_id) {
        try {
          const ingredient = await getIngredientById(anomaly.ingredient_id)
          return { ...anomaly, ingredientName: ingredient?.name }
        } catch {
          return anomaly
        }
      }
      return anomaly
    })
  )
  
  return enrichedAnomalies
}

async function resolveAnomaly(id: string): Promise<void> {
  const docRef = doc(db, 'anomalies', id)
  await updateDoc(docRef, { resolved: true })
}

function AnomalySkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-16 w-full mt-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AnomalyCard({ 
  anomaly, 
  onResolve 
}: { 
  anomaly: Anomaly
  onResolve: (id: string) => void 
}) {
  const config = anomalyTypeConfig[anomaly.type] || anomalyTypeConfig.other
  const severity = severityConfig[anomaly.severity]
  const Icon = config.icon

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      layout
    >
      <Card className={cn(
        "border-l-4 transition-colors",
        anomaly.severity === 'critical' && "border-l-red-500",
        anomaly.severity === 'high' && "border-l-orange-500",
        anomaly.severity === 'medium' && "border-l-yellow-500",
        anomaly.severity === 'low' && "border-l-blue-500"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.bgColor)}>
              <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className={severity.color}>
                  {severity.label}
                </Badge>
                <Badge variant="secondary">{config.label}</Badge>
                {anomaly.ingredientName && (
                  <span className="text-sm text-muted-foreground">
                    • {anomaly.ingredientName}
                  </span>
                )}
              </div>
              
              <p className="text-sm font-medium text-foreground mb-2">
                {anomaly.description}
              </p>
              
              {anomaly.ai_recommendation && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">AI Recommendation</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {anomaly.ai_recommendation}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">
                  Detected {formatDate(anomaly.created_at)}
                </span>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResolve(anomaly.id)}
                    className="gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Resolve
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function AnomaliesPage() {
  const queryClient = useQueryClient()
  const [isRunning, setIsRunning] = useState(false)
  
  const { data: anomalies = [], isLoading, error } = useQuery({
    queryKey: ['anomalies'],
    queryFn: fetchAnomalies,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
  
  const resolveMutation = useMutation({
    mutationFn: resolveAnomaly,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anomalies'] })
      toast({
        title: "Anomaly Resolved",
        description: "The anomaly has been marked as resolved.",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve anomaly. Please try again.",
        variant: "destructive",
      })
    },
  })
  
  const handleRunDetection = async () => {
    setIsRunning(true)
    try {
      const result = await runAnomalyDetection()
      const totalFound = Object.values(result.results).reduce((sum, v) => sum + (v || 0), 0)
      
      queryClient.invalidateQueries({ queryKey: ['anomalies'] })
      
      toast({
        title: "Detection Complete",
        description: totalFound > 0 
          ? `Found ${totalFound} new anomalies.`
          : "No new anomalies detected.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to run anomaly detection.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  // Group anomalies by severity
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical')
  const highAnomalies = anomalies.filter(a => a.severity === 'high')
  const otherAnomalies = anomalies.filter(a => a.severity !== 'critical' && a.severity !== 'high')

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Anomalies</h1>
          <p className="text-muted-foreground">AI-detected issues and unusual patterns</p>
        </div>
        <Button 
          onClick={handleRunDetection} 
          disabled={isRunning}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isRunning && "animate-spin")} />
          {isRunning ? "Scanning..." : "Run Detection"}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <AnomalySkeleton />
          <AnomalySkeleton />
          <AnomalySkeleton />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Error Loading Anomalies</h3>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "Failed to load anomalies"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Clear State */}
      {!isLoading && !error && anomalies.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-success/20 bg-success/5">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-success mb-2">All Clear!</h2>
                  <p className="text-muted-foreground max-w-md">
                    No anomalies detected in your inventory. Everything looks normal.
                  </p>
                </div>
                <Button variant="outline" onClick={handleRunDetection} disabled={isRunning}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isRunning && "animate-spin")} />
                  Run Detection Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Anomalies List */}
      {!isLoading && !error && anomalies.length > 0 && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm font-medium">Critical</span>
                  <span className="ml-auto text-2xl font-bold">{criticalAnomalies.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                  <span className="text-sm font-medium">High</span>
                  <span className="ml-auto text-2xl font-bold">{highAnomalies.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm font-medium">Medium/Low</span>
                  <span className="ml-auto text-2xl font-bold">{otherAnomalies.length}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total</span>
                  <span className="ml-auto text-2xl font-bold">{anomalies.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Anomalies */}
          {criticalAnomalies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Critical Issues
              </h3>
              <AnimatePresence mode="popLayout">
                {criticalAnomalies.map((anomaly) => (
                  <AnomalyCard
                    key={anomaly.id}
                    anomaly={anomaly}
                    onResolve={(id) => resolveMutation.mutate(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* High Priority Anomalies */}
          {highAnomalies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-orange-600 uppercase tracking-wider">
                High Priority
              </h3>
              <AnimatePresence mode="popLayout">
                {highAnomalies.map((anomaly) => (
                  <AnomalyCard
                    key={anomaly.id}
                    anomaly={anomaly}
                    onResolve={(id) => resolveMutation.mutate(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Other Anomalies */}
          {otherAnomalies.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Other Issues
              </h3>
              <AnimatePresence mode="popLayout">
                {otherAnomalies.map((anomaly) => (
                  <AnomalyCard
                    key={anomaly.id}
                    anomaly={anomaly}
                    onResolve={(id) => resolveMutation.mutate(id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI-Powered Detection</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Our AI continuously monitors your inventory for unusual patterns, including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Usage Spikes</strong> - Sudden increases in ingredient usage</li>
              <li><strong>Theoretical Variance</strong> - Discrepancies between expected and actual usage</li>
              <li><strong>Price Creep</strong> - Gradual supplier price increases</li>
              <li><strong>Ghost Inventory</strong> - Items in stock but not moving</li>
            </ul>
            <p className="pt-2">
              Anomalies are detected automatically on a daily schedule, or you can run detection manually.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
