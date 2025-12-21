import { generateAllForecasts, type ForecastResult } from '@/lib/ai/forecast'
import { getIngredients, getIngredientById } from '@/lib/services/ingredients'
import { getSuppliers, getSupplierById } from '@/lib/services/suppliers'
import { getStockByIngredient } from '@/lib/services/stock'
import type { Ingredient, Supplier } from '@/types/entities'

export interface ShoppingListItem {
  ingredientId: string
  ingredientName: string
  currentStock: number
  maxStockLevel: number
  quantityNeeded: number
  unit: string
  daysRemaining: number
  costPerUnit: number
  estimatedCost: number
}

export interface ShoppingListBySupplier {
  supplierId: string
  supplierName: string
  supplierPhone: string
  items: ShoppingListItem[]
  totalEstimatedCost: number
}

export interface WeeklyShoppingList {
  items: ShoppingListBySupplier[]
  totalItems: number
  totalSuppliers: number
  totalEstimatedCost: number
  generatedAt: Date
}

/**
 * Generate weekly shopping list based on AI forecasts
 * Includes items predicted to run out within 7 days
 * @param branchId - Required for data isolation
 */
export async function generateWeeklyShoppingList(branchId: string): Promise<WeeklyShoppingList> {
  if (!branchId) {
    throw new Error('branchId is required for data isolation');
  }

  // Get all forecasts
  const forecasts = await generateAllForecasts()
  
  // Get all ingredients to access supplier_id and max_stock_level
  const ingredients = await getIngredients()
  
  // Filter forecasts for items running out within 7 days
  const criticalForecasts = forecasts.filter(
    forecast => forecast.daysRemaining <= 7 && forecast.daysRemaining > 0 && forecast.daysRemaining < Infinity
  )

  // Build shopping list items
  const shoppingListItems: ShoppingListItem[] = []

  for (const forecast of criticalForecasts) {
    const ingredient = ingredients.find(ing => ing.id === forecast.ingredientId)
    
    if (!ingredient) continue

    // Get current stock (filtered by branchId)
    const stock = await getStockByIngredient(forecast.ingredientId, branchId)
    const currentStock = stock?.quantity || forecast.currentStock

    // Calculate quantity needed to reach max_stock_level
    const maxStockLevel = ingredient.max_stock_level || 0
    
    // If no max_stock_level set, use recommended reorder amount or calculate based on 14 days usage
    let quantityNeeded = 0
    if (maxStockLevel > 0) {
      quantityNeeded = Math.max(0, maxStockLevel - currentStock)
    } else if (forecast.recommendedReorderAmount) {
      quantityNeeded = forecast.recommendedReorderAmount
    } else {
      // Calculate based on 14 days of usage
      quantityNeeded = Math.ceil(forecast.averageDailyUsage * 14)
    }

    // Only include if we need to order something
    if (quantityNeeded > 0) {
      const costPerUnit = ingredient.cost_per_unit || 0
      const estimatedCost = quantityNeeded * costPerUnit

      shoppingListItems.push({
        ingredientId: forecast.ingredientId,
        ingredientName: forecast.ingredientName,
        currentStock,
        maxStockLevel: maxStockLevel || currentStock + quantityNeeded,
        quantityNeeded,
        unit: ingredient.unit,
        daysRemaining: forecast.daysRemaining,
        costPerUnit,
        estimatedCost,
      })
    }
  }

  // Group by supplier
  const supplierMap = new Map<string, ShoppingListBySupplier>()

  for (const item of shoppingListItems) {
    const ingredient = ingredients.find(ing => ing.id === item.ingredientId)
    if (!ingredient || !ingredient.supplier_id) continue

    const supplierId = ingredient.supplier_id
    const supplier = await getSupplierById(supplierId)
    
    if (!supplier) continue

    if (!supplierMap.has(supplierId)) {
      supplierMap.set(supplierId, {
        supplierId,
        supplierName: supplier.name,
        supplierPhone: supplier.phone,
        items: [],
        totalEstimatedCost: 0,
      })
    }

    const supplierGroup = supplierMap.get(supplierId)!
    supplierGroup.items.push(item)
    supplierGroup.totalEstimatedCost += item.estimatedCost
  }

  // Convert map to array
  const itemsBySupplier = Array.from(supplierMap.values())

  // Calculate totals
  const totalItems = shoppingListItems.length
  const totalSuppliers = itemsBySupplier.length
  const totalEstimatedCost = itemsBySupplier.reduce(
    (sum, group) => sum + group.totalEstimatedCost,
    0
  )

  return {
    items: itemsBySupplier,
    totalItems,
    totalSuppliers,
    totalEstimatedCost,
    generatedAt: new Date(),
  }
}

/**
 * Format shopping list for WhatsApp message
 */
export function formatShoppingListForWhatsApp(
  supplierGroup: ShoppingListBySupplier
): string {
  const lines: string[] = []
  
  lines.push(`📋 *Order for ${supplierGroup.supplierName}*`)
  lines.push('')
  lines.push('Please provide the following items:')
  lines.push('')

  supplierGroup.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.ingredientName}: ${item.quantityNeeded} ${item.unit}`
    )
  })

  lines.push('')
  lines.push(`Total estimated cost: ${supplierGroup.totalEstimatedCost.toFixed(2)} JOD`)

  return lines.join('\n')
}

/**
 * Generate WhatsApp URL for sending order
 */
export function generateWhatsAppUrl(
  phone: string,
  message: string
): string {
  // Remove any non-digit characters from phone number
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message)
  
  // Generate WhatsApp URL
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

