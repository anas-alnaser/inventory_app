"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ThemeSync } from "@/components/layout/ThemeSync"
import { useAuth } from "@/lib/hooks/useAuth"
import { useStaff } from "@/lib/contexts/StaffContext"
import { Skeleton } from "@/components/ui/skeleton"
import { canAccessPOS, getEffectiveRole } from "@/lib/utils/role-permissions"

export default function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading, userData } = useAuth()
  const { activeStaff } = useStaff()

  // Protect POS routes - redirect if not authenticated or unauthorized
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
      return
    }

    // If authenticated, check permissions
    if (!loading && isAuthenticated && userData) {
      // Get effective role (for store devices, use activeStaff role)
      const effectiveRole = getEffectiveRole(
        userData.role,
        activeStaff?.role,
        userData.is_store_device === true
      )

      // Check if user can access POS
      if (!canAccessPOS(effectiveRole)) {
        // Stock Manager cannot access POS - redirect to inventory
        if (effectiveRole === 'stock_manager') {
          router.push("/inventory")
          return
        }
        // For store devices without activeStaff, redirect to lock screen
        if (userData.is_store_device === true && !activeStaff) {
          router.push("/lock-screen")
          return
        }
        // Default redirect to dashboard
        router.push("/dashboard")
        return
      }

      // Store device: Must have activeStaff to access POS
      if (userData.is_store_device === true) {
        if (!activeStaff) {
          router.push("/lock-screen")
          return
        }
      }
    }
  }, [isAuthenticated, loading, router, userData, activeStaff, pathname])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    )
  }

  // Don't render POS if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Don't render POS for store devices without activeStaff
  if (userData?.is_store_device === true && !activeStaff) {
    return null
  }

  // Full screen layout - no sidebar, no TopBar, no BottomNav
  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      {/* Theme Sync - syncs theme from Firestore */}
      <ThemeSync />
      {children}
    </div>
  )
}

