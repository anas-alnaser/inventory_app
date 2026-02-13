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
import { Loader2, AlertTriangle } from "lucide-react"

const closeShiftSchema = z.object({
  countedCash: z
    .string()
    .min(1, "Counted cash is required")
    .refine(
      (val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0
      },
      {
        message: "Please enter a valid positive number",
      }
    ),
})

type CloseShiftForm = z.infer<typeof closeShiftSchema>

interface CloseShiftModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attendanceId?: string | null
}

/**
 * CloseShiftModal - Simple modal that asks ONLY for counted cash
 * 
 * Flow:
 * 1. Enter counted cash amount
 * 2. Calls closeShift(userId, actualCash) which:
 *    - Calculates expected cash from invoices
 *    - Updates shift with variance
 *    - Sets user's active_shift_id to null
 * 3. Clears staff context and redirects to lock-screen
 */
export function CloseShiftModal({
  open,
  onOpenChange,
  attendanceId,
}: CloseShiftModalProps) {
  const router = useRouter()
  const { activeStaff, clearActiveStaff } = useStaff()
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
    if (!activeStaff) {
      toast({
        title: "Error",
        description: "No active staff member",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const countedCash = parseFloat(data.countedCash)

      // Close shift using userId (service reads active_shift_id internally)
      const result = await closeShift(activeStaff.id, countedCash)

      if (!result.success || !result.shift) {
        toast({
          title: "Error",
          description: result.error || "Failed to close shift",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Update attendance with clock out (if applicable)
      if (attendanceId) {
        const attendanceResult = await updateAttendanceClockOut(attendanceId)
        if (!attendanceResult.success) {
          console.error("[CloseShift] Failed to update attendance:", attendanceResult.error)
        }
      }

      // Show variance feedback
      const variance = result.shift.variance || 0
      const expectedCash = result.shift.expectedCash || 0

      let varianceMessage = ""
      let toastVariant: "default" | "destructive" = "default"

      if (variance === 0) {
        varianceMessage = `✓ Perfect! Cash matches expected (${expectedCash.toFixed(2)} JOD)`
      } else if (variance > 0) {
        varianceMessage = `Shortage: ${variance.toFixed(2)} JOD (Expected: ${expectedCash.toFixed(2)} JOD)`
        toastVariant = "destructive"
      } else {
        varianceMessage = `Overage: ${Math.abs(variance).toFixed(2)} JOD (Expected: ${expectedCash.toFixed(2)} JOD)`
        toastVariant = "destructive"
      }

      toast({
        title: "Shift Closed",
        description: varianceMessage,
        variant: toastVariant,
      })

      // Clean up and redirect
      reset()
      onOpenChange(false)

      // Clear staff context and force re-login
      clearActiveStaff()
      router.replace("/lock-screen")
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Close Shift
          </DialogTitle>
          <DialogDescription>
            Count the total cash in your drawer and enter it below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Count carefully. This action cannot be undone.
            </p>
          </div>

          {/* Cash Input */}
          <div className="space-y-2">
            <Label htmlFor="countedCash" className="text-base font-semibold">
              Total Cash in Drawer (JOD)
            </Label>
            <Input
              id="countedCash"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="text-lg h-12"
              {...register("countedCash")}
              disabled={isSubmitting}
              autoFocus
            />
            {errors.countedCash && (
              <p className="text-sm text-destructive">
                {errors.countedCash.message}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
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
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="destructive"
            >
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
