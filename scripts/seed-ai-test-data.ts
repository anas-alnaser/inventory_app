/**
 * Seed script to generate test data for AI features
 * Run with: npx ts-node scripts/seed-ai-test-data.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import * as path from 'path';

// Initialize Firebase Admin
if (getApps().length === 0) {
  // Try to use service account if available, otherwise use default credentials
  try {
    const serviceAccountPath = path.join(__dirname, '../service-account.json');
    initializeApp({
      credential: cert(serviceAccountPath),
    });
  } catch {
    // Use application default credentials (works with Firebase CLI login)
    initializeApp({
      projectId: 'anas-9f395',
    });
  }
}

const db = getFirestore();

// Helper to create a date X days ago
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(Math.floor(Math.random() * 12) + 8); // Random hour between 8am-8pm
  return date;
}

// Helper to create a date X days in the future
function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// Sample ingredients with realistic restaurant data
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

// Day of week multipliers (0 = Sunday, 6 = Saturday)
// Restaurants are busier on weekends
const dayMultipliers = [0.7, 0.6, 0.7, 0.8, 1.0, 1.4, 1.3];

async function createSupplier(): Promise<string> {
  const supplierRef = db.collection('suppliers').doc();
  await supplierRef.set({
    name: 'Premium Food Distributors',
    phone: '+962791234567',
    email: 'orders@premiumfood.jo',
    contact_person: 'Ahmad Hassan',
    address: 'Amman, Jordan',
    payment_terms: 'Net 30',
    delivery_days: ['Monday', 'Wednesday', 'Friday'],
    created_at: Timestamp.now(),
  });
  console.log('✓ Created supplier:', supplierRef.id);
  return supplierRef.id;
}

async function createIngredients(supplierId: string): Promise<Map<string, { id: string; name: string; unit: string; baseUsage: number }>> {
  const ingredientMap = new Map();
  
  for (const ing of sampleIngredients) {
    const docRef = db.collection('ingredients').doc();
    await docRef.set({
      name: ing.name,
      unit: ing.unit,
      cost_per_unit: ing.cost,
      supplier_id: supplierId,
      category: ing.category,
      min_stock_level: ing.minStock,
      max_stock_level: ing.maxStock,
      created_at: Timestamp.now(),
    });
    
    // Base daily usage (will be modified by day multipliers)
    const baseUsage = ing.maxStock * 0.03; // ~3% of max stock per day
    ingredientMap.set(docRef.id, { 
      id: docRef.id, 
      name: ing.name, 
      unit: ing.unit,
      baseUsage 
    });
    console.log(`✓ Created ingredient: ${ing.name}`);
  }
  
  return ingredientMap;
}

async function createStockAndLogs(
  ingredientMap: Map<string, { id: string; name: string; unit: string; baseUsage: number }>,
  userId: string
): Promise<void> {
  const batch = db.batch();
  let logCount = 0;
  
  for (const [ingredientId, info] of ingredientMap) {
    // Create initial stock (from 45 days ago)
    const initialStockDate = daysAgo(45);
    const initialStock = info.baseUsage * 50; // ~50 days worth
    
    // Determine expiry date (some items expire soon for testing)
    let expiryDate: Date | null = null;
    if (['Whole Milk', 'Chicken Breast', 'Ground Beef'].includes(info.name)) {
      expiryDate = daysFromNow(Math.floor(Math.random() * 5) + 2); // 2-7 days
    } else if (['Butter', 'Eggs', 'Mozzarella Cheese'].includes(info.name)) {
      expiryDate = daysFromNow(Math.floor(Math.random() * 10) + 5); // 5-15 days
    }
    
    // Create stock record
    const stockRef = db.collection('ingredient_stock').doc();
    const currentStock = initialStock * 0.4; // ~40% remaining after usage
    batch.set(stockRef, {
      ingredient_id: ingredientId,
      quantity: currentStock,
      expiry_date: expiryDate ? Timestamp.fromDate(expiryDate) : null,
      last_updated: Timestamp.now(),
    });
    
    // Create initial purchase log
    const initialLogRef = db.collection('stock_logs').doc();
    batch.set(initialLogRef, {
      ingredient_id: ingredientId,
      user_id: userId,
      change_amount: initialStock,
      reason: 'purchase',
      notes: 'Initial stock',
      created_at: Timestamp.fromDate(initialStockDate),
    });
    logCount++;
    
    // Generate 40 days of usage logs
    for (let daysBack = 40; daysBack >= 0; daysBack--) {
      const logDate = daysAgo(daysBack);
      const dayOfWeek = logDate.getDay();
      const dayMultiplier = dayMultipliers[dayOfWeek];
      
      // Add some randomness (±30%)
      const randomFactor = 0.7 + Math.random() * 0.6;
      let usage = info.baseUsage * dayMultiplier * randomFactor;
      
      // Add anomaly: spike on a specific day (for testing anomaly detection)
      if (daysBack === 5 && info.name === 'Olive Oil') {
        usage = info.baseUsage * 4; // 4x normal usage - should trigger spike detection
      }
      
      // Add anomaly: unusual low usage
      if (daysBack === 3 && info.name === 'Chicken Breast') {
        usage = info.baseUsage * 0.1; // Very low usage
      }
      
      // Create usage log
      const usageLogRef = db.collection('stock_logs').doc();
      batch.set(usageLogRef, {
        ingredient_id: ingredientId,
        user_id: userId,
        change_amount: -Math.round(usage * 100) / 100, // Negative for usage
        reason: Math.random() > 0.9 ? 'waste' : 'consumption',
        notes: null,
        created_at: Timestamp.fromDate(logDate),
      });
      logCount++;
      
      // Occasional restock (every ~7 days)
      if (daysBack % 7 === 0 && daysBack > 0) {
        const restockLogRef = db.collection('stock_logs').doc();
        batch.set(restockLogRef, {
          ingredient_id: ingredientId,
          user_id: userId,
          change_amount: info.baseUsage * 10, // Restock ~10 days worth
          reason: 'purchase',
          notes: 'Weekly restock',
          created_at: Timestamp.fromDate(logDate),
        });
        logCount++;
      }
    }
    
    console.log(`✓ Created stock and ${40 + Math.floor(40/7)} logs for: ${info.name}`);
  }
  
  await batch.commit();
  console.log(`\n✓ Total logs created: ${logCount}`);
}

async function createMenuItemsWithRecipes(
  ingredientMap: Map<string, { id: string; name: string; unit: string; baseUsage: number }>
): Promise<void> {
  const ingredients = Array.from(ingredientMap.entries());
  
  // Find specific ingredients for recipes
  const findIngredient = (name: string) => {
    const entry = ingredients.find(([_, info]) => info.name === name);
    return entry ? { id: entry[0], name: entry[1].name } : null;
  };
  
  const menuItems = [
    {
      name: 'Classic Burger',
      category: 'Main Course',
      price: 8.50,
      recipe: [
        { ingredient: findIngredient('Ground Beef'), quantity: 200, unit: 'g' },
        { ingredient: findIngredient('Onions'), quantity: 30, unit: 'g' },
        { ingredient: findIngredient('Tomatoes'), quantity: 50, unit: 'g' },
        { ingredient: findIngredient('Mozzarella Cheese'), quantity: 40, unit: 'g' },
      ]
    },
    {
      name: 'Grilled Chicken Plate',
      category: 'Main Course', 
      price: 12.00,
      recipe: [
        { ingredient: findIngredient('Chicken Breast'), quantity: 250, unit: 'g' },
        { ingredient: findIngredient('Olive Oil'), quantity: 20, unit: 'mL' },
        { ingredient: findIngredient('Garlic'), quantity: 10, unit: 'g' },
        { ingredient: findIngredient('Rice'), quantity: 150, unit: 'g' },
      ]
    },
    {
      name: 'Cheese Omelette',
      category: 'Breakfast',
      price: 5.50,
      recipe: [
        { ingredient: findIngredient('Eggs'), quantity: 3, unit: 'piece' },
        { ingredient: findIngredient('Butter'), quantity: 15, unit: 'g' },
        { ingredient: findIngredient('Mozzarella Cheese'), quantity: 50, unit: 'g' },
        { ingredient: findIngredient('Whole Milk'), quantity: 30, unit: 'mL' },
      ]
    },
    {
      name: 'Fresh Pasta',
      category: 'Main Course',
      price: 10.00,
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
      created_at: Timestamp.now(),
    });
    console.log(`✓ Created menu item: ${item.name} with ${recipe.length} ingredients`);
  }
}

async function createPurchaseOrdersWithPriceCreep(
  ingredientMap: Map<string, { id: string; name: string; unit: string; baseUsage: number }>,
  supplierId: string
): Promise<void> {
  // Create 4 purchase orders over the past month with gradually increasing prices (price creep)
  const ingredients = Array.from(ingredientMap.entries());
  const oliveOil = ingredients.find(([_, info]) => info.name === 'Olive Oil');
  
  if (!oliveOil) return;
  
  const basePrices = [11.0, 11.5, 12.0, 13.5]; // ~23% increase over 4 orders
  
  for (let i = 0; i < 4; i++) {
    const orderDate = daysAgo(28 - (i * 7)); // Orders every 7 days
    const poNumber = `PO-${orderDate.toISOString().slice(0, 10).replace(/-/g, '')}-${1000 + i}`;
    
    await db.collection('purchase_orders').add({
      po_number: poNumber,
      supplier_id: supplierId,
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
      expected_delivery_date: Timestamp.fromDate(orderDate),
      created_at: Timestamp.fromDate(orderDate),
      updated_at: Timestamp.fromDate(orderDate),
    });
    console.log(`✓ Created PO ${poNumber} with Olive Oil at $${basePrices[i]}/L`);
  }
}

async function getOrCreateTestUser(): Promise<string> {
  // Try to find existing admin user
  const usersSnapshot = await db.collection('users').where('role', '==', 'admin').limit(1).get();
  
  if (!usersSnapshot.empty) {
    console.log('✓ Using existing admin user:', usersSnapshot.docs[0].id);
    return usersSnapshot.docs[0].id;
  }
  
  // Create a test user
  const userRef = db.collection('users').doc();
  await userRef.set({
    name: 'Test Admin',
    email: 'admin@test.com',
    role: 'admin',
    created_at: Timestamp.now(),
  });
  console.log('✓ Created test user:', userRef.id);
  return userRef.id;
}

async function main() {
  console.log('\n🚀 Starting AI Test Data Seeding...\n');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Get or create test user
    console.log('\n📝 Step 1: Setting up test user...');
    const userId = await getOrCreateTestUser();
    
    // Step 2: Create supplier
    console.log('\n📝 Step 2: Creating supplier...');
    const supplierId = await createSupplier();
    
    // Step 3: Create ingredients
    console.log('\n📝 Step 3: Creating ingredients...');
    const ingredientMap = await createIngredients(supplierId);
    
    // Step 4: Create stock and usage logs (40 days of history)
    console.log('\n📝 Step 4: Creating stock and 40 days of usage logs...');
    await createStockAndLogs(ingredientMap, userId);
    
    // Step 5: Create menu items with recipes
    console.log('\n📝 Step 5: Creating menu items with recipes...');
    await createMenuItemsWithRecipes(ingredientMap);
    
    // Step 6: Create purchase orders with price creep
    console.log('\n📝 Step 6: Creating purchase orders (for price creep detection)...');
    await createPurchaseOrdersWithPriceCreep(ingredientMap, supplierId);
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ AI Test Data Seeding Complete!\n');
    console.log('You can now test:');
    console.log('  - Forecasts page: /forecasts');
    console.log('  - Anomalies page: /anomalies (click "Run Detection")');
    console.log('  - Expiry risks (some items expire in 2-7 days)');
    console.log('  - Price creep detection (Olive Oil prices increased)');
    console.log('  - Menu-driven forecasting (4 menu items with recipes)');
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();

