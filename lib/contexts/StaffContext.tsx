"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { User } from '@/types/entities'

interface StaffContextType {
  activeStaff: User | null
  setActiveStaff: (user: User | null) => void
  clearActiveStaff: () => void
}

const StaffContext = createContext<StaffContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'activeStaff'

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [activeStaff, setActiveStaffState] = useState<User | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as User
          setActiveStaffState(parsed)
        }
      } catch (error) {
        console.error('Error loading activeStaff from localStorage:', error)
        localStorage.removeItem(LOCAL_STORAGE_KEY)
      } finally {
        setIsInitialized(true)
      }
    } else {
      setIsInitialized(true)
    }
  }, [])

  // Set active staff and persist to localStorage
  const setActiveStaff = useCallback((user: User | null) => {
    setActiveStaffState(user)
    if (typeof window !== 'undefined') {
      try {
        if (user) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user))
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY)
        }
      } catch (error) {
        console.error('Error saving activeStaff to localStorage:', error)
      }
    }
  }, [])

  // Clear active staff
  const clearActiveStaff = useCallback(() => {
    setActiveStaff(null)
  }, [setActiveStaff])

  // Don't render children until initialized (prevents flash of wrong state)
  if (!isInitialized) {
    return null
  }

  return (
    <StaffContext.Provider
      value={{
        activeStaff,
        setActiveStaff,
        clearActiveStaff,
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
