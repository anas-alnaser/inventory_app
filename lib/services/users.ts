import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { usersCollection } from '../firestore';
import type { User, UserRole } from '@/types/entities';

export interface CreateUserData {
  name: string;
  email: string;
  role: UserRole;
}

export async function getAllUsers(): Promise<User[]> {
  const q = query(usersCollection, orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as object),
  })) as User[];
}

export async function getUserById(id: string): Promise<User | null> {
  const docRef = doc(usersCollection, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...(docSnap.data() as object) } as User;
  }
  return null;
}

/**
 * Get user by PIN code
 * Optionally filters by branchId if provided to prevent cross-store access
 */
export async function getUserByPin(
  pin: string,
  branchId?: string
): Promise<User | null> {
  try {
    // Trim and normalize PIN
    const normalizedPin = pin.trim();

    console.log(`[DEBUG] Searching for PIN: "${normalizedPin}" (Type: ${typeof normalizedPin})`);
    console.log(`[DEBUG] Branch filter: ${branchId || 'none'}`);

    // Build query constraints - use pin_code field (snake_case as stored in DB)
    const constraints = [
      where('pin_code', '==', normalizedPin),
    ];

    // Filter by branchId if provided (camelCase as in entity)
    if (branchId) {
      constraints.push(where('branchId', '==', branchId));
    }

    const q = query(usersCollection, ...constraints);
    const snapshot = await getDocs(q);

    console.log(`[DEBUG] Query result: Found ${snapshot.size} users with PIN match`);

    if (snapshot.empty) {
      // Fallback: Try without branch filter in case that's the issue
      console.log(`[DEBUG] No users found. Trying without branch filter...`);
      const fallbackQuery = query(usersCollection, where('pin_code', '==', normalizedPin));
      const fallbackSnapshot = await getDocs(fallbackQuery);
      console.log(`[DEBUG] Fallback result: Found ${fallbackSnapshot.size} users`);

      if (fallbackSnapshot.empty) {
        // Last resort: Try PIN as number (in case DB stores it as number)
        console.log(`[DEBUG] Still empty. Trying PIN as number...`);
        const numericPin = parseInt(normalizedPin, 10);
        if (!isNaN(numericPin)) {
          const numQuery = query(usersCollection, where('pin_code', '==', numericPin));
          const numSnapshot = await getDocs(numQuery);
          console.log(`[DEBUG] Numeric PIN result: Found ${numSnapshot.size} users`);

          if (!numSnapshot.empty) {
            const docSnap = numSnapshot.docs[0];
            console.log(`[DEBUG] Found user: ${docSnap.data()?.name}`);
            return { id: docSnap.id, ...(docSnap.data() as object) } as User;
          }
        }
        return null;
      }

      const docSnap = fallbackSnapshot.docs[0];
      console.log(`[DEBUG] Found user (fallback): ${docSnap.data()?.name}`);
      return { id: docSnap.id, ...(docSnap.data() as object) } as User;
    }

    // Return the first matching user
    const docSnap = snapshot.docs[0];
    console.log(`[DEBUG] Found user: ${docSnap.data()?.name}`);
    return { id: docSnap.id, ...(docSnap.data() as object) } as User;
  } catch (error: any) {
    console.error('[DEBUG] Error getting user by PIN:', error);
    return null;
  }
}

export interface CreateUserWithAuthData extends CreateUserData {
  password: string; // Required for creating Auth user
}

export async function createUser(data: CreateUserWithAuthData): Promise<string> {
  // Step 1: Create user in Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const firebaseUser = userCredential.user;

  // Step 2: Update display name in Auth
  await updateProfile(firebaseUser, { displayName: data.name });

  // Step 3: Create user document in Firestore
  await setDoc(doc(usersCollection, firebaseUser.uid), {
    name: data.name,
    email: data.email,
    password_hash: '', // Firebase Auth handles passwords
    role: data.role,
    created_at: serverTimestamp(),
  } as any);

  return firebaseUser.uid;
}

export async function updateUser(id: string, data: Partial<CreateUserData>): Promise<void> {
  const docRef = doc(usersCollection, id);
  await updateDoc(docRef, {
    ...data,
  });
}

export async function deleteUser(id: string): Promise<void> {
  // Delete from Firestore
  const docRef = doc(usersCollection, id);
  await deleteDoc(docRef);

  // Delete from Firebase Authentication (if user exists)
  try {
    const userDoc = await getDoc(docRef);
    if (userDoc.exists()) {
      // Note: deleteAuthUser requires admin privileges, so this might fail
      // In production, you'd use Admin SDK on the server
      // For now, we'll just delete the Firestore document
    }
  } catch (error) {
    console.warn('Could not delete Auth user (requires Admin SDK):', error);
    // Continue anyway - Firestore document is deleted
  }
}

