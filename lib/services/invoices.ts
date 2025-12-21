import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  runTransaction,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { ingredientsCollection } from '@/lib/firestore';
import { db } from '../firebase';
import type { Invoice, InvoiceItem, MenuItem, IngredientStock } from '@/types/entities';
import { invoicesCollection, ingredientStockCollection, stockLogsCollection, menuItemsCollection } from '@/lib/firestore';
import { calculateInvoiceTotals, type CartItem } from './tax';
import { incrementInvoiceSequence, getRestaurantByBranch, getDefaultRestaurantSettings } from './restaurants';
import { toBaseUnit } from '../utils/unit-conversion';

export interface SubmitInvoiceData {
  cartItems: CartItem[];
  paymentMethod: 'Cash' | 'Visa' | 'CliQ';
  branchId: string;
  cashierId: string;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    name?: string;
  };
}

export interface SubmitInvoiceResult {
  success: boolean;
  invoice?: Invoice;
  error?: string;
}

/**
 * Generate invoice number in format: INV-YYYY-XXXX
 */
function generateInvoiceNumber(year: number, sequence: number): string {
  return `INV-${year}-${sequence.toString().padStart(4, '0')}`;
}

/**
 * Generate QR code string for Jordanian E-Invoicing compliance
 * Format: {Seller Name}|{Tax ID}|{DateTime}|{Total w/ Tax}|{Tax Amount}
 */
function generateQRCodeString(
  restaurantName: string,
  taxNumber: string,
  dateTime: string,
  grandTotal: number,
  taxAmount: number
): string {
  return `${restaurantName}|${taxNumber}|${dateTime}|${grandTotal.toFixed(2)}|${taxAmount.toFixed(2)}`;
}

/**
 * Deduct inventory for a menu item based on its recipe
 */
async function deductInventoryForMenuItem(
  menuItem: MenuItem,
  quantity: number,
  branchId: string,
  userId: string,
  batch: any
): Promise<void> {
  if (!menuItem.recipe || menuItem.recipe.length === 0) {
    return; // No recipe, nothing to deduct
  }

  for (const recipeItem of menuItem.recipe) {
    // Find stock record for this ingredient and branch
    const stockQuery = query(
      ingredientStockCollection,
      where('ingredient_id', '==', recipeItem.ingredientId),
      where('branch_id', '==', branchId),
      limit(1)
    );

    // Note: We can't use getDocs inside a transaction, so we'll need to handle this differently
    // For now, we'll use a batch operation which is more flexible

    // Calculate total quantity needed (recipe quantity × menu item quantity)
    const totalQuantityNeeded = recipeItem.quantity * quantity;

    // Convert to base unit if needed
    const baseQuantityNeeded = toBaseUnit(totalQuantityNeeded, recipeItem.unit);

    // We'll handle stock deduction in a separate step after the transaction
    // Store this for later processing
    (batch as any)._inventoryDeductions = (batch as any)._inventoryDeductions || [];
    (batch as any)._inventoryDeductions.push({
      ingredientId: recipeItem.ingredientId,
      branchId,
      quantity: baseQuantityNeeded,
      userId,
    });
  }
}

/**
 * Submit invoice and deduct inventory
 * Uses Firestore transaction for atomicity
 */
export async function submitInvoice(
  data: SubmitInvoiceData
): Promise<SubmitInvoiceResult> {
  try {
    // Step 1: Get restaurant settings
    let restaurant = await getRestaurantByBranch(data.branchId);
    if (!restaurant) {
      restaurant = getDefaultRestaurantSettings(data.branchId);
    }

    // Step 2: Get menu items to access recipes and fetch ingredients for names
    const menuItemsMap = new Map<string, MenuItem>();
    const ingredientsMap = new Map<string, { id: string; name: string }>();

    for (const cartItem of data.cartItems) {
      const menuItemDoc = await getDoc(doc(menuItemsCollection, cartItem.menuItemId));
      if (menuItemDoc.exists()) {
        const menuItem = {
          id: menuItemDoc.id,
          ...menuItemDoc.data(),
        } as MenuItem;

        menuItemsMap.set(cartItem.menuItemId, menuItem);

        // Fetch ingredient names if recipe exists
        if (menuItem.recipe) {
          for (const recipeItem of menuItem.recipe) {
            if (!ingredientsMap.has(recipeItem.ingredientId)) {
              // Try to get ingredient name from recipe first
              if (recipeItem.ingredientName) {
                ingredientsMap.set(recipeItem.ingredientId, {
                  id: recipeItem.ingredientId,
                  name: recipeItem.ingredientName,
                });
              } else {
                // Fallback: fetch ingredient document
                try {
                  const ingredientDoc = await getDoc(doc(ingredientsCollection, recipeItem.ingredientId));
                  if (ingredientDoc.exists()) {
                    const ingredientData = ingredientDoc.data();
                    ingredientsMap.set(recipeItem.ingredientId, {
                      id: recipeItem.ingredientId,
                      name: ingredientData.name || 'Unknown Ingredient',
                    });
                  }
                } catch (err) {
                  // If we can't fetch, use a placeholder
                  ingredientsMap.set(recipeItem.ingredientId, {
                    id: recipeItem.ingredientId,
                    name: 'Unknown Ingredient',
                  });
                }
              }
            }
          }
        }
      }
    }

    // Step 3: Calculate totals
    const baseTotals = calculateInvoiceTotals(data.cartItems, {
      taxNumber: restaurant.taxNumber,
      serviceChargeRate: restaurant.serviceChargeRate,
      name: restaurant.name,
    });

    // Apply discount if present
    let discountAmount = 0;
    if (data.discount) {
      if (data.discount.type === 'percentage') {
        discountAmount = baseTotals.subtotal * (data.discount.value / 100);
      } else {
        discountAmount = data.discount.value;
      }
    }

    // Recalculate totals with discount
    const afterDiscount = baseTotals.subtotal - discountAmount;
    const adjustedTaxAmount = afterDiscount * 0.16; // 16% tax on discounted amount
    const adjustedServiceCharge = afterDiscount * (restaurant.serviceChargeRate || 0);
    const grandTotal = afterDiscount + adjustedTaxAmount + adjustedServiceCharge;

    const totals = {
      subtotal: baseTotals.subtotal,
      discountAmount,
      taxAmount: adjustedTaxAmount,
      serviceChargeAmount: adjustedServiceCharge,
      grandTotal,
    };

    // Step 4: Generate invoice number and QR code
    const now = new Date();
    const year = now.getFullYear();

    // Handle sequence increment - if restaurant doesn't exist, use a simple counter
    let sequence: number;
    if (restaurant.id === 'default') {
      // For default restaurant, use timestamp-based sequence
      sequence = Math.floor(Date.now() / 1000) % 10000;
    } else {
      sequence = await incrementInvoiceSequence(restaurant.id);
    }

    const invoiceNumber = generateInvoiceNumber(year, sequence);

    const dateTimeString = now.toISOString().replace('T', ' ').substring(0, 19);
    const qrCodeString = generateQRCodeString(
      restaurant.name,
      restaurant.taxNumber,
      dateTimeString,
      totals.grandTotal,
      totals.taxAmount
    );

    // Step 5: Create invoice items
    const invoiceItems: InvoiceItem[] = data.cartItems.map((item) => ({
      menu_item_id: item.menuItemId,
      menu_item_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      line_total: item.price * item.quantity,
      taxRate: item.taxRate,
      isTaxExempt: item.isTaxExempt,
    }));

    // Step 6: Create invoice document
    // Build base invoice data without optional discount fields (Firestore doesn't allow undefined)
    const invoiceData: Omit<Invoice, 'id'> = {
      invoiceNumber,
      branch_id: data.branchId,
      cashier_id: data.cashierId,
      items: invoiceItems,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      // Only include discount fields if discount was applied
      ...(data.discount ? {
        discountType: data.discount.type,
        discountValue: data.discount.value,
        discountName: data.discount.name,
      } : {}),
      serviceChargeAmount: totals.serviceChargeAmount,
      taxAmount: totals.taxAmount,
      grandTotal: totals.grandTotal,
      paymentMethod: data.paymentMethod,
      qrCodeString,
      created_at: Timestamp.now(),
    };

    // Step 7: Pre-fetch stock records for inventory deduction
    const stockRecords = new Map<string, { docId: string; stock: IngredientStock }>();
    const missingStockIngredients = new Set<string>();

    for (const cartItem of data.cartItems) {
      const menuItem = menuItemsMap.get(cartItem.menuItemId);
      if (!menuItem || !menuItem.recipe) {
        continue;
      }

      for (const recipeItem of menuItem.recipe) {
        if (stockRecords.has(recipeItem.ingredientId)) {
          continue; // Already fetched
        }

        // Find stock record
        const stockQuery = query(
          ingredientStockCollection,
          where('ingredient_id', '==', recipeItem.ingredientId),
          where('branch_id', '==', data.branchId),
          limit(1)
        );

        const stockSnapshot = await getDocs(stockQuery);
        if (!stockSnapshot.empty) {
          const stockDoc = stockSnapshot.docs[0];
          stockRecords.set(recipeItem.ingredientId, {
            docId: stockDoc.id,
            stock: {
              id: stockDoc.id,
              ...stockDoc.data(),
            } as IngredientStock,
          });
        } else {
          // Mark as missing - we'll create it in the transaction
          missingStockIngredients.add(recipeItem.ingredientId);
          // Create a placeholder entry with a new doc ID
          const newStockRef = doc(ingredientStockCollection);
          stockRecords.set(recipeItem.ingredientId, {
            docId: newStockRef.id,
            stock: {
              id: newStockRef.id,
              branch_id: data.branchId,
              ingredient_id: recipeItem.ingredientId,
              quantity: 0,
              expiry_date: Timestamp.now(),
              last_updated: Timestamp.now(),
            } as IngredientStock,
          });
        }
      }
    }

    // Step 8: Prepare stock updates (calculate all deductions first)
    const stockUpdates = new Map<string, {
      stockRef: any;
      currentQuantity: number;
      deduction: number;
      isNew: boolean;
      ingredientId: string;
    }>();

    for (const cartItem of data.cartItems) {
      const menuItem = menuItemsMap.get(cartItem.menuItemId);
      if (!menuItem || !menuItem.recipe) {
        continue;
      }

      for (const recipeItem of menuItem.recipe) {
        const stockRecord = stockRecords.get(recipeItem.ingredientId);
        if (!stockRecord) {
          continue;
        }

        // Calculate deduction
        const totalQuantityNeeded = recipeItem.quantity * cartItem.quantity;
        const baseQuantityNeeded = toBaseUnit(totalQuantityNeeded, recipeItem.unit);

        const stockRef = doc(ingredientStockCollection, stockRecord.docId);
        const isNewStock = missingStockIngredients.has(recipeItem.ingredientId);

        // Accumulate deductions for the same ingredient (if used in multiple menu items)
        if (stockUpdates.has(recipeItem.ingredientId)) {
          const existing = stockUpdates.get(recipeItem.ingredientId)!;
          existing.deduction += baseQuantityNeeded;
        } else {
          stockUpdates.set(recipeItem.ingredientId, {
            stockRef,
            currentQuantity: stockRecord.stock?.quantity || 0,
            deduction: baseQuantityNeeded,
            isNew: isNewStock,
            ingredientId: recipeItem.ingredientId,
          });
        }
      }
    }

    // Step 9: Use transaction - ALL READS FIRST, THEN ALL WRITES
    const invoiceId = await runTransaction(db, async (transaction) => {
      // PHASE 1: ALL READS FIRST
      const stockDocs = new Map<string, any>();
      for (const [ingredientId, update] of stockUpdates) {
        const stockDoc = await transaction.get(update.stockRef);
        stockDocs.set(ingredientId, {
          exists: stockDoc.exists(),
          data: stockDoc.exists() ? stockDoc.data() : null,
          update,
        });
      }

      // PHASE 2: ALL WRITES (invoice, stock updates, logs)
      // Create invoice
      const invoiceRef = doc(invoicesCollection);
      transaction.set(invoiceRef, {
        ...invoiceData,
        created_at: serverTimestamp(),
      });

      // Update/create stock records
      for (const [ingredientId, stockInfo] of stockDocs) {
        const { exists, data: stockData, update } = stockInfo;

        if (exists && stockData) {
          // Stock record exists, update it
          const currentQuantity = stockData.quantity || 0;
          transaction.update(update.stockRef, {
            quantity: currentQuantity - update.deduction,
            last_updated: serverTimestamp(),
          });
        } else {
          // Create new stock record with negative quantity (deducting from 0)
          transaction.set(update.stockRef, {
            ingredient_id: update.ingredientId,
            branch_id: data.branchId, // SubmitInvoiceData.branchId
            quantity: -update.deduction,
            expiry_date: serverTimestamp(),
            last_updated: serverTimestamp(),
          });
        }

        // Create stock log
        const logRef = doc(stockLogsCollection);
        transaction.set(logRef, {
          ingredient_id: update.ingredientId,
          branch_id: data.branchId, // SubmitInvoiceData.branchId
          user_id: data.cashierId, // SubmitInvoiceData.cashierId
          change_amount: -update.deduction,
          reason: 'sale',
          notes: `Invoice ${invoiceNumber}`,
          created_at: serverTimestamp(),
        });
      }

      return invoiceRef.id;
    });

    // Step 9: Return invoice
    const invoiceDoc = await getDoc(doc(invoicesCollection, invoiceId));
    if (!invoiceDoc.exists()) {
      throw new Error('Invoice was not created');
    }

    const invoice: Invoice = {
      id: invoiceDoc.id,
      ...invoiceDoc.data(),
    } as Invoice;

    return {
      success: true,
      invoice,
    };
  } catch (error: any) {
    console.error('Error submitting invoice:', error);
    console.error('Error code:', error?.code);
    console.error('Error details:', error?.details);

    // Provide more specific error messages
    let errorMessage = 'Failed to submit invoice';
    if (error?.code === 'permission-denied') {
      errorMessage = 'Permission denied. Please check your user role and Firestore security rules.';
    } else if (error?.code === 'unavailable') {
      errorMessage = 'Firestore is temporarily unavailable. Please try again.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

