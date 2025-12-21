"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Search, Plus, ChefHat, AlertTriangle, X, Pencil, Trash2, MoreVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/lib/hooks/use-toast"
import { useAuth } from "@/lib/hooks/useAuth"
import { useSettings } from "@/lib/hooks/useSettings"
import { collection, addDoc, serverTimestamp, doc, deleteDoc, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { MenuItemRecipe } from "@/types/entities"
import { getIngredients, getMenuItemsWithFinancials, type MenuItemWithFinancials } from "@/lib/services"
import { EditMenuItemDialog } from "@/components/menu/EditMenuItemDialog"
import { formatCurrency } from "@/lib/utils"

const menuItemFormSchema = z.object({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  taxRate: z.number().min(0).max(1).optional(),
  isTaxExempt: z.boolean().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  recipe: z.array(z.object({
    ingredientId: z.string(),
    ingredientName: z.string(),
    quantity: z.number().min(0),
    unit: z.string(),
  })).optional(),
})

type MenuItemFormData = z.infer<typeof menuItemFormSchema>

async function createMenuItem(data: MenuItemFormData, branchId?: string): Promise<string> {
  const menuItemsRef = collection(db, 'menu_items')
  const menuItemData: any = {
    name: data.name,
    category: data.category,
    price: data.price,
    created_at: serverTimestamp(),
  }

  // Add branchId if provided for data isolation
  if (branchId) {
    menuItemData.branch_id = branchId
  }

  // Add optional fields if provided
  if (data.taxRate !== undefined) {
    menuItemData.taxRate = data.taxRate
  }
  if (data.isTaxExempt !== undefined) {
    menuItemData.isTaxExempt = data.isTaxExempt
  }
  if (data.imageUrl) {
    menuItemData.imageUrl = data.imageUrl
  }
  if (data.recipe && data.recipe.length > 0) {
    menuItemData.recipe = data.recipe
  }

  const docRef = await addDoc(menuItemsRef, menuItemData)
  return docRef.id
}

function MenuItemTableSkeleton() {
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

export default function MenuItemsPage() {
  const { userData, isAuthenticated } = useAuth()
  const { currency } = useSettings()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<MenuItemRecipe[]>([])
  const [recipeIngredientId, setRecipeIngredientId] = useState("")
  const [recipeQuantity, setRecipeQuantity] = useState<number>(0)
  const [recipeUnit, setRecipeUnit] = useState("g")
  const [ingredientSearch, setIngredientSearch] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [menuItemToEdit, setMenuItemToEdit] = useState<MenuItemWithFinancials | null>(null)
  const [menuItemToDelete, setMenuItemToDelete] = useState<MenuItemWithFinancials | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      price: 0,
      taxRate: 0.16,
      isTaxExempt: false,
    },
  })

  const isTaxExempt = watch("isTaxExempt")

  const {
    data: menuItems = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["menu-items"],
    queryFn: () => getMenuItemsWithFinancials(),
  })

  const {
    data: ingredients = [],
  } = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => getIngredients(),
  })

  const createMenuItemMutation = useMutation({
    mutationFn: async (data: MenuItemFormData) => {
      return createMenuItem({
        ...data,
        recipe: selectedRecipe.length > 0 ? selectedRecipe : undefined,
      }, userData?.branchId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] })
      toast({
        title: "Menu Item Added",
        description: "New menu item has been added successfully.",
        variant: "default",
      })
      setIsAddOpen(false)
      reset()
      setSelectedRecipe([])
      setRecipeIngredientId("")
      setRecipeQuantity(0)
      setRecipeUnit("g")
      setIngredientSearch("")
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create menu item",
        variant: "destructive",
      })
    },
  })

  // Delete menu item mutation
  const deleteMenuItemMutation = useMutation({
    mutationFn: async (menuItemId: string) => {
      // Check if there are any active invoices with this menu item
      const invoicesRef = collection(db, "invoices")
      const q = query(invoicesRef, where("status", "==", "pending"))
      const snapshot = await getDocs(q)

      // Check if any pending invoice contains this menu item
      for (const docSnap of snapshot.docs) {
        const invoice = docSnap.data()
        if (invoice.items?.some((item: any) => item.menuItemId === menuItemId)) {
          throw new Error("Cannot delete: This item has pending orders")
        }
      }

      // If no dependencies, delete the menu item
      const docRef = doc(db, "menu_items", menuItemId)
      await deleteDoc(docRef)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] })
      toast({
        title: "Menu Item Deleted",
        description: "The menu item has been removed.",
        variant: "default",
      })
      setIsDeleteDialogOpen(false)
      setMenuItemToDelete(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete menu item",
        variant: "destructive",
      })
    },
  })

  const filteredItems = (menuItems as MenuItemWithFinancials[]).filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Helper function to get profit margin badge info
  const getProfitMarginBadge = (margin: number) => {
    if (margin > 70) {
      return { text: "High Profit", className: "bg-green-500 hover:bg-green-600 text-white border-transparent" }
    } else if (margin > 40) {
      return { text: "Healthy", className: "bg-yellow-500 hover:bg-yellow-600 text-white border-transparent" }
    } else {
      return { text: "Low Margin", className: "bg-red-500 hover:bg-red-600 text-white border-transparent" }
    }
  }

  const categories = Array.from(new Set(menuItems.map((item) => item.category)))

  const onSubmit = (data: MenuItemFormData) => {
    createMenuItemMutation.mutate(data)
  }

  if (error) {
    return (
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Error Loading Menu Items</h3>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Failed to load menu items"}
              </p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Menu Items</h1>
          <p className="text-muted-foreground">Manage your menu items and pricing</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button
              className="gap-2 bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 text-white shadow-lg w-full sm:w-auto"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Menu Item</DialogTitle>
              <DialogDescription>
                Add a new item to your menu with name, category, price, and recipe ingredients.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Latte, Burger"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Beverages, Food"
                  {...register("category")}
                />
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ({currency})</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>

              {/* Tax Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tax Rate (0-1, default 0.16)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    placeholder="0.16"
                    {...register("taxRate", { valueAsNumber: true })}
                  />
                  {errors.taxRate && (
                    <p className="text-sm text-destructive">{errors.taxRate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Tax Exempt</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="isTaxExempt"
                      checked={isTaxExempt || false}
                      onCheckedChange={(checked) => {
                        setValue("isTaxExempt", checked as boolean)
                      }}
                    />
                    <Label htmlFor="isTaxExempt" className="text-sm font-normal cursor-pointer">
                      This item is tax exempt
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  {...register("imageUrl")}
                />
                {errors.imageUrl && (
                  <p className="text-sm text-destructive">{errors.imageUrl.message}</p>
                )}
              </div>

              {/* Recipe Section */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Recipe Ingredients (Optional)</Label>
                  <Badge variant="outline">{selectedRecipe.length} ingredient{selectedRecipe.length !== 1 ? 's' : ''}</Badge>
                </div>

                {/* Selected Ingredients List */}
                {selectedRecipe.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {selectedRecipe.map((item, index) => (
                      <div key={index} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.ingredientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRecipe(selectedRecipe.filter((_, i) => i !== index))
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Ingredient Form */}
                <div className="space-y-3 p-3 border rounded-md bg-muted/30">
                  <div className="space-y-2">
                    <Label>Select Ingredient</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search ingredients..."
                        className="pl-10"
                        value={ingredientSearch}
                        onChange={(e) => setIngredientSearch(e.target.value)}
                      />
                    </div>
                    <Select
                      value={recipeIngredientId}
                      onValueChange={(value) => {
                        setRecipeIngredientId(value)
                        const ingredient = ingredients.find(i => i.id === value)
                        if (ingredient) {
                          // Set default unit based on ingredient unit
                          setRecipeUnit(ingredient.unit)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an ingredient" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {ingredients
                          .filter(ing =>
                            !ingredientSearch ||
                            ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())
                          )
                          .map((ing) => (
                            <SelectItem key={ing.id} value={ing.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{ing.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({ing.unit})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={recipeQuantity || ""}
                        onChange={(e) => setRecipeQuantity(Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select value={recipeUnit} onValueChange={setRecipeUnit}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">Grams (g)</SelectItem>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="mL">Milliliters (mL)</SelectItem>
                          <SelectItem value="L">Liters (L)</SelectItem>
                          <SelectItem value="piece">Piece</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="pack">Pack</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const ingredient = ingredients.find(i => i.id === recipeIngredientId)
                      if (ingredient && recipeQuantity > 0) {
                        // Check if ingredient already in recipe
                        const exists = selectedRecipe.find(r => r.ingredientId === recipeIngredientId)
                        if (exists) {
                          toast({
                            title: "Ingredient Already Added",
                            description: `${ingredient.name} is already in the recipe. Remove it first to change the quantity.`,
                            variant: "default",
                          })
                          return
                        }

                        setSelectedRecipe([
                          ...selectedRecipe,
                          {
                            ingredientId: recipeIngredientId,
                            ingredientName: ingredient.name,
                            quantity: recipeQuantity,
                            unit: recipeUnit,
                          }
                        ])
                        // Reset form
                        const selectedIng = ingredients.find(i => i.id === recipeIngredientId)
                        setRecipeIngredientId("")
                        setRecipeQuantity(0)
                        setIngredientSearch("")
                        setRecipeUnit(selectedIng?.unit || "g")
                      } else {
                        toast({
                          title: "Invalid Input",
                          description: "Please select an ingredient and enter a quantity greater than 0.",
                          variant: "destructive",
                        })
                      }
                    }}
                    disabled={!recipeIngredientId || recipeQuantity <= 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Recipe
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMenuItemMutation.isPending}>
                  {createMenuItemMutation.isPending ? "Adding..." : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search menu items..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Menu Items Table */}
      {isLoading ? (
        <MenuItemTableSkeleton />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const marginBadge = getProfitMarginBadge(item.profitMargin)
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <ChefHat className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="font-medium">{item.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category}</Badge>
                      {item.recipe && item.recipe.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.recipe.length} ingredient{item.recipe.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(item.calculatedCost, currency)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(item.price, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={marginBadge.className}>
                        {marginBadge.text} ({item.profitMargin.toFixed(1)}%)
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setMenuItemToEdit(item)
                            setIsEditDialogOpen(true)
                          }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setMenuItemToDelete(item)
                              setIsDeleteDialogOpen(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Item
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <ChefHat className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">No menu items found</h2>
          <p className="text-muted-foreground max-w-sm">
            {searchQuery
              ? `No items match "${searchQuery}"`
              : "Start by adding items to your menu"}
          </p>
        </motion.div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{menuItemToDelete?.name}" from your menu.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => menuItemToDelete && deleteMenuItemMutation.mutate(menuItemToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMenuItemMutation.isPending}
            >
              {deleteMenuItemMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Menu Item Dialog */}
      {menuItemToEdit && (
        <EditMenuItemDialog
          menuItem={menuItemToEdit}
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) setMenuItemToEdit(null)
          }}
        />
      )}
    </div>
  )
}

