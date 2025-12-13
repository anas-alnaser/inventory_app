"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/lib/hooks/use-toast"
import { createIngredient, getSuppliers, type CreateIngredientData } from "@/lib/services"
import { Plus } from "lucide-react"

const ingredientFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  supplier_id: z.string().min(1, "Supplier is required"),
  purchase_unit: z.string().min(1, "Purchase unit is required"), // e.g., "Sack"
  purchase_size: z.number().min(0.01, "Purchase size must be positive"), // e.g., 1000
  base_unit: z.enum(["g", "kg", "mL", "L", "piece", "box", "pack"]),
  cost_per_purchase_unit: z.number().min(0, "Cost must be positive"),
  min_stock_level: z.number().min(0).optional(),
  max_stock_level: z.number().min(0).optional(),
})

type IngredientFormData = z.infer<typeof ingredientFormSchema>

interface CreateIngredientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function CreateIngredientDialog({
  open,
  onOpenChange,
  onSuccess,
  trigger,
}: CreateIngredientDialogProps) {
  // Fetch suppliers for dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => getSuppliers(),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientFormSchema),
  })

  const createIngredientMutation = useMutation({
    mutationFn: async (data: IngredientFormData) => {
      // Convert purchase unit cost to base unit cost
      const costPerBaseUnit = data.cost_per_purchase_unit / data.purchase_size
      
      // Convert form data to CreateIngredientData
      const ingredientData: CreateIngredientData = {
        name: data.name,
        unit: data.base_unit,
        cost_per_unit: costPerBaseUnit,
        supplier_id: data.supplier_id,
        min_stock_level: data.min_stock_level,
        max_stock_level: data.max_stock_level,
        category: data.category,
      }
      return createIngredient(ingredientData)
    },
    onSuccess: () => {
      toast({
        title: "Ingredient Created",
        description: "The ingredient has been successfully created.",
        variant: "default",
      })
      reset()
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ingredient",
        variant: "destructive",
      })
    },
  })

  const handleAddIngredient = (data: IngredientFormData) => {
    if (suppliers.length === 0) {
      toast({
        title: "No Suppliers Available",
        description: "Please add at least one supplier before creating an ingredient.",
        variant: "destructive",
      })
      return
    }
    createIngredientMutation.mutate(data)
  }

  const dialogContent = (
    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create New Ingredient</DialogTitle>
        <DialogDescription>
          Define a new ingredient for your inventory. Fill in all the details below.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit(handleAddIngredient)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ingredient-name">Ingredient Name *</Label>
          <Input
            id="ingredient-name"
            placeholder="e.g., All-Purpose Flour"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={watch("category")}
            onValueChange={(value) => setValue("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dry Goods">Dry Goods</SelectItem>
              <SelectItem value="Dairy">Dairy</SelectItem>
              <SelectItem value="Meat">Meat</SelectItem>
              <SelectItem value="Produce">Produce</SelectItem>
              <SelectItem value="Oils">Oils</SelectItem>
              <SelectItem value="Beverages">Beverages</SelectItem>
              <SelectItem value="Supplies">Supplies</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier *</Label>
          <Select
            value={watch("supplier_id")}
            onValueChange={(value) => setValue("supplier_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No suppliers available. Add a supplier first.
                </div>
              ) : (
                suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.supplier_id && (
            <p className="text-sm text-destructive">
              {errors.supplier_id.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="purchase-unit">Purchase Unit *</Label>
            <Input
              id="purchase-unit"
              placeholder="e.g., Sack, Box, Case"
              {...register("purchase_unit")}
            />
            {errors.purchase_unit && (
              <p className="text-sm text-destructive">
                {errors.purchase_unit.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="purchase-size">Purchase Size *</Label>
            <Input
              id="purchase-size"
              type="number"
              step="0.01"
              placeholder="e.g., 1000"
              {...register("purchase_size", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Size in base unit (e.g., 1000g for a 1kg sack)
            </p>
            {errors.purchase_size && (
              <p className="text-sm text-destructive">
                {errors.purchase_size.message}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="base-unit">Base Unit *</Label>
            <Select
              value={watch("base_unit")}
              onValueChange={(value) => setValue("base_unit", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select base unit" />
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
            {errors.base_unit && (
              <p className="text-sm text-destructive">
                {errors.base_unit.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Cost per Purchase Unit *</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register("cost_per_purchase_unit", { valueAsNumber: true })}
            />
            {errors.cost_per_purchase_unit && (
              <p className="text-sm text-destructive">
                {errors.cost_per_purchase_unit.message}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-stock">Min Stock Level (Optional)</Label>
            <Input
              id="min-stock"
              type="number"
              placeholder="0"
              {...register("min_stock_level", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-stock">Max Stock Level (Optional)</Label>
            <Input
              id="max-stock"
              type="number"
              placeholder="0"
              {...register("max_stock_level", { valueAsNumber: true })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              createIngredientMutation.isPending ||
              suppliers.length === 0
            }
          >
            {createIngredientMutation.isPending
              ? "Creating..."
              : suppliers.length === 0
                ? "Add Supplier First"
                : "Create Item"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        {dialogContent}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {dialogContent}
    </Dialog>
  )
}

