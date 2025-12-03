import { Unit } from '@/types/entities'

/**
 * Unit conversion system for inventory management
 * All quantities are stored in base units (grams for weight, mL for volume, pieces for count)
 */

export interface UnitDefinition {
  name: string
  symbol: string
  type: 'weight' | 'volume' | 'count'
  toBase: number // multiplier to convert to base unit
  displayName: string
  displayNameAr?: string
}

export const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  // Weight units (base: grams)
  g: { name: 'gram', symbol: 'g', type: 'weight', toBase: 1, displayName: 'Grams' },
  kg: { name: 'kilogram', symbol: 'kg', type: 'weight', toBase: 1000, displayName: 'Kilograms' },
  sack_10kg: { name: 'sack_10kg', symbol: 'sack', type: 'weight', toBase: 10000, displayName: 'Sack (10kg)' },
  sack_25kg: { name: 'sack_25kg', symbol: 'sack', type: 'weight', toBase: 25000, displayName: 'Sack (25kg)' },
  sack_50kg: { name: 'sack_50kg', symbol: 'sack', type: 'weight', toBase: 50000, displayName: 'Sack (50kg)' },
  
  // Volume units (base: mL)
  mL: { name: 'milliliter', symbol: 'mL', type: 'volume', toBase: 1, displayName: 'Milliliters' },
  L: { name: 'liter', symbol: 'L', type: 'volume', toBase: 1000, displayName: 'Liters' },
  gallon: { name: 'gallon', symbol: 'gal', type: 'volume', toBase: 3785, displayName: 'Gallons' },
  
  // Count units (base: pieces)
  piece: { name: 'piece', symbol: 'pc', type: 'count', toBase: 1, displayName: 'Pieces' },
  dozen: { name: 'dozen', symbol: 'dz', type: 'count', toBase: 12, displayName: 'Dozen' },
  box: { name: 'box', symbol: 'box', type: 'count', toBase: 1, displayName: 'Box' }, // Variable, set per ingredient
  pack: { name: 'pack', symbol: 'pack', type: 'count', toBase: 1, displayName: 'Pack' }, // Variable
  case: { name: 'case', symbol: 'case', type: 'count', toBase: 1, displayName: 'Case' }, // Variable
}

/**
 * Convert quantity from one unit to base unit
 */
export function toBaseUnit(quantity: number, unitKey: string): number {
  const unit = UNIT_DEFINITIONS[unitKey]
  if (!unit) {
    console.warn(`Unknown unit: ${unitKey}, returning raw quantity`)
    return quantity
  }
  return quantity * unit.toBase
}

/**
 * Convert quantity from base unit to display unit
 */
export function fromBaseUnit(baseQuantity: number, unitKey: string): number {
  const unit = UNIT_DEFINITIONS[unitKey]
  if (!unit) {
    console.warn(`Unknown unit: ${unitKey}, returning raw quantity`)
    return baseQuantity
  }
  return baseQuantity / unit.toBase
}

/**
 * Format quantity with smart unit display
 * Shows the most readable format (e.g., 1500g -> 1.5 kg)
 */
export function formatSmartQuantity(baseQuantity: number, type: 'weight' | 'volume' | 'count'): string {
  if (type === 'weight') {
    if (baseQuantity >= 1000) {
      return `${(baseQuantity / 1000).toFixed(1)} kg`
    }
    return `${Math.round(baseQuantity)} g`
  }
  
  if (type === 'volume') {
    if (baseQuantity >= 1000) {
      return `${(baseQuantity / 1000).toFixed(1)} L`
    }
    return `${Math.round(baseQuantity)} mL`
  }
  
  // Count
  return `${Math.round(baseQuantity)} pcs`
}

/**
 * Get units available for a specific type
 */
export function getUnitsForType(type: 'weight' | 'volume' | 'count'): UnitDefinition[] {
  return Object.values(UNIT_DEFINITIONS).filter(u => u.type === type)
}

/**
 * Calculate conversion preview text
 * e.g., "Will add 10,000g to inventory"
 */
export function getConversionPreview(quantity: number, unitKey: string): string {
  const unit = UNIT_DEFINITIONS[unitKey]
  if (!unit) return ''
  
  const baseQuantity = toBaseUnit(quantity, unitKey)
  const formatted = formatSmartQuantity(baseQuantity, unit.type)
  
  return `Will add ${formatted} to inventory`
}

/**
 * Parse a unit string to get the key (handles various formats)
 */
export function parseUnitKey(input: string): string {
  const normalized = input.toLowerCase().trim()
  
  // Direct match
  if (UNIT_DEFINITIONS[normalized]) return normalized
  
  // Symbol match
  for (const [key, def] of Object.entries(UNIT_DEFINITIONS)) {
    if (def.symbol.toLowerCase() === normalized) return key
    if (def.name.toLowerCase() === normalized) return key
  }
  
  return 'piece' // fallback
}

