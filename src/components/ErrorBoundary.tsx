import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorBoundaryPage from "./ErrorBoundaryPage";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  public resetError = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback(this.state.error, this.resetError);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorBoundaryPage
          error={this.state.error}
          onReload={() => {
            this.resetError();
            window.location.reload();
          }}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

