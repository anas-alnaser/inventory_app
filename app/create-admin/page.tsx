"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/hooks/use-toast"
import { ChefHat, Loader2 } from "lucide-react"

const adminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type AdminFormData = z.infer<typeof adminSchema>

export default function CreateAdminPage() {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [createdAccount, setCreatedAccount] = useState<{ email: string; password: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
  })

  const onSubmit = async (data: AdminFormData) => {
    setIsCreating(true)
    try {
      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const firebaseUser = userCredential.user

      // Step 2: Update display name
      await updateProfile(firebaseUser, { displayName: data.name })

      // Step 3: Create admin user document in Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), {
        name: data.name,
        email: data.email,
        password_hash: "",
        role: "owner", // Set as owner for full access
        created_at: serverTimestamp(),
      })

      setCreatedAccount({
        email: data.email,
        password: data.password,
      })

      toast({
        title: "Admin Account Created!",
        description: "Admin account has been created successfully.",
        variant: "success",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create admin account",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (createdAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ChefHat className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Admin Account Created!</CardTitle>
            <CardDescription>Save these credentials securely</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <p className="font-mono text-lg font-semibold">{createdAccount.email}</p>
            </div>
            <div className="space-y-2 p-4 bg-muted rounded-lg">
              <Label className="text-sm text-muted-foreground">Password</Label>
              <p className="font-mono text-lg font-semibold">{createdAccount.password}</p>
            </div>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                ⚠️ Important: Save these credentials now. You won't be able to see the password again.
              </p>
            </div>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create Admin Account</CardTitle>
          <CardDescription>Create the first admin/owner account for KitchenSync</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter admin name"
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
                placeholder="admin@kitchensync.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password (min 6 characters)"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Admin Account...
                </>
              ) : (
                "Create Admin Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

