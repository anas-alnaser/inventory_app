import {
  db,
  collections,
  Timestamp,
  StockLog,
  Ingredient,
  IngredientStock,
  MenuItem,
  Forecast,
  WastePrediction,
} from '../config/firestore';
import { generateExpiryRecommendation } from '../config/gemini';

/**
 * Get historical usage data grouped by day
 */
async function getHistoricalUsage(
  ingredientId: string,
  days: number = 30
): Promise<{ date: string; usage: number; dayOfWeek: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logsSnapshot = await collections.stockLogs
    .where('ingredient_id', '==', ingredientId)
    .where('created_at', '>=', Timestamp.fromDate(startDate))
    .orderBy('created_at', 'asc')
    .get();

  const dailyUsage = new Map<string, number>();

  logsSnapshot.docs.forEach((doc) => {
    const log = doc.data() as StockLog;
    // Only count negative changes (usage)
    if (log.change_amount < 0) {
      const date = log.created_at.toDate().toISOString().split('T')[0];
      const current = dailyUsage.get(date) || 0;
      dailyUsage.set(date, current + Math.abs(log.change_amount));
    }
  });

  // Convert to array with day of week
  const result: { date: string; usage: number; dayOfWeek: number }[] = [];
  for (const [date, usage] of dailyUsage) {
    const dateObj = new Date(date);
    result.push({
      date,
      usage,
      dayOfWeek: dateObj.getDay(), // 0 = Sunday, 6 = Saturday
    });
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate day-of-week coefficients for seasonality
 */
function calculateDayCoefficients(
  historicalData: { date: string; usage: number; dayOfWeek: number }[]
): Map<number, number> {
  const dayTotals = new Map<number, { sum: number; count: number }>();

  // Initialize all days
  for (let i = 0; i < 7; i++) {
    dayTotals.set(i, { sum: 0, count: 0 });
  }

  // Accumulate usage by day of week
  for (const data of historicalData) {
    const current = dayTotals.get(data.dayOfWeek)!;
    current.sum += data.usage;
    current.count++;
  }

  // Calculate overall average
  const totalSum = Array.from(dayTotals.values()).reduce((s, d) => s + d.sum, 0);
  const totalCount = Array.from(dayTotals.values()).reduce((s, d) => s + d.count, 0);
  const overallAvg = totalCount > 0 ? totalSum / totalCount : 1;

  // Calculate coefficients (ratio to overall average)
  const coefficients = new Map<number, number>();
  for (let i = 0; i < 7; i++) {
    const dayData = dayTotals.get(i)!;
    if (dayData.count > 0 && overallAvg > 0) {
      const dayAvg = dayData.sum / dayData.count;
      coefficients.set(i, dayAvg / overallAvg);
    } else {
      coefficients.set(i, 1); // Default coefficient
    }
  }

  return coefficients;
}

/**
 * Seasonality-aware forecast using weighted moving average
 * Formula: forecast[day] = 0.6 * recent_avg + 0.3 * same_day_last_week + 0.1 * same_day_2_weeks_ago
 */
export async function generateSeasonalForecast(
  ingredientId: string,
  daysToForecast: number = 7
): Promise<{
  forecasts: { date: string; quantity: number; dayOfWeek: number }[];
  confidence: number;
  dayCoefficients: Map<number, number>;
  historicalAverage: number;
}> {
  // Get 30 days of historical data
  const historicalData = await getHistoricalUsage(ingredientId, 30);

  if (historicalData.length < 7) {
    // Not enough data for seasonal forecast
    return {
      forecasts: [],
      confidence: 0,
      dayCoefficients: new Map(),
      historicalAverage: 0,
    };
  }

  // Calculate day-of-week coefficients
  const dayCoefficients = calculateDayCoefficients(historicalData);

  // Calculate recent average (last 7 days)
  const recentData = historicalData.slice(-7);
  const recentAvg =
    recentData.length > 0
      ? recentData.reduce((sum, d) => sum + d.usage, 0) / recentData.length
      : 0;

  // Get usage by day of week for same-day comparisons
  const usageByDayOfWeek = new Map<number, number[]>();
  for (let i = 0; i < 7; i++) {
    usageByDayOfWeek.set(i, []);
  }
  for (const data of historicalData) {
    usageByDayOfWeek.get(data.dayOfWeek)!.push(data.usage);
  }

  // Generate forecasts for upcoming days
  const forecasts: { date: string; quantity: number; dayOfWeek: number }[] = [];
  const today = new Date();

  for (let i = 1; i <= daysToForecast; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(forecastDate.getDate() + i);
    const dayOfWeek = forecastDate.getDay();

    const sameDayHistory = usageByDayOfWeek.get(dayOfWeek) || [];
    const sameDayLastWeek = sameDayHistory.length >= 1 ? sameDayHistory[sameDayHistory.length - 1] : recentAvg;
    const sameDayTwoWeeksAgo = sameDayHistory.length >= 2 ? sameDayHistory[sameDayHistory.length - 2] : recentAvg;

    // Weighted moving average with seasonality
    const baselineAvg = recentAvg * (dayCoefficients.get(dayOfWeek) || 1);
    const forecast =
      0.6 * baselineAvg + 0.3 * sameDayLastWeek + 0.1 * sameDayTwoWeeksAgo;

    forecasts.push({
      date: forecastDate.toISOString().split('T')[0],
      quantity: Math.max(0, forecast),
      dayOfWeek,
    });
  }

  // Calculate confidence based on data quality
  let confidence = Math.min(100, historicalData.length * 3);
  if (historicalData.length >= 14) confidence += 10;
  if (historicalData.length >= 21) confidence += 10;
  if (historicalData.length >= 28) confidence += 10;
  confidence = Math.min(95, confidence); // Cap at 95%

  const historicalAverage =
    historicalData.length > 0
      ? historicalData.reduce((sum, d) => sum + d.usage, 0) / historicalData.length
      : 0;

  return {
    forecasts,
    confidence,
    dayCoefficients,
    historicalAverage,
  };
}

/**
 * Menu-driven ingredient forecasting
 * Predicts menu item sales and "explodes" into ingredient requirements
 */
export async function generateMenuDrivenForecast(
  daysToForecast: number = 7
): Promise<Map<string, { quantity: number; menuItems: string[] }>> {
  const ingredientRequirements = new Map<
    string,
    { quantity: number; menuItems: string[] }
  >();

  // Get menu items with recipes
  const menuItemsSnapshot = await collections.menuItems.get();
  const menuItems = menuItemsSnapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as MenuItem)
  );

  // Get historical POS data for menu item sales
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ordersSnapshot = await collections.posOrders
    .where('created_at', '>=', Timestamp.fromDate(thirtyDaysAgo))
    .where('status', '==', 'completed')
    .get();

  // Calculate average daily sales per menu item
  const menuItemSales = new Map<string, number[]>();

  for (const orderDoc of ordersSnapshot.docs) {
    // Get order items
    const orderItemsSnapshot = await orderDoc.ref
      .collection('pos_order_items')
      .get();

    for (const itemDoc of orderItemsSnapshot.docs) {
      const item = itemDoc.data();
      const menuItemId = item.menu_item_id;

      if (!menuItemSales.has(menuItemId)) {
        menuItemSales.set(menuItemId, []);
      }
      menuItemSales.get(menuItemId)!.push(item.quantity);
    }
  }

  // Calculate predicted daily sales for each menu item
  const predictedSales = new Map<string, number>();
  for (const [menuItemId, sales] of menuItemSales) {
    const totalSales = sales.reduce((sum, s) => sum + s, 0);
    const daysWithData = Math.min(30, new Set(sales).size);
    const avgDailySales = daysWithData > 0 ? totalSales / daysWithData : 0;
    predictedSales.set(menuItemId, avgDailySales);
  }

  // Explode menu item sales into ingredient requirements
  for (const menuItem of menuItems) {
    if (!menuItem.recipe || menuItem.recipe.length === 0) continue;

    const dailySales = predictedSales.get(menuItem.id) || 0;
    const totalSales = dailySales * daysToForecast;

    for (const recipeIngredient of menuItem.recipe) {
      const ingredientId = recipeIngredient.ingredientId;
      const requiredQty = recipeIngredient.quantity * totalSales;

      if (!ingredientRequirements.has(ingredientId)) {
        ingredientRequirements.set(ingredientId, { quantity: 0, menuItems: [] });
      }

      const current = ingredientRequirements.get(ingredientId)!;
      current.quantity += requiredQty;
      if (!current.menuItems.includes(menuItem.name)) {
        current.menuItems.push(menuItem.name);
      }
    }
  }

  return ingredientRequirements;
}

/**
 * Calculate smart par level recommendations
 */
export async function calculateParLevels(
  ingredientId: string,
  leadTimeDays: number = 3,
  safetyFactor: number = 1.5
): Promise<{
  recommendedMin: number;
  recommendedMax: number;
  avgDailyUsage: number;
  usageVariance: number;
}> {
  const historicalData = await getHistoricalUsage(ingredientId, 30);

  if (historicalData.length < 7) {
    return {
      recommendedMin: 0,
      recommendedMax: 0,
      avgDailyUsage: 0,
      usageVariance: 0,
    };
  }

  const usageValues = historicalData.map((d) => d.usage);
  const avgDailyUsage =
    usageValues.reduce((sum, v) => sum + v, 0) / usageValues.length;

  // Calculate variance
  const squareDiffs = usageValues.map((v) => Math.pow(v - avgDailyUsage, 2));
  const variance =
    squareDiffs.reduce((sum, v) => sum + v, 0) / usageValues.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of variation (CV) - higher CV means more variability
  const cv = avgDailyUsage > 0 ? stdDev / avgDailyUsage : 0;

  // Adjust safety factor based on variability
  const adjustedSafetyFactor = safetyFactor * (1 + cv);

  // Calculate par levels
  // Min = (average daily usage × lead time) × safety factor
  const recommendedMin = avgDailyUsage * leadTimeDays * adjustedSafetyFactor;

  // Max = Min + (average daily usage × reorder cycle)
  // Assuming 7-day reorder cycle
  const recommendedMax = recommendedMin + avgDailyUsage * 7;

  return {
    recommendedMin: Math.ceil(recommendedMin),
    recommendedMax: Math.ceil(recommendedMax),
    avgDailyUsage,
    usageVariance: variance,
  };
}

/**
 * Detect expiry risk and generate predictions
 */
export async function detectExpiryRisks(): Promise<WastePrediction[]> {
  const predictions: WastePrediction[] = [];

  // Get all stock items with expiry dates
  const stockSnapshot = await collections.ingredientStock
    .where('quantity', '>', 0)
    .get();

  const ingredientsSnapshot = await collections.ingredients.get();
  const ingredients = new Map<string, Ingredient>();
  ingredientsSnapshot.docs.forEach((doc) => {
    ingredients.set(doc.id, { id: doc.id, ...doc.data() } as Ingredient);
  });

  // Get menu items for recommendations
  const menuItemsSnapshot = await collections.menuItems.get();
  const ingredientToMenuItems = new Map<string, string[]>();

  menuItemsSnapshot.docs.forEach((doc) => {
    const menuItem = doc.data() as MenuItem;
    if (menuItem.recipe) {
      for (const recipeItem of menuItem.recipe) {
        if (!ingredientToMenuItems.has(recipeItem.ingredientId)) {
          ingredientToMenuItems.set(recipeItem.ingredientId, []);
        }
        ingredientToMenuItems.get(recipeItem.ingredientId)!.push(menuItem.name);
      }
    }
  });

  for (const stockDoc of stockSnapshot.docs) {
    const stock = stockDoc.data() as IngredientStock;

    if (!stock.expiry_date) continue;

    const ingredient = ingredients.get(stock.ingredient_id);
    if (!ingredient) continue;

    const expiryDate = stock.expiry_date.toDate();
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only check items expiring within 14 days
    if (daysUntilExpiry > 14 || daysUntilExpiry < 0) continue;

    // Get predicted usage
    const { forecasts } = await generateSeasonalForecast(
      stock.ingredient_id,
      daysUntilExpiry
    );
    const predictedUsage = forecasts.reduce((sum, f) => sum + f.quantity, 0);

    // Calculate waste risk
    const excessStock = stock.quantity - predictedUsage;
    const wastePercent =
      stock.quantity > 0 ? (excessStock / stock.quantity) * 100 : 0;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (wastePercent >= 50 && daysUntilExpiry <= 3) {
      riskLevel = 'critical';
    } else if (wastePercent >= 30 || daysUntilExpiry <= 2) {
      riskLevel = 'high';
    } else if (wastePercent >= 15 || daysUntilExpiry <= 5) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    // Only report medium risk and above
    if (riskLevel === 'low') continue;

    // Generate AI recommendation
    let aiRecommendation: string | undefined;
    try {
      const menuItems = ingredientToMenuItems.get(stock.ingredient_id) || [];
      aiRecommendation = await generateExpiryRecommendation(
        ingredient.name,
        stock.quantity,
        daysUntilExpiry,
        predictedUsage,
        menuItems
      );
    } catch {
      // AI recommendation is optional
    }

    predictions.push({
      ingredient_id: stock.ingredient_id,
      predicted_waste: Math.max(0, excessStock),
      risk_level: riskLevel,
      expiry_date: stock.expiry_date,
      days_until_expiry: daysUntilExpiry,
      predicted_usage: predictedUsage,
      ai_recommendation: aiRecommendation,
      created_at: Timestamp.now(),
    });
  }

  return predictions;
}

/**
 * Save forecasts to Firestore
 */
export async function saveForecasts(ingredientId: string): Promise<number> {
  const { forecasts, confidence, dayCoefficients } =
    await generateSeasonalForecast(ingredientId);

  if (forecasts.length === 0) return 0;

  const batch = db.batch();

  for (const forecast of forecasts) {
    const docRef = collections.forecasts.doc();
    const forecastDoc: Forecast = {
      ingredient_id: ingredientId,
      forecast_date: Timestamp.fromDate(new Date(forecast.date)),
      forecast_quantity: forecast.quantity,
      confidence,
      model_version: 'seasonal-wma-v1',
      details: {
        method: 'Seasonality-aware Weighted Moving Average',
        weights: { recent: 0.6, last_week: 0.3, two_weeks: 0.1 },
        historical_data_points: 30,
        seasonality_factor: dayCoefficients.get(forecast.dayOfWeek),
      },
      created_at: Timestamp.now(),
    };
    batch.set(docRef, forecastDoc);
  }

  await batch.commit();
  return forecasts.length;
}

/**
 * Save waste predictions to Firestore
 */
export async function saveWastePredictions(
  predictions: WastePrediction[]
): Promise<number> {
  if (predictions.length === 0) return 0;

  const batch = db.batch();

  for (const prediction of predictions) {
    // Check for recent duplicate
    const recentCheck = await collections.wastePredictions
      .where('ingredient_id', '==', prediction.ingredient_id)
      .where(
        'created_at',
        '>=',
        Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000))
      )
      .limit(1)
      .get();

    if (recentCheck.empty) {
      const docRef = collections.wastePredictions.doc();
      batch.set(docRef, prediction);
    }
  }

  await batch.commit();
  return predictions.length;
}

/**
 * Generate all forecasts for all ingredients
 */
export async function generateAllForecasts(): Promise<{
  ingredientsProcessed: number;
  forecastsGenerated: number;
}> {
  const ingredientsSnapshot = await collections.ingredients.get();
  let forecastsGenerated = 0;

  for (const doc of ingredientsSnapshot.docs) {
    try {
      const count = await saveForecasts(doc.id);
      forecastsGenerated += count;
    } catch (error) {
      console.error(`Error generating forecast for ${doc.id}:`, error);
    }
  }

  return {
    ingredientsProcessed: ingredientsSnapshot.size,
    forecastsGenerated,
  };
}

