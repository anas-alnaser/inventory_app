"use client"

import { useQuery } from "@tanstack/react-query"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "./useAuth"

interface UserSettings {
  currency: string
  theme: string
}

export function useSettings() {
  const { userData, isAuthenticated } = useAuth()

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-settings", userData?.id],
    queryFn: async (): Promise<UserSettings> => {
      if (!userData?.id) {
        return { currency: "JOD", theme: "dark" }
      }

      const userDocRef = doc(db, "users", userData.id)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const data = userDoc.data()
        return {
          currency: data.currency || "JOD",
          theme: data.theme || "dark",
        }
      }

      return { currency: "JOD", theme: "dark" }
    },
    enabled: isAuthenticated && !!userData?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  return {
    currency: settings?.currency || "JOD",
    theme: settings?.theme || "dark",
    loading: isLoading,
    error,
  }
}

