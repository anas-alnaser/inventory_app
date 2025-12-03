"use client"

import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, TrendingDown, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function AnomaliesPage() {
  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Anomalies</h1>
        <p className="text-muted-foreground">Detected issues and unusual patterns</p>
      </div>

      {/* All Clear State */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-success/20 bg-success/5">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-success mb-2">All Clear!</h2>
                <p className="text-muted-foreground max-w-md">
                  No anomalies detected in your inventory levels. Everything looks normal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <CardTitle>What are Anomalies?</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Our system continuously monitors your inventory for unusual patterns, including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Unexpected stock shortages</li>
              <li>Excessive waste or spoilage</li>
              <li>Price anomalies from suppliers</li>
              <li>Unusual sales patterns</li>
            </ul>
            <p className="pt-2">
              When anomalies are detected, they will appear here with recommendations for action.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for Future Anomalies */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Recent Activity
        </h3>
        <div className="text-center py-8 text-muted-foreground text-sm">
          No recent anomalies to display
        </div>
      </div>
    </div>
  )
}

