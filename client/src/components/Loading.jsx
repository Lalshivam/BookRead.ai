import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative">
        <div className="w-16 h-16 border-4 border-saffron-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-saffron-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
};

const PageLoader = ({ message = 'पेज लोड हो रहा है...' }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-saffron-50 to-emerald-50 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-saffron-400 to-emerald-500 rounded-full flex items-center justify-center float-animation">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-elegant font-bold text-gray-800 mb-2">BookRead AI</h2>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

export { LoadingSpinner, PageLoader };
