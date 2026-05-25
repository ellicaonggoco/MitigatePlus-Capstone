/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff', 100: '#dbe4ff', 200: '#bac8ff', 300: '#91a7ff',
          400: '#748ffc', 500: '#5c7cfa', 600: '#4c6ef5', 700: '#4263eb',
          800: '#3b5bdb', 900: '#0d2b6b', 950: '#091b45',
        },
        primary: {
          50: '#e3f2fd', 100: '#bbdefb', 200: '#90caf9', 300: '#64b5f6',
          400: '#42a5f5', 500: '#2196f3', 600: '#1e88e5', 700: '#1565c0',
          800: '#1565c0', 900: '#0d47a1',
        },
        accent: {
          50: '#ffebee', 100: '#ffcdd2', 200: '#ef9a9a', 300: '#e57373',
          400: '#ef5350', 500: '#e53935', 600: '#e53935', 700: '#c62828',
          800: '#b71c1c', 900: '#7f0000',
        }
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem', '4xl': '2rem' },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-hover': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
