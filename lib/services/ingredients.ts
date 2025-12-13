import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Ingredient, Unit } from '@/types/entities';

// Collection reference
const ingredientsRef = collection(db, 'ingredients');

export interface CreateIngredientData {
  name: string;
  unit: Unit;
  cost_per_unit: number;
  supplier_id: string;
  min_stock_level?: number;
  max_stock_level?: number;
  category?: string;
}

export async function getIngredients(): Promise<Ingredient[]> {
  const q = query(ingredientsRef, orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as object),
  })) as Ingredient[];
}

export async function getIngredientById(id: string): Promise<Ingredient | null> {
  const docRef = doc(ingredientsRef, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...(docSnap.data() as object) } as Ingredient;
  }
  return null;
}

export async function createIngredient(data: CreateIngredientData): Promise<string> {
  const docRef = await addDoc(ingredientsRef, {
    ...data,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateIngredient(id: string, data: Partial<CreateIngredientData>): Promise<void> {
  const docRef = doc(ingredientsRef, id);
  await updateDoc(docRef, {
    ...data,
    updated_at: serverTimestamp(),
  });
}

export async function deleteIngredient(id: string): Promise<void> {
  const docRef = doc(ingredientsRef, id);
  await deleteDoc(docRef);
}

export async function getIngredientsBySupplier(supplierId: string): Promise<Ingredient[]> {
  const q = query(ingredientsRef, where('supplier_id', '==', supplierId), orderBy('name'));
  const snapshot = await getDocs(q);
  console.log('Querying ingredients for supplier_id:', supplierId, 'Found:', snapshot.size);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as object),
  })) as Ingredient[];
}

// Enhanced ingredient creation with unit conversion support
export interface CreateIngredientWithUnitData extends CreateIngredientData {
  purchaseUnit?: string; // e.g., "Sack"
  purchaseUnitSize?: number; // e.g., 10000 (grams)
}

export async function createIngredientWithUnit(data: CreateIngredientWithUnitData): Promise<string> {
  const ingredientData: CreateIngredientData = {
    name: data.name,
    unit: data.unit,
    cost_per_unit: data.cost_per_unit,
    supplier_id: data.supplier_id,
    min_stock_level: data.min_stock_level,
    max_stock_level: data.max_stock_level,
    category: data.category,
  };
  
  return createIngredient(ingredientData);
}

