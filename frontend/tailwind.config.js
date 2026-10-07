/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0b0f17',
          850: '#101726',
          800: '#151e32',
          700: '#1e2942',
          600: '#2a395c',
        },
        macro: {
          calories: '#10b981', // emerald
          protein: '#3b82f6',  // electric blue
          carbs: '#f59e0b',    // warm amber
          fat: '#ec4899',      // vibrant rose
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.3)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'glow-rose': '0 0 25px -5px rgba(236, 72, 153, 0.3)',
      }
    },
  },
  plugins: [],
}
