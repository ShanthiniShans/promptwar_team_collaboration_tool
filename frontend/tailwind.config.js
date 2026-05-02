/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // slate-900
        surface: '#1e293b',    // slate-800
        primary: '#3b82f6',    // blue-500
        secondary: '#8b5cf6',  // violet-500
        textPrimary: '#f8fafc',// slate-50
        textSecondary: '#94a3b8'// slate-400
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem', // 16px rounded corners
      }
    },
  },
  plugins: [],
}
