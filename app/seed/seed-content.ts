/* AUTO-GENERATED seed content
 * Generated: 2025-12-22T01:22:23
 * Source files: جرد شهر (1).xlsx + recipe DOCX files
 * Assumptions:
 * - baseUnit normalized to g/ml/pcs where possible.
 * - Espresso is modeled as a liquid ingredient (ml). Assumed 1 shot = 30ml.
 */

export type BaseUnit = "g" | "ml" | "pcs";

export type IngredientSeed = {
  id: string;
  name: string;
  category: string;
  baseUnit: BaseUnit;
  currentQuantity: number; // in baseUnit
  purchaseUnitName: string; // e.g., pcs/kg/l
  purchaseUnitSize: number | null; // size in baseUnit for one purchase unit (null if unknown)
  costPerPurchaseUnit: number | null;
  costPerBaseUnit: number | null;
  vendor: string | null;
};

export type RecipeLine = {
  ingredientId: string;
  amount: number; // in ingredient.baseUnit
};

export type MenuItemSeed = {
  id: string;
  name: string;
  category: string;
  recipe: RecipeLine[];
};

export const ingredientsSeed: IngredientSeed[] = [
  {
    "id": "1_pump_blueberry_puree",
    "name": "1 Pump Blueberry Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_pump_caramel_flavor",
    "name": "1 Pump Caramel Flavor",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_pump_caramel_sauce",
    "name": "1 Pump Caramel Sauce",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_pump_caramel_syrup",
    "name": "1 Pump Caramel Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_pump_mango_puree",
    "name": "1 Pump Mango Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_pump_passion_fruit_puree",
    "name": "1 Pump Passion Fruit Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_pump_peach",
    "name": "1 Pump Peach",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_pump_vanilla_flavor",
    "name": "1 Pump Vanilla Flavor",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_pump_vanilla_syrup",
    "name": "1 Pump Vanilla Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_pumps_caramel_flavor",
    "name": "1 Pumps Caramel Flavor",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_scoop_chai_tea_powder",
    "name": "1 Scoop Chai Tea Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_scoop_chocolate_chip",
    "name": "1 Scoop Chocolate Chip",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_scoop_coffee_base_powder",
    "name": "1 Scoop Coffee Base Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_scoop_coffee_base_powder_base",
    "name": "1 Scoop Coffee Base Powder Base",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_scoop_non_dairy_powder",
    "name": "1 Scoop Non Dairy Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_scoop_vanilla_base_powder",
    "name": "1 Scoop Vanilla Base Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_scoop_vanilla_powder",
    "name": "1 Scoop Vanilla Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_scoops_toffee_powder",
    "name": "1 Scoops Toffee Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_5_scoops_hot_chocolate_powder",
    "name": "1,5 Scoops Hot Chocolate Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "1_hot_chocolate_powder",
    "name": "1. Hot Chocolate Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pump_chai_tea_syrup",
    "name": "2 Pump Chai Tea Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_blueberry_puree",
    "name": "2 Pumps Blueberry Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_coconut_syrup",
    "name": "2 Pumps Coconut Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_dulce_di_leche",
    "name": "2 Pumps Dulce Di Leche",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_flavor_20",
    "name": "2 Pumps Flavor 20 &",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_hazelnut_flavor",
    "name": "2 Pumps Hazelnut Flavor",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_lemon_rancho",
    "name": "2 Pumps Lemon Rancho",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_lime_puree",
    "name": "2 Pumps Lime Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_macadamia_syrup",
    "name": "2 Pumps Macadamia Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_mixed_berries_puree",
    "name": "2 Pumps Mixed Berries Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_pineapple_puree",
    "name": "2 Pumps Pineapple Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_raspberry_puree",
    "name": "2 Pumps Raspberry Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_roasted_hazelnut_syrup",
    "name": "2 Pumps Roasted Hazelnut Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_roasted_marshmallow",
    "name": "2 Pumps Roasted Marshmallow",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_salted_caramel_flavor",
    "name": "2 Pumps Salted Caramel Flavor",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_salted_caramel_sauce",
    "name": "2 Pumps Salted Caramel Sauce",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_strawberry_puree",
    "name": "2 Pumps Strawberry Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_terinage_puree",
    "name": "2 Pumps Terinage Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_vanilla_flavor",
    "name": "2 Pumps Vanilla Flavor",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_vanilla_syrup",
    "name": "2 Pumps Vanilla Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_pumps_water_melon_syrup",
    "name": "2 Pumps Water Melon Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_scoops_chai_tea_powder",
    "name": "2 Scoops Chai Tea Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_scoops_hot_chocolate_powder",
    "name": "2 Scoops Hot Chocolate Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "2_scoops_yogurt_powder",
    "name": "2 Scoops Yogurt Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_caramel_sauce",
    "name": "3 Pumps Caramel Sauce",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_chai_tea_syrup",
    "name": "3 Pumps Chai Tea Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_coconut_syrup",
    "name": "3 Pumps Coconut Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_dark_chocolate",
    "name": "3 Pumps Dark Chocolate",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_dark_chocolate_sauce",
    "name": "3 Pumps Dark Chocolate Sauce",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_flavor_20",
    "name": "3 Pumps Flavor 20 &",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_flavor_30",
    "name": "3 Pumps Flavor 30 &",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_green_apple_puree",
    "name": "3 Pumps Green Apple Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_lemon_rancho_syrup",
    "name": "3 Pumps Lemon Rancho Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_passion_fruit",
    "name": "3 Pumps Passion Fruit",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_peach_puree",
    "name": "3 Pumps Peach Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_raspberry_puree",
    "name": "3 Pumps Raspberry Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_roasted_hazelnut_syrup",
    "name": "3 Pumps Roasted Hazelnut Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_roasted_marshmallow",
    "name": "3 Pumps Roasted Marshmallow",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_salted_caramel_flavor",
    "name": "3 Pumps Salted Caramel Flavor",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_salted_caramel_sauce",
    "name": "3 Pumps Salted Caramel Sauce",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_vanilla_syrup",
    "name": "3 Pumps Vanilla Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_vanilla_syrup_30",
    "name": "3 Pumps Vanilla Syrup 30 &",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_white_chocolate",
    "name": "3 Pumps White Chocolate",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "3_pumps_white_chocolate_sauce",
    "name": "3 Pumps White Chocolate Sauce",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "4_pumps_dark_chocolate",
    "name": "4 Pumps Dark Chocolate",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "4_pumps_dark_chocolate_sauce",
    "name": "4 Pumps Dark Chocolate Sauce",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "4_pumps_white_chocolate",
    "name": "4 Pumps White Chocolate",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "4_pumps_white_chocolate_sauce",
    "name": "4 Pumps White Chocolate Sauce",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "blueberry_puree",
    "name": "Blueberry Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "caramel_drizzle",
    "name": "Caramel Drizzle",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "caramel_flavor",
    "name": "Caramel Flavor",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "caramel_salted_drizzle",
    "name": "Caramel Salted Drizzle",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "caramel_sauce",
    "name": "Caramel Sauce",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "caramel_syrup",
    "name": "Caramel Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "chai_tea_powder",
    "name": "Chai Tea Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "chocolate_chip",
    "name": "Chocolate Chip",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "chocolate_drizzle",
    "name": "Chocolate Drizzle",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "chocolate_powder",
    "name": "Chocolate Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "coconut_syrup",
    "name": "Coconut Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "coffee_base_powder",
    "name": "Coffee Base Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "coffee_base_powder_base",
    "name": "Coffee Base Powder Base",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "coffee_liquid",
    "name": "Coffee Liquid",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "cold",
    "name": "Cold",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "dark_chocolate",
    "name": "Dark Chocolate",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "dark_chocolate_sauce",
    "name": "Dark Chocolate Sauce",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "dulce_di_leche",
    "name": "Dulce Di Leche",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "flavor_20",
    "name": "Flavor 20 &",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "flavor_30",
    "name": "Flavor 30 &",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "garnish_blueberry_puree_the_inside",
    "name": "Garnish : Blueberry Puree The Inside",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "garnish_caramel_drizzle_from_the_inside",
    "name": "Garnish : Caramel Drizzle From The Inside",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "garnish_caramel_from_the_inside",
    "name": "Garnish : Caramel From The Inside",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "garnish_chocolate_drizzle_from_the_inside",
    "name": "Garnish : Chocolate Drizzle From The Inside",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "green_apple_puree",
    "name": "Green Apple Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "green_tea",
    "name": "Green Tea",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "green_tea_base",
    "name": "Green Tea Base",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "hazelnut_flavor",
    "name": "Hazelnut Flavor",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "heating_of_milk",
    "name": "Heating Of Milk",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "ice",
    "name": "Ice",
    "category": "Auto Added",
    "baseUnit": "pcs",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "lemon_rancho",
    "name": "Lemon Rancho",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "lemon_rancho_syrup",
    "name": "Lemon Rancho Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "lime_puree",
    "name": "Lime Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "liquid_cream",
    "name": "Liquid Cream",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "macadamia_syrup",
    "name": "Macadamia Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "mango_puree",
    "name": "Mango Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "milk",
    "name": "Milk",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "milk_11oz",
    "name": "Milk 11oz",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "milk_6_oz",
    "name": "Milk 6 Oz",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "milk_6oz",
    "name": "Milk 6oz",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "milk_8oz",
    "name": "Milk 8oz",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "milk_9oz",
    "name": "Milk 9oz",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "mixed_berries_puree",
    "name": "Mixed Berries Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "non_dairy_powder",
    "name": "Non Dairy Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "passion_fruit",
    "name": "Passion Fruit",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "passion_fruit_puree",
    "name": "Passion Fruit Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "peach",
    "name": "Peach",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "peach_puree",
    "name": "Peach Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "pineapple_puree",
    "name": "Pineapple Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "pistachio_sauce",
    "name": "Pistachio Sauce",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "pure_matcha_powder",
    "name": "Pure Matcha Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "raspberry_puree",
    "name": "Raspberry Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "roasted_hazelnut_syrup",
    "name": "Roasted Hazelnut Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "roasted_marshmallow",
    "name": "Roasted Marshmallow",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "rose_sauce",
    "name": "Rose Sauce",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "salted_caramel_flavor",
    "name": "Salted Caramel Flavor",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "salted_caramel_sauce",
    "name": "Salted Caramel Sauce",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "single_origin_coffee",
    "name": "Single Origin Coffee",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "soda_water",
    "name": "Soda Water",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "spanish_sauce",
    "name": "Spanish Sauce",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "strawberry_puree",
    "name": "Strawberry Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "sugar",
    "name": "Sugar",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "terinage_puree",
    "name": "Terinage Puree",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "toffee_powder",
    "name": "Toffee Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_brown_whipped_cream",
    "name": "Topping : Brown Whipped Cream",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_brown_whipped_cream_coconut_flex",
    "name": "Topping : Brown Whipped Cream / Coconut Flex",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_brown_whipped_cream_hazelnut_nuts",
    "name": "Topping : Brown Whipped Cream / Hazelnut Nuts",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_caramel_drizzle",
    "name": "Topping : Caramel Drizzle",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream",
    "name": "Topping : Whipped Cream",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_blueberry_puree_5_ml",
    "name": "Topping : Whipped Cream / Blueberry Puree 5 Ml",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_caramel_drizzle_7_5_ml",
    "name": "Topping : Whipped Cream / Caramel Drizzle 7.5 Ml",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_caramel_drizzle_7_5_ml_chocolate_chip_5_g",
    "name": "Topping : Whipped Cream / Caramel Drizzle 7.5 Ml / Chocolate Chip 5 G",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_caramel_drizzle_7_5_ml_hazelnut_nuts",
    "name": "Topping : Whipped Cream / Caramel Drizzle 7.5 Ml / Hazelnut Nuts",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_caramel_salted_drizzle_7_5_ml_brown",
    "name": "Topping : Whipped Cream / Caramel Salted Drizzle 7.5 Ml / Brown",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_chocolate_drizzle_7_5_ml",
    "name": "Topping : Whipped Cream / Chocolate Drizzle 7.5 Ml",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_chocolate_drizzle_7_5_ml_chocolate_chip_5_g",
    "name": "Topping : Whipped Cream / Chocolate Drizzle 7.5 Ml / Chocolate Chip 5 G",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_chocolate_drizzle_7_5_ml_chocolate_powder_2_g_chocolate_chip_4_g",
    "name": "Topping : Whipped Cream / Chocolate Drizzle 7.5 Ml / Chocolate Powder 2 G / Chocolate Chip 4 G",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_cookies_cream_nuts",
    "name": "Topping : Whipped Cream / Cookies & Cream Nuts",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_creamy_matcha_powder",
    "name": "Topping : Whipped Cream / Creamy Matcha Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_raspberry_puree_5_ml",
    "name": "Topping : Whipped Cream / Raspberry Puree 5 Ml",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_vanilla_powder_1_g",
    "name": "Topping : Whipped Cream / Vanilla Powder 1 G",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_and_5_g_peach_puree",
    "name": "Topping : Whipped Cream And 5 G Peach Puree",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "topping_whipped_cream_and_peach_puree",
    "name": "Topping : Whipped Cream And Peach Puree",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "vanilla_base_powder",
    "name": "Vanilla Base Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "vanilla_flavor",
    "name": "Vanilla Flavor",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "vanilla_powder",
    "name": "Vanilla Powder",
    "category": "Auto Added",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "g",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "vanilla_syrup",
    "name": "Vanilla Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "vanilla_syrup_30",
    "name": "Vanilla Syrup 30 &",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "water",
    "name": "Water",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "water_melon_syrup",
    "name": "Water Melon Syrup",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "white_chocolate",
    "name": "White Chocolate",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "white_chocolate_drizzle",
    "name": "White Chocolate Drizzle",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "white_chocolate_sauce",
    "name": "White Chocolate Sauce",
    "category": "Auto Added",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "american_coffee",
    "name": "American Coffee",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 12.069,
    "costPerBaseUnit": 0.012069000000000002,
    "vendor": "Al Mahmoudia"
  },
  {
    "id": "american_coffee_2",
    "name": "American Coffee",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 65382,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 9.6484,
    "costPerBaseUnit": 0.0096484,
    "vendor": "Five"
  },
  {
    "id": "brazel",
    "name": "Brazel",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 22.84,
    "costPerBaseUnit": 0.02284,
    "vendor": "Bunni"
  },
  {
    "id": "coffee_aroma",
    "name": "Coffee Aroma",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 180030,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 7.9599387,
    "costPerBaseUnit": 0.0079599387,
    "vendor": "Five"
  },
  {
    "id": "colombia",
    "name": "Colombia",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 17740,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 13.2665,
    "costPerBaseUnit": 0.0132665,
    "vendor": "Five"
  },
  {
    "id": "como",
    "name": "Como",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 105,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 2.0,
    "costPerBaseUnit": null,
    "vendor": "Five"
  },
  {
    "id": "dacaf",
    "name": "Dacaf",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 2290,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 18.5,
    "costPerBaseUnit": 0.0185,
    "vendor": "Al Mahmoudia"
  },
  {
    "id": "dacaf_1k",
    "name": "Dacaf 1K",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 18.5,
    "costPerBaseUnit": 0.0185,
    "vendor": "Marchall"
  },
  {
    "id": "el_salvador_san_felipe",
    "name": "El Salvador San Felipe",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 852,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 23.28,
    "costPerBaseUnit": 0.023280000000000002,
    "vendor": "Bunni"
  },
  {
    "id": "espresso_shot",
    "name": "Espresso Shot",
    "category": "Coffee",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "ml",
    "purchaseUnitSize": 1,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "ethiopia_bensa",
    "name": "Ethiopia Bensa",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 6745,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 13.2665,
    "costPerBaseUnit": 0.0132665,
    "vendor": "Five"
  },
  {
    "id": "grind_coffee",
    "name": "Grind Coffee",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 16920,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 12.07,
    "costPerBaseUnit": 0.01207,
    "vendor": null
  },
  {
    "id": "guatemala_annese",
    "name": "Guatemala Annese",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 25.86,
    "costPerBaseUnit": 0.02586,
    "vendor": "Bunni"
  },
  {
    "id": "kenya_kiambu",
    "name": "Kenya Kiambu",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 704,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 25.86,
    "costPerBaseUnit": 0.02586,
    "vendor": "Bunni"
  },
  {
    "id": "trento",
    "name": "Trento",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 152,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 2.0,
    "costPerBaseUnit": null,
    "vendor": "Five"
  },
  {
    "id": "turkish_coffee",
    "name": "Turkish Coffee",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 1320,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 10.862,
    "costPerBaseUnit": 0.010862,
    "vendor": "Al Ameed Coffee"
  },
  {
    "id": "veneto",
    "name": "Veneto",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 123,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 2.0,
    "costPerBaseUnit": null,
    "vendor": "Five"
  },
  {
    "id": "verona",
    "name": "Verona",
    "category": "Coffee",
    "baseUnit": "g",
    "currentQuantity": 219,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 2.0,
    "costPerBaseUnit": null,
    "vendor": "Five"
  },
  {
    "id": "american_filter",
    "name": "American Filter",
    "category": "Consumables",
    "baseUnit": "pcs",
    "currentQuantity": 499,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.07,
    "costPerBaseUnit": null,
    "vendor": "Marchall"
  },
  {
    "id": "black_gloves",
    "name": "Black Gloves",
    "category": "Consumables",
    "baseUnit": "pcs",
    "currentQuantity": 5,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.8,
    "costPerBaseUnit": null,
    "vendor": "Roya"
  },
  {
    "id": "butter_paper",
    "name": "Butter Paper",
    "category": "Consumables",
    "baseUnit": "pcs",
    "currentQuantity": 3,
    "purchaseUnitName": "ربطه",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 41.760000000000005,
    "costPerBaseUnit": null,
    "vendor": "Root"
  },
  {
    "id": "filter_chemex",
    "name": "Filter Chemex",
    "category": "Consumables",
    "baseUnit": "pcs",
    "currentQuantity": 157,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.0,
    "costPerBaseUnit": null,
    "vendor": "Marchall"
  },
  {
    "id": "folded_fork_knives",
    "name": "Folded Fork&knives",
    "category": "Consumables",
    "baseUnit": "pcs",
    "currentQuantity": 0,
    "purchaseUnitName": "كرتونه",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 17.5,
    "costPerBaseUnit": null,
    "vendor": "chef"
  },
  {
    "id": "ice_chargar",
    "name": "Ice Chargar",
    "category": "Consumables",
    "baseUnit": "pcs",
    "currentQuantity": 9,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.55,
    "costPerBaseUnit": null,
    "vendor": "Marchall"
  },
  {
    "id": "plastic_forks_knives",
    "name": "Plastic Forks & Knives",
    "category": "Consumables",
    "baseUnit": "pcs",
    "currentQuantity": 3,
    "purchaseUnitName": "كرتونه",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 17.5,
    "costPerBaseUnit": null,
    "vendor": "Chef"
  },
  {
    "id": "shalmoneh",
    "name": "Shalmoneh",
    "category": "Consumables",
    "baseUnit": "pcs",
    "currentQuantity": 27,
    "purchaseUnitName": "كيس",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.75,
    "costPerBaseUnit": null,
    "vendor": "The Chef"
  },
  {
    "id": "v_60_filter",
    "name": "V 60 Filter",
    "category": "Consumables",
    "baseUnit": "pcs",
    "currentQuantity": 67,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.055,
    "costPerBaseUnit": null,
    "vendor": "Marchall"
  },
  {
    "id": "apple_pie",
    "name": "Apple Pie",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "blubarry_cheescake",
    "name": "Blubarry Cheescake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.5086206896551726,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "blueberry_cake_pec",
    "name": "Blueberry Cake Pec",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "brawni_pec",
    "name": "Brawni Pec",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 14,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.0,
    "costPerBaseUnit": null,
    "vendor": "bara"
  },
  {
    "id": "carrot_cake",
    "name": "Carrot Cake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "cheescake",
    "name": "CheesCake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 2.25,
    "costPerBaseUnit": null,
    "vendor": "bara"
  },
  {
    "id": "chocolate_bar",
    "name": "Chocolate Bar",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 4,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.55,
    "costPerBaseUnit": null,
    "vendor": "TreeOflife"
  },
  {
    "id": "coffee_cake",
    "name": "Coffee Cake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "unit",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": "Dalish"
  },
  {
    "id": "cookies",
    "name": "Cookies",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 13,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.6,
    "costPerBaseUnit": null,
    "vendor": "ZaidCookies"
  },
  {
    "id": "cookies_cheesecake",
    "name": "Cookies Cheesecake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.625,
    "costPerBaseUnit": null,
    "vendor": "BittyBite"
  },
  {
    "id": "cookies_cup",
    "name": "Cookies Cup",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.0,
    "costPerBaseUnit": null,
    "vendor": "ZaidCookies"
  },
  {
    "id": "croissant_wheel",
    "name": "Croissant Wheel",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.078,
    "costPerBaseUnit": null,
    "vendor": "CakeSalon"
  },
  {
    "id": "cup_fluck",
    "name": "Cup Fluck",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.5086206896551726,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "dark_milk_chocolate_dragee",
    "name": "Dark/Milk Chocolate Dragee",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 3,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.55,
    "costPerBaseUnit": null,
    "vendor": "TreeOflife"
  },
  {
    "id": "eclaer",
    "name": "Eclaer",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.078,
    "costPerBaseUnit": null,
    "vendor": "CakeSalon"
  },
  {
    "id": "english_cake_pec",
    "name": "English Cake Pec",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "fix_chocolate",
    "name": "Fix Chocolate",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 1,
    "purchaseUnitName": "unit",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.55,
    "costPerBaseUnit": null,
    "vendor": "سكر ولوز"
  },
  {
    "id": "friro_cake_pec",
    "name": "Friro Cake Pec",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "german_cake_pec",
    "name": "German Cake Pec",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "granola",
    "name": "Granola",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 21,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.0166666666666666,
    "costPerBaseUnit": null,
    "vendor": "Granola"
  },
  {
    "id": "honey_cake_pec",
    "name": "Honey Cake Pec",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "kinder_cake_pec",
    "name": "Kinder Cake Pec",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "kinder_cake_pec_2",
    "name": "Kinder Cake Pec",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "lamloufi_bin",
    "name": "LAMLOUFI Bin",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 2.25,
    "costPerBaseUnit": null,
    "vendor": "Dalish"
  },
  {
    "id": "lemon_cake",
    "name": "Lemon Cake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "lize_cake",
    "name": "Lize Cake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "lotus_cheescake",
    "name": "Lotus Cheescake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "mixberry_chesscake",
    "name": "MixBerry Chesscake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 5,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.5086206896551726,
    "costPerBaseUnit": null,
    "vendor": "Hala"
  },
  {
    "id": "passion_cake",
    "name": "Passion Cake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "passionfruit_cake",
    "name": "Passionfruit Cake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.5,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "pecan_cheesecake",
    "name": "Pecan Cheesecake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 6,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 2.875,
    "costPerBaseUnit": null,
    "vendor": "Hala"
  },
  {
    "id": "pistashio_cake",
    "name": "Pistashio Cake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 2.75,
    "costPerBaseUnit": null,
    "vendor": "Dalish"
  },
  {
    "id": "pistashio_gamz",
    "name": "Pistashio Gamz",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 34,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.55,
    "costPerBaseUnit": null,
    "vendor": "Tree of life"
  },
  {
    "id": "red_vlvet_pec",
    "name": "Red Vlvet Pec",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "sansebstian",
    "name": "Sansebstian",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 3,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.509,
    "costPerBaseUnit": null,
    "vendor": "CakeSalon"
  },
  {
    "id": "tart",
    "name": "Tart",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "unit",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.163793103448276,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "tart_2",
    "name": "Tart",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.7241379310344829,
    "costPerBaseUnit": null,
    "vendor": "CakeSalon"
  },
  {
    "id": "tiramisu",
    "name": "Tiramisu",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 3,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.7241379310344829,
    "costPerBaseUnit": null,
    "vendor": "CakeSalon"
  },
  {
    "id": "tiramisu_cake_pec",
    "name": "Tiramisu Cake Pec",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.293103448275862,
    "costPerBaseUnit": null,
    "vendor": "Sakura Cake"
  },
  {
    "id": "toffee_cake",
    "name": "Toffee Cake",
    "category": "Dessert",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 2.75,
    "costPerBaseUnit": null,
    "vendor": "Diana"
  },
  {
    "id": "five_water",
    "name": "Five Water",
    "category": "Drink",
    "baseUnit": "ml",
    "currentQuantity": 463,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.134,
    "costPerBaseUnit": null,
    "vendor": "abdullah Brand"
  },
  {
    "id": "g_soda",
    "name": "G Soda",
    "category": "Drink",
    "baseUnit": "ml",
    "currentQuantity": 82,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.48,
    "costPerBaseUnit": null,
    "vendor": "OPTICO"
  },
  {
    "id": "ice_sparkling_sparkling_ice",
    "name": "Ice Sparkling Sparkling ICE",
    "category": "Drink",
    "baseUnit": "ml",
    "currentQuantity": 29,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.9159482758620691,
    "costPerBaseUnit": null,
    "vendor": "Khaderatieh"
  },
  {
    "id": "sanpellegrion_250_ml",
    "name": "Sanpellegrion 250 Ml",
    "category": "Drink",
    "baseUnit": "ml",
    "currentQuantity": 12750,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 250,
    "costPerPurchaseUnit": 0.6824712643678161,
    "costPerBaseUnit": 0.0027298850574712643,
    "vendor": "Khaderatieh"
  },
  {
    "id": "vita_soda",
    "name": "Vita Soda",
    "category": "Drink",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.30531609195402304,
    "costPerBaseUnit": null,
    "vendor": "Khaderatieh"
  },
  {
    "id": "bottlee_pist",
    "name": "Bottlee Pist",
    "category": "Five",
    "baseUnit": "pcs",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.106,
    "costPerBaseUnit": null,
    "vendor": "Five"
  },
  {
    "id": "bottlee_rose",
    "name": "Bottlee Rose",
    "category": "Five",
    "baseUnit": "pcs",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.845,
    "costPerBaseUnit": null,
    "vendor": "Five"
  },
  {
    "id": "bottlee_spina",
    "name": "Bottlee Spina",
    "category": "Five",
    "baseUnit": "pcs",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.3745,
    "costPerBaseUnit": null,
    "vendor": "Five"
  },
  {
    "id": "coffe_base_l",
    "name": "Coffe Base L",
    "category": "Five",
    "baseUnit": "ml",
    "currentQuantity": 660,
    "purchaseUnitName": "l",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 1.067,
    "costPerBaseUnit": 0.001067,
    "vendor": "Five"
  },
  {
    "id": "cold_pro",
    "name": "Cold Pro",
    "category": "Five",
    "baseUnit": "pcs",
    "currentQuantity": 4,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.719,
    "costPerBaseUnit": null,
    "vendor": "Five"
  },
  {
    "id": "daron_mix",
    "name": "Daron Mix",
    "category": "Five",
    "baseUnit": "g",
    "currentQuantity": 125,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 5.097,
    "costPerBaseUnit": 0.005097000000000001,
    "vendor": "Five"
  },
  {
    "id": "pistachio_mix_kg",
    "name": "Pistachio Mix KG",
    "category": "Five",
    "baseUnit": "g",
    "currentQuantity": 862,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 4.146607298245614,
    "costPerBaseUnit": 0.004146607298245614,
    "vendor": "Five"
  },
  {
    "id": "rose_mix_kg",
    "name": "Rose Mix Kg",
    "category": "Five",
    "baseUnit": "g",
    "currentQuantity": 423,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 3.8865536842105266,
    "costPerBaseUnit": 0.0038865536842105264,
    "vendor": "Five"
  },
  {
    "id": "spanish_mixkg",
    "name": "Spanish MixKG",
    "category": "Five",
    "baseUnit": "g",
    "currentQuantity": 2888,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 2.567543859649123,
    "costPerBaseUnit": 0.002567543859649123,
    "vendor": "Five"
  },
  {
    "id": "mix",
    "name": "حليب مبخر Mix",
    "category": "Five",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "l",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": "Five"
  },
  {
    "id": "cinammon_powder",
    "name": "Cinammon Powder",
    "category": "Frappe Powder",
    "baseUnit": "g",
    "currentQuantity": 860,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 10.0,
    "costPerBaseUnit": 0.01,
    "vendor": "super market"
  },
  {
    "id": "coffee_powder",
    "name": "Coffee Powder",
    "category": "Frappe Powder",
    "baseUnit": "g",
    "currentQuantity": 1520,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 10.0,
    "costPerBaseUnit": 0.01,
    "vendor": "adc"
  },
  {
    "id": "coffee_powder_2",
    "name": "Coffee Powder",
    "category": "Frappe Powder",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 9.483,
    "costPerBaseUnit": 0.009483,
    "vendor": "al mahmoudia"
  },
  {
    "id": "hot_chocolate",
    "name": "Hot Chocolate",
    "category": "Frappe Powder",
    "baseUnit": "g",
    "currentQuantity": 13008,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 10.0,
    "costPerBaseUnit": 0.01,
    "vendor": "Tree of life"
  },
  {
    "id": "matcha",
    "name": "Matcha",
    "category": "Frappe Powder",
    "baseUnit": "g",
    "currentQuantity": 560,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 21.88,
    "costPerBaseUnit": 0.02188,
    "vendor": "Turtle Green"
  },
  {
    "id": "monin_frappe_na_na_neutral_fruity_bowder",
    "name": "Monin Frappe NA Na Neutral Fruity Bowder",
    "category": "Frappe Powder",
    "baseUnit": "g",
    "currentQuantity": 3,
    "purchaseUnitName": "كيس /2كيلوا",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 19.15,
    "costPerBaseUnit": null,
    "vendor": "Golden arrow"
  },
  {
    "id": "spiced_chai_powder",
    "name": "Spiced Chai Powder",
    "category": "Frappe Powder",
    "baseUnit": "g",
    "currentQuantity": 1818,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 11.65,
    "costPerBaseUnit": 0.01165,
    "vendor": "tree of life"
  },
  {
    "id": "toffee_pawder_1kg",
    "name": "Toffee Pawder 1KG",
    "category": "Frappe Powder",
    "baseUnit": "g",
    "currentQuantity": 19668,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 10.0,
    "costPerBaseUnit": 0.01,
    "vendor": "Tree of life"
  },
  {
    "id": "vanila_powder",
    "name": "Vanila Powder",
    "category": "Frappe Powder",
    "baseUnit": "g",
    "currentQuantity": 1857,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 10.0,
    "costPerBaseUnit": 0.01,
    "vendor": "adc"
  },
  {
    "id": "vanila_powder_2",
    "name": "Vanila Powder",
    "category": "Frappe Powder",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 8.621,
    "costPerBaseUnit": 0.008621,
    "vendor": "al mahmoudia"
  },
  {
    "id": "yogurt_powder",
    "name": "Yogurt Powder",
    "category": "Frappe Powder",
    "baseUnit": "g",
    "currentQuantity": 4332,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 10.0,
    "costPerBaseUnit": 0.01,
    "vendor": "adc"
  },
  {
    "id": "ice_creem_chocolate_2kg",
    "name": "Ice Creem Chocolate 2kg",
    "category": "Ice Creem",
    "baseUnit": "g",
    "currentQuantity": 0,
    "purchaseUnitName": "كيس",
    "purchaseUnitSize": 2000,
    "costPerPurchaseUnit": 13.793,
    "costPerBaseUnit": 0.0068965,
    "vendor": "al mahmoudia"
  },
  {
    "id": "ice_creem_darogn_1_4",
    "name": "Ice Creem Darogn 1.4",
    "category": "Ice Creem",
    "baseUnit": "g",
    "currentQuantity": 4,
    "purchaseUnitName": "علبه",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 17.241,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "ice_creem_vanilla_2kg",
    "name": "Ice Creem Vanilla 2kg",
    "category": "Ice Creem",
    "baseUnit": "g",
    "currentQuantity": 12900,
    "purchaseUnitName": "كيس",
    "purchaseUnitSize": 2000,
    "costPerPurchaseUnit": 13.793,
    "costPerBaseUnit": 0.0068965,
    "vendor": "al mahmoudia"
  },
  {
    "id": "lemon_l",
    "name": "Lemon L",
    "category": "Juice",
    "baseUnit": "ml",
    "currentQuantity": 356,
    "purchaseUnitName": "l",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 2.0,
    "costPerBaseUnit": 0.002,
    "vendor": null
  },
  {
    "id": "orange_juice_l",
    "name": "Orange Juice L",
    "category": "Juice",
    "baseUnit": "ml",
    "currentQuantity": 625,
    "purchaseUnitName": "l",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 1.6,
    "costPerBaseUnit": 0.0016,
    "vendor": null
  },
  {
    "id": "almarai_milk_1l",
    "name": "Almarai Milk 1L",
    "category": "Milk",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 0.8,
    "costPerBaseUnit": 0.0008,
    "vendor": "teeba"
  },
  {
    "id": "baladna_milk",
    "name": "Baladna Milk",
    "category": "Milk",
    "baseUnit": "ml",
    "currentQuantity": 258,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.8,
    "costPerBaseUnit": null,
    "vendor": "Baladna Milk"
  },
  {
    "id": "fresh_milk_almarai",
    "name": "Fresh Milk Almarai",
    "category": "Milk",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.0,
    "costPerBaseUnit": null,
    "vendor": "Teeba"
  },
  {
    "id": "koita_full_fat_lactose_free_milk_1_lt",
    "name": "Koita Full Fat Lactose Free Milk 1 Lt",
    "category": "Milk",
    "baseUnit": "ml",
    "currentQuantity": 4371,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 1.95,
    "costPerBaseUnit": 0.00195,
    "vendor": "Open Pruspcctsm"
  },
  {
    "id": "koita_milk_oat_1_lt",
    "name": "Koita Milk Oat 1 Lt",
    "category": "Milk",
    "baseUnit": "ml",
    "currentQuantity": 5452,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 1.95,
    "costPerBaseUnit": 0.00195,
    "vendor": "Open Pruspccts"
  },
  {
    "id": "koita_organic_almond_milk_1_lt",
    "name": "Koita Organic Almond Milk 1 Lt",
    "category": "Milk",
    "baseUnit": "ml",
    "currentQuantity": 17870,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 2.6,
    "costPerBaseUnit": 0.0026,
    "vendor": "Open Pruspcctsm"
  },
  {
    "id": "koita_organic_coconut_milk_1_lt",
    "name": "Koita Organic Coconut Milk 1 Lt",
    "category": "Milk",
    "baseUnit": "ml",
    "currentQuantity": 8655,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 2.6,
    "costPerBaseUnit": 0.0026,
    "vendor": "Open Pruspcctsm"
  },
  {
    "id": "koita_soy_milk_for_coffee_love_1_lt",
    "name": "Koita Soy Milk For Coffee Love 1 Lt",
    "category": "Milk",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 1.95,
    "costPerBaseUnit": 0.00195,
    "vendor": "Open Pruspcctsm"
  },
  {
    "id": "nestle_condensed_milk",
    "name": "Nestle Condensed Milk",
    "category": "Milk",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.2965517241379312,
    "costPerBaseUnit": null,
    "vendor": "Alaa Etoom"
  },
  {
    "id": "rainbow_condensed_milk",
    "name": "RainBow (condensed Milk)",
    "category": "Milk",
    "baseUnit": "ml",
    "currentQuantity": 50,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.11,
    "costPerBaseUnit": null,
    "vendor": "Unipal General Trading"
  },
  {
    "id": "item_caf370f2",
    "name": "حليب مبخر",
    "category": "Milk",
    "baseUnit": "ml",
    "currentQuantity": 57,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 2.22,
    "costPerBaseUnit": null,
    "vendor": "Unipal General Trading"
  },
  {
    "id": "bottel_benas",
    "name": "Bottel Benas",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 6.2,
    "costPerBaseUnit": null,
    "vendor": "shein"
  },
  {
    "id": "chocolet_chip",
    "name": "Chocolet Chip",
    "category": "Other Products",
    "baseUnit": "g",
    "currentQuantity": 3170,
    "purchaseUnitName": "kg",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 4.3104,
    "costPerBaseUnit": 0.0043104,
    "vendor": "almahmudia"
  },
  {
    "id": "coffee_pad",
    "name": "Coffee Pad",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 2.53,
    "costPerBaseUnit": null,
    "vendor": "shein"
  },
  {
    "id": "coffee_spray",
    "name": "Coffee Spray",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.15,
    "costPerBaseUnit": null,
    "vendor": "shein"
  },
  {
    "id": "filter_box",
    "name": "Filter Box",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 6.2,
    "costPerBaseUnit": null,
    "vendor": "shein"
  },
  {
    "id": "filter_v60",
    "name": "Filter V60",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 400,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 3.22,
    "costPerBaseUnit": null,
    "vendor": "shein"
  },
  {
    "id": "french_press",
    "name": "French Press",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 6.89,
    "costPerBaseUnit": null,
    "vendor": "shein"
  },
  {
    "id": "liqud_creem",
    "name": "Liqud Creem",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 8,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.724,
    "costPerBaseUnit": null,
    "vendor": "almahmudia"
  },
  {
    "id": "medal_cup",
    "name": "Medal Cup",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 3,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.92,
    "costPerBaseUnit": null,
    "vendor": "shein"
  },
  {
    "id": "medal_cup_coffee",
    "name": "Medal Cup Coffee",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.92,
    "costPerBaseUnit": null,
    "vendor": "shein"
  },
  {
    "id": "medal_hand",
    "name": "Medal Hand",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 5,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.61,
    "costPerBaseUnit": null,
    "vendor": "shein"
  },
  {
    "id": "medal_mocha_pot",
    "name": "Medal Mocha Pot",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 3,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.15,
    "costPerBaseUnit": null,
    "vendor": "shein"
  },
  {
    "id": "scale",
    "name": "Scale",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 7.81,
    "costPerBaseUnit": null,
    "vendor": "shein"
  },
  {
    "id": "spoon",
    "name": "Spoon",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 1.38,
    "costPerBaseUnit": null,
    "vendor": "shein"
  },
  {
    "id": "suger_stevia",
    "name": "Suger Stevia",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 2,
    "purchaseUnitName": "كرتونه",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": "Kader Atyaa"
  },
  {
    "id": "suger_2",
    "name": "Suger ابيض",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 2,
    "purchaseUnitName": "كرتونه",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 7.0,
    "costPerBaseUnit": null,
    "vendor": "Blue Mill"
  },
  {
    "id": "suger",
    "name": "Suger بني",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 1,
    "purchaseUnitName": "كرتونه",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 15.0,
    "costPerBaseUnit": null,
    "vendor": "Blue Mill"
  },
  {
    "id": "v60",
    "name": "V60",
    "category": "Other Products",
    "baseUnit": "pcs",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 14.93,
    "costPerBaseUnit": null,
    "vendor": "shein"
  },
  {
    "id": "boxes_take_way",
    "name": "Boxes Take Way حجم صغير",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 333,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.03879310344827586,
    "costPerBaseUnit": null,
    "vendor": "alzaheraa"
  },
  {
    "id": "boxes_take_way_2",
    "name": "Boxes Take Way حجم كبير",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 373,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.24138,
    "costPerBaseUnit": null,
    "vendor": "alzaheraa"
  },
  {
    "id": "cold_doom_lids",
    "name": "Cold Doom Lids",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 1966,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.008621,
    "costPerBaseUnit": null,
    "vendor": "al montashirun"
  },
  {
    "id": "cup_holder_2",
    "name": "Cup Holder 2",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 207,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.03666666666666667,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "cup_holder_4",
    "name": "Cup Holder 4",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 386,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.0,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "glass_cup_250_ml",
    "name": "Glass Cup 250 Ml",
    "category": "Paper & Cup",
    "baseUnit": "ml",
    "currentQuantity": 7000,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 250,
    "costPerPurchaseUnit": 0.43103749999999996,
    "costPerBaseUnit": 0.0017241499999999998,
    "vendor": "al montashirun"
  },
  {
    "id": "glass_cup_350_ml",
    "name": "Glass Cup 350 Ml",
    "category": "Paper & Cup",
    "baseUnit": "ml",
    "currentQuantity": 22750,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 350,
    "costPerPurchaseUnit": 0.4741375,
    "costPerBaseUnit": 0.0013546785714285713,
    "vendor": "al montashirun"
  },
  {
    "id": "hot_lids_12_16_oz",
    "name": "Hot Lids 12 & 16 Oz",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 748,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.017241,
    "costPerBaseUnit": null,
    "vendor": "al montashirun"
  },
  {
    "id": "hot_lids_8_oz",
    "name": "Hot Lids 8 Oz",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 871,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.017241,
    "costPerBaseUnit": null,
    "vendor": "al montashirun"
  },
  {
    "id": "hot_paper_cup_12_oz",
    "name": "Hot Paper Cup 12 Oz",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 554,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.086,
    "costPerBaseUnit": null,
    "vendor": "al montashirun"
  },
  {
    "id": "hot_paper_cup_16_oz",
    "name": "Hot Paper Cup 16 Oz",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 775,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.0905,
    "costPerBaseUnit": null,
    "vendor": "al montashirun"
  },
  {
    "id": "hot_paper_cup_4oz",
    "name": "Hot Paper Cup 4Oz",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 553,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.03,
    "costPerBaseUnit": null,
    "vendor": "al montashirun"
  },
  {
    "id": "hot_paper_cup_8_oz",
    "name": "Hot Paper Cup 8 Oz",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 215,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.04741379310344828,
    "costPerBaseUnit": null,
    "vendor": "al montashirun"
  },
  {
    "id": "plastic_cup_14oz",
    "name": "Plastic Cup 14Oz",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 1456,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.056034,
    "costPerBaseUnit": null,
    "vendor": "al montashirun"
  },
  {
    "id": "plastic_cup_u_shape_16oz",
    "name": "Plastic Cup U-shape 16Oz",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 872,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.0732758620689655,
    "costPerBaseUnit": null,
    "vendor": "al montashirun"
  },
  {
    "id": "plastic_cup_u_shape_16oz_lids",
    "name": "Plastic Cup U-shape 16Oz Lids",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 1227,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.03879310344827586,
    "costPerBaseUnit": null,
    "vendor": "al montashirun"
  },
  {
    "id": "plate_paper",
    "name": "Plate Paper",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 5,
    "purchaseUnitName": "ربطة",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.08620699999999999,
    "costPerBaseUnit": null,
    "vendor": "al ymama"
  },
  {
    "id": "sandwiches_plate",
    "name": "Sandwiches Plate",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 399,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.1,
    "costPerBaseUnit": null,
    "vendor": "al ymama"
  },
  {
    "id": "tumblers",
    "name": "Tumblers",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 54,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.5,
    "costPerBaseUnit": null,
    "vendor": "Jmagine Advertising"
  },
  {
    "id": "5_2",
    "name": "أكياس 5 حجم صغير",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 200,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.147,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "5",
    "name": "أكياس 5 حجم كبير",
    "category": "Paper & Cup",
    "baseUnit": "pcs",
    "currentQuantity": 59,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.18,
    "costPerBaseUnit": null,
    "vendor": null
  },
  {
    "id": "croissant",
    "name": "Croissant",
    "category": "Sandwish",
    "baseUnit": "pcs",
    "currentQuantity": 3,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": "Madeleine"
  },
  {
    "id": "salad",
    "name": "Salad",
    "category": "Sandwish",
    "baseUnit": "pcs",
    "currentQuantity": 3,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": "Kow Co"
  },
  {
    "id": "sandwich",
    "name": "Sandwich",
    "category": "Sandwish",
    "baseUnit": "pcs",
    "currentQuantity": 13,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": "Kow Co"
  },
  {
    "id": "zater",
    "name": "Zater",
    "category": "Sandwish",
    "baseUnit": "pcs",
    "currentQuantity": 18,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": null,
    "costPerBaseUnit": null,
    "vendor": "Alaa Etoom"
  },
  {
    "id": "apple_syrup_1_l",
    "name": "Apple Syrup 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": 0.0056029999999999995,
    "vendor": "al mahmoudia"
  },
  {
    "id": "basilic",
    "name": "Basilic",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "blue_curacao_1_l",
    "name": "Blue Curacao 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": 0.0056029999999999995,
    "vendor": "al mahmoudia"
  },
  {
    "id": "blueberry_squeeze_mec3",
    "name": "Blueberry Squeeze Mec3",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 5,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 11.207,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "butter_scotch_syrup",
    "name": "Butter Scotch Syrup",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "caramel_sugar_free_syrup_1_l",
    "name": "Caramel (sugar -free ) Syrup 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 1608,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 6.466,
    "costPerBaseUnit": 0.006466,
    "vendor": "Tree of life"
  },
  {
    "id": "caramel_1883",
    "name": "Caramel 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 31,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "caramel_sauce_1_89_ltr",
    "name": "Caramel Sauce 1.89 Ltr",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 7,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 11.207,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "chai_tea_syrup",
    "name": "Chai Tea Syrup",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 3,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "chocolate_ruby_syrup_1_l",
    "name": "ChocolaTE RUBY Syrup 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 5391,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 5.6,
    "costPerBaseUnit": 0.0056,
    "vendor": "almahmudia"
  },
  {
    "id": "chocolate_sauce_1_89_ltr",
    "name": "Chocolate Sauce 1.89 Ltr",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 5,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 11.207,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "cinnamon_1883",
    "name": "Cinnamon 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 3,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "coconut_1883",
    "name": "Coconut 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 4,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "cramalyzde_syrup_1l",
    "name": "Cramalyzde Syrup 1L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 3872,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 5.6,
    "costPerBaseUnit": 0.0056,
    "vendor": "almahmudia"
  },
  {
    "id": "dulch_de_lech",
    "name": "Dulch De Lech",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 4,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.6,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "ginger",
    "name": "Ginger",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "green_apple_squeeze_mec3_1_l",
    "name": "Green Apple Squeeze Mec3 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 1672,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 11.207,
    "costPerBaseUnit": 0.011207,
    "vendor": "al mahmoudia"
  },
  {
    "id": "green_mint_syrup_1883",
    "name": "Green Mint Syrup 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "hazelnt_suger_free_1_l",
    "name": "Hazelnt Suger Free 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 1990,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 7.0,
    "costPerBaseUnit": 0.007,
    "vendor": "Tree of life"
  },
  {
    "id": "hazelnt_suger_free_1_l_2",
    "name": "Hazelnt Suger Free 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 7.328,
    "costPerBaseUnit": 0.007328,
    "vendor": "al mahmoudia"
  },
  {
    "id": "hazelnut_1883",
    "name": "Hazelnut 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 5,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "hibiscus",
    "name": "Hibiscus",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.6,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "ice_tea_jasmie_1_l",
    "name": "Ice Tea Jasmie 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 6.75,
    "costPerBaseUnit": 0.00675,
    "vendor": "Tree of life"
  },
  {
    "id": "ice_tea_jasmie_1_l_2",
    "name": "Ice Tea Jasmie 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": 0.0056029999999999995,
    "vendor": "al mahmoudia"
  },
  {
    "id": "ice_tea_passionfruit_1_l",
    "name": "Ice Tea Passionfruit 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 6.75,
    "costPerBaseUnit": 0.00675,
    "vendor": "Tree of life"
  },
  {
    "id": "ice_tea_peach_1_l",
    "name": "Ice Tea Peach 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 2762,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": 0.0056029999999999995,
    "vendor": "al mahmoudia"
  },
  {
    "id": "iced_tea_mango_1883",
    "name": "Iced Tea Mango 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 3,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "iced_tra_reaspberry",
    "name": "Iced Tra Reaspberry",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "irish",
    "name": "Irish",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.6,
    "costPerBaseUnit": null,
    "vendor": "almahmudia"
  },
  {
    "id": "lemonade",
    "name": "Lemonade",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.866666666666666,
    "costPerBaseUnit": null,
    "vendor": "Tree of life"
  },
  {
    "id": "lime_mint_squeeze_mec3_1_l",
    "name": "Lime Mint Squeeze Mec3 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 1614,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 11.207,
    "costPerBaseUnit": 0.011207,
    "vendor": "al mahmoudia"
  },
  {
    "id": "macadamia_nut_1883",
    "name": "Macadamia Nut 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "macadimia_flavor",
    "name": "Macadimia Flavor",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "mango_squeeze_mec3",
    "name": "Mango Squeeze Mec3",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 5,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 11.207,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "mango_syrup",
    "name": "Mango Syrup",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.6,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "marshmelo_1_l",
    "name": "Marshmelo 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 6.75,
    "costPerBaseUnit": 0.00675,
    "vendor": "Tree of life"
  },
  {
    "id": "mixed_berries_squeeze_mec3",
    "name": "Mixed Berries Squeeze Mec3",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 3,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 11.207,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "monie_puree_lime",
    "name": "Monie Puree Lime",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 9.1,
    "costPerBaseUnit": null,
    "vendor": "Golden arrow"
  },
  {
    "id": "monin_puree_pineapple_1lt",
    "name": "Monin Puree Pineapple 1LT",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 648,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 9.1,
    "costPerBaseUnit": 0.0091,
    "vendor": "Golden arrow"
  },
  {
    "id": "monin_puree_tangerine_1lt",
    "name": "Monin Puree Tangerine 1LT",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 2007,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 9.1,
    "costPerBaseUnit": 0.0091,
    "vendor": "Golden arrow"
  },
  {
    "id": "monin_sauce_salted_caramel_1_89_lt",
    "name": "Monin Sauce Salted Caramel 1.89 Lt",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 4837,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1890,
    "costPerPurchaseUnit": 11.791666666666666,
    "costPerBaseUnit": 0.006238977072310406,
    "vendor": "Golden arrow"
  },
  {
    "id": "pasheeion_tea",
    "name": "Pasheeion Tea",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "passion_squeeze_mec3_1_l",
    "name": "Passion Squeeze Mec3 1 L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 4424,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 11.207,
    "costPerBaseUnit": 0.011207,
    "vendor": "al mahmoudia"
  },
  {
    "id": "peach_1_3_kg",
    "name": "Peach 1.3 Kg",
    "category": "Syrup & Sauce",
    "baseUnit": "g",
    "currentQuantity": 11388,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1300,
    "costPerPurchaseUnit": 11.207,
    "costPerBaseUnit": 0.008620769230769232,
    "vendor": "al mahmoudia"
  },
  {
    "id": "pinapple",
    "name": "Pinapple",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.6,
    "costPerBaseUnit": null,
    "vendor": "almahmudia"
  },
  {
    "id": "pistashio",
    "name": "Pistashio",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 21.552,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "pistashio_5kg",
    "name": "Pistashio(5KG)",
    "category": "Syrup & Sauce",
    "baseUnit": "g",
    "currentQuantity": 4000,
    "purchaseUnitName": "سطل",
    "purchaseUnitSize": 5000,
    "costPerPurchaseUnit": 32.759,
    "costPerBaseUnit": 0.0065518,
    "vendor": "abu zahra"
  },
  {
    "id": "raspberries_1_3kg",
    "name": "Raspberries 1.3Kg",
    "category": "Syrup & Sauce",
    "baseUnit": "g",
    "currentQuantity": 2210,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1300,
    "costPerPurchaseUnit": 11.207,
    "costPerBaseUnit": 0.008620769230769232,
    "vendor": "al mahmoudia"
  },
  {
    "id": "roasted_hazelnut_1883",
    "name": "Roasted Hazelnut 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 3,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "rose_syrup",
    "name": "Rose Syrup",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "almahmudia"
  },
  {
    "id": "salted_caramel_sweet_bird",
    "name": "Salted Caramel Sweet Bird",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 6.75,
    "costPerBaseUnit": null,
    "vendor": "Tree of life"
  },
  {
    "id": "salted_caramel_syrup_1883",
    "name": "Salted Caramel Syrup - 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "speculoos_1883",
    "name": "Speculoos 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "strawberry_1883",
    "name": "Strawberry 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 5,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "strawberry_squeeze",
    "name": "Strawberry Squeeze",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 1,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 9.1,
    "costPerBaseUnit": null,
    "vendor": "Golden arrow"
  },
  {
    "id": "strawberry_squeeze_mec3",
    "name": "Strawberry Squeeze Mec3",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 12,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 11.207,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "suger_can_1883",
    "name": "Suger Can 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 2,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "toffee_cranch_syrup_1l",
    "name": "Toffee Cranch Syrup 1L",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 3825,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": 1000,
    "costPerPurchaseUnit": 5.6,
    "costPerBaseUnit": 0.0056,
    "vendor": "almahmudia"
  },
  {
    "id": "tosted_marshmallow",
    "name": "Tosted Marshmallow",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 4,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "vanila_1883",
    "name": "Vanila 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 10,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "vanila_sugar_free",
    "name": "Vanila Sugar Free",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 7.0,
    "costPerBaseUnit": null,
    "vendor": "Tree of life"
  },
  {
    "id": "vanila_sugar_free_1883",
    "name": "Vanila Sugar Free - 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 0,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 6.466,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "watermelon_1883",
    "name": "Watermelon 1883",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 5,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 5.603,
    "costPerBaseUnit": null,
    "vendor": "al mahmoudia"
  },
  {
    "id": "white_chocolate_sauce_1_9",
    "name": "White Chocolate Sauce 1.9",
    "category": "Syrup & Sauce",
    "baseUnit": "ml",
    "currentQuantity": 12,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 13.291666666666666,
    "costPerBaseUnit": null,
    "vendor": "Tree of life"
  },
  {
    "id": "basic_green_tea",
    "name": "Basic Green Tea",
    "category": "Tea&Herbs",
    "baseUnit": "ml",
    "currentQuantity": 95,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.03,
    "costPerBaseUnit": null,
    "vendor": "super market"
  },
  {
    "id": "black_tea_breakfast",
    "name": "Black Tea Breakfast",
    "category": "Tea&Herbs",
    "baseUnit": "ml",
    "currentQuantity": 23,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.4,
    "costPerBaseUnit": null,
    "vendor": "Sava"
  },
  {
    "id": "black_tea_nights",
    "name": "Black Tea Nights",
    "category": "Tea&Herbs",
    "baseUnit": "ml",
    "currentQuantity": 68,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.4,
    "costPerBaseUnit": null,
    "vendor": "Sava"
  },
  {
    "id": "chamomile_tea",
    "name": "Chamomile Tea",
    "category": "Tea&Herbs",
    "baseUnit": "ml",
    "currentQuantity": 25,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.5,
    "costPerBaseUnit": null,
    "vendor": "Sava"
  },
  {
    "id": "earl_grey_tea",
    "name": "Earl Grey Tea",
    "category": "Tea&Herbs",
    "baseUnit": "ml",
    "currentQuantity": 6,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.4,
    "costPerBaseUnit": null,
    "vendor": "Sava"
  },
  {
    "id": "green_tea_culs_100_s",
    "name": "Green Tea Culs 100 S",
    "category": "Tea&Herbs",
    "baseUnit": "ml",
    "currentQuantity": 76,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.4,
    "costPerBaseUnit": null,
    "vendor": "Sava"
  },
  {
    "id": "green_tea_moroccan",
    "name": "Green Tea Moroccan",
    "category": "Tea&Herbs",
    "baseUnit": "ml",
    "currentQuantity": 40,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.4,
    "costPerBaseUnit": null,
    "vendor": "Sava"
  },
  {
    "id": "harbal_happy_fores",
    "name": "Harbal Happy Fores",
    "category": "Tea&Herbs",
    "baseUnit": "ml",
    "currentQuantity": 91,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.5,
    "costPerBaseUnit": null,
    "vendor": "Sava"
  },
  {
    "id": "herbal_ginger_tea",
    "name": "Herbal Ginger Tea",
    "category": "Tea&Herbs",
    "baseUnit": "ml",
    "currentQuantity": 65,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.5,
    "costPerBaseUnit": null,
    "vendor": "Sava"
  },
  {
    "id": "jasmine_green_tea",
    "name": "Jasmine Green Tea",
    "category": "Tea&Herbs",
    "baseUnit": "ml",
    "currentQuantity": 76,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.4,
    "costPerBaseUnit": null,
    "vendor": "Sava"
  },
  {
    "id": "masla_tea",
    "name": "Masla Tea",
    "category": "Tea&Herbs",
    "baseUnit": "ml",
    "currentQuantity": 80,
    "purchaseUnitName": "pcs",
    "purchaseUnitSize": null,
    "costPerPurchaseUnit": 0.4,
    "costPerBaseUnit": null,
    "vendor": "sava"
  }
];

export const menuItemsSeed: MenuItemSeed[] = [
  {
    "id": "americano_medium",
    "name": "Americano (Medium)",
    "category": "Black Coffee",
    "recipe": [
      {
        "ingredientId": "water",
        "amount": 360
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      }
    ]
  },
  {
    "id": "americano_small",
    "name": "Americano (Small)",
    "category": "Black Coffee",
    "recipe": [
      {
        "ingredientId": "water",
        "amount": 270
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      }
    ]
  },
  {
    "id": "chemex_small",
    "name": "CHEMEX (Small)",
    "category": "Black Coffee",
    "recipe": [
      {
        "ingredientId": "single_origin_coffee",
        "amount": 20
      },
      {
        "ingredientId": "water",
        "amount": 300
      }
    ]
  },
  {
    "id": "cortado_one",
    "name": "CORTADO",
    "category": "Black Coffee",
    "recipe": [
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      },
      {
        "ingredientId": "milk",
        "amount": 60
      }
    ]
  },
  {
    "id": "espresso_macchiato_single",
    "name": "Espresso Macchiato (Single)",
    "category": "Black Coffee",
    "recipe": [
      {
        "ingredientId": "espresso_shot",
        "amount": 30
      },
      {
        "ingredientId": "heating_of_milk",
        "amount": 120
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      },
      {
        "ingredientId": "heating_of_milk",
        "amount": 120
      }
    ]
  },
  {
    "id": "french_press_small",
    "name": "French Press (Small)",
    "category": "Black Coffee",
    "recipe": [
      {
        "ingredientId": "single_origin_coffee",
        "amount": 22
      },
      {
        "ingredientId": "water",
        "amount": 300
      }
    ]
  },
  {
    "id": "red_eye_medium",
    "name": "Red Eye (Medium)",
    "category": "Black Coffee",
    "recipe": [
      {
        "ingredientId": "american_coffee_2",
        "amount": 420
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 30
      }
    ]
  },
  {
    "id": "red_eye_small",
    "name": "Red Eye (Small)",
    "category": "Black Coffee",
    "recipe": [
      {
        "ingredientId": "american_coffee_2",
        "amount": 270
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 30
      }
    ]
  },
  {
    "id": "v60_small",
    "name": "V60 (Small)",
    "category": "Black Coffee",
    "recipe": [
      {
        "ingredientId": "single_origin_coffee",
        "amount": 20
      },
      {
        "ingredientId": "water",
        "amount": 150
      }
    ]
  },
  {
    "id": "v60_60_drip_coffee_small",
    "name": "V60 60 Drip Coffee (Small)",
    "category": "Black Coffee",
    "recipe": [
      {
        "ingredientId": "single_origin_coffee",
        "amount": 20
      },
      {
        "ingredientId": "water",
        "amount": 300
      }
    ]
  },
  {
    "id": "caramel_coffee_one",
    "name": "Caramel Coffee",
    "category": "Blend Storm",
    "recipe": [
      {
        "ingredientId": "coffee_liquid",
        "amount": 150
      },
      {
        "ingredientId": "caramel_sauce",
        "amount": 45
      },
      {
        "ingredientId": "coffee_base_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      },
      {
        "ingredientId": "caramel_drizzle",
        "amount": 8
      },
      {
        "ingredientId": "garnish_caramel_drizzle_from_the_inside",
        "amount": 8
      }
    ]
  },
  {
    "id": "caramel_salty_one",
    "name": "Caramel Salty",
    "category": "Blend Storm",
    "recipe": [
      {
        "ingredientId": "coffee_liquid",
        "amount": 150
      },
      {
        "ingredientId": "salted_caramel_sauce",
        "amount": 45
      },
      {
        "ingredientId": "coffee_base_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      },
      {
        "ingredientId": "caramel_salted_drizzle",
        "amount": 8
      },
      {
        "ingredientId": "sugar",
        "amount": 2
      }
    ]
  },
  {
    "id": "creamy_chocolate_crumble_one",
    "name": "Creamy Chocolate Crumble",
    "category": "Blend Storm",
    "recipe": [
      {
        "ingredientId": "milk",
        "amount": 150
      },
      {
        "ingredientId": "dark_chocolate_sauce",
        "amount": 45
      },
      {
        "ingredientId": "chocolate_chip",
        "amount": 25
      },
      {
        "ingredientId": "vanilla_base_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      },
      {
        "ingredientId": "chocolate_drizzle",
        "amount": 8
      },
      {
        "ingredientId": "chocolate_powder",
        "amount": 2
      },
      {
        "ingredientId": "chocolate_chip",
        "amount": 4
      }
    ]
  },
  {
    "id": "crumble_caramel_nut_one",
    "name": "Crumble Caramel Nut",
    "category": "Blend Storm",
    "recipe": [
      {
        "ingredientId": "coffee_liquid",
        "amount": 150
      },
      {
        "ingredientId": "caramel_sauce",
        "amount": 15
      },
      {
        "ingredientId": "hazelnut_flavor",
        "amount": 20
      },
      {
        "ingredientId": "chocolate_chip",
        "amount": 25
      },
      {
        "ingredientId": "coffee_base_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      },
      {
        "ingredientId": "caramel_drizzle",
        "amount": 8
      },
      {
        "ingredientId": "chocolate_chip",
        "amount": 5
      }
    ]
  },
  {
    "id": "crumble_white_cream_one",
    "name": "Crumble White Cream",
    "category": "Blend Storm",
    "recipe": [
      {
        "ingredientId": "milk",
        "amount": 150
      },
      {
        "ingredientId": "vanilla_syrup_30",
        "amount": 24
      },
      {
        "ingredientId": "chocolate_chip",
        "amount": 25
      },
      {
        "ingredientId": "vanilla_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      },
      {
        "ingredientId": "chocolate_drizzle",
        "amount": 8
      },
      {
        "ingredientId": "chocolate_chip",
        "amount": 5
      },
      {
        "ingredientId": "garnish_chocolate_drizzle_from_the_inside",
        "amount": 8
      }
    ]
  },
  {
    "id": "dark_chocolate_mocha_one",
    "name": "Dark Chocolate Mocha",
    "category": "Blend Storm",
    "recipe": [
      {
        "ingredientId": "coffee_liquid",
        "amount": 150
      },
      {
        "ingredientId": "dark_chocolate",
        "amount": 45
      },
      {
        "ingredientId": "coffee_base_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      },
      {
        "ingredientId": "chocolate_drizzle",
        "amount": 8
      },
      {
        "ingredientId": "garnish_chocolate_drizzle_from_the_inside",
        "amount": 8
      }
    ]
  },
  {
    "id": "green_matcha_cream_one",
    "name": "Green Matcha Cream",
    "category": "Blend Storm",
    "recipe": [
      {
        "ingredientId": "milk",
        "amount": 200
      },
      {
        "ingredientId": "pure_matcha_powder",
        "amount": 5
      },
      {
        "ingredientId": "vanilla_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      }
    ]
  },
  {
    "id": "green_matcha_pure_one",
    "name": "Green Matcha PURE",
    "category": "Blend Storm",
    "recipe": [
      {
        "ingredientId": "pure_matcha_powder",
        "amount": 5
      },
      {
        "ingredientId": "ice",
        "amount": 6
      }
    ]
  },
  {
    "id": "mocha_chocolate_chip_one",
    "name": "Mocha Chocolate Chip",
    "category": "Blend Storm",
    "recipe": [
      {
        "ingredientId": "coffee_liquid",
        "amount": 150
      },
      {
        "ingredientId": "dark_chocolate",
        "amount": 45
      },
      {
        "ingredientId": "chocolate_chip",
        "amount": 25
      },
      {
        "ingredientId": "coffee_base_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      },
      {
        "ingredientId": "chocolate_drizzle",
        "amount": 8
      },
      {
        "ingredientId": "chocolate_chip",
        "amount": 5
      },
      {
        "ingredientId": "garnish_chocolate_drizzle_from_the_inside",
        "amount": 8
      }
    ]
  },
  {
    "id": "white_caramel_cream_one",
    "name": "White Caramel Cream",
    "category": "Blend Storm",
    "recipe": [
      {
        "ingredientId": "milk",
        "amount": 150
      },
      {
        "ingredientId": "caramel_sauce",
        "amount": 45
      },
      {
        "ingredientId": "vanilla_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      },
      {
        "ingredientId": "caramel_drizzle",
        "amount": 8
      },
      {
        "ingredientId": "garnish_caramel_from_the_inside",
        "amount": 8
      }
    ]
  },
  {
    "id": "white_chcoclate_mocha_one",
    "name": "White Chcoclate Mocha",
    "category": "Blend Storm",
    "recipe": [
      {
        "ingredientId": "coffee_liquid",
        "amount": 150
      },
      {
        "ingredientId": "white_chocolate_sauce",
        "amount": 50
      },
      {
        "ingredientId": "coffee_base_powder_base",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      },
      {
        "ingredientId": "white_chocolate_drizzle",
        "amount": 5
      }
    ]
  },
  {
    "id": "ice_shaking_white_mocha_one",
    "name": "ICE SHAKING White Mocha",
    "category": "Iced Storm",
    "recipe": [
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      },
      {
        "ingredientId": "liquid_cream",
        "amount": 30
      }
    ]
  },
  {
    "id": "iced_americano_one",
    "name": "Iced Americano",
    "category": "Iced Storm",
    "recipe": [
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      }
    ]
  },
  {
    "id": "iced_cappuccino_one",
    "name": "Iced Cappuccino",
    "category": "Iced Storm",
    "recipe": [
      {
        "ingredientId": "cold",
        "amount": 150
      },
      {
        "ingredientId": "ice",
        "amount": 5
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      }
    ]
  },
  {
    "id": "iced_caramel_macchiato_one",
    "name": "Iced Caramel Macchiato",
    "category": "Iced Storm",
    "recipe": [
      {
        "ingredientId": "milk",
        "amount": 240
      },
      {
        "ingredientId": "ice",
        "amount": 6
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      },
      {
        "ingredientId": "topping_caramel_drizzle",
        "amount": 5
      }
    ]
  },
  {
    "id": "iced_latte_one",
    "name": "Iced Latte",
    "category": "Iced Storm",
    "recipe": [
      {
        "ingredientId": "milk",
        "amount": 240
      },
      {
        "ingredientId": "ice",
        "amount": 6
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      }
    ]
  },
  {
    "id": "iced_mocha_one",
    "name": "Iced Mocha",
    "category": "Iced Storm",
    "recipe": [
      {
        "ingredientId": "dark_chocolate_sauce",
        "amount": 60
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      },
      {
        "ingredientId": "ice",
        "amount": 6
      },
      {
        "ingredientId": "milk",
        "amount": 200
      }
    ]
  },
  {
    "id": "iced_pistachio_latte_one",
    "name": "Iced Pistachio Latte",
    "category": "Iced Storm",
    "recipe": [
      {
        "ingredientId": "pistachio_sauce",
        "amount": 65
      },
      {
        "ingredientId": "milk",
        "amount": 200
      },
      {
        "ingredientId": "ice",
        "amount": 6
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      }
    ]
  },
  {
    "id": "iced_rose_latte_one",
    "name": "Iced Rose Latte",
    "category": "Iced Storm",
    "recipe": [
      {
        "ingredientId": "rose_sauce",
        "amount": 65
      },
      {
        "ingredientId": "milk",
        "amount": 200
      },
      {
        "ingredientId": "ice",
        "amount": 6
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      }
    ]
  },
  {
    "id": "iced_spanish_latte_one",
    "name": "Iced Spanish Latte",
    "category": "Iced Storm",
    "recipe": [
      {
        "ingredientId": "spanish_sauce",
        "amount": 65
      },
      {
        "ingredientId": "milk",
        "amount": 200
      },
      {
        "ingredientId": "ice",
        "amount": 6
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      }
    ]
  },
  {
    "id": "iced_tea_one",
    "name": "Iced Tea",
    "category": "Iced Storm",
    "recipe": [
      {
        "ingredientId": "ice",
        "amount": 6
      }
    ]
  },
  {
    "id": "iced_white_mocha_one",
    "name": "Iced White Mocha",
    "category": "Iced Storm",
    "recipe": [
      {
        "ingredientId": "white_chocolate_sauce",
        "amount": 60
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      },
      {
        "ingredientId": "ice",
        "amount": 6
      },
      {
        "ingredientId": "milk",
        "amount": 200
      }
    ]
  },
  {
    "id": "cafe_latte_medium",
    "name": "*Café Latte (Medium)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      },
      {
        "ingredientId": "milk_11oz",
        "amount": 300
      },
      {
        "ingredientId": "flavor_30",
        "amount": 24
      }
    ]
  },
  {
    "id": "cafe_latte_small",
    "name": "*Café Latte (Small)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      },
      {
        "ingredientId": "milk_8oz",
        "amount": 240
      },
      {
        "ingredientId": "flavor_20",
        "amount": 16
      }
    ]
  },
  {
    "id": "cafe_mocha_medium",
    "name": "Café Mocha (Medium)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "dark_chocolate",
        "amount": 60
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      },
      {
        "ingredientId": "milk_9oz",
        "amount": 270
      }
    ]
  },
  {
    "id": "cafe_mocha_small",
    "name": "Café Mocha (Small)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "dark_chocolate",
        "amount": 45
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      },
      {
        "ingredientId": "milk_6_oz",
        "amount": 200
      }
    ]
  },
  {
    "id": "cappuccino_medium",
    "name": "Cappuccino (Medium)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      },
      {
        "ingredientId": "milk_9oz",
        "amount": 270
      },
      {
        "ingredientId": "flavor_20",
        "amount": 16
      }
    ]
  },
  {
    "id": "cappuccino_small",
    "name": "Cappuccino (Small)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      },
      {
        "ingredientId": "milk_6oz",
        "amount": 180
      },
      {
        "ingredientId": "flavor_20",
        "amount": 16
      }
    ]
  },
  {
    "id": "caramel_macchiato_medium",
    "name": "Caramel Macchiato (Medium)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "vanilla_syrup",
        "amount": 30
      },
      {
        "ingredientId": "milk",
        "amount": 270
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      },
      {
        "ingredientId": "topping_caramel_drizzle",
        "amount": 5
      }
    ]
  },
  {
    "id": "caramel_macchiato_small",
    "name": "Caramel Macchiato (Small)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "vanilla_syrup",
        "amount": 20
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      },
      {
        "ingredientId": "topping_caramel_drizzle",
        "amount": 5
      }
    ]
  },
  {
    "id": "classic_hot_chocolate_medium",
    "name": "Classic Hot Chocolate (Medium)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "chocolate_powder",
        "amount": 50
      },
      {
        "ingredientId": "milk",
        "amount": 300
      }
    ]
  },
  {
    "id": "classic_hot_chocolate_small",
    "name": "Classic Hot Chocolate (Small)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "chocolate_powder",
        "amount": 38
      },
      {
        "ingredientId": "milk",
        "amount": 240
      }
    ]
  },
  {
    "id": "coconut_hot_chocolate_medium",
    "name": "Coconut Hot Chocolate (Medium)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "chocolate_powder",
        "amount": 60
      },
      {
        "ingredientId": "milk",
        "amount": 300
      },
      {
        "ingredientId": "coconut_syrup",
        "amount": 30
      },
      {
        "ingredientId": "topping_brown_whipped_cream",
        "amount": 10
      }
    ]
  },
  {
    "id": "coconut_hot_chocolate_small",
    "name": "Coconut Hot Chocolate (Small)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "1_hot_chocolate_powder",
        "amount": 60
      },
      {
        "ingredientId": "milk",
        "amount": 240
      },
      {
        "ingredientId": "coconut_syrup",
        "amount": 20
      },
      {
        "ingredientId": "topping_brown_whipped_cream",
        "amount": 10
      }
    ]
  },
  {
    "id": "flat_white_8_oz",
    "name": "Flat White (8 Oz)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      },
      {
        "ingredientId": "milk",
        "amount": 150
      }
    ]
  },
  {
    "id": "nuts_hot_chocolate_medium",
    "name": "Nuts Hot Chocolate (Medium)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "chocolate_powder",
        "amount": 50
      },
      {
        "ingredientId": "milk",
        "amount": 300
      },
      {
        "ingredientId": "roasted_hazelnut_syrup",
        "amount": 30
      },
      {
        "ingredientId": "topping_brown_whipped_cream",
        "amount": 10
      }
    ]
  },
  {
    "id": "nuts_hot_chocolate_small",
    "name": "Nuts Hot Chocolate (Small)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "1_hot_chocolate_powder",
        "amount": 38
      },
      {
        "ingredientId": "milk",
        "amount": 240
      },
      {
        "ingredientId": "roasted_hazelnut_syrup",
        "amount": 20
      },
      {
        "ingredientId": "topping_brown_whipped_cream",
        "amount": 10
      }
    ]
  },
  {
    "id": "pistachio_latte_medium",
    "name": "Pistachio Latte (Medium)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "pistachio_sauce",
        "amount": 65
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      },
      {
        "ingredientId": "milk",
        "amount": 270
      }
    ]
  },
  {
    "id": "pistachio_latte_small",
    "name": "Pistachio Latte (Small)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "pistachio_sauce",
        "amount": 45
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      },
      {
        "ingredientId": "milk",
        "amount": 200
      }
    ]
  },
  {
    "id": "rose_latte_medium",
    "name": "Rose Latte (Medium)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "rose_sauce",
        "amount": 65
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      },
      {
        "ingredientId": "milk",
        "amount": 270
      }
    ]
  },
  {
    "id": "rose_latte_small",
    "name": "Rose Latte (Small)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "rose_sauce",
        "amount": 45
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      },
      {
        "ingredientId": "milk",
        "amount": 200
      }
    ]
  },
  {
    "id": "smores_hot_chocolate_medium",
    "name": "Smores Hot Chocolate (Medium)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "chocolate_powder",
        "amount": 50
      },
      {
        "ingredientId": "milk",
        "amount": 280
      },
      {
        "ingredientId": "roasted_marshmallow",
        "amount": 24
      }
    ]
  },
  {
    "id": "smores_hot_chocolate_small",
    "name": "Smores Hot Chocolate (Small)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "1_hot_chocolate_powder",
        "amount": 38
      },
      {
        "ingredientId": "milk",
        "amount": 220
      },
      {
        "ingredientId": "roasted_marshmallow",
        "amount": 16
      }
    ]
  },
  {
    "id": "spanish_latte_medium",
    "name": "Spanish Latte (Medium)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "spanish_sauce",
        "amount": 65
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      },
      {
        "ingredientId": "milk",
        "amount": 270
      }
    ]
  },
  {
    "id": "spanish_latte_small",
    "name": "Spanish Latte (Small)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "spanish_sauce",
        "amount": 45
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      },
      {
        "ingredientId": "milk",
        "amount": 200
      }
    ]
  },
  {
    "id": "white_hot_chocolate_medium",
    "name": "White Hot Chocolate (Medium)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "white_chocolate_sauce",
        "amount": 60
      },
      {
        "ingredientId": "caramel_flavor",
        "amount": 10
      },
      {
        "ingredientId": "milk",
        "amount": 300
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 10
      },
      {
        "ingredientId": "vanilla_powder",
        "amount": 1
      }
    ]
  },
  {
    "id": "white_hot_chocolate_small",
    "name": "White Hot Chocolate (Small)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "white_chocolate_sauce",
        "amount": 45
      },
      {
        "ingredientId": "caramel_flavor",
        "amount": 10
      },
      {
        "ingredientId": "milk",
        "amount": 240
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 10
      },
      {
        "ingredientId": "vanilla_powder",
        "amount": 1
      }
    ]
  },
  {
    "id": "white_mocha_medium",
    "name": "White Mocha (Medium)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "white_chocolate",
        "amount": 60
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      },
      {
        "ingredientId": "milk_9oz",
        "amount": 270
      }
    ]
  },
  {
    "id": "white_mocha_small",
    "name": "White Mocha (Small)",
    "category": "Milk Coffee",
    "recipe": [
      {
        "ingredientId": "white_chocolate",
        "amount": 45
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      },
      {
        "ingredientId": "milk_6oz",
        "amount": 200
      }
    ]
  },
  {
    "id": "dragon_fruit_mojito_one",
    "name": "Dragon Fruit Mojito",
    "category": "Mojito",
    "recipe": [
      {
        "ingredientId": "soda_water",
        "amount": 50
      }
    ]
  },
  {
    "id": "mango_passion_froit_mojito_one",
    "name": "Mango Passion Froit Mojito",
    "category": "Mojito",
    "recipe": [
      {
        "ingredientId": "soda_water",
        "amount": 50
      }
    ]
  },
  {
    "id": "strawberry_mojito_one",
    "name": "Strawberry Mojito",
    "category": "Mojito",
    "recipe": [
      {
        "ingredientId": "soda_water",
        "amount": 50
      }
    ]
  },
  {
    "id": "water_melon_mojito_one",
    "name": "Water Melon Mojito",
    "category": "Mojito",
    "recipe": [
      {
        "ingredientId": "soda_water",
        "amount": 50
      }
    ]
  },
  {
    "id": "super_berry_one",
    "name": "*Super Berry",
    "category": "Smoothies",
    "recipe": [
      {
        "ingredientId": "green_tea_base",
        "amount": 100
      },
      {
        "ingredientId": "raspberry_puree",
        "amount": 30
      },
      {
        "ingredientId": "mixed_berries_puree",
        "amount": 30
      },
      {
        "ingredientId": "blueberry_puree",
        "amount": 15
      },
      {
        "ingredientId": "non_dairy_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "garnish_blueberry_puree_the_inside",
        "amount": 5
      }
    ]
  },
  {
    "id": "apple_lime_one",
    "name": "Apple Lime",
    "category": "Smoothies",
    "recipe": [
      {
        "ingredientId": "green_tea_base",
        "amount": 150
      },
      {
        "ingredientId": "green_apple_puree",
        "amount": 45
      },
      {
        "ingredientId": "lime_puree",
        "amount": 30
      },
      {
        "ingredientId": "non_dairy_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      }
    ]
  },
  {
    "id": "la_vina_cream_one",
    "name": "La Vina Cream",
    "category": "Smoothies",
    "recipe": [
      {
        "ingredientId": "milk",
        "amount": 150
      },
      {
        "ingredientId": "raspberry_puree",
        "amount": 45
      },
      {
        "ingredientId": "vanilla_syrup",
        "amount": 10
      },
      {
        "ingredientId": "vanilla_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      },
      {
        "ingredientId": "raspberry_puree",
        "amount": 5
      }
    ]
  },
  {
    "id": "mango_passion_fruit_one",
    "name": "Mango Passion Fruit",
    "category": "Smoothies",
    "recipe": [
      {
        "ingredientId": "green_tea",
        "amount": 150
      },
      {
        "ingredientId": "mango_puree",
        "amount": 45
      },
      {
        "ingredientId": "passion_fruit_puree",
        "amount": 15
      },
      {
        "ingredientId": "ice",
        "amount": 8
      }
    ]
  },
  {
    "id": "mix_passion_one",
    "name": "Mix Passion",
    "category": "Smoothies",
    "recipe": [
      {
        "ingredientId": "passion_fruit",
        "amount": 45
      },
      {
        "ingredientId": "peach",
        "amount": 15
      },
      {
        "ingredientId": "vanilla_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream_and_peach_puree",
        "amount": 15
      }
    ]
  },
  {
    "id": "yellow_shine_one",
    "name": "Yellow Shine",
    "category": "Smoothies",
    "recipe": [
      {
        "ingredientId": "green_tea_base",
        "amount": 150
      },
      {
        "ingredientId": "peach_puree",
        "amount": 45
      },
      {
        "ingredientId": "mango_puree",
        "amount": 15
      },
      {
        "ingredientId": "non_dairy_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      }
    ]
  },
  {
    "id": "yogurt_forest_one",
    "name": "Yogurt Forest",
    "category": "Smoothies",
    "recipe": [
      {
        "ingredientId": "milk",
        "amount": 150
      },
      {
        "ingredientId": "yogurt_powder",
        "amount": 50
      },
      {
        "ingredientId": "blueberry_puree",
        "amount": 30
      },
      {
        "ingredientId": "strawberry_puree",
        "amount": 30
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      },
      {
        "ingredientId": "blueberry_puree",
        "amount": 5
      }
    ]
  },
  {
    "id": "hot_wind_medium",
    "name": "Hot Wind (Medium)",
    "category": "Special Drinks",
    "recipe": [
      {
        "ingredientId": "milk",
        "amount": 240
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 90
      },
      {
        "ingredientId": "salted_caramel_flavor",
        "amount": 30
      }
    ]
  },
  {
    "id": "hot_wind_small",
    "name": "Hot Wind (Small)",
    "category": "Special Drinks",
    "recipe": [
      {
        "ingredientId": "milk",
        "amount": 200
      },
      {
        "ingredientId": "espresso_shot",
        "amount": 60
      },
      {
        "ingredientId": "salted_caramel_flavor",
        "amount": 20
      }
    ]
  },
  {
    "id": "red_joy_one",
    "name": "Red Joy",
    "category": "Special Drinks",
    "recipe": [
      {
        "ingredientId": "strawberry_puree",
        "amount": 30
      },
      {
        "ingredientId": "water_melon_syrup",
        "amount": 20
      },
      {
        "ingredientId": "lemon_rancho_syrup",
        "amount": 30
      },
      {
        "ingredientId": "vanilla_syrup",
        "amount": 10
      },
      {
        "ingredientId": "green_tea_base",
        "amount": 180
      }
    ]
  },
  {
    "id": "toffee_wonder_one",
    "name": "Toffee Wonder",
    "category": "Special Drinks",
    "recipe": [
      {
        "ingredientId": "coffee_liquid",
        "amount": 150
      },
      {
        "ingredientId": "toffee_powder",
        "amount": 25
      },
      {
        "ingredientId": "dulce_di_leche",
        "amount": 16
      },
      {
        "ingredientId": "coffee_base_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      },
      {
        "ingredientId": "caramel_drizzle",
        "amount": 8
      }
    ]
  },
  {
    "id": "tropical_waves_one",
    "name": "Tropical Waves",
    "category": "Special Drinks",
    "recipe": [
      {
        "ingredientId": "pineapple_puree",
        "amount": 30
      },
      {
        "ingredientId": "terinage_puree",
        "amount": 30
      },
      {
        "ingredientId": "lemon_rancho",
        "amount": 20
      },
      {
        "ingredientId": "caramel_syrup",
        "amount": 10
      },
      {
        "ingredientId": "green_tea_base",
        "amount": 180
      }
    ]
  },
  {
    "id": "white_land_one",
    "name": "White Land",
    "category": "Special Drinks",
    "recipe": [
      {
        "ingredientId": "milk",
        "amount": 150
      },
      {
        "ingredientId": "salted_caramel_sauce",
        "amount": 30
      },
      {
        "ingredientId": "macadamia_syrup",
        "amount": 16
      },
      {
        "ingredientId": "vanilla_powder",
        "amount": 25
      },
      {
        "ingredientId": "ice",
        "amount": 8
      },
      {
        "ingredientId": "topping_whipped_cream",
        "amount": 15
      }
    ]
  },
  {
    "id": "chai_tea_medium",
    "name": "*Chai Tea (Medium)",
    "category": "Tea & Herbs",
    "recipe": [
      {
        "ingredientId": "chai_tea_syrup",
        "amount": 30
      },
      {
        "ingredientId": "chai_tea_powder",
        "amount": 50
      },
      {
        "ingredientId": "milk",
        "amount": 300
      }
    ]
  },
  {
    "id": "chai_tea_small",
    "name": "*Chai Tea (Small)",
    "category": "Tea & Herbs",
    "recipe": [
      {
        "ingredientId": "chai_tea_syrup",
        "amount": 20
      },
      {
        "ingredientId": "chai_tea_powder",
        "amount": 25
      },
      {
        "ingredientId": "milk",
        "amount": 240
      }
    ]
  },
  {
    "id": "creamy_matcha_medium",
    "name": "Creamy Matcha (Medium)",
    "category": "Tea & Herbs",
    "recipe": [
      {
        "ingredientId": "pure_matcha_powder",
        "amount": 5
      },
      {
        "ingredientId": "vanilla_flavor",
        "amount": 20
      },
      {
        "ingredientId": "milk",
        "amount": 300
      }
    ]
  },
  {
    "id": "creamy_matcha_small",
    "name": "Creamy Matcha (Small)",
    "category": "Tea & Herbs",
    "recipe": [
      {
        "ingredientId": "pure_matcha_powder",
        "amount": 3
      },
      {
        "ingredientId": "milk",
        "amount": 240
      },
      {
        "ingredientId": "vanilla_flavor",
        "amount": 10
      }
    ]
  },
  {
    "id": "pure_matcha_medium",
    "name": "Pure Matcha (Medium)",
    "category": "Tea & Herbs",
    "recipe": [
      {
        "ingredientId": "pure_matcha_powder",
        "amount": 5
      },
      {
        "ingredientId": "milk",
        "amount": 380
      }
    ]
  },
  {
    "id": "pure_matcha_small",
    "name": "Pure Matcha (Small)",
    "category": "Tea & Herbs",
    "recipe": [
      {
        "ingredientId": "pure_matcha_powder",
        "amount": 3
      },
      {
        "ingredientId": "milk",
        "amount": 300
      }
    ]
  }
];

export const recipeIndex: Record<string, RecipeLine[]> = {
  "americano_medium": [
    {
      "ingredientId": "water",
      "amount": 360
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    }
  ],
  "americano_small": [
    {
      "ingredientId": "water",
      "amount": 270
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    }
  ],
  "chemex_small": [
    {
      "ingredientId": "single_origin_coffee",
      "amount": 20
    },
    {
      "ingredientId": "water",
      "amount": 300
    }
  ],
  "cortado_one": [
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    },
    {
      "ingredientId": "milk",
      "amount": 60
    }
  ],
  "espresso_macchiato_single": [
    {
      "ingredientId": "espresso_shot",
      "amount": 30
    },
    {
      "ingredientId": "heating_of_milk",
      "amount": 120
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    },
    {
      "ingredientId": "heating_of_milk",
      "amount": 120
    }
  ],
  "french_press_small": [
    {
      "ingredientId": "single_origin_coffee",
      "amount": 22
    },
    {
      "ingredientId": "water",
      "amount": 300
    }
  ],
  "red_eye_medium": [
    {
      "ingredientId": "american_coffee_2",
      "amount": 420
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 30
    }
  ],
  "red_eye_small": [
    {
      "ingredientId": "american_coffee_2",
      "amount": 270
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 30
    }
  ],
  "v60_small": [
    {
      "ingredientId": "single_origin_coffee",
      "amount": 20
    },
    {
      "ingredientId": "water",
      "amount": 150
    }
  ],
  "v60_60_drip_coffee_small": [
    {
      "ingredientId": "single_origin_coffee",
      "amount": 20
    },
    {
      "ingredientId": "water",
      "amount": 300
    }
  ],
  "caramel_coffee_one": [
    {
      "ingredientId": "coffee_liquid",
      "amount": 150
    },
    {
      "ingredientId": "caramel_sauce",
      "amount": 45
    },
    {
      "ingredientId": "coffee_base_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    },
    {
      "ingredientId": "caramel_drizzle",
      "amount": 8
    },
    {
      "ingredientId": "garnish_caramel_drizzle_from_the_inside",
      "amount": 8
    }
  ],
  "caramel_salty_one": [
    {
      "ingredientId": "coffee_liquid",
      "amount": 150
    },
    {
      "ingredientId": "salted_caramel_sauce",
      "amount": 45
    },
    {
      "ingredientId": "coffee_base_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    },
    {
      "ingredientId": "caramel_salted_drizzle",
      "amount": 8
    },
    {
      "ingredientId": "sugar",
      "amount": 2
    }
  ],
  "creamy_chocolate_crumble_one": [
    {
      "ingredientId": "milk",
      "amount": 150
    },
    {
      "ingredientId": "dark_chocolate_sauce",
      "amount": 45
    },
    {
      "ingredientId": "chocolate_chip",
      "amount": 25
    },
    {
      "ingredientId": "vanilla_base_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    },
    {
      "ingredientId": "chocolate_drizzle",
      "amount": 8
    },
    {
      "ingredientId": "chocolate_powder",
      "amount": 2
    },
    {
      "ingredientId": "chocolate_chip",
      "amount": 4
    }
  ],
  "crumble_caramel_nut_one": [
    {
      "ingredientId": "coffee_liquid",
      "amount": 150
    },
    {
      "ingredientId": "caramel_sauce",
      "amount": 15
    },
    {
      "ingredientId": "hazelnut_flavor",
      "amount": 20
    },
    {
      "ingredientId": "chocolate_chip",
      "amount": 25
    },
    {
      "ingredientId": "coffee_base_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    },
    {
      "ingredientId": "caramel_drizzle",
      "amount": 8
    },
    {
      "ingredientId": "chocolate_chip",
      "amount": 5
    }
  ],
  "crumble_white_cream_one": [
    {
      "ingredientId": "milk",
      "amount": 150
    },
    {
      "ingredientId": "vanilla_syrup_30",
      "amount": 24
    },
    {
      "ingredientId": "chocolate_chip",
      "amount": 25
    },
    {
      "ingredientId": "vanilla_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    },
    {
      "ingredientId": "chocolate_drizzle",
      "amount": 8
    },
    {
      "ingredientId": "chocolate_chip",
      "amount": 5
    },
    {
      "ingredientId": "garnish_chocolate_drizzle_from_the_inside",
      "amount": 8
    }
  ],
  "dark_chocolate_mocha_one": [
    {
      "ingredientId": "coffee_liquid",
      "amount": 150
    },
    {
      "ingredientId": "dark_chocolate",
      "amount": 45
    },
    {
      "ingredientId": "coffee_base_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    },
    {
      "ingredientId": "chocolate_drizzle",
      "amount": 8
    },
    {
      "ingredientId": "garnish_chocolate_drizzle_from_the_inside",
      "amount": 8
    }
  ],
  "green_matcha_cream_one": [
    {
      "ingredientId": "milk",
      "amount": 200
    },
    {
      "ingredientId": "pure_matcha_powder",
      "amount": 5
    },
    {
      "ingredientId": "vanilla_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    }
  ],
  "green_matcha_pure_one": [
    {
      "ingredientId": "pure_matcha_powder",
      "amount": 5
    },
    {
      "ingredientId": "ice",
      "amount": 6
    }
  ],
  "mocha_chocolate_chip_one": [
    {
      "ingredientId": "coffee_liquid",
      "amount": 150
    },
    {
      "ingredientId": "dark_chocolate",
      "amount": 45
    },
    {
      "ingredientId": "chocolate_chip",
      "amount": 25
    },
    {
      "ingredientId": "coffee_base_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    },
    {
      "ingredientId": "chocolate_drizzle",
      "amount": 8
    },
    {
      "ingredientId": "chocolate_chip",
      "amount": 5
    },
    {
      "ingredientId": "garnish_chocolate_drizzle_from_the_inside",
      "amount": 8
    }
  ],
  "white_caramel_cream_one": [
    {
      "ingredientId": "milk",
      "amount": 150
    },
    {
      "ingredientId": "caramel_sauce",
      "amount": 45
    },
    {
      "ingredientId": "vanilla_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    },
    {
      "ingredientId": "caramel_drizzle",
      "amount": 8
    },
    {
      "ingredientId": "garnish_caramel_from_the_inside",
      "amount": 8
    }
  ],
  "white_chcoclate_mocha_one": [
    {
      "ingredientId": "coffee_liquid",
      "amount": 150
    },
    {
      "ingredientId": "white_chocolate_sauce",
      "amount": 50
    },
    {
      "ingredientId": "coffee_base_powder_base",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    },
    {
      "ingredientId": "white_chocolate_drizzle",
      "amount": 5
    }
  ],
  "ice_shaking_white_mocha_one": [
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    },
    {
      "ingredientId": "liquid_cream",
      "amount": 30
    }
  ],
  "iced_americano_one": [
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    }
  ],
  "iced_cappuccino_one": [
    {
      "ingredientId": "cold",
      "amount": 150
    },
    {
      "ingredientId": "ice",
      "amount": 5
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    }
  ],
  "iced_caramel_macchiato_one": [
    {
      "ingredientId": "milk",
      "amount": 240
    },
    {
      "ingredientId": "ice",
      "amount": 6
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    },
    {
      "ingredientId": "topping_caramel_drizzle",
      "amount": 5
    }
  ],
  "iced_latte_one": [
    {
      "ingredientId": "milk",
      "amount": 240
    },
    {
      "ingredientId": "ice",
      "amount": 6
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    }
  ],
  "iced_mocha_one": [
    {
      "ingredientId": "dark_chocolate_sauce",
      "amount": 60
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    },
    {
      "ingredientId": "ice",
      "amount": 6
    },
    {
      "ingredientId": "milk",
      "amount": 200
    }
  ],
  "iced_pistachio_latte_one": [
    {
      "ingredientId": "pistachio_sauce",
      "amount": 65
    },
    {
      "ingredientId": "milk",
      "amount": 200
    },
    {
      "ingredientId": "ice",
      "amount": 6
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    }
  ],
  "iced_rose_latte_one": [
    {
      "ingredientId": "rose_sauce",
      "amount": 65
    },
    {
      "ingredientId": "milk",
      "amount": 200
    },
    {
      "ingredientId": "ice",
      "amount": 6
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    }
  ],
  "iced_spanish_latte_one": [
    {
      "ingredientId": "spanish_sauce",
      "amount": 65
    },
    {
      "ingredientId": "milk",
      "amount": 200
    },
    {
      "ingredientId": "ice",
      "amount": 6
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    }
  ],
  "iced_tea_one": [
    {
      "ingredientId": "ice",
      "amount": 6
    }
  ],
  "iced_white_mocha_one": [
    {
      "ingredientId": "white_chocolate_sauce",
      "amount": 60
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    },
    {
      "ingredientId": "ice",
      "amount": 6
    },
    {
      "ingredientId": "milk",
      "amount": 200
    }
  ],
  "cafe_latte_medium": [
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    },
    {
      "ingredientId": "milk_11oz",
      "amount": 300
    },
    {
      "ingredientId": "flavor_30",
      "amount": 24
    }
  ],
  "cafe_latte_small": [
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    },
    {
      "ingredientId": "milk_8oz",
      "amount": 240
    },
    {
      "ingredientId": "flavor_20",
      "amount": 16
    }
  ],
  "cafe_mocha_medium": [
    {
      "ingredientId": "dark_chocolate",
      "amount": 60
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    },
    {
      "ingredientId": "milk_9oz",
      "amount": 270
    }
  ],
  "cafe_mocha_small": [
    {
      "ingredientId": "dark_chocolate",
      "amount": 45
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    },
    {
      "ingredientId": "milk_6_oz",
      "amount": 200
    }
  ],
  "cappuccino_medium": [
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    },
    {
      "ingredientId": "milk_9oz",
      "amount": 270
    },
    {
      "ingredientId": "flavor_20",
      "amount": 16
    }
  ],
  "cappuccino_small": [
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    },
    {
      "ingredientId": "milk_6oz",
      "amount": 180
    },
    {
      "ingredientId": "flavor_20",
      "amount": 16
    }
  ],
  "caramel_macchiato_medium": [
    {
      "ingredientId": "vanilla_syrup",
      "amount": 30
    },
    {
      "ingredientId": "milk",
      "amount": 270
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    },
    {
      "ingredientId": "topping_caramel_drizzle",
      "amount": 5
    }
  ],
  "caramel_macchiato_small": [
    {
      "ingredientId": "vanilla_syrup",
      "amount": 20
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    },
    {
      "ingredientId": "topping_caramel_drizzle",
      "amount": 5
    }
  ],
  "classic_hot_chocolate_medium": [
    {
      "ingredientId": "chocolate_powder",
      "amount": 50
    },
    {
      "ingredientId": "milk",
      "amount": 300
    }
  ],
  "classic_hot_chocolate_small": [
    {
      "ingredientId": "chocolate_powder",
      "amount": 38
    },
    {
      "ingredientId": "milk",
      "amount": 240
    }
  ],
  "coconut_hot_chocolate_medium": [
    {
      "ingredientId": "chocolate_powder",
      "amount": 60
    },
    {
      "ingredientId": "milk",
      "amount": 300
    },
    {
      "ingredientId": "coconut_syrup",
      "amount": 30
    },
    {
      "ingredientId": "topping_brown_whipped_cream",
      "amount": 10
    }
  ],
  "coconut_hot_chocolate_small": [
    {
      "ingredientId": "1_hot_chocolate_powder",
      "amount": 60
    },
    {
      "ingredientId": "milk",
      "amount": 240
    },
    {
      "ingredientId": "coconut_syrup",
      "amount": 20
    },
    {
      "ingredientId": "topping_brown_whipped_cream",
      "amount": 10
    }
  ],
  "flat_white_8_oz": [
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    },
    {
      "ingredientId": "milk",
      "amount": 150
    }
  ],
  "nuts_hot_chocolate_medium": [
    {
      "ingredientId": "chocolate_powder",
      "amount": 50
    },
    {
      "ingredientId": "milk",
      "amount": 300
    },
    {
      "ingredientId": "roasted_hazelnut_syrup",
      "amount": 30
    },
    {
      "ingredientId": "topping_brown_whipped_cream",
      "amount": 10
    }
  ],
  "nuts_hot_chocolate_small": [
    {
      "ingredientId": "1_hot_chocolate_powder",
      "amount": 38
    },
    {
      "ingredientId": "milk",
      "amount": 240
    },
    {
      "ingredientId": "roasted_hazelnut_syrup",
      "amount": 20
    },
    {
      "ingredientId": "topping_brown_whipped_cream",
      "amount": 10
    }
  ],
  "pistachio_latte_medium": [
    {
      "ingredientId": "pistachio_sauce",
      "amount": 65
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    },
    {
      "ingredientId": "milk",
      "amount": 270
    }
  ],
  "pistachio_latte_small": [
    {
      "ingredientId": "pistachio_sauce",
      "amount": 45
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    },
    {
      "ingredientId": "milk",
      "amount": 200
    }
  ],
  "rose_latte_medium": [
    {
      "ingredientId": "rose_sauce",
      "amount": 65
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    },
    {
      "ingredientId": "milk",
      "amount": 270
    }
  ],
  "rose_latte_small": [
    {
      "ingredientId": "rose_sauce",
      "amount": 45
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    },
    {
      "ingredientId": "milk",
      "amount": 200
    }
  ],
  "smores_hot_chocolate_medium": [
    {
      "ingredientId": "chocolate_powder",
      "amount": 50
    },
    {
      "ingredientId": "milk",
      "amount": 280
    },
    {
      "ingredientId": "roasted_marshmallow",
      "amount": 24
    }
  ],
  "smores_hot_chocolate_small": [
    {
      "ingredientId": "1_hot_chocolate_powder",
      "amount": 38
    },
    {
      "ingredientId": "milk",
      "amount": 220
    },
    {
      "ingredientId": "roasted_marshmallow",
      "amount": 16
    }
  ],
  "spanish_latte_medium": [
    {
      "ingredientId": "spanish_sauce",
      "amount": 65
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    },
    {
      "ingredientId": "milk",
      "amount": 270
    }
  ],
  "spanish_latte_small": [
    {
      "ingredientId": "spanish_sauce",
      "amount": 45
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    },
    {
      "ingredientId": "milk",
      "amount": 200
    }
  ],
  "white_hot_chocolate_medium": [
    {
      "ingredientId": "white_chocolate_sauce",
      "amount": 60
    },
    {
      "ingredientId": "caramel_flavor",
      "amount": 10
    },
    {
      "ingredientId": "milk",
      "amount": 300
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 10
    },
    {
      "ingredientId": "vanilla_powder",
      "amount": 1
    }
  ],
  "white_hot_chocolate_small": [
    {
      "ingredientId": "white_chocolate_sauce",
      "amount": 45
    },
    {
      "ingredientId": "caramel_flavor",
      "amount": 10
    },
    {
      "ingredientId": "milk",
      "amount": 240
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 10
    },
    {
      "ingredientId": "vanilla_powder",
      "amount": 1
    }
  ],
  "white_mocha_medium": [
    {
      "ingredientId": "white_chocolate",
      "amount": 60
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    },
    {
      "ingredientId": "milk_9oz",
      "amount": 270
    }
  ],
  "white_mocha_small": [
    {
      "ingredientId": "white_chocolate",
      "amount": 45
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    },
    {
      "ingredientId": "milk_6oz",
      "amount": 200
    }
  ],
  "dragon_fruit_mojito_one": [
    {
      "ingredientId": "soda_water",
      "amount": 50
    }
  ],
  "mango_passion_froit_mojito_one": [
    {
      "ingredientId": "soda_water",
      "amount": 50
    }
  ],
  "strawberry_mojito_one": [
    {
      "ingredientId": "soda_water",
      "amount": 50
    }
  ],
  "water_melon_mojito_one": [
    {
      "ingredientId": "soda_water",
      "amount": 50
    }
  ],
  "super_berry_one": [
    {
      "ingredientId": "green_tea_base",
      "amount": 100
    },
    {
      "ingredientId": "raspberry_puree",
      "amount": 30
    },
    {
      "ingredientId": "mixed_berries_puree",
      "amount": 30
    },
    {
      "ingredientId": "blueberry_puree",
      "amount": 15
    },
    {
      "ingredientId": "non_dairy_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "garnish_blueberry_puree_the_inside",
      "amount": 5
    }
  ],
  "apple_lime_one": [
    {
      "ingredientId": "green_tea_base",
      "amount": 150
    },
    {
      "ingredientId": "green_apple_puree",
      "amount": 45
    },
    {
      "ingredientId": "lime_puree",
      "amount": 30
    },
    {
      "ingredientId": "non_dairy_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    }
  ],
  "la_vina_cream_one": [
    {
      "ingredientId": "milk",
      "amount": 150
    },
    {
      "ingredientId": "raspberry_puree",
      "amount": 45
    },
    {
      "ingredientId": "vanilla_syrup",
      "amount": 10
    },
    {
      "ingredientId": "vanilla_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    },
    {
      "ingredientId": "raspberry_puree",
      "amount": 5
    }
  ],
  "mango_passion_fruit_one": [
    {
      "ingredientId": "green_tea",
      "amount": 150
    },
    {
      "ingredientId": "mango_puree",
      "amount": 45
    },
    {
      "ingredientId": "passion_fruit_puree",
      "amount": 15
    },
    {
      "ingredientId": "ice",
      "amount": 8
    }
  ],
  "mix_passion_one": [
    {
      "ingredientId": "passion_fruit",
      "amount": 45
    },
    {
      "ingredientId": "peach",
      "amount": 15
    },
    {
      "ingredientId": "vanilla_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream_and_peach_puree",
      "amount": 15
    }
  ],
  "yellow_shine_one": [
    {
      "ingredientId": "green_tea_base",
      "amount": 150
    },
    {
      "ingredientId": "peach_puree",
      "amount": 45
    },
    {
      "ingredientId": "mango_puree",
      "amount": 15
    },
    {
      "ingredientId": "non_dairy_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    }
  ],
  "yogurt_forest_one": [
    {
      "ingredientId": "milk",
      "amount": 150
    },
    {
      "ingredientId": "yogurt_powder",
      "amount": 50
    },
    {
      "ingredientId": "blueberry_puree",
      "amount": 30
    },
    {
      "ingredientId": "strawberry_puree",
      "amount": 30
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    },
    {
      "ingredientId": "blueberry_puree",
      "amount": 5
    }
  ],
  "hot_wind_medium": [
    {
      "ingredientId": "milk",
      "amount": 240
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 90
    },
    {
      "ingredientId": "salted_caramel_flavor",
      "amount": 30
    }
  ],
  "hot_wind_small": [
    {
      "ingredientId": "milk",
      "amount": 200
    },
    {
      "ingredientId": "espresso_shot",
      "amount": 60
    },
    {
      "ingredientId": "salted_caramel_flavor",
      "amount": 20
    }
  ],
  "red_joy_one": [
    {
      "ingredientId": "strawberry_puree",
      "amount": 30
    },
    {
      "ingredientId": "water_melon_syrup",
      "amount": 20
    },
    {
      "ingredientId": "lemon_rancho_syrup",
      "amount": 30
    },
    {
      "ingredientId": "vanilla_syrup",
      "amount": 10
    },
    {
      "ingredientId": "green_tea_base",
      "amount": 180
    }
  ],
  "toffee_wonder_one": [
    {
      "ingredientId": "coffee_liquid",
      "amount": 150
    },
    {
      "ingredientId": "toffee_powder",
      "amount": 25
    },
    {
      "ingredientId": "dulce_di_leche",
      "amount": 16
    },
    {
      "ingredientId": "coffee_base_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    },
    {
      "ingredientId": "caramel_drizzle",
      "amount": 8
    }
  ],
  "tropical_waves_one": [
    {
      "ingredientId": "pineapple_puree",
      "amount": 30
    },
    {
      "ingredientId": "terinage_puree",
      "amount": 30
    },
    {
      "ingredientId": "lemon_rancho",
      "amount": 20
    },
    {
      "ingredientId": "caramel_syrup",
      "amount": 10
    },
    {
      "ingredientId": "green_tea_base",
      "amount": 180
    }
  ],
  "white_land_one": [
    {
      "ingredientId": "milk",
      "amount": 150
    },
    {
      "ingredientId": "salted_caramel_sauce",
      "amount": 30
    },
    {
      "ingredientId": "macadamia_syrup",
      "amount": 16
    },
    {
      "ingredientId": "vanilla_powder",
      "amount": 25
    },
    {
      "ingredientId": "ice",
      "amount": 8
    },
    {
      "ingredientId": "topping_whipped_cream",
      "amount": 15
    }
  ],
  "chai_tea_medium": [
    {
      "ingredientId": "chai_tea_syrup",
      "amount": 30
    },
    {
      "ingredientId": "chai_tea_powder",
      "amount": 50
    },
    {
      "ingredientId": "milk",
      "amount": 300
    }
  ],
  "chai_tea_small": [
    {
      "ingredientId": "chai_tea_syrup",
      "amount": 20
    },
    {
      "ingredientId": "chai_tea_powder",
      "amount": 25
    },
    {
      "ingredientId": "milk",
      "amount": 240
    }
  ],
  "creamy_matcha_medium": [
    {
      "ingredientId": "pure_matcha_powder",
      "amount": 5
    },
    {
      "ingredientId": "vanilla_flavor",
      "amount": 20
    },
    {
      "ingredientId": "milk",
      "amount": 300
    }
  ],
  "creamy_matcha_small": [
    {
      "ingredientId": "pure_matcha_powder",
      "amount": 3
    },
    {
      "ingredientId": "milk",
      "amount": 240
    },
    {
      "ingredientId": "vanilla_flavor",
      "amount": 10
    }
  ],
  "pure_matcha_medium": [
    {
      "ingredientId": "pure_matcha_powder",
      "amount": 5
    },
    {
      "ingredientId": "milk",
      "amount": 380
    }
  ],
  "pure_matcha_small": [
    {
      "ingredientId": "pure_matcha_powder",
      "amount": 3
    },
    {
      "ingredientId": "milk",
      "amount": 300
    }
  ]
};
