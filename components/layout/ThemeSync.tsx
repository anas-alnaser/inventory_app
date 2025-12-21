"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { useSettings } from "@/lib/hooks/useSettings"

export function ThemeSync() {
  const { theme: savedTheme, loading } = useSettings()
  const { setTheme } = useTheme()
  // Track if we've already done the initial sync
  const hasSynced = useRef(false)

  useEffect(() => {
    // Only sync once on initial load when settings are loaded
    if (!loading && savedTheme && !hasSynced.current) {
      hasSynced.current = true
      setTheme(savedTheme)
    }
  }, [savedTheme, loading, setTheme])

  return null
}
