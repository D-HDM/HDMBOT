import React from 'react';
import { FiLoader } from 'react-icons/fi';
import clsx from 'clsx';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <FiLoader className={clsx('animate-spin text-primary-500', sizeClasses[size])} />
    </div>
  );
};

export default LoadingSpinner;