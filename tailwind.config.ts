// Tailwind config - no type import needed

export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4975c6',
          50: '#f0f5fa',
          100: '#e1ebf6',
          200: '#c3d7ed',
          300: '#a5c3e4',
          400: '#87afdb',
          500: '#699bd2',
          600: '#4975c6',
          700: '#385a9a',
          800: '#273f6e',
          900: '#162442'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  content: [
    './app/**/*.{vue,ts,tsx}',
    './components/**/*.{vue,ts,tsx}',
    './pages/**/*.{vue,ts,tsx}',
    './composables/**/*.{ts,tsx}',
    './stores/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
    './server/**/*.{ts,tsx}'
  ],
  plugins: []
} as any
