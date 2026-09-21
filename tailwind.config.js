/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mocca: {
          950: '#07080A',
          900: '#0D0E12',
          850: '#13151B',
          800: '#181B22',
          750: '#1F232D',
          700: '#282D3A',
          600: '#3B4356',
          500: '#525C73',
          400: '#7E8A9E',
          300: '#AAB4C4',
          200: '#D2D7E0',
          100: '#EAECEF',
          50: '#F7F8F9',
        },
        gold: {
          DEFAULT: '#D4AF37',
          50: '#FCF9EE',
          100: '#F7F0D4',
          200: '#EEDDA9',
          300: '#E4C77E',
          400: '#DCB553',
          500: '#D4AF37',
          600: '#B89325',
          700: '#8C6F19',
          800: '#634E14',
          900: '#3D300E',
        },
        cream: {
          DEFAULT: '#F9F8F5',
          muted: '#EFECE6',
          dark: '#D8D4CA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(212, 175, 55, 0.25)',
        'luxury': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
}
