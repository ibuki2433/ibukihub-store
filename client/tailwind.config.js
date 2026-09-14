/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          bg: '#0d0b14',
          surface: '#131020',
          card: '#181528',
          cardHover: '#1f1b35',
          border: '#2a2544',
          borderHover: '#4e4277',
          accent: '#a78bfa',
          accentLight: '#c4b5fd',
          accentSoft: '#8b5cf6',
          accentDark: '#6d28d9',
          muted: '#8e8a9f',
          text: '#eceaf5',
          subtext: '#a6a1b8',
        }
      },
      boxShadow: {
        'soft-purple': '0 0 20px rgba(167, 139, 250, 0.15)',
        'soft-purple-lg': '0 4px 30px rgba(139, 92, 246, 0.22)',
        'soft-border': '0 0 0 1px rgba(167, 139, 250, 0.25)',
      },
      fontFamily: {
        sans: ['IBM Plex Sans Thai', 'Prompt', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
