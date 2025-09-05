import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import Index from './pages/Index.tsx'
import { initializeFirebaseDatabase } from './config/firebase'
import './index.css'

// Initialize Firebase database service
if (!initializeFirebaseDatabase()) {
  throw new Error('Failed to initialize Firebase. Check your configuration.');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Index />
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: 'hsl(var(--glass))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--glass-border))',
          backdropFilter: 'blur(12px)',
        }
      }}
    />
  </React.StrictMode>,
)
