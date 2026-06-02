import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom manufacturing theme colors
        'factory-primary': '#2563eb',
        'factory-success': '#10b981',
        'factory-warning': '#f59e0b',
        'factory-error': '#ef4444',
      },
    },
  },
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    themes: ['light', 'dark'],
    darkTheme: 'dark',
  },
} satisfies Config;
