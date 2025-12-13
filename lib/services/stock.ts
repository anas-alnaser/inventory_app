import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  limit,
  orderBy,
  Timestamp,
  serverTimestamp,
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { IngredientStock, StockLogReason } from '@/types/entities';
import { toBaseUnit } from '../utils/unit-conversion';
import { getIngredientById } from './ingredients';
import type { Ingredient } from '@/types/entities';

// Collection references
const ingredientStockRef = collection(db, 'ingredient_stock');
const stockLogsRef = collection(db, 'stock_logs');

export interface StockWithIngredient extends IngredientStock {
  ingredient?: Ingredient;
}

export async function getAllStock(): Promise<StockWithIngredient[]> {
  const q = query(ingredientStockRef, orderBy('last_updated', 'desc'));
  const snapshot = await getDocs(q);
  const stocks = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as object),
  })) as IngredientStock[];

  // Fetch ingredient details for each stock item
  const stocksWithIngredients: StockWithIngredient[] = await Promise.all(
    stocks.map(async (stock) => {
      const ingredient = await getIngredientById(stock.ingredient_id);
      return {
        ...stock,
        ingredient: ingredient || undefined,
      };
    })
  );

  return stocksWithIngredients;
}

export async function getStockByIngredient(
  ingredientId: string
): Promise<IngredientStock | null> {
  const q = query(
    ingredientStockRef,
    where('ingredient_id', '==', ingredientId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as object) } as IngredientStock;
}

export interface AddStockData {
  ingredient_id: string;
  quantity: number;
  unit: string;
  expiry_date?: Date;
  user_id: string;
  notes?: string;
}

export async function addStock(data: AddStockData): Promise<void> {
  // Convert to base units
  const baseQuantity = toBaseUnit(data.quantity, data.unit);

  // Check if stock record exists
  const existingStock = await getStockByIngredient(data.ingredient_id);

  const batch = writeBatch(db);

  if (existingStock) {
    // Update existing stock
    const stockRef = doc(ingredientStockRef, existingStock.id);
    batch.update(stockRef, {
      quantity: existingStock.quantity + baseQuantity,
      last_updated: serverTimestamp(),
      ...(data.expiry_date && { expiry_date: Timestamp.fromDate(data.expiry_date) }),
    });
  } else {
    // Create new stock record
    const newStockRef = doc(ingredientStockRef);
    batch.set(newStockRef, {
      ingredient_id: data.ingredient_id,
      quantity: baseQuantity,
      expiry_date: data.expiry_date ? Timestamp.fromDate(data.expiry_date) : null,
      last_updated: serverTimestamp(),
    });
  }

  // Create stock log
  const logRef = doc(stockLogsRef);
  batch.set(logRef, {
    ingredient_id: data.ingredient_id,
    user_id: data.user_id,
    change_amount: baseQuantity,
    reason: 'purchase' as StockLogReason,
    notes: data.notes || null,
    created_at: serverTimestamp(),
  });

  await batch.commit();
}

export interface UseStockData {
  ingredient_id: string;
  quantity: number;
  unit: string;
  user_id: string;
  reason?: StockLogReason;
  notes?: string;
}

export async function useStock(data: UseStockData): Promise<void> {
  // Convert to base units
  const baseQuantity = toBaseUnit(data.quantity, data.unit);

  // Get existing stock
  const existingStock = await getStockByIngredient(data.ingredient_id);
  if (!existingStock) {
    throw new Error('Stock record not found');
  }

  // Validate sufficient stock
  if (existingStock.quantity < baseQuantity) {
    throw new Error('Insufficient stock');
  }

  const batch = writeBatch(db);

  // Update stock
  const stockRef = doc(ingredientStockRef, existingStock.id);
  batch.update(stockRef, {
    quantity: existingStock.quantity - baseQuantity,
    last_updated: serverTimestamp(),
  });

  // Create stock log (negative amount for usage)
  const logRef = doc(stockLogsRef);
  batch.set(logRef, {
    ingredient_id: data.ingredient_id,
    user_id: data.user_id,
    change_amount: -baseQuantity,
    reason: data.reason || 'sale',
    notes: data.notes || null,
    created_at: serverTimestamp(),
  });

  await batch.commit();
}

export async function updateStockTransaction(
  ingredientId: string,
  changeAmount: number, // Positive to add, negative to subtract
  userId: string,
  reason: StockLogReason = 'adjustment',
  notes?: string
): Promise<void> {
  // First, find the stock record outside the transaction
  const stockQuery = query(
    ingredientStockRef,
    where('ingredient_id', '==', ingredientId),
    limit(1)
  );
  const stockSnapshot = await getDocs(stockQuery);
  
  await runTransaction(db, async (transaction) => {
    let stockRef: any;
    let currentQuantity = 0;
    
    if (!stockSnapshot.empty) {
      stockRef = doc(ingredientStockRef, stockSnapshot.docs[0].id);     
      const stockDoc = await transaction.get(stockRef);
      const stockData = stockDoc.data() as IngredientStock | undefined;
      currentQuantity = stockData?.quantity || 0;
    } else {
      // Create new stock record if it doesn't exist
      stockRef = doc(ingredientStockRef);
      transaction.set(stockRef, {
        ingredient_id: ingredientId,
        quantity: 0,
        last_updated: serverTimestamp(),
      });
    }
    
    const newQuantity = currentQuantity + changeAmount;
    
    // Prevent negative stock
    if (newQuantity < 0) {
      throw new Error('Insufficient stock. Cannot go below zero.');
    }
    
    // Update stock
    transaction.update(stockRef, {
      quantity: newQuantity,
      last_updated: serverTimestamp(),
    });
    
    // Create stock log
    const logRef = doc(stockLogsRef);
    transaction.set(logRef, {
      ingredient_id: ingredientId,
      user_id: userId,
      change_amount: changeAmount,
      reason,
      notes: notes || null,
      created_at: serverTimestamp(),
    });
  });
}

