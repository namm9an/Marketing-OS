/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Satoshi', 'sans-serif'],
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        canvas: 'var(--bg-canvas)',
        panel: 'var(--bg-panel)',
        elevated: 'var(--bg-elevated)',
        ink: {
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
        },
        border: {
          structural: 'var(--border-structural)',
          strong: 'var(--border-strong)',
        },
        signal: 'var(--accent-signal)',
        status: {
          verified: 'var(--status-verified)',
          escalated: 'var(--status-escalated)',
          blocked: 'var(--status-blocked)',
        },
        // Backwards compatibility for existing interactive console
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
