import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Keeps an unexpected render/runtime error inside a section from destroying
 * the whole React tree (blank white screen). Shows a visible message and a
 * retry that remounts the wrapped content.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Section crashed:', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-body" style={{ padding: 32, textAlign: 'center' }}>
            <h3 className="card-title" style={{ justifyContent: 'center', marginBottom: 8 }}>
              Something went wrong
            </h3>
            <p className="muted" style={{ marginBottom: 16 }}>
              This section failed to render. The rest of the page is unaffected.
            </p>
            <pre
              className="mono muted"
              style={{ fontSize: 12, whiteSpace: 'pre-wrap', marginBottom: 16 }}
            >
              {this.state.error.message}
            </pre>
            <button type="button" className="btn btn-primary btn-sm" onClick={this.handleRetry}>
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
