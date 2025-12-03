// TypeScript types based on ERD schema

export type UserRole = 'owner' | 'admin' | 'manager' | 'stock_keeper';
export type PurchaseOrderStatus = 'pending' | 'approved' | 'received' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'mobile_payment';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type StockLogReason = 'purchase' | 'sale' | 'waste' | 'adjustment' | 'transfer';
export type Unit = 'kg' | 'g' | 'L' | 'mL' | 'piece' | 'box' | 'pack';
export type WasteRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyType = 'stock_shortage' | 'excessive_waste' | 'price_anomaly' | 'sales_anomaly' | 'other';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

// Core Entities
export interface Branch {
  id: string;
  name: string;
  address: string;
  created_at: Date | string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date | string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  contact_person?: string;
  address?: string;
  payment_terms?: string;
  delivery_days?: string[];
  created_at: Date | string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: Unit;
  cost_per_unit: number;
  supplier_id: string;
  category?: string;
  min_stock_level?: number;
  max_stock_level?: number;
  created_at: Date | string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  branch_id: string;
  created_at: Date | string;
}

// Purchasing and Inventory
export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  branch_id: string;
  status: PurchaseOrderStatus;
  recommended_by_ai: boolean;
  created_at: Date | string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  ingredient_id: string;
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
}

export interface IngredientStock {
  id: string;
  branch_id: string;
  ingredient_id: string;
  quantity: number;
  expiry_date: Date | string;
  last_updated: Date | string;
}

export interface StockLog {
  id: string;
  ingredient_id: string;
  branch_id: string;
  user_id: string;
  change_amount: number;
  reason: StockLogReason;
  created_at: Date | string;
}

export interface MenuItemIngredient {
  id: string;
  menu_item_id: string;
  ingredient_id: string;
  quantity_used: number;
}

// POS and Payments
export interface POSOrder {
  id: string;
  order_number: string;
  branch_id: string;
  cashier_id: string;
  total_amount: number;
  payment_method: PaymentMethod;
  status: OrderStatus;
  created_at: Date | string;
}

export interface POSOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_id: string;
  created_at: Date | string;
}

// Forecasting and Analytics
export interface Forecast {
  id: string;
  branch_id: string;
  ingredient_id: string;
  forecast_date: Date | string;
  forecast_quantity: number;
  model_version: string;
  created_at: Date | string;
}

export interface WastePrediction {
  id: string;
  ingredient_id: string;
  branch_id: string;
  predicted_waste: number;
  risk_level: WasteRiskLevel;
  expiry_date: Date | string;
  created_at: Date | string;
}

export interface Anomaly {
  id: string;
  branch_id: string;
  ingredient_id: string | null;
  type: AnomalyType;
  description: string;
  severity: AnomalySeverity;
  created_at: Date | string;
  resolved: boolean;
}

export interface VisionSnapshot {
  id: string;
  branch_id: string;
  image_path: string;
  detected_items: Record<string, any>; // JSONB equivalent
  confidence: number;
  created_at: Date | string;
}

export interface AnalyticsCache {
  id: string;
  branch_id: string;
  metric_name: string;
  metric_value: Record<string, any>; // JSONB equivalent
  calculated_at: Date | string;
}

export interface SystemLog {
  id: string;
  event_type: string;
  message: string;
  metadata: Record<string, any>; // JSONB equivalent
  created_at: Date | string;
}

