"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// Modifier types for drinks/items
export interface CartItemModifier {
  id: string
  name: string
  price: number
}

export interface CartItem {
  id: string // Unique cart line ID
  menuItemId: string
  name: string
  price: number
  quantity: number
  taxRate: number
  isTaxExempt: boolean
  modifiers: CartItemModifier[]
  notes?: string
}

// Discount types
export interface CartDiscount {
  id: string
  type: 'percentage' | 'fixed'
  value: number
  name: string
}

interface CartContextType {
  items: CartItem[]
  discount: CartDiscount | null
  addItem: (item: Omit<CartItem, 'id' | 'quantity' | 'modifiers'>, modifiers?: CartItemModifier[]) => void
  removeItem: (cartLineId: string) => void
  updateQuantity: (cartLineId: string, quantity: number) => void
  updateModifiers: (cartLineId: string, modifiers: CartItemModifier[]) => void
  updateNotes: (cartLineId: string, notes: string) => void
  clearCart: () => void
  getItemQuantity: (menuItemId: string) => number
  getCartTotal: () => number
  setDiscount: (discount: CartDiscount | null) => void
  getDiscountAmount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [discount, setDiscount] = useState<CartDiscount | null>(null)

  // Generate unique cart line ID
  const generateCartLineId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const addItem = useCallback((
    item: Omit<CartItem, 'id' | 'quantity' | 'modifiers'>,
    modifiers: CartItemModifier[] = []
  ) => {
    setItems(prev => {
      // Check if item with same menuItemId AND same modifiers exists
      const existingItemIndex = prev.findIndex(
        i => i.menuItemId === item.menuItemId &&
          JSON.stringify(i.modifiers) === JSON.stringify(modifiers)
      )

      if (existingItemIndex > -1) {
        // Increment quantity
        const updated = [...prev]
        updated[existingItemIndex] = {
          ...updated[existingItemIndex],
          quantity: updated[existingItemIndex].quantity + 1
        }
        return updated
      }

      // Add new item
      return [...prev, {
        ...item,
        id: generateCartLineId(),
        quantity: 1,
        modifiers,
      }]
    })
  }, [])

  const removeItem = useCallback((cartLineId: string) => {
    setItems(prev => prev.filter(item => item.id !== cartLineId))
  }, [])

  const updateQuantity = useCallback((cartLineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartLineId)
      return
    }
    setItems(prev =>
      prev.map(item =>
        item.id === cartLineId ? { ...item, quantity } : item
      )
    )
  }, [removeItem])

  const updateModifiers = useCallback((cartLineId: string, modifiers: CartItemModifier[]) => {
    setItems(prev =>
      prev.map(item =>
        item.id === cartLineId ? { ...item, modifiers } : item
      )
    )
  }, [])

  const updateNotes = useCallback((cartLineId: string, notes: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === cartLineId ? { ...item, notes } : item
      )
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    setDiscount(null)
  }, [])

  const getItemQuantity = useCallback((menuItemId: string) => {
    return items
      .filter(item => item.menuItemId === menuItemId)
      .reduce((sum, item) => sum + item.quantity, 0)
  }, [items])

  const getCartTotal = useCallback(() => {
    return items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity
      const modifiersTotal = item.modifiers.reduce((sum, mod) => sum + mod.price, 0) * item.quantity
      return total + itemTotal + modifiersTotal
    }, 0)
  }, [items])

  const getDiscountAmount = useCallback(() => {
    if (!discount) return 0
    const subtotal = getCartTotal()
    if (discount.type === 'percentage') {
      return subtotal * (discount.value / 100)
    }
    return Math.min(discount.value, subtotal) // Don't exceed subtotal
  }, [discount, getCartTotal])

  return (
    <CartContext.Provider
      value={{
        items,
        discount,
        addItem,
        removeItem,
        updateQuantity,
        updateModifiers,
        updateNotes,
        clearCart,
        getItemQuantity,
        getCartTotal,
        setDiscount,
        getDiscountAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
