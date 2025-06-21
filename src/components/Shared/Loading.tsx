import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeMap: Record<SpinnerSize, string> = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeMap[size]} ${className}`}></div>
  );
};

interface LoadingCardProps {
  children?: React.ReactNode;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ children = 'Loading...' }) => {
  return (
    <div className="card flex items-center justify-center py-8">
      <div className="flex items-center space-x-3">
        <LoadingSpinner />
        <span className="text-gray-600">{children}</span>
      </div>
    </div>
  );
};

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({ isLoading, children, ...props }) => {
  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`btn-primary flex items-center justify-center ${props.className || ''}`}
    >
      {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
};
