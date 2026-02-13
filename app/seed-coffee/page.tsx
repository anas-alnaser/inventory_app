"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/lib/hooks/use-toast"
import { collection, doc, writeBatch, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, Coffee, Package, Utensils, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { ingredientsSeed, menuItemsSeed, type IngredientSeed } from "@/app/seed/seed-content"

// Estimated prices for menu items by category (in JOD)
const categoryPrices: Record<string, number> = {
  "Black Coffee": 2.50,
  "Espresso Based": 3.00,
  "Cold Coffee": 3.50,
  "Frappe": 4.00,
  "Signature": 4.50,
  "Tea": 2.50,
  "Hot Drinks": 3.00,
  "Mocktails": 4.00,
  "Food": 5.00,
  "Dessert": 4.00,
  "default": 3.50,
}

// Estimated default quantities for ingredients (bump up for production use)
function getEstimatedQuantity(ingredient: IngredientSeed): number {
  // If currentQuantity is already set and > 0, use it
  if (ingredient.currentQuantity > 0) {
    return ingredient.currentQuantity
  }

  // Otherwise estimate based on category and unit
  const baseUnit = ingredient.baseUnit

  switch (baseUnit) {
    case "ml":
      return 5000 // 5 liters
    case "g":
      return 2000 // 2 kg
    case "pcs":
      return 100 // 100 pieces
    default:
      return 1000
  }
}

// Estimate cost per unit if not provided
function getEstimatedCost(ingredient: IngredientSeed): number {
  if (ingredient.costPerBaseUnit && ingredient.costPerBaseUnit > 0) {
    return ingredient.costPerBaseUnit
  }

  // Estimate based on category
  const category = ingredient.category.toLowerCase()

  if (category.includes("syrup") || category.includes("sauce")) {
    return 0.015 // JOD per ml
  }
  if (category.includes("powder")) {
    return 0.02 // JOD per g
  }
  if (category.includes("milk") || category.includes("dairy")) {
    return 0.002 // JOD per ml
  }
  if (category.includes("coffee")) {
    return 0.05 // JOD per g
  }
  if (category.includes("fruit") || category.includes("puree")) {
    return 0.01 // JOD per ml
  }

  // Default estimate based on unit
  switch (ingredient.baseUnit) {
    case "ml":
      return 0.005
    case "g":
      return 0.01
    case "pcs":
      return 0.5
    default:
      return 0.01
  }
}

export default function SeedCoffeePage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState("")

  const handleSeedData = async () => {
    if (!userData) {
      toast({
        title: "Error",
        description: "You must be logged in to seed data",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setProgress(0)

    try {
      // Stage 1: Create ingredients
      setStage("Creating ingredients...")
      setProgress(10)

      // Use multiple batches since we might have more than 500 items
      const BATCH_SIZE = 400
      let ingredientCount = 0

      const ingredientIdMap: Record<string, string> = {} // Map old ID to new Firestore ID

      for (let i = 0; i < ingredientsSeed.length; i += BATCH_SIZE) {
        const batch = writeBatch(db)
        const chunk = ingredientsSeed.slice(i, i + BATCH_SIZE)

        for (const ingredient of chunk) {
          const ingredientRef = doc(collection(db, "ingredients"))
          const estimatedQty = getEstimatedQuantity(ingredient)
          const estimatedCost = getEstimatedCost(ingredient)

          batch.set(ingredientRef, {
            name: ingredient.name,
            category: ingredient.category,
            unit: ingredient.baseUnit,
            cost_per_unit: estimatedCost,
            min_stock_level: Math.max(10, estimatedQty * 0.1),
            max_stock_level: estimatedQty * 3,
            supplier_id: null, // Will be set later if supplier exists
            created_at: serverTimestamp(),
          })

          // Also create stock entry
          const stockRef = doc(collection(db, "ingredient_stock"))
          batch.set(stockRef, {
            ingredient_id: ingredientRef.id,
            quantity: estimatedQty,
            last_updated: serverTimestamp(),
          })

          ingredientIdMap[ingredient.id] = ingredientRef.id
          ingredientCount++
        }

        await batch.commit()
        setProgress(10 + (i / ingredientsSeed.length) * 40)
      }

      // Stage 2: Create menu items with recipes
      setStage("Creating menu items...")
      setProgress(55)

      let menuItemCount = 0

      for (let i = 0; i < menuItemsSeed.length; i += BATCH_SIZE) {
        const batch = writeBatch(db)
        const chunk = menuItemsSeed.slice(i, i + BATCH_SIZE)

        for (const menuItem of chunk) {
          const menuItemRef = doc(collection(db, "menu_items"))

          // Get price based on category
          const price = categoryPrices[menuItem.category] || categoryPrices["default"]

          // Build recipe with mapped ingredient IDs
          const recipe = menuItem.recipe.map(line => {
            const ingredient = ingredientsSeed.find(ing => ing.id === line.ingredientId)
            return {
              ingredientId: ingredientIdMap[line.ingredientId] || line.ingredientId,
              ingredientName: ingredient?.name || line.ingredientId,
              quantity: line.amount,
              unit: ingredient?.baseUnit || "g",
            }
          })

          batch.set(menuItemRef, {
            name: menuItem.name,
            category: menuItem.category,
            price: price,
            recipe: recipe,
            isAvailable: true,
            created_at: serverTimestamp(),
          })

          menuItemCount++
        }

        await batch.commit()
        setProgress(55 + (i / menuItemsSeed.length) * 40)
      }

      setProgress(100)
      setStage("Complete!")

      toast({
        title: "Success!",
        description: `Seeded ${ingredientCount} ingredients and ${menuItemCount} menu items.`,
        variant: "default",
      })

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (error: any) {
      console.error("Error seeding data:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to seed data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
              <Coffee className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Coffee Shop Data Seeder</CardTitle>
          <CardDescription>
            Load your complete inventory and menu from the imported data files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 text-sm">
            <p className="font-semibold text-foreground">This will create:</p>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">{ingredientsSeed.length} Ingredients</p>
                  <p className="text-xs text-muted-foreground">
                    Syrups, powders, milk, coffee, packaging, etc.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Utensils className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">{menuItemsSeed.length} Menu Items</p>
                  <p className="text-xs text-muted-foreground">
                    With recipes linked to ingredients
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{stage}</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {progress === 100 && (
            <div className="flex items-center justify-center gap-2 text-green-500 py-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Data seeded successfully!</span>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleSeedData}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Data...
                </>
              ) : (
                <>
                  <Coffee className="mr-2 h-4 w-4" />
                  Load Coffee Shop Data
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="w-full"
              disabled={isLoading}
            >
              Back to Dashboard
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Prices are estimated based on category. You can adjust them in Settings → Menu Items.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
