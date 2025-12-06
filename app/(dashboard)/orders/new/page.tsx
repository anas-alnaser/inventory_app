"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Calendar as CalendarIcon, Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/lib/hooks/use-toast"
import { cn } from "@/lib/utils"
import { getSuppliers, getIngredients, createPurchaseOrder } from "@/lib/services"
import type { Ingredient, Supplier } from "@/types/entities"
import { SmartUnitInput } from "@/components/inventory/SmartUnitInput"

interface OrderItemRow {
  localId: string
  ingredientId: string
  name: string
  quantity: number
  unit: string
  costPerUnit: number
  totalCost: number
}

export default function NewOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillSupplierId = searchParams.get("supplierId")
  const prefillIngredientId = searchParams.get("ingredientId")

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(prefillSupplierId || "")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [items, setItems] = useState<OrderItemRow[]>([])
  
  // Queries
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => getSuppliers(),
  })

  const { data: allIngredients = [], isLoading: loadingIngredients } = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => getIngredients(),
  })

  // Filter ingredients by selected supplier
  const supplierIngredients = allIngredients.filter(
    (i) => i.supplier_id === selectedSupplierId
  )

  // Handle prefill ingredient
  useEffect(() => {
    if (prefillIngredientId && selectedSupplierId && supplierIngredients.length > 0 && items.length === 0) {
      const ingredient = supplierIngredients.find(i => i.id === prefillIngredientId)
      if (ingredient) {
        addItem(ingredient)
      }
    }
  }, [prefillIngredientId, selectedSupplierId, supplierIngredients, items.length])

  // Mutation
  const createOrderMutation = useMutation({
    mutationFn: async (status: 'draft' | 'ordered') => {
      if (!selectedSupplierId || !date || items.length === 0) {
        throw new Error("Missing required fields")
      }

      const supplier = suppliers.find(s => s.id === selectedSupplierId)
      if (!supplier) throw new Error("Invalid supplier")

      return createPurchaseOrder({
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        expected_delivery_date: date,
        status,
        items: items.map(item => ({
          ingredient_id: item.ingredientId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          cost_per_unit: item.costPerUnit,
          total_cost: item.totalCost
        }))
      })
    },
    onSuccess: (id) => {
      toast({
        title: "Order Created",
        description: "Purchase order has been successfully created.",
        variant: "default",
      })
      router.push(`/orders/${id}`)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      })
    }
  })

  const addItem = (ingredient?: Ingredient) => {
    // Default to first available ingredient if not provided
    const targetIngredient = ingredient || supplierIngredients[0]
    
    if (!targetIngredient) {
      toast({ title: "No ingredients available", description: "This supplier has no ingredients listed.", variant: "destructive" })
      return
    }

    const newItem: OrderItemRow = {
      localId: Math.random().toString(36).substr(2, 9),
      ingredientId: targetIngredient.id,
      name: targetIngredient.name,
      quantity: 1,
      unit: targetIngredient.unit,
      costPerUnit: targetIngredient.cost_per_unit,
      totalCost: targetIngredient.cost_per_unit // 1 * cost
    }

    setItems([...items, newItem])
  }

  const updateItem = (localId: string, field: keyof OrderItemRow, value: any) => {
    setItems(items.map(item => {
      if (item.localId !== localId) return item

      const updatedItem = { ...item, [field]: value }
      
      // Recalculate totals/details if dependent fields change
      if (field === 'ingredientId') {
        const ingredient = supplierIngredients.find(i => i.id === value)
        if (ingredient) {
          updatedItem.name = ingredient.name
          updatedItem.unit = ingredient.unit
          updatedItem.costPerUnit = ingredient.cost_per_unit
          updatedItem.totalCost = updatedItem.quantity * ingredient.cost_per_unit
        }
      }

      if (field === 'quantity' || field === 'costPerUnit') {
        updatedItem.totalCost = updatedItem.quantity * updatedItem.costPerUnit
      }

      return updatedItem
    }))
  }

  const removeItem = (localId: string) => {
    setItems(items.filter(i => i.localId !== localId))
  }

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + item.totalCost, 0)
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Purchase Order</h1>
          <p className="text-muted-foreground">Create a new order for your supplier</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Form Area */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select 
                    value={selectedSupplierId} 
                    onValueChange={(val) => {
                      if (val !== selectedSupplierId) {
                        setItems([]) // Clear items if supplier changes
                        setSelectedSupplierId(val)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Expected Delivery Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => addItem()}
                disabled={!selectedSupplierId || supplierIngredients.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {!selectedSupplierId ? (
                <div className="text-center py-8 text-muted-foreground">
                  Select a supplier to start adding items.
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  No items added yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Cost / Unit</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.localId}>
                            <TableCell>
                              <Select
                                value={item.ingredientId}
                                onValueChange={(val) => updateItem(item.localId, 'ingredientId', val)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {supplierIngredients.map(ing => (
                                    <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  className="w-20"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.localId, 'quantity', parseFloat(e.target.value) || 0)}
                                />
                                <span className="text-sm text-muted-foreground">{item.unit}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-24"
                                value={item.costPerUnit}
                                onChange={(e) => updateItem(item.localId, 'costPerUnit', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell>
                              {item.totalCost.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.localId)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-4">
                    {items.map((item) => (
                      <div key={item.localId} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-start">
                           <div className="flex-1 mr-2">
                            <Label className="text-xs mb-1 block">Item</Label>
                            <Select
                              value={item.ingredientId}
                              onValueChange={(val) => updateItem(item.localId, 'ingredientId', val)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {supplierIngredients.map(ing => (
                                  <SelectItem key={ing.id} value={ing.id}>{ing.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                           </div>
                           <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.localId)}
                              className="text-destructive -mt-1 -mr-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <Label className="text-xs mb-1 block">Quantity ({item.unit})</Label>
                            <Input
                              type="number"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.localId, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="flex-1">
                             <Label className="text-xs mb-1 block">Cost / Unit</Label>
                             <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.costPerUnit}
                                onChange={(e) => updateItem(item.localId, 'costPerUnit', parseFloat(e.target.value) || 0)}
                              />
                          </div>
                        </div>
                        <div className="text-right font-medium">
                          Total: {item.totalCost.toFixed(2)} JOD
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <div className="md:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Cost</span>
                <span>{calculateGrandTotal().toFixed(2)} JOD</span>
              </div>
              
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  size="lg"
                  disabled={createOrderMutation.isPending || !selectedSupplierId || items.length === 0}
                  onClick={() => createOrderMutation.mutate('ordered')}
                >
                  {createOrderMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={createOrderMutation.isPending || !selectedSupplierId || items.length === 0}
                  onClick={() => createOrderMutation.mutate('draft')}
                >
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

