"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { 
  Plus, 
  Search, 
  Truck, 
  Calendar, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Filter
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getPurchaseOrders } from "@/lib/services"
import { cn } from "@/lib/utils"
import type { PurchaseOrder } from "@/types/entities"

export default function OrdersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Fetch all orders - services.ts modified to return all regardless of param
  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ["orders", "all"],
    queryFn: () => getPurchaseOrders('active'), 
  })

  // Since we are getting ALL orders now due to service change, 
  // we can filter client-side if we wanted to respect tabs, 
  // but the user asked to "Show ALL orders for now".
  // So we will just show the same list in both tabs or maybe just one list?
  // The prompt says "If the array is empty, show a text: 'No orders found in database.'"
  // It also says "The /orders page list remains empty."
  
  // Let's filter client side for the tabs to keep the UI sane, 
  // but if the status fields are messed up, they might fall through.
  // Actually, user said "Show ALL orders for now". 
  // Let's treat the "active" tab as "All Orders" effectively for this debugging phase.

  const filteredOrders = allOrders.filter(order => {
    const matchesSearch = order.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage supplier orders and deliveries</p>
        </div>
        <Button onClick={() => router.push("/orders/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          New Purchase Order
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
             <div className="flex items-center gap-2">
               <Filter className="h-4 w-4 text-muted-foreground" />
               <SelectValue placeholder="Filter by Status" />
             </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <OrdersSkeleton />
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-card/50 border-dashed">
            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No orders found in database</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              {searchQuery ? "Try adjusting your search terms." : "Get started by creating your first purchase order."}
            </p>
            {!searchQuery && (
              <Button onClick={() => router.push("/orders/new")}>
                Create Order
              </Button>
            )}
        </div>
      ) : (
        <>
          {/* Desktop View - Table */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow 
                    key={order.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <TableCell className="font-medium">{order.po_number}</TableCell>
                    <TableCell>{order.supplier_name}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      {formatDate(order.expected_delivery_date)}
                    </TableCell>
                    <TableCell>{order.items?.length || 0} items</TableCell>
                    <TableCell className="text-right font-medium">
                      {order.total_cost?.toFixed(2)} JOD
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View - Cards */}
          <div className="md:hidden space-y-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string, variant: "default" | "secondary" | "destructive" | "outline", className?: string }> = {
    draft: { label: "Draft", variant: "secondary" },
    ordered: { label: "Ordered", variant: "default", className: "bg-blue-600 hover:bg-blue-700" },
    received: { label: "Received", variant: "default", className: "bg-green-600 hover:bg-green-700" },
    cancelled: { label: "Cancelled", variant: "destructive" },
  }

  const config = statusConfig[status] || statusConfig.draft

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}

function formatDate(dateInput: any): string {
  try {
    const date = dateInput instanceof Date 
      ? dateInput 
      : (dateInput as any)?.toDate?.() || new Date(dateInput as string)
    return format(date, "MMM d, yyyy")
  } catch (e) {
    return "N/A"
  }
}

function OrderCard({ order }: { order: PurchaseOrder }) {
  const router = useRouter()
  
  return (
    <Card 
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => router.push(`/orders/${order.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="font-bold text-lg">{order.supplier_name}</div>
          <StatusBadge status={order.status} />
        </div>
        
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-3">
          <span>{order.po_number}</span>
          <span>{formatDate(order.expected_delivery_date)}</span>
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t">
          <span className="text-sm font-medium">{order.items?.length || 0} items</span>
          <span className="font-bold text-foreground">{order.total_cost?.toFixed(2)} JOD</span>
        </div>
      </CardContent>
    </Card>
  )
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i} className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        </Card>
      ))}
    </div>
  )
}
