import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Anas Firebase App',
  description: 'Next.js application connected to Firebase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

