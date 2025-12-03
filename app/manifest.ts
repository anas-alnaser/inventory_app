import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StockWave',
    short_name: 'StockWave',
    description: 'AI-Powered Inventory Management for Restaurants',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#06b6d4',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icon.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    categories: ['business', 'productivity', 'food'],
    prefer_related_applications: false,
  }
}

