/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#142B4A', // Dark Navy
          light: '#1e3e68',
          dark: '#0d1d33',
        },
        secondary: {
          DEFAULT: '#3B82F6', // Blue Accent
          light: '#60a5fa',
          dark: '#2563eb',
        },
        surface: {
          bg: '#F5F8FC', // App Background
          card: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B'
        },
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(20, 43, 74, 0.05), 0 1px 2px 0 rgba(20, 43, 74, 0.03)',
        'card': '0 4px 12px 0 rgba(20, 43, 74, 0.06)',
        'elevated': '0 12px 28px -4px rgba(20, 43, 74, 0.12)',
      }
    },
  },
  plugins: [],
}
