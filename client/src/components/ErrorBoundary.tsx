import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
  lastErrorTime: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorCount: 0,
      lastErrorTime: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { componentName, onError } = this.props;
    const now = Date.now();
    const { lastErrorTime, errorCount } = this.state;
    
    const timeSinceLastError = now - lastErrorTime;
    const isRapidError = timeSinceLastError < 5000;
    const newErrorCount = isRapidError ? errorCount + 1 : 1;
    
    console.error(
      `Error in ${componentName || 'component'} (attempt ${newErrorCount}):`,
      error,
      errorInfo.componentStack
    );

    this.setState({
      errorCount: newErrorCount,
      lastErrorTime: now
    });

    if (onError) {
      onError(error, errorInfo);
    }

    if (newErrorCount >= 3) {
      console.error(
        `Component ${componentName || 'unknown'} failed ${newErrorCount} times. Preventing automatic retry.`
      );
    }
  }

  handleReset = () => {
    const { errorCount } = this.state;
    
    if (errorCount >= 3) {
      if (confirm('This component has crashed multiple times. Resetting may not help. Reload the page?')) {
        window.location.reload();
        return;
      }
    }
    
    this.setState({ 
      hasError: false, 
      error: null,
      errorCount: 0,
      lastErrorTime: 0
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { errorCount } = this.state;
      const tooManyErrors = errorCount >= 3;

      return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[200px] bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4 text-center max-w-md">
            {this.props.componentName 
              ? `The ${this.props.componentName} component encountered an error.` 
              : 'This component encountered an error.'}
          </p>
          {tooManyErrors && (
            <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
              ⚠️ This component has crashed {errorCount} times
            </p>
          )}
          {import.meta.env.MODE !== 'production' && this.state.error && (
            <pre className="text-xs bg-red-100 dark:bg-red-900/30 p-3 rounded mb-4 max-w-full overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-2">
            <Button
              onClick={this.handleReset}
              variant="outline"
              className="gap-2"
              data-testid="error-boundary-reset"
            >
              <RefreshCw className="w-4 h-4" />
              {tooManyErrors ? 'Try Again Anyway' : 'Try Again'}
            </Button>
            {tooManyErrors && (
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                className="gap-2"
                data-testid="error-boundary-reload"
              >
                Reload Page
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary componentName={componentName}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
