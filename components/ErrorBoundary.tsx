"use client"

import React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error("🚨 Component Error Boundary Triggered:", error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🚨 Error Boundary Details:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return (
        <div className="error-boundary">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} style={{ color: "#ef4444" }} />
            <h3 style={{ color: "#fca5a5", fontSize: "18px", fontWeight: "600" }}>Something went wrong</h3>
          </div>
          <p style={{ color: "#fca5a5", fontSize: "14px", marginBottom: "16px" }}>
            {this.state.error?.message || "An unexpected error occurred in the chat interface."}
          </p>
          <button
            onClick={this.resetError}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              background: "rgba(37, 99, 235, 0.2)",
              color: "#2563eb",
              border: "1px solid rgba(37, 99, 235, 0.3)",
              backdropFilter: "blur(8px)",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
