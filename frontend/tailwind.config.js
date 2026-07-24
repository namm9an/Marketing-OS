/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        claude: {
          bg: '#FBF9F5',
          card: '#FFFFFF',
          border: '#E7E2D8',
          borderSubtle: '#E0DACE',
          text: '#1C1917',
          muted: '#78716C',
          terracotta: '#D97757',
          terracottaHover: '#C15C3D',
          surface: '#F7F5F0',
          chipBg: '#F2EEE7',
        }
      }
    },
  },
  plugins: [],
}
