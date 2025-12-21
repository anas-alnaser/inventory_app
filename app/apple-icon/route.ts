// Route handler to serve static apple icon
// This avoids the @vercel/og Windows path issue with OneDrive folders
import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    // Serve the static icon from public folder
    const iconPath = join(process.cwd(), 'public', 'icon.png')
    const iconBuffer = await readFile(iconPath)
    
    return new NextResponse(iconBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    // Fallback: return 404 if icon not found
    return new NextResponse(null, { status: 404 })
  }
}

