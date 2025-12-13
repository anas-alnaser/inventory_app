"use client"

import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { Minus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/lib/hooks/use-toast"
import { SmartUnitInput } from "@/components/inventory/SmartUnitInput"
import { updateStockTransaction, type InventoryItem } from "@/lib/services"

interface LogUsageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inventory: InventoryItem[]
  userId: string
  onSuccess?: () => void
}

export function LogUsageDialog({
  open,
  onOpenChange,
  inventory,
  userId,
  onSuccess,
}: LogUsageDialogProps) {
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("")
  const [usageQuantity, setUsageQuantity] = useState(0)
  const [usageUnit, setUsageUnit] = useState("kg")
  const [usageBaseQuantity, setUsageBaseQuantity] = useState(0)
  const [usageReason, setUsageReason] = useState<"consumption" | "waste" | "expired" | "correction">("consumption")

  const selectedItem = inventory.find(i => i.ingredient.id === selectedIngredientId)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedIngredientId("")
      setUsageQuantity(0)
      setUsageUnit("kg")
      setUsageBaseQuantity(0)
      setUsageReason("consumption")
    } else if (selectedItem) {
      setUsageUnit(selectedItem.ingredient.unit)
    }
  }, [open, selectedItem])

  const getUnitType = (unit: string): "weight" | "volume" | "count" => {
    if (["g", "kg", "sack_10kg", "sack_25kg", "sack_50kg"].includes(unit)) {
      return "weight"
    }
    if (["mL", "L", "gallon"].includes(unit)) {
      return "volume"
    }
    return "count"
  }

  const logUsageMutation = useMutation({
    mutationFn: async (data: {
      ingredient_id: string
      baseQuantity: number
      reason: "consumption" | "waste" | "expired" | "correction"
    }) => {
      // Use negative change amount for usage/waste
      return updateStockTransaction(
        data.ingredient_id,
        -data.baseQuantity,
        userId,
        data.reason,
        `Logged ${data.reason}`
      )
    },
    onSuccess: () => {
      toast({
        title: "Usage Logged",
        description: `Successfully logged ${usageReason} for ${selectedItem?.ingredient.name}`,
        variant: "default",
      })
      onOpenChange(false)
      onSuccess?.()
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log usage",
        variant: "destructive",
      })
    },
  })

  const handleLogUsage = () => {
    if (!selectedItem || usageBaseQuantity <= 0) return
    logUsageMutation.mutate({
      ingredient_id: selectedItem.ingredient.id,
      baseQuantity: usageBaseQuantity,
      reason: usageReason,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Usage / Waste</DialogTitle>
          <DialogDescription>
            Record ingredient usage, waste, or corrections. This will deduct from stock.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Ingredient</Label>
            <Select
              value={selectedIngredientId}
              onValueChange={(value) => {
                setSelectedIngredientId(value)
                const item = inventory.find(i => i.ingredient.id === value)
                if (item) {
                  setUsageUnit(item.ingredient.unit)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select ingredient" />
              </SelectTrigger>
              <SelectContent>
                {inventory.map((item) => (
                  <SelectItem key={item.ingredient.id} value={item.ingredient.id}>
                    {item.ingredient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedItem && (
            <>
              <SmartUnitInput
                value={usageQuantity}
                unit={usageUnit}
                unitType={getUnitType(selectedItem.ingredient.unit)}
                onChange={(qty, unit, baseValue) => {
                  setUsageQuantity(qty)
                  setUsageUnit(unit)
                  setUsageBaseQuantity(baseValue)
                }}
                label="Quantity to Remove"
                placeholder="Enter amount"
              />
              <div className="space-y-2">
                <Label htmlFor="usage-reason">Reason</Label>
                <Select value={usageReason} onValueChange={(value: any) => setUsageReason(value)}>
                  <SelectTrigger id="usage-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consumption">Consumption</SelectItem>
                    <SelectItem value="waste">Waste</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="correction">Correction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLogUsage}
            disabled={
              inventory.length === 0 ||
              !selectedItem ||
              usageBaseQuantity <= 0 ||
              logUsageMutation.isPending
            }
            variant="destructive"
          >
            {logUsageMutation.isPending ? "Logging..." : "Log Usage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

