import { ImageResponse } from 'next/og'

export const size = {
  width: 512,
  height: 512,
}

export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0F172A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '102px',
        }}
      >
        <svg
          width="512"
          height="512"
          viewBox="0 0 512 512"
          fill="none"
        >
          {/* Background - Deep Slate (fully solid for iOS) */}
          <rect width="512" height="512" rx="112" fill="#0F172A" />
          
          {/* Three vertical bars arranged in wave-like pattern */}
          {/* Left bar (shortest) - positioned lower to create wave effect */}
          <rect x="140" y="300" width="50" height="100" rx="25" fill="url(#gradient)" />
          
          {/* Middle bar (medium) - positioned mid-height */}
          <rect x="226" y="250" width="50" height="150" rx="25" fill="url(#gradient)" />
          
          {/* Right bar (tallest) - positioned highest */}
          <rect x="312" y="180" width="50" height="220" rx="25" fill="url(#gradient)" />
          
          {/* Gradient definition: Cyan (#06B6D4) to Royal Blue (#1E40AF) */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}

