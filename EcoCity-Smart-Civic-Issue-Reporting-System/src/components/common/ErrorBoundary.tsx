import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-ivory flex items-center justify-center p-6 text-charcoal">
          <div className="max-w-md w-full bg-white rounded-2xl border border-charcoal/10 shadow-sm p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-coral/10 text-coral flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 stroke-[1.5]" />
            </div>

            <h1 className="text-2xl font-display font-medium text-charcoal mb-2">
              Something went wrong
            </h1>

            <p className="text-sm text-charcoal-light mb-6">
              The application encountered an unexpected display error. Your civic reports and data remain safe.
            </p>

            {this.state.error && (
              <div className="mb-6 text-left p-3.5 bg-ivory rounded-xl border border-charcoal/5 font-mono text-xs text-charcoal/80 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-charcoal text-white rounded-xl text-sm font-medium hover:bg-charcoal/90 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-charcoal/15 text-charcoal rounded-xl text-sm font-medium hover:bg-ivory-dark transition-colors"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
