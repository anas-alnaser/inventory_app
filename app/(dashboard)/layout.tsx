"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/layout/TopBar"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"
import { OfflineIndicator } from "@/components/layout/OfflineIndicator"
import { ThemeSync } from "@/components/layout/ThemeSync"
import { StaffGuard } from "@/components/layout/StaffGuard"
import { useAuth } from "@/lib/hooks/useAuth"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login")
    }
  }, [isAuthenticated, loading, router])

  // Show loading state while checking auth
  if (loading) {
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
    </StaffGuard>
  )
}
