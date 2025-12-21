"use client"

import { QRCode } from 'react-qr-code'
import type { Invoice } from '@/types/entities'
import { formatCurrency } from '@/lib/services/tax'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

interface InvoiceReceiptProps {
  invoice: Invoice
  restaurantName: string
  onPrint?: () => void
}

export function InvoiceReceipt({ invoice, restaurantName, onPrint }: InvoiceReceiptProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 space-y-4 print:p-8">
      {/* Print Button (hidden when printing) */}
      {onPrint && (
        <div className="print:hidden mb-4">
          <Button onClick={onPrint} className="w-full">
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </div>
      )}

      <Card className="print:shadow-none">
        <CardContent className="p-6 space-y-4">
          {/* Header */}
          <div className="text-center border-b pb-4">
            <h2 className="text-xl font-bold">{restaurantName}</h2>
            <p className="text-sm text-muted-foreground">Tax Invoice</p>
          </div>

          {/* Invoice Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice #:</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span>{formatDate(invoice.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment:</span>
              <span className="font-medium">{invoice.paymentMethod}</span>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Items</h3>
            {invoice.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.menu_item_name}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatCurrency(item.unit_price)} × {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(item.line_total)} JOD</p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Financial Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)} JOD</span>
            </div>
            {invoice.discountAmount && invoice.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount {invoice.discountName ? `(${invoice.discountName})` : ''}</span>
                <span>-{formatCurrency(invoice.discountAmount)} JOD</span>
              </div>
            )}
            {invoice.serviceChargeAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Charge</span>
                <span>{formatCurrency(invoice.serviceChargeAmount)} JOD</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (16%)</span>
              <span>{formatCurrency(invoice.taxAmount)} JOD</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(invoice.grandTotal)} JOD</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="pt-4 border-t">
            <div className="flex flex-col items-center space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                Scan QR code for invoice verification
              </p>
              <div className="bg-white p-4 rounded-lg border flex items-center justify-center">
                <QRCode
                  value={invoice.qrCodeString}
                  size={200}
                  level="M"
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-xs break-all">
                {invoice.qrCodeString}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Thank you for your business!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

