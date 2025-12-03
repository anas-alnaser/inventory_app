"use client"

import { motion } from "framer-motion"
import { AlertTriangle, Truck, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatusItem {
  id: string
  type: "critical" | "warning" | "info"
  title: string
  description: string
  count?: number
}

interface StatusTickerProps {
  items?: StatusItem[]
}

const defaultItems: StatusItem[] = [
  {
    id: "1",
    type: "critical",
    title: "Out of Stock",
    description: "3 items need immediate attention",
    count: 3,
  },
  {
    id: "2",
    type: "warning",
    title: "Expiring Soon",
    description: "5 items expiring this week",
    count: 5,
  },
  {
    id: "3",
    type: "info",
    title: "Delivery Expected",
    description: "Al-Marai delivery arriving today",
  },
]

const statusConfig = {
  critical: {
    icon: AlertCircle,
    bgColor: "bg-destructive/10 dark:bg-destructive/20",
    iconColor: "text-destructive",
    borderColor: "border-destructive/20",
    titleColor: "text-destructive",
    descColor: "text-destructive/80",
    badgeBg: "bg-destructive/20 text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-warning",
    bgColor: "bg-warning/10 dark:bg-warning/20",
    borderColor: "border-warning/20",
    titleColor: "text-warning",
    descColor: "text-warning/80",
    badgeBg: "bg-warning/20 text-warning",
  },
  info: {
    icon: Truck,
    iconColor: "text-primary",
    bgColor: "bg-primary/10 dark:bg-primary/20",
    borderColor: "border-primary/20",
    titleColor: "text-primary",
    descColor: "text-primary/80",
    badgeBg: "bg-primary/20 text-primary",
  },
}

export function StatusTicker({ items = defaultItems }: StatusTickerProps) {
  return (
    <div className="relative">
      {/* Horizontal scroll container */}
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory">
        {items.map((item, index) => {
          const config = statusConfig[item.type]
          const Icon = config.icon

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="snap-start"
            >
              <Card
                className={cn(
                  "min-w-[280px] p-4 border-2 cursor-pointer hover:shadow-md transition-shadow",
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      config.bgColor
                    )}
                  >
                    <Icon className={cn("h-5 w-5", config.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn("font-semibold", config.titleColor)}>
                        {item.title}
                      </h3>
                      {item.count && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-bold",
                            config.badgeBg
                          )}
                        >
                          {item.count}
                        </span>
                      )}
                    </div>
                    <p className={cn("text-sm mt-0.5", config.descColor)}>
                      {item.description}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Scroll indicators (gradient fade) */}
      <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
    </div>
  )
}
