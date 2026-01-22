import React from 'react';

const SkeletonLoader = ({ 
  variant = 'text', 
  width = 'w-full', 
  height = 'h-4', 
  className = '',
  lines = 1,
  animate = true 
}) => {
  const baseClasses = `bg-gray-200 dark:bg-gray-700 rounded ${animate ? 'animate-pulse' : ''} ${className}`;
  
  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return (
          <div className="space-y-2">
            {Array.from({ length: lines }, (_, i) => (
              <div
                key={i}
                className={`${baseClasses} ${height} ${i === lines - 1 ? 'w-3/4' : width}`}
                style={{
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        );
      
      case 'circular':
        return (
          <div className={`${baseClasses} w-12 h-12 rounded-full`} />
        );
      
      case 'rectangular':
        return (
          <div className={`${baseClasses} ${width} ${height}`} />
        );
      
      case 'card':
        return (
          <div className={`${baseClasses} p-4 space-y-3`}>
            <div className={`${baseClasses} h-6 w-3/4 rounded`} />
            <div className={`${baseClasses} h-4 w-full rounded`} />
            <div className={`${baseClasses} h-4 w-5/6 rounded`} />
          </div>
        );
      
      case 'message':
        return (
          <div className="flex space-x-3">
            <div className={`${baseClasses} w-10 h-10 rounded-full flex-shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`${baseClasses} h-4 w-24 rounded`} />
              <div className={`${baseClasses} h-16 w-full rounded-lg`} />
            </div>
          </div>
        );
      
      default:
        return <div className={`${baseClasses} ${width} ${height}`} />;
    }
  };

  return renderSkeleton();
};

// Componentes específicos para diferentes casos de uso
export const MessageSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }, (_, i) => (
      <SkeletonLoader 
        key={i} 
        variant="message" 
        animate={true}
      />
    ))}
  </div>
);

export const ContactSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="flex items-center space-x-3 p-3">
        <SkeletonLoader variant="circular" />
        <div className="flex-1">
          <SkeletonLoader height="h-4" width="w-32" className="mb-2" />
          <SkeletonLoader height="h-3" width="w-24" />
        </div>
        <SkeletonLoader height="h-8" width="w-16" />
      </div>
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {Array.from({ length: 4 }, (_, i) => (
      <SkeletonLoader key={i} variant="card" />
    ))}
  </div>
);

export default SkeletonLoader;
