import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

const PageTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayLocation, setDisplayLocation] = useState(location)

  useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true)
      
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setIsTransitioning(false)
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [location, displayLocation])

  const transitionClasses = isTransitioning 
    ? 'opacity-0 transform translate-y-4 scale-95' 
    : 'opacity-100 transform translate-y-0 scale-100'

  return (
    <div 
      className={`transition-all duration-300 ease-in-out ${transitionClasses} ${className}`}
      key={displayLocation.pathname}
    >
      {children}
    </div>
  )
}

// Fade transition variant
export const FadeTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    setIsVisible(false)
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div 
      className={`transition-opacity duration-200 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}

// Slide transition variant
export const SlideTransition: React.FC<PageTransitionProps> = ({ children, className = '' }) => {
  const location = useLocation()
  const [isSliding, setIsSliding] = useState(false)

  useEffect(() => {
    setIsSliding(true)
    const timer = setTimeout(() => setIsSliding(false), 200)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div 
      className={`transition-transform duration-300 ease-out ${
        isSliding ? 'transform translate-x-full' : 'transform translate-x-0'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export default PageTransition