"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ChefHat,
    Clock,
    Play,
    CheckCircle2,
    Bell,
    Volume2,
    VolumeX,
    RefreshCw,
    Utensils,
    Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/hooks/useAuth"
import {
    listenToKitchenOrders,
    updateKitchenStatus,
    getNextKitchenStatus,
    getStatusActionLabel,
    formatRelativeTime,
    type KitchenOrder,
} from "@/lib/services/kitchen"
import type { KitchenStatus } from "@/types/entities"

// CDN URL for chime sound
const CHIME_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"

export default function KitchenDisplayPage() {
    const { userData } = useAuth()
    const [orders, setOrders] = useState<KitchenOrder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isMuted, setIsMuted] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())

    // Track previous order count for audio alert
    const previousPendingCountRef = useRef<number>(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Initialize audio element
    useEffect(() => {
        audioRef.current = new Audio(CHIME_URL)
        audioRef.current.volume = 0.7
        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    // Update time every 30 seconds
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 30000)
        return () => clearInterval(timer)
    }, [])

    // Subscribe to kitchen orders
    useEffect(() => {
        if (!userData?.branchId) return

        const unsubscribe = listenToKitchenOrders(
            userData.branchId,
            (newOrders) => {
                // Count pending orders
                const newPendingCount = newOrders.filter(o => o.kitchenStatus === 'pending').length

                // Play sound if new pending order arrived
                if (newPendingCount > previousPendingCountRef.current && !isMuted && audioRef.current) {
                    audioRef.current.currentTime = 0
                    audioRef.current.play().catch(console.error)
                }

                previousPendingCountRef.current = newPendingCount
                setOrders(newOrders)
                setIsLoading(false)
            },
            (error) => {
                console.error("Kitchen orders error:", error)
                setIsLoading(false)
                toast({
                    title: "Connection Error",
                    description: "Failed to connect to kitchen orders. Retrying...",
                    variant: "destructive",
                })
            }
        )

        return () => unsubscribe()
    }, [userData?.branchId, isMuted])

    // Handle status update
    const handleStatusUpdate = async (orderId: string, currentStatus: KitchenStatus) => {
        const nextStatus = getNextKitchenStatus(currentStatus)
        if (!nextStatus) return

        const result = await updateKitchenStatus(orderId, nextStatus)
        if (!result.success) {
            toast({
                title: "Error",
                description: result.error || "Failed to update order status",
                variant: "destructive",
            })
        }
    }

    // Group orders by status
    const pendingOrders = orders.filter(o => o.kitchenStatus === 'pending')
    const preparingOrders = orders.filter(o => o.kitchenStatus === 'preparing')
    const readyOrders = orders.filter(o => o.kitchenStatus === 'ready')

    const columns = [
        {
            title: "New Orders",
            status: "pending" as KitchenStatus,
            orders: pendingOrders,
            color: "border-blue-500",
            bgColor: "bg-blue-500/10",
            headerColor: "bg-blue-500",
            icon: <Bell className="h-6 w-6" />,
        },
        {
            title: "Preparing",
            status: "preparing" as KitchenStatus,
            orders: preparingOrders,
            color: "border-yellow-500",
            bgColor: "bg-yellow-500/10",
            headerColor: "bg-yellow-500",
            icon: <ChefHat className="h-6 w-6" />,
        },
        {
            title: "Ready / Pick Up",
            status: "ready" as KitchenStatus,
            orders: readyOrders,
            color: "border-green-500",
            bgColor: "bg-green-500/10",
            headerColor: "bg-green-500",
            icon: <CheckCircle2 className="h-6 w-6" />,
        },
    ]

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900">
                <div className="text-center space-y-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full mx-auto"
                    />
                    <p className="text-2xl text-slate-400">Loading Kitchen Display...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 lg:p-6">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                        <ChefHat className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold">Kitchen Display</h1>
                        <p className="text-slate-400 text-lg">
                            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Sound Toggle */}
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setIsMuted(!isMuted)}
                        className={`h-14 w-14 ${isMuted ? 'border-red-500 text-red-500' : 'border-green-500 text-green-500'}`}
                    >
                        {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                    </Button>

                    {/* Active Orders Count */}
                    <div className="bg-slate-800 rounded-xl px-6 py-3 text-center">
                        <p className="text-3xl font-bold text-cyan-400">{orders.length}</p>
                        <p className="text-sm text-slate-400">Active Orders</p>
                    </div>
                </div>
            </header>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                {columns.map((column) => (
                    <div key={column.status} className="flex flex-col">
                        {/* Column Header */}
                        <div className={`${column.headerColor} rounded-t-xl px-6 py-4 flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                                {column.icon}
                                <h2 className="text-xl lg:text-2xl font-bold">{column.title}</h2>
                            </div>
                            <Badge variant="secondary" className="text-lg px-3 py-1 bg-white/20">
                                {column.orders.length}
                            </Badge>
                        </div>

                        {/* Orders List */}
                        <div className={`flex-1 ${column.bgColor} rounded-b-xl border-2 ${column.color} border-t-0 p-4 space-y-4 min-h-[400px] lg:min-h-[600px] overflow-y-auto`}>
                            <AnimatePresence mode="popLayout">
                                {column.orders.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="h-full flex flex-col items-center justify-center text-slate-500"
                                    >
                                        <Utensils className="h-16 w-16 mb-4 opacity-50" />
                                        <p className="text-xl">No orders</p>
                                    </motion.div>
                                ) : (
                                    column.orders.map((order) => (
                                        <motion.div
                                            key={order.id}
                                            layout
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        >
                                            <TicketCard
                                                order={order}
                                                onStatusUpdate={handleStatusUpdate}
                                            />
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Ticket Card Component
interface TicketCardProps {
    order: KitchenOrder
    onStatusUpdate: (orderId: string, currentStatus: KitchenStatus) => void
}

function TicketCard({ order, onStatusUpdate }: TicketCardProps) {
    const [isUpdating, setIsUpdating] = useState(false)

    const handleClick = async () => {
        setIsUpdating(true)
        await onStatusUpdate(order.id, order.kitchenStatus || 'pending')
        setIsUpdating(false)
    }

    // Get action button colors based on status
    const getButtonStyle = () => {
        switch (order.kitchenStatus) {
            case 'pending':
                return 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
            case 'preparing':
                return 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
            case 'ready':
                return 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
            default:
                return 'bg-gray-500'
        }
    }

    return (
        <Card className="bg-slate-800 border-slate-700 shadow-xl">
            {/* Header */}
            <CardHeader className="pb-2 border-b border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl lg:text-3xl font-bold text-white">
                            #{order.invoiceNumber?.split('-').pop() || order.id.slice(-4)}
                        </span>
                        {order.orderType && (
                            <Badge
                                variant="outline"
                                className={`text-sm ${order.orderType === 'takeaway' ? 'border-purple-500 text-purple-400' : 'border-cyan-500 text-cyan-400'}`}
                            >
                                <Package className="h-3 w-3 mr-1" />
                                {order.orderType === 'takeaway' ? 'Takeaway' : 'Dine-in'}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="h-5 w-5" />
                        <span className="text-lg font-medium">
                            {formatRelativeTime(order.created_at)}
                        </span>
                    </div>
                </div>
            </CardHeader>

            {/* Body - Items List */}
            <CardContent className="py-4">
                <ul className="space-y-3">
                    {order.items?.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <span className="text-xl lg:text-2xl font-bold text-cyan-400 w-8">
                                {item.quantity}×
                            </span>
                            <div className="flex-1">
                                <p className="text-lg lg:text-xl font-medium text-white">
                                    {item.menu_item_name}
                                </p>
                                {/* Show modifiers/notes prominently */}
                                {(item as any).notes && (
                                    <p className="text-base font-bold text-red-400 mt-1">
                                        ⚠️ {(item as any).notes}
                                    </p>
                                )}
                                {(item as any).modifiers && (item as any).modifiers.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {(item as any).modifiers.map((mod: any, i: number) => (
                                            <Badge
                                                key={i}
                                                variant="outline"
                                                className="text-sm font-bold text-red-400 border-red-400/50 bg-red-500/10"
                                            >
                                                {mod.name || mod}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>

            {/* Footer - Action Button */}
            <CardFooter className="pt-2 border-t border-slate-700">
                <Button
                    onClick={handleClick}
                    disabled={isUpdating || order.kitchenStatus === 'served'}
                    className={`w-full h-16 lg:h-20 text-xl lg:text-2xl font-bold text-white shadow-lg ${getButtonStyle()}`}
                >
                    {isUpdating ? (
                        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    ) : order.kitchenStatus === 'pending' ? (
                        <Play className="h-6 w-6 mr-2" />
                    ) : order.kitchenStatus === 'preparing' ? (
                        <CheckCircle2 className="h-6 w-6 mr-2" />
                    ) : (
                        <Package className="h-6 w-6 mr-2" />
                    )}
                    {getStatusActionLabel(order.kitchenStatus || 'pending')}
                </Button>
            </CardFooter>
        </Card>
    )
}
