"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  UNIT_DEFINITIONS,
  toBaseUnit,
  formatSmartQuantity,
  getUnitsForType,
  type UnitDefinition,
} from "@/lib/utils/unit-conversion"

interface SmartUnitInputProps {
  value: number
  unit: string
  unitType: "weight" | "volume" | "count"
  onChange: (value: number, unit: string, baseValue: number) => void
  label?: string
  placeholder?: string
  error?: string
  disabled?: boolean
  showConversion?: boolean
  className?: string
}

export function SmartUnitInput({
  value,
  unit,
  unitType,
  onChange,
  label,
  placeholder = "0",
  error,
  disabled = false,
  showConversion = true,
  className,
}: SmartUnitInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  
  // Get available units for this type
  const availableUnits = useMemo(() => getUnitsForType(unitType), [unitType])
  
  // Calculate base unit value
  const baseValue = useMemo(() => toBaseUnit(value || 0, unit), [value, unit])
  
  // Format for display
  const formattedBaseValue = useMemo(
    () => formatSmartQuantity(baseValue, unitType),
    [baseValue, unitType]
  )

  const currentUnit = UNIT_DEFINITIONS[unit]

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0
    const newBaseValue = toBaseUnit(newValue, unit)
    onChange(newValue, unit, newBaseValue)
  }

  const handleUnitChange = (newUnit: string) => {
    const newBaseValue = toBaseUnit(value || 0, newUnit)
    onChange(value, newUnit, newBaseValue)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium text-slate-700">{label}</Label>
      )}
      
      <div className="flex gap-2">
        {/* Quantity Input */}
        <div className="relative flex-1">
          <Input
            type="number"
            value={value || ""}
            onChange={handleValueChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            min={0}
            step={currentUnit?.toBase >= 1000 ? 0.5 : 1}
            className={cn(
              "text-lg font-medium",
              error && "border-rose-500 focus-visible:ring-rose-500"
            )}
          />
        </div>

        {/* Unit Selector */}
        <Select value={unit} onValueChange={handleUnitChange} disabled={disabled}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableUnits.map((unitDef: UnitDefinition) => (
              <SelectItem
                key={unitDef.name}
                value={unitDef.name === "gram" ? "g" : unitDef.name === "kilogram" ? "kg" : unitDef.name === "milliliter" ? "mL" : unitDef.name === "liter" ? "L" : unitDef.name}
              >
                {unitDef.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conversion Preview */}
      <AnimatePresence>
        {showConversion && (value > 0 || isFocused) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
              <Info className="h-4 w-4 shrink-0" />
              <span>
                Will add <strong>{formattedBaseValue}</strong> to inventory
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-rose-600"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}

// Demo component with state management
export function SmartUnitInputDemo() {
  const [value, setValue] = useState<number>(0)
  const [unit, setUnit] = useState<string>("kg")

  const handleChange = (newValue: number, newUnit: string, baseValue: number) => {
    setValue(newValue)
    setUnit(newUnit)
    console.log("Base value:", baseValue, "grams")
  }

  return (
    <div className="max-w-md p-4 space-y-4">
      <h3 className="font-semibold text-lg">Add Flour to Inventory</h3>
      
      <SmartUnitInput
        value={value}
        unit={unit}
        unitType="weight"
        onChange={handleChange}
        label="Quantity"
        placeholder="Enter amount"
      />

      <div className="text-sm text-slate-500">
        Try selecting &quot;Sack (10kg)&quot; or &quot;Sack (25kg)&quot; to see the conversion preview!
      </div>
    </div>
  )
}

