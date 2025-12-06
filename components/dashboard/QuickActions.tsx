"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Minus, Plus, ScanBarcode, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuickOperationDialog } from "./QuickOperationDialog"
import { QuickFindModal } from "./QuickFindModal"

interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  color: "primary" | "warning" | "success" | "secondary"
  href?: string
}

const defaultActions: QuickAction[] = [
  {
    id: "usage",
    label: "Log Usage",
    description: "Record ingredient usage",
    icon: <Minus className="h-6 w-6" />,
    color: "warning",
  },
  {
    id: "add",
    label: "Add Stock",
    description: "Receive new inventory",
    icon: <Plus className="h-6 w-6" />,
    color: "success",
  },
  {
    id: "scan",
    label: "Scan Barcode",
    description: "Quick lookup or entry",
    icon: <ScanBarcode className="h-6 w-6" />,
    color: "primary",
  },
  {
    id: "reports",
    label: "Reports",
    description: "View analytics",
    icon: <BarChart3 className="h-6 w-6" />,
    color: "secondary",
    href: "/reports",
  },
]

const colorConfig = {
  primary: {
    bg: "bg-primary/5 dark:bg-primary/10",
    iconBg: "bg-primary/10 dark:bg-primary/20",
    iconColor: "text-primary",
    hoverBg: "hover:bg-primary/10 dark:hover:bg-primary/20",
    border: "border-primary/10 dark:border-primary/20",
  },
  warning: {
    bg: "bg-warning/5 dark:bg-warning/10",
    iconBg: "bg-warning/10 dark:bg-warning/20",
    iconColor: "text-warning",
    hoverBg: "hover:bg-warning/10 dark:hover:bg-warning/20",
    border: "border-warning/10 dark:border-warning/20",
  },
  success: {
    bg: "bg-success/5 dark:bg-success/10",
    iconBg: "bg-success/10 dark:bg-success/20",
    iconColor: "text-success",
    hoverBg: "hover:bg-success/10 dark:hover:bg-success/20",
    border: "border-success/10 dark:border-success/20",
  },
  secondary: {
    bg: "bg-secondary",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    hoverBg: "hover:bg-accent",
    border: "border-border",
  },
}

interface QuickActionsProps {
  actions?: QuickAction[]
}

export function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  const [opMode, setOpMode] = useState<"add" | "use" | null>(null)
  const [showFind, setShowFind] = useState(false)

  const handleActionClick = (actionId: string) => {
    switch (actionId) {
      case "usage":
        setOpMode("use")
        break
      case "add":
        setOpMode("add")
        break
      case "scan":
        setShowFind(true)
        break
      default:
        break
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {actions.map((action, index) => {
          const config = colorConfig[action.color]
          
          const Content = (
            <div
              className={cn(
                "flex flex-col items-center p-4 md:p-6 rounded-md border-2 transition-all duration-200 h-full w-full",
                "active:scale-95 touch-manipulation cursor-pointer",
                config.bg,
                config.border,
                config.hoverBg
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full mb-3",
                  config.iconBg
                )}
              >
                <span className={config.iconColor}>{action.icon}</span>
              </div>
              <span className="font-semibold text-foreground text-center">
                {action.label}
              </span>
              <span className="text-xs text-muted-foreground text-center mt-1 hidden md:block">
                {action.description}
              </span>
            </div>
          )

          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {action.href ? (
                <Link href={action.href} className="block h-full">
                  {Content}
                </Link>
              ) : (
                <button 
                  onClick={() => handleActionClick(action.id)}
                  className="w-full h-full text-left"
                >
                  {Content}
                </button>
              )}
            </motion.div>
          )
        })}
      </div>

      <QuickOperationDialog
        isOpen={!!opMode}
        onClose={() => setOpMode(null)}
        mode={opMode || "add"}
      />

      <QuickFindModal
        isOpen={showFind}
        onClose={() => setShowFind(false)}
      />
    </>
  )
}
