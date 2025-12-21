"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { CalendarIcon, FileSpreadsheet, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/lib/hooks/use-toast"
import { useAuth } from "@/lib/hooks/useAuth"
import { useSettings } from "@/lib/hooks/useSettings"
import { recordDailySales, getMenuItemsWithFinancials, type MenuItemWithFinancials } from "@/lib/services"
import { formatCurrency } from "@/lib/utils"

interface SalesRow {
  id: string
  menuItemId: string
  quantity: number
}

function formatDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export default function DailySalesPage() {
  const { userData } = useAuth()
  const { currency } = useSettings()
  const [date, setDate] = useState<string>(() => formatDateInputValue(new Date()))
  const [rows, setRows] = useState<SalesRow[]>([
    { id: "row-1", menuItemId: "", quantity: 0 },
  ])
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { data: menuItems = [], isLoading: isLoadingMenu } = useQuery({
    queryKey: ["menu-items-for-sales"],
    queryFn: () => getMenuItemsWithFinancials(),
  })

  const menuItemsById = useMemo(() => {
    const map = new Map<string, MenuItemWithFinancials>()
    menuItems.forEach((item) => {
      if (item.id) {
        map.set(item.id, item)
      }
    })
    return map
  }, [menuItems])

  const totals = useMemo(() => {
    let estimatedRevenue = 0
    let estimatedCost = 0

    for (const row of rows) {
      if (!row.menuItemId || row.quantity <= 0) continue
      const menuItem = menuItemsById.get(row.menuItemId)
      if (!menuItem) continue

      const price = menuItem.price || 0
      estimatedRevenue += price * row.quantity

      // Use the calculated cost from the menu item (which uses current ingredient prices)
      const costPerUnit = menuItem.calculatedCost || 0
      estimatedCost += costPerUnit * row.quantity
    }

    return {
      estimatedRevenue,
      estimatedCost,
    }
  }, [rows, menuItemsById])

  const totalItemsToDeduct = useMemo(() => {
    return rows
      .filter((row) => row.menuItemId && row.quantity > 0)
      .reduce((sum, row) => sum + row.quantity, 0)
  }, [rows])

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${prev.length + 1}-${Date.now()}`,
        menuItemId: "",
        quantity: 0,
      },
    ])
  }

  const updateRow = (id: string, changes: Partial<SalesRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...changes } : row)))
  }

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)))
  }

  const recordSalesMutation = useMutation({
    mutationFn: async () => {
      const salesPayload = rows
        .filter((row) => row.menuItemId && row.quantity > 0)
        .map((row) => ({
          menuItemId: row.menuItemId,
          quantity: row.quantity,
        }))

      if (!salesPayload.length) {
        throw new Error("Please add at least one menu item with quantity > 0.")
      }

      const selectedDate = new Date(date)
      if (Number.isNaN(selectedDate.getTime())) {
        throw new Error("Please select a valid date.")
      }

      if (!userData?.branchId) {
        throw new Error("Branch ID is required for data isolation")
      }
      return recordDailySales(selectedDate, userData.branchId, salesPayload)
    },
    onSuccess: () => {
      toast({
        title: "Stock updated successfully",
        description: "Inventory was updated based on the recorded sales.",
        variant: "default",
      })

      // Fully clear the form after a successful submission
      setRows([{ id: "row-1", menuItemId: "", quantity: 0 }])
      setDate(formatDateInputValue(new Date()))
      setIsConfirmOpen(false)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to record daily sales.",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsConfirmOpen(true)
  }

  const handleConfirm = () => {
    recordSalesMutation.mutate()
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daily Sales</h1>
          <p className="text-muted-foreground">
            Record your end-of-day Z-Report so StockWave can update inventory from sales.
          </p>
        </div>
        {userData?.role && (
          <Badge variant="outline" className="self-start sm:self-auto">
            Role: {userData.role}
          </Badge>
        )}
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date & CSV Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sales Date</CardTitle>
              <CardDescription>Select the business day you are closing.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <div className="space-y-1">
                  <Label htmlFor="sales-date">Date</Label>
                  <div className="relative">
                    <Input
                      id="sales-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="pr-9"
                    />
                    <CalendarIcon className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground sm:mt-6">
                  Defaulted to today. Adjust if you are back-filling a previous day.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                Upload POS Report (CSV)
              </CardTitle>
              <CardDescription>Coming soon – paste your Z-Report CSV here.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 px-4 py-6 text-center">
                <p className="text-xs text-muted-foreground max-w-xs">
                  Drag &amp; drop your POS CSV here or click to browse. We&apos;ll auto-fill sales
                  from your Z-Report.
                </p>
                <Button type="button" variant="outline" size="sm" disabled>
                  Upload CSV (Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Rows */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sales by Menu Item</CardTitle>
            <CardDescription>
              Add each sold menu item and the total quantity sold for the selected day.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_auto] gap-3 items-center text-xs text-muted-foreground mb-1">
              <span>Menu Item</span>
              <span className="text-right">Qty Sold</span>
              <span className="sr-only">Actions</span>
            </div>

            <div className="space-y-3">
              {rows.map((row) => {
                const selectedItem = row.menuItemId
                  ? menuItemsById.get(row.menuItemId)
                  : undefined

                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)_auto] gap-3 items-center"
                  >
                    <div className="space-y-1">
                      <Select
                        value={row.menuItemId}
                        onValueChange={(value) => updateRow(row.id, { menuItemId: value })}
                        disabled={isLoadingMenu}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={isLoadingMenu ? "Loading menu..." : "Select menu item"}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {menuItems.map((item) => (
                            <SelectItem key={item.id} value={item.id!}>
                              {item.name}{" "}
                              {typeof item.price === "number"
                                ? `– ${formatCurrency(item.price, currency)}`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedItem && (
                        <p className="text-[11px] text-muted-foreground">
                          {selectedItem.category && `${selectedItem.category} • `}
                          Price:{" "}
                          {typeof selectedItem.price === "number"
                            ? formatCurrency(selectedItem.price, currency)
                            : "N/A"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Input
                        type="number"
                        min={0}
                        value={row.quantity || ""}
                        onChange={(e) =>
                          updateRow(row.id, {
                            quantity: e.target.value === "" ? 0 : Number(e.target.value) || 0,
                          })
                        }
                        inputMode="numeric"
                        className="text-right"
                      />
                    </div>

                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button type="button" variant="outline" size="sm" onClick={addRow} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Row
              </Button>
              <p className="text-xs text-muted-foreground">
                Tip: Quantities are usually the total from your Z-Report for the whole day.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Summary & Submit */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Summary</CardTitle>
              <CardDescription>Live estimates from the items and quantities above.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Revenue</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(totals.estimatedRevenue, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Cost</span>
                <span className="text-lg font-semibold text-amber-500">
                  {formatCurrency(totals.estimatedCost, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-3 mt-2">
                <span className="text-sm text-muted-foreground">Estimated Gross Margin</span>
                <span className="text-lg font-semibold text-emerald-500">
                  {formatCurrency(totals.estimatedRevenue - totals.estimatedCost, currency)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Record Daily Sales</CardTitle>
              <CardDescription>
                This will update ingredient inventory based on the menu items sold.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                <li>Inventory deductions are based on each menu item&apos;s recipe.</li>
                <li>Stock can go theoretical/negative – use this to track true usage.</li>
                <li>You can re-submit for the same date; totals will aggregate.</li>
              </ul>
              <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    className="w-full mt-4"
                    disabled={recordSalesMutation.isPending}
                    onClick={() => setIsConfirmOpen(true)}
                  >
                    {recordSalesMutation.isPending ? "Recording Sales..." : "Submit Z-Report"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm inventory deduction</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will deduct ingredients for{" "}
                      <span className="font-semibold">
                        {totalItemsToDeduct} {totalItemsToDeduct === 1 ? "item" : "items"}
                      </span>{" "}
                      from inventory. Continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={recordSalesMutation.isPending}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirm}
                      disabled={recordSalesMutation.isPending}
                    >
                      {recordSalesMutation.isPending ? "Recording..." : "Yes, continue"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}


