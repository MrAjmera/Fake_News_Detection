import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './lib/auth'
import { ConsentProvider } from './lib/consent'
import { ToastProvider } from './lib/toast'
import { initTheme } from './lib/theme'

initTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ConsentProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ConsentProvider>
    </BrowserRouter>
  </StrictMode>
)
