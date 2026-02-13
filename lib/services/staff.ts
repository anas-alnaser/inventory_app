/**
 * Staff Management Service
 * Handles creating, updating, and managing staff members
 */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { User, UserRole } from "@/types/entities"

// Collection reference
const usersCollection = collection(db, "users")

export interface StaffMember {
    id: string
    name: string
    email: string
    role: UserRole
    pin_code?: string
    branchId?: string
    restaurantId?: string
    is_store_device: boolean
    active: boolean
    created_at: Date | string
}

export interface CreateStaffParams {
    name: string
    email: string
    role: UserRole
    pin_code: string
    branchId: string
    restaurantId: string
}

/**
 * Get all staff members for a restaurant/branch
 */
export async function getStaffMembers(
    restaurantId: string,
    branchId?: string
): Promise<StaffMember[]> {
    try {
        let q = query(
            usersCollection,
            where("restaurantId", "==", restaurantId),
            where("is_store_device", "==", false),
            orderBy("name", "asc")
        )

        const snapshot = await getDocs(q)
        let staff = snapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                id: doc.id,
                name: data.name || "",
                email: data.email || "",
                role: data.role as UserRole,
                pin_code: data.pin_code,
                branchId: data.branchId,
                restaurantId: data.restaurantId,
                is_store_device: data.is_store_device || false,
                active: data.active !== false, // Default to true
                created_at: data.created_at?.toDate?.() || data.created_at,
            } as StaffMember
        })

        // Filter by branch if specified
        if (branchId) {
            staff = staff.filter((s) => s.branchId === branchId)
        }

        return staff
    } catch (error) {
        console.error("Error getting staff members:", error)
        return []
    }
}

/**
 * Create a new staff member
 */
export async function createStaffMember(
    params: CreateStaffParams
): Promise<{ success: boolean; staff?: StaffMember; error?: string }> {
    try {
        // Check if email already exists
        const emailQuery = query(
            usersCollection,
            where("email", "==", params.email.toLowerCase())
        )
        const emailCheck = await getDocs(emailQuery)
        if (!emailCheck.empty) {
            return { success: false, error: "Email already exists" }
        }

        // Check if PIN already exists in the same restaurant
        const pinQuery = query(
            usersCollection,
            where("restaurantId", "==", params.restaurantId),
            where("pin_code", "==", params.pin_code)
        )
        const pinCheck = await getDocs(pinQuery)
        if (!pinCheck.empty) {
            return { success: false, error: "PIN code already in use" }
        }

        const now = Timestamp.now()
        const staffData = {
            name: params.name,
            email: params.email.toLowerCase(),
            password_hash: "", // Will be set when user first logs in
            role: params.role,
            pin_code: params.pin_code,
            branchId: params.branchId,
            restaurantId: params.restaurantId,
            is_store_device: false,
            active: true,
            created_at: now,
        }

        const docRef = await addDoc(usersCollection, staffData)

        const staff: StaffMember = {
            id: docRef.id,
            ...staffData,
            created_at: now.toDate(),
        }

        return { success: true, staff }
    } catch (error: any) {
        console.error("Error creating staff member:", error)
        return { success: false, error: error.message || "Failed to create staff member" }
    }
}

/**
 * Update a staff member
 */
export async function updateStaffMember(
    staffId: string,
    updates: Partial<{
        name: string
        role: UserRole
        pin_code: string
        active: boolean
    }>
): Promise<{ success: boolean; error?: string }> {
    try {
        const staffRef = doc(db, "users", staffId)
        const staffSnap = await getDoc(staffRef)

        if (!staffSnap.exists()) {
            return { success: false, error: "Staff member not found" }
        }

        // If updating PIN, check for duplicates
        if (updates.pin_code) {
            const staffData = staffSnap.data()
            const pinQuery = query(
                usersCollection,
                where("restaurantId", "==", staffData.restaurantId),
                where("pin_code", "==", updates.pin_code)
            )
            const pinCheck = await getDocs(pinQuery)
            const existingPin = pinCheck.docs.find((d) => d.id !== staffId)
            if (existingPin) {
                return { success: false, error: "PIN code already in use" }
            }
        }

        await updateDoc(staffRef, updates)
        return { success: true }
    } catch (error: any) {
        console.error("Error updating staff member:", error)
        return { success: false, error: error.message || "Failed to update staff member" }
    }
}

/**
 * Deactivate a staff member (soft delete)
 */
export async function deactivateStaffMember(
    staffId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const staffRef = doc(db, "users", staffId)
        await updateDoc(staffRef, { active: false })
        return { success: true }
    } catch (error: any) {
        console.error("Error deactivating staff member:", error)
        return { success: false, error: error.message || "Failed to deactivate staff member" }
    }
}

/**
 * Reactivate a staff member
 */
export async function reactivateStaffMember(
    staffId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const staffRef = doc(db, "users", staffId)
        await updateDoc(staffRef, { active: true })
        return { success: true }
    } catch (error: any) {
        console.error("Error reactivating staff member:", error)
        return { success: false, error: error.message || "Failed to reactivate staff member" }
    }
}

/**
 * Generate a random 4-digit PIN
 */
export function generatePIN(): string {
    return Math.floor(1000 + Math.random() * 9000).toString()
}

/**
 * Validate PIN format (4 digits)
 */
export function validatePIN(pin: string): boolean {
    return /^\d{4}$/.test(pin)
}

/**
 * Get staff member by PIN (for lock screen authentication)
 */
export async function getStaffByPIN(
    restaurantId: string,
    pin: string
): Promise<StaffMember | null> {
    try {
        const q = query(
            usersCollection,
            where("restaurantId", "==", restaurantId),
            where("pin_code", "==", pin),
            where("active", "==", true)
        )

        const snapshot = await getDocs(q)
        if (snapshot.empty) {
            return null
        }

        const doc = snapshot.docs[0]
        const data = doc.data()

        return {
            id: doc.id,
            name: data.name,
            email: data.email,
            role: data.role as UserRole,
            pin_code: data.pin_code,
            branchId: data.branchId,
            restaurantId: data.restaurantId,
            is_store_device: data.is_store_device || false,
            active: true,
            created_at: data.created_at?.toDate?.() || data.created_at,
        }
    } catch (error) {
        console.error("Error getting staff by PIN:", error)
        return null
    }
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
        owner: "Owner",
        admin: "Admin",
        manager: "Manager",
        stock_manager: "Stock Manager",
        supervisor: "Supervisor",
        cashier: "Cashier",
    }
    return roleNames[role] || role
}

/**
 * Get available roles for assignment (based on assigner's role)
 */
export function getAssignableRoles(assignerRole: UserRole): UserRole[] {
    switch (assignerRole) {
        case "owner":
            return ["manager", "stock_manager", "supervisor", "cashier"]
        case "manager":
            return ["supervisor", "cashier"]
        default:
            return []
    }
}
