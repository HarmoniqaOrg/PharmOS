/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  
  // Test configuration
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global test setup
    globals: true,
    
    // Setup files
    setupFiles: ['./src/test/setup.ts'],
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'coverage'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: [
        'text',
        'text-summary',
        'html',
        'lcov',
        'json'
      ],
      
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50
        }
      },
      
      // Include/exclude patterns
      include: [
        'src/**/*.{js,ts,jsx,tsx}'
      ],
      exclude: [
        'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
        'src/**/index.{js,ts}',
        'src/main.tsx',
        'src/test/**',
        'src/**/*.d.ts',
        'src/**/*.stories.{js,ts,jsx,tsx}',
        'node_modules/**'
      ],
      
      // Higher thresholds for critical components
      perFile: true
    },
    
    // Reporters
    reporter: ['verbose', 'json', 'html'],
    
    // Output directory
    outputFile: {
      json: './coverage/vitest-report.json',
      html: './coverage/index.html'
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Hook timeout
    hookTimeout: 10000,
    
    // Retry failed tests
    retry: 1,
    
    // Watch options
    watch: {
      clearScreen: false
    },
    
    // Mock options
    clearMocks: true,
    restoreMocks: true,
    
    // UI options
    ui: false,
    
    // Experimental features
    experimentalVmThreads: true
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@services': resolve(__dirname, './src/services'),
      '@store': resolve(__dirname, './src/store'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@test': resolve(__dirname, './src/test')
    }
  },
  
  // Esbuild options for faster builds
  esbuild: {
    target: 'node14'
  },
  
  // Define global constants
  define: {
    'import.meta.vitest': 'undefined'
  }
})