"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Truck, ArrowLeft, FileText, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvoiceUpload } from "@/components/ai"

export default function ReceiveDeliveryPage() {
  const router = useRouter()

  const handleInvoiceSuccess = (purchaseOrderId: string) => {
    // Navigate to the purchase order after a brief delay
    setTimeout(() => {
      router.push(`/orders/${purchaseOrderId}`)
    }, 1500)
  }

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

      <Tabs defaultValue="invoice" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="invoice" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Invoice Scan
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <FileText className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        {/* AI Invoice Upload Tab */}
        <TabsContent value="invoice">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Info Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>AI-Powered Invoice Processing</CardTitle>
                    <CardDescription>
                      Upload an invoice photo and our AI will automatically extract the items
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Take a photo or upload an invoice image</li>
                  <li>AI extracts line items, quantities, and prices</li>
                  <li>Items are automatically matched to your ingredients</li>
                  <li>Creates a draft purchase order for your review</li>
                </ul>
              </CardContent>
            </Card>

            {/* Invoice Upload Component */}
            <InvoiceUpload onSuccess={handleInvoiceSuccess} />
          </motion.div>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
                  <Truck className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle className="text-center">Manual Delivery Entry</CardTitle>
                <CardDescription className="text-center">
                  Create a new purchase order manually or receive an existing order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Link href="/orders/new">
                    <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                      <FileText className="h-6 w-6" />
                      <span>New Purchase Order</span>
                    </Button>
                  </Link>
                  <Link href="/orders">
                    <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                      <Truck className="h-6 w-6" />
                      <span>View Pending Orders</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
