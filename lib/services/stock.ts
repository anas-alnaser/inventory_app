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

export async function getAllStock(branchId: string): Promise<StockWithIngredient[]> {
  if (!branchId) {
    throw new Error('branchId is required for data isolation');
  }

  const q = query(
    ingredientStockRef,
    where('branch_id', '==', branchId),
    orderBy('last_updated', 'desc')
  );
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
  ingredientId: string,
  branchId: string
): Promise<IngredientStock | null> {
  if (!branchId) {
    throw new Error('branchId is required for data isolation');
  }

  const q = query(
    ingredientStockRef,
    where('ingredient_id', '==', ingredientId),
    where('branch_id', '==', branchId),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as object) } as IngredientStock;
}

export interface AddStockData {
  ingredient_id: string;
  branchId: string; // Required for data isolation
  quantity: number;
  unit: string;
  expiry_date?: Date;
  user_id: string;
  notes?: string;
}

export async function addStock(data: AddStockData): Promise<void> {
  if (!data.branchId) {
    throw new Error('branchId is required for data isolation');
  }

  // Convert to base units
  const baseQuantity = toBaseUnit(data.quantity, data.unit);

  // Check if stock record exists (filtered by branchId)
  const existingStock = await getStockByIngredient(data.ingredient_id, data.branchId);

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
    const newStockData: any = {
      ingredient_id: data.ingredient_id,
      branch_id: data.branchId,
      quantity: baseQuantity,
      last_updated: serverTimestamp(),
    };
    
    // Only add expiry_date if provided
    if (data.expiry_date) {
      newStockData.expiry_date = Timestamp.fromDate(data.expiry_date);
    }
    
    batch.set(newStockRef, newStockData);
  }

  // Create stock log
  const logRef = doc(stockLogsRef);
  const logData: any = {
    ingredient_id: data.ingredient_id,
    branch_id: data.branchId,
    user_id: data.user_id,
    change_amount: baseQuantity,
    reason: 'purchase' as StockLogReason,
    created_at: serverTimestamp(),
  };
  
  // Only add notes if provided
  if (data.notes !== undefined && data.notes !== null) {
    logData.notes = data.notes;
  }
  
  batch.set(logRef, logData);

  await batch.commit();
}

export interface UseStockData {
  ingredient_id: string;
  branchId: string; // Required for data isolation
  quantity: number;
  unit: string;
  user_id: string;
  reason?: StockLogReason;
  notes?: string;
}

export async function useStock(data: UseStockData): Promise<void> {
  if (!data.branchId) {
    throw new Error('branchId is required for data isolation');
  }

  // Convert to base units
  const baseQuantity = toBaseUnit(data.quantity, data.unit);

  // Get existing stock (filtered by branchId)
  const existingStock = await getStockByIngredient(data.ingredient_id, data.branchId);
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
  const logData: any = {
    ingredient_id: data.ingredient_id,
    branch_id: data.branchId,
    user_id: data.user_id,
    change_amount: -baseQuantity,
    reason: data.reason || 'sale',
    created_at: serverTimestamp(),
  };
  
  // Only add notes if provided
  if (data.notes !== undefined && data.notes !== null) {
    logData.notes = data.notes;
  }
  
  batch.set(logRef, logData);

  await batch.commit();
}

export async function updateStockTransaction(
  ingredientId: string,
  branchId: string,
  changeAmount: number, // Positive to add, negative to subtract
  userId: string,
  reason: StockLogReason = 'adjustment',
  notes?: string
): Promise<void> {
  if (!branchId) {
    throw new Error('branchId is required for data isolation');
  }

  // First, find the stock record outside the transaction (filtered by branchId)
  const stockQuery = query(
    ingredientStockRef,
    where('ingredient_id', '==', ingredientId),
    where('branch_id', '==', branchId),
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
        branch_id: branchId,
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
      branch_id: branchId,
      user_id: userId,
      change_amount: changeAmount,
      reason,
      notes: notes || null,
      created_at: serverTimestamp(),
    });
  });
}

