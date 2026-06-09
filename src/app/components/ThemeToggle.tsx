import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-2xl border transition-all duration-300 hover:scale-105 active:scale-95 ${
        isDark
          ? 'bg-gray-800 border-gray-700 text-amber-400 hover:bg-gray-700'
          : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
      }`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
