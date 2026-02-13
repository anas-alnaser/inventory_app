"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getUserByPin } from '@/lib/services/users'
import type { User } from '@/types/entities'

const LOCAL_STORAGE_KEY = 'activeStaffId'

interface StaffContextType {
  activeStaff: User | null
  isLoading: boolean
  loginWithPin: (pin: string, branchId?: string) => Promise<{ success: boolean; error?: string; user?: User }>
  logout: () => void
  clearActiveStaff: () => void  // Alias for logout (backwards compatibility)
  setActiveStaff: (user: User | null) => void
  refreshActiveStaff: () => Promise<void>  // Fetch fresh user data from Firestore
}

const StaffContext = createContext<StaffContextType | undefined>(undefined)

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [activeStaff, setActiveStaffState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize: Check localStorage and fetch user from Firestore
  useEffect(() => {
    const initializeStaff = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      try {
        const storedId = localStorage.getItem(LOCAL_STORAGE_KEY)

        if (storedId) {
          // Fetch fresh user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', storedId))

          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as User
            setActiveStaffState(userData)
          } else {
            // User no longer exists - clear localStorage
            localStorage.removeItem(LOCAL_STORAGE_KEY)
          }
        }
      } catch (error) {
        console.error('[StaffContext] Error initializing:', error)
        localStorage.removeItem(LOCAL_STORAGE_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    initializeStaff()
  }, [])

  // Login with PIN
  const loginWithPin = useCallback(async (
    pin: string,
    branchId?: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const user = await getUserByPin(pin.trim(), branchId)

      if (!user) {
        return { success: false, error: 'Invalid PIN' }
      }

      // Save to state and localStorage
      setActiveStaffState(user)
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, user.id)
      }

      return { success: true, user }
    } catch (error: any) {
      console.error('[StaffContext] Login error:', error)
      return { success: false, error: error.message || 'Login failed' }
    }
  }, [])

  // Logout - clear state and localStorage
  const logout = useCallback(() => {
    setActiveStaffState(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  }, [])

  // Set active staff directly (for backward compatibility)
  const setActiveStaff = useCallback((user: User | null) => {
    setActiveStaffState(user)
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(LOCAL_STORAGE_KEY, user.id)
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY)
      }
    }
  }, [])

  // Refresh active staff from Firestore (get fresh data including active_shift_id)
  const refreshActiveStaff = useCallback(async () => {
    if (!activeStaff?.id) return
    try {
      const userDoc = await getDoc(doc(db, 'users', activeStaff.id))
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User
        setActiveStaffState(userData)
        console.log('[StaffContext] Refreshed staff data:', userData.active_shift_id)
      }
    } catch (error) {
      console.error('[StaffContext] Error refreshing staff:', error)
    }
  }, [activeStaff?.id])

  return (
    <StaffContext.Provider
      value={{
        activeStaff,
        isLoading,
        loginWithPin,
        logout,
        clearActiveStaff: logout,  // Alias for backwards compatibility
        setActiveStaff,
        refreshActiveStaff,
      }}
    >
      {children}
    </StaffContext.Provider>
  )
}

export function useStaff() {
  const context = useContext(StaffContext)
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider')
  }
  return context
}
