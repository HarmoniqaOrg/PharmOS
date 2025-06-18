import React from 'react'

interface LoadingSkeletonProps {
  variant?: 'text' | 'card' | 'circle' | 'rectangle' | 'table' | 'chart'
  width?: string
  height?: string
  className?: string
  lines?: number
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  lines = 3,
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]'
  
  const variants = {
    text: 'h-4 rounded',
    card: 'h-48 rounded-lg',
    circle: 'rounded-full',
    rectangle: 'rounded-md',
    table: 'h-12 rounded',
    chart: 'h-64 rounded-lg',
  }

  const style = {
    width: width || 'auto',
    height: height || 'auto',
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variants.text}`}
            style={{
              width: index === lines - 1 ? '75%' : '100%',
              ...style,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`${baseClasses} ${variants[variant]} ${className}`}
      style={style}
    />
  )
}

// Specific skeleton components for common use cases
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`card ${className}`}>
    <LoadingSkeleton variant="rectangle" height="12px" width="40%" className="mb-4" />
    <LoadingSkeleton variant="text" lines={3} className="mb-4" />
    <div className="flex space-x-2">
      <LoadingSkeleton variant="rectangle" height="32px" width="80px" />
      <LoadingSkeleton variant="rectangle" height="32px" width="80px" />
    </div>
  </div>
)

export const TableSkeleton: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className = '' 
}) => (
  <div className={`space-y-2 ${className}`}>
    {/* Header */}
    <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
      {Array.from({ length: 4 }).map((_, index) => (
        <LoadingSkeleton key={index} variant="text" height="16px" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4 border-b">
        {Array.from({ length: 4 }).map((_, colIndex) => (
          <LoadingSkeleton key={colIndex} variant="text" height="14px" />
        ))}
      </div>
    ))}
  </div>
)

export const DashboardCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`card ${className}`}>
    <div className="flex items-center">
      <LoadingSkeleton variant="circle" width="48px" height="48px" className="mr-4" />
      <div className="flex-1">
        <LoadingSkeleton variant="text" height="12px" width="60%" className="mb-2" />
        <LoadingSkeleton variant="text" height="20px" width="40%" />
      </div>
    </div>
  </div>
)

export const ChartSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`card ${className}`}>
    <LoadingSkeleton variant="text" height="16px" width="30%" className="mb-6" />
    <div className="relative">
      <LoadingSkeleton variant="chart" />
      <div className="absolute bottom-4 left-4 right-4 flex justify-between">
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingSkeleton key={index} variant="text" height="12px" width="12px" />
        ))}
      </div>
    </div>
  </div>
)

export const MoleculeViewerSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
    {/* Header */}
    <div className="bg-gradient-to-r from-gray-300 to-gray-400 p-4">
      <div className="flex items-center justify-between">
        <div>
          <LoadingSkeleton variant="text" height="18px" width="120px" className="mb-2 bg-gray-200" />
          <LoadingSkeleton variant="text" height="14px" width="80px" className="bg-gray-200" />
        </div>
        <div className="flex space-x-2">
          <LoadingSkeleton variant="circle" width="36px" height="36px" className="bg-gray-200" />
          <LoadingSkeleton variant="circle" width="36px" height="36px" className="bg-gray-200" />
        </div>
      </div>
    </div>
    
    {/* Controls */}
    <div className="bg-gray-50 px-4 py-3 border-b">
      <div className="flex items-center space-x-4">
        <LoadingSkeleton variant="rectangle" height="32px" width="120px" />
        <LoadingSkeleton variant="rectangle" height="32px" width="80px" />
      </div>
    </div>
    
    {/* 3D Viewer */}
    <div className="h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <LoadingSkeleton variant="text" height="14px" width="120px" />
      </div>
    </div>
  </div>
)

export default LoadingSkeleton