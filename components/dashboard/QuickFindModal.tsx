"use client"

import { useState, useEffect } from "react"
import { Search, Package, Plus, Minus, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getIngredients, getInventoryWithStock, type InventoryItem } from "@/lib/services"
import { QuickOperationDialog } from "./QuickOperationDialog"

interface QuickFindModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickFindModal({ isOpen, onClose }: QuickFindModalProps) {
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  
  // State for sub-dialogs
  const [operationMode, setOperationMode] = useState<"add" | "use" | null>(null)

  // Fetch inventory on open
  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setSelectedItem(null)
      const fetchInventory = async () => {
        try {
          const data = await getInventoryWithStock()
          setItems(data)
        } catch (error) {
          console.error("Failed to fetch inventory:", error)
        }
      }
      fetchInventory()
    }
  }, [isOpen])

  // Filter items based on query
  useEffect(() => {
    if (!query) {
      setFilteredItems([])
      return
    }
    
    const lowerQuery = query.toLowerCase()
    const results = items.filter(item => 
      item.ingredient.name.toLowerCase().includes(lowerQuery) ||
      item.ingredient.id.toLowerCase().includes(lowerQuery)
    )
    setFilteredItems(results)
    
    // Auto-select if exact match or only one result
    if (results.length === 1) {
      // Optional: auto-select? Maybe better to let user click to avoid jumping
    }
  }, [query, items])

  const handleSelect = (item: InventoryItem) => {
    setSelectedItem(item)
    setQuery("") // Clear query to show details view clearly
  }

  const handleAction = (mode: "add" | "use") => {
    setOperationMode(mode)
  }

  const handleOperationClose = () => {
    setOperationMode(null)
    // Optional: close the find modal too? Or keep it open?
    // Let's keep it open so they can verify the new stock level if they want (though it won't auto-refresh without re-fetching)
    // For better UX, let's close the find modal so they go back to dashboard to see changes
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Quick Find Item</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {!selectedItem ? (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Scan barcode or type name..."
                    className="pl-8 h-12 text-lg"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="max-h-[300px] overflow-y-auto space-y-1">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleSelect(item)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{item.ingredient.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.stock?.quantity || 0} {item.ingredient.unit} in stock
                            </p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          item.status === 'good' ? 'bg-success/10 text-success border-success/20' :
                          item.status === 'low' ? 'bg-warning/10 text-warning border-warning/20' :
                          'bg-destructive/10 text-destructive border-destructive/20'
                        }`}>
                          {item.status.toUpperCase()}
                        </div>
                      </div>
                    ))
                  ) : query ? (
                     <div className="text-center py-8 text-muted-foreground">
                       <p>No items found.</p>
                       <Button variant="link" className="mt-2">
                         Create New Item
                       </Button>
                     </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground flex flex-col items-center">
                      <Search className="h-8 w-8 mb-2 opacity-50" />
                      <p>Start typing to search inventory</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Package className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedItem.ingredient.name}</h3>
                      <p className="text-muted-foreground">{selectedItem.ingredient.category || "Uncategorized"}</p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedItem(null)}>
                    Back
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Current Stock</p>
                    <p className="text-2xl font-bold">
                      {selectedItem.stock?.quantity || 0}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {selectedItem.ingredient.unit}
                      </span>
                    </p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Unit Cost</p>
                    <p className="text-2xl font-bold">
                      {selectedItem.ingredient.cost_per_unit}
                      <span className="text-sm font-normal text-muted-foreground ml-1">JOD</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    className="h-14 bg-warning hover:bg-warning/90 text-warning-foreground" 
                    onClick={() => handleAction("use")}
                  >
                    <Minus className="mr-2 h-5 w-5" />
                    Log Usage
                  </Button>
                  <Button 
                    className="h-14 bg-success hover:bg-success/90" 
                    onClick={() => handleAction("add")}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Restock
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Operation Dialog */}
      {selectedItem && operationMode && (
        <QuickOperationDialog
          isOpen={!!operationMode}
          onClose={handleOperationClose}
          mode={operationMode}
          preselectedIngredientId={selectedItem.ingredient.id}
        />
      )}
    </>
  )
}


