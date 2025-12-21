import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  getDoc,
  updateDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Restaurant } from '@/types/entities';
import { restaurantsCollection } from '@/lib/firestore';

/**
 * Get restaurant settings by branch ID
 * If no restaurant exists, returns default settings
 */
export async function getRestaurantByBranch(branchId: string): Promise<Restaurant | null> {
  try {
    const q = query(
      restaurantsCollection,
      where('branch_id', '==', branchId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Restaurant;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return null;
  }
}

/**
 * Get restaurant by ID
 */
export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  try {
    const docRef = doc(restaurantsCollection, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Restaurant;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return null;
  }
}

/**
 * Get default restaurant settings (fallback)
 * Requires branchId for data isolation
 */
export function getDefaultRestaurantSettings(branchId: string): Restaurant {
  if (!branchId) {
    throw new Error('branchId is required for data isolation');
  }
  return {
    id: 'default',
    name: 'Restaurant',
    taxNumber: '000000000',
    serviceChargeRate: 0.10, // 10%
    invoiceSerialSequence: 0,
    branch_id: branchId,
    created_at: new Date().toISOString(),
  };
}

/**
 * Increment invoice serial sequence atomically
 */
export async function incrementInvoiceSequence(restaurantId: string): Promise<number> {
  const restaurantRef = doc(restaurantsCollection, restaurantId);
  
  return await runTransaction(db, async (transaction) => {
    const restaurantDoc = await transaction.get(restaurantRef);
    
    if (!restaurantDoc.exists()) {
      throw new Error('Restaurant not found');
    }
    
    const currentSequence = restaurantDoc.data().invoiceSerialSequence || 0;
    const newSequence = currentSequence + 1;
    
    transaction.update(restaurantRef, {
      invoiceSerialSequence: newSequence,
    });
    
    return newSequence;
  });
}

