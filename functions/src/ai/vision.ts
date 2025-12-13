import {
  db,
  collections,
  Timestamp,
} from '../config/firestore';
import { processInvoiceImage, analyzeStockImage } from '../config/gemini';

/**
 * Process an invoice image and return extracted data
 */
export async function processInvoice(
  base64Image: string,
  mimeType: string,
  userId: string
): Promise<{
  success: boolean;
  data?: {
    items: Array<{
      name: string;
      quantity: number;
      unit: string;
      unit_price: number;
      matched_ingredient_id?: string;
    }>;
    supplier_name?: string;
    invoice_number?: string;
    total?: number;
    date?: string;
  };
  error?: string;
}> {
  // Process image with Gemini Vision
  const result = await processInvoiceImage(base64Image, mimeType);

  if (!result.success || !result.data) {
    return result;
  }

  // Try to match extracted items to existing ingredients
  const ingredientsSnapshot = await collections.ingredients.get();
  const ingredients = ingredientsSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name.toLowerCase(),
    originalName: doc.data().name,
  }));

  const matchedItems = result.data.items.map((item) => {
    const itemNameLower = item.name.toLowerCase();

    // Try to find a matching ingredient
    const match = ingredients.find(
      (ing) =>
        ing.name.includes(itemNameLower) ||
        itemNameLower.includes(ing.name) ||
        // Fuzzy match: check if words overlap
        itemNameLower.split(' ').some((word) => ing.name.includes(word))
    );

    return {
      ...item,
      matched_ingredient_id: match?.id,
      matched_ingredient_name: match?.originalName,
    };
  });

  // Log the vision snapshot for audit
  await collections.visionSnapshots.add({
    type: 'invoice_ocr',
    user_id: userId,
    extracted_data: result.data,
    matched_items: matchedItems.filter((i) => i.matched_ingredient_id),
    confidence: 85, // Base confidence for successful extraction
    created_at: Timestamp.now(),
  });

  return {
    success: true,
    data: {
      ...result.data,
      items: matchedItems,
    },
  };
}

/**
 * Create a draft purchase order from invoice data
 */
export async function createPurchaseOrderFromInvoice(
  invoiceData: {
    items: Array<{
      name: string;
      quantity: number;
      unit: string;
      unit_price: number;
      matched_ingredient_id?: string;
    }>;
    supplier_name?: string;
    invoice_number?: string;
    total?: number;
    date?: string;
  },
  supplierId: string,
  userId: string
): Promise<{ success: boolean; purchaseOrderId?: string; error?: string }> {
  try {
    // Filter only matched items
    const matchedItems = invoiceData.items.filter(
      (item) => item.matched_ingredient_id
    );

    if (matchedItems.length === 0) {
      return {
        success: false,
        error: 'No items could be matched to existing ingredients',
      };
    }

    // Get supplier info
    const supplierDoc = await collections.suppliers.doc(supplierId).get();
    if (!supplierDoc.exists) {
      return { success: false, error: 'Supplier not found' };
    }
    const supplier = supplierDoc.data()!;

    // Generate PO number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const poNumber = `PO-${dateStr}-${randomSuffix}`;

    // Create purchase order items
    const poItems = matchedItems.map((item) => ({
      ingredient_id: item.matched_ingredient_id!,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      cost_per_unit: item.unit_price,
      total_cost: item.quantity * item.unit_price,
    }));

    const totalCost = poItems.reduce((sum, item) => sum + item.total_cost, 0);

    // Create the purchase order
    const poRef = await collections.purchaseOrders.add({
      po_number: poNumber,
      supplier_id: supplierId,
      supplier_name: supplier.name,
      items: poItems,
      total_cost: totalCost,
      status: 'draft',
      expected_delivery_date: Timestamp.fromDate(
        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      ),
      source: 'invoice_ocr',
      original_invoice_number: invoiceData.invoice_number,
      created_by: userId,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    return {
      success: true,
      purchaseOrderId: poRef.id,
    };
  } catch (error) {
    console.error('Error creating PO from invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create purchase order',
    };
  }
}

/**
 * Perform visual stock taking from an image
 */
export async function performVisualStockTake(
  base64Image: string,
  mimeType: string,
  userId: string,
  notes?: string
): Promise<{
  success: boolean;
  data?: Array<{
    item_name: string;
    estimated_quantity: number;
    unit: string;
    fill_level_percent?: number;
    confidence: number;
    matched_ingredient_id?: string;
    matched_ingredient_name?: string;
    current_stock?: number;
    difference?: number;
  }>;
  error?: string;
}> {
  // Get known ingredient names for better matching
  const ingredientsSnapshot = await collections.ingredients.get();
  const ingredients = ingredientsSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    unit: doc.data().unit,
  }));

  const knownItems = ingredients.map((i) => i.name);

  // Analyze image with Gemini Vision
  const result = await analyzeStockImage(base64Image, mimeType, knownItems);

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error || 'Failed to analyze image',
    };
  }

  // Match detected items to ingredients and get current stock
  const enrichedData = await Promise.all(
    result.data.map(async (item) => {
      const itemNameLower = item.item_name.toLowerCase();

      // Find matching ingredient
      const match = ingredients.find(
        (ing) =>
          ing.name.toLowerCase().includes(itemNameLower) ||
          itemNameLower.includes(ing.name.toLowerCase())
      );

      let currentStock: number | undefined;
      let difference: number | undefined;

      if (match) {
        // Get current stock for this ingredient
        const stockSnapshot = await collections.ingredientStock
          .where('ingredient_id', '==', match.id)
          .limit(1)
          .get();

        if (!stockSnapshot.empty) {
          currentStock = stockSnapshot.docs[0].data().quantity;
          difference = item.estimated_quantity - (currentStock ?? 0);
        }
      }

      return {
        ...item,
        matched_ingredient_id: match?.id,
        matched_ingredient_name: match?.name,
        current_stock: currentStock,
        difference,
      };
    })
  );

  // Log the vision snapshot
  await collections.visionSnapshots.add({
    type: 'visual_stock_take',
    user_id: userId,
    detected_items: enrichedData,
    notes,
    confidence:
      enrichedData.length > 0
        ? enrichedData.reduce((sum, i) => sum + i.confidence, 0) /
          enrichedData.length
        : 0,
    created_at: Timestamp.now(),
  });

  return {
    success: true,
    data: enrichedData,
  };
}

/**
 * Update stock based on visual stock take results
 */
export async function applyVisualStockTakeResults(
  items: Array<{
    matched_ingredient_id: string;
    estimated_quantity: number;
    unit: string;
  }>,
  userId: string
): Promise<{ success: boolean; updatedCount: number; error?: string }> {
  try {
    const batch = db.batch();
    let updatedCount = 0;

    for (const item of items) {
      if (!item.matched_ingredient_id) continue;

      // Find existing stock record
      const stockSnapshot = await collections.ingredientStock
        .where('ingredient_id', '==', item.matched_ingredient_id)
        .limit(1)
        .get();

      if (stockSnapshot.empty) {
        // Create new stock record
        const newStockRef = collections.ingredientStock.doc();
        batch.set(newStockRef, {
          ingredient_id: item.matched_ingredient_id,
          quantity: item.estimated_quantity,
          last_updated: Timestamp.now(),
        });
      } else {
        // Update existing stock
        const stockDoc = stockSnapshot.docs[0];
        const currentQuantity = stockDoc.data().quantity;
        const adjustment = item.estimated_quantity - currentQuantity;

        batch.update(stockDoc.ref, {
          quantity: item.estimated_quantity,
          last_updated: Timestamp.now(),
        });

        // Create stock log for the adjustment
        if (Math.abs(adjustment) > 0.01) {
          const logRef = collections.stockLogs.doc();
          batch.set(logRef, {
            ingredient_id: item.matched_ingredient_id,
            user_id: userId,
            change_amount: adjustment,
            reason: 'adjustment',
            notes: 'Visual stock take adjustment',
            created_at: Timestamp.now(),
          });
        }
      }

      updatedCount++;
    }

    await batch.commit();

    return { success: true, updatedCount };
  } catch (error) {
    console.error('Error applying visual stock take:', error);
    return {
      success: false,
      updatedCount: 0,
      error: error instanceof Error ? error.message : 'Failed to apply stock updates',
    };
  }
}

