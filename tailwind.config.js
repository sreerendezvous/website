/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: {
          50: '#faf9f7',
          100: '#f5f3ef',
          200: '#e8e4dc',
          300: '#d5cec2',
          400: '#bbb1a1',
          500: '#a69883',
          600: '#8c7e6a',
          700: '#746857',
          800: '#5f554a',
          900: '#4d463f',
        },
        earth: {
          50: '#f6f5f4',
          100: '#e7e4e1',
          200: '#cdc7c1',
          300: '#b0a79e',
          400: '#968b81',
          500: '#7d726a',
          600: '#665c56',
          700: '#524a45',
          800: '#2d2926',
          900: '#1a1817',
        }
      },
      fontFamily: {
        sans: ['Gilda Display', 'serif'],
        display: ['Cormorant Garamond', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'texture': "url('https://grainy-gradients.vercel.app/noise.svg')",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};