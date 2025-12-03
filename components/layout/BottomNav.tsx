"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { 
  LayoutDashboard, 
  Package, 
  Plus, 
  Truck, 
  Menu as MenuIcon 
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: <Package className="h-5 w-5" />,
  },
  {
    href: "#action",
    label: "Action",
    icon: <Plus className="h-6 w-6" />,
  },
  {
    href: "/suppliers",
    label: "Suppliers",
    icon: <Truck className="h-5 w-5" />,
  },
  {
    href: "/menu",
    label: "Menu",
    icon: <MenuIcon className="h-5 w-5" />,
  },
]

interface QuickAction {
  label: string
  icon: React.ReactNode
  onClick?: () => void
  href?: string
}

interface BottomNavProps {
  quickActions?: QuickAction[]
}

export function BottomNav({ quickActions }: BottomNavProps) {
  const pathname = usePathname()

  const defaultQuickActions: QuickAction[] = [
    {
      label: "Log Usage",
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
          <Package className="h-6 w-6 text-warning" />
        </div>
      ),
      href: "/inventory/usage",
    },
    {
      label: "Add Stock",
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
          <Plus className="h-6 w-6 text-success" />
        </div>
      ),
      href: "/inventory/add",
    },
    {
      label: "Receive Delivery",
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Truck className="h-6 w-6 text-primary" />
        </div>
      ),
      href: "/deliveries/receive",
    },
    {
      label: "Log Waste",
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
          <Package className="h-6 w-6 text-destructive" />
        </div>
      ),
      href: "/inventory/waste",
    },
  ]

  const actions = quickActions || defaultQuickActions

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background with blur */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-lg border-t border-border" />
      
      {/* Nav items */}
      <div className="relative flex items-center justify-around px-2 pb-safe h-16">
        {navItems.map((item) => {
          const isActive = item.href !== "#action" && pathname === item.href
          const isActionButton = item.href === "#action"

          if (isActionButton) {
            return (
              <Sheet key={item.href}>
                <SheetTrigger asChild>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="relative flex h-14 w-14 -mt-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  >
                    {item.icon}
                  </motion.button>
                </SheetTrigger>
                <SheetContent side="bottom" className="pb-8">
                  <SheetHeader className="pb-4">
                    <SheetTitle>Quick Actions</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-2 gap-4">
                    {actions.map((action, actionIndex) => (
                      <Button
                        key={actionIndex}
                        variant="ghost"
                        className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-accent"
                        asChild={!!action.href}
                        onClick={action.onClick}
                      >
                        {action.href ? (
                          <Link href={action.href}>
                            {action.icon}
                            <span className="text-sm font-medium text-foreground">
                              {action.label}
                            </span>
                          </Link>
                        ) : (
                          <>
                            {action.icon}
                            <span className="text-sm font-medium text-foreground">
                              {action.label}
                            </span>
                          </>
                        )}
                      </Button>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <motion.div
                initial={false}
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {item.icon}
              </motion.div>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-2 h-1 w-8 rounded-full bg-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
