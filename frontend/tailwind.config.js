module.exports = {
  content: [
    './src/**/*.{html,ts}',
    './node_modules/daisyui/dist/**/*.js',
    './node_modules/daisyui/**/*.{js,jsx,ts,tsx,vue}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['light', 'dark'],
    darkTheme: 'dark',
    styled: true,
    base: true,
    utils: true,
    logs: true,
  },
};
