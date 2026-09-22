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
        // User's Exact Custom Luxury Palette from Image
        palette: {
          1: '#06141B', // Deep Obsidian / Midnight Black
          2: '#11212D', // Dark Slate Navy / Charcoal Steel
          3: '#253745', // Deep Steel Slate Blue
          4: '#4A5C6A', // Medium Slate Grey
          5: '#9BA8AB', // Soft Silver Mist Grey
          6: '#CCD0CF', // Light Platinum Grey
          obsidian: '#06141B',
          navy: '#11212D',
          steel: '#253745',
          slate: '#4A5C6A',
          mist: '#9BA8AB',
          platinum: '#CCD0CF',
        },
        appGrey: {
          bg: '#CCD0CF',      // Exact #CCD0CF Canvas Background
          card: '#FFFFFF',    // Crisp Card Surface
          subtle: '#E8ECEB',  // Soft Grey Sections & Inputs
          border: '#9BA8AB',  // Exact #9BA8AB Border Dividers
          darkBg: '#06141B',  // Exact #06141B Dark Canvas
          darkCard: '#11212D',// Exact #11212D Dark Card
        },
        appBlack: {
          DEFAULT: '#06141B', // Exact #06141B Pure Obsidian Black Letters
          primary: '#06141B', // Deepest Text
          secondary: '#253745', // Deep Steel Text
          muted: '#4A5C6A',    // Medium Slate Text
        },
        mocca: {
          950: '#06141B',
          900: '#11212D',
          850: '#182B3A',
          800: '#253745',
          750: '#34495A',
          700: '#4A5C6A',
          600: '#657887',
          500: '#8094A3',
          400: '#9BA8AB',
          300: '#B5C0C2',
          200: '#CCD0CF',
          100: '#E2E6E5',
          50: '#F0F3F2',
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
          DEFAULT: '#CCD0CF',
          muted: '#9BA8AB',
          dark: '#4A5C6A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(212, 175, 55, 0.25)',
        'luxury': '0 10px 30px -10px rgba(6, 20, 27, 0.5)',
      },
    },
  },
  plugins: [],
}
