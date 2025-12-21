"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Minus, Coffee, Sparkles, Star, Flame } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/services/tax"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { MenuItem } from "@/types/entities"

interface MenuGridProps {
  menuItems: MenuItem[]
  onAddItem: (item: MenuItem) => void
  onQuantityChange: (menuItemId: string, delta: number) => void
  getItemQuantity: (menuItemId: string) => number
  isLoading?: boolean
  searchQuery: string
  onSearchChange: (query: string) => void
}

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  "Hot Drinks": <Coffee className="h-4 w-4" />,
  "Cold Drinks": <Sparkles className="h-4 w-4" />,
  "Specialty": <Star className="h-4 w-4" />,
  "Food": <Flame className="h-4 w-4" />,
  "Desserts": <Star className="h-4 w-4" />,
  "Beverage": <Coffee className="h-4 w-4" />,
  "Bevarage": <Coffee className="h-4 w-4" />,
}

export function MenuGrid({
  menuItems,
  onAddItem,
  onQuantityChange,
  getItemQuantity,
  isLoading = false,
  searchQuery,
  onSearchChange,
}: MenuGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("All")

  // Get unique categories with counts
  const categories = useMemo(() => {
    const cats = Array.from(new Set(menuItems.map((item) => item.category || "Uncategorized")))
    return [
      { name: "All", count: menuItems.length, icon: <Coffee className="h-4 w-4" /> },
      ...cats.map((cat) => ({
        name: cat,
        count: menuItems.filter((item) => item.category === cat).length,
        icon: categoryIcons[cat] || <Coffee className="h-4 w-4" />,
      })),
    ]
  }, [menuItems])

  // Filter menu items by search and category
  const filteredItems = useMemo(() => {
    let items = menuItems

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (selectedCategory !== "All") {
      items = items.filter((item) => item.category === selectedCategory)
    }

    return items
  }, [menuItems, searchQuery, selectedCategory])

  // Popular items (first 4 items or items marked as popular)
  const popularItems = useMemo(() => {
    return menuItems.slice(0, 4)
  }, [menuItems])

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/30 dark:bg-background">
      {/* Search Bar */}
      <div className="p-4 bg-card dark:bg-card border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 bg-muted dark:bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-cyan-500"
          />
        </div>
      </div>

      {/* Popular Items - Quick Add */}
      {!searchQuery && selectedCategory === "All" && popularItems.length > 0 && (
        <div className="px-4 py-3 bg-card dark:bg-card border-b border-border">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-foreground">Popular Items</span>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {popularItems.map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAddItem(item)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 hover:bg-cyan-500/20 dark:hover:bg-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-medium text-sm transition-colors border border-cyan-500/20"
              >
                <Plus className="h-3.5 w-3.5" />
                {item.name}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="px-4 py-3 bg-card dark:bg-card border-b border-border">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((category) => {
            const isActive = selectedCategory === category.name
            return (
              <motion.button
                key={category.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategory(category.name)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30"
                    : "bg-muted dark:bg-muted/50 hover:bg-accent text-muted-foreground hover:text-foreground border border-border"
                )}
              >
                {category.icon}
                <span>{category.name}</span>
                <Badge
                  variant="secondary"
                  className={cn(
                    "ml-1 px-1.5 py-0 text-xs",
                    isActive
                      ? "bg-white/20 text-white border-0"
                      : "bg-background dark:bg-muted"
                  )}
                >
                  {category.count}
                </Badge>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Coffee className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No items found</p>
            <p className="text-sm text-muted-foreground/70">
              {searchQuery ? `No results for "${searchQuery}"` : "No items in this category"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => {
                const quantity = getItemQuantity(item.id)
                const isSelected = quantity > 0

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -4 }}
                    className={cn(
                      "group relative bg-card dark:bg-card rounded-2xl border overflow-hidden transition-all cursor-pointer",
                      isSelected
                        ? "border-cyan-500 shadow-lg shadow-cyan-500/20 dark:shadow-cyan-500/10"
                        : "border-border hover:border-cyan-500/50 hover:shadow-md dark:hover:shadow-cyan-500/5"
                    )}
                    onClick={() => onAddItem(item)}
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-muted dark:bg-muted/50">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/20 dark:to-teal-500/20">
                          <Coffee className="h-12 w-12 text-cyan-500/40 dark:text-cyan-400/40" />
                        </div>
                      )}

                      {/* Quantity Badge */}
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-lg"
                        >
                          {quantity}
                        </motion.div>
                      )}

                      {/* Quick Add Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Content */}
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.category || "Uncategorized"}
                      </p>
                      <h3 className="font-semibold text-foreground text-sm line-clamp-1 mb-2">
                        {item.name}
                      </h3>

                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">
                          {formatCurrency(item.price)} JOD
                        </span>

                        {isSelected ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onQuantityChange(item.id, -1)}
                              className="w-7 h-7 rounded-full bg-muted dark:bg-muted/50 hover:bg-destructive/20 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center font-medium text-sm">{quantity}</span>
                            <button
                              onClick={() => onQuantityChange(item.id, 1)}
                              className="w-7 h-7 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onAddItem(item)
                            }}
                            className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-md shadow-cyan-500/30"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
