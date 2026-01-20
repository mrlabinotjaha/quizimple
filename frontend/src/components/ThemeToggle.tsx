import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-[#1E1E2E]/5 dark:bg-white/10 hover:bg-[#1E1E2E]/10 dark:hover:bg-white/20 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-[#1E1E2E]/70 dark:text-white/70" />
      ) : (
        <Sun className="w-5 h-5 text-[#1E1E2E]/70 dark:text-white/70" />
      )}
    </button>
  );
}
