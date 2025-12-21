"use client"

import { useState } from "react"
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  CreditCard,
  QrCode,
  Banknote,
  Percent,
  Tag,
  X,
  Edit3,
  ChevronRight,
  Pause,
  ClipboardList
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/services/tax"
import { cn } from "@/lib/utils"
import type { CartItem, CartDiscount, CartItemModifier } from "@/lib/stores/pos-cart"

interface POSCartProps {
  items: CartItem[]
  discount: CartDiscount | null
  totals: {
    subtotal: number
    discountAmount: number
    taxAmount: number
    grandTotal: number
  }
  onQuantityChange: (cartLineId: string, delta: number) => void
  onRemoveItem: (cartLineId: string) => void
  onUpdateModifiers: (cartLineId: string, modifiers: CartItemModifier[]) => void
  onPayment: (method: "Cash" | "Visa" | "CliQ") => void
  onSetDiscount: (discount: CartDiscount | null) => void
  onHoldClick?: () => void
  onHeldOrdersClick?: () => void
  heldOrdersCount?: number
  isProcessing?: boolean
}

// Preset discounts
const presetDiscounts: CartDiscount[] = [
  { id: "5off", type: "percentage", value: 5, name: "5% Off" },
  { id: "10off", type: "percentage", value: 10, name: "10% Off" },
  { id: "15off", type: "percentage", value: 15, name: "15% Off" },
  { id: "20off", type: "percentage", value: 20, name: "20% Off" },
]

export function POSCart({
  items,
  discount,
  totals,
  onQuantityChange,
  onRemoveItem,
  onUpdateModifiers,
  onPayment,
  onSetDiscount,
  onHoldClick,
  onHeldOrdersClick,
  heldOrdersCount = 0,
  isProcessing = false,
}: POSCartProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"Cash" | "Visa" | "CliQ">("Cash")
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false)
  const [customDiscountType, setCustomDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [customDiscountValue, setCustomDiscountValue] = useState("")

  const handleApplyDiscount = (preset?: CartDiscount) => {
    if (preset) {
      onSetDiscount(preset)
      setIsDiscountDialogOpen(false)
      return
    }

    const value = parseFloat(customDiscountValue)
    if (isNaN(value) || value <= 0) return

    onSetDiscount({
      id: "custom",
      type: customDiscountType,
      value: value,
      name: customDiscountType === "percentage" ? `${value}% Off` : `${value} JOD Off`,
    })
    setIsDiscountDialogOpen(false)
    setCustomDiscountValue("")
  }

  const paymentMethods = [
    { id: "Cash" as const, icon: <Banknote className="h-5 w-5" />, label: "Cash" },
    { id: "Visa" as const, icon: <CreditCard className="h-5 w-5" />, label: "Card" },
    { id: "CliQ" as const, icon: <QrCode className="h-5 w-5" />, label: "CliQ" },
  ]

  return (
    <>
      <aside className="w-96 h-full bg-card dark:bg-card border-l border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 dark:from-cyan-500/30 dark:to-teal-500/30 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Current Order</h2>
                <p className="text-xs text-muted-foreground">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => items.forEach(item => onRemoveItem(item.id))}
                className="text-muted-foreground hover:text-destructive"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-20 h-20 rounded-full bg-muted dark:bg-muted/50 flex items-center justify-center mb-4">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">Cart is empty</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Tap items to add them to the order
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {items.map((item) => {
                  const itemTotal = (item.price + item.modifiers.reduce((sum, m) => sum + m.price, 0)) * item.quantity

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-muted/50 dark:bg-muted/30 rounded-xl p-3 border border-border/50"
                    >
                      <div className="flex gap-3">
                        {/* Quantity Controls */}
                        <div className="flex flex-col items-center gap-1">
                          <button
                            onClick={() => onQuantityChange(item.id, 1)}
                            className="w-7 h-7 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 dark:hover:bg-cyan-500/30 flex items-center justify-center transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-sm font-bold text-foreground w-7 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onQuantityChange(item.id, -1)}
                            className="w-7 h-7 rounded-lg bg-muted dark:bg-muted/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive flex items-center justify-center transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground text-sm truncate">
                                {item.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(item.price)} JOD each
                              </p>
                            </div>
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Modifiers */}
                          {item.modifiers.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.modifiers.map((mod) => (
                                <Badge
                                  key={mod.id}
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5 bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-0"
                                >
                                  {mod.name} +{formatCurrency(mod.price)}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Notes */}
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              Note: {item.notes}
                            </p>
                          )}

                          {/* Line Total */}
                          <div className="mt-2 flex items-center justify-between">
                            <button className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                              <Edit3 className="h-3 w-3" />
                              Add extras
                            </button>
                            <span className="font-bold text-foreground">
                              {formatCurrency(itemTotal)} JOD
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        {items.length > 0 && (
          <div className="border-t border-border bg-muted/30 dark:bg-muted/20">
            {/* Discount Button */}
            <div className="px-3 py-1.5">
              {discount ? (
                <div className="flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg py-2 px-3 border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    <span className="font-medium text-xs">{discount.name}</span>
                  </div>
                  <button
                    onClick={() => onSetDiscount(null)}
                    className="p-0.5 hover:bg-emerald-500/20 rounded transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsDiscountDialogOpen(true)}
                  className="w-full justify-between h-8 text-xs border-dashed border-border"
                >
                  <div className="flex items-center gap-1.5">
                    <Percent className="h-3 w-3" />
                    <span>Add Discount</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </Button>
              )}
            </div>

            {/* Hold Order Actions */}
            <div className="px-3 py-1.5 flex gap-2">
              <Button
                variant="outline"
                onClick={onHoldClick}
                className="flex-1 h-8 text-xs gap-1.5 border-dashed border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                disabled={items.length === 0}
              >
                <Pause className="h-3 w-3" />
                <span>Hold</span>
              </Button>
              <Button
                variant="outline"
                onClick={onHeldOrdersClick}
                className="flex-1 h-8 text-xs gap-1.5 border-dashed border-border relative"
              >
                <ClipboardList className="h-3 w-3" />
                <span>Held</span>
                {heldOrdersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-cyan-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                    {heldOrdersCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Totals */}
            <div className="px-3 py-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(totals.subtotal)} JOD</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span>-{formatCurrency(totals.discountAmount)} JOD</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Tax (16%)</span>
                <span className="font-medium text-foreground">{formatCurrency(totals.taxAmount)} JOD</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-foreground">Total</span>
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                  {formatCurrency(totals.grandTotal)} JOD
                </span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="px-3 py-2 border-t border-border">
              <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Payment Method</p>
              <div className="grid grid-cols-3 gap-1.5">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg border transition-all",
                      selectedPaymentMethod === method.id
                        ? "border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                        : "border-border text-muted-foreground hover:border-cyan-500/50 hover:text-foreground"
                    )}
                  >
                    {method.icon}
                    <span className="text-[10px] font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Checkout Button */}
            <div className="p-3 pt-1">
              <Button
                onClick={() => onPayment(selectedPaymentMethod)}
                disabled={isProcessing || items.length === 0}
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/30"
                size="lg"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Processing...
                  </div>
                ) : (
                  <>
                    Charge {formatCurrency(totals.grandTotal)} JOD
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Discount Dialog */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>
              Choose a preset discount or enter a custom amount
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preset Discounts */}
            <div className="grid grid-cols-2 gap-2">
              {presetDiscounts.map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  onClick={() => handleApplyDiscount(preset)}
                  className="h-12 justify-center hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400"
                >
                  <Percent className="h-4 w-4 mr-2" />
                  {preset.name}
                </Button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or custom</span>
              </div>
            </div>

            {/* Custom Discount */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={customDiscountType === "percentage" ? "default" : "outline"}
                  onClick={() => setCustomDiscountType("percentage")}
                  className={cn(
                    "h-10",
                    customDiscountType === "percentage" && "bg-gradient-to-r from-cyan-500 to-teal-500"
                  )}
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Percentage
                </Button>
                <Button
                  variant={customDiscountType === "fixed" ? "default" : "outline"}
                  onClick={() => setCustomDiscountType("fixed")}
                  className={cn(
                    "h-10",
                    customDiscountType === "fixed" && "bg-gradient-to-r from-cyan-500 to-teal-500"
                  )}
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Fixed Amount
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={customDiscountType === "percentage" ? "Enter %" : "Enter amount"}
                  value={customDiscountValue}
                  onChange={(e) => setCustomDiscountValue(e.target.value)}
                  className="h-11"
                />
                <Button
                  onClick={() => handleApplyDiscount()}
                  disabled={!customDiscountValue}
                  className="h-11 px-6 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscountDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
