import React from 'react';
import i18n from '@/i18n';
import { AlertTriangle, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      errorCount: 0,
      timestamp: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const timestamp = new Date().toISOString();
    console.error(`[ErrorBoundary] ${timestamp}`, error, errorInfo);
    
    // Track error count for retry monitoring
    this.setState(prev => ({
      errorCount: prev.errorCount + 1,
      timestamp
    }));
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorCount: 0, timestamp: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-3xl border-2 border-red-200 p-6" dir={i18n.dir()}>
          <div className="text-center max-w-sm">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">{i18n.t("profile_load_error")}</h3>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              {i18n.t("error_boundary_msg")}
            </p>

            {this.state.errorCount > 1 && (
              <p className="text-xs text-red-600 mb-4 bg-red-100 py-2 px-3 rounded">
                {i18n.t("attempt_number", { count: this.state.errorCount })}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRetry}
                className="w-full py-3 px-4 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-colors flex items-center justify-center gap-2"
                aria-label={i18n.t("try_again")}
              >
                <RotateCcw className="w-4 h-4" />
                {i18n.t("try_again")}
              </button>

              <button
                onClick={() => this.props.onSkip && this.props.onSkip()}
                className="w-full py-3 px-4 min-h-[44px] bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold rounded-full transition-colors"
                aria-label={i18n.t("skip_to_next")}
              >
                {i18n.t("skip_to_next")}
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