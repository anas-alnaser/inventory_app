/**
 * Inventory Connection Service
 * Handles real-time stock deduction when sales are made
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    addDoc,
    query,
    where,
    increment,
    Timestamp,
    writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { InvoiceItem } from "@/types/entities"
import { sendNotification } from "./notifications"

export interface StockDeductionItem {
    menuItemId: string
    menuItemName: string
    quantity: number
}

export interface IngredientUsage {
    ingredientId: string
    ingredientName: string
    quantityUsed: number
    unit: string
    newStock: number
    isLowStock: boolean
}

/**
 * Low stock threshold percentage
 */
const LOW_STOCK_THRESHOLD = 20 // Percentage of min_stock

/**
 * Check if an item is low on stock
 */
export function isLowStock(
    currentStock: number,
    minStock: number
): boolean {
    if (minStock <= 0) return false
    return currentStock <= minStock
}

/**
 * Deduct stock for sold items
 * This processes the recipe ingredients for each menu item sold
 */
export async function deductStockForSale(params: {
    invoiceItems: InvoiceItem[]
    branchId: string
    invoiceNumber: string
    restaurantId: string
}): Promise<{
    success: boolean
    deductions: IngredientUsage[]
    lowStockAlerts: IngredientUsage[]
    error?: string
}> {
    try {
        const { invoiceItems, branchId, invoiceNumber, restaurantId } = params
        const deductions: IngredientUsage[] = []
        const lowStockAlerts: IngredientUsage[] = []
        const batch = writeBatch(db)

        // Get all unique menu item IDs
        const menuItemIds = [...new Set(invoiceItems.map((item) => item.menu_item_id))]

        // Fetch menu items with their recipes
        const menuItemsRef = collection(db, "menu_items")
        const menuItemsSnapshot = await getDocs(
            query(menuItemsRef, where("__name__", "in", menuItemIds))
        )

        const menuItemsMap = new Map<string, any>()
        menuItemsSnapshot.docs.forEach((doc) => {
            menuItemsMap.set(doc.id, { id: doc.id, ...doc.data() })
        })

        // Process each invoice item
        for (const item of invoiceItems) {
            const menuItem = menuItemsMap.get(item.menu_item_id)
            if (!menuItem?.recipe || !Array.isArray(menuItem.recipe)) continue

            // Process each ingredient in the recipe
            for (const ingredient of menuItem.recipe) {
                const ingredientStockRef = doc(
                    db,
                    "ingredient_stock",
                    `${branchId}_${ingredient.ingredient_id}`
                )

                // Get current stock
                const stockDoc = await getDoc(ingredientStockRef)
                if (!stockDoc.exists()) continue

                const stockData = stockDoc.data()
                const quantityToDeduct = ingredient.quantity * item.quantity
                const newStock = (stockData.quantity || 0) - quantityToDeduct

                // Update stock
                batch.update(ingredientStockRef, {
                    quantity: increment(-quantityToDeduct),
                    last_updated: Timestamp.now(),
                })

                // Track deduction
                const deduction: IngredientUsage = {
                    ingredientId: ingredient.ingredient_id,
                    ingredientName: ingredient.ingredient_name || "Unknown",
                    quantityUsed: quantityToDeduct,
                    unit: stockData.unit || "unit",
                    newStock: Math.max(0, newStock),
                    isLowStock: isLowStock(newStock, stockData.min_stock || 0),
                }
                deductions.push(deduction)

                // Check for low stock alerts
                if (deduction.isLowStock) {
                    lowStockAlerts.push(deduction)
                }
            }
        }

        // Commit all stock updates
        await batch.commit()

        // Log stock movements
        await addDoc(collection(db, "stock_movements"), {
            type: "sale",
            invoiceNumber,
            branchId,
            restaurantId,
            deductions: deductions.map((d) => ({
                ingredientId: d.ingredientId,
                quantityUsed: d.quantityUsed,
                unit: d.unit,
            })),
            createdAt: Timestamp.now(),
        })

        // Send low stock alerts
        if (lowStockAlerts.length > 0) {
            await sendLowStockAlerts(lowStockAlerts, branchId, restaurantId)
        }

        return {
            success: true,
            deductions,
            lowStockAlerts,
        }
    } catch (error: any) {
        console.error("Error deducting stock:", error)
        return {
            success: false,
            deductions: [],
            lowStockAlerts: [],
            error: error.message || "Failed to deduct stock",
        }
    }
}

/**
 * Restore stock for refunded/voided items
 */
export async function restoreStockForRefund(params: {
    invoiceItems: InvoiceItem[]
    branchId: string
    invoiceNumber: string
    restaurantId: string
    reason: string
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { invoiceItems, branchId, invoiceNumber, restaurantId, reason } = params
        const batch = writeBatch(db)
        const restorations: Array<{
            ingredientId: string
            quantityRestored: number
        }> = []

        // Get menu items with recipes
        const menuItemIds = [...new Set(invoiceItems.map((item) => item.menu_item_id))]
        const menuItemsRef = collection(db, "menu_items")
        const menuItemsSnapshot = await getDocs(
            query(menuItemsRef, where("__name__", "in", menuItemIds))
        )

        const menuItemsMap = new Map<string, any>()
        menuItemsSnapshot.docs.forEach((doc) => {
            menuItemsMap.set(doc.id, { id: doc.id, ...doc.data() })
        })

        // Restore stock for each item
        for (const item of invoiceItems) {
            const menuItem = menuItemsMap.get(item.menu_item_id)
            if (!menuItem?.recipe || !Array.isArray(menuItem.recipe)) continue

            for (const ingredient of menuItem.recipe) {
                const ingredientStockRef = doc(
                    db,
                    "ingredient_stock",
                    `${branchId}_${ingredient.ingredient_id}`
                )

                const quantityToRestore = ingredient.quantity * item.quantity

                batch.update(ingredientStockRef, {
                    quantity: increment(quantityToRestore),
                    last_updated: Timestamp.now(),
                })

                restorations.push({
                    ingredientId: ingredient.ingredient_id,
                    quantityRestored: quantityToRestore,
                })
            }
        }

        await batch.commit()

        // Log stock movement
        await addDoc(collection(db, "stock_movements"), {
            type: reason.includes("refund") ? "refund" : "void",
            invoiceNumber,
            branchId,
            restaurantId,
            restorations,
            reason,
            createdAt: Timestamp.now(),
        })

        return { success: true }
    } catch (error: any) {
        console.error("Error restoring stock:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Send low stock alert notifications
 */
async function sendLowStockAlerts(
    lowStockItems: IngredientUsage[],
    branchId: string,
    restaurantId: string
): Promise<void> {
    try {
        await sendNotification({
            type: "low_stock",
            title: "Low Stock Alert",
            message: `${lowStockItems.length} item(s) are running low on stock`,
            data: {
                items: lowStockItems.map((item) => ({
                    name: item.ingredientName,
                    remaining: item.newStock,
                    unit: item.unit,
                })),
            },
            branchId,
            restaurantId,
            priority: "high",
            recipients: ["manager", "supervisor", "owner"],
        })
    } catch (error) {
        console.error("Error sending low stock alerts:", error)
    }
}

/**
 * Get current stock levels for a branch
 */
export async function getStockLevels(
    branchId: string
): Promise<Array<{
    ingredientId: string
    ingredientName: string
    quantity: number
    unit: string
    minStock: number
    isLowStock: boolean
}>> {
    try {
        const stockRef = collection(db, "ingredient_stock")
        const q = query(stockRef, where("branch_id", "==", branchId))
        const snapshot = await getDocs(q)

        return snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                ingredientId: data.ingredient_id,
                ingredientName: data.ingredient_name || "Unknown",
                quantity: data.quantity || 0,
                unit: data.unit || "unit",
                minStock: data.min_stock || 0,
                isLowStock: isLowStock(data.quantity || 0, data.min_stock || 0),
            }
        })
    } catch (error) {
        console.error("Error fetching stock levels:", error)
        return []
    }
}
