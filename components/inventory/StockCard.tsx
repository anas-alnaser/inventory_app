"use client"

import { useState } from "react"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { Clock, TrendingDown, Minus, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils"
import { formatSmartQuantity } from "@/lib/utils/unit-conversion"

export interface StockCardData {
  id: string
  name: string
  quantity: number // Base units (grams, mL, or pieces)
  maxCapacity: number // Base units
  unitType: "weight" | "volume" | "count"
  status: "good" | "low" | "critical" | "out"
  expiryDate?: string
  lastUpdated: string | Date
  usageData?: number[] // Last 7 days usage for sparkline
  imageUrl?: string
}

interface StockCardProps {
  data: StockCardData
  onLogUsage?: (id: string) => void
  onRestock?: (id: string) => void
  onClick?: (id: string) => void
  showCost?: boolean // Role-based: hide for staff
}

const statusConfig = {
  good: {
    badge: "success",
    label: "In Stock",
    progressColor: "bg-emerald-500",
  },
  low: {
    badge: "warning",
    label: "Low Stock",
    progressColor: "bg-amber-500",
  },
  critical: {
    badge: "destructive",
    label: "Critical",
    progressColor: "bg-rose-500",
  },
  out: {
    badge: "destructive",
    label: "Out of Stock",
    progressColor: "bg-rose-600",
  },
}

// Mini Sparkline component
function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 60
      const y = 20 - ((value - min) / range) * 16
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg width="60" height="24" className="text-slate-400">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

export function StockCard({
  data,
  onLogUsage,
  onRestock,
  onClick,
}: StockCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const x = useMotionValue(0)
  
  // Transform x position to background colors
  const leftBgOpacity = useTransform(x, [-100, 0], [1, 0])
  const rightBgOpacity = useTransform(x, [0, 100], [0, 1])

  const config = statusConfig[data.status]
  const percentFull = Math.min((data.quantity / data.maxCapacity) * 100, 100)
  const displayQuantity = formatSmartQuantity(data.quantity, data.unitType)

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    
    // Swipe left = Log Usage
    if (info.offset.x < -100) {
      onLogUsage?.(data.id)
    }
    // Swipe right = Restock
    else if (info.offset.x > 100) {
      onRestock?.(data.id)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe action backgrounds */}
      <motion.div
        className="absolute inset-y-0 left-0 w-24 bg-amber-500 flex items-center justify-start pl-4 rounded-l-xl"
        style={{ opacity: leftBgOpacity }}
      >
        <Minus className="h-6 w-6 text-white" />
      </motion.div>
      <motion.div
        className="absolute inset-y-0 right-0 w-24 bg-emerald-500 flex items-center justify-end pr-4 rounded-r-xl"
        style={{ opacity: rightBgOpacity }}
      >
        <Plus className="h-6 w-6 text-white" />
      </motion.div>

      {/* Main card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative cursor-grab active:cursor-grabbing"
      >
        <Card
          className={cn(
            "p-4 bg-white border-2 transition-shadow",
            !isDragging && "hover:shadow-md",
            data.status === "critical" && "border-rose-200",
            data.status === "low" && "border-amber-200",
            data.status === "out" && "border-rose-300"
          )}
          onClick={() => !isDragging && onClick?.(data.id)}
        >
          {/* Top Row: Name + Status Badge */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {data.name}
              </h3>
              {data.expiryDate && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Expires: {new Date(data.expiryDate).toLocaleDateString()}
                </p>
              )}
            </div>
            <Badge variant={config.badge as "success" | "warning" | "destructive"}>
              {config.label}
            </Badge>
          </div>

          {/* Middle Row: Big Quantity */}
          <div className="mb-3">
            <span className="text-3xl font-bold text-slate-900">
              {displayQuantity}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <Progress
              value={percentFull}
              className="h-2"
              indicatorClassName={config.progressColor}
            />
            <p className="text-xs text-slate-500 mt-1">
              {percentFull.toFixed(0)}% of capacity
            </p>
          </div>

          {/* Bottom Row: Last updated + Sparkline */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              <span>Updated {formatRelativeTime(data.lastUpdated)}</span>
            </div>
            {data.usageData && (
              <div className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-slate-400" />
                <Sparkline data={data.usageData} />
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Swipe hint on first render */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 opacity-0 animate-pulse md:hidden">
        Swipe left/right for quick actions
      </div>
    </div>
  )
}

// Export a demo/example version with mock data
export function StockCardDemo() {
  const mockData: StockCardData = {
    id: "1",
    name: "Chicken Breast",
    quantity: 2500, // 2.5kg in grams
    maxCapacity: 10000, // 10kg
    unitType: "weight",
    status: "low",
    lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    usageData: [800, 600, 900, 700, 850, 650, 500],
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
  }

  return (
    <StockCard
      data={mockData}
      onLogUsage={(id) => console.log("Log usage:", id)}
      onRestock={(id) => console.log("Restock:", id)}
      onClick={(id) => console.log("Clicked:", id)}
    />
  )
}

