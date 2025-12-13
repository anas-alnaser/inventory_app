"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Search, Plus, Package, Trash2, AlertTriangle, Clock, ArrowUp, ArrowDown, Minus, ShoppingCart, Camera } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/lib/hooks/use-toast"
import { SmartUnitInput } from "@/components/inventory/SmartUnitInput"
import { formatSmartQuantity } from "@/lib/utils/unit-conversion"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/useAuth"
import {
  listenToInventoryWithStock,
  addStock,
  deleteIngredient,
  getStockLogsByIngredient,
  getAllUsers,
} from "@/lib/services"
import { CreateIngredientDialog } from "@/components/inventory/CreateIngredientDialog"
import { LogUsageDialog } from "@/components/inventory/LogUsageDialog"
import type { StockLog } from "@/types/entities"
import type { InventoryItem } from "@/lib/services"

const statusConfig = {
  good: { label: "In Stock", className: "bg-emerald-500 text-white border-transparent whitespace-nowrap w-[110px] text-center" },
  low: { label: "Low Stock", className: "bg-amber-500 text-white border-transparent whitespace-nowrap w-[110px] text-center" },
  critical: { label: "Critical", className: "bg-red-500 text-white border-transparent whitespace-nowrap w-[110px] text-center" },
  out: { label: "Out of Stock", className: "bg-red-500 text-white border-transparent whitespace-nowrap w-[110px] text-center" },
}

function InventoryTableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  )
}

function InventoryCardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24 mb-3" />
          <Skeleton className="h-2 w-full rounded-full" />
        </Card>
      ))}
    </div>
  )
}

export default function InventoryPage() {
  const { userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [isAddStockOpen, setIsAddStockOpen] = useState(false)
  const [isLogUsageOpen, setIsLogUsageOpen] = useState(false)
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [stockQuantity, setStockQuantity] = useState(0)
  const [stockUnit, setStockUnit] = useState("kg")
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [selectedIngredientForHistory, setSelectedIngredientForHistory] = useState<InventoryItem | null>(null)
  
  // Real-time inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Real-time listener for inventory data
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      setIsLoading(true)
      return
    }

    setIsLoading(true)
    setError(null)

    const unsubscribe = listenToInventoryWithStock(
      (inventoryData) => {
        setInventory(inventoryData)
        setIsLoading(false)
        setError(null)
      }
    )

    // Cleanup function
    return () => {
      unsubscribe()
    }
  }, [authLoading])

  // Fetch users for displaying names in logs
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
  })

  // Fetch stock logs for selected ingredient
  const { data: stockLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["stock-logs", selectedIngredientForHistory?.ingredient.id],
    queryFn: () => {
      if (!selectedIngredientForHistory?.ingredient.id) return []
      return getStockLogsByIngredient(selectedIngredientForHistory.ingredient.id, 50)
    },
    enabled: !!selectedIngredientForHistory?.ingredient.id && isHistoryOpen,
  })

  // Get unique categories from inventory
  const categories = [
    "All",
    ...Array.from(
      new Set(inventory.map((item) => item.ingredient.category).filter(Boolean))
    ),
  ]

  // Add stock mutation
  const addStockMutation = useMutation({
    mutationFn: async (data: {
      ingredient_id: string
      quantity: number
      unit: string
    }) => {
      if (!userData?.id) {
        throw new Error("User must be logged in")
      }
      return addStock({
        ingredient_id: data.ingredient_id,
        quantity: data.quantity,
        unit: data.unit,
        user_id: userData.id,
        notes: "Manual stock addition",
      })
    },
    onSuccess: () => {
      // No need to invalidate queries - real-time listener will update automatically
      toast({
        title: "Stock Added",
        description: `Successfully added stock to ${selectedItem?.ingredient.name}`,
        variant: "default",
      })
      setIsAddStockOpen(false)
      setSelectedItem(null)
      setStockQuantity(0)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add stock",
        variant: "destructive",
      })
    },
  })

  // Delete ingredient mutation
  const deleteIngredientMutation = useMutation({
    mutationFn: async (ingredientId: string) => {
      return deleteIngredient(ingredientId)
    },
    onSuccess: () => {
      // No need to invalidate queries - real-time listener will update automatically
      toast({
        title: "Ingredient Deleted",
        description: "The ingredient has been removed from your inventory.",
        variant: "default",
      })
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete ingredient",
        variant: "destructive",
      })
    },
  })

  // Filter inventory
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.ingredient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === "All" || item.ingredient.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Sort by status priority
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    const statusOrder = { out: 0, critical: 1, low: 2, good: 3 }
    return statusOrder[a.status] - statusOrder[b.status]
  })

  const handleAddStock = () => {
    if (!selectedItem || stockQuantity <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please select an ingredient and enter a valid quantity.",
        variant: "destructive",
      })
      return
    }

    addStockMutation.mutate({
      ingredient_id: selectedItem.ingredient.id,
      quantity: stockQuantity,
      unit: stockUnit,
    })
  }

  const handleStockChange = (value: number, unit: string, baseValue: number) => {
    setStockQuantity(value)
    setStockUnit(unit)
  }

  const handleDeleteClick = (item: InventoryItem) => {
    setItemToDelete(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteIngredientMutation.mutate(itemToDelete.ingredient.id)
    }
  }

  // Helper function to check if expiry is within 7 days
  const isExpiringSoon = (expiryDate: Date | string | any): boolean => {
    if (!expiryDate) return false
    try {
      let date: Date
      if (typeof expiryDate === 'string') {
        date = new Date(expiryDate)
      } else if (expiryDate?.toDate) {
        date = expiryDate.toDate()
      } else if (expiryDate instanceof Date) {
        date = expiryDate
      } else {
        return false
      }
      
      const now = new Date()
      const diffTime = date.getTime() - now.getTime()
      const diffDays = diffTime / (1000 * 60 * 60 * 24)
      return diffDays >= 0 && diffDays <= 7
    } catch {
      return false
    }
  }

  const getUnitType = (unit: string): "weight" | "volume" | "count" => {
    if (["g", "kg", "sack_10kg", "sack_25kg", "sack_50kg"].includes(unit)) {
      return "weight"
    }
    if (["mL", "L", "gallon"].includes(unit)) {
      return "volume"
    }
    return "count"
  }

  // Show loading state while auth is loading
  if (authLoading || (isLoading && inventory.length === 0 && !error)) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
              <p className="text-muted-foreground">Loading inventory data...</p>
            </div>
          </div>
          <InventoryTableSkeleton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Error Loading Inventory</h3>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Failed to load inventory data"}
              </p>
              {error.message.includes("Branch ID") && (
                <p className="text-sm text-muted-foreground mt-2">
                  Please try refreshing the page or contact your administrator.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">Manage your ingredient stock levels</p>
        </div>
        <div className="flex gap-2">
          {/* Visual Stock Take Button */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push('/inventory/visual-count')}
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Visual Count</span>
          </Button>
          
          {/* Primary Button: Create New Item */}
          <CreateIngredientDialog
            open={isAddIngredientOpen}
            onOpenChange={setIsAddIngredientOpen}
            trigger={
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Item
              </Button>
            }
          />

          {/* Secondary Button: Restock / Add Stock */}
          <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Restock / Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Restock / Add Stock</DialogTitle>
                <DialogDescription>
                  Add stock to an existing ingredient. Select an ingredient and enter the quantity.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {inventory.length === 0 ? (
                  <div className="py-8 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Create an item first before adding stock.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Ingredient</Label>
                      <Select
                        onValueChange={(value) => {
                          const item = inventory.find((i) => i.ingredient.id === value)
                          setSelectedItem(item || null)
                          if (item) {
                            setStockUnit(item.ingredient.unit)
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventory.map((item) => (
                            <SelectItem key={item.ingredient.id} value={item.ingredient.id}>
                              {item.ingredient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedItem && (
                      <SmartUnitInput
                        value={stockQuantity}
                        unit={stockUnit}
                        unitType={getUnitType(selectedItem.ingredient.unit)}
                        onChange={handleStockChange}
                        label="Quantity"
                        placeholder="Enter amount"
                      />
                    )}
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddStockOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddStock}
                  disabled={
                    inventory.length === 0 ||
                    !selectedItem ||
                    stockQuantity <= 0 ||
                    addStockMutation.isPending
                  }
                >
                  {addStockMutation.isPending ? "Adding..." : "Add Stock"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Log Usage Dialog */}
          {userData?.id && (
            <LogUsageDialog
              open={isLogUsageOpen}
              onOpenChange={setIsLogUsageOpen}
              inventory={inventory}
              userId={userData.id}
            />
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ingredients..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => category && setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        {isLoading ? (
          <InventoryTableSkeleton />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="align-middle">Ingredient</TableHead>
                  <TableHead className="text-center align-middle">Category</TableHead>
                  <TableHead className="text-center align-middle">Quantity</TableHead>
                  <TableHead className="text-center align-middle">Status</TableHead>
                  <TableHead className="text-center align-middle">Supplier</TableHead>
                  <TableHead className="text-right align-middle">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedInventory.map((item) => {
                  const config = statusConfig[item.status]
                  const currentQuantity = item.stock?.quantity || 0
                  const maxCapacity = item.ingredient.max_stock_level || 10000
                  const percentFull = Math.min((currentQuantity / maxCapacity) * 100, 100)
                  const unitType = getUnitType(item.ingredient.unit)
                  const expiringSoon = item.stock?.expiry_date && isExpiringSoon(item.stock.expiry_date)

                  return (
                    <TableRow 
                      key={item.id}
                      className={cn(
                        expiringSoon && "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900"
                      )}
                    >
                      <TableCell className="align-middle py-4">
                        <div className="flex items-center h-full gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{item.ingredient.name}</p>
                              {expiringSoon && (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">
                                  Expiring Soon
                                </Badge>
                              )}
                            </div>
                            {item.stock?.expiry_date && (
                              <p className={cn(
                                "text-xs",
                                expiringSoon ? "text-yellow-700 dark:text-yellow-400 font-medium" : "text-muted-foreground"
                              )}>
                                Expires:{" "}
                                {new Date(
                                  (item.stock.expiry_date as any).toDate?.() ||
                                    item.stock.expiry_date
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle py-4">
                        <div className="flex items-center justify-center h-full">
                          {item.ingredient.category && (
                            <Badge variant="outline" className="whitespace-nowrap w-[110px] text-center">{item.ingredient.category}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle py-4">
                        <div className="flex flex-col justify-center items-center h-full gap-1">
                          <p className="font-medium">
                            {formatSmartQuantity(currentQuantity, unitType)}
                          </p>
                          <Progress
                            value={percentFull}
                            className="h-1.5 w-24"
                            indicatorClassName={cn(
                              item.status === "good" && "bg-success",
                              item.status === "low" && "bg-warning",
                              (item.status === "critical" || item.status === "out") &&
                                "bg-destructive"
                            )}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center align-middle py-4">
                        <div className="flex items-center justify-center h-full">
                          <Badge className={cn("border-transparent", config.className)}>{config.label}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground align-middle text-center py-4">
                        <div className="flex items-center justify-center h-full max-w-[150px] mx-auto">
                          {item.supplier?.name || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right align-middle py-4">
                        <div className="flex items-center justify-end h-full gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedIngredientForHistory(item)
                              setIsHistoryOpen(true)
                            }}
                            title="View History"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item)
                              setIsLogUsageOpen(true)
                            }}
                            title="Log Usage / Waste"
                            className="text-destructive hover:text-destructive"
                          >
                            <Minus className="h-4 w-4 mr-1" />
                            Use
                          </Button>
                          {item.status !== 'good' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/orders/new?supplierId=${item.ingredient.supplier_id}&ingredientId=${item.ingredient.id}`)}
                              title="Reorder"
                              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              Reorder
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item)
                              setIsAddStockOpen(true)
                            }}
                            title="Add Stock"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                          {userData?.role === "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(item)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {isLoading ? (
          <InventoryCardSkeleton />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {sortedInventory.map((item, index) => {
              const config = statusConfig[item.status]
              const currentQuantity = item.stock?.quantity || 0
              const maxCapacity = item.ingredient.max_stock_level || 10000
              const percentFull = Math.min((currentQuantity / maxCapacity) * 100, 100)
              const unitType = getUnitType(item.ingredient.unit)
              const expiringSoon = item.stock?.expiry_date && isExpiringSoon(item.stock.expiry_date)

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={cn(
                    "p-4",
                    expiringSoon && "border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20"
                  )}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {item.ingredient.name}
                          </h3>
                          {expiringSoon && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.ingredient.category || "Uncategorized"}
                        </p>
                        {item.stock?.expiry_date && (
                          <p className={cn(
                            "text-xs mt-1",
                            expiringSoon ? "text-yellow-700 dark:text-yellow-400 font-medium" : "text-muted-foreground"
                          )}>
                            Expires:{" "}
                            {new Date(
                              (item.stock.expiry_date as any).toDate?.() ||
                                item.stock.expiry_date
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge className={cn("border-transparent", config.className)}>{config.label}</Badge>
                    </div>
                    <p className="text-2xl font-bold text-foreground mb-3">
                      {formatSmartQuantity(currentQuantity, unitType)}
                    </p>
                    <Progress
                      value={percentFull}
                      className="h-2 mb-3"
                      indicatorClassName={cn(
                        item.status === "good" && "bg-success",
                        item.status === "low" && "bg-warning",
                        (item.status === "critical" || item.status === "out") &&
                          "bg-destructive"
                      )}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.supplier?.name || "No supplier"}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedIngredientForHistory(item)
                            setIsHistoryOpen(true)
                          }}
                          title="View History"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item)
                            setIsLogUsageOpen(true)
                          }}
                          title="Log Usage / Waste"
                          className="text-destructive"
                        >
                          <Minus className="h-4 w-4 mr-1" />
                          Use
                        </Button>
                        {item.status !== 'good' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/orders/new?supplierId=${item.ingredient.supplier_id}&ingredientId=${item.ingredient.id}`)}
                            title="Reorder"
                            className="text-blue-600 dark:text-blue-400"
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Reorder
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item)
                            setIsAddStockOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                        {userData?.role === "admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(item)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Empty State */}
      {!isLoading && sortedInventory.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No items found</h2>
          <p className="text-muted-foreground max-w-sm">
            {searchQuery
              ? `No ingredients match "${searchQuery}"`
              : "Start by adding ingredients to your inventory"}
          </p>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{itemToDelete?.ingredient.name}" from your
              inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteIngredientMutation.isPending}
            >
              {deleteIngredientMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Sheet */}
      <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Stock History - {selectedIngredientForHistory?.ingredient.name}
            </SheetTitle>
            <SheetDescription>
              View all stock changes for this ingredient
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            {logsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stockLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No stock history available</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                
                <div className="space-y-6">
                  {stockLogs.map((log, index) => {
                    const user = users.find(u => u.id === log.user_id)
                    const userName = user?.name || "Unknown User"
                    const isPositive = log.change_amount > 0
                    const amount = Math.abs(log.change_amount)
                    
                    // Format date
                    let logDate: Date
                    try {
                      if (typeof log.created_at === 'string') {
                        logDate = new Date(log.created_at)
                      } else if ((log.created_at as any)?.toDate) {
                        logDate = (log.created_at as any).toDate()
                      } else if (log.created_at instanceof Date) {
                        logDate = log.created_at
                      } else {
                        logDate = new Date()
                      }
                    } catch {
                      logDate = new Date()
                    }
                    
                    const dateStr = logDate.toLocaleDateString()
                    const timeStr = logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    
                    // Get reason label
                    const reasonLabels: Record<string, string> = {
                      purchase: "Purchase",
                      sale: "Sale",
                      waste: "Waste",
                      adjustment: "Adjustment",
                      transfer: "Transfer",
                    }
                    const reasonLabel = reasonLabels[log.reason] || log.reason

                    return (
                      <div key={log.id} className="relative flex gap-4">
                        {/* Timeline dot */}
                        <div className={cn(
                          "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2",
                          isPositive 
                            ? "bg-green-100 border-green-500 dark:bg-green-900/30 dark:border-green-600" 
                            : "bg-red-100 border-red-500 dark:bg-red-900/30 dark:border-red-600"
                        )}>
                          {isPositive ? (
                            <ArrowUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 pb-6">
                          <div className={cn(
                            "rounded-lg border p-4",
                            isPositive 
                              ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" 
                              : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900"
                          )}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className={cn(
                                  "font-semibold",
                                  isPositive ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"
                                )}>
                                  {isPositive ? "+" : "-"} {amount.toFixed(0)} {selectedIngredientForHistory?.ingredient.unit || "units"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {reasonLabel} • {userName}
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {dateStr} at {timeStr}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
