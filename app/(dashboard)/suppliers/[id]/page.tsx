"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Package,
  ShoppingCart,
  DollarSign,
  ArrowLeft,
  MessageSquare,
  Edit,
  Clock,
  ExternalLink,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getSupplierById,
  getIngredientsBySupplier,
  getOrdersBySupplier,
  type Ingredient,
  type PurchaseOrder,
  type Supplier,
} from "@/lib/services"
import { formatCurrency } from "@/lib/utils"

function KPICard({
  title,
  value,
  icon: Icon,
  description,
  color,
}: {
  title: string
  value: string | number
  icon: any
  description?: string
  color: "cyan" | "purple" | "yellow"
}) {
  const borderColors = {
    cyan: "border-l-cyan-500",
    purple: "border-l-purple-500",
    yellow: "border-l-yellow-500",
  }

  const textColors = {
    cyan: "text-cyan-500",
    purple: "text-purple-500",
    yellow: "text-yellow-500",
  }

  return (
    <Card className={`border-l-4 ${borderColors[color]} shadow-sm`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-full bg-muted ${textColors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {description && (
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      </div>
    </div>
  )
}

export default function SupplierDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const supplierId = params.id as string
  
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true; // Prevent setting state if component unmounts

    async function fetchData() {
      if (!supplierId) return;
      
      try {
        setIsLoading(true);
        console.log('Fetching for ID:', supplierId);
        
        // 1. Fetch Data
        const data = await getSupplierById(supplierId);
        console.log('Data received:', data);

        // 2. Set State ONLY if mounted
        if (isMounted) {
          if (data) {
            setSupplier(data);
            
            // Fetch other data (orders/ingredients) here
            const [fetchedIngredients, fetchedOrders] = await Promise.all([
              getIngredientsBySupplier(supplierId),
              getOrdersBySupplier(supplierId)
            ]);

            console.log('Ingredients Found:', fetchedIngredients.length);
            console.log('Orders Found:', fetchedOrders.length);

            if (isMounted) {
              setIngredients(fetchedIngredients);
              setOrders(fetchedOrders);
            }
          } else {
            console.log('Data was null');
            setSupplier(null);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        // 3. Turn off loading ONLY after data is set
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => { isMounted = false; };
  }, [supplierId]);

  console.log('Current Page State:', { isLoading, supplier });

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <PageSkeleton />
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
        <h2 className="text-xl font-semibold mb-2">Supplier Not Found</h2>
        <p className="text-muted-foreground mb-4">Could not find supplier with ID: {supplierId}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  // --- KPI Calculations ---
  
  // Total Spend (Sum of received orders)
  const totalSpend = orders
    .filter((o) => o.status === "received")
    .reduce((sum, o) => sum + o.total_cost, 0)

  // Items Supplied (Unique ingredients count)
  const itemsSuppliedCount = ingredients.length

  // Active Orders (draft or ordered)
  const activeOrdersCount = orders.filter((o) => 
    o.status === "ordered" || o.status === "draft"
  ).length

  // --- Chart Data Preparation (Monthly Spending) ---
  const spendingByMonth = orders
    .filter((o) => o.status === "received")
    .reduce((acc, order) => {
      // Handle Firestore Timestamp or Date object
      let date: Date | undefined;
      const createdAt = order.created_at as any;
      
      if (createdAt && typeof createdAt.toDate === 'function') {
         date = createdAt.toDate();
      } else if (createdAt && createdAt.seconds) {
         date = new Date(createdAt.seconds * 1000);
      } else if (order.created_at instanceof Date) {
         date = order.created_at;
      } else {
         date = new Date(); // Fallback
      }

      const monthKey = format(date, "MMM yyyy")
      
      if (!acc[monthKey]) {
        acc[monthKey] = 0
      }
      acc[monthKey] += order.total_cost
      return acc
    }, {} as Record<string, number>)

  const chartData = Object.entries(spendingByMonth)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => {
      const dateA = new Date(a.name)
      const dateB = new Date(b.name)
      return dateA.getTime() - dateB.getTime()
    })

  // Handle Contact Actions
  const handleCall = () => {
    window.location.href = `tel:${supplier.phone}`
  }

  const handleWhatsApp = () => {
    const cleanPhone = supplier.phone.replace(/\D/g, "")
    const message = encodeURIComponent(`Hello ${supplier.name}, regarding our account...`)
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank")
  }

  const handleEmail = () => {
    window.location.href = `mailto:${supplier.email}`
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 -ml-2 text-muted-foreground"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {supplier.name}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground ml-8">
              {supplier.contact_person && (
                <span className="flex items-center gap-1">
                  <UserIcon className="h-4 w-4" />
                  {supplier.contact_person}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {supplier.address || "No address provided"}
              </span>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Supplier
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Total Spend"
            value={formatCurrency(totalSpend)}
            icon={DollarSign}
            description="Lifetime value (Received)"
            color="cyan"
          />
          <KPICard
            title="Items Supplied"
            value={itemsSuppliedCount}
            icon={Package}
            description="Active ingredients"
            color="purple"
          />
          <KPICard
            title="Active Orders"
            value={activeOrdersCount}
            icon={ShoppingCart}
            description="In progress"
            color="yellow"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Monthly Spending Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending</CardTitle>
                <CardDescription>
                  Spending trends over time for this supplier
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-0">
                <div className="h-[300px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="name"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `$${value}`}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                          itemStyle={{ color: "hsl(var(--foreground))" }}
                          formatter={(value: number) => [formatCurrency(value), "Spent"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorSpend)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No spending data available yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ingredients Table */}
            <Card>
              <CardHeader>
                <CardTitle>Supplied Ingredients</CardTitle>
                <CardDescription>
                  List of ingredients sourced from {supplier.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Cost / Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredients.length > 0 ? (
                      ingredients.map((ingredient) => (
                        <TableRow key={ingredient.id}>
                          <TableCell className="font-medium">{ingredient.name}</TableCell>
                          <TableCell>{ingredient.category || "-"}</TableCell>
                          <TableCell>{formatCurrency(ingredient.cost_per_unit)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          No ingredients associated with this supplier
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground truncate">{supplier.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground truncate">{supplier.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground">
                      {supplier.address || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Delivery Days</p>
                    <p className="text-sm text-muted-foreground">
                       {Array.isArray(supplier.delivery_days) && supplier.delivery_days.length > 0
                        ? supplier.delivery_days.join(", ")
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button className="w-full justify-start" size="lg" onClick={handleCall}>
                  <Phone className="mr-3 h-5 w-5" />
                  Call Supplier
                </Button>
                <Button className="w-full justify-start" variant="secondary" size="lg" onClick={handleWhatsApp}>
                  <MessageSquare className="mr-3 h-5 w-5" />
                  WhatsApp
                </Button>
                <Button className="w-full justify-start" variant="outline" size="lg" onClick={handleEmail}>
                  <Mail className="mr-3 h-5 w-5" />
                  Send Email
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{order.po_number || "Order"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {(() => {
                            let dateStr = "Unknown date";
                            if (order.created_at) {
                                let date;
                                if (typeof (order.created_at as any).toDate === 'function') {
                                    date = (order.created_at as any).toDate();
                                } else if ((order.created_at as any).seconds) {
                                    date = new Date((order.created_at as any).seconds * 1000);
                                } else if (order.created_at instanceof Date) {
                                    date = order.created_at;
                                }
                                if (date) {
                                    dateStr = format(date, "MMM d, yyyy");
                                }
                            }
                            return dateStr;
                          })()}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatCurrency(order.total_cost)}</p>
                        <Badge variant={
                          order.status === 'received' ? 'default' : 
                          order.status === 'cancelled' ? 'destructive' : 'secondary'
                        } className="text-[10px] h-5">
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent orders</p>
                  )}
                </div>
                {orders.length > 0 && (
                   <Button variant="link" className="w-full mt-2" size="sm">
                    View All Orders
                  </Button>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}

function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
