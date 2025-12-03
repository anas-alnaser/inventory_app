"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { TopBar } from "@/components/layout/TopBar"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"
import { OfflineIndicator } from "@/components/layout/OfflineIndicator"
import { useAuth } from "@/lib/hooks/useAuth"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  // Protect dashboard routes - redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, loading, router])

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

  return (
    <div className="flex min-h-screen bg-background">
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
