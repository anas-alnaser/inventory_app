"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Pencil, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "@/lib/hooks/use-toast"
import { updateIngredient } from "@/lib/services/ingredients"
import { getSuppliers } from "@/lib/services/suppliers"
import type { Ingredient } from "@/types/entities"

const ingredientFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    category: z.string().min(1, "Category is required"),
    supplier_id: z.string().min(1, "Supplier is required"),
    cost_per_unit: z.number().min(0, "Cost must be positive"),
    min_stock_level: z.number().min(0, "Min stock must be positive").optional(),
    max_stock_level: z.number().min(0, "Max stock must be positive").optional(),
})

type IngredientFormData = z.infer<typeof ingredientFormSchema>

interface EditIngredientDialogProps {
    ingredient: Ingredient
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditIngredientDialog({
    ingredient,
    open,
    onOpenChange,
}: EditIngredientDialogProps) {
    const queryClient = useQueryClient()

    const { data: suppliers = [] } = useQuery({
        queryKey: ["suppliers"],
        queryFn: getSuppliers,
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
        defaultValues: {
            name: ingredient.name || "",
            category: ingredient.category || "",
            supplier_id: ingredient.supplier_id || "",
            cost_per_unit: ingredient.cost_per_unit || 0,
            min_stock_level: ingredient.min_stock_level || 0,
            max_stock_level: ingredient.max_stock_level || 0,
        },
    })

    const selectedSupplierId = watch("supplier_id")

    // Reset form when ingredient changes
    useEffect(() => {
        if (ingredient) {
            reset({
                name: ingredient.name || "",
                category: ingredient.category || "",
                supplier_id: ingredient.supplier_id || "",
                cost_per_unit: ingredient.cost_per_unit || 0,
                min_stock_level: ingredient.min_stock_level || 0,
                max_stock_level: ingredient.max_stock_level || 0,
            })
        }
    }, [ingredient, reset])

    const updateIngredientMutation = useMutation({
        mutationFn: async (data: IngredientFormData) => {
            return updateIngredient(ingredient.id, {
                name: data.name,
                category: data.category,
                supplier_id: data.supplier_id,
                cost_per_unit: data.cost_per_unit,
                min_stock_level: data.min_stock_level,
                max_stock_level: data.max_stock_level,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inventory"] })
            queryClient.invalidateQueries({ queryKey: ["ingredients"] })
            toast({
                title: "Ingredient Updated",
                description: "Ingredient information has been updated successfully.",
                variant: "default",
            })
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update ingredient",
                variant: "destructive",
            })
        },
    })

    const onSubmit = (data: IngredientFormData) => {
        updateIngredientMutation.mutate(data)
    }

    const categories = [
        "Dairy",
        "Proteins",
        "Produce",
        "Grains",
        "Beverages",
        "Spices",
        "Oils",
        "Sauces",
        "Packaging",
        "Other",
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5" />
                        Edit Ingredient
                    </DialogTitle>
                    <DialogDescription>
                        Update ingredient information. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Ingredient Name</Label>
                        <Input
                            id="name"
                            placeholder="Enter ingredient name"
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                            value={watch("category")}
                            onValueChange={(value) => setValue("category", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category && (
                            <p className="text-sm text-destructive">{errors.category.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="supplier">Supplier</Label>
                        <Select
                            value={selectedSupplierId}
                            onValueChange={(value) => setValue("supplier_id", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.supplier_id && (
                            <p className="text-sm text-destructive">{errors.supplier_id.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cost_per_unit">Cost per Unit (JOD)</Label>
                        <Input
                            id="cost_per_unit"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            {...register("cost_per_unit", { valueAsNumber: true })}
                        />
                        {errors.cost_per_unit && (
                            <p className="text-sm text-destructive">{errors.cost_per_unit.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="min_stock_level">Min Stock Level</Label>
                            <Input
                                id="min_stock_level"
                                type="number"
                                min="0"
                                placeholder="0"
                                {...register("min_stock_level", { valueAsNumber: true })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max_stock_level">Max Stock Level</Label>
                            <Input
                                id="max_stock_level"
                                type="number"
                                min="0"
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
                        <Button type="submit" disabled={updateIngredientMutation.isPending}>
                            {updateIngredientMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
