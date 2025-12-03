"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAuth } from "@/lib/hooks/useAuth"
import { useRouter } from "next/navigation"

interface TopBarProps {
  notificationCount?: number
}

export function TopBar({
  notificationCount = 0,
}: TopBarProps) {
  const { userData, signOut } = useAuth()
  const router = useRouter()
  
  const userName = userData?.name || userData?.email || "User"
  const userEmail = userData?.email || ""
  
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        {/* App Name */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <img 
            src="/icon.svg" 
            alt="StockWave" 
            className="h-6 w-6 rounded object-contain"
          />
          <span className="font-semibold text-foreground hidden sm:inline">StockWave</span>
        </Link>

        {/* Right Side: Theme Toggle + Notifications + Avatar */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {notificationCount > 9 ? "9+" : notificationCount}
              </Badge>
            )}
          </Button>

          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={undefined} alt={userName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userName}</p>
                  {userEmail && (
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem>Help & Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
