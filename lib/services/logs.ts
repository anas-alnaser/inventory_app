import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { StockLog, StockLogReason } from '@/types/entities';

// Collection reference
const stockLogsRef = collection(db, 'stock_logs');

export async function getStockLogs(
  branchId: string,
  ingredientId?: string,
  limitCount: number = 50
): Promise<StockLog[]> {
  if (!branchId) {
    throw new Error('branchId is required for data isolation');
  }

  const constraints: QueryConstraint[] = [
    where('branch_id', '==', branchId),
    orderBy('created_at', 'desc'),
    limit(limitCount),
  ];

  if (ingredientId) {
    constraints.unshift(where('ingredient_id', '==', ingredientId));
  }

  const q = query(stockLogsRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as object),
  })) as StockLog[];
}

export async function getStockLogsByDateRange(
  branchId: string,
  startDate: Date,
  endDate: Date = new Date()
): Promise<StockLog[]> {
  if (!branchId) {
    throw new Error('branchId is required for data isolation');
  }

  const constraints: QueryConstraint[] = [
    where('branch_id', '==', branchId),
    where('created_at', '>=', Timestamp.fromDate(startDate)),
    where('created_at', '<=', Timestamp.fromDate(endDate)),
    orderBy('created_at', 'desc'),
  ];

  const q = query(stockLogsRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as object),
  })) as StockLog[];
}

export async function getStockLogsByIngredient(
  branchId: string,
  ingredientId: string,
  limitCount: number = 50
): Promise<StockLog[]> {
  return getStockLogs(branchId, ingredientId, limitCount);
}

export async function createStockLog(data: {
  ingredient_id: string;
  branchId: string;
  user_id: string;
  change_amount: number;
  reason: StockLogReason;
  notes?: string;
}): Promise<string> {
  if (!data.branchId) {
    throw new Error('branchId is required for data isolation');
  }

  const logData: any = {
    ingredient_id: data.ingredient_id,
    branch_id: data.branchId,
    user_id: data.user_id,
    change_amount: data.change_amount,
    reason: data.reason,
    created_at: serverTimestamp(),
  };

  // Only add notes if provided
  if (data.notes !== undefined && data.notes !== null) {
    logData.notes = data.notes;
  }

  const docRef = await addDoc(stockLogsRef, logData);
  return docRef.id;
}

