"use client"

import { useState } from "react"
import { Plus, Minus, Coffee, Check } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/services/tax"
import { cn } from "@/lib/utils"
import type { MenuItem } from "@/types/entities"
import type { CartItemModifier } from "@/lib/stores/pos-cart"

interface ModifierOption {
    id: string
    name: string
    price: number
    category: string
}

// Common coffee shop modifiers
const modifierOptions: ModifierOption[] = [
    // Milk Options
    { id: "oat-milk", name: "Oat Milk", price: 0.50, category: "Milk" },
    { id: "almond-milk", name: "Almond Milk", price: 0.50, category: "Milk" },
    { id: "soy-milk", name: "Soy Milk", price: 0.40, category: "Milk" },
    { id: "coconut-milk", name: "Coconut Milk", price: 0.50, category: "Milk" },
    { id: "skim-milk", name: "Skim Milk", price: 0, category: "Milk" },

    // Shots & Extras
    { id: "extra-shot", name: "Extra Shot", price: 0.75, category: "Shots" },
    { id: "double-shot", name: "Double Shot", price: 1.25, category: "Shots" },
    { id: "decaf", name: "Decaf", price: 0, category: "Shots" },

    // Syrups
    { id: "vanilla", name: "Vanilla Syrup", price: 0.50, category: "Syrups" },
    { id: "caramel", name: "Caramel Syrup", price: 0.50, category: "Syrups" },
    { id: "hazelnut", name: "Hazelnut Syrup", price: 0.50, category: "Syrups" },
    { id: "mocha", name: "Mocha Syrup", price: 0.50, category: "Syrups" },

    // Toppings
    { id: "whipped-cream", name: "Whipped Cream", price: 0.30, category: "Toppings" },
    { id: "chocolate-drizzle", name: "Chocolate Drizzle", price: 0.30, category: "Toppings" },
    { id: "caramel-drizzle", name: "Caramel Drizzle", price: 0.30, category: "Toppings" },

    // Preparation
    { id: "extra-hot", name: "Extra Hot", price: 0, category: "Preparation" },
    { id: "light-ice", name: "Light Ice", price: 0, category: "Preparation" },
    { id: "no-ice", name: "No Ice", price: 0, category: "Preparation" },
]

// Group modifiers by category
const modifiersByCategory = modifierOptions.reduce((acc, mod) => {
    if (!acc[mod.category]) {
        acc[mod.category] = []
    }
    acc[mod.category].push(mod)
    return acc
}, {} as Record<string, ModifierOption[]>)

interface ModifierDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    menuItem: MenuItem | null
    onAddToCart: (modifiers: CartItemModifier[], notes: string, quantity: number) => void
}

export function ModifierDialog({
    open,
    onOpenChange,
    menuItem,
    onAddToCart,
}: ModifierDialogProps) {
    const [selectedModifiers, setSelectedModifiers] = useState<CartItemModifier[]>([])
    const [notes, setNotes] = useState("")
    const [quantity, setQuantity] = useState(1)

    const handleToggleModifier = (mod: ModifierOption) => {
        setSelectedModifiers((prev) => {
            const exists = prev.find((m) => m.id === mod.id)
            if (exists) {
                return prev.filter((m) => m.id !== mod.id)
            }
            return [...prev, { id: mod.id, name: mod.name, price: mod.price }]
        })
    }

    const handleAddToCart = () => {
        onAddToCart(selectedModifiers, notes, quantity)
        // Reset state
        setSelectedModifiers([])
        setNotes("")
        setQuantity(1)
        onOpenChange(false)
    }

    const handleClose = () => {
        setSelectedModifiers([])
        setNotes("")
        setQuantity(1)
        onOpenChange(false)
    }

    const basePrice = menuItem?.price || 0
    const modifiersPrice = selectedModifiers.reduce((sum, m) => sum + m.price, 0)
    const itemTotal = (basePrice + modifiersPrice) * quantity

    if (!menuItem) return null

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        {menuItem.imageUrl ? (
                            <img
                                src={menuItem.imageUrl}
                                alt={menuItem.name}
                                className="w-16 h-16 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 dark:from-cyan-500/30 dark:to-teal-500/30 flex items-center justify-center">
                                <Coffee className="h-8 w-8 text-cyan-500 dark:text-cyan-400" />
                            </div>
                        )}
                        <div>
                            <DialogTitle className="text-foreground">{menuItem.name}</DialogTitle>
                            <DialogDescription>
                                Base price: <span className="text-cyan-600 dark:text-cyan-400 font-medium">{formatCurrency(basePrice)} JOD</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-6">
                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between bg-muted dark:bg-muted/50 rounded-xl p-4">
                        <span className="font-medium text-foreground">Quantity</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 rounded-full bg-card dark:bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-xl font-bold text-foreground w-8 text-center">
                                {quantity}
                            </span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Modifiers by Category */}
                    {Object.entries(modifiersByCategory).map(([category, mods]) => (
                        <div key={category}>
                            <h4 className="text-sm font-semibold text-foreground mb-3">{category}</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {mods.map((mod) => {
                                    const isSelected = selectedModifiers.some((m) => m.id === mod.id)
                                    return (
                                        <motion.button
                                            key={mod.id}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleToggleModifier(mod)}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                                                isSelected
                                                    ? "border-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/20"
                                                    : "border-border hover:border-cyan-500/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={cn(
                                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                        isSelected
                                                            ? "border-cyan-500 bg-gradient-to-r from-cyan-500 to-teal-500"
                                                            : "border-muted-foreground/30"
                                                    )}
                                                >
                                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                                <span className="text-sm font-medium text-foreground">{mod.name}</span>
                                            </div>
                                            {mod.price > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-0"
                                                >
                                                    +{formatCurrency(mod.price)}
                                                </Badge>
                                            )}
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Special Instructions */}
                    <div>
                        <h4 className="text-sm font-semibold text-foreground mb-3">Special Instructions</h4>
                        <Textarea
                            placeholder="Any special requests? (e.g., extra foam, no whip)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="resize-none bg-muted dark:bg-muted/50 border-border focus:ring-cyan-500"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Selected Modifiers Summary */}
                {selectedModifiers.length > 0 && (
                    <div className="py-3 border-t border-border">
                        <div className="flex flex-wrap gap-1">
                            {selectedModifiers.map((mod) => (
                                <Badge
                                    key={mod.id}
                                    variant="secondary"
                                    className="cursor-pointer bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 hover:bg-destructive/20 hover:text-destructive transition-colors border-0"
                                    onClick={() => handleToggleModifier(mod as ModifierOption)}
                                >
                                    {mod.name}
                                    {mod.price > 0 && ` +${formatCurrency(mod.price)}`}
                                    <span className="ml-1">×</span>
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                <DialogFooter className="border-t border-border pt-4">
                    <div className="w-full space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Item Total</span>
                            <span className="text-xl font-bold bg-gradient-to-r from-cyan-500 to-teal-500 bg-clip-text text-transparent">
                                {formatCurrency(itemTotal)} JOD
                            </span>
                        </div>
                        <Button
                            onClick={handleAddToCart}
                            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/30"
                            size="lg"
                        >
                            Add {quantity} to Order
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
