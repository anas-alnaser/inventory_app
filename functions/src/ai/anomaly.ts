import { 
  db, 
  collections, 
  Timestamp,
  StockLog, 
  Ingredient,
  IngredientStock,
  PurchaseOrder,
  Anomaly,
  AnomalySeverity 
} from '../config/firestore';
import * as admin from 'firebase-admin';
import { generateAnomalyRecommendation } from '../config/gemini';

/**
 * Calculate Z-score for anomaly detection
 */
function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calculate mean and standard deviation from array
 */
function calculateStats(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) return { mean: 0, stdDev: 0 };
  
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  const variance = squareDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return { mean, stdDev };
}

/**
 * Determine severity based on Z-score
 */
function getSeverityFromZScore(zScore: number): AnomalySeverity {
  const absZ = Math.abs(zScore);
  if (absZ >= 4) return 'critical';
  if (absZ >= 3) return 'high';
  if (absZ >= 2.5) return 'medium';
  return 'low';
}

/**
 * Get daily usage totals from stock logs for the past N days
 */
async function getDailyUsage(
  ingredientId: string, 
  days: number = 30
): Promise<Map<string, number>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const logsSnapshot = await collections.stockLogs
    .where('ingredient_id', '==', ingredientId)
    .where('created_at', '>=', Timestamp.fromDate(startDate))
    .orderBy('created_at', 'desc')
    .get();
  
  const dailyUsage = new Map<string, number>();
  
  logsSnapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
    const log = doc.data() as StockLog;
    // Only count negative changes (usage)
    if (log.change_amount < 0) {
      const date = log.created_at.toDate().toISOString().split('T')[0];
      const current = dailyUsage.get(date) || 0;
      dailyUsage.set(date, current + Math.abs(log.change_amount));
    }
  });
  
  return dailyUsage;
}

/**
 * Detect usage spikes for all ingredients
 * Returns list of detected anomalies
 */
export async function detectUsageSpikes(
  zScoreThreshold: number = 2
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  
  // Get all ingredients
  const ingredientsSnapshot = await collections.ingredients.get();
  const ingredients = ingredientsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Ingredient));
  
  for (const ingredient of ingredients) {
    try {
      // Get 30 days of daily usage
      const dailyUsage = await getDailyUsage(ingredient.id, 30);
      
      if (dailyUsage.size < 7) {
        // Not enough data for meaningful analysis
        continue;
      }
      
      const usageValues = Array.from(dailyUsage.values());
      const { mean, stdDev } = calculateStats(usageValues);
      
      // Check yesterday's usage (most recent)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayUsage = dailyUsage.get(yesterdayStr);
      
      if (yesterdayUsage !== undefined) {
        const zScore = calculateZScore(yesterdayUsage, mean, stdDev);
        
        if (Math.abs(zScore) >= zScoreThreshold) {
          const deviationPercent = mean > 0 
            ? ((yesterdayUsage - mean) / mean) * 100 
            : 0;
          
          const severity = getSeverityFromZScore(zScore);
          const direction = zScore > 0 ? 'higher' : 'lower';
          
          let aiRecommendation: string | undefined;
          try {
            aiRecommendation = await generateAnomalyRecommendation(
              'usage_spike',
              ingredient.name,
              {
                yesterday_usage: yesterdayUsage,
                average_usage: mean,
                deviation_percent: deviationPercent,
                z_score: zScore,
                direction
              }
            );
          } catch {
            // AI recommendation is optional
          }
          
          anomalies.push({
            type: 'usage_spike',
            ingredient_id: ingredient.id,
            severity,
            description: `Usage of "${ingredient.name}" was ${Math.abs(deviationPercent).toFixed(0)}% ${direction} than normal yesterday (${yesterdayUsage.toFixed(1)} vs avg ${mean.toFixed(1)} ${ingredient.unit})`,
            details: {
              expected_value: mean,
              actual_value: yesterdayUsage,
              deviation_percent: deviationPercent,
              z_score: zScore,
            },
            ai_recommendation: aiRecommendation,
            created_at: Timestamp.now(),
            resolved: false,
          });
        }
      }
    } catch (error) {
      console.error(`Error analyzing usage spikes for ${ingredient.name}:`, error);
    }
  }
  
  return anomalies;
}

/**
 * Detect supplier price creep
 * Monitors price increases over recent purchase orders
 */
export async function detectPriceCreep(
  thresholdPercent: number = 10,
  ordersToCheck: number = 3
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  
  // Get recent received purchase orders
  const ordersSnapshot = await collections.purchaseOrders
    .where('status', '==', 'received')
    .orderBy('created_at', 'desc')
    .limit(100)
    .get();
  
  const orders = ordersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as PurchaseOrder));
  
  // Group orders by supplier and ingredient
  const priceHistory: Map<string, { 
    ingredientId: string; 
    ingredientName: string;
    supplierId: string;
    supplierName: string;
    prices: { price: number; date: Date }[] 
  }> = new Map();
  
  for (const order of orders) {
    for (const item of order.items) {
      const key = `${order.supplier_id}_${item.ingredient_id}`;
      
      if (!priceHistory.has(key)) {
        priceHistory.set(key, {
          ingredientId: item.ingredient_id,
          ingredientName: item.name,
          supplierId: order.supplier_id,
          supplierName: order.supplier_name,
          prices: []
        });
      }
      
      priceHistory.get(key)!.prices.push({
        price: item.cost_per_unit,
        date: order.created_at.toDate()
      });
    }
  }
  
  // Analyze price changes
  for (const [, data] of priceHistory) {
    // Sort by date (oldest first)
    data.prices.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    if (data.prices.length < ordersToCheck) continue;
    
    const recentPrices = data.prices.slice(-ordersToCheck);
    const firstPrice = recentPrices[0].price;
    const lastPrice = recentPrices[recentPrices.length - 1].price;
    
    if (firstPrice > 0) {
      const priceChangePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
      
      if (priceChangePercent >= thresholdPercent) {
        const severity: AnomalySeverity = priceChangePercent >= 25 ? 'high' 
          : priceChangePercent >= 15 ? 'medium' : 'low';
        
        let aiRecommendation: string | undefined;
        try {
          aiRecommendation = await generateAnomalyRecommendation(
            'price_creep',
            data.ingredientName,
            {
              supplier: data.supplierName,
              original_price: firstPrice,
              current_price: lastPrice,
              price_increase_percent: priceChangePercent,
              orders_analyzed: ordersToCheck
            }
          );
        } catch {
          // AI recommendation is optional
        }
        
        anomalies.push({
          type: 'price_creep',
          ingredient_id: data.ingredientId,
          severity,
          description: `Price of "${data.ingredientName}" from ${data.supplierName} increased by ${priceChangePercent.toFixed(1)}% over the last ${ordersToCheck} orders`,
          details: {
            expected_value: firstPrice,
            actual_value: lastPrice,
            price_change_percent: priceChangePercent,
            supplier_id: data.supplierId,
          },
          ai_recommendation: aiRecommendation,
          created_at: Timestamp.now(),
          resolved: false,
        });
      }
    }
  }
  
  return anomalies;
}

/**
 * Detect ghost inventory - items with stock but no movement
 */
export async function detectGhostInventory(
  inactiveDays: number = 30
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);
  
  // Get all stock items with quantity > 0
  const stockSnapshot = await collections.ingredientStock
    .where('quantity', '>', 0)
    .get();
  
  for (const stockDoc of stockSnapshot.docs) {
    const stock = stockDoc.data() as IngredientStock;
    
    // Check for recent stock log activity
    const recentLogsSnapshot = await collections.stockLogs
      .where('ingredient_id', '==', stock.ingredient_id)
      .where('created_at', '>=', Timestamp.fromDate(cutoffDate))
      .limit(1)
      .get();
    
    if (recentLogsSnapshot.empty) {
      // No activity in the specified period
      const ingredientDoc = await collections.ingredients.doc(stock.ingredient_id).get();
      const ingredient = ingredientDoc.data() as Ingredient | undefined;
      
      if (ingredient) {
        const daysSinceLastUpdate = Math.floor(
          (Date.now() - stock.last_updated.toDate().getTime()) / (1000 * 60 * 60 * 24)
        );
        
        let aiRecommendation: string | undefined;
        try {
          aiRecommendation = await generateAnomalyRecommendation(
            'ghost_inventory',
            ingredient.name,
            {
              quantity_in_system: stock.quantity,
              unit: ingredient.unit,
              days_inactive: daysSinceLastUpdate,
              last_updated: stock.last_updated.toDate().toISOString()
            }
          );
        } catch {
          // AI recommendation is optional
        }
        
        anomalies.push({
          type: 'ghost_inventory',
          ingredient_id: ingredient.id,
          severity: daysSinceLastUpdate > 60 ? 'high' : 'medium',
          description: `"${ingredient.name}" shows ${stock.quantity} ${ingredient.unit} in stock but hasn't had any activity in ${daysSinceLastUpdate} days. Please verify actual stock.`,
          details: {
            actual_value: stock.quantity,
            days_inactive: daysSinceLastUpdate,
          },
          ai_recommendation: aiRecommendation,
          created_at: Timestamp.now(),
          resolved: false,
        });
      }
    }
  }
  
  return anomalies;
}

/**
 * Calculate theoretical usage from POS orders
 */
export async function calculateTheoreticalUsage(
  startDate: Date,
  endDate: Date
): Promise<Map<string, number>> {
  const theoreticalUsage = new Map<string, number>();
  
  // Get POS orders in date range
  const ordersSnapshot = await collections.posOrders
    .where('created_at', '>=', Timestamp.fromDate(startDate))
    .where('created_at', '<=', Timestamp.fromDate(endDate))
    .where('status', '==', 'completed')
    .get();
  
  // Get all menu items with recipes
  const menuItemsSnapshot = await collections.menuItems.get();
  const menuItems = new Map<string, { name: string; recipe?: { ingredientId: string; quantity: number }[] }>();
  
  menuItemsSnapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
    const item = doc.data();
    menuItems.set(doc.id, {
      name: item.name,
      recipe: item.recipe
    });
  });
  
  // Calculate theoretical usage from orders
  for (const orderDoc of ordersSnapshot.docs) {
    // Get order items from subcollection
    const orderItemsSnapshot = await orderDoc.ref.collection('pos_order_items').get();
    
    for (const itemDoc of orderItemsSnapshot.docs) {
      const orderItem = itemDoc.data();
      const menuItem = menuItems.get(orderItem.menu_item_id);
      
      if (menuItem?.recipe) {
        for (const recipeIngredient of menuItem.recipe) {
          const currentUsage = theoreticalUsage.get(recipeIngredient.ingredientId) || 0;
          theoreticalUsage.set(
            recipeIngredient.ingredientId,
            currentUsage + (recipeIngredient.quantity * orderItem.quantity)
          );
        }
      }
    }
  }
  
  return theoreticalUsage;
}

/**
 * Detect variance between theoretical and actual usage
 */
export async function detectTheoreticalVariance(
  days: number = 7,
  varianceThreshold: number = 0.1 // 10%
): Promise<Anomaly[]> {
  const anomalies: Anomaly[] = [];
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Calculate theoretical usage from POS
  const theoreticalUsage = await calculateTheoreticalUsage(startDate, endDate);
  
  // Get actual usage from stock logs
  const actualUsage = new Map<string, number>();
  
  const logsSnapshot = await collections.stockLogs
    .where('created_at', '>=', Timestamp.fromDate(startDate))
    .where('created_at', '<=', Timestamp.fromDate(endDate))
    .get();
  
  logsSnapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
    const log = doc.data() as StockLog;
    if (log.change_amount < 0) {
      const current = actualUsage.get(log.ingredient_id) || 0;
      actualUsage.set(log.ingredient_id, current + Math.abs(log.change_amount));
    }
  });
  
  // Compare theoretical vs actual
  const ingredientsSnapshot = await collections.ingredients.get();
  const ingredients = new Map<string, Ingredient>();
  ingredientsSnapshot.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
    ingredients.set(doc.id, { id: doc.id, ...doc.data() } as Ingredient);
  });
  
  for (const [ingredientId, theoretical] of theoreticalUsage) {
    const actual = actualUsage.get(ingredientId) || 0;
    const ingredient = ingredients.get(ingredientId);
    
    if (!ingredient || theoretical === 0) continue;
    
    const variance = (actual - theoretical) / theoretical;
    
    if (Math.abs(variance) >= varianceThreshold) {
      const variancePercent = variance * 100;
      const severity: AnomalySeverity = Math.abs(variancePercent) >= 30 ? 'high'
        : Math.abs(variancePercent) >= 20 ? 'medium' : 'low';
      
      const direction = variance > 0 ? 'more' : 'less';
      
      let aiRecommendation: string | undefined;
      try {
        aiRecommendation = await generateAnomalyRecommendation(
          'theoretical_variance',
          ingredient.name,
          {
            theoretical_usage: theoretical,
            actual_usage: actual,
            variance_percent: variancePercent,
            period_days: days,
            direction
          }
        );
      } catch {
        // AI recommendation is optional
      }
      
      anomalies.push({
        type: 'theoretical_variance',
        ingredient_id: ingredientId,
        severity,
        description: `Used ${Math.abs(variancePercent).toFixed(1)}% ${direction} "${ingredient.name}" than expected based on sales (Actual: ${actual.toFixed(1)} vs Expected: ${theoretical.toFixed(1)} ${ingredient.unit})`,
        details: {
          expected_value: theoretical,
          actual_value: actual,
          deviation_percent: variancePercent,
        },
        ai_recommendation: aiRecommendation,
        created_at: Timestamp.now(),
        resolved: false,
      });
    }
  }
  
  return anomalies;
}

/**
 * Save anomalies to Firestore (avoiding duplicates)
 */
export async function saveAnomalies(anomalies: Anomaly[]): Promise<number> {
  let savedCount = 0;
  const batch = db.batch();
  
  for (const anomaly of anomalies) {
    // Check for recent duplicate (same type + ingredient in last 24h)
    const recentCheck = await collections.anomalies
      .where('type', '==', anomaly.type)
      .where('ingredient_id', '==', anomaly.ingredient_id)
      .where('resolved', '==', false)
      .where('created_at', '>=', Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)))
      .limit(1)
      .get();
    
    if (recentCheck.empty) {
      const docRef = collections.anomalies.doc();
      batch.set(docRef, anomaly);
      savedCount++;
    }
  }
  
  if (savedCount > 0) {
    await batch.commit();
  }
  
  return savedCount;
}

/**
 * Run all anomaly detection checks
 */
export async function runAllAnomalyDetection(): Promise<{
  usageSpikes: number;
  priceCreep: number;
  ghostInventory: number;
  theoreticalVariance: number;
  total: number;
}> {
  const results = {
    usageSpikes: 0,
    priceCreep: 0,
    ghostInventory: 0,
    theoreticalVariance: 0,
    total: 0,
  };
  
  try {
    // Usage spikes
    const usageSpikes = await detectUsageSpikes();
    results.usageSpikes = await saveAnomalies(usageSpikes);
    
    // Price creep
    const priceCreep = await detectPriceCreep();
    results.priceCreep = await saveAnomalies(priceCreep);
    
    // Ghost inventory
    const ghostInventory = await detectGhostInventory();
    results.ghostInventory = await saveAnomalies(ghostInventory);
    
    // Theoretical variance
    const theoreticalVariance = await detectTheoreticalVariance();
    results.theoreticalVariance = await saveAnomalies(theoreticalVariance);
    
    results.total = results.usageSpikes + results.priceCreep + 
                    results.ghostInventory + results.theoreticalVariance;
    
  } catch (error) {
    console.error('Error running anomaly detection:', error);
    throw error;
  }
  
  return results;
}

