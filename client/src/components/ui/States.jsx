import React from 'react';

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-2 border-white/10 border-t-brand-400 ${className}`}
    />
  );
};

export const LoadingPage = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-64 gap-4 animate-fade-in">
    <LoadingSpinner size="lg" />
    <p className="text-gray-400 text-sm">{message}</p>
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="empty-state animate-fade-in">
    {Icon && <Icon className="w-12 h-12 mb-4 text-gray-600" />}
    <h3 className="text-lg font-semibold text-gray-400 mb-2">{title}</h3>
    {description && <p className="text-sm text-gray-600 max-w-sm mb-6">{description}</p>}
    {action}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-4 text-center animate-fade-in">
    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
      <span className="text-2xl">⚠️</span>
    </div>
    <p className="text-red-400 font-medium">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-secondary text-sm">
        Try again
      </button>
    )}
  </div>
);
