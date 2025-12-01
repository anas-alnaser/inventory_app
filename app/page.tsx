'use client'

import { useEffect, useState } from 'react'
import { app, analytics } from '@/lib/firebase'

export default function Home() {
  const [firebaseStatus, setFirebaseStatus] = useState<string>('Checking...')
  const [analyticsStatus, setAnalyticsStatus] = useState<string>('Checking...')

  useEffect(() => {
    // Check Firebase connection
    if (app) {
      setFirebaseStatus('✅ Connected')
    } else {
      setFirebaseStatus('❌ Not Connected')
    }

    // Check Analytics
    if (analytics) {
      setAnalyticsStatus('✅ Initialized')
    } else {
      setAnalyticsStatus('⚠️ Not available (SSR)')
    }
  }, [])

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          fontSize: '2rem',
          marginBottom: '1rem',
          color: '#333'
        }}>
          🚀 Next.js + Firebase App
        </h1>
        
        <p style={{
          marginBottom: '2rem',
          color: '#666',
          lineHeight: '1.6'
        }}>
          Welcome to your Next.js application connected to Firebase!
        </p>

        <div style={{
          background: '#f5f5f5',
          padding: '1.5rem',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            marginBottom: '1rem',
            color: '#333'
          }}>
            Connection Status
          </h2>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0',
              borderBottom: '1px solid #ddd'
            }}>
              <span style={{ fontWeight: '500' }}>Firebase App:</span>
              <span>{firebaseStatus}</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.5rem 0'
            }}>
              <span style={{ fontWeight: '500' }}>Analytics:</span>
              <span>{analyticsStatus}</span>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: '#e3f2fd',
          borderRadius: '6px',
          borderLeft: '4px solid #2196f3'
        }}>
          <h3 style={{
            fontSize: '1rem',
            marginBottom: '0.5rem',
            color: '#1976d2'
          }}>
            📝 Next Steps
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            color: '#555'
          }}>
            <li style={{ marginBottom: '0.5rem' }}>• Install dependencies: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>npm install</code></li>
            <li style={{ marginBottom: '0.5rem' }}>• Run development server: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>npm run dev</code></li>
            <li>• Start building your app with Firebase services!</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

