/**
 * TAILWIND DESIGN SYSTEM
 * ====================================
 * Sistema de diseño centralizado para mantener consistencia visual
 * en toda la aplicación frontwaspa.
 * 
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: 'class', // Habilitar dark mode con clase
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ────────────────────────────────────────────────────────
      // 🎨 PALETA DE COLORES DE MARCA
      // ────────────────────────────────────────────────────────
      colors: {
        brand: {
          // Verde principal (WhatsApp-like)
          primary: {
            50: '#E8FDF5',
            100: '#D1FAE9',
            200: '#A3F5D3',
            300: '#6CE9B5',
            400: '#34D399',  // Color principal
            500: '#10B981',
            600: '#059669',
            700: '#047857',
            800: '#065F46',
            900: '#064E3B',
          },

          // Esmeralda (Variante complementaria)
          secondary: {
            50: '#ECFDF5',
            100: '#D1FAE5',
            200: '#A7F3D0',
            300: '#6EE7B7',
            400: '#34D399',
            500: '#10B981',
            600: '#059669',
            700: '#047857',
            800: '#065F46',
            900: '#064E3B',
          },

          // Fondo oscuro (Slate)
          dark: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
            950: '#020617',  // Fondo principal
          },

          // Superficies (para cards, modales)
          surface: {
            light: 'rgba(255, 255, 255, 0.05)',  // Glassmorphism light
            medium: 'rgba(255, 255, 255, 0.1)',
            dark: 'rgba(0, 0, 0, 0.2)',
          },
        },

        // Colores de estado
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },

      // ────────────────────────────────────────────────────────
      // 🔤 TIPOGRAFÍA
      // ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },

      // ────────────────────────────────────────────────────────
      // 📏 ESPACIADO Y TAMAÑOS
      // ────────────────────────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      // ────────────────────────────────────────────────────────
      // 🌟 SOMBRAS PERSONALIZADAS
      // ────────────────────────────────────────────────────────
      boxShadow: {
        'glow-sm': '0 0 10px rgba(52, 211, 153, 0.3)',
        'glow': '0 0 20px rgba(52, 211, 153, 0.5)',
        'glow-lg': '0 0 30px rgba(52, 211, 153, 0.7)',
        'inner-strong': 'inset 0 2px 10px rgba(0, 0, 0, 0.6)',
      },

      // ────────────────────────────────────────────────────────
      // ✨ ANIMACIONES
      // ────────────────────────────────────────────────────────
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'slideUp': 'slideUp 0.4s ease-out',
        'slideDown': 'slideDown 0.4s ease-out',
        'slideInLeft': 'slideInLeft 0.5s ease-out',
        'slideInRight': 'slideInRight 0.5s ease-out',
        'scaleIn': 'scaleIn 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.7)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },

      // ────────────────────────────────────────────────────────
      // 🎭 BACKDROP BLUR
      // ────────────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
