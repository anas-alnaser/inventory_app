"use client"

import { useState, useMemo, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Search, Bell, Menu as MenuIcon, Lock, Building2, User, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/hooks/useAuth"
import { CartProvider, useCart, type CartItemModifier } from "@/lib/stores/pos-cart"
import { getMenuItemsWithFinancials } from "@/lib/services/menu"
import { calculateInvoiceTotals, formatCurrency, type CartItem as TaxCartItem } from "@/lib/services/tax"
import { getRestaurantByBranch, getDefaultRestaurantSettings } from "@/lib/services/restaurants"
import { submitInvoice } from "@/lib/services/invoices"
import { InvoiceReceipt } from "@/components/pos/InvoiceReceipt"
import { CloseShiftModal } from "@/components/pos/CloseShiftModal"
import { OpenShiftModal } from "@/components/pos/OpenShiftModal"
import { DiscountDialog } from "@/components/pos/DiscountDialog"
import { RefundDialog } from "@/components/pos/RefundDialog"
import { HoldOrderDialog } from "@/components/pos/HoldOrderDialog"
import { HoldOrdersList } from "@/components/pos/HoldOrdersList"
import { SplitPaymentDialog } from "@/components/pos/SplitPaymentDialog"
import { EODReportDialog } from "@/components/pos/EODReportDialog"
import { CashDrawerDialog } from "@/components/pos/CashDrawerDialog"
import { useStaff } from "@/lib/contexts/StaffContext"
import { getActiveShift } from "@/lib/services/shift"
import { getActiveAttendance } from "@/lib/services/attendance"
import { canSeeBackToOffice, getEffectiveRole } from "@/lib/utils/role-permissions"
import type { MenuItem, Invoice, Shift } from "@/types/entities"
import { POSSidebar } from "@/components/pos/POSSidebar"
import { MenuGrid } from "@/components/pos/MenuGrid"
import { POSCart } from "@/components/pos/POSCart"
import { ModifierDialog } from "@/components/pos/ModifierDialog"
import type { HoldOrder, getHoldOrders } from "@/lib/services/hold-orders"

function POSContent() {
  const router = useRouter()
  const { userData } = useAuth()
  const { activeStaff, clearActiveStaff, setActiveStaff } = useStaff()
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    updateModifiers,
    clearCart,
    getItemQuantity,
    discount,
    setDiscount,
    getCartTotal,
    getDiscountAmount,
  } = useCart()

  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false)
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false)
  const [isDiscountOpen, setIsDiscountOpen] = useState(false)
  const [isRefundOpen, setIsRefundOpen] = useState(false)
  const [isHoldOrderOpen, setIsHoldOrderOpen] = useState(false)
  const [isHeldOrdersOpen, setIsHeldOrdersOpen] = useState(false)
  const [isSplitPaymentOpen, setIsSplitPaymentOpen] = useState(false)
  const [isEODReportOpen, setIsEODReportOpen] = useState(false)
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)
  const [isModifierDialogOpen, setIsModifierDialogOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Get effective role for permission checks
  const effectiveRole = getEffectiveRole(
    userData?.role,
    activeStaff?.role,
    userData?.is_store_device === true
  )

  // Check if user can see "Back to Office" button
  const showBackToOffice = canSeeBackToOffice(effectiveRole)

  // Handle lock screen - clears activeStaff without closing shift
  const handleLockScreen = () => {
    clearActiveStaff()
    router.push("/lock-screen")
  }

  // Check if cashier needs to open shift (active_shift_id is null)
  useEffect(() => {
    if (activeStaff && activeStaff.role === 'cashier' && !activeStaff.active_shift_id) {
      setIsOpenShiftModalOpen(true)
    }
  }, [activeStaff])

  // Check for recalled orders from sessionStorage (when returning from /pos/held)
  useEffect(() => {
    const recalledOrderData = sessionStorage.getItem("recalledOrder")
    if (recalledOrderData) {
      try {
        const order = JSON.parse(recalledOrderData) as HoldOrder
        // Clear sessionStorage immediately to prevent re-processing
        sessionStorage.removeItem("recalledOrder")

        // Clear existing cart and restore the held order
        clearCart()

        // Add each item from the held order
        order.items.forEach((item) => {
          addItem({
            menuItemId: item.menuItemId,
            name: item.name,
            price: item.price,
            taxRate: item.taxRate,
            isTaxExempt: item.isTaxExempt,
          }, item.modifiers)
        })

        // Restore discount if any
        if (order.discountType && order.discountValue) {
          setDiscount({
            id: `discount-${Date.now()}`,
            type: order.discountType,
            value: order.discountValue,
            name: order.discountType === 'percentage'
              ? `${order.discountValue}% Off`
              : `${order.discountValue} JOD Off`
          })
        }

        toast({
          title: "Order Restored",
          description: order.customerName
            ? `Order for "${order.customerName}" has been restored`
            : "Your held order has been restored",
        })
      } catch (error) {
        console.error("Error restoring recalled order:", error)
      }
    }
  }, [clearCart, addItem, setDiscount])

  // Fetch active shift for cashier
  const { data: activeShift, refetch: refetchShift } = useQuery({
    queryKey: ["active-shift", activeStaff?.id],
    queryFn: async () => {
      if (!activeStaff || activeStaff.role !== 'cashier') {
        return null
      }
      // getActiveShift returns Shift | null directly
      const shift = await getActiveShift(activeStaff.id)
      return shift
    },
    enabled: !!activeStaff && activeStaff.role === 'cashier',
  })

  // Fetch active attendance
  const { data: activeAttendance } = useQuery({
    queryKey: ["active-attendance", activeStaff?.id],
    queryFn: async () => {
      if (!activeStaff) {
        return null
      }
      const result = await getActiveAttendance(activeStaff.id)
      return result.success ? result.attendance : null
    },
    enabled: !!activeStaff,
  })

  // Fetch menu items
  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ["menu-items-pos"],
    queryFn: () => getMenuItemsWithFinancials(),
  })

  // Fetch restaurant settings
  const { data: restaurant, isLoading: restaurantLoading } = useQuery({
    queryKey: ["restaurant", userData?.branchId],
    queryFn: async () => {
      if (!userData?.branchId) {
        throw new Error('Branch ID is required')
      }
      // Try to get restaurant by branch, fallback to default
      const restaurantByBranch = await getRestaurantByBranch(userData.branchId)
      if (restaurantByBranch) {
        return restaurantByBranch
      }
      return getDefaultRestaurantSettings(userData.branchId)
    },
    enabled: !!userData?.id && !!userData?.branchId,
  })

  // Calculate totals with discount
  const totals = useMemo(() => {
    const subtotal = getCartTotal()
    const discountAmount = getDiscountAmount()
    const afterDiscount = subtotal - discountAmount

    // Calculate tax on discounted amount
    const taxAmount = afterDiscount * 0.16 // Default 16% tax
    const grandTotal = afterDiscount + taxAmount

    return {
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
    }
  }, [getCartTotal, getDiscountAmount])

  // Handle adding item - open modifier dialog for customization
  const handleAddItem = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem)
    setIsModifierDialogOpen(true)
  }

  // Handle quick add without modifiers
  const handleQuickAdd = (menuItem: MenuItem) => {
    addItem({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      taxRate: menuItem.taxRate ?? 0.16,
      isTaxExempt: menuItem.isTaxExempt ?? false,
    })
  }

  // Handle adding item with modifiers from dialog
  const handleAddWithModifiers = (modifiers: CartItemModifier[], notes: string, quantity: number) => {
    if (!selectedMenuItem) return

    for (let i = 0; i < quantity; i++) {
      addItem(
        {
          menuItemId: selectedMenuItem.id,
          name: selectedMenuItem.name,
          price: selectedMenuItem.price,
          taxRate: selectedMenuItem.taxRate ?? 0.16,
          isTaxExempt: selectedMenuItem.isTaxExempt ?? false,
        },
        modifiers
      )
    }
    setSelectedMenuItem(null)
  }

  // Handle quantity change from menu grid
  const handleQuantityChange = (menuItemId: string, delta: number) => {
    // Find all cart items with this menuItemId and update the first one
    const cartItem = items.find((i) => i.menuItemId === menuItemId)
    if (cartItem) {
      const newQuantity = cartItem.quantity + delta
      if (newQuantity <= 0) {
        removeItem(cartItem.id)
      } else {
        updateQuantity(cartItem.id, newQuantity)
      }
    }
  }

  // Handle quantity change from cart (uses cartLineId)
  const handleCartQuantityChange = (cartLineId: string, delta: number) => {
    const cartItem = items.find((i) => i.id === cartLineId)
    if (cartItem) {
      const newQuantity = cartItem.quantity + delta
      if (newQuantity <= 0) {
        removeItem(cartLineId)
      } else {
        updateQuantity(cartLineId, newQuantity)
      }
    }
  }

  // Invoice submission mutation
  const submitInvoiceMutation = useMutation({
    mutationFn: async (paymentMethod: 'Cash' | 'Visa' | 'CliQ') => {
      if (!userData?.id) {
        throw new Error("User must be logged in")
      }
      if (!restaurant) {
        throw new Error("Restaurant settings not loaded")
      }

      const cartItems: TaxCartItem[] = items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price + item.modifiers.reduce((sum, m) => sum + m.price, 0),
        quantity: item.quantity,
        taxRate: item.taxRate,
        isTaxExempt: item.isTaxExempt,
      }))

      if (!userData?.branchId) {
        throw new Error("Branch ID is required for data isolation")
      }

      const result = await submitInvoice({
        cartItems,
        paymentMethod,
        branchId: userData.branchId,
        cashierId: userData.id,
        discount: discount ? {
          type: discount.type,
          value: discount.value,
          name: discount.name,
        } : undefined,
      })

      if (!result.success || !result.invoice) {
        throw new Error(result.error || "Failed to submit invoice")
      }

      return result.invoice
    },
    onSuccess: (invoice) => {
      setCompletedInvoice(invoice)
      setIsReceiptOpen(true)
      clearCart()
      toast({
        title: "Order Complete!",
        description: `Invoice ${invoice.invoiceNumber} has been created successfully.`,
        variant: "default",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      })
    },
  })

  const handlePayment = (paymentMethod: 'Cash' | 'Visa' | 'CliQ') => {
    console.log('handlePayment called with:', paymentMethod)
    console.log('items:', items.length)
    console.log('userData:', userData?.id, userData?.branchId)
    console.log('restaurant:', restaurant?.name)

    if (items.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to the cart before processing payment",
        variant: "destructive",
      })
      return
    }

    if (!userData?.id || !userData?.branchId) {
      toast({
        title: "Session Error",
        description: "Please log in again to process payment",
        variant: "destructive",
      })
      return
    }

    if (!restaurant) {
      toast({
        title: "Settings Error",
        description: "Restaurant settings not loaded. Please refresh.",
        variant: "destructive",
      })
      return
    }

    submitInvoiceMutation.mutate(paymentMethod)
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  if (menuLoading || restaurantLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full mx-auto"
          />
          <p className="text-muted-foreground">Loading POS...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Left Sidebar */}
      <POSSidebar
        onCloseShift={() => setIsCloseShiftModalOpen(true)}
        onDiscountClick={() => setIsDiscountOpen(true)}
        onRefundClick={() => setIsRefundOpen(true)}
        onHoldClick={() => setIsHoldOrderOpen(true)}
        onHeldOrdersClick={() => setIsHeldOrdersOpen(true)}
        onEODReport={() => setIsEODReportOpen(true)}
        onCashDrawer={() => setIsCashDrawerOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 flex-shrink-0">
          {/* Left: Date & Time */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
              <span className="text-sm font-bold text-foreground">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
            </div>
          </div>

          {/* Right: User & Actions */}
          <div className="flex items-center gap-3">
            {/* Shift Status */}
            {activeShift && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                Shift Active
              </Badge>
            )}

            {/* User Info */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-foreground">
                  {activeStaff?.name || userData?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {effectiveRole || 'Staff'}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/30">
                {(activeStaff?.name || userData?.name || "U")[0].toUpperCase()}
              </div>
            </div>

            {/* Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {showBackToOffice && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard")}
                      className="cursor-pointer"
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Back to Office
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {activeStaff && activeStaff.role === 'cashier' && activeShift && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setIsCloseShiftModalOpen(true)}
                      className="text-destructive cursor-pointer"
                    >
                      Close Shift
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={handleLockScreen}
                  className="cursor-pointer"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Lock Screen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Menu Grid */}
        <MenuGrid
          menuItems={menuItems}
          onAddItem={handleAddItem}
          onQuantityChange={handleQuantityChange}
          getItemQuantity={getItemQuantity}
          isLoading={menuLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Right Panel - Cart */}
      <POSCart
        items={items}
        discount={discount}
        totals={totals}
        onQuantityChange={handleCartQuantityChange}
        onRemoveItem={removeItem}
        onUpdateModifiers={updateModifiers}
        onPayment={handlePayment}
        onSetDiscount={setDiscount}
        onHoldClick={() => setIsHoldOrderOpen(true)}
        onHeldOrdersClick={() => setIsHeldOrdersOpen(true)}
        isProcessing={submitInvoiceMutation.isPending}
      />

      {/* Modifier Dialog */}
      <ModifierDialog
        open={isModifierDialogOpen}
        onOpenChange={setIsModifierDialogOpen}
        menuItem={selectedMenuItem}
        onAddToCart={handleAddWithModifiers}
      />

      {/* Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Complete</DialogTitle>
            <DialogDescription>
              Your invoice has been created successfully
            </DialogDescription>
          </DialogHeader>
          {completedInvoice && restaurant && (
            <InvoiceReceipt
              invoice={completedInvoice}
              restaurantName={restaurant.name}
              onPrint={handlePrintReceipt}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Open Shift Modal - Shows immediately for cashiers without active shift */}
      {activeStaff && activeStaff.role === 'cashier' && (
        <OpenShiftModal
          open={isOpenShiftModalOpen}
          onOpenChange={(open) => {
            // Prevent closing if shift hasn't been opened yet
            if (!open && !activeStaff.active_shift_id && !activeShift) {
              return
            }
            setIsOpenShiftModalOpen(open)
          }}
          staffId={activeStaff.id}
          staffName={activeStaff.name || 'Staff'}
          branchId={userData?.branchId || ''}
          onShiftOpened={(shift: Shift) => {
            // Update activeStaff in context with the new active_shift_id
            if (activeStaff) {
              setActiveStaff({
                ...activeStaff,
                active_shift_id: shift.id,
              })
            }
            refetchShift()
            setIsOpenShiftModalOpen(false)
            toast({
              title: "Shift Opened",
              description: "You can now process transactions.",
            })
          }}
        />
      )}

      {/* Close Shift Modal */}
      {activeShift && activeStaff && (
        <CloseShiftModal
          open={isCloseShiftModalOpen}
          onOpenChange={setIsCloseShiftModalOpen}
          shift={activeShift}
          staffName={activeStaff.name || 'Staff'}
          onShiftClosed={() => {
            refetchShift()
            setIsCloseShiftModalOpen(false)
            if (activeStaff) {
              setActiveStaff({
                ...activeStaff,
                active_shift_id: undefined,
              })
            }
            toast({
              title: "Shift Closed",
              description: "Your shift has been closed successfully.",
            })
          }}
        />
      )}

      {/* Discount Dialog */}
      <DiscountDialog
        open={isDiscountOpen}
        onOpenChange={setIsDiscountOpen}
        subtotal={getCartTotal()}
        branchId={userData?.branchId || ''}
        restaurantId={restaurant?.id || ''}
        onApplyDiscount={(type, value, discountAmount) => {
          setDiscount({
            id: `discount-${Date.now()}`,
            type,
            value,
            name: type === 'percentage' ? `${value}% Off` : `${value} JOD Off`
          })
          toast({
            title: "Discount Applied",
            description: type === 'percentage'
              ? `${value}% discount applied to your order`
              : `${value} JOD discount applied to your order`,
          })
        }}
      />

      {/* Refund Dialog */}
      <RefundDialog
        open={isRefundOpen}
        onOpenChange={setIsRefundOpen}
        branchId={userData?.branchId || ''}
        restaurantId={restaurant?.id || ''}
        processedBy={activeStaff?.id || userData?.id || ''}
        processedByName={activeStaff?.name || userData?.name || 'Staff'}
        onRefundComplete={() => {
          toast({
            title: "Refund Processed",
            description: "The refund has been processed successfully.",
          })
        }}
      />

      {/* Hold Order Dialog */}
      <HoldOrderDialog
        open={isHoldOrderOpen}
        onOpenChange={setIsHoldOrderOpen}
        cartItems={items}
        discountType={discount?.type}
        discountValue={discount?.value}
        branchId={userData?.branchId || ''}
        createdBy={activeStaff?.id || userData?.id || ''}
        createdByName={activeStaff?.name || userData?.name || 'Staff'}
        onOrderHeld={() => {
          clearCart()
          toast({
            title: "Order Held",
            description: "Your order has been saved for later.",
          })
        }}
      />

      {/* Held Orders List */}
      <HoldOrdersList
        open={isHeldOrdersOpen}
        onOpenChange={setIsHeldOrdersOpen}
        branchId={userData?.branchId || ''}
        onRecallOrder={(order: HoldOrder) => {
          // Restore cart from held order
          clearCart()
          order.items.forEach((item) => {
            addItem({
              menuItemId: item.menuItemId,
              name: item.name,
              price: item.price,
              taxRate: item.taxRate,
              isTaxExempt: item.isTaxExempt,
            }, item.modifiers)
          })
          // Restore discount if any
          if (order.discountType && order.discountValue) {
            setDiscount({
              id: `discount-${Date.now()}`,
              type: order.discountType,
              value: order.discountValue,
              name: order.discountType === 'percentage'
                ? `${order.discountValue}% Off`
                : `${order.discountValue} JOD Off`
            })
          }
          toast({
            title: "Order Recalled",
            description: order.customerName
              ? `Order for "${order.customerName}" has been restored`
              : "Your order has been restored",
          })
        }}
      />

      {/* EOD Report Dialog */}
      <EODReportDialog
        open={isEODReportOpen}
        onOpenChange={setIsEODReportOpen}
        branchId={userData?.branchId || ''}
        generatedBy={activeStaff?.id || userData?.id || ''}
        generatedByName={activeStaff?.name || userData?.name || 'Staff'}
        businessName={restaurant?.name || 'StockWave'}
      />

      {/* Cash Drawer Dialog */}
      <CashDrawerDialog
        open={isCashDrawerOpen}
        onOpenChange={setIsCashDrawerOpen}
        branchId={userData?.branchId || ''}
        shiftId={activeShift?.id}
        staffId={activeStaff?.id || userData?.id || ''}
        staffName={activeStaff?.name || userData?.name || 'Staff'}
      />
    </div>
  )
}

export default function POSPage() {
  return (
    <CartProvider>
      <POSContent />
    </CartProvider>
  )
}
