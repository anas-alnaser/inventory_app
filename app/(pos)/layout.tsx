"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ThemeSync } from "@/components/layout/ThemeSync"
import { StaffGuard } from "@/components/layout/StaffGuard"
import { OpenShiftModal } from "@/components/shifts/OpenShiftModal"
import { useAuth } from "@/lib/hooks/useAuth"
import { useStaff } from "@/lib/contexts/StaffContext"
import { Loader2 } from "lucide-react"
import type { User } from "@/types/entities"

export default function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { activeStaff, isLoading: staffLoading, setActiveStaff, refreshActiveStaff } = useStaff()

  // Roles that can use POS with shift management
  const allowedPOSRoles = ['cashier', 'manager', 'owner', 'supervisor']
  const canUseShifts = activeStaff && allowedPOSRoles.includes(activeStaff.role || '')

  const [checkingShift, setCheckingShift] = useState(true)
  const [hasActiveShift, setHasActiveShift] = useState(false)
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false)

  // Check if user has active shift
  const checkActiveShift = useCallback(async () => {
    if (!activeStaff) return

    setCheckingShift(true)
    try {
      // Use refreshActiveStaff to get fresh data
      await refreshActiveStaff()

      // Then check the updated state
      const userDoc = await getDoc(doc(db, 'users', activeStaff.id))

      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User
        const hasShift = !!userData.active_shift_id
        setHasActiveShift(hasShift)

        // Update context with fresh data
        setActiveStaff(userData)

        // If no active shift AND user can use shifts, show modal
        if (!hasShift && allowedPOSRoles.includes(userData.role || '')) {
          setShowOpenShiftModal(true)
        } else if (!hasShift) {
          // User can't use shifts, redirect to dashboard
          router.replace('/dashboard')
        }
      }
    } catch (error) {
      console.error('[POSLayout] Error checking shift:', error)
    } finally {
      setCheckingShift(false)
    }
  }, [activeStaff?.id, setActiveStaff, refreshActiveStaff, router])

  // Check shift on mount and when staff changes
  useEffect(() => {
    if (!staffLoading && activeStaff) {
      checkActiveShift()
    }
  }, [staffLoading, activeStaff?.id])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, authLoading, router])

  // Show loading while checking auth or staff
  if (authLoading || staffLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // StaffGuard handles staff auth and role-based redirects
  return (
    <StaffGuard>
      <div className="h-screen w-screen overflow-hidden bg-background">
        <ThemeSync />

        {/* Show loading while checking shift */}
        {checkingShift ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Checking shift status...</p>
            </div>
          </div>
        ) : hasActiveShift ? (
          // Render POS if shift is open
          children
        ) : (
          // Show message if no shift (modal will handle it)
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Please open a shift to continue</p>
            </div>
          </div>
        )}

        {/* Open Shift Modal - shown when no active shift (for POS roles) */}
        {canUseShifts && (
          <OpenShiftModal
            open={showOpenShiftModal && !hasActiveShift}
            onOpenChange={(open) => {
              // Don't allow closing modal if no active shift
              if (!hasActiveShift && !open) {
                // User tried to close - redirect to lock screen
                router.replace('/lock-screen')
                return
              }
              setShowOpenShiftModal(open)
            }}
            staffId={activeStaff?.id || ''}
            onSuccess={async () => {
              // Refresh user data to get new active_shift_id
              await refreshActiveStaff()
              await checkActiveShift()
              setShowOpenShiftModal(false)
            }}
          />
        )}
      </div>
    </StaffGuard>
  )
}
