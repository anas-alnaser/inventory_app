import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
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

