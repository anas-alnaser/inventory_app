import type { Restaurant } from '@/types/entities';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  taxRate?: number; // Default 0.16 if not specified
  isTaxExempt?: boolean; // Default false
}

export interface RestaurantSettings {
  taxNumber: string;
  serviceChargeRate: number; // e.g., 0.10 for 10%
  name: string;
}

export interface InvoiceTotals {
  subtotal: number;
  serviceChargeAmount: number;
  taxableAmount: number;
  taxAmount: number;
  grandTotal: number;
}

/**
 * Calculate invoice totals according to Jordanian tax regulations (ISTD)
 * 
 * Calculation logic:
 * 1. Item Total = Price × Quantity
 * 2. Service Charge = Item Total × Service Rate
 * 3. Taxable Amount = Item Total + Service Charge
 * 4. Tax = Taxable Amount × Tax Rate (16% default, or item-specific)
 * 5. Grand Total = Taxable Amount + Tax
 * 
 * Rounding: Calculate to 3 decimal places (ISTD compliance), display to 2 decimal places
 */
export function calculateInvoiceTotals(
  cartItems: CartItem[],
  restaurantSettings: RestaurantSettings
): InvoiceTotals {
  let subtotal = 0;
  let serviceChargeAmount = 0;
  let taxableAmount = 0;
  let taxAmount = 0;
  
  // Calculate per item: Item Total, Service Charge, Taxable Amount, Tax
  for (const item of cartItems) {
    // Step 1: Item Total = Price × Quantity
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    
    // Step 2: Service Charge = Item Total × Service Rate
    const itemServiceCharge = Math.round(itemTotal * restaurantSettings.serviceChargeRate * 1000) / 1000;
    serviceChargeAmount += itemServiceCharge;
    
    // Step 3: Taxable Amount = Item Total + Service Charge
    const itemTaxableAmount = Math.round((itemTotal + itemServiceCharge) * 1000) / 1000;
    
    // Step 4: Tax = Taxable Amount × Tax Rate (only for non-exempt items)
    if (!item.isTaxExempt) {
      const taxRate = item.taxRate ?? 0.16;
      const itemTax = Math.round(itemTaxableAmount * taxRate * 1000) / 1000;
      taxAmount += itemTax;
      taxableAmount += itemTaxableAmount;
    }
  }
  
  // Round all amounts to 3 decimal places (ISTD compliance)
  subtotal = Math.round(subtotal * 1000) / 1000;
  serviceChargeAmount = Math.round(serviceChargeAmount * 1000) / 1000;
  taxableAmount = Math.round(taxableAmount * 1000) / 1000;
  taxAmount = Math.round(taxAmount * 1000) / 1000;
  
  // Step 5: Grand Total = Subtotal + Service Charge + Tax
  const grandTotal = Math.round((subtotal + serviceChargeAmount + taxAmount) * 1000) / 1000;
  
  return {
    subtotal,
    serviceChargeAmount,
    taxableAmount,
    taxAmount,
    grandTotal,
  };
}

/**
 * Format a number for display (2 decimal places) while maintaining 3 decimal precision internally
 */
export function formatCurrency(value: number): string {
  return value.toFixed(2);
}

