"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    UserPlus,
    Users,
    Shield,
    Key,
    MoreVertical,
    Search,
    RefreshCcw,
    Trash2,
    Edit,
    Check,
    X,
    Eye,
    EyeOff,
    Copy,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/hooks/useAuth"
import {
    getStaffMembers,
    createStaffMember,
    updateStaffMember,
    deactivateStaffMember,
    reactivateStaffMember,
    generatePIN,
    validatePIN,
    getRoleDisplayName,
    getAssignableRoles,
    type StaffMember,
} from "@/lib/services/staff"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/types/entities"

// Role badge colors
const roleBadgeColors: Record<UserRole, string> = {
    owner: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    manager: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    stock_manager: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    supervisor: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    cashier: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
}

export default function StaffManagementPage() {
    const { userData } = useAuth()
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const [searchQuery, setSearchQuery] = useState("")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
    const [showPIN, setShowPIN] = useState<Record<string, boolean>>({})

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "cashier" as UserRole,
        pin_code: "",
    })

    // Fetch staff members
    const { data: staffMembers = [], isLoading, refetch } = useQuery({
        queryKey: ["staff-members", userData?.restaurantId],
        queryFn: () => getStaffMembers(userData?.restaurantId || "", userData?.branchId),
        enabled: !!userData?.restaurantId,
    })

    // Create staff mutation
    const createMutation = useMutation({
        mutationFn: (data: typeof formData) =>
            createStaffMember({
                ...data,
                branchId: userData?.branchId || "",
                restaurantId: userData?.restaurantId || "",
            }),
        onSuccess: (result) => {
            if (result.success) {
                toast({
                    title: "Staff Created",
                    description: `${formData.name} has been added successfully.`,
                })
                setIsAddDialogOpen(false)
                resetForm()
                queryClient.invalidateQueries({ queryKey: ["staff-members"] })
            } else {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                })
            }
        },
    })

    // Update staff mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<StaffMember> }) =>
            updateStaffMember(id, updates),
        onSuccess: (result) => {
            if (result.success) {
                toast({
                    title: "Staff Updated",
                    description: "Changes saved successfully.",
                })
                setIsEditDialogOpen(false)
                setSelectedStaff(null)
                queryClient.invalidateQueries({ queryKey: ["staff-members"] })
            } else {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                })
            }
        },
    })

    // Deactivate staff mutation
    const deactivateMutation = useMutation({
        mutationFn: (id: string) => deactivateStaffMember(id),
        onSuccess: (result) => {
            if (result.success) {
                toast({
                    title: "Staff Deactivated",
                    description: "Staff member has been deactivated.",
                })
                setDeleteDialogOpen(false)
                setSelectedStaff(null)
                queryClient.invalidateQueries({ queryKey: ["staff-members"] })
            }
        },
    })

    // Reactivate staff mutation
    const reactivateMutation = useMutation({
        mutationFn: (id: string) => reactivateStaffMember(id),
        onSuccess: (result) => {
            if (result.success) {
                toast({
                    title: "Staff Reactivated",
                    description: "Staff member has been reactivated.",
                })
                queryClient.invalidateQueries({ queryKey: ["staff-members"] })
            }
        },
    })

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            role: "cashier",
            pin_code: "",
        })
    }

    const handleGeneratePIN = () => {
        const newPIN = generatePIN()
        setFormData((prev) => ({ ...prev, pin_code: newPIN }))
    }

    const handleCopyPIN = (pin: string) => {
        navigator.clipboard.writeText(pin)
        toast({
            title: "PIN Copied",
            description: "PIN code copied to clipboard.",
        })
    }

    const handleCreateStaff = () => {
        if (!formData.name || !formData.email || !formData.pin_code) {
            toast({
                title: "Missing Fields",
                description: "Please fill in all required fields.",
                variant: "destructive",
            })
            return
        }
        if (!validatePIN(formData.pin_code)) {
            toast({
                title: "Invalid PIN",
                description: "PIN must be exactly 4 digits.",
                variant: "destructive",
            })
            return
        }
        createMutation.mutate(formData)
    }

    const handleEditStaff = (staff: StaffMember) => {
        setSelectedStaff(staff)
        setFormData({
            name: staff.name,
            email: staff.email,
            role: staff.role,
            pin_code: staff.pin_code || "",
        })
        setIsEditDialogOpen(true)
    }

    const handleUpdateStaff = () => {
        if (!selectedStaff) return
        updateMutation.mutate({
            id: selectedStaff.id,
            updates: {
                name: formData.name,
                role: formData.role,
                pin_code: formData.pin_code,
            },
        })
    }

    // Filter staff
    const filteredStaff = staffMembers.filter((staff) =>
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.role.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Get assignable roles
    const assignableRoles = getAssignableRoles(userData?.role || "cashier")

    if (!userData || !["owner", "manager"].includes(userData.role)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-destructive" />
                            Access Denied
                        </CardTitle>
                        <CardDescription>
                            You don't have permission to manage staff members.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        Staff Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your team members, roles, and PIN codes
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => refetch()}
                        className="h-10 w-10"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white gap-2">
                                <UserPlus className="h-4 w-4" />
                                Add Staff
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Staff Member</DialogTitle>
                                <DialogDescription>
                                    Create a new staff member with their role and PIN code.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                                        placeholder="staff@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <Select
                                        value={formData.role}
                                        onValueChange={(v) => setFormData((p) => ({ ...p, role: v as UserRole }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assignableRoles.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {getRoleDisplayName(role)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pin">PIN Code (4 digits)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="pin"
                                            value={formData.pin_code}
                                            onChange={(e) => setFormData((p) => ({ ...p, pin_code: e.target.value }))}
                                            placeholder="0000"
                                            maxLength={4}
                                            className="font-mono text-lg tracking-widest"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleGeneratePIN}
                                            className="shrink-0"
                                        >
                                            <Key className="h-4 w-4 mr-2" />
                                            Generate
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateStaff}
                                    disabled={createMutation.isPending}
                                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
                                >
                                    {createMutation.isPending ? "Creating..." : "Create Staff"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search staff by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/50"
                />
            </div>

            {/* Staff Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-48 rounded-xl" />
                    ))}
                </div>
            ) : filteredStaff.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">No Staff Members</h3>
                        <p className="text-muted-foreground mb-4">
                            {searchQuery ? "No results found." : "Add your first team member to get started."}
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => setIsAddDialogOpen(true)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Staff
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredStaff.map((staff) => (
                            <motion.div
                                key={staff.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Card
                                    className={cn(
                                        "relative overflow-hidden transition-all hover:shadow-lg",
                                        !staff.active && "opacity-60"
                                    )}
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                                                    {staff.name[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{staff.name}</CardTitle>
                                                    <CardDescription className="text-sm">
                                                        {staff.email}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditStaff(staff)}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleCopyPIN(staff.pin_code || "")}
                                                    >
                                                        <Copy className="h-4 w-4 mr-2" />
                                                        Copy PIN
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {staff.active ? (
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                setSelectedStaff(staff)
                                                                setDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Deactivate
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem
                                                            onClick={() => reactivateMutation.mutate(staff.id)}
                                                        >
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Reactivate
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className={roleBadgeColors[staff.role]}>
                                                <Shield className="h-3 w-3 mr-1" />
                                                {getRoleDisplayName(staff.role)}
                                            </Badge>
                                            {!staff.active && (
                                                <Badge variant="secondary" className="bg-red-500/10 text-red-500">
                                                    Inactive
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                                            <div className="flex items-center gap-2">
                                                <Key className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">PIN</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-semibold">
                                                    {showPIN[staff.id] ? staff.pin_code : "••••"}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() =>
                                                        setShowPIN((p) => ({ ...p, [staff.id]: !p[staff.id] }))
                                                    }
                                                >
                                                    {showPIN[staff.id] ? (
                                                        <EyeOff className="h-3 w-3" />
                                                    ) : (
                                                        <Eye className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Staff Member</DialogTitle>
                        <DialogDescription>
                            Update staff details and permissions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(v) => setFormData((p) => ({ ...p, role: v as UserRole }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignableRoles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {getRoleDisplayName(role)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-pin">PIN Code</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="edit-pin"
                                    value={formData.pin_code}
                                    onChange={(e) => setFormData((p) => ({ ...p, pin_code: e.target.value }))}
                                    maxLength={4}
                                    className="font-mono text-lg tracking-widest"
                                />
                                <Button type="button" variant="outline" onClick={handleGeneratePIN}>
                                    <Key className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateStaff}
                            disabled={updateMutation.isPending}
                            className="bg-gradient-to-r from-cyan-500 to-teal-500"
                        >
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate Staff Member?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will prevent {selectedStaff?.name} from logging in. You can reactivate them later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => selectedStaff && deactivateMutation.mutate(selectedStaff.id)}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Deactivate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
