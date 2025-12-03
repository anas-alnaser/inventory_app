import { 
  collection, 
  doc, 
  CollectionReference, 
  DocumentReference,
  Firestore 
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
  MenuItemIngredient,
  POSOrder,
  POSOrderItem,
  Payment,
  Forecast,
  WastePrediction,
  Anomaly,
  VisionSnapshot,
  AnalyticsCache,
  SystemLog
} from '@/types/entities';

// Collection references
export const branchesCollection = collection(db, 'branches') as CollectionReference<Branch>;
export const usersCollection = collection(db, 'users') as CollectionReference<User>;
export const suppliersCollection = collection(db, 'suppliers') as CollectionReference<Supplier>;
export const ingredientsCollection = collection(db, 'ingredients') as CollectionReference<Ingredient>;
export const menuItemsCollection = collection(db, 'menu_items') as CollectionReference<MenuItem>;
export const purchaseOrdersCollection = collection(db, 'purchase_orders') as CollectionReference<PurchaseOrder>;
export const purchaseOrderItemsCollection = collection(db, 'purchase_order_items') as CollectionReference<PurchaseOrderItem>;
export const ingredientStockCollection = collection(db, 'ingredient_stock') as CollectionReference<IngredientStock>;
export const stockLogsCollection = collection(db, 'stock_logs') as CollectionReference<StockLog>;
export const menuItemIngredientsCollection = collection(db, 'menu_item_ingredients') as CollectionReference<MenuItemIngredient>;
export const posOrdersCollection = collection(db, 'pos_orders') as CollectionReference<POSOrder>;
export const posOrderItemsCollection = collection(db, 'pos_order_items') as CollectionReference<POSOrderItem>;
export const paymentsCollection = collection(db, 'payments') as CollectionReference<Payment>;
export const forecastsCollection = collection(db, 'forecasts') as CollectionReference<Forecast>;
export const wastePredictionsCollection = collection(db, 'waste_predictions') as CollectionReference<WastePrediction>;
export const anomaliesCollection = collection(db, 'anomalies') as CollectionReference<Anomaly>;
export const visionSnapshotsCollection = collection(db, 'vision_snapshots') as CollectionReference<VisionSnapshot>;
export const analyticsCacheCollection = collection(db, 'analytics_cache') as CollectionReference<AnalyticsCache>;
export const systemLogsCollection = collection(db, 'system_logs') as CollectionReference<SystemLog>;

// Helper functions to get document references
export const getBranchRef = (id: string) => doc(db, 'branches', id) as DocumentReference<Branch>;
export const getUserRef = (id: string) => doc(db, 'users', id) as DocumentReference<User>;
export const getSupplierRef = (id: string) => doc(db, 'suppliers', id) as DocumentReference<Supplier>;
export const getIngredientRef = (id: string) => doc(db, 'ingredients', id) as DocumentReference<Ingredient>;
export const getMenuItemRef = (id: string) => doc(db, 'menu_items', id) as DocumentReference<MenuItem>;
export const getPurchaseOrderRef = (id: string) => doc(db, 'purchase_orders', id) as DocumentReference<PurchaseOrder>;
export const getIngredientStockRef = (id: string) => doc(db, 'ingredient_stock', id) as DocumentReference<IngredientStock>;
export const getPOSOrderRef = (id: string) => doc(db, 'pos_orders', id) as DocumentReference<POSOrder>;

// Subcollection helpers
export const getPurchaseOrderItemsRef = (purchaseOrderId: string) => 
  collection(db, 'purchase_orders', purchaseOrderId, 'purchase_order_items') as CollectionReference<PurchaseOrderItem>;

export const getPOSOrderItemsRef = (orderId: string) => 
  collection(db, 'pos_orders', orderId, 'pos_order_items') as CollectionReference<POSOrderItem>;

export const getPaymentsRef = (orderId: string) => 
  collection(db, 'pos_orders', orderId, 'payments') as CollectionReference<Payment>;

