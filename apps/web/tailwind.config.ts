import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF5B21',
          orangeDark: '#E54B16',
          blue: '#0E3A5E',
          blueLight: '#4C86C6',
          bg: '#EEF3F8',
          card: '#FFFFFF'
        }
      },
      boxShadow: {
        card: '0 20px 40px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
      fontFamily: {
        sans: ['ui-sans-serif','system-ui','Segoe UI','Roboto','Inter','Arial','sans-serif'],
      }
    }
  },
  plugins: []
} satisfies Config;