import type { Metadata, Viewport } from 'next'
import './globals.css'
import { QueryProvider } from '@/lib/providers/QueryProvider'
import { ThemeProvider } from '@/lib/providers/ThemeProvider'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'StockWave - Inventory Management',
  description: 'AI-Powered Inventory Management for Restaurants',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'StockWave',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#06b6d4' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
