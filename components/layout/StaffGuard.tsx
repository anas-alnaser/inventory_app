"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useStaff } from '@/lib/contexts/StaffContext'
import { Loader2 } from 'lucide-react'

interface StaffGuardProps {
    children: React.ReactNode
}

/**
 * StaffGuard - Protects routes based on staff authentication and role
 * 
 * Behavior:
 * - If loading: Shows spinner
 * - If no staff: Redirects to /lock-screen
 * - If staff exists: Checks role-based access
 *   - cashier trying to access /inventory, /dashboard, /settings -> Redirect to /pos
 *   - stock_manager trying to access /pos -> Redirect to /dashboard
 */
export function StaffGuard({ children }: StaffGuardProps) {
    const router = useRouter()
    const pathname = usePathname()
    const { activeStaff, isLoading } = useStaff()

    useEffect(() => {
        // Wait for loading to complete
        if (isLoading) return

        // No staff logged in - redirect to lock screen
        if (!activeStaff) {
            router.replace('/lock-screen')
            return
        }

        const role = activeStaff.role

        // Role-based access control
        // Cashiers can only access POS
        if (role === 'cashier') {
            const restrictedForCashier = ['/dashboard', '/inventory', '/settings', '/users', '/reports', '/suppliers', '/ingredients', '/menu-items', '/orders', '/anomalies', '/forecasts', '/analytics']
            const isRestricted = restrictedForCashier.some(path => pathname.startsWith(path))

            if (isRestricted) {
                router.replace('/pos')
                return
            }
        }

        // Stock managers cannot access POS
        if (role === 'stock_manager') {
            if (pathname.startsWith('/pos')) {
                router.replace('/dashboard')
                return
            }
        }

    }, [activeStaff, isLoading, pathname, router])

    // Loading state
    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    // No staff - will redirect (don't render anything to prevent flash)
    if (!activeStaff) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Redirecting to login...</p>
                </div>
            </div>
        )
    }

    // Staff is authenticated and authorized - render children
    return <>{children}</>
}
