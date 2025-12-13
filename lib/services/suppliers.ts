import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Supplier } from '@/types/entities';

// Collection reference
const suppliersRef = collection(db, 'suppliers');

export interface CreateSupplierData {
  name: string;
  phone: string;
  email: string;
  address?: string;
  contact_person?: string;
  payment_terms?: string;
  delivery_days?: string[];
}

export async function getSuppliers(): Promise<Supplier[]> {
  const q = query(suppliersRef, orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as object),
  })) as Supplier[];
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  console.log(`[DEBUG] Attempting to fetch: suppliers/${id}`);
  try {
    // Ensure we are accessing the 'suppliers' collection (plural)
    const docRef = doc(db, "suppliers", id);
    const docSnap = await getDoc(docRef);
    
    console.log(`[DEBUG] Snapshot exists?`, docSnap.exists());
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Supplier;
    } else {
      console.error("No supplier found with ID:", id);
      return null;
    }
  } catch (error) {
    console.error("[DEBUG] Firestore Error:", error);
    return null;
  }
}

export async function createSupplier(data: CreateSupplierData): Promise<string> {
  const docRef = await addDoc(suppliersRef, {
    ...data,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSupplier(id: string, data: Partial<CreateSupplierData>): Promise<void> {
  const docRef = doc(suppliersRef, id);
  await updateDoc(docRef, {
    ...data,
    updated_at: serverTimestamp(),
  });
}

export async function deleteSupplier(id: string): Promise<void> {
  const docRef = doc(suppliersRef, id);
  await deleteDoc(docRef);
}

