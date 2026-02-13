"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User, UserRole } from '@/types/entities'

interface AuthState {
  user: FirebaseUser | null
  userData: User | null
  loading: boolean
  error: string | null
}

interface SignUpData {
  email: string
  password: string
  name: string
  role?: UserRole
}

interface SignInData {
  email: string
  password: string
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    userData: null,
    loading: true,
    error: null,
  })

  // Fetch user data from Firestore, auto-create if doesn't exist
  const fetchUserData = useCallback(async (uid: string, email: string | null, displayName: string | null): Promise<User | null> => {
    try {
      const userDocRef = doc(db, 'users', uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        // User document exists, return it
        const data = userDoc.data()
        return {
          id: userDoc.id,
          name: data.name || displayName || email?.split('@')[0] || 'User',
          email: data.email || email || '',
          password_hash: data.password_hash || '',
          role: data.role || 'cashier',
          created_at: data.created_at || new Date().toISOString(),
          currency: data.currency,
          theme: data.theme,
          pin_code: data.pin_code,
          is_store_device: data.is_store_device ?? false,
          active_shift_id: data.active_shift_id ?? null,
          restaurantId: data.restaurantId || data.restaurant_id || undefined,
          branchId: data.branchId || data.branch_id || undefined,
        } as User
      }

      // User document does NOT exist - auto-create it
      // Check if this is the first user (make them owner) or default to cashier
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const isFirstUser = usersSnapshot.empty

      const newUserData = {
        name: displayName || email?.split('@')[0] || 'New User',
        email: email || '',
        password_hash: '', // Firebase Auth handles passwords
        role: isFirstUser ? 'owner' : 'cashier', // First user becomes owner, others default to cashier
        created_at: serverTimestamp(),
        is_store_device: false,
        active_shift_id: null,
      }

      await setDoc(userDocRef, newUserData)

      return {
        id: uid,
        name: newUserData.name,
        email: newUserData.email,
        password_hash: newUserData.password_hash,
        role: newUserData.role,
        created_at: new Date().toISOString(), // Convert for return value
        is_store_device: newUserData.is_store_device,
        active_shift_id: newUserData.active_shift_id,
        restaurantId: undefined,
        branchId: undefined,
      } as User
    } catch (error) {
      console.error('Error fetching/creating user data:', error)
      return null
    }
  }, [])

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await fetchUserData(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName
        )
        setState({
          user: firebaseUser,
          userData,
          loading: false,
          error: null,
        })
      } else {
        setState({
          user: null,
          userData: null,
          loading: false,
          error: null,
        })
      }
    })

    return () => unsubscribe()
  }, [fetchUserData])

  // Sign up with email and password
  const signUp = async ({ email, password, name, role = 'stock_manager' }: SignUpData) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Update display name
      await updateProfile(firebaseUser, { displayName: name })

      // Create user document in Firestore (no branch required)
      const userData = {
        name,
        email,
        password_hash: '', // Firebase handles password, we don't store it
        role: role as UserRole,
        created_at: serverTimestamp(),
        is_store_device: false,
        active_shift_id: null,
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), userData)

      const fullUserData = {
        id: firebaseUser.uid,
        name: userData.name,
        email: userData.email,
        password_hash: userData.password_hash,
        role: userData.role,
        created_at: new Date().toISOString(), // Convert for return value
        is_store_device: userData.is_store_device,
        active_shift_id: userData.active_shift_id,
        restaurantId: undefined,
        branchId: undefined,
      } as User

      setState({
        user: firebaseUser,
        userData: fullUserData,
        loading: false,
        error: null,
      })

      return { success: true, user: fullUserData }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  // Sign in with email and password
  const signIn = async ({ email, password }: SignInData) => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      const userData = await fetchUserData(
        firebaseUser.uid,
        firebaseUser.email,
        firebaseUser.displayName
      )

      setState({
        user: firebaseUser,
        userData,
        loading: false,
        error: null,
      })

      return { success: true, user: userData }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      setState(prev => ({ ...prev, loading: false, error: errorMessage }))
      return { success: false, error: errorMessage }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setState({
        user: null,
        userData: null,
        loading: false,
        error: null,
      })
      return { success: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      return { success: false, error: errorMessage }
    }
  }

  // Check if user has specific role
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!state.userData) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(state.userData.role)
  }

  // Check if user is owner
  const isOwner = (): boolean => {
    return hasRole('owner')
  }

  // Check if user is owner or manager
  const isOwnerOrManager = (): boolean => {
    return hasRole(['owner', 'manager'])
  }

  // Check if user is admin or owner (for backward compatibility)
  const isAdminOrOwner = (): boolean => {
    return hasRole('owner')
  }

  // Check if user is admin, owner, or manager (for backward compatibility)
  const isAdminOrManager = (): boolean => {
    return hasRole(['owner', 'manager'])
  }

  return {
    user: state.user,
    userData: state.userData,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signUp,
    signIn,
    signOut,
    logout: signOut, // Alias for consistency
    hasRole,
    isAdminOrManager,
    isAdminOrOwner,
  }
}

