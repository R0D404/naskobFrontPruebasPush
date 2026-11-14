/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14302b',
          light: '#2d6a4f',
          muted: '#4a625c',
        },
        maize: {
          DEFAULT: '#f0b323',
          dark: '#2e2200',
        },
        terra: {
          DEFAULT: '#a94f2c',
          light: '#e07a5f',
          bg: '#fbe7df',
        },
        navy: {
          DEFAULT: '#1d3557',
          light: '#457b9d',
          bg: '#e3eef6',
        },
        cream: {
          DEFAULT: '#f3f6f4',
          card: '#ffffff',
          line: '#d5dfdb',
        },
        ok: {
          DEFAULT: '#006b4f',
          bg: '#e2f3ec',
        },
        warn: {
          DEFAULT: '#8a4a00',
          bg: '#fdf0dc',
        }
      },
      borderRadius: {
        'naskob': '14px',
        'naskob-lg': '20px',
      }
    },
  },
  plugins: [],
}
