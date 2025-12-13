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
        src: '/icon',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/apple-icon',
        sizes: 'any',
        type: 'image/png',
      },
    ],
    categories: ['business', 'productivity', 'food'],
    prefer_related_applications: false,
  }
}

