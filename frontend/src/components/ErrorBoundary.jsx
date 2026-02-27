import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('🔴 ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Une erreur est survenue</h2>
            <p className="text-gray-500 mb-6 text-sm">
              {this.state.error?.message || 'Erreur inattendue dans le composant.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn-primary"
              >
                Réessayer
              </button>
              <button
                onClick={this.handleReload}
                className="btn-secondary"
              >
                Recharger la page
              </button>
            </div>
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-gray-400 cursor-pointer">Détails techniques</summary>
                <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-48 text-red-600">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
