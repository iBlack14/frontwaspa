import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative group p-2.5 rounded-xl bg-zinc-800/50 dark:bg-zinc-800/50 hover:bg-zinc-700/50 dark:hover:bg-zinc-700/50 border border-zinc-700/50 dark:border-zinc-700/50 transition-all duration-300 hover:scale-105"
      title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
    >
      <div className="relative w-6 h-6">
        {/* Sun Icon (Light Mode) */}
        <SunIcon
          className={`absolute inset-0 w-6 h-6 text-amber-500 transition-all duration-300 ${
            theme === 'light'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-0'
          }`}
        />
        
        {/* Moon Icon (Dark Mode) */}
        <MoonIcon
          className={`absolute inset-0 w-6 h-6 text-blue-400 transition-all duration-300 ${
            theme === 'dark'
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 rotate-90 scale-0'
          }`}
        />
      </div>

      {/* Tooltip */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 dark:bg-zinc-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
      </div>
    </button>
  );
}
