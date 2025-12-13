import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types/entities';
import { toBaseUnit } from '../utils/unit-conversion';

// Collection references
const ingredientStockRef = collection(db, 'ingredient_stock');
const stockLogsRef = collection(db, 'stock_logs');
const purchaseOrdersRef = collection(db, 'purchase_orders');

export interface CreatePurchaseOrderData {
  supplier_id: string;
  supplier_name: string;
  items: {
    ingredient_id: string;
    name: string;
    quantity: number;
    unit: string;
    cost_per_unit: number;
    total_cost: number;
  }[];
  expected_delivery_date: Date;
  status: PurchaseOrderStatus;
  notes?: string;
}

export async function createPurchaseOrder(data: CreatePurchaseOrderData): Promise<string> {
  // Generate PO Number (PO-YYYYMMDD-XXXX)
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const poNumber = `PO-${dateStr}-${randomSuffix}`;

  const totalCost = data.items.reduce((sum, item) => sum + item.total_cost, 0);

  const docRef = await addDoc(purchaseOrdersRef, {
    ...data,
    po_number: poNumber,
    total_cost: totalCost,
    expected_delivery_date: Timestamp.fromDate(data.expected_delivery_date),
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  
  return docRef.id;
}

export async function getPurchaseOrders(statusFilter?: 'active' | 'history'): Promise<PurchaseOrder[]> {
  let constraints: QueryConstraint[] = [orderBy('created_at', 'desc')];
  
  // Debugging: Show all orders regardless of status
  // if (statusFilter === 'active') {
  //   constraints.unshift(where('status', 'in', ['draft', 'ordered']));
  // } else if (statusFilter === 'history') {
  //   constraints.unshift(where('status', 'in', ['received', 'cancelled']));
  // }

  const q = query(purchaseOrdersRef, ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      // Convert timestamps to Date objects if needed, or keep as is depending on usage
      // The types say Date | string, so we're good with the raw data usually, 
      // but let's ensure dates are handled if we use them for sorting later in UI
    } as PurchaseOrder;
  });
}

export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  const docRef = doc(purchaseOrdersRef, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...(docSnap.data() as object) } as PurchaseOrder;
  }
  return null;
}

export async function getPurchaseOrdersBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
  const q = query(
    purchaseOrdersRef, 
    where('supplier_id', '==', supplierId),
    orderBy('created_at', 'desc')
  );
  const snapshot = await getDocs(q);
  console.log('Querying orders for supplier_id:', supplierId, 'Found:', snapshot.size);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as object),
  })) as PurchaseOrder[];
}

export async function getOrdersBySupplier(supplierId: string): Promise<PurchaseOrder[]> {
    return getPurchaseOrdersBySupplier(supplierId);
}

export async function updatePurchaseOrder(
  id: string, 
  data: Partial<CreatePurchaseOrderData>
): Promise<void> {
  const docRef = doc(purchaseOrdersRef, id);
  
  const updateData: any = {
    ...data,
    updated_at: serverTimestamp(),
  };

  if (data.expected_delivery_date) {
    updateData.expected_delivery_date = Timestamp.fromDate(data.expected_delivery_date);
  }
  
  if (data.items) {
    updateData.total_cost = data.items.reduce((sum, item) => sum + item.total_cost, 0);
  }

  await updateDoc(docRef, updateData);
}

export async function receivePurchaseOrder(id: string, userId: string): Promise<void> {
  const poRef = doc(purchaseOrdersRef, id);
  
  // Fetch PO first to get items for stockMap
  const poDocSnap = await getDoc(poRef);
  if (!poDocSnap.exists()) {
    throw new Error("Purchase Order not found");
  }
  const po = poDocSnap.data() as PurchaseOrder;

  // We can query all stock items *before* the transaction to get their IDs.
  const stockMap = new Map<string, string>(); // ingredientId -> stockDocId
  
  for (const item of po.items) {
    const q = query(ingredientStockRef, where('ingredient_id', '==', item.ingredient_id), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      stockMap.set(item.ingredient_id, snap.docs[0].id);
    }
  }

  await runTransaction(db, async (transaction) => {
    // 1. READ ALL DATA FIRST
    const poDoc = await transaction.get(poRef);
    if (!poDoc.exists()) throw new Error("PO not found");
    const currentPo = poDoc.data() as PurchaseOrder;
    if (currentPo.status === 'received') throw new Error("Already received");

    // Read all stock documents
    const stockDocs = new Map<string, any>();
    for (const item of currentPo.items) {
      const stockId = stockMap.get(item.ingredient_id);
      if (stockId) {
        const stockRef = doc(ingredientStockRef, stockId);
        const stockDoc = await transaction.get(stockRef);
        stockDocs.set(stockId, stockDoc);
      }
    }

    // 2. WRITE ALL DATA
    // Update PO
    transaction.update(poRef, {
      status: 'received',
      updated_at: serverTimestamp(),
    });

    // Update Stocks and Create Logs
    for (const item of currentPo.items) {
      const baseQuantity = toBaseUnit(item.quantity, item.unit);
      const stockId = stockMap.get(item.ingredient_id);

      if (stockId) {
        const stockRef = doc(ingredientStockRef, stockId);
        // Use the pre-read document
        const stockDoc = stockDocs.get(stockId);
        const currentStock = stockDoc?.data()?.quantity || 0;
        
        transaction.update(stockRef, {
          quantity: currentStock + baseQuantity,
          last_updated: serverTimestamp(),
        });
      } else {
        const newStockRef = doc(ingredientStockRef); // Auto-ID for new stock
        transaction.set(newStockRef, {
          ingredient_id: item.ingredient_id,
          quantity: baseQuantity,
          last_updated: serverTimestamp(),
          expiry_date: null // Default
        });
      }

      // Create Log
      const logRef = doc(stockLogsRef); // New doc, auto ID
      transaction.set(logRef, {
        ingredient_id: item.ingredient_id,
        user_id: userId,
        change_amount: baseQuantity,
        reason: 'purchase',
        notes: `Received PO #${currentPo.po_number}`,
        created_at: serverTimestamp(),
      });
    }
  });
}

