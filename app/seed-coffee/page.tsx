"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/hooks/use-toast"
import { collection, addDoc, getDocs, deleteDoc, doc, writeBatch, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, Coffee } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"

export default function SeedCoffeePage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

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

    try {
      const batch = writeBatch(db)

      // First, get suppliers to use for ingredients
      const suppliersSnapshot = await getDocs(collection(db, 'suppliers'))
      let supplierId = suppliersSnapshot.docs[0]?.id

      // If no suppliers exist, create a default one
      if (!supplierId) {
        const supplierRef = doc(collection(db, 'suppliers'))
        batch.set(supplierRef, {
          name: "Coffee Supply Co.",
          phone: "+962 7 1234 5678",
          email: "orders@coffeesupply.com",
          contact_person: "John Doe",
          created_at: serverTimestamp(),
        })
        supplierId = supplierRef.id
      }

      // Ingredients data
      const ingredients = [
        {
          name: "Espresso Beans",
          unit: "g" as const,
          cost_per_unit: 0.05, // 5 JOD per 100g
          supplier_id: supplierId,
          category: "Coffee",
          min_stock_level: 1000,
          max_stock_level: 10000,
        },
        {
          name: "Whole Milk",
          unit: "mL" as const,
          cost_per_unit: 0.001, // 1 JOD per liter
          supplier_id: supplierId,
          category: "Dairy",
          min_stock_level: 2000,
          max_stock_level: 50000,
        },
        {
          name: "Oat Milk",
          unit: "mL" as const,
          cost_per_unit: 0.0015, // 1.5 JOD per liter
          supplier_id: supplierId,
          category: "Dairy",
          min_stock_level: 1000,
          max_stock_level: 20000,
        },
        {
          name: "Caramel Syrup",
          unit: "mL" as const,
          cost_per_unit: 0.002, // 2 JOD per liter
          supplier_id: supplierId,
          category: "Syrups",
          min_stock_level: 500,
          max_stock_level: 5000,
        },
        {
          name: "Paper Cups (12oz)",
          unit: "piece" as const,
          cost_per_unit: 0.1, // 0.1 JOD per cup
          supplier_id: supplierId,
          category: "Packaging",
          min_stock_level: 50,
          max_stock_level: 1000,
        },
        {
          name: "Sugar Packets",
          unit: "piece" as const,
          cost_per_unit: 0.01, // 0.01 JOD per packet
          supplier_id: supplierId,
          category: "Dry Goods",
          min_stock_level: 100,
          max_stock_level: 2000,
        },
      ]

      // Create ingredients
      const ingredientIds: { [key: string]: string } = {}
      for (const ingredient of ingredients) {
        const ingredientRef = doc(collection(db, 'ingredients'))
        batch.set(ingredientRef, {
          ...ingredient,
          created_at: serverTimestamp(),
        })
        ingredientIds[ingredient.name] = ingredientRef.id
      }

      // Create initial stock
      const stockData = [
        { ingredient_name: "Espresso Beans", quantity: 5000 },
        { ingredient_name: "Whole Milk", quantity: 20000 },
        { ingredient_name: "Oat Milk", quantity: 10000 },
        { ingredient_name: "Caramel Syrup", quantity: 2000 },
        { ingredient_name: "Paper Cups (12oz)", quantity: 500 },
        { ingredient_name: "Sugar Packets", quantity: 1000 },
      ]

      for (const stock of stockData) {
        const stockRef = doc(collection(db, 'ingredient_stock'))
        batch.set(stockRef, {
          ingredient_id: ingredientIds[stock.ingredient_name],
          quantity: stock.quantity,
          last_updated: serverTimestamp(),
        })
      }

      // Menu items with recipes
      const menuItems = [
        {
          name: "Latte",
          category: "Beverages",
          price: 4.50,
          recipe: [
            { ingredientId: ingredientIds["Espresso Beans"], ingredientName: "Espresso Beans", quantity: 18, unit: "g" },
            { ingredientId: ingredientIds["Whole Milk"], ingredientName: "Whole Milk", quantity: 250, unit: "mL" },
            { ingredientId: ingredientIds["Paper Cups (12oz)"], ingredientName: "Paper Cups (12oz)", quantity: 1, unit: "piece" },
          ],
        },
        {
          name: "Oat Flat White",
          category: "Beverages",
          price: 5.00,
          recipe: [
            { ingredientId: ingredientIds["Espresso Beans"], ingredientName: "Espresso Beans", quantity: 18, unit: "g" },
            { ingredientId: ingredientIds["Oat Milk"], ingredientName: "Oat Milk", quantity: 200, unit: "mL" },
            { ingredientId: ingredientIds["Paper Cups (12oz)"], ingredientName: "Paper Cups (12oz)", quantity: 1, unit: "piece" },
          ],
        },
        {
          name: "Caramel Macchiato",
          category: "Beverages",
          price: 5.50,
          recipe: [
            { ingredientId: ingredientIds["Espresso Beans"], ingredientName: "Espresso Beans", quantity: 18, unit: "g" },
            { ingredientId: ingredientIds["Whole Milk"], ingredientName: "Whole Milk", quantity: 250, unit: "mL" },
            { ingredientId: ingredientIds["Caramel Syrup"], ingredientName: "Caramel Syrup", quantity: 30, unit: "mL" },
            { ingredientId: ingredientIds["Paper Cups (12oz)"], ingredientName: "Paper Cups (12oz)", quantity: 1, unit: "piece" },
          ],
        },
        {
          name: "Double Espresso",
          category: "Beverages",
          price: 3.00,
          recipe: [
            { ingredientId: ingredientIds["Espresso Beans"], ingredientName: "Espresso Beans", quantity: 18, unit: "g" },
            { ingredientId: ingredientIds["Paper Cups (12oz)"], ingredientName: "Paper Cups (12oz)", quantity: 1, unit: "piece" },
          ],
        },
      ]

      // Create menu items
      for (const menuItem of menuItems) {
        const menuItemRef = doc(collection(db, 'menu_items'))
        batch.set(menuItemRef, {
          name: menuItem.name,
          category: menuItem.category,
          price: menuItem.price,
          recipe: menuItem.recipe,
          created_at: serverTimestamp(),
        })
      }

      // Commit all writes
      await batch.commit()

      toast({
        title: "Success!",
        description: "Coffee shop data has been seeded successfully.",
        variant: "default",
      })

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Coffee className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Coffee Shop Data Seeder</CardTitle>
          <CardDescription>
            Load sample coffee shop data including ingredients, stock levels, and menu items with recipes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">This will create:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>6 Ingredients (Espresso Beans, Milk, Oat Milk, Caramel Syrup, Cups, Sugar)</li>
              <li>Initial stock levels for each ingredient</li>
              <li>4 Menu Items (Latte, Oat Flat White, Caramel Macchiato, Double Espresso)</li>
              <li>Recipe definitions linking menu items to ingredients</li>
            </ul>
          </div>
          <Button
            onClick={handleSeedData}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Data...
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
        </CardContent>
      </Card>
    </div>
  )
}

