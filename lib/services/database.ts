import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
  query,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  branchesCollection,
  usersCollection,
  suppliersCollection,
  ingredientsCollection,
  menuItemsCollection,
  purchaseOrdersCollection,
  purchaseOrderItemsCollection,
  ingredientStockCollection,
  stockLogsCollection,
  menuItemIngredientsCollection,
  posOrdersCollection,
  posOrderItemsCollection,
  paymentsCollection,
  forecastsCollection,
  wastePredictionsCollection,
  anomaliesCollection,
  visionSnapshotsCollection,
  analyticsCacheCollection,
  systemLogsCollection,
  restaurantsCollection,
  invoicesCollection,
} from '@/lib/firestore';

/**
 * Delete all documents from a collection in batches
 */
async function deleteCollection(collectionRef: any, batchSize: number = 500) {
  let deletedCount = 0;
  let hasMore = true;

  while (hasMore) {
    // Get a batch of documents
    const snapshot = await getDocs(query(collectionRef, limit(batchSize)));
    
    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    // Delete in batches
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
    deletedCount += snapshot.docs.length;

    // If we got fewer documents than the limit, we're done
    if (snapshot.docs.length < batchSize) {
      hasMore = false;
    }
  }

  return deletedCount;
}

/**
 * Delete all subcollections for a parent document
 */
async function deleteSubcollections(
  parentCollection: any,
  subcollectionName: string,
  batchSize: number = 500
) {
  let totalDeleted = 0;
  let hasMore = true;
  const limitSize = 100; // Limit parent documents to process at once
  
  while (hasMore) {
    // Get a batch of parent documents
    const parentSnapshot = await getDocs(query(parentCollection, limit(limitSize)));
    
    if (parentSnapshot.empty) {
      hasMore = false;
      break;
    }
    
    // Delete subcollections for each parent document
    for (const parentDoc of parentSnapshot.docs) {
      const subcollectionRef = collection(parentDoc.ref, subcollectionName);
      const deleted = await deleteCollection(subcollectionRef, batchSize);
      totalDeleted += deleted;
    }

    // If we got fewer documents than the limit, we're done
    if (parentSnapshot.docs.length < limitSize) {
      hasMore = false;
    }
  }

  return totalDeleted;
}

/**
 * Delete all data from Firestore database
 * WARNING: This is a destructive operation that cannot be undone!
 */
export async function deleteAllDatabaseData(): Promise<{
  success: boolean;
  deletedCounts: Record<string, number>;
  error?: string;
}> {
  const deletedCounts: Record<string, number> = {};

  try {
    // Delete subcollections first (they depend on parent documents)
    console.log('Deleting subcollections...');
    
    // Delete purchase_order_items subcollection
    try {
      const deleted = await deleteSubcollections(
        purchaseOrdersCollection,
        'purchase_order_items'
      );
      deletedCounts['purchase_order_items'] = deleted;
    } catch (error) {
      console.warn('Error deleting purchase_order_items:', error);
    }

    // Delete pos_order_items subcollection
    try {
      const deleted = await deleteSubcollections(
        posOrdersCollection,
        'pos_order_items'
      );
      deletedCounts['pos_order_items'] = deleted;
    } catch (error) {
      console.warn('Error deleting pos_order_items:', error);
    }

    // Delete payments subcollection
    try {
      const deleted = await deleteSubcollections(
        posOrdersCollection,
        'payments'
      );
      deletedCounts['payments'] = deleted;
    } catch (error) {
      console.warn('Error deleting payments:', error);
    }

    // Delete main collections
    console.log('Deleting main collections...');
    
    const collections = [
      { name: 'invoices', ref: invoicesCollection },
      { name: 'restaurants', ref: restaurantsCollection },
      { name: 'system_logs', ref: systemLogsCollection },
      { name: 'analytics_cache', ref: analyticsCacheCollection },
      { name: 'vision_snapshots', ref: visionSnapshotsCollection },
      { name: 'anomalies', ref: anomaliesCollection },
      { name: 'waste_predictions', ref: wastePredictionsCollection },
      { name: 'forecasts', ref: forecastsCollection },
      { name: 'payments', ref: paymentsCollection },
      { name: 'pos_order_items', ref: posOrderItemsCollection },
      { name: 'pos_orders', ref: posOrdersCollection },
      { name: 'purchase_order_items', ref: purchaseOrderItemsCollection },
      { name: 'purchase_orders', ref: purchaseOrdersCollection },
      { name: 'menu_item_ingredients', ref: menuItemIngredientsCollection },
      { name: 'stock_logs', ref: stockLogsCollection },
      { name: 'ingredient_stock', ref: ingredientStockCollection },
      { name: 'menu_items', ref: menuItemsCollection },
      { name: 'ingredients', ref: ingredientsCollection },
      { name: 'suppliers', ref: suppliersCollection },
      { name: 'branches', ref: branchesCollection },
      // Note: We don't delete users collection to preserve authentication
      // { name: 'users', ref: usersCollection },
    ];

    for (const { name, ref } of collections) {
      try {
        console.log(`Deleting ${name}...`);
        const deleted = await deleteCollection(ref);
        deletedCounts[name] = deleted;
        console.log(`Deleted ${deleted} documents from ${name}`);
      } catch (error) {
        console.error(`Error deleting ${name}:`, error);
        deletedCounts[name] = 0;
      }
    }

    console.log('Database deletion complete');
    return {
      success: true,
      deletedCounts,
    };
  } catch (error) {
    console.error('Error deleting database:', error);
    return {
      success: false,
      deletedCounts,
      error: error instanceof Error ? error.message : 'Failed to delete database',
    };
  }
}

