import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { tw, color, button } from "../utils/utils";

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}


export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AppErrorBoundary caught error:", error);
    console.error("Error Info:", errorInfo);

    this.setState({
      errorInfo,
    });
  }

  handleReset = () => {
  
    window.location.href = "/";
  };

  handleClearCache = () => {
    const safeItemsToClear = [
      "theme",
      "language",
      "notifications",
      "settings",
      "cache",
      "configurations",
    ];

    try {
      safeItemsToClear.forEach((key) => {
        // Try to remove items that start with these prefixes
        for (let i = 0; i < localStorage.length; i++) {
          const storedKey = localStorage.key(i);
          if (storedKey && storedKey.toLowerCase().includes(key.toLowerCase())) {
            localStorage.removeItem(storedKey);
          }
        }
      });
      window.location.href = "/";
    } catch (e) {
      console.error("Failed to clear cache:", e);
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      const isProviderError =
        this.state.error?.message?.includes("must be used within") ||
        this.state.error?.message?.includes("Provider");

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>

              <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
                Application Error
              </h1>

              <p className="text-sm text-gray-600 text-center mb-6">
                {isProviderError
                  ? "A critical service initialization error occurred. We'll help you recover."
                  : "An unexpected error occurred. We're working on it."}
              </p>

              <div className="bg-gray-50 rounded border border-gray-200 p-4 mb-6">
                <p className="text-xs font-mono text-gray-700 break-words">
                  {this.state.error?.message || "Unknown error"}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className={`w-full flex items-center justify-center gap-2 ${tw.button}`}
                  style={{
                    backgroundColor: button.action.background,
                    color: button.action.color,
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </button>

                <button
                  onClick={this.handleClearCache}
                  className={`w-full flex items-center justify-center gap-2 ${tw.borderedButton}`}
                  style={{
                    borderColor: color.primary.action,
                    color: color.primary.action,
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Go Back
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                <span className="block mb-2">
                  "Try Again" keeps your login. "Clear Cache" removes temporary data if it's corrupted.
                </span>
                If the problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
