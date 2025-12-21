"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
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
import { closeShift } from "@/lib/services/shifts"
import { updateAttendanceClockOut } from "@/lib/services/attendance"
import { useStaff } from "@/lib/contexts/StaffContext"
import { Loader2 } from "lucide-react"

const closeShiftSchema = z.object({
  actualCash: z
    .string()
    .min(1, "Actual cash is required")
    .refine(
      (val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0
      },
      {
        message: "Actual cash must be a valid positive number",
      }
    ),
})

type CloseShiftForm = z.infer<typeof closeShiftSchema>

interface CloseShiftModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shiftId: string
  attendanceId: string | null
}

export function CloseShiftModal({
  open,
  onOpenChange,
  shiftId,
  attendanceId,
}: CloseShiftModalProps) {
  const router = useRouter()
  const { clearActiveStaff } = useStaff()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CloseShiftForm>({
    resolver: zodResolver(closeShiftSchema),
  })

  const onSubmit = async (data: CloseShiftForm) => {
    setIsSubmitting(true)
    try {
      const actualCash = parseFloat(data.actualCash)

      // Close the shift (this calculates expectedCash and variance internally)
      const shiftResult = await closeShift(shiftId, actualCash)

      if (!shiftResult.success || !shiftResult.shift) {
        toast({
          title: "Error",
          description: shiftResult.error || "Failed to close shift",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Update attendance with clock out
      if (attendanceId) {
        const attendanceResult = await updateAttendanceClockOut(attendanceId)
        if (!attendanceResult.success) {
          console.error("Failed to update attendance:", attendanceResult.error)
          // Continue anyway - shift is already closed
        }
      }

      // Show variance in toast (only after shift is closed)
      const variance = shiftResult.shift.variance || 0
      const varianceMessage =
        variance === 0
          ? "Cash count matches expected amount."
          : variance > 0
          ? `Shortage: ${variance.toFixed(2)} JOD`
          : `Overage: ${Math.abs(variance).toFixed(2)} JOD`

      toast({
        title: "Shift Closed",
        description: `Shift closed successfully. ${varianceMessage}`,
        variant: variance === 0 ? "default" : "destructive",
      })

      // Clear active staff and redirect to lock screen
      clearActiveStaff()
      reset()
      onOpenChange(false)
      router.push("/lock-screen")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to close shift",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close Shift</DialogTitle>
          <DialogDescription>
            Enter the total cash amount currently in the drawer. Do not include
            any other information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Warning Message */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Please count the drawer carefully. This action cannot be undone.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="actualCash">Enter Total Cash in Drawer (JOD)</Label>
            <Input
              id="actualCash"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("actualCash")}
              disabled={isSubmitting}
              autoFocus
            />
            {errors.actualCash && (
              <p className="text-sm text-destructive">
                {errors.actualCash.message}
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
            <Button type="submit" disabled={isSubmitting} variant="destructive">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Closing...
                </>
              ) : (
                "Close Shift"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

