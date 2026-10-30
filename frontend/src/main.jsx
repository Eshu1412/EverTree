import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initialiseTracking } from './integrations/tracking'

// Initialize ActiveProspect TrustedForm & Meta Pixel compliance/analytics
initialiseTracking()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
