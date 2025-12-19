import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ProfileCard Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-3xl border-2 border-red-100">
            <div className="text-center p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2">שגיאה בטעינת הפרופיל</h3>
                <p className="text-gray-500 text-sm mb-4">נתקלנו בבעיה בהצגת הפרופיל הזה.</p>
                <button 
                    onClick={() => this.props.onSkip && this.props.onSkip()}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-bold"
                >
                    דלג לפרופיל הבא
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;