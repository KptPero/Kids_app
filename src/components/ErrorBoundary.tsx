import React from 'react'
import { logError, ErrorCode } from '../utils/errorLogger'

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError(ErrorCode.RND_BOUNDARY, `React ErrorBoundary caught: ${error.message}`, {
      error,
      detail: info.componentStack ?? undefined,
      component: 'ErrorBoundary',
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          background: 'linear-gradient(135deg, #FFB6D9 0%, #FFE4E1 100%)',
          fontFamily: "'Nunito', 'Quicksand', sans-serif",
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>😢</div>
          <h2 style={{ color: '#FF6B9D', margin: '0 0 12px 0' }}>Oops! Something went wrong</h2>
          <p style={{ color: '#666', fontSize: 16, marginBottom: 24 }}>
            Don't worry, just tap the button to try again!
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            style={{
              background: 'linear-gradient(135deg, #FF6B9D, #FFB6D9)',
              color: '#fff',
              border: 'none',
              borderRadius: 25,
              padding: '16px 40px',
              fontSize: 18,
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(255,107,157,0.3)'
            }}
          >
            🔄 Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
