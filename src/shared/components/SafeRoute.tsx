import React from "react";
import { AlertTriangle } from "lucide-react";
import { tw, color, button } from "../utils/utils";

interface SafeRouteProps {
  children: React.ReactNode;
}

interface SafeRouteState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for individual routes
 * Prevents one page from crashing the entire app
 */
export class SafeRoute extends React.Component<SafeRouteProps, SafeRouteState> {
  constructor(props: SafeRouteProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("SafeRoute caught error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full mx-4">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <h1 className="text-lg font-bold text-gray-900">Page Error</h1>
              <p className="text-sm text-gray-600">
                This page encountered an error. Please try refreshing or going back.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className={`${tw.button}`}
                  style={{
                    backgroundColor: button.action.background,
                    color: button.action.color,
                  }}
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => window.history.back()}
                  className={`${tw.borderedButton}`}
                  style={{
                    borderColor: color.primary.action,
                    color: color.primary.action,
                  }}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
