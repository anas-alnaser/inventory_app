import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  Branch,
  User,
  Supplier,
  Ingredient,
  MenuItem,
  PurchaseOrder,
  PurchaseOrderItem,
  IngredientStock,
  StockLog,
  POSOrder,
  POSOrderItem,
  Payment,
  Forecast,
  WastePrediction,
  Anomaly,
} from '@/types/entities';

// Generic helper functions
export const createDocument = async <T>(
  collectionRef: any,
  data: Omit<T, 'id' | 'created_at'>
): Promise<string> => {
  const docRef = await addDoc(collectionRef, {
    ...data,
    created_at: Timestamp.now(),
  } as any);
  return docRef.id;
};

export const updateDocument = async <T>(
  collectionRef: any,
  id: string,
  data: Partial<T>
): Promise<void> => {
  const docRef = doc(collectionRef, id);
  await updateDoc(docRef, data as any);
};

export const deleteDocument = async (collectionRef: any, id: string): Promise<void> => {
  const docRef = doc(collectionRef, id);
  await deleteDoc(docRef);
};

export const getDocument = async <T>(collectionRef: any, id: string): Promise<T | null> => {
  const docRef = doc(collectionRef, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
};

export const getDocuments = async <T>(
  collectionRef: any,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  const q = query(collectionRef, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...(data as object),
    } as T;
  });
};

// Branch-specific helpers
export const getBranches = async (): Promise<Branch[]> => {
  const { branchesCollection } = await import('./firestore');
  return getDocuments<Branch>(branchesCollection, [orderBy('name')]);
};

export const getBranchById = async (id: string): Promise<Branch | null> => {
  const { branchesCollection } = await import('./firestore');
  return getDocument<Branch>(branchesCollection, id);
};

// User-specific helpers
export const getUsersByBranch = async (branchId: string): Promise<User[]> => {
  const { usersCollection } = await import('./firestore');
  return getDocuments<User>(usersCollection, [
    where('branch_id', '==', branchId),
    orderBy('name'),
  ]);
};

// Ingredient Stock helpers
export const getIngredientStockByBranch = async (
  branchId: string
): Promise<IngredientStock[]> => {
  const { ingredientStockCollection } = await import('./firestore');
  return getDocuments<IngredientStock>(ingredientStockCollection, [
    where('branch_id', '==', branchId),
  ]);
};

export const updateIngredientStock = async (
  id: string,
  quantity: number,
  expiryDate?: Date
): Promise<void> => {
  const { ingredientStockCollection } = await import('./firestore');
  const updateData: any = {
    quantity,
    last_updated: Timestamp.now(),
  };
  if (expiryDate) {
    updateData.expiry_date = Timestamp.fromDate(expiryDate);
  }
  await updateDocument(ingredientStockCollection, id, updateData);
};

// POS Order helpers
export const getPOSOrdersByBranch = async (
  branchId: string,
  limitCount: number = 50
): Promise<POSOrder[]> => {
  const { posOrdersCollection } = await import('./firestore');
  return getDocuments<POSOrder>(posOrdersCollection, [
    where('branch_id', '==', branchId),
    orderBy('created_at', 'desc'),
    limit(limitCount),
  ]);
};

export const createPOSOrder = async (
  orderData: Omit<POSOrder, 'id' | 'created_at'>
): Promise<string> => {
  const { posOrdersCollection } = await import('./firestore');
  return createDocument<POSOrder>(posOrdersCollection, orderData);
};

// Purchase Order helpers
export const getPurchaseOrdersByBranch = async (
  branchId: string
): Promise<PurchaseOrder[]> => {
  const { purchaseOrdersCollection } = await import('./firestore');
  return getDocuments<PurchaseOrder>(purchaseOrdersCollection, [
    where('branch_id', '==', branchId),
    orderBy('created_at', 'desc'),
  ]);
};

// Forecast helpers
export const getForecastsByBranch = async (
  branchId: string,
  ingredientId?: string
): Promise<Forecast[]> => {
  const { forecastsCollection } = await import('./firestore');
  const constraints: QueryConstraint[] = [
    where('branch_id', '==', branchId),
    orderBy('forecast_date', 'desc'),
  ];
  if (ingredientId) {
    constraints.unshift(where('ingredient_id', '==', ingredientId));
  }
  return getDocuments<Forecast>(forecastsCollection, constraints);
};

// Anomaly helpers
export const getUnresolvedAnomaliesByBranch = async (
  branchId: string
): Promise<Anomaly[]> => {
  const { anomaliesCollection } = await import('./firestore');
  return getDocuments<Anomaly>(anomaliesCollection, [
    where('branch_id', '==', branchId),
    where('resolved', '==', false),
    orderBy('created_at', 'desc'),
  ]);
};

export const resolveAnomaly = async (id: string): Promise<void> => {
  const { anomaliesCollection } = await import('./firestore');
  await updateDocument<Anomaly>(anomaliesCollection, id, { resolved: true });
};

