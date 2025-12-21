"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/hooks/useAuth"
import { useStaff } from "@/lib/contexts/StaffContext"

export function StoreDeviceGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { userData, loading: authLoading } = useAuth()
  const { activeStaff } = useStaff()

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return

    // If user is a store device and doesn't have activeStaff
    if (userData?.is_store_device === true && !activeStaff) {
      // Force redirect to lock-screen if not already there
      if (pathname !== "/lock-screen") {
        router.push("/lock-screen")
      }
    }
  }, [userData, activeStaff, pathname, router, authLoading])

  // Don't render children if store device without activeStaff (except on lock-screen)
  if (!authLoading && userData?.is_store_device === true && !activeStaff && pathname !== "/lock-screen") {
    return null
  }

  return <>{children}</>
}

