/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        pitch: {
          50: '#ecfdf3', 400: '#4ade80', 500: '#22c55e', 600: '#16a34a',
          700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16',
        },
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pop-in': { '0%': { opacity: '0', transform: 'scale(0.94)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      },
      animation: { 'fade-up': 'fade-up 0.35s ease-out', 'pop-in': 'pop-in 0.25s ease-out' },
    },
  },
  plugins: [],
};
