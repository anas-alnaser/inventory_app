import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  setDoc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { attendanceCollection, getAttendanceRef } from '@/lib/firestore';
import type { Attendance } from '@/types/entities';

/**
 * Create a new attendance record with clock in
 */
export async function createAttendanceRecord(
  staffId: string,
  shiftId?: string | null
): Promise<{ success: boolean; attendance?: Attendance; error?: string }> {
  try {
    const now = Timestamp.now();
    const attendanceRef = doc(attendanceCollection);
    
    const attendanceData: Omit<Attendance, 'id'> = {
      staffId,
      clockIn: now,
      clockOut: null,
      totalHours: null,
      shift_id: shiftId || null,
      created_at: now,
    };

    await setDoc(attendanceRef, {
      ...attendanceData,
      created_at: serverTimestamp(),
    });

    const attendance: Attendance = {
      id: attendanceRef.id,
      ...attendanceData,
    };

    return {
      success: true,
      attendance,
    };
  } catch (error: any) {
    console.error('Error creating attendance record:', error);
    return {
      success: false,
      error: error.message || 'Failed to create attendance record',
    };
  }
}

/**
 * Update attendance record with clock out and calculate total hours
 */
export async function updateAttendanceClockOut(
  attendanceId: string,
  clockOut?: Date | Timestamp
): Promise<{ success: boolean; attendance?: Attendance; error?: string }> {
  try {
    const attendanceRef = getAttendanceRef(attendanceId);
    const attendanceDoc = await getDoc(attendanceRef);

    if (!attendanceDoc.exists()) {
      return {
        success: false,
        error: 'Attendance record not found',
      };
    }

    const attendanceData = attendanceDoc.data() as Attendance;
    const clockOutTime = clockOut || Timestamp.now();
    const clockInTime = attendanceData.clockIn instanceof Timestamp
      ? attendanceData.clockIn
      : Timestamp.fromDate(new Date(attendanceData.clockIn));

    const clockOutTimestamp = clockOutTime instanceof Timestamp
      ? clockOutTime
      : Timestamp.fromDate(new Date(clockOutTime));

    // Calculate total hours
    const millisecondsDiff = clockOutTimestamp.toMillis() - clockInTime.toMillis();
    const totalHours = millisecondsDiff / (1000 * 60 * 60); // Convert to hours

    await updateDoc(attendanceRef, {
      clockOut: clockOutTimestamp,
      totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
    });

    const updatedAttendance: Attendance = {
      ...attendanceData,
      clockOut: clockOutTimestamp.toDate().toISOString(),
      totalHours: Math.round(totalHours * 100) / 100,
    };

    return {
      success: true,
      attendance: updatedAttendance,
    };
  } catch (error: any) {
    console.error('Error updating attendance clock out:', error);
    return {
      success: false,
      error: error.message || 'Failed to update attendance record',
    };
  }
}

/**
 * Update attendance record with shift_id
 */
export async function updateAttendanceShiftId(
  attendanceId: string,
  shiftId: string
): Promise<{ success: boolean; attendance?: Attendance; error?: string }> {
  try {
    const attendanceRef = getAttendanceRef(attendanceId);
    const attendanceDoc = await getDoc(attendanceRef);

    if (!attendanceDoc.exists()) {
      return {
        success: false,
        error: 'Attendance record not found',
      };
    }

    await updateDoc(attendanceRef, {
      shift_id: shiftId,
    });

    const attendanceData = attendanceDoc.data() as Attendance;
    const updatedAttendance: Attendance = {
      ...attendanceData,
      shift_id: shiftId,
    };

    return {
      success: true,
      attendance: updatedAttendance,
    };
  } catch (error: any) {
    console.error('Error updating attendance shift_id:', error);
    return {
      success: false,
      error: error.message || 'Failed to update attendance record',
    };
  }
}

/**
 * Get active attendance record for a staff member (no clockOut)
 */
export async function getActiveAttendance(
  staffId: string
): Promise<{ success: boolean; attendance?: Attendance; error?: string }> {
  try {
    const q = query(
      attendanceCollection,
      where('staffId', '==', staffId),
      where('clockOut', '==', null),
      orderBy('created_at', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: true,
        attendance: undefined,
      };
    }

    const doc = querySnapshot.docs[0];
    const attendance: Attendance = {
      id: doc.id,
      ...doc.data(),
    } as Attendance;

    return {
      success: true,
      attendance,
    };
  } catch (error: any) {
    console.error('Error getting active attendance:', error);
    return {
      success: false,
      error: error.message || 'Failed to get active attendance',
    };
  }
}

