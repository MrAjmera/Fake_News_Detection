import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { ConsentProvider } from './lib/consent'
import { initTheme } from './lib/theme'

initTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ConsentProvider>
        <App />
      </ConsentProvider>
    </BrowserRouter>
  </StrictMode>
)
