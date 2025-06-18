import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeColors {
  // Background colors
  bgPrimary: string
  bgSecondary: string
  bgTertiary: string
  
  // Text colors
  textPrimary: string
  textSecondary: string
  textTertiary: string
  
  // Border colors
  borderPrimary: string
  borderSecondary: string
  
  // Accent colors
  accentPrimary: string
  accentSecondary: string
  
  // Status colors
  success: string
  warning: string
  error: string
  info: string
}

const lightColors: ThemeColors = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f8fafc',
  bgTertiary: '#f1f5f9',
  textPrimary: '#1e293b',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  borderPrimary: '#e2e8f0',
  borderSecondary: '#cbd5e1',
  accentPrimary: '#3b82f6',
  accentSecondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
}

const darkColors: ThemeColors = {
  bgPrimary: '#0f172a',
  bgSecondary: '#1e293b',
  bgTertiary: '#334155',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  borderPrimary: '#334155',
  borderSecondary: '#475569',
  accentPrimary: '#60a5fa',
  accentSecondary: '#a78bfa',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#22d3ee',
}

export interface UseThemeReturn {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  colors: ThemeColors
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  isSystemDark: boolean
}

export const useTheme = (): UseThemeReturn => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get stored theme or default to system
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('pharmos-theme') as Theme) || 'system'
    }
    return 'system'
  })

  const [isSystemDark, setIsSystemDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Resolve the actual theme (light or dark)
  const resolvedTheme: 'light' | 'dark' = theme === 'system' 
    ? (isSystemDark ? 'dark' : 'light') 
    : theme

  const colors = resolvedTheme === 'dark' ? darkColors : lightColors

  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pharmos-theme', newTheme)
    }
  }, [])

  // Toggle between light and dark (skip system)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }, [resolvedTheme, setTheme])

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Apply theme to document
  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Add current theme class
    root.classList.add(resolvedTheme)
    
    // Update CSS custom properties
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors.bgPrimary)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = colors.bgPrimary
      document.head.appendChild(meta)
    }
  }, [resolvedTheme, colors])

  return {
    theme,
    resolvedTheme,
    colors,
    setTheme,
    toggleTheme,
    isSystemDark,
  }
}