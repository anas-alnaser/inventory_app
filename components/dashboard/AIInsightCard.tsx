"use client"

import { motion } from "framer-motion"
import { Sparkles, ArrowRight, TrendingUp, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface AIInsight {
  id: string
  type: "forecast" | "warning" | "recommendation"
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  confidence?: number
}

interface AIInsightCardProps {
  insights?: AIInsight[]
  isLoading?: boolean
  isEligible?: boolean
}

const defaultInsights: AIInsight[] = [
  {
    id: "1",
    type: "forecast",
    title: "Milk Running Low",
    description: "Based on usage patterns, you will run out of milk by Friday. Order 10 cartons to maintain stock levels.",
    action: {
      label: "Create Order",
      href: "/orders/new?item=milk&qty=10",
    },
    confidence: 92,
  },
]

const insightConfig = {
  forecast: {
    icon: TrendingUp,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-warning/10 dark:bg-warning/20",
    iconColor: "text-warning",
  },
  recommendation: {
    icon: Sparkles,
    iconBg: "bg-success/10 dark:bg-success/20",
    iconColor: "text-success",
  },
}

function LoadingSkeleton() {
  return (
    <Card className="border-2 border-dashed border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-32 mt-4" />
      </CardContent>
    </Card>
  )
}

function CollectingDataState() {
  return (
    <Card className="border-2 border-dashed border-border">
      <CardContent className="py-8 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4"
        >
          <Sparkles className="h-6 w-6 text-primary" />
        </motion.div>
        <h3 className="font-semibold text-foreground mb-2">
          AI is Learning Your Patterns
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          We need more data to provide accurate predictions. Keep logging your 
          inventory usage and check back in a few days.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-75" />
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150" />
        </div>
      </CardContent>
    </Card>
  )
}

export function AIInsightCard({
  insights = defaultInsights,
  isLoading = false,
  isEligible = true,
}: AIInsightCardProps) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!isEligible) {
    return <CollectingDataState />
  }

  const insight = insights[0]
  
  if (!insight) {
    return (
      <Card className="border-2 border-success/20 bg-success/5 dark:bg-success/10">
        <CardContent className="py-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-3">
            <Sparkles className="h-6 w-6 text-success" />
          </div>
          <h3 className="font-semibold text-success">All Clear!</h3>
          <p className="text-sm text-success/80 mt-1">
            No issues detected. Your inventory is in great shape.
          </p>
        </CardContent>
      </Card>
    )
  }

  const config = insightConfig[insight.type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 overflow-hidden relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", config.iconBg)}>
                <Icon className={cn("h-4 w-4", config.iconColor)} />
              </div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Insight
              </CardTitle>
            </div>
            {insight.confidence && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                {insight.confidence}% confident
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="relative space-y-4">
          <div>
            <h3 className="font-semibold text-foreground text-lg">
              {insight.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {insight.description}
            </p>
          </div>

          {insight.action && (
            <Button asChild className="gap-2">
              <a href={insight.action.href}>
                {insight.action.label}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
