/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Troy Warriors — Crimson & Gold
        crimson: {
          50: '#fef2f2',
          100: '#fde6e7',
          200: '#fbc4c7',
          400: '#e05263',
          500: '#c9354a',
          600: '#A5243D',
          700: '#8B1E34',
          800: '#6d1729',
          900: '#4a1019',
        },
        gold: {
          50: '#fefbec',
          100: '#fdf3cc',
          200: '#fbe69a',
          400: '#E8B84B',
          500: '#D4A843',
          600: '#B8923A',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          400: '#94a3b8',
          500: '#64748b',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}
