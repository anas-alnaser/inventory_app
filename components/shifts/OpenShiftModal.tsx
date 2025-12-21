"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/lib/hooks/use-toast"
import { createShift } from "@/lib/services/shifts"
import { Loader2 } from "lucide-react"

const openShiftSchema = z.object({
  startingCash: z
    .string()
    .min(1, "Starting cash is required")
    .refine(
      (val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0
      },
      {
        message: "Starting cash must be a valid positive number",
      }
    ),
})

type OpenShiftForm = z.infer<typeof openShiftSchema>

interface OpenShiftModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffId: string
  onSuccess: (shiftId: string) => void
}

export function OpenShiftModal({
  open,
  onOpenChange,
  staffId,
  onSuccess,
}: OpenShiftModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OpenShiftForm>({
    resolver: zodResolver(openShiftSchema),
  })

  const onSubmit = async (data: OpenShiftForm) => {
    setIsSubmitting(true)
    try {
      const startingCash = parseFloat(data.startingCash)
      const result = await createShift(staffId, startingCash)

      if (result.success && result.shift) {
        toast({
          title: "Shift Opened",
          description: `Shift opened with starting cash of ${startingCash.toFixed(2)} JOD`,
          variant: "default",
        })
        reset()
        onSuccess(result.shift.id)
        onOpenChange(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to open shift",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open shift",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open Register</DialogTitle>
          <DialogDescription>
            Enter the starting cash amount in the register drawer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startingCash">Starting Cash Amount (JOD)</Label>
            <Input
              id="startingCash"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("startingCash")}
              disabled={isSubmitting}
            />
            {errors.startingCash && (
              <p className="text-sm text-destructive">
                {errors.startingCash.message}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                onOpenChange(false)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                "Open Shift"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

