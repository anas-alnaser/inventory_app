"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Search, Plus, ChefHat, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
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
import { Label } from "@/components/ui/label"
import { toast } from "@/lib/hooks/use-toast"
import { useAuth } from "@/lib/hooks/useAuth"
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { MenuItem } from "@/types/entities"

const menuItemFormSchema = z.object({
  name: z.string().min(2, "Item name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
})

type MenuItemFormData = z.infer<typeof menuItemFormSchema>

async function getMenuItems(): Promise<MenuItem[]> {
  const menuItemsRef = collection(db, 'menu_items')
  const q = query(menuItemsRef, orderBy('name'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as MenuItem))
}

async function createMenuItem(data: MenuItemFormData): Promise<string> {
  const menuItemsRef = collection(db, 'menu_items')
  const docRef = await addDoc(menuItemsRef, {
    ...data,
    created_at: serverTimestamp(),
  })
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
  const { userData } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      price: 0,
    },
  })

  const {
    data: menuItems = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["menu-items"],
    queryFn: () => getMenuItems(),
  })

  const createMenuItemMutation = useMutation({
    mutationFn: async (data: MenuItemFormData) => {
      return createMenuItem(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] })
      toast({
        title: "Menu Item Added",
        description: "New menu item has been added successfully.",
        variant: "success",
      })
      setIsAddOpen(false)
      reset()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create menu item",
        variant: "destructive",
      })
    },
  })

  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Menu Items</h1>
          <p className="text-muted-foreground">Manage your menu items and pricing</p>
        </div>
        {(userData?.role === "admin" || userData?.role === "manager") && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Menu Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your menu with name, category, and price.
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
                  <Label htmlFor="price">Price (JOD)</Label>
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
        )}
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
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
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
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {item.price.toFixed(2)} JOD
                  </TableCell>
                </TableRow>
              ))}
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
    </div>
  )
}

