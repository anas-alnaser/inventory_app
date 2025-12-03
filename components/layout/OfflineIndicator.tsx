"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { WifiOff, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check initial state
    setIsOnline(navigator.onLine)
    setShowBanner(!navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Keep banner visible briefly to show "Back online" message
      setTimeout(() => setShowBanner(false), 2000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div
            className={`flex items-center justify-between gap-4 px-4 py-2 ${
              isOnline
                ? "bg-emerald-100 text-emerald-800 border-b border-emerald-200"
                : "bg-yellow-100 text-yellow-800 border-b border-yellow-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Back online! Your changes are syncing.
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    You are offline. Changes will be saved locally.
                  </span>
                </>
              )}
            </div>

            {!isOnline && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="h-7 text-yellow-800 hover:bg-yellow-200"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

