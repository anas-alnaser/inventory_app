"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Coffee,
  LayoutGrid,
  Receipt,
  Clock,
  Percent,
  Settings,
  LogOut,
  Building2,
  Moon,
  Sun,
  Timer,
  Power,
  RefreshCw,
  Pause,
  FileText,
  Wallet,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/useAuth"
import { useStaff } from "@/lib/contexts/StaffContext"
import { canSeeBackToOffice, getEffectiveRole } from "@/lib/utils/role-permissions"
import { getActiveShift } from "@/lib/services/shift"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

interface QuickAction {
  id: string
  label: string
  icon: React.ReactNode
  action?: () => void
  href?: string
}

interface POSSidebarProps {
  onCloseShift?: () => void
  onDiscountClick?: () => void
  onRefundClick?: () => void
  onHoldClick?: () => void
  onHeldOrdersClick?: () => void
  onEODReport?: () => void
  onCashDrawer?: () => void
}

export function POSSidebar({
  onCloseShift,
  onDiscountClick,
  onRefundClick,
  onHoldClick,
  onHeldOrdersClick,
  onEODReport,
  onCashDrawer,
}: POSSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut, userData } = useAuth()
  const { activeStaff, clearActiveStaff } = useStaff()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const queryClient = useQueryClient()

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get effective role
  const effectiveRole = getEffectiveRole(
    userData?.role,
    activeStaff?.role,
    userData?.is_store_device === true
  )
  const showBackToOffice = canSeeBackToOffice(effectiveRole)

  // Fetch active shift for current staff
  const staffId = activeStaff?.id || userData?.id
  const { data: activeShift } = useQuery({
    queryKey: ["active-shift-sidebar", staffId],
    queryFn: async () => {
      if (!staffId) return null
      return getActiveShift(staffId)
    },
    enabled: !!staffId,
    refetchInterval: 60000, // Refresh every minute
  })

  // Calculate shift duration
  const getShiftDuration = () => {
    if (!activeShift?.startTime) return null
    const start = new Date(activeShift.startTime)
    const now = new Date()
    const diff = now.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const handleLogout = async () => {
    clearActiveStaff()
    await signOut()
    router.push("/login")
  }

  const toggleTheme = async () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark"

    // Update next-themes immediately for instant UI feedback
    setTheme(newTheme)

    // Also persist to Firestore so ThemeSync doesn't override
    if (userData?.id) {
      try {
        const userDocRef = doc(db, "users", userData.id)
        await updateDoc(userDocRef, { theme: newTheme })
        // Invalidate settings query so it picks up the new theme
        queryClient.invalidateQueries({ queryKey: ["user-settings", userData.id] })
      } catch (error) {
        console.error("Failed to save theme to database:", error)
      }
    }
  }

  // Use resolvedTheme to get the actual current theme (handles 'system' preference)
  const currentTheme = mounted ? resolvedTheme : "dark"

  const quickActions: QuickAction[] = [
    {
      id: "menu",
      label: "Menu",
      icon: <LayoutGrid className="h-5 w-5" />,
      href: "/pos",
    },
    {
      id: "history",
      label: "History",
      icon: <Clock className="h-5 w-5" />,
      href: "/pos/history",
    },
    {
      id: "held-orders",
      label: "Held Orders",
      icon: <Pause className="h-5 w-5" />,
      href: "/pos/held",
    },
    {
      id: "cash-drawer",
      label: "Drawer",
      icon: <Wallet className="h-5 w-5" />,
      href: "/pos/drawer",
    },
    {
      id: "eod-report",
      label: "EOD",
      icon: <FileText className="h-5 w-5" />,
      href: "/pos/eod",
    },
    {
      id: "reports",
      label: "Reports",
      icon: <Receipt className="h-5 w-5" />,
      href: "/pos/reports",
    },
  ]

  return (
    <aside className="w-20 lg:w-64 h-full bg-[#1e293b] border-r border-slate-700 flex flex-col flex-shrink-0 transition-all duration-300">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center lg:justify-start px-4 border-b border-slate-700">
        <Link href="/pos" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Coffee className="h-5 w-5 text-white" />
          </div>
          <span className="hidden lg:block text-lg font-bold text-sidebar-foreground">
            StockWave POS
          </span>
        </Link>
      </div>

      {/* Quick Actions */}
      <nav className="flex-1 px-2 lg:px-4 py-6 space-y-2 overflow-y-auto">
        {quickActions.map((action) => {
          const handleClick = () => {
            if (action.href) {
              router.push(action.href)
            } else if (action.action) {
              action.action()
            }
          }

          const isActive = action.href && pathname === action.href

          return (
            <motion.button
              key={action.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClick}
              className={cn(
                "w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-lg transition-all relative",
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 border-r-4 border-cyan-500"
                  : "text-slate-400 hover:text-cyan-400 hover:bg-slate-800",
                "focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              )}
            >
              {action.icon}
              <span className="hidden lg:block font-medium">{action.label}</span>
            </motion.button>
          )
        })}
      </nav>

      {/* Shift Status */}
      {activeShift && (
        <div className="px-2 lg:px-4 py-3 border-t border-slate-700">
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-3 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-500 hidden lg:block">Shift Active</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-lg font-bold text-foreground">{getShiftDuration()}</p>
              <p className="text-xs text-muted-foreground">
                Started {new Date(activeShift.startTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onCloseShift}
              className="w-full mt-2 h-8 text-xs border-orange-500/30 text-orange-500 hover:bg-orange-500/10 hover:text-orange-400"
            >
              <Power className="h-3 w-3 mr-1 lg:mr-2" />
              <span className="hidden lg:inline">Close Shift</span>
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="px-2 lg:px-4 py-4 space-y-2 border-t border-slate-700">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className="w-full justify-center lg:justify-start gap-3 h-11 text-muted-foreground hover:text-foreground"
        >
          {currentTheme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="hidden lg:block">
            {currentTheme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </Button>

        {showBackToOffice && (
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="w-full justify-center lg:justify-start gap-3 h-11 border-sidebar-border"
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden lg:block">Back to Office</span>
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={() => router.push("/settings")}
          className="w-full justify-center lg:justify-start gap-3 h-11 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden lg:block">Settings</span>
        </Button>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-center lg:justify-start gap-3 h-11 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden lg:block">Logout</span>
        </Button>
      </div>
    </aside>
  )
}
