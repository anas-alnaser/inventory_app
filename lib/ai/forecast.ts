import { getStockLogs, getStockByIngredient, getIngredientById } from '@/lib/services'
import type { StockLog, Ingredient, IngredientStock } from '@/types/entities'

export interface ForecastResult {
  ingredientId: string
  ingredientName: string
  currentStock: number
  averageDailyUsage: number
  daysRemaining: number
  predictedRunOutDate: Date | null
  needsReorder: boolean
  recommendedReorderAmount?: number
  confidence: number // 0-100, based on data quality
}

/**
 * Calculate average daily consumption from stock logs
 * Only considers negative changes (usage/waste) in the last 30 days
 */
function calculateAverageDailyUsage(logs: StockLog[]): number {
  // Filter to only usage logs (negative changes) from last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const usageLogs = logs.filter(log => {
    // Only negative changes (usage)
    if (log.change_amount >= 0) return false

    // Check date
    let logDate: Date
    try {
      if (typeof log.created_at === 'string') {
        logDate = new Date(log.created_at)
      } else if ((log.created_at as any)?.toDate) {
        logDate = (log.created_at as any).toDate()
      } else if (log.created_at instanceof Date) {
        logDate = log.created_at
      } else {
        return false
      }
    } catch {
      return false
    }

    return logDate >= thirtyDaysAgo
  })

  if (usageLogs.length === 0) return 0

  // Calculate total usage (sum of absolute values of negative changes)
  const totalUsage = usageLogs.reduce((sum, log) => sum + Math.abs(log.change_amount), 0)

  // Calculate number of days with data
  const firstLogDate = (() => {
    try {
      const date = usageLogs[usageLogs.length - 1].created_at
      if (typeof date === 'string') return new Date(date)
      if ((date as any)?.toDate) return (date as any).toDate()
      if (date instanceof Date) return date
      return new Date()
    } catch {
      return new Date()
    }
  })()

  const lastLogDate = (() => {
    try {
      const date = usageLogs[0].created_at
      if (typeof date === 'string') return new Date(date)
      if ((date as any)?.toDate) return (date as any).toDate()
      if (date instanceof Date) return date
      return new Date()
    } catch {
      return new Date()
    }
  })()

  const daysDiff = Math.max(1, Math.ceil((lastLogDate.getTime() - firstLogDate.getTime()) / (1000 * 60 * 60 * 24)))

  // Average daily usage
  return totalUsage / daysDiff
}

/**
 * Calculate confidence score based on data quality
 * Higher score = more reliable forecast
 */
function calculateConfidence(logs: StockLog[], daysWithData: number): number {
  // Base confidence on amount of data
  let confidence = Math.min(100, logs.length * 5) // 5 points per log, max 100

  // Boost confidence if we have at least 7 days of data
  if (daysWithData >= 7) confidence += 20
  if (daysWithData >= 14) confidence += 20
  if (daysWithData >= 30) confidence += 20

  // Cap at 100
  return Math.min(100, confidence)
}

/**
 * Generate forecast for a single ingredient
 */
export async function generateForecast(ingredientId: string): Promise<ForecastResult | null> {
  try {
    // Fetch ingredient details
    const ingredient = await getIngredientById(ingredientId)
    if (!ingredient) return null

    // Fetch stock logs (last 50 logs should be enough)
    const logs = await getStockLogs(ingredientId, 50)

    // Fetch current stock
    const stock = await getStockByIngredient(ingredientId)
    const currentStock = stock?.quantity || 0

    // Calculate average daily usage
    const averageDailyUsage = calculateAverageDailyUsage(logs)

    // If no usage data, return null (can't forecast)
    if (averageDailyUsage === 0) {
      return {
        ingredientId,
        ingredientName: ingredient.name,
        currentStock,
        averageDailyUsage: 0,
        daysRemaining: Infinity,
        predictedRunOutDate: null,
        needsReorder: false,
        confidence: 0,
      }
    }

    // Calculate days remaining
    const daysRemaining = currentStock / averageDailyUsage

    // Calculate predicted run-out date
    const predictedRunOutDate = daysRemaining > 0 && daysRemaining < 365
      ? new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000)
      : null

    // Determine if reorder is needed (within 7 days)
    const needsReorder = daysRemaining <= 7

    // Calculate recommended reorder amount (enough for 14 days)
    const recommendedReorderAmount = needsReorder
      ? Math.ceil(averageDailyUsage * 14)
      : undefined

    // Calculate confidence
    const daysWithData = Math.min(30, logs.length)
    const confidence = calculateConfidence(logs, daysWithData)

    return {
      ingredientId,
      ingredientName: ingredient.name,
      currentStock,
      averageDailyUsage,
      daysRemaining,
      predictedRunOutDate,
      needsReorder,
      recommendedReorderAmount,
      confidence,
    }
  } catch (error) {
    console.error('Error generating forecast:', error)
    return null
  }
}

/**
 * Generate forecasts for all ingredients
 */
export async function generateAllForecasts(): Promise<ForecastResult[]> {
  const { getIngredients } = await import('@/lib/services')
  const ingredients = await getIngredients()

  const forecasts = await Promise.all(
    ingredients.map(ingredient => generateForecast(ingredient.id))
  )

  return forecasts.filter((f): f is ForecastResult => f !== null)
}

/**
 * Get the most critical forecast (item running out soonest)
 */
export async function getMostCriticalForecast(): Promise<ForecastResult | null> {
  const forecasts = await generateAllForecasts()

  // Filter to only items that need reorder
  const criticalForecasts = forecasts.filter(f => f.needsReorder && f.daysRemaining < Infinity)

  if (criticalForecasts.length === 0) return null

  // Sort by days remaining (soonest first)
  criticalForecasts.sort((a, b) => a.daysRemaining - b.daysRemaining)

  return criticalForecasts[0]
}

