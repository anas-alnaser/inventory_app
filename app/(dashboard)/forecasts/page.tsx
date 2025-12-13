"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useQuery, useMutation } from "@tanstack/react-query"
import { 
  Sparkles, 
  AlertTriangle, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Package, 
  RefreshCw,
  ChevronRight,
  Clock,
  Lightbulb
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/lib/hooks/use-toast"
import { generateAllForecasts, type ForecastResult } from "@/lib/ai/forecast"
import { getIngredients, getAllStock } from "@/lib/services"
import { 
  generateForecast as generateAIForecast, 
  getMenuDrivenForecast,
  getParLevelRecommendation,
  getExpiryRisks,
  type ExpiryRisk,
  type MenuDrivenForecastItem
} from "@/lib/services/ai-functions"
import { formatSmartQuantity } from "@/lib/utils/unit-conversion"
import { cn } from "@/lib/utils"
import Link from "next/link"

function ForecastTableSkeleton() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ingredient</TableHead>
            <TableHead>Current Stock</TableHead>
            <TableHead>Avg Daily Usage</TableHead>
            <TableHead>Days Remaining</TableHead>
            <TableHead>Predicted Run-out</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

function ExpiryRiskCard({ risk, ingredientName }: { risk: ExpiryRisk; ingredientName?: string }) {
  const riskColors = {
    low: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20',
    medium: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20',
    high: 'border-orange-200 bg-orange-50 dark:bg-orange-950/20',
    critical: 'border-red-200 bg-red-50 dark:bg-red-950/20',
  }

  return (
    <Card className={cn("border-l-4", riskColors[risk.risk_level])}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            risk.risk_level === 'critical' ? "bg-red-500/10" : "bg-amber-500/10"
          )}>
            <Clock className={cn(
              "h-5 w-5",
              risk.risk_level === 'critical' ? "text-red-500" : "text-amber-500"
            )} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{ingredientName || 'Unknown Ingredient'}</h4>
              <Badge variant={risk.risk_level === 'critical' ? 'destructive' : 'secondary'}>
                {risk.risk_level}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Expires in <strong>{risk.days_until_expiry} days</strong></p>
              <p>Predicted waste: <strong>{risk.predicted_waste.toFixed(1)}</strong> units</p>
            </div>
            
            {risk.ai_recommendation && (
              <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">AI Suggestion</span>
                </div>
                <p className="text-sm text-muted-foreground">{risk.ai_recommendation}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ForecastsPage() {
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null)
  const [parLevelData, setParLevelData] = useState<any>(null)

  // Fetch ingredients
  const { data: ingredients = [] } = useQuery({
    queryKey: ["forecast-ingredients"],
    queryFn: () => getIngredients(),
  })

  // Fetch all stock
  const { data: stockItems = [] } = useQuery({
    queryKey: ["all-stock"],
    queryFn: () => getAllStock(),
  })

  // Generate local forecasts
  const { data: forecasts = [], isLoading: forecastsLoading, refetch: refetchForecasts } = useQuery({
    queryKey: ["forecasts"],
    queryFn: () => generateAllForecasts(),
    refetchInterval: 60000,
  })

  // Fetch expiry risks
  const { data: expiryRisksData, isLoading: expiryLoading } = useQuery({
    queryKey: ["expiry-risks"],
    queryFn: async () => {
      try {
        return await getExpiryRisks()
      } catch (error) {
        console.error('Error fetching expiry risks:', error)
        return { success: false, risks: [] }
      }
    },
    refetchInterval: 300000, // 5 minutes
  })

  // Fetch menu-driven forecast
  const { data: menuForecastData, isLoading: menuForecastLoading } = useQuery({
    queryKey: ["menu-forecast"],
    queryFn: async () => {
      try {
        return await getMenuDrivenForecast(7)
      } catch (error) {
        console.error('Error fetching menu forecast:', error)
        return { success: false, requirements: [], days: 7 }
      }
    },
    refetchInterval: 300000,
  })

  // Par level mutation
  const parLevelMutation = useMutation({
    mutationFn: async (ingredientId: string) => {
      return await getParLevelRecommendation(ingredientId, 3)
    },
    onSuccess: (data) => {
      setParLevelData(data)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get par level recommendation",
        variant: "destructive",
      })
    },
  })

  // Filter forecasts that have data
  const validForecasts = forecasts.filter(f => f.averageDailyUsage > 0 && f.daysRemaining < Infinity)
  const sortedForecasts = [...validForecasts].sort((a, b) => a.daysRemaining - b.daysRemaining)
  const criticalForecasts = sortedForecasts.filter(f => f.needsReorder)

  // Get unit type helper
  const getUnitType = (unit: string): 'weight' | 'volume' | 'count' => {
    if (['g', 'kg'].includes(unit)) return 'weight'
    if (['mL', 'L'].includes(unit)) return 'volume'
    return 'count'
  }

  // Format date helper
  const formatDate = (date: Date | null): string => {
    if (!date) return "N/A"
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Get ingredient info
  const getIngredientInfo = (ingredientId: string) => {
    const ingredient = ingredients.find(i => i.id === ingredientId)
    const stock = stockItems.find(s => s.ingredient_id === ingredientId)
    return { ingredient, stock }
  }

  const handleViewParLevels = (ingredientId: string) => {
    setSelectedIngredient(ingredientId)
    parLevelMutation.mutate(ingredientId)
  }

  const expiryRisks = expiryRisksData?.risks || []
  const menuRequirements = menuForecastData?.requirements || []

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Forecasts</h1>
          <p className="text-muted-foreground">Predictive analytics powered by AI</p>
        </div>
        <Button onClick={() => refetchForecasts()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {!forecastsLoading && sortedForecasts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className={criticalForecasts.length > 0 ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  criticalForecasts.length > 0 ? "bg-red-500/10" : "bg-green-500/10"
                )}>
                  {criticalForecasts.length > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Package className="h-5 w-5 text-green-500" />
                  )}
                </div>
                <div>
                  <p className="text-2xl font-bold">{criticalForecasts.length}</p>
                  <p className="text-sm text-muted-foreground">Items need reorder</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{sortedForecasts.length}</p>
                  <p className="text-sm text-muted-foreground">Items tracked</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{expiryRisks.length}</p>
                  <p className="text-sm text-muted-foreground">Expiry risks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="runout" className="space-y-4">
        <TabsList>
          <TabsTrigger value="runout">Run-out Predictions</TabsTrigger>
          <TabsTrigger value="menu">Menu-Driven</TabsTrigger>
          <TabsTrigger value="expiry">Expiry Risks</TabsTrigger>
        </TabsList>

        {/* Run-out Predictions Tab */}
        <TabsContent value="runout" className="space-y-4">
          {/* Info Card - Show only if no forecasts */}
          {!forecastsLoading && validForecasts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>AI Learning in Progress</CardTitle>
                      <CardDescription>
                        Our AI needs usage data from stock logs to generate accurate predictions
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Continue logging your inventory usage daily</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingDown className="h-4 w-4" />
                      <span>AI will learn your patterns and consumption rates</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Forecasts will appear automatically once enough data is collected</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Forecasts Table */}
          {forecastsLoading ? (
            <ForecastTableSkeleton />
          ) : sortedForecasts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Inventory Forecasts</CardTitle>
                <CardDescription>
                  Seasonality-aware predictions based on your usage patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Avg Daily Usage</TableHead>
                      <TableHead>Days Remaining</TableHead>
                      <TableHead>Predicted Run-out</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedForecasts.map((forecast) => {
                      const { ingredient } = getIngredientInfo(forecast.ingredientId)
                      const unit = ingredient?.unit || 'units'
                      const unitType = getUnitType(unit)
                      const isCritical = forecast.needsReorder

                      return (
                        <TableRow
                          key={forecast.ingredientId}
                          className={cn(
                            isCritical && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                          )}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{forecast.ingredientName}</span>
                              {isCritical && (
                                <Badge variant="destructive" className="ml-2">
                                  Critical
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatSmartQuantity(forecast.currentStock, unitType)}
                          </TableCell>
                          <TableCell>
                            {formatSmartQuantity(forecast.averageDailyUsage, unitType)}/day
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {forecast.daysRemaining === Infinity ? (
                                <span className="text-muted-foreground">∞</span>
                              ) : (
                                <>
                                  <span className={cn(
                                    "font-semibold",
                                    isCritical ? "text-red-600 dark:text-red-400" : "text-foreground"
                                  )}>
                                    {Math.ceil(forecast.daysRemaining)}
                                  </span>
                                  <span className="text-muted-foreground">days</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {forecast.predictedRunOutDate ? (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className={cn(
                                  isCritical && "font-semibold text-red-600 dark:text-red-400"
                                )}>
                                  {formatDate(forecast.predictedRunOutDate)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={forecast.confidence >= 70 ? "default" : "outline"}>
                              {forecast.confidence}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewParLevels(forecast.ingredientId)}
                              >
                                Par Levels
                              </Button>
                              {isCritical && (
                                <Link href="/suppliers">
                                  <Button size="sm" variant="destructive">
                                    Reorder
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {/* Menu-Driven Forecast Tab */}
        <TabsContent value="menu" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Menu-Driven Ingredient Forecast
              </CardTitle>
              <CardDescription>
                Predicted ingredient requirements based on expected menu item sales for the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {menuForecastLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : menuRequirements.length > 0 ? (
                <div className="space-y-3">
                  {menuRequirements.map((req) => {
                    const { ingredient, stock } = getIngredientInfo(req.ingredientId)
                    const currentStock = stock?.quantity || 0
                    const shortage = req.requiredQuantity - currentStock

                    return (
                      <div
                        key={req.ingredientId}
                        className={cn(
                          "p-4 rounded-lg border",
                          shortage > 0 ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : "border-border"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{ingredient?.name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">
                              Used in: {req.usedInMenuItems.join(', ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              Need: {req.requiredQuantity.toFixed(1)} {ingredient?.unit || 'units'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Have: {currentStock.toFixed(1)}
                            </p>
                            {shortage > 0 && (
                              <Badge variant="destructive" className="mt-1">
                                Short {shortage.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No menu-driven forecast data available.</p>
                  <p className="text-sm">Add recipes to menu items to enable this feature.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expiry Risks Tab */}
        <TabsContent value="expiry" className="space-y-4">
          {expiryLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-16 w-full mt-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : expiryRisks.length > 0 ? (
            <div className="space-y-3">
              {expiryRisks.map((risk, index) => {
                const { ingredient } = getIngredientInfo(risk.ingredient_id)
                return (
                  <ExpiryRiskCard
                    key={index}
                    risk={risk}
                    ingredientName={ingredient?.name}
                  />
                )
              })}
            </div>
          ) : (
            <Card className="border-success/20 bg-success/5">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                    <Package className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-success mb-2">No Expiry Risks</h2>
                    <p className="text-muted-foreground max-w-md">
                      All stock items with expiry dates are predicted to be used before expiration.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Par Level Dialog */}
      <Dialog open={!!selectedIngredient} onOpenChange={() => setSelectedIngredient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Par Level Recommendation</DialogTitle>
            <DialogDescription>
              AI-calculated safety stock levels based on usage patterns
            </DialogDescription>
          </DialogHeader>
          
          {parLevelMutation.isPending ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          ) : parLevelData ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Recommended Min</p>
                    <p className="text-2xl font-bold text-orange-500">{parLevelData.recommendedMin}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Recommended Max</p>
                    <p className="text-2xl font-bold text-green-500">{parLevelData.recommendedMax}</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Average Daily Usage</span>
                  <span className="font-medium">{parLevelData.avgDailyUsage.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Usage Variance</span>
                  <span className="font-medium">{parLevelData.usageVariance.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary">Tip</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Set your minimum stock level to {parLevelData.recommendedMin} and reorder when you 
                  hit this level to maintain a 3-day safety buffer.
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
