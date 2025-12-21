// Barrel export for all services
// Re-export everything from domain-specific modules

// Ingredients
export * from './ingredients';

// Menu
export * from './menu';

// Suppliers
export * from './suppliers';

// Orders
export * from './orders';

// Sales
export * from './sales';

// Stock Logs
export * from './logs';

// Users
export * from './users';

// Stock Operations
export * from './stock';

// Inventory
export * from './inventory';

// Utils
export * from './utils';

// Shopping List
export * from './shopping-list';

// Tax Calculation
export * from './tax';

// Restaurants
export * from './restaurants';

// Invoices
export * from './invoices';

// Database
export * from './database';

// Re-export types from entities
export type {
  Ingredient,
  Supplier,
  IngredientStock,
  StockLog,
  StockLogReason,
  Unit,
  PurchaseOrder,
  PurchaseOrderStatus,
} from '@/types/entities';

