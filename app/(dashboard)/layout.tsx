"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { TopBar } from "@/components/layout/TopBar"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"
import { OfflineIndicator } from "@/components/layout/OfflineIndicator"
import { ThemeSync } from "@/components/layout/ThemeSync"
import { useAuth } from "@/lib/hooks/useAuth"
import { useStaff } from "@/lib/contexts/StaffContext"
import { Skeleton } from "@/components/ui/skeleton"
import { canAccessDashboard, canAccessRoute, getEffectiveRole } from "@/lib/utils/role-permissions"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading, userData } = useAuth()
  const { activeStaff } = useStaff()

  // Protect dashboard routes - redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
      return
    }

    // If authenticated, check user type and permissions
    if (!loading && isAuthenticated && userData) {
      // Get effective role (for store devices, use activeStaff role)
      const effectiveRole = getEffectiveRole(
        userData.role,
        activeStaff?.role,
        userData.is_store_device === true
      )

      // Cashier cannot access dashboard routes - redirect to POS
      if (effectiveRole === 'cashier') {
        router.push("/pos")
        return
      }

      // Check if user can access the current route
      if (!canAccessRoute(effectiveRole, pathname)) {
        // If cannot access route, redirect based on role
        if (effectiveRole === 'stock_manager') {
          // Stock Manager should go to inventory
          router.push("/inventory")
        } else if (canAccessDashboard(effectiveRole)) {
          // If can access dashboard, go to dashboard
          router.push("/dashboard")
        } else {
          // Default: redirect to POS if they can access it, otherwise lock screen
          if (effectiveRole && ['manager', 'supervisor', 'owner'].includes(effectiveRole)) {
            router.push("/pos")
          } else {
            router.push("/lock-screen")
          }
        }
        return
      }

      // Owner: Allow access directly
      if (userData.role === 'owner') {
        // Owners can access dashboard directly
        return
      }

      // Store device: Must have activeStaff to access dashboard
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

  // Don't render dashboard if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Don't render dashboard for store devices without activeStaff
  if (userData?.is_store_device === true && !activeStaff) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Theme Sync - syncs theme from Firestore */}
      <ThemeSync />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Offline Indicator */}
        <OfflineIndicator />

        {/* Top Bar (visible on all screens) */}
        <TopBar notificationCount={5} />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto pb-20 md:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  )
}
