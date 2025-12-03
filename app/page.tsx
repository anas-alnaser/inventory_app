"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Package, Truck, Sparkles, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/hooks/useAuth"

export default function LandingPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, loading, router])

  const handleGetStarted = () => {
    if (isAuthenticated) {
      router.push("/dashboard")
    } else {
      router.push("/signup")
    }
  }

  const features = [
    {
      icon: <Package className="h-8 w-8 text-primary" />,
      title: "Real-time Tracking",
      description: "Monitor your inventory in real-time with instant updates and notifications for low stock levels.",
    },
    {
      icon: <Truck className="h-8 w-8 text-primary" />,
      title: "Supplier Management",
      description: "Keep track of all your suppliers, manage orders, and streamline your procurement process.",
    },
    {
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      title: "AI Forecasting",
      description: "Predict inventory needs with AI-powered forecasts to prevent stockouts and optimize ordering.",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex justify-center"
          >
            <img 
              src="/icon.svg" 
              alt="StockWave" 
              className="h-20 w-20 rounded-2xl object-contain shadow-lg"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl"
          >
            Master Your Kitchen Inventory
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              with AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-10 text-lg text-muted-foreground md:text-xl"
          >
            Streamline your restaurant operations with intelligent inventory management.
            Track stock levels, predict demand, and never run out of ingredients again.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={handleGetStarted}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              asChild
            >
              <Link href="/login">Login</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features to manage your inventory efficiently
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full border-2 transition-all hover:border-primary/50 hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-8 text-center md:p-12"
          >
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join restaurants already using StockWave to manage their inventory smarter.
            </p>
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="w-full sm:w-auto"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <img 
                src="/icon.svg" 
                alt="StockWave" 
                className="h-8 w-8 rounded-lg object-contain"
              />
              <span className="font-bold text-foreground">StockWave</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} StockWave. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

