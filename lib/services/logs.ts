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
  ingredientId?: string,
  limitCount: number = 50
): Promise<StockLog[]> {
  const constraints: QueryConstraint[] = [
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
  startDate: Date,
  endDate: Date = new Date()
): Promise<StockLog[]> {
  const constraints: QueryConstraint[] = [
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
  ingredientId: string,
  limitCount: number = 50
): Promise<StockLog[]> {
  return getStockLogs(ingredientId, limitCount);
}

export async function createStockLog(data: {
  ingredient_id: string;
  user_id: string;
  change_amount: number;
  reason: StockLogReason;
  notes?: string;
}): Promise<string> {
  const docRef = await addDoc(stockLogsRef, {
    ...data,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

