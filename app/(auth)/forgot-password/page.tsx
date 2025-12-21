"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/lib/hooks/use-toast"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"

const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        getValues,
    } = useForm<ForgotPasswordForm>({
        resolver: zodResolver(forgotPasswordSchema),
    })

    const onSubmit = async (data: ForgotPasswordForm) => {
        setLoading(true)
        try {
            await sendPasswordResetEmail(auth, data.email)
            setEmailSent(true)
            toast({
                title: "Reset link sent!",
                description: "Please check your email for the password reset link.",
                variant: "default",
            })
        } catch (error: any) {
            let errorMessage = "Failed to send reset link. Please try again."

            if (error.code === "auth/user-not-found") {
                errorMessage = "No account found with this email address."
            } else if (error.code === "auth/too-many-requests") {
                errorMessage = "Too many attempts. Please try again later."
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "Invalid email address."
            }

            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
                <img
                    src="/icon.svg"
                    alt="StockWave"
                    className="h-10 w-10 rounded-lg object-contain"
                />
                <span className="text-xl font-bold text-foreground">StockWave</span>
            </div>

            <Card className="border shadow-lg">
                <CardHeader className="space-y-1 text-center pb-2">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {emailSent ? "Check your email" : "Forgot password?"}
                    </CardTitle>
                    <CardDescription>
                        {emailSent
                            ? "We've sent a password reset link to your email"
                            : "Enter your email and we'll send you a reset link"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {emailSent ? (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center justify-center py-6">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <p className="text-sm text-muted-foreground text-center max-w-xs">
                                    We've sent an email to <strong>{getValues("email")}</strong> with
                                    instructions to reset your password.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setEmailSent(false)}
                                >
                                    Try another email
                                </Button>
                                <Link href="/login" className="block">
                                    <Button variant="ghost" className="w-full gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to sign in
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@restaurant.com"
                                        className="pl-10"
                                        {...register("email")}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending link...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>

                            {/* Back to Login Link */}
                            <Link href="/login" className="block">
                                <Button variant="ghost" className="w-full gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to sign in
                                </Button>
                            </Link>
                        </form>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}
