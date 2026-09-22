export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Legacy colors kept for any other pages that may use them
        navy1: '#30425a',
        navy2: '#31445c',
        cream: '#e8dcc4',
        // New design tokens
        accent: '#1B6A4C',
        'accent-hover': '#14533B',
        'accent-light': '#2A8C66',
        page: '#F3F5F3',
        surface: '#FFFFFF',
        'text-primary': '#121B16',
        'text-secondary': '#4A5B52',
        'text-muted': '#798C81',
      },
      fontFamily: {
        raleway: ['Raleway', 'sans-serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
        fraunces: ['Fraunces', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '7px',
        md: '10px',
        lg: '16px',
      },
    },
  },
  plugins: [],
}