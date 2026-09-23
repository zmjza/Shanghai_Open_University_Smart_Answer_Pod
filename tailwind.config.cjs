/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        'primary-hover': '#4338CA',
        'primary-light': '#EEF2FF',
        surface: '#FFFFFF',
        background: '#F5F3FF',
        'border-soft': '#EDE9FE',
        'accent-success': '#10B981',
        'accent-warning': '#F59E0B',
        'accent-dark': '#0F172A',
        'on-surface': '#0F172A',
        'on-surface-variant': '#64748B',
        secondary: '#6366F1',
        'border-subtle': '#EDE9FE',
        'border-default': '#E2E8F0',
        'surface-container-low': '#F1F5F9',
        'surface-container': '#E2E8F0',
        brand: { DEFAULT: '#4F46E5', hover: '#4338CA', light: '#EEF2FF', subtle: '#E0E7FF' },
      },
      spacing: {
        13: '3.25rem',
      },
      borderRadius: {
        DEFAULT: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2rem',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Geist', 'system-ui', '-apple-system', 'PingFang SC', 'sans-serif'],
        body: ['Geist', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        card: '0 4px 20px -2px rgba(79, 70, 229, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 24px -4px rgba(79, 70, 229, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.04)',
        floating: '0 16px 36px -6px rgba(79, 70, 229, 0.12), 0 4px 12px rgba(15, 23, 42, 0.05)',
        luminous: '0 20px 50px -12px rgba(79, 70, 229, 0.08), 0 2px 8px -2px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
}
