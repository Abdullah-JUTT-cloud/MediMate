import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Route error boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--color-bg)] px-4 text-[var(--color-text-primary)]">
          <div className="max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center shadow-lg">
            <h2 className="text-2xl font-bold">Something went wrong</h2>
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              The page encountered an unexpected error. Please return to the dashboard.
            </p>
            <a
              href="/dashboard"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-3 font-semibold text-[var(--color-on-primary)] transition hover:opacity-90"
            >
              Return to dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
