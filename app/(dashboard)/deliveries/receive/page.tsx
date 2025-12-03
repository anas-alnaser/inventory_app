"use client"

import { motion } from "framer-motion"
import { Truck, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReceiveDeliveryPage() {
  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/suppliers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Receive Delivery</h1>
          <p className="text-muted-foreground">Process incoming supplier deliveries</p>
        </div>
      </div>

      {/* Coming Soon Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <Card className="max-w-md">
          <CardHeader>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 mx-auto">
              <Truck className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Feature Coming Soon</CardTitle>
            <CardDescription className="text-base mt-2">
              The delivery receiving feature is under construction. This will allow you to process incoming deliveries from suppliers and update inventory automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/suppliers">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Suppliers
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

