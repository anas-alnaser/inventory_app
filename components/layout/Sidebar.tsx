"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Package,
  Truck,
  BarChart3,
  Settings,
  Users,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  ChefHat,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/hooks/useAuth"
import { useRouter } from "next/navigation"

interface SidebarItem {
  href: string
  label: string
  icon: React.ReactNode
  badge?: string | number
  badgeVariant?: "default" | "warning" | "destructive"
}

interface SidebarSection {
  title?: string
  items: SidebarItem[]
}

const sidebarSections: SidebarSection[] = [
  {
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
      {
        href: "/inventory",
        label: "Inventory",
        icon: <Package className="h-5 w-5" />,
        badge: 3,
        badgeVariant: "warning",
      },
      {
        href: "/suppliers",
        label: "Suppliers",
        icon: <Truck className="h-5 w-5" />,
      },
      {
        href: "/menu-items",
        label: "Menu Items",
        icon: <ChefHat className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        href: "/reports",
        label: "Reports",
        icon: <BarChart3 className="h-5 w-5" />,
      },
      {
        href: "/forecasts",
        label: "AI Forecasts",
        icon: <Sparkles className="h-5 w-5" />,
      },
      {
        href: "/anomalies",
        label: "Anomalies",
        icon: <AlertTriangle className="h-5 w-5" />,
        badge: 2,
        badgeVariant: "destructive",
      },
    ],
  },
  {
    title: "Admin",
    items: [
      {
        href: "/users",
        label: "User Management",
        icon: <Users className="h-5 w-5" />,
      },
      {
        href: "/settings",
        label: "Settings",
        icon: <Settings className="h-5 w-5" />,
      },
    ],
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { userData, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 sticky top-0",
        collapsed ? "w-[72px]" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <Link href="/dashboard" className="flex items-center gap-2">
                <img 
                  src="/icon.svg" 
                  alt="StockWave" 
                  className="h-8 w-8 rounded-lg object-contain"
                />
                <span className="font-bold text-lg text-foreground">StockWave</span>
              </Link>
            </motion.div>
          )}
          {collapsed && (
            <Link href="/dashboard" className="flex h-8 w-8 items-center justify-center">
              <img 
                src="/icon.svg" 
                alt="StockWave" 
                className="h-8 w-8 rounded-lg object-contain"
              />
            </Link>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {sidebarSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-4">
            {section.title && !collapsed && (
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
            )}
            {section.title && collapsed && <Separator className="my-2" />}
            
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors relative group",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <span
                        className={cn(
                          "shrink-0",
                          isActive && "text-primary"
                        )}
                      >
                        {item.icon}
                      </span>
                      
                      <AnimatePresence mode="wait">
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {item.badge && !collapsed && (
                        <span
                          className={cn(
                            "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                            item.badgeVariant === "destructive" &&
                              "bg-destructive/10 text-destructive",
                            item.badgeVariant === "warning" &&
                              "bg-warning/10 text-warning",
                            !item.badgeVariant && "bg-muted text-muted-foreground"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}

                      {item.badge && collapsed && (
                        <span
                          className={cn(
                            "absolute right-1 top-1 h-2 w-2 rounded-full",
                            item.badgeVariant === "destructive" && "bg-destructive",
                            item.badgeVariant === "warning" && "bg-warning",
                            !item.badgeVariant && "bg-muted-foreground"
                          )}
                        />
                      )}

                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebarActiveIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary"
                        />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        {!collapsed && userData && (
          <div className="mb-2 px-3 py-2 text-sm">
            <p className="font-medium text-foreground truncate">{userData.name}</p>
            <p className="text-xs text-muted-foreground truncate">{userData.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </aside>
  )
}
