"use client"

import { useState, useEffect, useCallback } from 'react'
import { 
  User as FirebaseUser,
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
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
          role: data.role || 'stock_keeper',
          created_at: data.created_at || new Date().toISOString(),
        } as User
      }
      
      // User document does NOT exist - auto-create it
      // Check if this is the first user (make them owner) or default to stock_keeper
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const isFirstUser = usersSnapshot.empty
      
      const newUserData = {
        name: displayName || email?.split('@')[0] || 'New User',
        email: email || '',
        password_hash: '', // Firebase Auth handles passwords
        role: isFirstUser ? 'owner' : 'stock_keeper', // First user becomes owner, others default to stock_keeper
        created_at: serverTimestamp(),
      }
      
      await setDoc(userDocRef, newUserData)
      
      return { 
        id: uid, 
        name: newUserData.name,
        email: newUserData.email,
        password_hash: newUserData.password_hash,
        role: newUserData.role,
        created_at: new Date().toISOString(), // Convert for return value
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
  const signUp = async ({ email, password, name, role = 'stock_keeper' }: SignUpData) => {
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
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), userData)

      const fullUserData = { 
        id: firebaseUser.uid, 
        name: userData.name,
        email: userData.email,
        password_hash: userData.password_hash,
        role: userData.role,
        created_at: new Date().toISOString(), // Convert for return value
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

  // Sign in with Google
  const signInWithGoogle = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const firebaseUser = userCredential.user
      
      // Check if user document exists, create if not
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
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed'
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

  // Check if user is admin or owner
  const isAdminOrOwner = (): boolean => {
    return hasRole(['admin', 'owner'])
  }
  
  // Check if user is admin, owner, or manager
  const isAdminOrManager = (): boolean => {
    return hasRole(['admin', 'owner', 'manager'])
  }

  return {
    user: state.user,
    userData: state.userData,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    logout: signOut, // Alias for consistency
    hasRole,
    isAdminOrManager,
    isAdminOrOwner,
  }
}

