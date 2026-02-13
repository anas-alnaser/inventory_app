"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useStaff } from '@/lib/contexts/StaffContext'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/lib/hooks/use-toast'
import { X, Delete, Loader2 } from 'lucide-react'
import { createAttendanceRecord, updateAttendanceShiftId } from '@/lib/services/attendance'
import { OpenShiftModal } from '@/components/shifts/OpenShiftModal'
import type { User } from '@/types/entities'

export default function LockScreenPage() {
  const router = useRouter()
  const { loginWithPin, activeStaff, isLoading: staffLoading, setActiveStaff } = useStaff()
  const { userData, isAuthenticated, loading: authLoading } = useAuth()

  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false)
  const [pendingStaff, setPendingStaff] = useState<User | null>(null)
  const [pendingAttendanceId, setPendingAttendanceId] = useState<string | null>(null)
  const [shakeKeypad, setShakeKeypad] = useState(false)

  // If already logged in, redirect based on role
  useEffect(() => {
    if (staffLoading) return

    if (activeStaff) {
      redirectByRole(activeStaff.role)
    }
  }, [activeStaff, staffLoading])

  // Redirect helper based on role
  const redirectByRole = (role: string) => {
    switch (role) {
      case 'cashier':
        router.replace('/pos')
        break
      case 'stock_manager':
        router.replace('/inventory')
        break
      case 'manager':
      case 'supervisor':
      case 'admin':
      case 'owner':
      default:
        router.replace('/dashboard')
        break
    }
  }

  // Handle number pad input
  const handleNumberPress = useCallback((number: string) => {
    setPin((prev) => {
      if (prev.length < 6) {
        return prev + number
      }
      return prev
    })
    setError(null)
  }, [])

  // Handle backspace
  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1))
    setError(null)
  }, [])

  // Handle clear
  const handleClear = useCallback(() => {
    setPin('')
    setError(null)
  }, [])

  // Auto-trigger login when PIN reaches 4-6 digits
  useEffect(() => {
    if (pin.length < 4 || pin.length > 6 || validating) return

    const handleLogin = async () => {
      setValidating(true)
      setError(null)

      try {
        // Use context's loginWithPin
        const result = await loginWithPin(pin, userData?.branchId)

        if (!result.success || !result.user) {
          setShakeKeypad(true)
          setTimeout(() => setShakeKeypad(false), 500)
          setError(result.error || 'Invalid PIN')
          setPin('')
          setValidating(false)
          return
        }

        const foundUser = result.user

        // Create attendance record
        const attendanceResult = await createAttendanceRecord(foundUser.id)

        if (!attendanceResult.success || !attendanceResult.attendance) {
          console.error('Attendance creation failed:', attendanceResult.error)
          // Continue anyway - attendance is not critical for login
        } else {
          setPendingAttendanceId(attendanceResult.attendance.id)
        }

        // If cashier, show open shift modal
        if (foundUser.role === 'cashier') {
          setPendingStaff(foundUser)
          setShowOpenShiftModal(true)
          setValidating(false)
        } else {
          // For non-cashiers, redirect based on role
          toast({
            title: 'Welcome back!',
            description: `Logged in as ${foundUser.name}`,
          })
          redirectByRole(foundUser.role)
          setValidating(false)
        }
      } catch (error: any) {
        console.error('Error during login:', error)
        setShakeKeypad(true)
        setTimeout(() => setShakeKeypad(false), 500)
        setError(`Login failed: ${error?.message || 'Unknown error'}`)
        setPin('')
        setValidating(false)
      }
    }

    // Small delay to allow user to finish entering
    const timer = setTimeout(() => {
      handleLogin()
    }, 300)
    return () => clearTimeout(timer)
  }, [pin, validating, userData?.branchId, loginWithPin, router])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (validating) return

      if (e.key >= '0' && e.key <= '9') {
        handleNumberPress(e.key)
      } else if (e.key === 'Backspace') {
        handleDelete()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [validating, handleNumberPress, handleDelete])

  // Show loading state
  if (authLoading || staffLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated (Firebase auth)
  if (!isAuthenticated) {
    router.replace('/login')
    return null
  }

  // Redirect owners who are NOT store devices to dashboard
  if (userData?.role === 'owner' && userData?.is_store_device !== true) {
    router.replace('/dashboard')
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Staff Login</h1>
          <p className="text-muted-foreground">Enter your PIN to continue</p>
        </div>

        {/* PIN Display */}
        <div className="mb-8">
          <div className="flex justify-center gap-3 mb-4">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className={`
                  h-16 w-16 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all
                  ${index < pin.length
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background'
                  }
                `}
              >
                {index < pin.length ? '•' : ''}
              </div>
            ))}
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center text-sm text-destructive mb-4"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Keypad */}
        <motion.div
          animate={shakeKeypad ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="space-y-3"
        >
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                key={num}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => !validating && handleNumberPress(num.toString())}
                disabled={validating}
                className="h-20 text-3xl font-semibold rounded-lg border-2 border-border bg-background hover:bg-accent hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {num}
              </motion.button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => !validating && handleClear()}
              disabled={validating}
              className="h-20 text-xl"
            >
              <X className="h-6 w-6" />
            </Button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => !validating && handleNumberPress('0')}
              disabled={validating}
              className="h-20 text-3xl font-semibold rounded-lg border-2 border-border bg-background hover:bg-accent hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              0
            </motion.button>
            <Button
              variant="outline"
              onClick={() => !validating && handleDelete()}
              disabled={validating || pin.length === 0}
              className="h-20 text-xl"
            >
              <Delete className="h-6 w-6" />
            </Button>
          </div>
          {validating && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Validating...
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Open Shift Modal for Cashiers */}
      {pendingStaff && (
        <OpenShiftModal
          open={showOpenShiftModal}
          onOpenChange={(open) => {
            setShowOpenShiftModal(open)
            if (!open) {
              // Modal was cancelled - keep staff logged in but don't redirect yet
              setPendingStaff(null)
              setPendingAttendanceId(null)
              setPin('')
              setValidating(false)
            }
          }}
          staffId={pendingStaff.id}
          onSuccess={async (shiftId: string) => {
            // Update attendance record with shift_id
            if (pendingAttendanceId) {
              await updateAttendanceShiftId(pendingAttendanceId, shiftId)
            }

            // Staff is already set in context via loginWithPin
            toast({
              title: 'Welcome back!',
              description: `Logged in as ${pendingStaff.name}. Shift opened.`,
            })
            setPendingStaff(null)
            setPendingAttendanceId(null)
            router.replace('/pos')
          }}
        />
      )}
    </div>
  )
}
