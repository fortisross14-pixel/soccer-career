/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bowlby One"', '"Arial Black"', 'sans-serif'],
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: '#121212',
        bone: '#f4f6ef',
        paper: '#ffffff',
        pitch: '#1d6a3b',
        turf: '#237a42',
        chalk: '#e8f2e3',
        red: '#e0262f',
        sun: '#ffd23f',
        muted: '#5b6259',
        sky: '#2f7cf6',
        grape: '#8b4dff',
        mint: '#2bb673',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slap: { '0%': { opacity: '0', transform: 'scale(1.6) rotate(-6deg)' }, '60%': { opacity: '1', transform: 'scale(.97) rotate(1deg)' }, '100%': { opacity: '1', transform: 'scale(1) rotate(0)' } },
        wobble: { '0%,100%': { transform: 'rotate(0)' }, '25%': { transform: 'rotate(-2deg)' }, '75%': { transform: 'rotate(2deg)' } },
      },
      animation: {
        'fade-up': 'fade-up .35s cubic-bezier(.2,.8,.2,1) both',
        slap: 'slap .45s cubic-bezier(.3,1.5,.5,1) both',
        wobble: 'wobble .4s ease',
      },
    },
  },
  plugins: [],
};
