import { UserRole } from '@/types/entities'

/**
 * Check if a role can access the POS route
 */
export function canAccessPOS(role: UserRole | null | undefined): boolean {
  if (!role) return false

  // Cashier, Manager, Supervisor, and Owner can access POS
  return ['cashier', 'manager', 'supervisor', 'owner'].includes(role)
}

/**
 * Check if a role can access dashboard routes
 */
export function canAccessDashboard(role: UserRole | null | undefined): boolean {
  if (!role) return false

  // Stock Manager, Manager, Supervisor, and Owner can access dashboard
  return ['stock_manager', 'manager', 'supervisor', 'owner'].includes(role)
}

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(role: UserRole | null | undefined, route: string): boolean {
  if (!role) return false

  // Normalize route to handle leading/trailing slashes
  const normalizedRoute = route.replace(/^\/+|\/+$/g, '')

  // POS route
  if (normalizedRoute === 'pos' || normalizedRoute.startsWith('pos/')) {
    return canAccessPOS(role)
  }

  // Dashboard routes (inventory, suppliers, reports, etc.)
  const dashboardRoutes = [
    'dashboard',
    'inventory',
    'suppliers',
    'reports',
    'forecasts',
    'anomalies',
    'orders',
    'deliveries',
    'menu-items',
    'sales',
    'users',
    'settings',
  ]

  const isDashboardRoute = dashboardRoutes.some(
    (r) => normalizedRoute === r || normalizedRoute.startsWith(`${r}/`)
  )

  if (isDashboardRoute) {
    // Cashier cannot access dashboard routes
    if (role === 'cashier') {
      return false
    }
    // All other roles can access dashboard routes
    return canAccessDashboard(role)
  }

  // Default: allow access for manager, supervisor, owner
  return ['manager', 'supervisor', 'owner'].includes(role)
}

/**
 * Get the effective role to check permissions
 * For store devices, use activeStaff role; otherwise use userData role
 */
export function getEffectiveRole(
  userRole: UserRole | null | undefined,
  activeStaffRole: UserRole | null | undefined,
  isStoreDevice: boolean = false
): UserRole | null {
  // If it's a store device, use activeStaff role if available
  if (isStoreDevice) {
    return activeStaffRole || null
  }

  // Otherwise use the user's role
  return userRole || null
}

/**
 * Check if role can see "Back to Office" button (Manager/Supervisor/Owner only)
 */
export function canSeeBackToOffice(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return ['manager', 'supervisor', 'owner'].includes(role)
}

/**
 * Check if role can see "Launch POS" button (Manager/Supervisor/Owner/Cashier)
 */
export function canSeeLaunchPOS(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return ['manager', 'supervisor', 'owner', 'cashier'].includes(role)
}

/**
 * Check if role can void transactions (Manager/Supervisor/Owner only)
 */
export function canVoidTransactions(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return ['manager', 'supervisor', 'owner'].includes(role)
}

/**
 * Check if role can view reports (Manager/Supervisor/Owner only)
 */
export function canViewReports(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return ['manager', 'supervisor', 'owner'].includes(role)
}

/**
 * Check if role can export reports (Manager/Owner only - not supervisor)
 */
export function canExportReports(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return ['manager', 'owner'].includes(role)
}

/**
 * Check if role can manage staff (Owner/Manager only)
 */
export function canManageStaff(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return ['manager', 'owner'].includes(role)
}

/**
 * Check if role can apply large discounts (>30%) without notification
 */
export function canApplyLargeDiscounts(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return ['manager', 'owner'].includes(role)
}

/**
 * Check if role can close shifts for other staff
 */
export function canCloseOtherShifts(role: UserRole | null | undefined): boolean {
  if (!role) return false
  return ['manager', 'supervisor', 'owner'].includes(role)
}
