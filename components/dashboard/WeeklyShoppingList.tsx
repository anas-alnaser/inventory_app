"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  ShoppingCart, 
  CheckCircle2, 
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Package,
  DollarSign,
  Calendar,
  X
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatSmartQuantity } from "@/lib/utils/unit-conversion"
import { cn } from "@/lib/utils"
import type { 
  WeeklyShoppingList, 
  ShoppingListBySupplier, 
  ShoppingListItem 
} from "@/lib/services/shopping-list"
import { formatShoppingListForWhatsApp, generateWhatsAppUrl } from "@/lib/services/shopping-list"

interface WeeklyShoppingListProps {
  shoppingList: WeeklyShoppingList
  onClose: () => void
}

export function WeeklyShoppingListDialog({ shoppingList, onClose }: WeeklyShoppingListProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(
    new Set(shoppingList.items.map(item => item.supplierId))
  )

  const toggleItem = (ingredientId: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(ingredientId)) {
      newChecked.delete(ingredientId)
    } else {
      newChecked.add(ingredientId)
    }
    setCheckedItems(newChecked)
  }

  const toggleSupplier = (supplierId: string) => {
    const newExpanded = new Set(expandedSuppliers)
    if (newExpanded.has(supplierId)) {
      newExpanded.delete(supplierId)
    } else {
      newExpanded.add(supplierId)
    }
    setExpandedSuppliers(newExpanded)
  }

  const toggleAllInSupplier = (supplierGroup: ShoppingListBySupplier) => {
    const allChecked = supplierGroup.items.every(item => checkedItems.has(item.ingredientId))
    const newChecked = new Set(checkedItems)
    
    if (allChecked) {
      supplierGroup.items.forEach(item => newChecked.delete(item.ingredientId))
    } else {
      supplierGroup.items.forEach(item => newChecked.add(item.ingredientId))
    }
    
    setCheckedItems(newChecked)
  }

  const handleSendWhatsApp = (supplierGroup: ShoppingListBySupplier) => {
    // Filter to only checked items for this supplier
    const itemsToOrder = supplierGroup.items.filter(item => 
      checkedItems.has(item.ingredientId)
    )

    if (itemsToOrder.length === 0) {
      // If nothing checked, send all items
      const message = formatShoppingListForWhatsApp(supplierGroup)
      const url = generateWhatsAppUrl(supplierGroup.supplierPhone, message)
      window.open(url, '_blank')
    } else {
      // Create a custom message with only checked items
      const customGroup: ShoppingListBySupplier = {
        ...supplierGroup,
        items: itemsToOrder,
        totalEstimatedCost: itemsToOrder.reduce((sum, item) => sum + item.estimatedCost, 0),
      }
      const message = formatShoppingListForWhatsApp(customGroup)
      const url = generateWhatsAppUrl(supplierGroup.supplierPhone, message)
      window.open(url, '_blank')
    }
  }

  const getUnitType = (unit: string): 'weight' | 'volume' | 'count' => {
    if (['g', 'kg'].includes(unit)) return 'weight'
    if (['mL', 'L'].includes(unit)) return 'volume'
    return 'count'
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Weekly Shopping List
              </DialogTitle>
              <DialogDescription>
                Generated on {shoppingList.generatedAt.toLocaleDateString()} at{" "}
                {shoppingList.generatedAt.toLocaleTimeString()}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Package className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{shoppingList.totalItems}</p>
                  <p className="text-sm text-muted-foreground">Items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <ShoppingCart className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{shoppingList.totalSuppliers}</p>
                  <p className="text-sm text-muted-foreground">Suppliers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {shoppingList.totalEstimatedCost.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">JOD</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shopping List by Supplier */}
        <div className="space-y-4">
          {shoppingList.items.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No Items to Order</h3>
                    <p className="text-muted-foreground">
                      All items have sufficient stock for the next 7 days.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            shoppingList.items.map((supplierGroup) => {
              const allChecked = supplierGroup.items.every(item => 
                checkedItems.has(item.ingredientId)
              )
              const someChecked = supplierGroup.items.some(item => 
                checkedItems.has(item.ingredientId)
              )
              const isExpanded = expandedSuppliers.has(supplierGroup.supplierId)

              return (
                <Card key={supplierGroup.supplierId} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSupplier(supplierGroup.supplierId)}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{supplierGroup.supplierName}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <span>{supplierGroup.items.length} items</span>
                            <span>•</span>
                            <span>{supplierGroup.totalEstimatedCost.toFixed(2)} JOD</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAllInSupplier(supplierGroup)}
                          className="text-xs"
                        >
                          {allChecked ? "Uncheck All" : "Check All"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSendWhatsApp(supplierGroup)}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Send via WhatsApp
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent>
                      <div className="space-y-2">
                        {supplierGroup.items.map((item) => {
                          const isChecked = checkedItems.has(item.ingredientId)
                          const unitType = getUnitType(item.unit)

                          return (
                            <motion.div
                              key={item.ingredientId}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                                isChecked 
                                  ? "bg-primary/5 border-primary/20" 
                                  : "bg-muted/30 border-border"
                              )}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => toggleItem(item.ingredientId)}
                                className="h-5 w-5"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.ingredientName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.ceil(item.daysRemaining)} days left
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                  <span>
                                    Need: {formatSmartQuantity(item.quantityNeeded, unitType)} {item.unit}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Current: {formatSmartQuantity(item.currentStock, unitType)}
                                  </span>
                                  {item.costPerUnit > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="font-medium text-foreground">
                                        {item.estimatedCost.toFixed(2)} JOD
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

