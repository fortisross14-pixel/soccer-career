/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"Roboto Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        night: 'var(--night)',
        panel: 'var(--panel)',
        panel2: 'var(--panel-2)',
        line: 'var(--line)',
        muted: 'var(--muted)',
        cream: 'var(--cream)',
        lime: 'var(--lime)',
        mint: 'var(--mint)',
        orange: 'var(--orange)',
        danger: 'var(--red)',
        sky: { DEFAULT: 'var(--blue)', 300: '#7dd3fc', 400: '#38bdf8', 500: '#0ea5e9' },
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pop-in': { '0%': { opacity: '0', transform: 'scale(0.94)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
      animation: { 'fade-up': 'fade-up 0.3s ease-out both', 'pop-in': 'pop-in 0.22s ease-out both' },
    },
  },
  plugins: [],
};
