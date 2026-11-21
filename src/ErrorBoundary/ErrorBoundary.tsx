import { Component, type ErrorInfo, type ReactNode } from "react";

export type ErrorBoundaryFallbackProps = {
  error: Error | null;
  reset: () => void;
};

export type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode | ((props: ErrorBoundaryFallbackProps) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback } = this.props;
    if (typeof fallback === "function") {
      return fallback({ error: this.state.error, reset: this.handleReset });
    }
    if (fallback) return fallback;
    return (
      <div role="alert">
        <p>Произошла ошибка</p>
        <button type="button" onClick={this.handleReset}>
          Повторить
        </button>
      </div>
    );
  }
}
