import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KitchenSync',
    short_name: 'KitchenSync',
    description: 'AI-Powered Inventory Management for Restaurants',
    start_url: '/',
    display: 'standalone',
    background_color: '#0F172A',
    theme_color: '#2563EB',
    orientation: 'portrait-primary',
    scope: '/',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['business', 'productivity', 'food'],
    prefer_related_applications: false,
  }
}

