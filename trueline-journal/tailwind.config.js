/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'rgb(var(--bg-primary-rgb) / <alpha-value>)',
        'bg-card': 'rgb(var(--bg-card-rgb) / <alpha-value>)',
        'bg-hover': 'rgb(var(--bg-hover-rgb) / <alpha-value>)',
        'accent-green': 'rgb(var(--accent-green-rgb) / <alpha-value>)',
        'accent-red': 'rgb(var(--accent-red-rgb) / <alpha-value>)',
        'accent-purple': 'rgb(var(--accent-purple-rgb) / <alpha-value>)',
        'accent-blue': 'rgb(var(--accent-blue-rgb) / <alpha-value>)',
        'accent-yellow': 'rgb(var(--accent-yellow-rgb) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary-rgb) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted-rgb) / <alpha-value>)',
        border: 'rgb(var(--border-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}
