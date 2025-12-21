import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { toBaseUnit } from '../utils/unit-conversion';
import type { MenuItem } from '@/types/entities';

// Collection references
const menuItemsRef = collection(db, 'menu_items');
const ingredientStockRef = collection(db, 'ingredient_stock');
const stockLogsRef = collection(db, 'stock_logs');
const salesReportsRef = collection(db, 'sales_reports');

export interface DailySalesInput {
  menuItemId: string;
  quantity: number;
}

export interface RecordDailySalesResult {
  date: Date;
  totalRevenue: number;
  totalItemsSold: number;
  hadNegativeStock: boolean;
}

/**
 * Core engine to link Menu Sales to Inventory.
 *
 * For a given date and list of sold menu items:
 * - Loads menu item recipes
 * - Calculates total ingredient usage in base units
 * - Runs a Firestore transaction to:
 *   - Deduct ingredient stock (allowing negative/theoretical stock)
 *   - Create stock logs with reason "sale"
 *   - Persist a daily sales summary in "sales_reports"
 * - Returns a warning flag if any ingredient went negative.
 */
export async function recordDailySales(
  date: Date,
  branchId: string,
  sales: { menuItemId: string; quantity: number }[]
): Promise<RecordDailySalesResult> {
  if (!branchId) {
    throw new Error('branchId is required for data isolation');
  }
  if (!sales.length) {
    return {
      date,
      totalRevenue: 0,
      totalItemsSold: 0,
      hadNegativeStock: false,
    };
  }

  // 1) Load all distinct menu items used in this sales batch
  const uniqueMenuItemIds = Array.from(new Set(sales.map((s) => s.menuItemId)));
  const menuItemsById = new Map<string, MenuItem>();

  for (const menuItemId of uniqueMenuItemIds) {
    const menuItemDoc = await getDoc(doc(menuItemsRef, menuItemId));
    if (!menuItemDoc.exists()) {
      throw new Error(`Menu item not found: ${menuItemId}`);
    }
    const menuItem = { id: menuItemDoc.id, ...(menuItemDoc.data() as object) } as MenuItem;
    menuItemsById.set(menuItemId, menuItem);
  }

  // 2) Aggregate ingredient requirements (in base units) + compute revenue & totals
  const ingredientUsage = new Map<string, number>(); // ingredientId -> quantity in base units
  let totalRevenue = 0;
  let totalItemsSold = 0;

  for (const sale of sales) {
    const menuItem = menuItemsById.get(sale.menuItemId);
    if (!menuItem) continue;

    const quantitySold = sale.quantity;
    totalItemsSold += quantitySold;
    totalRevenue += (menuItem.price || 0) * quantitySold;

    if (!menuItem.recipe || !Array.isArray(menuItem.recipe)) continue;

    for (const recipeItem of menuItem.recipe) {
      const requiredQtyForSale = recipeItem.quantity * quantitySold;
      const baseQty = toBaseUnit(requiredQtyForSale, recipeItem.unit);

      const existing = ingredientUsage.get(recipeItem.ingredientId) || 0;
      ingredientUsage.set(recipeItem.ingredientId, existing + baseQty);
    }
  }

  if (!ingredientUsage.size) {
    // No ingredients involved (e.g., recipes not configured) – still write a sales report
    const reportId = date.toISOString().slice(0, 10); // YYYY-MM-DD
    await runTransaction(db, async (transaction) => {
      const reportRef = doc(salesReportsRef, reportId);
      transaction.set(reportRef, {
        date: Timestamp.fromDate(date),
        total_revenue: totalRevenue,
        total_items_sold: totalItemsSold,
        had_negative_stock: false,
        created_at: serverTimestamp(),
      });
    });

    return {
      date,
      totalRevenue,
      totalItemsSold,
      hadNegativeStock: false,
    };
  }

  // 3) Pre-resolve stock document IDs for each ingredient (similar to receivePurchaseOrder)
  // Filter by branchId for data isolation
  const stockDocIdByIngredient = new Map<string, string>();

  for (const ingredientId of ingredientUsage.keys()) {
    const q = query(
      ingredientStockRef,
      where('ingredient_id', '==', ingredientId),
      where('branch_id', '==', branchId),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      stockDocIdByIngredient.set(ingredientId, snap.docs[0].id);
    }
  }

  let hadNegativeStock = false;

  // 4) Transaction: apply deductions, create stock logs, write sales report
  const reportId = date.toISOString().slice(0, 10); // YYYY-MM-DD

  await runTransaction(db, async (transaction) => {
    // Read all current stock docs first
    const stockDocsById = new Map<string, any>();

    for (const [ingredientId, usageQty] of ingredientUsage.entries()) {
      if (usageQty === 0) continue;

      const existingStockId = stockDocIdByIngredient.get(ingredientId);
      if (existingStockId) {
        const stockRef = doc(ingredientStockRef, existingStockId);
        const stockDoc = await transaction.get(stockRef);
        stockDocsById.set(existingStockId, stockDoc);
      }
    }

    // Apply updates
    for (const [ingredientId, usageQty] of ingredientUsage.entries()) {
      if (usageQty === 0) continue;

      let stockRef;
      let currentQuantity = 0;

      const existingStockId = stockDocIdByIngredient.get(ingredientId);

      if (existingStockId) {
        stockRef = doc(ingredientStockRef, existingStockId);
        const stockDoc: any = stockDocsById.get(existingStockId);
        const stockData = stockDoc?.data() as { quantity?: number } | undefined;
        currentQuantity = stockData?.quantity ?? 0;
      } else {
        // Create new stock doc for this ingredient with zero starting quantity
        stockRef = doc(ingredientStockRef);
        transaction.set(stockRef, {
          ingredient_id: ingredientId,
          branch_id: branchId,
          quantity: 0,
          last_updated: serverTimestamp(),
          expiry_date: null,
        });
        currentQuantity = 0;
      }

      const newQuantity = currentQuantity - usageQty;

      // Allow stock to go negative but track that it happened
      if (newQuantity < 0) {
        hadNegativeStock = true;
      }

      transaction.update(stockRef, {
        quantity: newQuantity,
        last_updated: serverTimestamp(),
      });

      // Create stock log (negative change amount for sale usage)
      const logRef = doc(stockLogsRef);
      transaction.set(logRef, {
        ingredient_id: ingredientId,
        branch_id: branchId,
        change_amount: -usageQty,
        reason: 'sale',
        notes: 'Deducted via daily sales engine',
        created_at: serverTimestamp(),
      });
    }

    // Persist / upsert the daily sales summary
    const reportRef = doc(salesReportsRef, reportId);
    transaction.set(reportRef, {
      branch_id: branchId,
      date: Timestamp.fromDate(date),
      total_revenue: totalRevenue,
      total_items_sold: totalItemsSold,
      had_negative_stock: hadNegativeStock,
      created_at: serverTimestamp(),
    });
  });

  return {
    date,
    totalRevenue,
    totalItemsSold,
    hadNegativeStock,
  };
}

/**
 * Fetches today's sales report from sales_reports collection.
 * Returns the total revenue for today, or 0 if no sales have been recorded today.
 */
export async function getTodaySales(): Promise<number> {
  const today = new Date();
  const reportId = today.toISOString().slice(0, 10); // YYYY-MM-DD
  
  const reportRef = doc(salesReportsRef, reportId);
  const reportDoc = await getDoc(reportRef);
  
  if (!reportDoc.exists()) {
    return 0;
  }
  
  const data = reportDoc.data();
  return data.total_revenue || 0;
}

