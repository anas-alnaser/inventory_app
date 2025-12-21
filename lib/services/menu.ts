import {
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { MenuItem, Ingredient, MenuItemRecipe } from '@/types/entities';
import { getIngredients } from './ingredients';

export interface MenuItemWithFinancials extends MenuItem {
  calculatedCost: number;
  profitMargin: number;
}

/**
 * Fetches all menu items with calculated cost and profit margin.
 * Cost is calculated dynamically from recipe ingredients and their current costs.
 * This ensures costs update automatically when ingredient prices change.
 */
export async function getMenuItemsWithFinancials(): Promise<MenuItemWithFinancials[]> {
  // 1. Fetch all menu items
  const menuItemsRef = collection(db, 'menu_items');
  const menuItemsQuery = query(menuItemsRef, orderBy('name'));
  const menuItemsSnapshot = await getDocs(menuItemsQuery);
  const menuItems = menuItemsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as MenuItem[];

  // 2. Fetch all ingredients
  const ingredients = await getIngredients();

  // 3. Create a Map/Lookup for ingredients by ID for O(1) access
  const ingredientsMap = new Map<string, Ingredient>();
  ingredients.forEach((ingredient) => {
    ingredientsMap.set(ingredient.id, ingredient);
  });

  // 4. Calculate cost and profit margin for each menu item
  const menuItemsWithFinancials: MenuItemWithFinancials[] = menuItems.map((item) => {
    let calculatedCost = 0;

    // Calculate cost from recipe
    if (item.recipe && Array.isArray(item.recipe)) {
      item.recipe.forEach((recipeItem: MenuItemRecipe) => {
        const ingredient = ingredientsMap.get(recipeItem.ingredientId);
        if (ingredient) {
          // Cost = Recipe Quantity * Ingredient Cost per Unit
          calculatedCost += recipeItem.quantity * ingredient.cost_per_unit;
        }
      });
    }

    // Calculate profit margin: ((Price - Cost) / Price) * 100
    const price = item.price || 0;
    const profitMargin = price > 0 ? ((price - calculatedCost) / price) * 100 : 0;

    return {
      ...item,
      calculatedCost,
      profitMargin,
    };
  });

  return menuItemsWithFinancials;
}

