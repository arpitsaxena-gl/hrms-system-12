/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a', DEFAULT: '#3b82f6' },
        secondary: { DEFAULT: '#64748b', 500: '#64748b' },
        success: { DEFAULT: '#10b981', 500: '#10b981' },
        warning: { DEFAULT: '#f59e0b', 500: '#f59e0b' },
        danger: { DEFAULT: '#ef4444', 500: '#ef4444' },
        sidebar: { DEFAULT: '#1e293b', hover: '#334155' }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 3px 0 rgba(0,0,0,.1),0 1px 2px -1px rgba(0,0,0,.1)' }
    }
  },
  plugins: []
}
