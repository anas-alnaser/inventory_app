import {
  collection,
  doc,
  addDoc,
  setDoc,
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
  serverTimestamp,
  writeBatch,
  runTransaction,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, deleteUser as deleteAuthUser } from 'firebase/auth';
import { db, auth } from './firebase';
import type {
  Ingredient,
  Supplier,
  IngredientStock,
  StockLog,
  StockLogReason,
  Unit,
  PurchaseOrder,
  PurchaseOrderStatus,
} from '@/types/entities';

export type {
  Ingredient,
  Supplier,
  IngredientStock,
  StockLog,
  StockLogReason,
  Unit,
  PurchaseOrder,
  PurchaseOrderStatus,
};
import { toBaseUnit, fromBaseUnit } from './utils/unit-conversion';

// Collection references
const ingredientsRef = collection(db, 'ingredients');
const suppliersRef = collection(db, 'suppliers');
const ingredientStockRef = collection(db, 'ingredient_stock');
const stockLogsRef = collection(db, 'stock_logs');
const purchaseOrdersRef = collection(db, 'purchase_orders');

// ==================== INGREDIENTS ====================

export interface CreateIngredientData {
  name: string;
  unit: Unit;
  cost_per_unit: number;
  supplier_id: string;
  min_stock_level?: number;
  max_stock_level?: number;
  category?: string;
}

export async function getIngredients(): Promise<Ingredient[]> {
  const q = query(ingredientsRef, orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as object),
  })) as Ingredient[];
}

export async function getIngredientById(id: string): Promise<Ingredient | null> {
  const docRef = doc(ingredientsRef, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...(docSnap.data() as object) } as Ingredient;
  }
  return null;
}

export async function createIngredient(data: CreateIngredientData): Promise<string> {
  const docRef = await addDoc(ingredientsRef, {
    ...data,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateIngredient(id: string, data: Partial<CreateIngredientData>): Promise<void> {
  const docRef = doc(ingredientsRef, id);
  await updateDoc(docRef, {
    ...data,
    updated_at: serverTimestamp(),
  });
}

export async function deleteIngredient(id: string): Promise<void> {
  const docRef = doc(ingredientsRef, id);
  await deleteDoc(docRef);
}

// Enhanced ingredient creation with unit conversion support
export interface CreateIngredientWithUnitData extends CreateIngredientData {
  purchaseUnit?: string; // e.g., "Sack"
  purchaseUnitSize?: number; // e.g., 10000 (grams)
}

export async function createIngredientWithUnit(data: CreateIngredientWithUnitData): Promise<string> {
  const ingredientData: CreateIngredientData = {
    name: data.name,
    unit: data.unit,
    cost_per_unit: data.cost_per_unit,
    supplier_id: data.supplier_id,
    min_stock_level: data.min_stock_level,
    max_stock_level: data.max_stock_level,
    category: data.category,
  };
  
  return createIngredient(ingredientData);
}

// ==================== SUPPLIERS ====================

export interface CreateSupplierData {
  name: string;
  phone: string;
  email: string;
  address?: string;
  contact_person?: string;
  payment_terms?: string;
  delivery_days?: string[];
}

export async function getSuppliers(): Promise<Supplier[]> {
  const q = query(suppliersRef, orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as object),
  })) as Supplier[];
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  const docRef = doc(suppliersRef, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...(docSnap.data() as object) } as Supplier;
  }
  return null;
}

export async function createSupplier(data: CreateSupplierData): Promise<string> {
  const docRef = await addDoc(suppliersRef, {
    ...data,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSupplier(id: string, data: Partial<CreateSupplierData>): Promise<void> {
  const docRef = doc(suppliersRef, id);
  await updateDoc(docRef, {
    ...data,
    updated_at: serverTimestamp(),
  });
}

export async function deleteSupplier(id: string): Promise<void> {
  const docRef = doc(suppliersRef, id);
  await deleteDoc(docRef);
}

// ==================== INGREDIENT STOCK ====================

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

// ==================== STOCK LOGS ====================

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

// ==================== PURCHASE ORDERS ====================

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
    const poDoc = await transaction.get(poRef);
    if (!poDoc.exists()) throw new Error("PO not found");
    const currentPo = poDoc.data() as PurchaseOrder;
    if (currentPo.status === 'received') throw new Error("Already received");

    // Update PO
    transaction.update(poRef, {
      status: 'received',
      updated_at: serverTimestamp(),
    });

    // Update Stocks
    for (const item of currentPo.items) {
      const baseQuantity = toBaseUnit(item.quantity, item.unit);
      const stockId = stockMap.get(item.ingredient_id);

      if (stockId) {
        const stockRef = doc(ingredientStockRef, stockId);
        const stockDoc = await transaction.get(stockRef);
        const currentStock = stockDoc.data()?.quantity || 0;
        
        transaction.update(stockRef, {
          quantity: currentStock + baseQuantity,
          last_updated: serverTimestamp(),
        });
      } else {
        const newStockRef = doc(ingredientStockRef);
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

// ==================== UTILITY FUNCTIONS ====================

export function calculateStockStatus(
  current: number,
  min?: number,
  max?: number
): 'good' | 'low' | 'critical' | 'out' {
  // Ensure we're comparing numbers, not strings
  const currentNum = Number(current) || 0;
  const minNum = min !== undefined && min !== null ? Number(min) : undefined;
  
  if (currentNum <= 0) return 'out';
  if (minNum !== undefined && currentNum <= minNum * 0.5) return 'critical';
  if (minNum !== undefined && currentNum <= minNum) return 'low';
  return 'good';
}

export function formatStockQuantity(
  baseQuantity: number,
  unit: Unit
): { value: number; unit: string; display: string } {
  // Smart formatting based on quantity
  if (unit === 'g' && baseQuantity >= 1000) {
    const kg = baseQuantity / 1000;
    return { value: kg, unit: 'kg', display: `${kg.toFixed(1)} kg` };
  }
  if (unit === 'mL' && baseQuantity >= 1000) {
    const L = baseQuantity / 1000;
    return { value: L, unit: 'L', display: `${L.toFixed(1)} L` };
  }
  return { value: baseQuantity, unit, display: `${baseQuantity} ${unit}` };
}

// ==================== USERS ====================

import type { User, UserRole } from '@/types/entities';
import { usersCollection } from './firestore';

export interface CreateUserData {
  name: string;
  email: string;
  role: UserRole;
}

export async function getAllUsers(): Promise<User[]> {
  const q = query(usersCollection, orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as object),
  })) as User[];
}

export async function getUserById(id: string): Promise<User | null> {
  const docRef = doc(usersCollection, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...(docSnap.data() as object) } as User;
  }
  return null;
}

export interface CreateUserWithAuthData extends CreateUserData {
  password: string; // Required for creating Auth user
}

export async function createUser(data: CreateUserWithAuthData): Promise<string> {
  // Step 1: Create user in Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const firebaseUser = userCredential.user;
  
  // Step 2: Update display name in Auth
  await updateProfile(firebaseUser, { displayName: data.name });
  
  // Step 3: Create user document in Firestore
  await setDoc(doc(usersCollection, firebaseUser.uid), {
    name: data.name,
    email: data.email,
    password_hash: '', // Firebase Auth handles passwords
    role: data.role,
    created_at: serverTimestamp(),
  } as any);
  
  return firebaseUser.uid;
}

export async function updateUser(id: string, data: Partial<CreateUserData>): Promise<void> {
  const docRef = doc(usersCollection, id);
  await updateDoc(docRef, {
    ...data,
  });
}

export async function deleteUser(id: string): Promise<void> {
  // Delete from Firestore
  const docRef = doc(usersCollection, id);
  await deleteDoc(docRef);
  
  // Delete from Firebase Authentication (if user exists)
  try {
    const userDoc = await getDoc(docRef);
    if (userDoc.exists()) {
      // Note: deleteAuthUser requires admin privileges, so this might fail
      // In production, you'd use Admin SDK on the server
      // For now, we'll just delete the Firestore document
    }
  } catch (error) {
    console.warn('Could not delete Auth user (requires Admin SDK):', error);
    // Continue anyway - Firestore document is deleted
  }
}

// ==================== INVENTORY WITH STOCK ====================

export interface InventoryItem {
  id: string;
  ingredient: Ingredient;
  stock: IngredientStock | null;
  supplier?: Supplier;
  status: 'good' | 'low' | 'critical' | 'out';
}

export async function getInventoryWithStock(): Promise<InventoryItem[]> {
  // Get all ingredients
  const ingredients = await getIngredients();
  
  // Get all stock (no branch filter)
  const stockItemsWithIngredients = await getAllStock();
  // Extract just the stock items (StockWithIngredient extends IngredientStock)
  const stockItems = stockItemsWithIngredients.map(item => ({
    id: item.id,
    ingredient_id: item.ingredient_id,
    quantity: item.quantity,
    expiry_date: item.expiry_date,
    last_updated: item.last_updated,
  })) as IngredientStock[];
  
  // Get all suppliers
  const suppliers = await getSuppliers();
  const suppliersMap = new Map(suppliers.map(s => [s.id, s]));
  
  // Combine ingredients with their stock
  const inventory: InventoryItem[] = ingredients.map(ingredient => {
    const stock = stockItems.find(s => s.ingredient_id === ingredient.id) || null;
    const supplier = ingredient.supplier_id ? suppliersMap.get(ingredient.supplier_id) : undefined;
    
    const currentQuantity = stock?.quantity || 0;
    const status = calculateStockStatus(
      currentQuantity,
      ingredient.min_stock_level,
      ingredient.max_stock_level
    );
    
    return {
      id: ingredient.id,
      ingredient,
      stock,
      supplier,
      status,
    };
  });
  
  return inventory;
}

/**
 * Real-time listener for inventory with stock
 * Sets up onSnapshot listeners for ingredients, stock, and suppliers
 * @param callback - Function called whenever data changes
 * @returns Unsubscribe function to clean up listeners
 */
export function listenToInventoryWithStock(
  callback: (inventory: InventoryItem[]) => void
): Unsubscribe {
  let ingredients: Ingredient[] = [];
  let stockItems: IngredientStock[] = [];
  let suppliers: Supplier[] = [];
  
  // Track if we've received initial data from all listeners
  let ingredientsReady = false;
  let stockReady = false;
  let suppliersReady = false;
  
  const updateInventory = () => {
    // Only call callback when all data is ready
    if (!ingredientsReady || !stockReady || !suppliersReady) {
      return;
    }
    
    const suppliersMap = new Map(suppliers.map(s => [s.id, s]));
    
    // Combine ingredients with their stock
    const inventory: InventoryItem[] = ingredients.map(ingredient => {
      const stock = stockItems.find(s => s.ingredient_id === ingredient.id) || null;
      const supplier = ingredient.supplier_id ? suppliersMap.get(ingredient.supplier_id) : undefined;
      
      const currentQuantity = stock?.quantity || 0;
      const status = calculateStockStatus(
        currentQuantity,
        ingredient.min_stock_level,
        ingredient.max_stock_level
      );
      
      return {
        id: ingredient.id,
        ingredient,
        stock,
        supplier,
        status,
      };
    });
    
    callback(inventory);
  };
  
  // Listen to ingredients
  const ingredientsQuery = query(ingredientsRef, orderBy('name'));
  const unsubscribeIngredients = onSnapshot(
    ingredientsQuery,
    (snapshot) => {
      ingredients = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as object),
      })) as Ingredient[];
      ingredientsReady = true;
      updateInventory();
    },
    (error) => {
      console.error('Error listening to ingredients:', error);
      ingredientsReady = true; // Mark as ready even on error to prevent blocking
      updateInventory();
    }
  );
  
  // Listen to all stock (no branch filter)
  const stockQuery = query(ingredientStockRef, orderBy('last_updated', 'desc'));
  const unsubscribeStock = onSnapshot(
    stockQuery,
    (snapshot) => {
      stockItems = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as object),
      })) as IngredientStock[];
      stockReady = true;
      updateInventory();
    },
    (error) => {
      console.error('Error listening to stock:', error);
      stockReady = true;
      updateInventory();
    }
  );
  
  // Listen to suppliers
  const suppliersQuery = query(suppliersRef, orderBy('name'));
  const unsubscribeSuppliers = onSnapshot(
    suppliersQuery,
    (snapshot) => {
      suppliers = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as object),
      })) as Supplier[];
      suppliersReady = true;
      updateInventory();
    },
    (error) => {
      console.error('Error listening to suppliers:', error);
      suppliersReady = true;
      updateInventory();
    }
  );
  
  // Return combined unsubscribe function
  return () => {
    unsubscribeIngredients();
    unsubscribeStock();
    unsubscribeSuppliers();
  };
}

// ==================== TRANSACTION-BASED STOCK UPDATE ====================

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


