import { Component, ErrorInfo, ReactNode } from 'react';
import { captureError } from '@/utils/errorTracking';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Logs errors and displays a fallback UI
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to error tracking service
        captureError(error, {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
        });

        // Store error info in state
        this.setState({
            error,
            errorInfo,
        });

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);

        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '20px',
                    background: '#0f172a',
                    color: '#fff',
                    textAlign: 'center',
                }}>
                    <div style={{
                        maxWidth: '500px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '16px',
                        padding: '32px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                        <h2 style={{ marginBottom: '16px', fontSize: '24px' }}>
                            Oops! Something went wrong
                        </h2>
                        <p style={{ marginBottom: '24px', color: 'rgba(255, 255, 255, 0.7)' }}>
                            We've encountered an unexpected error. Don't worry, your progress is saved.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <details style={{
                                marginBottom: '24px',
                                textAlign: 'left',
                                background: 'rgba(0, 0, 0, 0.3)',
                                padding: '16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                            }}>
                                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                                    Error Details (Dev Mode)
                                </summary>
                                <pre style={{
                                    overflow: 'auto',
                                    fontSize: '12px',
                                    color: '#ff6b6b',
                                }}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <button
                            onClick={this.handleReset}
                            style={{
                                padding: '12px 24px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
