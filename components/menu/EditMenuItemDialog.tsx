"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Pencil, Loader2, X, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getIngredients } from "@/lib/services"
import type { MenuItem, MenuItemRecipe } from "@/types/entities"
import { useSettings } from "@/lib/hooks/useSettings"

const menuItemFormSchema = z.object({
    name: z.string().min(2, "Item name must be at least 2 characters"),
    category: z.string().min(1, "Category is required"),
    price: z.number().min(0, "Price must be positive"),
    taxRate: z.number().min(0).max(1).optional(),
    isTaxExempt: z.boolean().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
})

type MenuItemFormData = z.infer<typeof menuItemFormSchema>

async function updateMenuItem(id: string, data: MenuItemFormData, recipe?: MenuItemRecipe[]): Promise<void> {
    const docRef = doc(db, "menu_items", id)
    const updateData: any = {
        name: data.name,
        category: data.category,
        price: data.price,
        updated_at: serverTimestamp(),
    }

    if (data.taxRate !== undefined) {
        updateData.taxRate = data.taxRate
    }
    if (data.isTaxExempt !== undefined) {
        updateData.isTaxExempt = data.isTaxExempt
    }
    if (data.imageUrl) {
        updateData.imageUrl = data.imageUrl
    }
    if (recipe && recipe.length > 0) {
        updateData.recipe = recipe
    }

    await updateDoc(docRef, updateData)
}

interface EditMenuItemDialogProps {
    menuItem: MenuItem
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditMenuItemDialog({
    menuItem,
    open,
    onOpenChange,
}: EditMenuItemDialogProps) {
    const queryClient = useQueryClient()
    const { currency } = useSettings()
    const [selectedRecipe, setSelectedRecipe] = useState<MenuItemRecipe[]>([])
    const [recipeIngredientId, setRecipeIngredientId] = useState("")
    const [recipeQuantity, setRecipeQuantity] = useState<number>(0)
    const [recipeUnit, setRecipeUnit] = useState("g")
    const [ingredientSearch, setIngredientSearch] = useState("")

    const { data: ingredients = [] } = useQuery({
        queryKey: ["ingredients"],
        queryFn: getIngredients,
    })

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
            name: menuItem.name || "",
            category: menuItem.category || "",
            price: menuItem.price || 0,
            taxRate: menuItem.taxRate || 0.16,
            isTaxExempt: menuItem.isTaxExempt || false,
            imageUrl: menuItem.imageUrl || "",
        },
    })

    const isTaxExempt = watch("isTaxExempt")

    // Reset form when menuItem changes
    useEffect(() => {
        if (menuItem) {
            reset({
                name: menuItem.name || "",
                category: menuItem.category || "",
                price: menuItem.price || 0,
                taxRate: menuItem.taxRate || 0.16,
                isTaxExempt: menuItem.isTaxExempt || false,
                imageUrl: menuItem.imageUrl || "",
            })
            setSelectedRecipe(menuItem.recipe || [])
        }
    }, [menuItem, reset])

    const updateMenuItemMutation = useMutation({
        mutationFn: async (data: MenuItemFormData) => {
            return updateMenuItem(menuItem.id, data, selectedRecipe)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu-items"] })
            toast({
                title: "Menu Item Updated",
                description: "Menu item has been updated successfully.",
                variant: "default",
            })
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update menu item",
                variant: "destructive",
            })
        },
    })

    const onSubmit = (data: MenuItemFormData) => {
        updateMenuItemMutation.mutate(data)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5" />
                        Edit Menu Item
                    </DialogTitle>
                    <DialogDescription>
                        Update menu item information and recipe. Click save when you're done.
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
                            <Label htmlFor="taxRate">Tax Rate (0-1)</Label>
                            <Input
                                id="taxRate"
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                placeholder="0.16"
                                {...register("taxRate", { valueAsNumber: true })}
                            />
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
                    </div>

                    {/* Recipe Section */}
                    <div className="space-y-3 border-t pt-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-semibold">Recipe Ingredients</Label>
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
                                <Label>Add Ingredient</Label>
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
                                        const exists = selectedRecipe.find(r => r.ingredientId === recipeIngredientId)
                                        if (exists) {
                                            toast({
                                                title: "Ingredient Already Added",
                                                description: `${ingredient.name} is already in the recipe.`,
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
                                        setRecipeIngredientId("")
                                        setRecipeQuantity(0)
                                        setIngredientSearch("")
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
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateMenuItemMutation.isPending}>
                            {updateMenuItemMutation.isPending ? (
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
