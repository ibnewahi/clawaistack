/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        accent: {
          DEFAULT: '#10b981',
          hover: '#059669',
          muted: 'rgba(16, 185, 129, 0.12)',
        },
        surface: {
          DEFAULT: '#18181b',
          elevated: '#27272a',
          border: '#3f3f46',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
