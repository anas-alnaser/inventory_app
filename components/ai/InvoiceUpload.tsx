"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Upload, 
  FileText, 
  Check, 
  X, 
  Loader2, 
  Sparkles,
  Package,
  AlertTriangle,
  ChevronRight
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/lib/hooks/use-toast"
import { getSuppliers } from "@/lib/services"
import { 
  processInvoiceOCR, 
  createPOFromInvoice, 
  fileToBase64, 
  validateImageFile,
  type InvoiceItem 
} from "@/lib/services/ai-functions"
import { cn } from "@/lib/utils"

interface InvoiceUploadProps {
  onSuccess?: (purchaseOrderId: string) => void
}

type ProcessingState = 'idle' | 'uploading' | 'processing' | 'review' | 'creating' | 'success' | 'error'

export function InvoiceUpload({ onSuccess }: InvoiceUploadProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [state, setState] = useState<ProcessingState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<{
    items: InvoiceItem[]
    supplier_name?: string
    invoice_number?: string
    total?: number
    date?: string
  } | null>(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  })

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file
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

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError(null)
    setState('uploading')

    try {
      // Convert to base64 and process
      setState('processing')
      const base64 = await fileToBase64(file)
      const result = await processInvoiceOCR(base64, file.type)

      if (result.success && result.data) {
        setExtractedData(result.data)
        setState('review')
        
        // Try to match supplier name
        if (result.data.supplier_name) {
          const matchedSupplier = suppliers.find(s => 
            s.name.toLowerCase().includes(result.data!.supplier_name!.toLowerCase()) ||
            result.data!.supplier_name!.toLowerCase().includes(s.name.toLowerCase())
          )
          if (matchedSupplier) {
            setSelectedSupplierId(matchedSupplier.id)
          }
        }
      } else {
        throw new Error(result.error || 'Failed to process invoice')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process invoice')
      setState('error')
      toast({
        title: "Processing Failed",
        description: err.message || "Failed to extract invoice data",
        variant: "destructive",
      })
    }
  }, [suppliers])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleCreatePO = async () => {
    if (!extractedData || !selectedSupplierId) return

    setState('creating')
    try {
      const result = await createPOFromInvoice(extractedData, selectedSupplierId)
      
      if (result.success && result.purchaseOrderId) {
        setState('success')
        queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
        toast({
          title: "Purchase Order Created",
          description: "Invoice has been converted to a draft purchase order.",
        })
        onSuccess?.(result.purchaseOrderId)
        
        // Reset after delay
        setTimeout(() => {
          resetState()
        }, 2000)
      } else {
        throw new Error(result.error || 'Failed to create purchase order')
      }
    } catch (err: any) {
      setState('review')
      toast({
        title: "Error",
        description: err.message || "Failed to create purchase order",
        variant: "destructive",
      })
    }
  }

  const resetState = () => {
    setState('idle')
    setSelectedFile(null)
    setPreviewUrl(null)
    setExtractedData(null)
    setSelectedSupplierId('')
    setError(null)
  }

  const matchedItemsCount = extractedData?.items.filter(i => i.matched_ingredient_id).length || 0
  const totalItems = extractedData?.items.length || 0

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {state === 'idle' && (
        <Card
          className={cn(
            "border-2 border-dashed cursor-pointer transition-colors hover:border-primary/50",
            "hover:bg-primary/5"
          )}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Upload Invoice</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Take a photo or upload an invoice image. Our AI will extract the items automatically.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">JPEG</Badge>
                <Badge variant="outline">PNG</Badge>
                <Badge variant="outline">WebP</Badge>
                <span>Max 5MB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing States */}
      <AnimatePresence mode="wait">
        {(state === 'uploading' || state === 'processing') && (
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
                    <Sparkles className="h-12 w-12 text-primary" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {state === 'uploading' ? 'Uploading...' : 'AI Processing Invoice...'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {state === 'processing' && 'Extracting line items, quantities, and prices'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-75" />
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse delay-150" />
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
                    <h3 className="text-lg font-semibold text-destructive">Processing Failed</h3>
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
                    <h3 className="text-lg font-semibold text-success">Purchase Order Created!</h3>
                    <p className="text-sm text-muted-foreground">
                      Invoice has been converted to a draft purchase order.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Dialog */}
      <Dialog open={state === 'review' || state === 'creating'} onOpenChange={() => state === 'review' && resetState()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Review Extracted Data
            </DialogTitle>
            <DialogDescription>
              Verify the extracted information before creating a purchase order
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview Image */}
            {previewUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                <img
                  src={previewUrl}
                  alt="Invoice preview"
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            {/* Invoice Info */}
            {extractedData && (
              <div className="grid gap-4 md:grid-cols-2">
                {extractedData.supplier_name && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Detected Supplier</Label>
                    <p className="font-medium">{extractedData.supplier_name}</p>
                  </div>
                )}
                {extractedData.invoice_number && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Invoice Number</Label>
                    <p className="font-medium">{extractedData.invoice_number}</p>
                  </div>
                )}
                {extractedData.total && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Total</Label>
                    <p className="font-medium">${extractedData.total.toFixed(2)}</p>
                  </div>
                )}
                {extractedData.date && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <p className="font-medium">{extractedData.date}</p>
                  </div>
                )}
              </div>
            )}

            {/* Supplier Selection */}
            <div className="space-y-2">
              <Label>Link to Supplier</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Extracted Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Extracted Items</Label>
                <Badge variant={matchedItemsCount === totalItems ? "default" : "secondary"}>
                  {matchedItemsCount}/{totalItems} matched
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {extractedData?.items.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      item.matched_ingredient_id 
                        ? "border-success/50 bg-success/5" 
                        : "border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Package className={cn(
                        "h-5 w-5",
                        item.matched_ingredient_id ? "text-success" : "text-yellow-500"
                      )} />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.matched_ingredient_name && (
                          <p className="text-xs text-muted-foreground">
                            → {item.matched_ingredient_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {item.quantity} {item.unit}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${item.unit_price.toFixed(2)}/unit
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {matchedItemsCount === 0 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  No items could be matched to existing ingredients. Add ingredients first or manually create a purchase order.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetState} disabled={state === 'creating'}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePO} 
              disabled={!selectedSupplierId || matchedItemsCount === 0 || state === 'creating'}
            >
              {state === 'creating' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Purchase Order
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
          e.target.value = '' // Reset for re-upload
        }}
      />
    </div>
  )
}

