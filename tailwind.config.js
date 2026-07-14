/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        panel: {
          DEFAULT: '#1a1d24',
          light: '#22262f',
          lighter: '#2a2f3a',
          border: '#343948',
        },
        accent: {
          DEFAULT: '#5b8def',
          hover: '#7aa3ff',
          muted: '#3d5a99',
        },
        surface: {
          DEFAULT: '#0f1116',
          hover: '#1a1d24',
        },
        text: {
          DEFAULT: '#e6e8ee',
          muted: '#9ca3af',
          dim: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': '0.6875rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
