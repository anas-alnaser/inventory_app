// Use v1 functions for easier deployment
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

import {
  runAllAnomalyDetection,
  detectUsageSpikes,
  detectPriceCreep,
  detectGhostInventory,
  detectTheoreticalVariance,
  saveAnomalies,
} from './ai/anomaly';
import {
  generateAllForecasts,
  generateSeasonalForecast,
  generateMenuDrivenForecast,
  calculateParLevels,
  detectExpiryRisks,
  saveForecasts,
  saveWastePredictions,
} from './ai/forecasting';
import {
  processInvoice,
  createPurchaseOrderFromInvoice,
  performVisualStockTake,
  applyVisualStockTakeResults,
} from './ai/vision';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Runtime options for functions
const runtimeOpts: functions.RuntimeOptions = {
  timeoutSeconds: 120,
  memory: '512MB',
  secrets: ['GEMINI_API_KEY'],
};

const heavyRuntimeOpts: functions.RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB',
  secrets: ['GEMINI_API_KEY'],
};

// ==================== SCHEDULED FUNCTIONS ====================

/**
 * Daily anomaly detection - runs at 2 AM UTC
 */
export const dailyAnomalyDetection = functions
  .runWith({ ...heavyRuntimeOpts })
  .pubsub.schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    console.log('Starting daily anomaly detection...');

    try {
      const results = await runAllAnomalyDetection();
      console.log('Anomaly detection complete:', results);
    } catch (error) {
      console.error('Error in daily anomaly detection:', error);
      throw error;
    }
  });

/**
 * Daily forecast generation - runs at 3 AM UTC
 */
export const dailyForecastGeneration = functions
  .runWith({ ...heavyRuntimeOpts })
  .pubsub.schedule('0 3 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    console.log('Starting daily forecast generation...');

    try {
      const results = await generateAllForecasts();
      console.log('Forecast generation complete:', results);

      // Also run expiry risk detection
      const expiryRisks = await detectExpiryRisks();
      const savedPredictions = await saveWastePredictions(expiryRisks);
      console.log(`Saved ${savedPredictions} waste predictions`);
    } catch (error) {
      console.error('Error in daily forecast generation:', error);
      throw error;
    }
  });

/**
 * Weekly ghost inventory check - runs Sunday at 4 AM UTC
 */
export const weeklyGhostInventoryCheck = functions
  .runWith({ ...runtimeOpts })
  .pubsub.schedule('0 4 * * 0')
  .timeZone('UTC')
  .onRun(async () => {
    console.log('Starting weekly ghost inventory check...');

    try {
      const ghostAnomalies = await detectGhostInventory(30);
      const savedCount = await saveAnomalies(ghostAnomalies);
      console.log(`Found and saved ${savedCount} ghost inventory anomalies`);
    } catch (error) {
      console.error('Error in weekly ghost inventory check:', error);
      throw error;
    }
  });

// ==================== HTTP CALLABLE FUNCTIONS ====================

/**
 * On-demand anomaly detection
 */
export const runAnomalyDetection = functions
  .runWith({ ...heavyRuntimeOpts })
  .https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { types } = data as { types?: string[] };

    try {
      const results: Record<string, number> = {};

      if (!types || types.includes('usage_spike')) {
        const spikes = await detectUsageSpikes();
        results.usage_spikes = await saveAnomalies(spikes);
      }

      if (!types || types.includes('price_creep')) {
        const priceCreep = await detectPriceCreep();
        results.price_creep = await saveAnomalies(priceCreep);
      }

      if (!types || types.includes('ghost_inventory')) {
        const ghost = await detectGhostInventory();
        results.ghost_inventory = await saveAnomalies(ghost);
      }

      if (!types || types.includes('theoretical_variance')) {
        const variance = await detectTheoreticalVariance();
        results.theoretical_variance = await saveAnomalies(variance);
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error in on-demand anomaly detection:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to run anomaly detection'
      );
    }
  });

/**
 * Generate forecast for specific ingredient
 */
export const generateForecast = functions
  .runWith({ ...runtimeOpts })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { ingredientId, days = 7 } = data as { ingredientId: string; days?: number };

    if (!ingredientId) {
      throw new functions.https.HttpsError('invalid-argument', 'ingredientId is required');
    }

    try {
      const forecast = await generateSeasonalForecast(ingredientId, days);

      // Save forecast to database
      if (forecast.forecasts.length > 0) {
        await saveForecasts(ingredientId);
      }

      return {
        success: true,
        forecast: {
          ingredientId,
          forecasts: forecast.forecasts,
          confidence: forecast.confidence,
          historicalAverage: forecast.historicalAverage,
        },
      };
    } catch (error) {
      console.error('Error generating forecast:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to generate forecast'
      );
    }
  });

/**
 * Get menu-driven ingredient requirements forecast
 */
export const getMenuDrivenForecast = functions
  .runWith({ ...runtimeOpts })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { days = 7 } = data as { days?: number };

    try {
      const requirements = await generateMenuDrivenForecast(days);

      // Convert Map to array for response
      const result = Array.from(requirements.entries()).map(
        ([ingredientId, reqData]) => ({
          ingredientId,
          requiredQuantity: reqData.quantity,
          usedInMenuItems: reqData.menuItems,
        })
      );

      return { success: true, requirements: result, days };
    } catch (error) {
      console.error('Error generating menu-driven forecast:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to generate forecast'
      );
    }
  });

/**
 * Get par level recommendations for an ingredient
 */
export const getParLevelRecommendation = functions
  .runWith({ memory: '256MB', timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { ingredientId, leadTimeDays = 3 } = data as { ingredientId: string; leadTimeDays?: number };

    if (!ingredientId) {
      throw new functions.https.HttpsError('invalid-argument', 'ingredientId is required');
    }

    try {
      const parLevels = await calculateParLevels(ingredientId, leadTimeDays);
      return { success: true, ...parLevels };
    } catch (error) {
      console.error('Error calculating par levels:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to calculate par levels'
      );
    }
  });

/**
 * Process invoice image with OCR
 */
export const processInvoiceOCR = functions
  .runWith({ ...heavyRuntimeOpts })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { imageBase64, mimeType } = data as { imageBase64: string; mimeType: string };

    if (!imageBase64 || !mimeType) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'imageBase64 and mimeType are required'
      );
    }

    // Validate mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid image type. Allowed: jpeg, png, webp'
      );
    }

    // Check image size (base64 is ~33% larger than original)
    const estimatedSize = (imageBase64.length * 3) / 4;
    if (estimatedSize > 5 * 1024 * 1024) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Image too large. Maximum size is 5MB'
      );
    }

    try {
      const result = await processInvoice(
        imageBase64,
        mimeType,
        context.auth.uid
      );
      return result;
    } catch (error) {
      console.error('Error processing invoice:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to process invoice'
      );
    }
  });

/**
 * Create purchase order from processed invoice
 */
export const createPOFromInvoice = functions
  .runWith({ memory: '256MB', timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { invoiceData, supplierId } = data as {
      invoiceData: {
        items: Array<{
          name: string;
          quantity: number;
          unit: string;
          unit_price: number;
          matched_ingredient_id?: string;
        }>;
        supplier_name?: string;
        invoice_number?: string;
        total?: number;
      };
      supplierId: string;
    };

    if (!invoiceData || !supplierId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'invoiceData and supplierId are required'
      );
    }

    try {
      const result = await createPurchaseOrderFromInvoice(
        invoiceData,
        supplierId,
        context.auth.uid
      );
      return result;
    } catch (error) {
      console.error('Error creating PO from invoice:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to create purchase order'
      );
    }
  });

/**
 * Visual stock taking from image
 */
export const visualStockTake = functions
  .runWith({ ...heavyRuntimeOpts })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { imageBase64, mimeType, notes } = data as {
      imageBase64: string;
      mimeType: string;
      notes?: string;
    };

    if (!imageBase64 || !mimeType) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'imageBase64 and mimeType are required'
      );
    }

    // Validate mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid image type. Allowed: jpeg, png, webp'
      );
    }

    try {
      const result = await performVisualStockTake(
        imageBase64,
        mimeType,
        context.auth.uid,
        notes
      );
      return result;
    } catch (error) {
      console.error('Error in visual stock take:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to analyze stock image'
      );
    }
  });

/**
 * Apply visual stock take results to inventory
 */
export const applyStockTakeResults = functions
  .runWith({ memory: '256MB', timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { items } = data as {
      items: Array<{
        matched_ingredient_id: string;
        estimated_quantity: number;
        unit: string;
      }>;
    };

    if (!items || !Array.isArray(items)) {
      throw new functions.https.HttpsError('invalid-argument', 'items array is required');
    }

    try {
      const result = await applyVisualStockTakeResults(items, context.auth.uid);
      return result;
    } catch (error) {
      console.error('Error applying stock take results:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to apply stock updates'
      );
    }
  });

/**
 * Get expiry risk predictions
 */
export const getExpiryRisks = functions
  .runWith({ ...runtimeOpts })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
      const risks = await detectExpiryRisks();
      await saveWastePredictions(risks);
      return { success: true, risks };
    } catch (error) {
      console.error('Error getting expiry risks:', error);
      throw new functions.https.HttpsError(
        'internal',
        error instanceof Error ? error.message : 'Failed to get expiry risks'
      );
    }
  });

// ==================== FIRESTORE TRIGGERS ====================

/**
 * Trigger on purchase order status change to received
 * Detects price creep when orders are received
 */
export const onPurchaseOrderReceived = functions
  .runWith({ ...runtimeOpts })
  .firestore.document('purchase_orders/{orderId}')
  .onWrite(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Only trigger when status changes to 'received'
    if (
      !afterData ||
      beforeData?.status === afterData.status ||
      afterData.status !== 'received'
    ) {
      return;
    }

    console.log(`Purchase order ${context.params.orderId} received, checking for price anomalies...`);

    try {
      // Check for price creep on the items in this order
      const priceAnomalies = await detectPriceCreep(10, 3);
      if (priceAnomalies.length > 0) {
        await saveAnomalies(priceAnomalies);
        console.log(`Detected ${priceAnomalies.length} price anomalies`);
      }
    } catch (error) {
      console.error('Error checking price anomalies:', error);
    }
  });

// ==================== SEED DATA FUNCTION ====================

/**
 * Seed test data for AI features
 * This creates ingredients, stock logs, menu items, and purchase orders
 */
export const seedAITestData = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .https.onRequest(async (req, res) => {
    // Allow CORS
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.status(204).send('');
      return;
    }
    const db = admin.firestore();
    
    // Helper functions
    const daysAgo = (days: number): Date => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      date.setHours(Math.floor(Math.random() * 12) + 8);
      return date;
    };
    
    const daysFromNow = (days: number): Date => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date;
    };

    // Sample ingredients
    const sampleIngredients = [
      { name: 'All-Purpose Flour', unit: 'kg', category: 'Dry Goods', cost: 1.5, minStock: 5000, maxStock: 25000 },
      { name: 'Whole Milk', unit: 'L', category: 'Dairy', cost: 1.2, minStock: 10, maxStock: 50 },
      { name: 'Chicken Breast', unit: 'kg', category: 'Meat', cost: 8.5, minStock: 5000, maxStock: 20000 },
      { name: 'Olive Oil', unit: 'L', category: 'Oils', cost: 12.0, minStock: 5, maxStock: 20 },
      { name: 'Tomatoes', unit: 'kg', category: 'Produce', cost: 3.0, minStock: 3000, maxStock: 15000 },
      { name: 'Onions', unit: 'kg', category: 'Produce', cost: 1.0, minStock: 5000, maxStock: 20000 },
      { name: 'Garlic', unit: 'kg', category: 'Produce', cost: 8.0, minStock: 500, maxStock: 3000 },
      { name: 'Rice', unit: 'kg', category: 'Dry Goods', cost: 2.0, minStock: 10000, maxStock: 50000 },
      { name: 'Butter', unit: 'kg', category: 'Dairy', cost: 10.0, minStock: 2000, maxStock: 10000 },
      { name: 'Eggs', unit: 'piece', category: 'Dairy', cost: 0.25, minStock: 60, maxStock: 300 },
      { name: 'Mozzarella Cheese', unit: 'kg', category: 'Dairy', cost: 15.0, minStock: 2000, maxStock: 10000 },
      { name: 'Ground Beef', unit: 'kg', category: 'Meat', cost: 12.0, minStock: 3000, maxStock: 15000 },
    ];

    const dayMultipliers = [0.7, 0.6, 0.7, 0.8, 1.0, 1.4, 1.3];

    try {
      console.log('Starting AI test data seeding...');
      
      // Step 1: Create supplier
      const supplierRef = db.collection('suppliers').doc();
      await supplierRef.set({
        name: 'Premium Food Distributors',
        phone: '+962791234567',
        email: 'orders@premiumfood.jo',
        contact_person: 'Ahmad Hassan',
        address: 'Amman, Jordan',
        payment_terms: 'Net 30',
        delivery_days: ['Monday', 'Wednesday', 'Friday'],
        created_at: admin.firestore.Timestamp.now(),
      });
      console.log('Created supplier:', supplierRef.id);
      
      // Step 2: Get or create test user
      const usersSnapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();
      let userId: string;
      if (!usersSnapshot.empty) {
        userId = usersSnapshot.docs[0].id;
      } else {
        const userRef = db.collection('users').doc();
        await userRef.set({
          name: 'Test Admin',
          email: 'admin@test.com',
          role: 'admin',
          created_at: admin.firestore.Timestamp.now(),
        });
        userId = userRef.id;
      }
      console.log('Using user:', userId);
      
      // Step 3: Create ingredients and track IDs
      const ingredientMap = new Map<string, { id: string; name: string; unit: string; baseUsage: number }>();
      
      for (const ing of sampleIngredients) {
        const docRef = db.collection('ingredients').doc();
        await docRef.set({
          name: ing.name,
          unit: ing.unit,
          cost_per_unit: ing.cost,
          supplier_id: supplierRef.id,
          category: ing.category,
          min_stock_level: ing.minStock,
          max_stock_level: ing.maxStock,
          created_at: admin.firestore.Timestamp.now(),
        });
        const baseUsage = ing.maxStock * 0.03;
        ingredientMap.set(docRef.id, { id: docRef.id, name: ing.name, unit: ing.unit, baseUsage });
        console.log('Created ingredient:', ing.name);
      }
      
      // Step 4: Create stock and logs
      let totalLogs = 0;
      for (const [ingredientId, info] of ingredientMap) {
        const initialStockDate = daysAgo(45);
        const initialStock = info.baseUsage * 50;
        
        let expiryDate: Date | null = null;
        if (['Whole Milk', 'Chicken Breast', 'Ground Beef'].includes(info.name)) {
          expiryDate = daysFromNow(Math.floor(Math.random() * 5) + 2);
        } else if (['Butter', 'Eggs', 'Mozzarella Cheese'].includes(info.name)) {
          expiryDate = daysFromNow(Math.floor(Math.random() * 10) + 5);
        }
        
        // Create stock record
        const currentStock = initialStock * 0.4;
        await db.collection('ingredient_stock').add({
          ingredient_id: ingredientId,
          quantity: currentStock,
          expiry_date: expiryDate ? admin.firestore.Timestamp.fromDate(expiryDate) : null,
          last_updated: admin.firestore.Timestamp.now(),
        });
        
        // Create initial purchase log
        await db.collection('stock_logs').add({
          ingredient_id: ingredientId,
          user_id: userId,
          change_amount: initialStock,
          reason: 'purchase',
          notes: 'Initial stock',
          created_at: admin.firestore.Timestamp.fromDate(initialStockDate),
        });
        totalLogs++;
        
        // Generate 40 days of usage logs
        for (let daysBack = 40; daysBack >= 0; daysBack--) {
          const logDate = daysAgo(daysBack);
          const dayOfWeek = logDate.getDay();
          const dayMultiplier = dayMultipliers[dayOfWeek];
          const randomFactor = 0.7 + Math.random() * 0.6;
          let usage = info.baseUsage * dayMultiplier * randomFactor;
          
          // Add anomalies for testing
          if (daysBack === 5 && info.name === 'Olive Oil') {
            usage = info.baseUsage * 4; // Spike
          }
          if (daysBack === 3 && info.name === 'Chicken Breast') {
            usage = info.baseUsage * 0.1; // Low usage
          }
          
          await db.collection('stock_logs').add({
            ingredient_id: ingredientId,
            user_id: userId,
            change_amount: -Math.round(usage * 100) / 100,
            reason: Math.random() > 0.9 ? 'waste' : 'consumption',
            notes: null,
            created_at: admin.firestore.Timestamp.fromDate(logDate),
          });
          totalLogs++;
          
          // Weekly restock
          if (daysBack % 7 === 0 && daysBack > 0) {
            await db.collection('stock_logs').add({
              ingredient_id: ingredientId,
              user_id: userId,
              change_amount: info.baseUsage * 10,
              reason: 'purchase',
              notes: 'Weekly restock',
              created_at: admin.firestore.Timestamp.fromDate(logDate),
            });
            totalLogs++;
          }
        }
        console.log('Created logs for:', info.name);
      }
      console.log('Total logs created:', totalLogs);
      
      // Step 5: Create menu items with recipes
      const ingredients = Array.from(ingredientMap.entries());
      const findIngredient = (name: string) => {
        const entry = ingredients.find(([, info]) => info.name === name);
        return entry ? { id: entry[0], name: entry[1].name } : null;
      };
      
      const menuItems = [
        {
          name: 'Classic Burger', category: 'Main Course', price: 8.50,
          recipe: [
            { ingredient: findIngredient('Ground Beef'), quantity: 200, unit: 'g' },
            { ingredient: findIngredient('Onions'), quantity: 30, unit: 'g' },
            { ingredient: findIngredient('Tomatoes'), quantity: 50, unit: 'g' },
            { ingredient: findIngredient('Mozzarella Cheese'), quantity: 40, unit: 'g' },
          ]
        },
        {
          name: 'Grilled Chicken Plate', category: 'Main Course', price: 12.00,
          recipe: [
            { ingredient: findIngredient('Chicken Breast'), quantity: 250, unit: 'g' },
            { ingredient: findIngredient('Olive Oil'), quantity: 20, unit: 'mL' },
            { ingredient: findIngredient('Garlic'), quantity: 10, unit: 'g' },
            { ingredient: findIngredient('Rice'), quantity: 150, unit: 'g' },
          ]
        },
        {
          name: 'Cheese Omelette', category: 'Breakfast', price: 5.50,
          recipe: [
            { ingredient: findIngredient('Eggs'), quantity: 3, unit: 'piece' },
            { ingredient: findIngredient('Butter'), quantity: 15, unit: 'g' },
            { ingredient: findIngredient('Mozzarella Cheese'), quantity: 50, unit: 'g' },
            { ingredient: findIngredient('Whole Milk'), quantity: 30, unit: 'mL' },
          ]
        },
        {
          name: 'Fresh Pasta', category: 'Main Course', price: 10.00,
          recipe: [
            { ingredient: findIngredient('All-Purpose Flour'), quantity: 100, unit: 'g' },
            { ingredient: findIngredient('Eggs'), quantity: 1, unit: 'piece' },
            { ingredient: findIngredient('Olive Oil'), quantity: 10, unit: 'mL' },
            { ingredient: findIngredient('Tomatoes'), quantity: 100, unit: 'g' },
            { ingredient: findIngredient('Garlic'), quantity: 5, unit: 'g' },
          ]
        },
      ];
      
      for (const item of menuItems) {
        const recipe = item.recipe
          .filter(r => r.ingredient !== null)
          .map(r => ({
            ingredientId: r.ingredient!.id,
            ingredientName: r.ingredient!.name,
            quantity: r.quantity,
            unit: r.unit,
          }));
        
        await db.collection('menu_items').add({
          name: item.name,
          category: item.category,
          price: item.price,
          recipe: recipe,
          created_at: admin.firestore.Timestamp.now(),
        });
        console.log('Created menu item:', item.name);
      }
      
      // Step 6: Create purchase orders with price creep
      const oliveOil = ingredients.find(([, info]) => info.name === 'Olive Oil');
      if (oliveOil) {
        const basePrices = [11.0, 11.5, 12.0, 13.5];
        for (let i = 0; i < 4; i++) {
          const orderDate = daysAgo(28 - (i * 7));
          const poNumber = `PO-${orderDate.toISOString().slice(0, 10).replace(/-/g, '')}-${1000 + i}`;
          
          await db.collection('purchase_orders').add({
            po_number: poNumber,
            supplier_id: supplierRef.id,
            supplier_name: 'Premium Food Distributors',
            status: 'received',
            items: [{
              ingredient_id: oliveOil[0],
              name: 'Olive Oil',
              quantity: 10,
              unit: 'L',
              cost_per_unit: basePrices[i],
              total_cost: basePrices[i] * 10,
            }],
            total_cost: basePrices[i] * 10,
            expected_delivery_date: admin.firestore.Timestamp.fromDate(orderDate),
            created_at: admin.firestore.Timestamp.fromDate(orderDate),
            updated_at: admin.firestore.Timestamp.fromDate(orderDate),
          });
          console.log('Created PO:', poNumber);
        }
      }
      
      res.json({
        success: true,
        message: 'AI test data seeding complete!',
        stats: {
          ingredients: sampleIngredients.length,
          logs: totalLogs,
          menuItems: menuItems.length,
          purchaseOrders: 4,
        }
      });
      
    } catch (error) {
      console.error('Error seeding data:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });

/**
 * Seed AI Anomalies and Forecasts directly for testing
 * This creates pre-generated anomalies and forecasts to display on the dashboard
 */
export const seedAnomaliesAndForecasts = functions
  .runWith(heavyRuntimeOpts)
  .https.onRequest(async (req, res) => {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    
    try {
      const db = admin.firestore();
      const now = admin.firestore.Timestamp.now();
      
      // Get existing ingredients to reference
      const ingredientsSnapshot = await db.collection('ingredients').limit(10).get();
      const ingredients: Array<{ id: string; name: string; unit: string }> = [];
      
      ingredientsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        ingredients.push({ id: doc.id, name: data.name, unit: data.unit });
      });
      
      if (ingredients.length === 0) {
        res.status(400).json({ 
          success: false, 
          error: 'No ingredients found. Please run seedAITestData first.' 
        });
        return;
      }
      
      // ============================================
      // STEP 1: Create 7 Different Anomaly Scenarios
      // ============================================
      
      const anomalies = [
        // 1. Usage Spike - Critical (unexpected high consumption)
        {
          type: 'usage_spike',
          ingredient_id: ingredients[0]?.id || 'unknown',
          severity: 'critical',
          description: `Usage of "${ingredients[0]?.name || 'Tomatoes'}" was 340% higher than normal yesterday (85.5 vs avg 25.3 ${ingredients[0]?.unit || 'kg'})`,
          details: {
            expected_value: 25.3,
            actual_value: 85.5,
            deviation_percent: 340,
            z_score: 4.2,
          },
          ai_recommendation: 'This extreme spike suggests either a special event, catering order, or potential data entry error. Review yesterday\'s sales data and verify if there was a special event. If not, check for accidental duplicate stock deductions or waste incidents that weren\'t properly logged.',
          created_at: now,
          resolved: false,
        },
        
        // 2. Usage Spike - Medium (moderate increase)
        {
          type: 'usage_spike',
          ingredient_id: ingredients[1]?.id || 'unknown',
          severity: 'medium',
          description: `Usage of "${ingredients[1]?.name || 'Chicken Breast'}" was 75% higher than normal yesterday (18.2 vs avg 10.4 ${ingredients[1]?.unit || 'kg'})`,
          details: {
            expected_value: 10.4,
            actual_value: 18.2,
            deviation_percent: 75,
            z_score: 2.6,
          },
          ai_recommendation: 'Moderate increase detected. This could indicate increased customer demand for dishes containing this ingredient. Consider checking if any promotions are running or if a popular dish was featured. Monitor for the next 2-3 days to see if this becomes a trend.',
          created_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
          resolved: false,
        },
        
        // 3. Theoretical Variance - High (recipe vs actual mismatch)
        {
          type: 'theoretical_variance',
          ingredient_id: ingredients[2]?.id || 'unknown',
          severity: 'high',
          description: `Used 45% more "${ingredients[2]?.name || 'Mozzarella Cheese'}" than expected based on sales (Actual: 28.5 vs Expected: 19.6 ${ingredients[2]?.unit || 'kg'})`,
          details: {
            expected_value: 19.6,
            actual_value: 28.5,
            deviation_percent: 45.4,
          },
          ai_recommendation: 'Significant variance detected between theoretical recipe usage and actual consumption. Possible causes: 1) Portion control issues - staff may be over-portioning, 2) Recipe quantities need updating, 3) Unrecorded waste or spillage, 4) Theft. Recommend conducting portion size audit and reviewing waste logs.',
          created_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 4 * 60 * 60 * 1000)),
          resolved: false,
        },
        
        // 4. Price Creep - High (supplier gradually increasing prices)
        {
          type: 'price_creep',
          ingredient_id: ingredients[3]?.id || 'unknown',
          severity: 'high',
          description: `Price of "${ingredients[3]?.name || 'Olive Oil'}" from Premium Suppliers increased by 22.7% over the last 4 orders`,
          details: {
            expected_value: 11.0,
            actual_value: 13.5,
            price_change_percent: 22.7,
            supplier_id: 'supplier_premium',
          },
          ai_recommendation: 'Significant cumulative price increase detected. This gradual increase may have gone unnoticed per order but has substantial impact. Recommend: 1) Contact supplier to negotiate better rates, 2) Request price match from alternative suppliers, 3) Consider bulk ordering to lock in prices, 4) Review if menu prices need adjustment to maintain margins.',
          created_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 6 * 60 * 60 * 1000)),
          resolved: false,
        },
        
        // 5. Ghost Inventory - Medium (items not moving)
        {
          type: 'ghost_inventory',
          ingredient_id: ingredients[4]?.id || 'unknown',
          severity: 'medium',
          description: `"${ingredients[4]?.name || 'Saffron'}" shows 250 g in stock but hasn't had any activity in 45 days. Please verify actual stock.`,
          details: {
            actual_value: 250,
            days_inactive: 45,
          },
          ai_recommendation: 'This ingredient shows stock but no recent usage. Possible scenarios: 1) Physical inventory doesn\'t match system records, 2) Item is expired or spoiled but not written off, 3) Menu items using this ingredient are not selling, 4) Staff using alternative ingredients. Recommend immediate physical count and quality check.',
          created_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 8 * 60 * 60 * 1000)),
          resolved: false,
        },
        
        // 6. Theoretical Variance - Low usage (less than expected)
        {
          type: 'theoretical_variance',
          ingredient_id: ingredients[5]?.id || 'unknown',
          severity: 'low',
          description: `Used 18% less "${ingredients[5]?.name || 'Fresh Basil'}" than expected based on sales (Actual: 2.1 vs Expected: 2.6 ${ingredients[5]?.unit || 'kg'})`,
          details: {
            expected_value: 2.6,
            actual_value: 2.1,
            deviation_percent: -18.2,
          },
          ai_recommendation: 'Minor under-usage detected. While this could indicate good portion control, verify that dishes are being prepared to recipe standards. Check if garnishes are being skipped during busy periods or if quality is being maintained.',
          created_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 60 * 1000)),
          resolved: false,
        },
        
        // 7. Usage Spike - Low (slight variation, informational)
        {
          type: 'usage_spike',
          ingredient_id: ingredients[6]?.id || ingredients[0]?.id || 'unknown',
          severity: 'low',
          description: `Usage of "${ingredients[6]?.name || ingredients[0]?.name || 'Flour'}" was 35% lower than normal yesterday (8.2 vs avg 12.6 ${ingredients[6]?.unit || 'kg'})`,
          details: {
            expected_value: 12.6,
            actual_value: 8.2,
            deviation_percent: -35,
            z_score: -2.1,
          },
          ai_recommendation: 'Below-average usage detected. This could be due to slower business day, menu items being unavailable, or seasonal variation. If this trend continues, consider adjusting order quantities to prevent waste.',
          created_at: admin.firestore.Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)),
          resolved: false,
        },
      ];
      
      // Save anomalies to Firestore
      let anomalyCount = 0;
      for (const anomaly of anomalies) {
        await db.collection('anomalies').add(anomaly);
        anomalyCount++;
      }
      console.log(`Created ${anomalyCount} anomalies`);
      
      // ============================================
      // STEP 2: Create AI Forecasts for next 7 days
      // ============================================
      
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const forecasts: Array<Record<string, unknown>> = [];
      
      for (const ingredient of ingredients.slice(0, 6)) {
        // Base consumption varies by ingredient
        const baseConsumption = Math.random() * 20 + 10; // 10-30 units base
        
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const forecastDate = new Date();
          forecastDate.setDate(forecastDate.getDate() + dayOffset);
          forecastDate.setHours(0, 0, 0, 0);
          
          const dayOfWeek = forecastDate.getDay();
          const dayName = daysOfWeek[dayOfWeek];
          
          // Weekend multiplier (higher on Fri/Sat)
          let weekendMultiplier = 1.0;
          if (dayOfWeek === 5) weekendMultiplier = 1.4; // Friday
          if (dayOfWeek === 6) weekendMultiplier = 1.5; // Saturday
          if (dayOfWeek === 0) weekendMultiplier = 1.2; // Sunday
          
          // Add some randomness
          const randomFactor = 0.9 + Math.random() * 0.2;
          const predictedQuantity = Math.round(baseConsumption * weekendMultiplier * randomFactor * 10) / 10;
          
          // Confidence decreases as we forecast further out
          const confidence = Math.round((95 - dayOffset * 3) * 10) / 10;
          
          forecasts.push({
            ingredient_id: ingredient.id,
            ingredient_name: ingredient.name,
            forecast_date: admin.firestore.Timestamp.fromDate(forecastDate),
            predicted_quantity: predictedQuantity,
            unit: ingredient.unit,
            confidence: confidence,
            day_of_week: dayName,
            is_weekend: dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6,
            algorithm: 'seasonality_aware_weighted_average',
            factors: {
              historical_average: Math.round(baseConsumption * 10) / 10,
              day_of_week_coefficient: weekendMultiplier,
              trend_adjustment: randomFactor > 1 ? 'increasing' : 'stable',
              seasonal_factor: 1.0,
            },
            ai_explanation: dayOfWeek === 5 || dayOfWeek === 6 
              ? `Higher demand expected for ${dayName} based on historical weekend patterns. Consider increasing prep quantities.`
              : dayOfWeek === 1 
                ? `Monday typically shows lower demand after weekend. Current stock should be sufficient.`
                : `Normal weekday demand expected. Maintain standard prep levels.`,
            created_at: now,
          });
        }
      }
      
      // Save forecasts to Firestore
      let forecastCount = 0;
      for (const forecast of forecasts) {
        await db.collection('forecasts').add(forecast);
        forecastCount++;
      }
      console.log(`Created ${forecastCount} forecasts`);
      
      // ============================================
      // STEP 3: Create Expiry Risk Items
      // ============================================
      
      const expiryRisks = [
        {
          ingredient_id: ingredients[0]?.id || 'unknown',
          ingredient_name: ingredients[0]?.name || 'Tomatoes',
          current_quantity: 15.5,
          unit: ingredients[0]?.unit || 'kg',
          expiry_date: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)), // 2 days
          days_until_expiry: 2,
          predicted_days_to_consume: 4.5,
          risk_level: 'high',
          ai_recommendation: 'High expiry risk! At current consumption rate, this will expire before fully used. Suggestions: 1) Feature in daily specials, 2) Prepare batch items (sauce, soup), 3) Offer staff meals, 4) Consider composting if quality degrades.',
          created_at: now,
        },
        {
          ingredient_id: ingredients[1]?.id || 'unknown',
          ingredient_name: ingredients[1]?.name || 'Chicken Breast',
          current_quantity: 8.2,
          unit: ingredients[1]?.unit || 'kg',
          expiry_date: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)), // 3 days
          days_until_expiry: 3,
          predicted_days_to_consume: 2.8,
          risk_level: 'medium',
          ai_recommendation: 'Monitor closely. Current consumption should use this before expiry, but schedule usage in next 2 days to be safe. Consider marinating to extend usability.',
          created_at: now,
        },
        {
          ingredient_id: ingredients[2]?.id || 'unknown',
          ingredient_name: ingredients[2]?.name || 'Mozzarella Cheese',
          current_quantity: 4.0,
          unit: ingredients[2]?.unit || 'kg',
          expiry_date: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)), // 5 days
          days_until_expiry: 5,
          predicted_days_to_consume: 3.2,
          risk_level: 'low',
          ai_recommendation: 'Low risk. Expected to be consumed well before expiry date based on current usage patterns.',
          created_at: now,
        },
      ];
      
      let expiryCount = 0;
      for (const risk of expiryRisks) {
        await db.collection('expiry_risks').add(risk);
        expiryCount++;
      }
      console.log(`Created ${expiryCount} expiry risks`);
      
      // ============================================
      // STEP 4: Create Par Level Recommendations
      // ============================================
      
      const parLevelRecommendations = [];
      for (const ingredient of ingredients.slice(0, 5)) {
        const avgDailyUsage = Math.round((Math.random() * 10 + 5) * 10) / 10;
        const leadTimeDays = Math.floor(Math.random() * 3) + 1;
        const safetyFactor = 1.5;
        const recommendedParLevel = Math.round(avgDailyUsage * leadTimeDays * safetyFactor * 10) / 10;
        const currentParLevel = Math.round(recommendedParLevel * (0.7 + Math.random() * 0.6) * 10) / 10;
        
        parLevelRecommendations.push({
          ingredient_id: ingredient.id,
          ingredient_name: ingredient.name,
          unit: ingredient.unit,
          current_par_level: currentParLevel,
          recommended_par_level: recommendedParLevel,
          avg_daily_usage: avgDailyUsage,
          lead_time_days: leadTimeDays,
          safety_factor: safetyFactor,
          adjustment_needed: recommendedParLevel - currentParLevel,
          ai_explanation: currentParLevel < recommendedParLevel 
            ? `Current par level is ${Math.round((recommendedParLevel - currentParLevel) / currentParLevel * 100)}% below recommended. Risk of stockouts during high-demand periods.`
            : `Par level is adequate. Consider maintaining current levels.`,
          created_at: now,
        });
      }
      
      let parCount = 0;
      for (const rec of parLevelRecommendations) {
        await db.collection('par_level_recommendations').add(rec);
        parCount++;
      }
      console.log(`Created ${parCount} par level recommendations`);
      
      res.json({
        success: true,
        message: 'AI Anomalies and Forecasts seeding complete!',
        stats: {
          anomalies: anomalyCount,
          forecasts: forecastCount,
          expiryRisks: expiryCount,
          parLevelRecommendations: parCount,
        }
      });
      
    } catch (error) {
      console.error('Error seeding anomalies and forecasts:', error);
      res.status(500).json({ success: false, error: (error as Error).message });
    }
  });
