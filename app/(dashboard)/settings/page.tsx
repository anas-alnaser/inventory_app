"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { User, Palette, DollarSign, Database, AlertTriangle, Trash2, Coffee, Download } from "lucide-react"
import { useTheme } from "next-themes"
import { doc, setDoc } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/hooks/useAuth"
import { useSettings } from "@/lib/hooks/useSettings"
import { updateUser } from "@/lib/services"
import { deleteAllDatabaseData } from "@/lib/services/database"
import { toast } from "@/lib/hooks/use-toast"
import { db } from "@/lib/firebase"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function SettingsPage() {
  const { userData } = useAuth()
  const { currency: savedCurrency, theme: savedTheme, loading: settingsLoading } = useSettings()
  const { theme: currentTheme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const [currency, setCurrency] = useState("JOD")
  const [themeState, setThemeState] = useState("system")

  // Initialize currency and theme from saved settings
  useEffect(() => {
    if (!settingsLoading) {
      setCurrency(savedCurrency)
      setThemeState(savedTheme || currentTheme || "system")
    }
  }, [savedCurrency, savedTheme, settingsLoading, currentTheme])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userData?.name || "",
    },
  })

  // Update form when userData changes
  useEffect(() => {
    if (userData?.name) {
      reset({ name: userData.name })
    }
  }, [userData?.name, reset])

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!userData?.id) throw new Error("User not authenticated")
      await updateUser(userData.id, { name: data.name })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userData?.id] })
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    },
  })

  const handleSaveProfile = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data)
  }

  const savePreferencesMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.id) throw new Error("User not authenticated")

      const userDocRef = doc(db, "users", userData.id)
      await setDoc(
        userDocRef,
        {
          currency,
          theme: themeState,
        },
        { merge: true }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings", userData?.id] })
      queryClient.invalidateQueries({ queryKey: ["user", userData?.id] })

      // Update theme in the theme provider
      if (setTheme) {
        setTheme(themeState)
      }

      toast({
        title: "Preferences Saved",
        description: "Your preferences have been saved successfully.",
        variant: "default",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences",
        variant: "destructive",
      })
    },
  })

  const handleSavePreferences = () => {
    savePreferencesMutation.mutate()
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          {(userData?.role === 'admin' || userData?.role === 'owner') && (
            <TabsTrigger value="database">Database</TabsTrigger>
          )}
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleSaveProfile)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userData?.email || ""}
                    placeholder="your@email.com"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact an administrator if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div>
                    <Badge variant="outline" className="text-sm">
                      {userData?.role || "N/A"}
                    </Badge>
                  </div>
                </div>
                <Separator />
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Customize your app experience</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <select
                      id="currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="JOD">JOD - Jordanian Dinar</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                    </select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <select
                      id="theme"
                      value={themeState}
                      onChange={(e) => setThemeState(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your theme preference will be saved and applied automatically.
                  </p>
                </div>
              </div>

              <Separator />

              <Button
                onClick={handleSavePreferences}
                disabled={savePreferencesMutation.isPending}
              >
                {savePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab - Only for Admin/Owner */}
        {(userData?.role === 'admin' || userData?.role === 'owner') && (
          <TabsContent value="database" className="space-y-6">
            {/* Seed Data Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Coffee className="h-5 w-5 text-amber-500" />
                  <div>
                    <CardTitle>Seed Data</CardTitle>
                    <CardDescription>
                      Load sample data to get started quickly
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Import pre-configured ingredients, menu items, and recipes from your uploaded seed files.
                  This is useful for new installations or testing.
                </p>
                <Link href="/seed-coffee">
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                    <Download className="h-4 w-4 mr-2" />
                    Load Coffee Shop Data
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Danger Zone Card */}
            <Card className="border-destructive">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-destructive" />
                  <div>
                    <CardTitle className="text-destructive">Database Management</CardTitle>
                    <CardDescription>
                      Dangerous operations - Use with extreme caution
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-destructive">Warning: Destructive Operation</h4>
                      <p className="text-sm text-muted-foreground">
                        Deleting the database will permanently remove ALL data from Firestore including:
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                        <li>All branches, suppliers, ingredients, and menu items</li>
                        <li>All inventory stock and stock logs</li>
                        <li>All purchase orders and POS orders</li>
                        <li>All invoices and payment records</li>
                        <li>All analytics, forecasts, and AI predictions</li>
                        <li>All system logs and cached data</li>
                      </ul>
                      <p className="text-sm font-semibold text-destructive mt-2">
                        This action cannot be undone! Users collection will be preserved for authentication.
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <DeleteDatabaseButton />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function DeleteDatabaseButton() {
  const { userData } = useAuth()
  const queryClient = useQueryClient()
  const [confirmText, setConfirmText] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const deleteDatabaseMutation = useMutation({
    mutationFn: async () => {
      if (!userData || (userData.role !== 'admin' && userData.role !== 'owner')) {
        throw new Error('Only administrators can delete the database')
      }
      return await deleteAllDatabaseData()
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate all queries to refresh the UI
        queryClient.clear()

        toast({
          title: "Database Deleted",
          description: `Successfully deleted all data. Deleted ${Object.values(result.deletedCounts).reduce((a, b) => a + b, 0)} documents total.`,
          variant: "default",
        })

        setIsOpen(false)
        setConfirmText("")
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete database",
          variant: "destructive",
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete database",
        variant: "destructive",
      })
    },
  })

  const handleDelete = () => {
    if (confirmText === "DELETE ALL DATA") {
      deleteDatabaseMutation.mutate()
    }
  }

  const isConfirmValid = confirmText === "DELETE ALL DATA"

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete All Database Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete All Database Data?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This will permanently delete <strong>ALL</strong> data from your Firestore database.
              This action <strong>CANNOT</strong> be undone.
            </p>
            <p className="font-semibold">
              Type <strong className="text-destructive">DELETE ALL DATA</strong> to confirm:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE ALL DATA"
              className="mt-2"
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText("")}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmValid || deleteDatabaseMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteDatabaseMutation.isPending ? "Deleting..." : "Delete Everything"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

