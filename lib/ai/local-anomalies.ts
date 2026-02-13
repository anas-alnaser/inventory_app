/**
 * Local Anomaly Detection
 * Client-side anomaly detection without Cloud Functions
 */

import type { Ingredient, IngredientStock, StockLog, StockLogReason } from '@/types/entities';

export interface LocalAnomaly {
    id: string;
    type: 'excessive_waste' | 'stock_shortage' | 'ghost_inventory' | 'other';
    ingredient_id: string | null;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    details: {
        expected_value?: number;
        actual_value?: number;
        deviation_percent?: number;
        days_inactive?: number;
    };
    ai_recommendation: string;
    created_at: Date;
    resolved: boolean;
    ingredientName?: string;
}

interface IngredientWithStock extends Ingredient {
    currentStock?: number;
}

/**
 * Detect anomalies locally using simple heuristics
 * Works entirely in the browser without Cloud Functions
 */
export function detectLocalAnomalies(
    ingredients: IngredientWithStock[],
    stockLogs: StockLog[],
    ingredientStocks: IngredientStock[]
): LocalAnomaly[] {
    const anomalies: LocalAnomaly[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Create lookup maps
    const stockByIngredient = new Map<string, number>();
    ingredientStocks.forEach((stock) => {
        const current = stockByIngredient.get(stock.ingredient_id) || 0;
        stockByIngredient.set(stock.ingredient_id, current + stock.quantity);
    });

    // Group logs by ingredient
    const logsByIngredient = new Map<string, StockLog[]>();
    stockLogs.forEach((log) => {
        const logs = logsByIngredient.get(log.ingredient_id) || [];
        logs.push(log);
        logsByIngredient.set(log.ingredient_id, logs);
    });

    for (const ingredient of ingredients) {
        const currentStock = stockByIngredient.get(ingredient.id) || 0;
        const logs = logsByIngredient.get(ingredient.id) || [];

        // Filter logs from last 30 days
        const recentLogs = logs.filter((log) => {
            const logDate = log.created_at instanceof Date ? log.created_at : new Date(log.created_at);
            return logDate >= thirtyDaysAgo;
        });

        // 1. Negative Stock Detection (Critical)
        if (currentStock < 0) {
            anomalies.push({
                id: `negative-${ingredient.id}-${Date.now()}`,
                type: 'stock_shortage',
                ingredient_id: ingredient.id,
                severity: 'critical',
                description: `${ingredient.name} has negative stock (${currentStock.toFixed(2)} ${ingredient.unit})`,
                details: {
                    actual_value: currentStock,
                    expected_value: 0,
                },
                ai_recommendation: 'Perform a physical count and correct the stock level. Check for unrecorded sales or transfers.',
                created_at: now,
                resolved: false,
                ingredientName: ingredient.name,
            });
        }

        // 2. Low Stock Warning (if below min_stock_level)
        if (ingredient.min_stock_level && currentStock < ingredient.min_stock_level && currentStock >= 0) {
            const percentBelow = ((ingredient.min_stock_level - currentStock) / ingredient.min_stock_level) * 100;
            anomalies.push({
                id: `lowstock-${ingredient.id}-${Date.now()}`,
                type: 'stock_shortage',
                ingredient_id: ingredient.id,
                severity: percentBelow > 50 ? 'high' : 'medium',
                description: `${ingredient.name} is below minimum stock level (${currentStock.toFixed(2)}/${ingredient.min_stock_level} ${ingredient.unit})`,
                details: {
                    actual_value: currentStock,
                    expected_value: ingredient.min_stock_level,
                    deviation_percent: percentBelow,
                },
                ai_recommendation: 'Reorder soon to avoid stockout. Consider creating a purchase order.',
                created_at: now,
                resolved: false,
                ingredientName: ingredient.name,
            });
        }

        // 3. Excessive Waste Detection (>10% of consumption is waste)
        const wasteReasons: StockLogReason[] = ['waste', 'expired'];
        const consumptionReasons: StockLogReason[] = ['sale', 'consumption', 'production'];

        const wasteLogs = recentLogs.filter((log) => wasteReasons.includes(log.reason));
        const consumptionLogs = recentLogs.filter((log) => consumptionReasons.includes(log.reason));

        const totalWaste = Math.abs(wasteLogs.reduce((sum, log) => sum + log.change_amount, 0));
        const totalConsumption = Math.abs(consumptionLogs.reduce((sum, log) => sum + log.change_amount, 0));

        if (totalConsumption > 0) {
            const wastePercent = (totalWaste / totalConsumption) * 100;
            if (wastePercent > 10) {
                anomalies.push({
                    id: `waste-${ingredient.id}-${Date.now()}`,
                    type: 'excessive_waste',
                    ingredient_id: ingredient.id,
                    severity: wastePercent > 25 ? 'high' : wastePercent > 15 ? 'medium' : 'low',
                    description: `${ingredient.name} has ${wastePercent.toFixed(1)}% waste rate (${totalWaste.toFixed(2)} wasted vs ${totalConsumption.toFixed(2)} consumed)`,
                    details: {
                        actual_value: totalWaste,
                        expected_value: totalConsumption * 0.05, // 5% is acceptable
                        deviation_percent: wastePercent,
                    },
                    ai_recommendation: 'Review storage conditions and shelf life management. Consider ordering smaller quantities more frequently.',
                    created_at: now,
                    resolved: false,
                    ingredientName: ingredient.name,
                });
            }
        }

        // 4. Ghost Inventory Detection (no movement in 30 days but has stock)
        if (currentStock > 0 && recentLogs.length === 0) {
            // Calculate days since last movement from all logs
            const allLogs = logsByIngredient.get(ingredient.id) || [];
            let daysSinceLastMovement = 30;

            if (allLogs.length > 0) {
                const lastLog = allLogs.reduce((latest, log) => {
                    const logDate = log.created_at instanceof Date ? log.created_at : new Date(log.created_at);
                    const latestDate = latest.created_at instanceof Date ? latest.created_at : new Date(latest.created_at);
                    return logDate > latestDate ? log : latest;
                });
                const lastDate = lastLog.created_at instanceof Date ? lastLog.created_at : new Date(lastLog.created_at);
                daysSinceLastMovement = Math.floor((now.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
            }

            if (daysSinceLastMovement >= 30) {
                anomalies.push({
                    id: `ghost-${ingredient.id}-${Date.now()}`,
                    type: 'ghost_inventory',
                    ingredient_id: ingredient.id,
                    severity: daysSinceLastMovement > 60 ? 'medium' : 'low',
                    description: `${ingredient.name} has ${currentStock.toFixed(2)} ${ingredient.unit} in stock but no movement for ${daysSinceLastMovement}+ days`,
                    details: {
                        actual_value: currentStock,
                        days_inactive: daysSinceLastMovement,
                    },
                    ai_recommendation: 'Verify physical inventory matches system. Consider if this item should be discontinued or used before expiry.',
                    created_at: now,
                    resolved: false,
                    ingredientName: ingredient.name,
                });
            }
        }
    }

    // Sort by severity (critical first)
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return anomalies;
}
