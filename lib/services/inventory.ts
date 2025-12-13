import {
  collection,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Ingredient, Supplier, IngredientStock } from '@/types/entities';
import { getIngredients, getIngredientById } from './ingredients';
import { getSuppliers } from './suppliers';
import { getAllStock } from './stock';
import { calculateStockStatus } from './utils';

// Collection references
const ingredientsRef = collection(db, 'ingredients');
const suppliersRef = collection(db, 'suppliers');
const ingredientStockRef = collection(db, 'ingredient_stock');

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

