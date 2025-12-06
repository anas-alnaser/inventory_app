"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { 
  ArrowLeft, 
  Truck, 
  Calendar, 
  MessageCircle, 
  PackageCheck, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Phone
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/lib/hooks/use-toast"
import { useAuth } from "@/lib/hooks/useAuth"
import { getPurchaseOrderById, getSupplierById, receivePurchaseOrder } from "@/lib/services"
import { cn } from "@/lib/utils"

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useAuth()
  const queryClient = useQueryClient()
  const id = params.id as string

  // Fetch Order
  const { data: order, isLoading: loadingOrder } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getPurchaseOrderById(id),
  })

  // Fetch Supplier (dependent)
  const { data: supplier, isLoading: loadingSupplier } = useQuery({
    queryKey: ["supplier", order?.supplier_id],
    queryFn: () => order?.supplier_id ? getSupplierById(order.supplier_id) : null,
    enabled: !!order?.supplier_id,
  })

  // Receive Mutation
  const receiveMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.id) throw new Error("User not authenticated")
      return receivePurchaseOrder(id, userData.id)
    },
    onSuccess: () => {
      toast({
        title: "Order Received",
        description: "Inventory has been updated and stock logs created.",
        variant: "success",
      })
      queryClient.invalidateQueries({ queryKey: ["order", id] })
      queryClient.invalidateQueries({ queryKey: ["inventory"] }) // Update inventory list
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to receive order",
        variant: "destructive",
      })
    }
  })

  if (loadingOrder) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h2 className="text-xl font-semibold">Order Not Found</h2>
        <Button onClick={() => router.push("/orders")}>Back to Orders</Button>
      </div>
    )
  }

  const statusConfig = {
    draft: { label: "Draft", variant: "secondary" as const, icon: FileText },
    ordered: { label: "Ordered", variant: "default" as const, icon: Truck, className: "bg-blue-600" },
    received: { label: "Received", variant: "success" as const, icon: CheckCircle2, className: "bg-green-600" },
    cancelled: { label: "Cancelled", variant: "destructive" as const, icon: XCircle },
  }
  
  const config = statusConfig[order.status] || statusConfig.draft
  const StatusIcon = config.icon

  // WhatsApp Logic
  const handleWhatsApp = () => {
    if (!supplier?.phone) {
      toast({ title: "No Phone Number", description: "This supplier has no phone number listed.", variant: "destructive" })
      return
    }

    // Format phone (simple cleanup)
    const phone = supplier.phone.replace(/\D/g, '')
    
    // Build items string
    const itemsList = order.items.map(i => `- ${i.name} x${i.quantity} ${i.unit}`).join('\n')
    
    // Format Date
    let dateStr = "soon"
    try {
      const d = order.expected_delivery_date instanceof Date ? order.expected_delivery_date : (order.expected_delivery_date as any).toDate()
      dateStr = format(d, "MMM d")
    } catch {}

    const message = `Hi ${supplier.contact_person || supplier.name},\n\nPurchase Order ${order.po_number}\n\nPlease deliver:\n${itemsList}\n\nNeeded by: ${dateStr}\n\nThanks!`
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{order.po_number}</h1>
              <Badge variant={config.variant} className={cn("gap-1", config.className)}>
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              Expected Delivery: {order.expected_delivery_date ? format((order.expected_delivery_date as any).toDate ? (order.expected_delivery_date as any).toDate() : new Date(order.expected_delivery_date as any), "PPP") : "N/A"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {order.status === 'ordered' && (
            <>
               <Button variant="outline" className="gap-2" onClick={handleWhatsApp}>
                <MessageCircle className="h-4 w-4 text-green-600" />
                Send via WhatsApp
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                    <PackageCheck className="h-4 w-4" />
                    Receive Items
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Receive Delivery?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will update your inventory levels for all items in this order and create stock logs.
                      The order status will be marked as "Received".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => receiveMutation.mutate()}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {receiveMutation.isPending ? "Processing..." : "Confirm Receipt"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Items */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Items Ordered</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity} {item.unit}</TableCell>
                    <TableCell>{item.cost_per_unit.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.total_cost.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold">{order.total_cost.toFixed(2)} JOD</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Supplier Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingSupplier ? (
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              ) : supplier ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{supplier.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Person</p>
                    <p className="font-medium">{supplier.contact_person || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{supplier.phone}</p>
                    </div>
                  </div>
                  {supplier.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{supplier.email}</p>
                    </div>
                  )}
                  {supplier.address && (
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{supplier.address}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">Supplier details not available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

