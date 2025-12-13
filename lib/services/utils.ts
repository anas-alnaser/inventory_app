import type { Unit } from '@/types/entities';

export function calculateStockStatus(
  current: number,
  min?: number,
  max?: number
): 'good' | 'low' | 'critical' | 'out' {
  // Ensure we're comparing numbers, not strings
  const currentNum = Number(current) || 0;
  const minNum = min !== undefined && min !== null ? Number(min) : undefined;
  
  if (currentNum <= 0) return 'out';
  if (minNum !== undefined && currentNum <= minNum * 0.5) return 'critical';
  if (minNum !== undefined && currentNum <= minNum) return 'low';
  return 'good';
}

export function formatStockQuantity(
  baseQuantity: number,
  unit: Unit
): { value: number; unit: string; display: string } {
  // Smart formatting based on quantity
  if (unit === 'g' && baseQuantity >= 1000) {
    const kg = baseQuantity / 1000;
    return { value: kg, unit: 'kg', display: `${kg.toFixed(1)} kg` };
  }
  if (unit === 'mL' && baseQuantity >= 1000) {
    const L = baseQuantity / 1000;
    return { value: L, unit: 'L', display: `${L.toFixed(1)} L` };
  }
  return { value: baseQuantity, unit, display: `${baseQuantity} ${unit}` };
}

