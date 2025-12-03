"use client"

import { TopBar } from "@/components/layout/TopBar"
import { Sidebar } from "@/components/layout/Sidebar"
import { BottomNav } from "@/components/layout/BottomNav"
import { OfflineIndicator } from "@/components/layout/OfflineIndicator"

// Mock data for development
const mockUser = {
  name: "Ahmed Hassan",
  avatar: undefined,
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
