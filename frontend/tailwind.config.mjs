import daisyui from 'daisyui';

export default {
  content: [
    './src/**/*.{html,ts}',
    './node_modules/daisyui/**/*.{js,jsx,ts,tsx,vue}',
  ],
  theme: {
    extend: {
      animation: {
        'slide-in': 'slideIn 300ms ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
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
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: ['light', 'dark'],
    darkTheme: 'dark',
    styled: true,
    base: true,
    utils: true,
  },
};
