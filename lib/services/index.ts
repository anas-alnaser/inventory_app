// Barrel export for all services
// Re-export everything from domain-specific modules

// Ingredients
export * from './ingredients';

// Suppliers
export * from './suppliers';

// Orders
export * from './orders';

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

