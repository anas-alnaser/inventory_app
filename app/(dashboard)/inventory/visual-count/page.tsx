"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Sparkles, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { VisualStockTake } from "@/components/ai"

export default function VisualCountPage() {
  const router = useRouter()

  const handleSuccess = () => {
    // Optionally navigate to inventory page
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/inventory">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visual Stock Take</h1>
          <p className="text-muted-foreground">AI-powered inventory counting with your camera</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>AI Vision Stock Taking</CardTitle>
                <CardDescription>
                  Photograph your shelves and let AI estimate quantities
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Take a photo of your shelf, storage area, or containers</li>
              <li>AI identifies products and estimates quantities</li>
              <li>Items are matched to your existing inventory</li>
              <li>Review and apply adjustments with one click</li>
            </ul>
          </CardContent>
        </Card>

        {/* Visual Stock Take Component */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Start Stock Take
            </CardTitle>
            <CardDescription>
              Use your camera or upload an image to count inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VisualStockTake onSuccess={handleSuccess} />
          </CardContent>
        </Card>

        {/* Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Tips for Best Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Good Lighting</h4>
                <p className="text-sm text-muted-foreground">
                  Ensure the area is well-lit to help AI identify items clearly.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Clear Labels</h4>
                <p className="text-sm text-muted-foreground">
                  Make sure product labels are visible and facing the camera.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Steady Shot</h4>
                <p className="text-sm text-muted-foreground">
                  Hold your phone steady to avoid blurry images.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Full View</h4>
                <p className="text-sm text-muted-foreground">
                  Include all items you want to count in a single frame.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

