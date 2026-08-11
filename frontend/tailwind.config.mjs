export default {
  safelist: [
    { pattern: /^(bg|text|border)-(red|green|yellow|blue|gray|primary|success|warning|error)-(50|100|200|500|600|700)$/ },
    { pattern: /^(opacity|scale)-\d+$/ },
    'animate-shimmer',
    'animate-pulse',
  ],
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      // Custom color palette (design tokens)
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: {
          50: '#f0fdf4',
          100: '#d1fae5',
          200: '#a7f3d0',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      // Animation configurations
      animation: {
        'slide-in': 'slideIn 300ms ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        slideIn: {
          from: {
            opacity: '0',
            transform: 'translateY(-10px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-1000px 0',
          },
          '100%': {
            backgroundPosition: '1000px 0',
          },
        },
        pulseSoft: {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.8',
          },
        },
      },
      // Custom shadows for elevation
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      },
      // Spacing scale (already Tailwind default, documented here)
      // p-1 = 0.25rem (4px), p-4 = 1rem (16px), p-6 = 1.5rem (24px), etc.
      maxWidth: {
        'screen': '100%',
      },
    },
  },
  // Custom component utilities
  corePlugins: {
    preflight: true,
  },
  plugins: [
    // daisyui removed for bundle size optimization
    // Custom component utilities
    function ({ addComponents }) {
      addComponents({
        // Card base styles
        '.card': {
          '@apply bg-white rounded-lg border border-gray-100 shadow-sm p-6': {},
        },
        '.card-hover': {
          '@apply hover:shadow-lg hover:scale-105 transition-transform duration-200': {},
        },
        '.card-actions': {
          '@apply flex gap-2 pt-4': {},
        },
        // Collapse/details styles
        '.collapse': {
          '@apply border border-gray-200 rounded-lg': {},
        },
        '.collapse-title': {
          '@apply cursor-pointer font-medium p-4': {},
        },
        '.collapse-content': {
          '@apply p-4 pt-0': {},
        },
        // Badge base styles
        '.badge-base': {
          '@apply inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap': {},
        },
        // Button base styles
        '.button-base': {
          '@apply inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium': {},
          '@apply transition-colors duration-200': {},
          '@apply focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500': {},
        },
        '.button-primary': {
          '@apply bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800': {},
        },
        '.button-secondary': {
          '@apply bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300': {},
        },
        '.button-ghost': {
          '@apply bg-transparent text-gray-900 hover:bg-gray-100 active:bg-gray-200': {},
        },
        '.button-disabled': {
          '@apply opacity-50 cursor-not-allowed hover:opacity-50': {},
        },
        // Loading skeleton
        '.skeleton': {
          '@apply bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200': {},
          '@apply animate-shimmer bg-[length:1000px_100%]': {},
        },
        // Empty state
        '.empty-state': {
          '@apply flex flex-col items-center justify-center py-12 text-center': {},
        },
        '.empty-state-icon': {
          '@apply text-5xl mb-4 opacity-30': {},
        },
        '.empty-state-text': {
          '@apply text-lg font-medium text-gray-900 mb-2': {},
        },
        '.empty-state-description': {
          '@apply text-sm text-gray-500': {},
        },
        // Error banner
        '.error-banner': {
          '@apply bg-red-50 border border-red-200 rounded-lg p-4': {},
        },
        '.error-banner-title': {
          '@apply text-red-800 text-sm font-medium mb-1': {},
        },
        '.error-banner-message': {
          '@apply text-red-700 text-sm': {},
        },
        // Modal styles
        '.modal': {
          '@apply fixed inset-0 flex items-center justify-center z-50 hidden': {},
        },
        '.modal.modal-open': {
          '@apply bg-black/50 opacity-100 flex': {},
        },
        '.modal-box': {
          '@apply bg-white rounded-lg shadow-lg max-w-2xl max-h-[90vh] overflow-y-auto p-6': {},
        },
        '.modal-action': {
          '@apply flex justify-end gap-3 pt-6 border-t border-gray-200': {},
        },
      });
    },
  ],
};
