import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './styles.css'
import './utils/errorLogger'  // Initialize global error listeners
import { logError, logInfo, ErrorCode } from './utils/errorLogger'

const root = createRoot(document.getElementById('root')!)
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js')
      .then(() => logInfo(ErrorCode.SVC_REGISTER, 'Service worker registered successfully'))
      .catch((e) => {
        logError(ErrorCode.SVC_REGISTER, 'Service worker registration failed', { error: e })
      })
  })
}
