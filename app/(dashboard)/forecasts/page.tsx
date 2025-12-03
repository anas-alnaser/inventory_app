"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { Sparkles, AlertTriangle, Calendar, TrendingDown, ExternalLink, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { generateAllForecasts, type ForecastResult } from "@/lib/ai/forecast"
import { getIngredients } from "@/lib/services"
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

export default function ForecastsPage() {
  const [selectedForecast, setSelectedForecast] = useState<ForecastResult | null>(null)

  // Fetch ingredients to get unit info
  const { data: ingredients = [] } = useQuery({
    queryKey: ["forecast-ingredients"],
    queryFn: () => getIngredients(),
  })

  // Generate forecasts
  const { data: forecasts = [], isLoading, error } = useQuery({
    queryKey: ["forecasts"],
    queryFn: () => generateAllForecasts(),
    refetchInterval: 60000, // Refetch every minute
  })

  // Filter forecasts that have data (exclude items with no usage)
  const validForecasts = forecasts.filter(f => f.averageDailyUsage > 0 && f.daysRemaining < Infinity)
  const sortedForecasts = [...validForecasts].sort((a, b) => a.daysRemaining - b.daysRemaining)

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

  // Get ingredient unit
  const getIngredientUnit = (ingredientId: string): string => {
    const ingredient = ingredients.find(i => i.id === ingredientId)
    return ingredient?.unit || 'units'
  }

  if (error) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Error Loading Forecasts</h3>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Failed to load forecasts"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Forecasts</h1>
        <p className="text-muted-foreground">Predictive analytics for inventory management</p>
      </div>

      {/* Info Card - Show only if no forecasts */}
      {!isLoading && validForecasts.length === 0 && (
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
      {isLoading ? (
        <ForecastTableSkeleton />
      ) : sortedForecasts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Forecasts</CardTitle>
            <CardDescription>
              Predictions based on your usage patterns. Items running out soon are highlighted.
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
                  const unit = getIngredientUnit(forecast.ingredientId)
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
                        {isCritical ? (
                          <Link href="/suppliers">
                            <Button size="sm" variant="destructive">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Reorder
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No Forecasts Available Yet
          </h2>
          <p className="text-muted-foreground max-w-sm">
            Keep using the app daily. Once we have enough usage data, AI-powered forecasts will appear here.
          </p>
        </motion.div>
      )}
    </div>
  )
}
