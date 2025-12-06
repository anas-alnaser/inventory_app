"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useToast } from "@/lib/hooks/use-toast"

import { useAuth } from "@/lib/hooks/useAuth"
import { getIngredients, updateStockTransaction, type Ingredient } from "@/lib/services"

const formSchema = z.object({
  ingredientId: z.string().min(1, "Please select an ingredient"),
  quantity: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Quantity must be a positive number",
  }),
  unit: z.string().min(1, "Please select a unit"),
  reason: z.string().optional(),
})

interface QuickOperationDialogProps {
  isOpen: boolean
  onClose: () => void
  mode: "add" | "use"
  preselectedIngredientId?: string
}

// Helper to determine if a unit is a custom purchase unit
const isPurchaseUnit = (unit: string, ingredient?: Ingredient) => {
  if (!ingredient) return false;
  // This logic assumes purchase units are things like "Sack", "Box", "Carton" 
  // and base units are "g", "ml", "kg", "L", "pcs"
  // A robust implementation would check against the ingredient's defined purchase unit
  // Since the current Ingredient type might not have purchaseUnit exposed fully yet in all contexts,
  // we'll rely on what's available or default logic.
  // For this fix, we will just pass the unit selected.
  // If we had the extended ingredient data with purchaseUnit and purchaseUnitSize, we would check that.
  return false; 
}

export function QuickOperationDialog({
  isOpen,
  onClose,
  mode,
  preselectedIngredientId,
}: QuickOperationDialogProps) {
  const { userData } = useAuth()
  const { toast } = useToast()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(false)
  
  // We don't strictly need this local state if we use form.watch, but it's handy for unit logic
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredientId: preselectedIngredientId || "",
      quantity: "",
      unit: "",
      reason: mode === "add" ? "purchase" : "usage",
    },
  })

  // Watch for ingredient changes to update available units
  const watchedIngredientId = form.watch("ingredientId")

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        ingredientId: preselectedIngredientId || "",
        quantity: "",
        unit: "",
        reason: mode === "add" ? "purchase" : "usage",
      })
    }
  }, [isOpen, mode, preselectedIngredientId, form])

  // Fetch ingredients
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const data = await getIngredients()
        setIngredients(data)
      } catch (error) {
        console.error("Failed to fetch ingredients:", error)
      }
    }
    fetchIngredients()
  }, [])

  // Update selected ingredient and auto-populate unit when ID changes
  useEffect(() => {
    if (watchedIngredientId && ingredients.length > 0) {
      const ing = ingredients.find((i) => i.id === watchedIngredientId)
      setSelectedIngredient(ing || null)
      
      if (ing) {
        // Auto-select the base unit
        form.setValue("unit", ing.unit, { shouldValidate: true })
      } else {
        form.setValue("unit", "", { shouldValidate: true })
      }
    } else {
      setSelectedIngredient(null)
    }
  }, [watchedIngredientId, ingredients, form])


  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userData?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let quantity = Number(values.quantity)
      
      // Simple unit conversion logic if we had purchase units
      // For now, we are forcing the base unit so 1:1 conversion
      // If we implemented purchase units, we would multiply by purchaseUnitSize here
      
      // Calculate final change amount
      // Log usage means subtracting stock, so we multiply by -1 for usage
      const changeAmount = (mode === "add" ? 1 : -1) * quantity
      
      console.log('Submitting Stock Transaction:', {
        ingredientId: values.ingredientId,
        mode,
        quantity,
        changeAmount,
        reason: values.reason,
        userId: userData.id
      })

      await updateStockTransaction(
        values.ingredientId,
        changeAmount,
        userData.id,
        values.reason as any,
        `Quick ${mode} action via dashboard`
      )

      toast({
        title: "Success",
        description: `Successfully ${mode === "add" ? "added stock" : "logged usage"}.`,
        className: "status-success",
      })
      onClose()
    } catch (error) {
      console.error("Transaction error:", error)
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add Stock" : "Log Usage"}</DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Record new inventory arrival."
              : "Record ingredient consumption."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="ingredientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredient</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    disabled={!!preselectedIngredientId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ingredient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ingredients.map((ing) => (
                        <SelectItem key={ing.id} value={ing.id}>
                          {ing.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      // Allow changing unit if multiple options exist (future proofing)
                      disabled={!selectedIngredient} 
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedIngredient ? (
                           <>
                             <SelectItem value={selectedIngredient.unit}>
                               {selectedIngredient.unit} (Base)
                             </SelectItem>
                             {/* Future: Add purchase unit option here if available */}
                           </>
                        ) : (
                          <SelectItem value="unit" disabled>Select Item First</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className={mode === "add" ? "bg-success hover:bg-success/90" : "bg-warning hover:bg-warning/90 text-warning-foreground"}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === "add" ? "Add Stock" : "Log Usage"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
