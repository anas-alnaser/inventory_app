"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, Truck, Package, ChefHat, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GettingStartedChecklistProps {
  hasSuppliers: boolean
  hasInventory: boolean
  hasMenu: boolean
}

export function GettingStartedChecklist({
  hasSuppliers,
  hasInventory,
  hasMenu,
}: GettingStartedChecklistProps) {
  const allComplete = hasSuppliers && hasInventory && hasMenu

  if (allComplete) {
    return null
  }

  const checklistItems = [
    {
      id: "suppliers",
      label: "Add your first Supplier",
      href: "/suppliers",
      completed: hasSuppliers,
      icon: Truck,
    },
    {
      id: "inventory",
      label: "Create your Inventory",
      href: "/inventory",
      completed: hasInventory,
      icon: Package,
    },
    {
      id: "menu",
      label: "Build your Menu",
      href: "/menu-items",
      completed: hasMenu,
      icon: ChefHat,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Complete these steps to set up your inventory management system.
          </p>
          <div className="space-y-2">
            {checklistItems.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start h-auto p-4 hover:bg-accent/50 transition-colors",
                        item.completed && "opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            item.completed
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {item.completed ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </div>
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span
                          className={cn(
                            "flex-1 text-left",
                            item.completed && "line-through text-muted-foreground"
                          )}
                        >
                          {item.label}
                        </span>
                        {!item.completed && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </Button>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

