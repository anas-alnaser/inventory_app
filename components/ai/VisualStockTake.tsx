"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Camera, 
  Upload, 
  Check, 
  X, 
  Loader2, 
  Sparkles,
  Package,
  AlertTriangle,
  RefreshCw,
  Eye,
  Edit2,
  Save
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/lib/hooks/use-toast"
import { 
  visualStockTake, 
  applyStockTakeResults, 
  fileToBase64, 
  validateImageFile,
  type StockTakeItem 
} from "@/lib/services/ai-functions"
import { cn } from "@/lib/utils"

interface VisualStockTakeProps {
  onSuccess?: () => void
}

type ProcessingState = 'idle' | 'capturing' | 'processing' | 'review' | 'applying' | 'success' | 'error'

export function VisualStockTake({ onSuccess }: VisualStockTakeProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [state, setState] = useState<ProcessingState>('idle')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [detectedItems, setDetectedItems] = useState<StockTakeItem[]>([])
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
        setState('capturing')
      }
    } catch (err) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please upload an image instead.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      setPreviewUrl(dataUrl)
      stopCamera()
      processImage(dataUrl.split(',')[1], 'image/jpeg')
    }
  }

  const handleFileSelect = useCallback(async (file: File) => {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    setPreviewUrl(URL.createObjectURL(file))
    const base64 = await fileToBase64(file)
    processImage(base64, file.type)
  }, [])

  const processImage = async (base64: string, mimeType: string) => {
    setState('processing')
    setError(null)

    try {
      const result = await visualStockTake(base64, mimeType, notes)

      if (result.success && result.data) {
        setDetectedItems(result.data)
        setState('review')
      } else {
        throw new Error(result.error || 'Failed to analyze image')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process image')
      setState('error')
      toast({
        title: "Analysis Failed",
        description: err.message || "Failed to analyze stock image",
        variant: "destructive",
      })
    }
  }

  const handleApplyResults = async () => {
    const itemsToApply = detectedItems
      .filter(item => item.matched_ingredient_id)
      .map(item => ({
        matched_ingredient_id: item.matched_ingredient_id!,
        estimated_quantity: item.estimated_quantity,
        unit: item.unit,
      }))

    if (itemsToApply.length === 0) {
      toast({
        title: "No Items to Apply",
        description: "No items could be matched to inventory.",
        variant: "destructive",
      })
      return
    }

    setState('applying')
    try {
      const result = await applyStockTakeResults(itemsToApply)
      
      if (result.success) {
        setState('success')
        queryClient.invalidateQueries({ queryKey: ['inventory'] })
        queryClient.invalidateQueries({ queryKey: ['all-stock'] })
        toast({
          title: "Stock Updated",
          description: `Updated ${result.updatedCount} inventory items.`,
        })
        onSuccess?.()
        
        setTimeout(() => {
          resetState()
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to apply updates')
      }
    } catch (err: any) {
      setState('review')
      toast({
        title: "Error",
        description: err.message || "Failed to update stock",
        variant: "destructive",
      })
    }
  }

  const updateItemQuantity = (index: number, newQuantity: number) => {
    setDetectedItems(items => 
      items.map((item, i) => 
        i === index ? { ...item, estimated_quantity: newQuantity } : item
      )
    )
    setEditingIndex(null)
  }

  const resetState = () => {
    stopCamera()
    setState('idle')
    setPreviewUrl(null)
    setDetectedItems([])
    setEditingIndex(null)
    setNotes('')
    setError(null)
  }

  const matchedItemsCount = detectedItems.filter(i => i.matched_ingredient_id).length
  const totalItems = detectedItems.length

  return (
    <div className="space-y-4">
      {/* Capture Area */}
      {state === 'idle' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className="border-2 border-dashed cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5"
            onClick={startCamera}
          >
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Use Camera</h3>
                  <p className="text-sm text-muted-foreground">
                    Take a photo of your shelf or storage
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-2 border-dashed cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5"
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Upload Image</h3>
                  <p className="text-sm text-muted-foreground">
                    Select an existing photo
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Camera View */}
      {state === 'capturing' && isCameraActive && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-dashed border-white/30 rounded-lg pointer-events-none" />
              </div>
              
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => { stopCamera(); setState('idle') }}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={capturePhoto}>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing State */}
      <AnimatePresence mode="wait">
        {state === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Eye className="h-12 w-12 text-primary" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold">AI Analyzing Image...</h3>
                    <p className="text-sm text-muted-foreground">
                      Detecting items and estimating quantities
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-destructive">Analysis Failed</h3>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                  <Button onClick={resetState} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {state === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-success/50 bg-success/5">
              <CardContent className="py-8">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10 }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10"
                  >
                    <Check className="h-6 w-6 text-success" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold text-success">Stock Updated!</h3>
                    <p className="text-sm text-muted-foreground">
                      Inventory has been updated with visual stock take results.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Dialog */}
      <Dialog open={state === 'review' || state === 'applying'} onOpenChange={() => state === 'review' && resetState()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Visual Stock Take Results
            </DialogTitle>
            <DialogDescription>
              Review and adjust the detected quantities before applying
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview Image */}
            {previewUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                <img
                  src={previewUrl}
                  alt="Stock take preview"
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            {/* Detected Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Detected Items</Label>
                <Badge variant={matchedItemsCount === totalItems ? "default" : "secondary"}>
                  {matchedItemsCount}/{totalItems} matched
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {detectedItems.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border",
                      item.matched_ingredient_id 
                        ? "border-success/50 bg-success/5" 
                        : "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className={cn(
                          "h-5 w-5",
                          item.matched_ingredient_id ? "text-success" : "text-yellow-500"
                        )} />
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          {item.matched_ingredient_name && (
                            <p className="text-xs text-muted-foreground">
                              → {item.matched_ingredient_name}
                            </p>
                          )}
                          <Badge variant="outline" className="text-xs mt-1">
                            {item.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {editingIndex === index ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              defaultValue={item.estimated_quantity}
                              className="w-20"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateItemQuantity(index, parseFloat((e.target as HTMLInputElement).value))
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                const input = e.currentTarget.previousSibling as HTMLInputElement
                                updateItemQuantity(index, parseFloat(input.value))
                              }}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="font-medium">
                                {item.estimated_quantity} {item.unit}
                              </p>
                              {item.fill_level_percent !== undefined && (
                                <p className="text-xs text-muted-foreground">
                                  {item.fill_level_percent}% full
                                </p>
                              )}
                              {item.current_stock !== undefined && item.difference !== undefined && (
                                <p className={cn(
                                  "text-xs",
                                  item.difference > 0 ? "text-green-600" : item.difference < 0 ? "text-red-600" : "text-muted-foreground"
                                )}>
                                  {item.difference > 0 ? '+' : ''}{item.difference.toFixed(1)} vs system
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingIndex(index)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {matchedItemsCount === 0 && totalItems > 0 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  No items could be matched to existing ingredients in your inventory.
                </p>
              )}

              {totalItems === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items were detected in the image. Try taking a clearer photo.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetState} disabled={state === 'applying'}>
              Cancel
            </Button>
            <Button 
              onClick={handleApplyResults} 
              disabled={matchedItemsCount === 0 || state === 'applying'}
            >
              {state === 'applying' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Apply to Inventory
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden Elements */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

