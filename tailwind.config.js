/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette moderna per app controllo stufa
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',  // Rosso primario (fuoco)
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Alias "danger" per compatibilità (punta a primary)
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // Arancione (calore)
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        info: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        // Liquid Glass shadows - ultra soft e diffuse (iOS style)
        'liquid': '0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'liquid-sm': '0 4px 16px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'liquid-lg': '0 16px 48px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03)',
        'liquid-xl': '0 24px 64px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)',

        // Base shadows - elevazione naturale
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',

        // Glassmorphism shadows - effetto vetro
        'glass': '0 4px 16px rgba(31, 38, 135, 0.12), 0 2px 8px rgba(31, 38, 135, 0.08)',
        'glass-sm': '0 2px 8px rgba(31, 38, 135, 0.08), 0 1px 4px rgba(31, 38, 135, 0.06)',
        'glass-lg': '0 8px 24px rgba(31, 38, 135, 0.15), 0 4px 12px rgba(31, 38, 135, 0.1)',
        'glass-xl': '0 12px 32px rgba(31, 38, 135, 0.18), 0 6px 16px rgba(31, 38, 135, 0.12)',

        // Inner shadows - profondità
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-soft': 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',

        // Elevated shadows - livelli di elevazione
        'elevated-sm': '0 1px 2px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevated-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevated-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

        // Glow effects - stati attivi/focus (più sottili per liquid glass)
        'glow-primary': '0 0 0 4px rgba(239, 68, 68, 0.08), 0 0 16px rgba(239, 68, 68, 0.12)',
        'glow-success': '0 0 0 4px rgba(16, 185, 129, 0.08), 0 0 16px rgba(16, 185, 129, 0.12)',
        'glow-info': '0 0 0 4px rgba(59, 130, 246, 0.08), 0 0 16px rgba(59, 130, 246, 0.12)',
        'glow-warning': '0 0 0 4px rgba(245, 158, 11, 0.08), 0 0 16px rgba(245, 158, 11, 0.12)',
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px',
        '4xl': '96px',
      },
      backdropSaturate: {
        110: '1.1',
        125: '1.25',
        150: '1.5',
        175: '1.75',
        200: '2',
      },
      backdropContrast: {
        102: '1.02',
        105: '1.05',
        110: '1.1',
        115: '1.15',
      },
      backgroundImage: {
        'glass-shine': 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 50%, rgba(255, 255, 255, 0.1) 100%)',
        'glass-border': 'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        dropdown: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-8px) scale(0.96)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0) scale(1)',
          },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        dropdown: 'dropdown 0.15s ease-out forwards',
      },
    },
  },
  plugins: [],
}
