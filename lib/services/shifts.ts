import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  setDoc,
  updateDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import { shiftsCollection, invoicesCollection, getShiftRef, usersCollection } from '@/lib/firestore';
import type { Shift, Invoice } from '@/types/entities';

/**
 * Create a new shift document
 */
export async function createShift(
  staffId: string,
  startingCash: number
): Promise<{ success: boolean; shift?: Shift; error?: string }> {
  try {
    if (startingCash < 0) {
      return {
        success: false,
        error: 'Starting cash must be a positive number',
      };
    }

    // Check if there's already an open shift for this staff member
    const activeShiftResult = await getActiveShift(staffId);
    if (activeShiftResult.success && activeShiftResult.shift) {
      return {
        success: false,
        error: 'You already have an open shift. Please close it before opening a new one.',
      };
    }

    const now = Timestamp.now();
    const shiftRef = doc(shiftsCollection);

    const shiftData: Omit<Shift, 'id'> = {
      staffId,
      startTime: now,
      endTime: null,
      startingCash,
      expectedCash: startingCash, // Initially same as starting cash, will be recalculated on close
      actualCash: null,
      variance: null,
      status: 'open',
      created_at: now,
    };

    // Create shift and update user's active_shift_id in a transaction
    return await runTransaction(db, async (transaction) => {
      // Create the shift document
      transaction.set(shiftRef, {
        ...shiftData,
        created_at: serverTimestamp(),
      });

      // Update user's active_shift_id
      const userRef = doc(usersCollection, staffId);
      transaction.update(userRef, {
        active_shift_id: shiftRef.id,
      });

      const shift: Shift = {
        id: shiftRef.id,
        ...shiftData,
      };

      return {
        success: true,
        shift,
      };
    });
  } catch (error: any) {
    console.error('Error creating shift:', error);
    return {
      success: false,
      error: error.message || 'Failed to create shift',
    };
  }
}

/**
 * Get active (open) shift for a staff member
 */
export async function getActiveShift(
  staffId: string
): Promise<{ success: boolean; shift?: Shift; error?: string }> {
  try {
    const q = query(
      shiftsCollection,
      where('staffId', '==', staffId),
      where('status', '==', 'open'),
      orderBy('created_at', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: true,
        shift: undefined,
      };
    }

    const doc = querySnapshot.docs[0];
    const shift: Shift = {
      id: doc.id,
      ...doc.data(),
    } as Shift;

    return {
      success: true,
      shift,
    };
  } catch (error: any) {
    console.error('Error getting active shift:', error);
    return {
      success: false,
      error: error.message || 'Failed to get active shift',
    };
  }
}

/**
 * Get all cash invoices for a shift
 */
async function getShiftInvoices(
  staffId: string,
  startTime: Date | string | Timestamp,
  endTime?: Date | string | Timestamp | null
): Promise<Invoice[]> {
  try {
    const startTimestamp = startTime instanceof Timestamp
      ? startTime
      : Timestamp.fromDate(new Date(startTime));

    const endTimestamp = endTime
      ? (endTime instanceof Timestamp
          ? endTime
          : Timestamp.fromDate(new Date(endTime)))
      : Timestamp.now();

    const q = query(
      invoicesCollection,
      where('cashier_id', '==', staffId),
      where('paymentMethod', '==', 'Cash'),
      where('created_at', '>=', startTimestamp),
      where('created_at', '<=', endTimestamp),
      orderBy('created_at', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const invoices: Invoice[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Invoice[];

    return invoices;
  } catch (error: any) {
    console.error('Error getting shift invoices:', error);
    return [];
  }
}

/**
 * Get all closed shifts, ordered by endTime descending (most recent first)
 */
export async function getClosedShifts(): Promise<Shift[]> {
  try {
    const q = query(
      shiftsCollection,
      where('status', '==', 'closed'),
      orderBy('endTime', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const shifts: Shift[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Shift[];

    return shifts;
  } catch (error: any) {
    console.error('Error getting closed shifts:', error);
    return [];
  }
}

/**
 * Get all invoices (cash, card, returns) for a shift period
 * Returns invoices grouped by type for detailed reporting
 */
export async function getShiftInvoicesDetailed(
  staffId: string,
  startTime: Date | string | Timestamp,
  endTime: Date | string | Timestamp | null
): Promise<{
  cashInvoices: Invoice[];
  cardInvoices: Invoice[];
  returnInvoices: Invoice[];
  allInvoices: Invoice[];
}> {
  try {
    const startTimestamp = startTime instanceof Timestamp
      ? startTime
      : Timestamp.fromDate(new Date(startTime));

    const endTimestamp = endTime
      ? (endTime instanceof Timestamp
          ? endTime
          : Timestamp.fromDate(new Date(endTime)))
      : Timestamp.now();

    // Get all invoices for the shift period (regardless of payment method)
    const q = query(
      invoicesCollection,
      where('cashier_id', '==', staffId),
      where('created_at', '>=', startTimestamp),
      where('created_at', '<=', endTimestamp),
      orderBy('created_at', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const allInvoices: Invoice[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Invoice[];

    // Separate invoices by type
    const cashInvoices = allInvoices.filter(
      (inv) => inv.paymentMethod === 'Cash' && (inv.grandTotal || 0) > 0
    );
    const cardInvoices = allInvoices.filter(
      (inv) => (inv.paymentMethod === 'Visa' || inv.paymentMethod === 'CliQ') && (inv.grandTotal || 0) > 0
    );
    const returnInvoices = allInvoices.filter(
      (inv) => (inv.grandTotal || 0) < 0
    );

    return {
      cashInvoices,
      cardInvoices,
      returnInvoices,
      allInvoices,
    };
  } catch (error: any) {
    console.error('Error getting shift invoices detailed:', error);
    return {
      cashInvoices: [],
      cardInvoices: [],
      returnInvoices: [],
      allInvoices: [],
    };
  }
}

/**
 * Calculate expected cash for a shift
 * Formula: startingCash + sum of all cash invoice grandTotals during shift
 */
export async function calculateExpectedCash(
  shiftId: string
): Promise<{ success: boolean; expectedCash?: number; error?: string }> {
  try {
    const shiftRef = getShiftRef(shiftId);
    const shiftDoc = await getDoc(shiftRef);

    if (!shiftDoc.exists()) {
      return {
        success: false,
        error: 'Shift not found',
      };
    }

    const shift = shiftDoc.data() as Shift;

    // Get all cash invoices during the shift
    const invoices = await getShiftInvoices(
      shift.staffId,
      shift.startTime,
      shift.endTime
    );

    // Sum all cash invoice grandTotals
    const cashInvoicesTotal = invoices.reduce((sum, invoice) => {
      return sum + (invoice.grandTotal || 0);
    }, 0);

    // Expected cash = starting cash + sum of cash invoices
    const expectedCash = shift.startingCash + cashInvoicesTotal;

    return {
      success: true,
      expectedCash,
    };
  } catch (error: any) {
    console.error('Error calculating expected cash:', error);
    return {
      success: false,
      error: error.message || 'Failed to calculate expected cash',
    };
  }
}

/**
 * Close shift with actual cash count
 * Calculates variance and updates shift status
 */
export async function closeShift(
  shiftId: string,
  actualCash: number
): Promise<{ success: boolean; shift?: Shift; error?: string }> {
  try {
    if (actualCash < 0) {
      return {
        success: false,
        error: 'Actual cash must be a positive number',
      };
    }

    // Get shift data first (before transaction)
    const shiftRef = getShiftRef(shiftId);
    const shiftDoc = await getDoc(shiftRef);

    if (!shiftDoc.exists()) {
      return {
        success: false,
        error: 'Shift not found',
      };
    }

    const shift = shiftDoc.data() as Shift;

    if (shift.status === 'closed') {
      return {
        success: false,
        error: 'Shift is already closed',
      };
    }

    // Calculate expected cash (outside transaction)
    const invoices = await getShiftInvoices(
      shift.staffId,
      shift.startTime,
      null // Use current time since shift is still open
    );

    const cashInvoicesTotal = invoices.reduce((sum, invoice) => {
      return sum + (invoice.grandTotal || 0);
    }, 0);

    const expectedCash = shift.startingCash + cashInvoicesTotal;

    // Calculate variance: expectedCash - actualCash
    const variance = expectedCash - actualCash;

    const now = Timestamp.now();

    // Update shift in transaction
    return await runTransaction(db, async (transaction) => {
      const shiftDocInTransaction = await transaction.get(shiftRef);

      if (!shiftDocInTransaction.exists()) {
        throw new Error('Shift not found');
      }

      const shiftInTransaction = shiftDocInTransaction.data() as Shift;

      if (shiftInTransaction.status === 'closed') {
        throw new Error('Shift is already closed');
      }

      // Update shift
      transaction.update(shiftRef, {
        endTime: now,
        expectedCash,
        actualCash,
        variance,
        status: 'closed',
      });

      // Clear user's active_shift_id
      const userRef = doc(usersCollection, shiftInTransaction.staffId);
      transaction.update(userRef, {
        active_shift_id: null,
      });

      const updatedShift: Shift = {
        ...shiftInTransaction,
        endTime: now.toDate().toISOString(),
        expectedCash,
        actualCash,
        variance,
        status: 'closed',
      };

      return {
        success: true,
        shift: updatedShift,
      };
    });
  } catch (error: any) {
    console.error('Error closing shift:', error);
    return {
      success: false,
      error: error.message || 'Failed to close shift',
    };
  }
}

