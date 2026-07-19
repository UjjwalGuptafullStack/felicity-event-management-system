import { Moon, Sun } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex items-center justify-center p-2 sm:p-2.5 rounded-lg bg-muted/40 text-foreground hover:bg-muted/70 transition-colors ${className}`}
    >
      {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
    </motion.button>
  );
}
