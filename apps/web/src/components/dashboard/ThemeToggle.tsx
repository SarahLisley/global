'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import clsx from 'clsx';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  isSearchOpen?: boolean;
}

export function ThemeToggle({ isSearchOpen }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Evitar hydrate mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={clsx(
        'w-9 h-9 sm:w-10 sm:h-10 rounded-xl',
        'hidden md:block',
        isSearchOpen && 'md:hidden lg:block'
      )} />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={clsx(
        'relative p-2 sm:p-2.5 text-gray-600 dark:text-zinc-400 hover:text-[#4a90e2] dark:hover:text-amber-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:bg-blue-950/30 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200',
        'hidden md:block',
        isSearchOpen && 'md:hidden lg:block'
      )}
      title="Alternar Tema Escuro/Branco"
      aria-label="Alternar Tema"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
    </button>
  );
}
