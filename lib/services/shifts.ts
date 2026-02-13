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
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import { shiftsCollection, invoicesCollection, getShiftRef, usersCollection } from '@/lib/firestore';
import type { Shift, Invoice, User } from '@/types/entities';

/**
 * Open a new shift for a user
 * Uses Firestore transaction to atomically:
 * 1. Create the shift document
 * 2. Update user's active_shift_id
 */
export async function openShift(
  userId: string,
  startingCash: number
): Promise<{ success: boolean; shift?: Shift; error?: string }> {
  try {
    if (startingCash < 0) {
      return {
        success: false,
        error: 'Starting cash must be a positive number',
      };
    }

    const now = Timestamp.now();
    const shiftRef = doc(shiftsCollection);
    const userRef = doc(usersCollection, userId);

    return await runTransaction(db, async (transaction) => {
      // Read user doc first (required before writes in transaction)
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as User;

      // Check if user already has an active shift
      if (userData.active_shift_id) {
        throw new Error('You already have an open shift. Please close it first.');
      }

      const shiftData: Omit<Shift, 'id'> = {
        staffId: userId,
        branchId: userData.branchId, // Save branchId from user for EOD report correlation
        startTime: now.toDate(),
        endTime: null,
        startingCash,
        expectedCash: startingCash,
        actualCash: null,
        variance: null,
        status: 'open',
        created_at: now.toDate(),
      };

      // Create the shift document
      transaction.set(shiftRef, {
        ...shiftData,
        created_at: serverTimestamp(),
      } as any);

      // Update user's active_shift_id
      transaction.update(userRef, {
        active_shift_id: shiftRef.id,
      });

      return {
        success: true,
        shift: {
          id: shiftRef.id,
          ...shiftData,
        },
      };
    });
  } catch (error: any) {
    console.error('[Shifts] Error opening shift:', error);
    return {
      success: false,
      error: error.message || 'Failed to open shift',
    };
  }
}

/**
 * Close a shift for a user
 * Uses Firestore transaction to atomically:
 * 1. Calculate expected cash and total sales from invoices
 * 2. Update shift with closing data including totalSales
 * 3. Set user's active_shift_id to null
 */
export async function closeShift(
  userId: string,
  actualCash: number
): Promise<{ success: boolean; shift?: Shift; error?: string }> {
  try {
    console.log('[Shifts] Starting closeShift for user:', userId, 'with actualCash:', actualCash);

    if (actualCash < 0) {
      return {
        success: false,
        error: 'Actual cash must be a positive number',
      };
    }

    const userRef = doc(usersCollection, userId);

    // First, get user to find active shift ID
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.error('[Shifts] User not found:', userId);
      return {
        success: false,
        error: 'User not found',
      };
    }

    const userData = userDoc.data() as User;
    const shiftId = userData.active_shift_id;

    if (!shiftId) {
      console.error('[Shifts] No active shift found for user:', userId);
      return {
        success: false,
        error: 'No active shift found',
      };
    }

    console.log('[Shifts] Active shift ID:', shiftId);

    const shiftRef = getShiftRef(shiftId);
    const shiftDoc = await getDoc(shiftRef);

    if (!shiftDoc.exists()) {
      console.error('[Shifts] Shift document not found:', shiftId);
      return {
        success: false,
        error: 'Shift not found',
      };
    }

    const shiftData = shiftDoc.data();
    const shift = { ...shiftData, id: shiftDoc.id } as Shift;

    if (shift.status === 'closed') {
      console.error('[Shifts] Shift is already closed:', shiftId);
      return {
        success: false,
        error: 'Shift is already closed',
      };
    }

    // Get all invoices for this shift (by shiftId with time-based fallback)
    const { cashInvoices, allInvoices } = await getShiftInvoicesByShiftId(
      shiftId,
      userId,
      shift.startTime,
      null
    );

    // Calculate expected cash (starting cash + cash sales)
    const cashInvoicesTotal = cashInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const expectedCash = shift.startingCash + cashInvoicesTotal;

    // Calculate total sales (all payment methods)
    const totalSales = allInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

    // Calculate variance (expected - actual, positive = over, negative = short)
    const variance = expectedCash - actualCash;
    const now = Timestamp.now();

    console.log('[Shifts] Calculation results:', {
      startingCash: shift.startingCash,
      cashInvoicesTotal,
      expectedCash,
      actualCash,
      variance,
      totalSales,
      invoiceCount: allInvoices.length,
      cashInvoiceCount: cashInvoices.length,
    });

    // Run transaction to close shift
    return await runTransaction(db, async (transaction) => {
      // Re-read docs in transaction
      const txUserDoc = await transaction.get(userRef);
      const txShiftDoc = await transaction.get(shiftRef);

      if (!txUserDoc.exists() || !txShiftDoc.exists()) {
        throw new Error('User or shift not found');
      }

      const txShift = txShiftDoc.data() as Shift;

      if (txShift.status === 'closed') {
        throw new Error('Shift is already closed');
      }

      // Update shift with all closing data including totalSales
      transaction.update(shiftRef, {
        endTime: now,
        expectedCash,
        actualCash,
        variance,
        totalSales,
        status: 'closed',
      });

      // CRUCIAL: Set user's active_shift_id to null
      transaction.update(userRef, {
        active_shift_id: null,
      });

      const updatedShift: Shift = {
        ...shift,
        endTime: now.toDate(),
        expectedCash,
        actualCash,
        variance,
        totalSales,
        status: 'closed',
      };

      console.log('[Shifts] Shift closed successfully:', updatedShift);

      return {
        success: true,
        shift: updatedShift,
      };
    });
  } catch (error: any) {
    console.error('[Shifts] Error closing shift:', error);
    return {
      success: false,
      error: error.message || 'Failed to close shift',
    };
  }
}

/**
 * Get all cash invoices for a shift period (legacy: time-based)
 */
async function getShiftCashInvoices(
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
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    })) as Invoice[];
  } catch (error: any) {
    console.error('[Shifts] Error getting shift invoices:', error);
    return [];
  }
}

/**
 * Get all invoices for a shift by shiftId
 * Returns both cash invoices and all invoices for accurate reporting
 */
async function getShiftInvoicesByShiftId(
  shiftId: string,
  staffId: string,
  startTime: Date | string | Timestamp,
  endTime?: Date | string | Timestamp | null
): Promise<{ cashInvoices: Invoice[]; allInvoices: Invoice[] }> {
  try {
    // First try to query by shiftId (new invoices have this field)
    let q = query(
      invoicesCollection,
      where('shiftId', '==', shiftId),
      orderBy('created_at', 'asc')
    );

    let querySnapshot = await getDocs(q);

    // If no results, fallback to time-based query (for old invoices without shiftId)
    if (querySnapshot.empty) {
      console.log('[Shifts] No invoices with shiftId found, falling back to time-based query');

      const startTimestamp = startTime instanceof Timestamp
        ? startTime
        : Timestamp.fromDate(new Date(startTime));

      const endTimestamp = endTime
        ? (endTime instanceof Timestamp
          ? endTime
          : Timestamp.fromDate(new Date(endTime)))
        : Timestamp.now();

      q = query(
        invoicesCollection,
        where('cashier_id', '==', staffId),
        where('created_at', '>=', startTimestamp),
        where('created_at', '<=', endTimestamp),
        orderBy('created_at', 'asc')
      );

      querySnapshot = await getDocs(q);
    }

    const allInvoices = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    })) as Invoice[];

    const cashInvoices = allInvoices.filter((inv) => inv.paymentMethod === 'Cash');

    console.log(`[Shifts] Found ${allInvoices.length} total invoices, ${cashInvoices.length} cash invoices for shift ${shiftId}`);

    return { cashInvoices, allInvoices };
  } catch (error: any) {
    console.error('[Shifts] Error getting shift invoices by shiftId:', error);
    return { cashInvoices: [], allInvoices: [] };
  }
}

/**
 * Get shift by ID
 */
export async function getShiftById(
  shiftId: string
): Promise<{ success: boolean; shift?: Shift; error?: string }> {
  try {
    const shiftRef = getShiftRef(shiftId);
    const shiftDoc = await getDoc(shiftRef);

    if (!shiftDoc.exists()) {
      return {
        success: true,
        shift: undefined,
      };
    }

    return {
      success: true,
      shift: {
        id: shiftDoc.id,
        ...(shiftDoc.data() as any),
      } as Shift,
    };
  } catch (error: any) {
    console.error('[Shifts] Error getting shift:', error);
    return {
      success: false,
      error: error.message || 'Failed to get shift',
    };
  }
}

/**
 * Get active (open) shift for a staff member by checking user's active_shift_id
 */
export async function getActiveShift(
  staffId: string
): Promise<{ success: boolean; shift?: Shift; error?: string }> {
  try {
    // Get user to check active_shift_id
    const userRef = doc(usersCollection, staffId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return {
        success: true,
        shift: undefined,
      };
    }

    const userData = userDoc.data() as User;

    if (!userData.active_shift_id) {
      return {
        success: true,
        shift: undefined,
      };
    }

    // Fetch the shift
    return await getShiftById(userData.active_shift_id);
  } catch (error: any) {
    console.error('[Shifts] Error getting active shift:', error);
    return {
      success: false,
      error: error.message || 'Failed to get active shift',
    };
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
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    })) as Shift[];
  } catch (error: any) {
    console.error('[Shifts] Error getting closed shifts:', error);
    return [];
  }
}

/**
 * Get all invoices (cash, card, returns) for a shift period
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
      ...(doc.data() as any),
    })) as Invoice[];

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
    console.error('[Shifts] Error getting shift invoices detailed:', error);
    return {
      cashInvoices: [],
      cardInvoices: [],
      returnInvoices: [],
      allInvoices: [],
    };
  }
}

/**
 * Calculate expected cash for a shift (for reporting)
 */
export async function calculateExpectedCash(
  shiftId: string
): Promise<{ success: boolean; expectedCash?: number; error?: string }> {
  try {
    const shiftResult = await getShiftById(shiftId);

    if (!shiftResult.success || !shiftResult.shift) {
      return {
        success: false,
        error: 'Shift not found',
      };
    }

    const shift = shiftResult.shift;
    const invoices = await getShiftCashInvoices(
      shift.staffId,
      shift.startTime,
      shift.endTime
    );

    const cashInvoicesTotal = invoices.reduce((sum, invoice) => {
      return sum + (invoice.grandTotal || 0);
    }, 0);

    return {
      success: true,
      expectedCash: shift.startingCash + cashInvoicesTotal,
    };
  } catch (error: any) {
    console.error('[Shifts] Error calculating expected cash:', error);
    return {
      success: false,
      error: error.message || 'Failed to calculate expected cash',
    };
  }
}

// Legacy alias for backwards compatibility
export const createShift = openShift;

/**
 * Shift totals interface for comprehensive shift reporting
 */
export interface ShiftTotals {
  startingCash: number;
  totalSales: number;
  cashSales: number;
  cardSales: number;
  cliqSales: number;
  payIns: number;
  payOuts: number;
  expectedCash: number; // startingCash + cashSales + payIns - payOuts
  transactionCount: number;
}

/**
 * Calculate comprehensive shift totals including drawer operations
 * This is the core "Shift Calculator" engine that accounts for:
 * - Starting cash
 * - All sales (cash, card, CliQ)
 * - Pay-ins and pay-outs from drawer operations
 */
export async function calculateShiftTotals(
  shiftId: string
): Promise<{ success: boolean; totals?: ShiftTotals; error?: string }> {
  try {
    // 1. Fetch the shift document
    const shiftResult = await getShiftById(shiftId);
    if (!shiftResult.success || !shiftResult.shift) {
      return { success: false, error: 'Shift not found' };
    }

    const shift = shiftResult.shift;
    console.log('[Shifts] Calculating totals for shift:', shiftId, 'startingCash:', shift.startingCash);

    // 2. Fetch invoices for this shift (excluding voided)
    const { allInvoices } = await getShiftInvoicesByShiftId(
      shiftId,
      shift.staffId,
      shift.startTime,
      shift.endTime
    );

    // Filter out voided invoices
    const validInvoices = allInvoices.filter(
      (inv) => inv.status !== 'voided'
    );

    // Calculate sales by payment method
    let cashSales = 0;
    let cardSales = 0;
    let cliqSales = 0;

    validInvoices.forEach((inv) => {
      const amount = inv.grandTotal || 0;
      switch (inv.paymentMethod) {
        case 'Cash':
          cashSales += amount;
          break;
        case 'Visa':
          cardSales += amount;
          break;
        case 'CliQ':
          cliqSales += amount;
          break;
      }
    });

    const totalSales = cashSales + cardSales + cliqSales;

    // 3. Fetch drawer events for this shift (pay-ins and pay-outs)
    let payIns = 0;
    let payOuts = 0;

    try {
      const { collection: firestoreCollection, getDocs: firestoreGetDocs, query: firestoreQuery, where: firestoreWhere } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      const drawerEventsRef = firestoreCollection(db, 'drawer_events');
      const drawerQuery = firestoreQuery(
        drawerEventsRef,
        firestoreWhere('shiftId', '==', shiftId)
      );

      const drawerSnapshot = await firestoreGetDocs(drawerQuery);

      drawerSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const amount = data.amount || 0;

        if (data.reason === 'paid_in') {
          payIns += amount;
        } else if (data.reason === 'paid_out') {
          payOuts += amount;
        }
      });

      console.log('[Shifts] Drawer operations - PayIns:', payIns, 'PayOuts:', payOuts);
    } catch (drawerError) {
      console.error('[Shifts] Error fetching drawer events:', drawerError);
      // Continue with 0 pay-ins/pay-outs if drawer events fail
    }

    // 4. Calculate expected cash
    const expectedCash = shift.startingCash + cashSales + payIns - payOuts;

    const totals: ShiftTotals = {
      startingCash: shift.startingCash,
      totalSales,
      cashSales,
      cardSales,
      cliqSales,
      payIns,
      payOuts,
      expectedCash,
      transactionCount: validInvoices.length,
    };

    console.log('[Shifts] Calculated totals:', totals);

    return { success: true, totals };
  } catch (error: any) {
    console.error('[Shifts] Error calculating shift totals:', error);
    return { success: false, error: error.message || 'Failed to calculate shift totals' };
  }
}
