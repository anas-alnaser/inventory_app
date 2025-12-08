"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Menu as MenuIcon,
  BarChart3,
  Users,
  Settings,
  Sparkles,
  AlertTriangle,
  ChefHat,
  LogOut
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
import { useAuth } from "@/lib/hooks/useAuth"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const mainNavItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-6 w-6" />,
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: <Package className="h-6 w-6" />,
  },
  {
    href: "/orders",
    label: "Orders",
    icon: <Truck className="h-6 w-6" />,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: <BarChart3 className="h-6 w-6" />,
  },
]

const menuItems: NavItem[] = [
  { href: "/suppliers", label: "Suppliers", icon: <Truck className="h-5 w-5" /> },
  { href: "/menu-items", label: "Menu Items", icon: <ChefHat className="h-5 w-5" /> },
  { href: "/forecasts", label: "AI Forecasts", icon: <Sparkles className="h-5 w-5" /> },
  { href: "/anomalies", label: "Anomalies", icon: <AlertTriangle className="h-5 w-5" /> },
  { href: "/users", label: "Users", icon: <Users className="h-5 w-5" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
      {/* Background with blur and shadow */}
      <div className="absolute inset-0 bg-background/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]" />
      
      {/* Nav items */}
      <div className="relative flex items-center justify-between px-6 h-20">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 transition-colors z-10",
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
              <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          )
        })}

        {/* Menu Drawer */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 transition-colors text-muted-foreground hover:text-foreground z-10"
              )}
            >
              <MenuIcon className="h-6 w-6" />
              <span className="text-[10px] font-medium tracking-wide">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80%] sm:w-[385px] pt-12 overflow-y-auto">
            <SheetHeader className="mb-6 text-left px-2">
              <SheetTitle className="text-2xl font-bold">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-lg transition-colors",
                    pathname === item.href
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  <span className={cn(pathname === item.href ? "text-primary" : "text-muted-foreground")}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}

              <div className="my-2 border-t border-border" />

              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="justify-start px-4 py-6 text-destructive hover:text-destructive hover:bg-destructive/10 gap-4"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
