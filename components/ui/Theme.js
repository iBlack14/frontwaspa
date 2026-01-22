import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

const ThemeContext = React.createContext();

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const themes = {
  light: 'light',
  dark: 'dark',
  system: 'system'
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      return stored || themes.system;
    }
    return themes.system;
  });

  const [systemTheme, setSystemTheme] = useState('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = theme === themes.system ? systemTheme : theme;
    
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    
    localStorage.setItem('theme', theme);
  }, [theme, systemTheme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      switch (prev) {
        case themes.light:
          return themes.dark;
        case themes.dark:
          return themes.system;
        case themes.system:
        default:
          return themes.light;
      }
    });
  };

  const setThemeMode = (newTheme) => {
    if (Object.values(themes).includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const effectiveTheme = theme === themes.system ? systemTheme : theme;
  const isDark = effectiveTheme === 'dark';

  const value = {
    theme,
    systemTheme,
    effectiveTheme,
    isDark,
    toggleTheme,
    setThemeMode,
    themes
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Componente Theme Toggle
export const ThemeToggle = ({ className = '', variant = 'button' }) => {
  const { theme, effectiveTheme, toggleTheme, setThemeMode } = useTheme();

  if (variant === 'selector') {
    return (
      <div className={`flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 ${className}`}>
        {Object.entries({
          [themes.light]: { icon: SunIcon, label: 'Claro' },
          [themes.dark]: { icon: MoonIcon, label: 'Oscuro' },
          [themes.system]: { icon: ComputerDesktopIcon, label: 'Sistema' }
        }).map(([key, { icon: Icon, label }]) => (
          <button
            key={key}
            onClick={() => setThemeMode(key)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium
              transition-all duration-200
              ${theme === key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
            `}
            aria-label={`Cambiar a modo ${label}`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    );
  }

  const getIcon = () => {
    switch (theme) {
      case themes.light:
        return SunIcon;
      case themes.dark:
        return MoonIcon;
      case themes.system:
      default:
        return ComputerDesktopIcon;
    }
  };

  const Icon = getIcon();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg bg-gray-100 dark:bg-gray-800 
        text-gray-600 dark:text-gray-400
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition-all duration-200
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Cambiar tema"
    >
      <Icon className="h-5 w-5" />
    </motion.button>
  );
};

// Componente Card con soporte completo de dark mode
export const Card = ({ 
  children, 
  className = '', 
  hover = false,
  glass = false,
  ...props 
}) => {
  const baseClasses = `
    rounded-lg border transition-all duration-200
    ${glass 
      ? 'backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-gray-200/50 dark:border-gray-700/50'
      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
    }
    ${hover ? 'hover:shadow-lg hover:scale-[1.02] hover:border-gray-300 dark:hover:border-gray-600' : ''}
    ${className}
  `;

  return (
    <motion.div
      className={baseClasses}
      whileHover={hover ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Componente Button con soporte completo de dark mode
export const Button = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) => {
  const { isDark } = useTheme();

  const variants = {
    primary: `
      bg-blue-600 hover:bg-blue-700 text-white
      disabled:bg-gray-400 disabled:cursor-not-allowed
      dark:bg-blue-500 dark:hover:bg-blue-600
      dark:disabled:bg-gray-600
    `,
    secondary: `
      bg-gray-100 hover:bg-gray-200 text-gray-900
      disabled:bg-gray-50 disabled:text-gray-400
      dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white
      dark:disabled:bg-gray-800 dark:disabled:text-gray-500
    `,
    outline: `
      border border-gray-300 bg-white hover:bg-gray-50 text-gray-700
      disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400
      dark:border-gray-600 dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-300
      dark:disabled:border-gray-700 dark:disabled:bg-gray-800 dark:disabled:text-gray-500
    `,
    ghost: `
      hover:bg-gray-100 text-gray-700
      disabled:text-gray-400
      dark:hover:bg-gray-800 dark:text-gray-300
      dark:disabled:text-gray-500
    `,
    danger: `
      bg-red-600 hover:bg-red-700 text-white
      disabled:bg-gray-400 disabled:cursor-not-allowed
      dark:bg-red-500 dark:hover:bg-red-600
      dark:disabled:bg-gray-600
    `
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const baseClasses = `
    inline-flex items-center justify-center font-medium rounded-md
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    ${variants[variant] || variants.primary}
    ${sizes[size] || sizes.md}
    ${disabled || loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
    ${className}
  `;

  return (
    <motion.button
      className={baseClasses}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {loading && (
        <motion.div
          className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {children}
    </motion.button>
  );
};

export default ThemeProvider;
