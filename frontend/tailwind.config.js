/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        forest: {
          DEFAULT: 'var(--forest)',
          deep: '#213129',
          soft: '#DFE5DF',
        },
        clay: {
          DEFAULT: 'var(--clay)',
          soft: '#F2DED6',
        },
        cream: {
          DEFAULT: 'var(--cream)',
        },
        charcoal: {
          DEFAULT: 'var(--charcoal)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          soft: '#EEE1C7',
        },
        paper: {
          DEFAULT: 'var(--paper)',
        },
        healthy: {
          DEFAULT: 'var(--healthy)',
        },
        line: {
          DEFAULT: '#D4D1C8',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
        accent: ['"Cormorant Garamond"', 'serif'],
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 2px)',
        DEFAULT: 'var(--radius)',
        md: 'var(--radius)',
        lg: 'calc(var(--radius) + 2px)',
        xl: 'calc(var(--radius) + 8px)',
      },
    },
  },
  plugins: [],
}