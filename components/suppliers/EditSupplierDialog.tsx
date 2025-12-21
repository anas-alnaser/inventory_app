"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Pencil, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/lib/hooks/use-toast"
import { updateSupplier } from "@/lib/services/suppliers"
import type { Supplier } from "@/types/entities"

const supplierFormSchema = z.object({
    name: z.string().min(2, "Company name must be at least 2 characters"),
    phone: z.string().min(1, "Phone number is required"),
    email: z.string().email("Invalid email address"),
    address: z.string().optional(),
    contact_person: z.string().optional(),
    payment_terms: z.string().optional(),
})

type SupplierFormData = z.infer<typeof supplierFormSchema>

interface EditSupplierDialogProps {
    supplier: Supplier
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditSupplierDialog({
    supplier,
    open,
    onOpenChange,
}: EditSupplierDialogProps) {
    const queryClient = useQueryClient()

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<SupplierFormData>({
        resolver: zodResolver(supplierFormSchema),
        defaultValues: {
            name: supplier.name || "",
            phone: supplier.phone || "",
            email: supplier.email || "",
            address: supplier.address || "",
            contact_person: supplier.contact_person || "",
            payment_terms: supplier.payment_terms || "",
        },
    })

    // Reset form when supplier changes
    useEffect(() => {
        if (supplier) {
            reset({
                name: supplier.name || "",
                phone: supplier.phone || "",
                email: supplier.email || "",
                address: supplier.address || "",
                contact_person: supplier.contact_person || "",
                payment_terms: supplier.payment_terms || "",
            })
        }
    }, [supplier, reset])

    const updateSupplierMutation = useMutation({
        mutationFn: async (data: SupplierFormData) => {
            return updateSupplier(supplier.id, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] })
            toast({
                title: "Supplier Updated",
                description: "Supplier information has been updated successfully.",
                variant: "default",
            })
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update supplier",
                variant: "destructive",
            })
        },
    })

    const onSubmit = (data: SupplierFormData) => {
        updateSupplierMutation.mutate(data)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="h-5 w-5" />
                        Edit Supplier
                    </DialogTitle>
                    <DialogDescription>
                        Update supplier information. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Company Name</Label>
                        <Input
                            id="name"
                            placeholder="Enter supplier name"
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            placeholder="+962 7X XXX XXXX"
                            {...register("phone")}
                        />
                        {errors.phone && (
                            <p className="text-sm text-destructive">{errors.phone.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="orders@supplier.com"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="contact_person">Contact Person (Optional)</Label>
                        <Input
                            id="contact_person"
                            placeholder="Contact name"
                            {...register("contact_person")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Address (Optional)</Label>
                        <Input
                            id="address"
                            placeholder="Supplier address"
                            {...register("address")}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="payment_terms">Payment Terms (Optional)</Label>
                        <Input
                            id="payment_terms"
                            placeholder="e.g., Net 30"
                            {...register("payment_terms")}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateSupplierMutation.isPending}>
                            {updateSupplierMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
