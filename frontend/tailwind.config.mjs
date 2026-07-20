import daisyui from 'daisyui';

export default {
  content: [
    './src/**/*.{html,ts}',
    './node_modules/daisyui/**/*.{js,jsx,ts,tsx,vue}',
  ],
  theme: {
    extend: {},
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
