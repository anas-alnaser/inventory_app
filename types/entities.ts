// TypeScript types based on ERD schema

export type UserRole = 'owner' | 'manager' | 'stock_manager' | 'supervisor' | 'cashier';
export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'cancelled';
export type PaymentMethod = 'Cash' | 'Visa' | 'CliQ';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type StockLogReason = 'purchase' | 'sale' | 'waste' | 'adjustment' | 'transfer' | 'consumption' | 'expired' | 'correction' | 'other' | 'restock' | 'production';
export type Unit = 'kg' | 'g' | 'L' | 'mL' | 'piece' | 'box' | 'pack';
export type WasteRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AnomalyType = 'stock_shortage' | 'excessive_waste' | 'price_anomaly' | 'sales_anomaly' | 'other';
export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';
export type ShiftStatus = 'open' | 'closed';

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
  currency?: string; // e.g., 'JOD', 'USD', 'EUR'
  theme?: string; // e.g., 'light', 'dark', 'system'
  pin_code?: string; // 4-6 digits for PIN authentication
  is_store_device?: boolean; // True for shared shop account, False for personal owner accounts
  active_shift_id?: string | null; // Active shift ID for tracking
  restaurantId?: string; // Restaurant ID for data isolation
  branchId?: string; // Branch ID for data isolation
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
  branch_id?: string;
  taxRate?: number; // Default 0.16 for 16%
  isTaxExempt?: boolean; // Default false
  imageUrl?: string; // Optional, for POS display
  description?: string; // Optional item description
  created_at: Date | string;
}

// Purchasing and Inventory
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
  branch_id: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  total_cost: number;
  expected_delivery_date: Date | string;
  created_at: Date | string;
  updated_at?: Date | string;
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

// Restaurant Settings
export interface Restaurant {
  id: string;
  name: string;
  taxNumber: string; // 9-digit TRN
  serviceChargeRate: number; // e.g., 0.10 for 10%
  invoiceSerialSequence: number; // Auto-incrementing
  branch_id?: string; // Optional link to branch
  created_at: Date | string;
}

// Invoice Items
export interface InvoiceItem {
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  taxRate?: number;
  isTaxExempt?: boolean;
}

// Invoices
export interface Invoice {
  id: string;
  invoiceNumber: string; // Format: "INV-2025-0001"
  branch_id: string;
  cashier_id: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount?: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountName?: string;
  serviceChargeAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod; // 'Cash' | 'Visa' | 'CliQ'
  qrCodeString: string;
  status?: 'completed' | 'voided' | 'refunded' | 'partial_refund'; // For void/refund tracking
  voidedAt?: Date | string;
  voidedBy?: string;
  refundId?: string;
  refundedAt?: Date | string;
  refundedBy?: string;
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

// Shift Management
export interface Shift {
  id: string;
  staffId: string;
  startTime: Date | string;
  endTime: Date | string | null;
  startingCash: number; // JOD
  expectedCash: number; // System-calculated: startingCash + sum of cash invoices
  actualCash: number | null; // User-entered actual cash count
  variance: number | null; // Difference: expectedCash - actualCash
  status: ShiftStatus; // 'open' | 'closed'
  created_at: Date | string;
}

// Attendance Tracking
export interface Attendance {
  id: string;
  staffId: string;
  clockIn: Date | string;
  clockOut: Date | string | null;
  totalHours: number | null; // Calculated total hours worked
  shift_id: string | null; // Reference to associated shift (if cashier)
  created_at: Date | string;
}

