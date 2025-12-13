import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;

// Collection references
export const collections = {
  ingredients: db.collection('ingredients'),
  ingredientStock: db.collection('ingredient_stock'),
  stockLogs: db.collection('stock_logs'),
  menuItems: db.collection('menu_items'),
  purchaseOrders: db.collection('purchase_orders'),
  posOrders: db.collection('pos_orders'),
  suppliers: db.collection('suppliers'),
  anomalies: db.collection('anomalies'),
  forecasts: db.collection('forecasts'),
  wastePredictions: db.collection('waste_predictions'),
  analyticsCache: db.collection('analytics_cache'),
  visionSnapshots: db.collection('vision_snapshots'),
};

// Type definitions matching the frontend
export type StockLogReason = 'purchase' | 'sale' | 'waste' | 'adjustment' | 'transfer' | 'consumption' | 'expired' | 'correction' | 'other' | 'restock' | 'production';
export type AnomalyType = 'usage_spike' | 'theoretical_variance' | 'price_creep' | 'ghost_inventory' | 'expiry_risk' | 'stock_shortage' | 'excessive_waste' | 'price_anomaly' | 'sales_anomaly' | 'other';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type Unit = 'kg' | 'g' | 'L' | 'mL' | 'piece' | 'box' | 'pack';

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
  cost_per_unit: number;
  supplier_id: string;
  category?: string;
  min_stock_level?: number;
  max_stock_level?: number;
  created_at: admin.firestore.Timestamp;
}

export interface IngredientStock {
  id: string;
  ingredient_id: string;
  quantity: number;
  expiry_date?: admin.firestore.Timestamp;
  last_updated: admin.firestore.Timestamp;
}

export interface StockLog {
  id: string;
  ingredient_id: string;
  branch_id?: string;
  user_id: string;
  change_amount: number;
  reason: StockLogReason;
  notes?: string;
  created_at: admin.firestore.Timestamp;
}

export interface MenuItemRecipe {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  recipe?: MenuItemRecipe[];
  created_at: admin.firestore.Timestamp;
}

export interface PurchaseOrderItem {
  ingredient_id: string;
  name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  items: PurchaseOrderItem[];
  total_cost: number;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  expected_delivery_date: admin.firestore.Timestamp;
  created_at: admin.firestore.Timestamp;
}

export interface Anomaly {
  id?: string;
  type: AnomalyType;
  ingredient_id: string | null;
  severity: AnomalySeverity;
  description: string;
  details: {
    expected_value?: number;
    actual_value?: number;
    deviation_percent?: number;
    z_score?: number;
    supplier_id?: string;
    price_change_percent?: number;
    days_inactive?: number;
  };
  ai_recommendation?: string;
  created_at: admin.firestore.Timestamp;
  resolved: boolean;
  branch_id?: string;
}

export interface Forecast {
  id?: string;
  ingredient_id: string;
  branch_id?: string;
  forecast_date: admin.firestore.Timestamp;
  forecast_quantity: number;
  confidence: number;
  model_version: string;
  details?: {
    method: string;
    weights?: Record<string, number>;
    historical_data_points?: number;
    seasonality_factor?: number;
  };
  created_at: admin.firestore.Timestamp;
}

export interface WastePrediction {
  id?: string;
  ingredient_id: string;
  branch_id?: string;
  predicted_waste: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  expiry_date: admin.firestore.Timestamp;
  days_until_expiry: number;
  predicted_usage: number;
  ai_recommendation?: string;
  created_at: admin.firestore.Timestamp;
}

