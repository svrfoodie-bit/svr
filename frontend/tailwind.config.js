/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ed',
          100: '#dcecd4',
          200: '#b9d9a9',
          300: '#96c67e',
          400: '#73b353',
          500: '#5A8C3F',
          600: '#4a7333',
          700: '#3d6027',
          800: '#2f4d1d',
          900: '#1f3313',
        },
        secondary: {
          50: '#eff8ea',
          100: '#d8edc8',
          200: '#b1db91',
          300: '#8ac95a',
          400: '#63b723',
          500: '#3D6B2A',
          600: '#325721',
          700: '#28461b',
          800: '#1d3413',
          900: '#13230d',
        },
        accent: {
          50: '#fef9ec',
          100: '#fdf0ce',
          200: '#fbe09d',
          300: '#f9d06c',
          400: '#d4a849',
          500: '#c9a043',
          600: '#a68236',
          700: '#83652a',
          800: '#60481e',
          900: '#3d2b12',
        },
        gold: {
          50: '#fef9ec',
          100: '#fdf0ce',
          200: '#fbe09d',
          300: '#f9d06c',
          400: '#d4a849',
          500: '#c9a043',
          600: '#a68236',
          700: '#83652a',
          800: '#60481e',
          900: '#3d2b12',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.08)',
        'strong': '0 10px 50px -12px rgba(0, 0, 0, 0.25)',
        'glow': '0 0 20px rgba(90, 140, 63, 0.3)',
        'glow-lg': '0 0 30px rgba(90, 140, 63, 0.4)',
        'glow-gold': '0 0 20px rgba(212, 168, 73, 0.3)',
        'glow-gold-lg': '0 0 30px rgba(212, 168, 73, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
