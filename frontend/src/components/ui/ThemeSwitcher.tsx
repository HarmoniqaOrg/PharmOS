import React, { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  ChevronDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

interface ThemeSwitcherProps {
  variant?: 'button' | 'dropdown'
  className?: string
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  variant = 'button', 
  className = '' 
}) => {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const themes = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: SunIcon,
      description: 'Light mode',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: MoonIcon,
      description: 'Dark mode',
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: ComputerDesktopIcon,
      description: 'Follow system preference',
    },
  ]

  const currentTheme = themes.find(t => t.value === theme)
  const CurrentIcon = currentTheme?.icon || SunIcon

  if (variant === 'button') {
    return (
      <button
        onClick={() => {
          const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
          setTheme(nextTheme)
        }}
        className={`
          relative p-2 rounded-lg transition-all duration-300 ease-in-out
          ${resolvedTheme === 'dark' 
            ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
            : 'bg-white text-gray-700 hover:bg-gray-50'
          }
          border border-gray-300 dark:border-gray-600
          shadow-sm hover:shadow-md
          transform hover:scale-105
          ${className}
        `}
        title={`Current: ${currentTheme?.label} | Click to cycle themes`}
      >
        <div className="relative w-5 h-5">
          <CurrentIcon 
            className={`
              absolute inset-0 w-5 h-5 transition-all duration-300
              ${theme === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180'}
            `}
          />
          <MoonIcon 
            className={`
              absolute inset-0 w-5 h-5 transition-all duration-300
              ${theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180'}
            `}
          />
          <ComputerDesktopIcon 
            className={`
              absolute inset-0 w-5 h-5 transition-all duration-300
              ${theme === 'system' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-180'}
            `}
          />
        </div>
      </button>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200
          ${resolvedTheme === 'dark' 
            ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
            : 'bg-white text-gray-700 hover:bg-gray-50'
          }
          border border-gray-300 dark:border-gray-600
          shadow-sm hover:shadow-md
          min-w-[120px]
        `}
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="text-sm">{currentTheme?.label}</span>
        <ChevronDownIcon 
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className={`
            absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-20
            ${resolvedTheme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
            }
            border
            animate-in fade-in-0 zoom-in-95 duration-200
          `}>
            <div className="py-1">
              {themes.map((themeOption) => {
                const Icon = themeOption.icon
                const isSelected = theme === themeOption.value
                
                return (
                  <button
                    key={themeOption.value}
                    onClick={() => {
                      setTheme(themeOption.value)
                      setIsOpen(false)
                    }}
                    className={`
                      w-full flex items-center justify-between px-4 py-2 text-sm
                      transition-colors duration-150
                      ${resolvedTheme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                      ${isSelected 
                        ? (resolvedTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100')
                        : ''
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-medium">{themeOption.label}</div>
                        <div className={`text-xs ${
                          resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {themeOption.description}
                        </div>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <CheckIcon className="w-4 h-4 text-blue-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Floating theme switcher for always-visible access
export const FloatingThemeSwitcher: React.FC = () => {
  const { toggleTheme, resolvedTheme } = useTheme()

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={toggleTheme}
        className={`
          p-3 rounded-full shadow-lg transition-all duration-300
          ${resolvedTheme === 'dark'
            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
            : 'bg-white text-gray-600 hover:bg-gray-50'
          }
          border border-gray-300 dark:border-gray-600
          transform hover:scale-110 hover:shadow-xl
          backdrop-blur-sm
        `}
        title="Toggle theme"
      >
        {resolvedTheme === 'dark' ? (
          <SunIcon className="w-6 h-6" />
        ) : (
          <MoonIcon className="w-6 h-6" />
        )}
      </button>
    </div>
  )
}

export default ThemeSwitcher