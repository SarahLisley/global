import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { logoutAction } from '../../actions/logoutAction';

interface ProfileDropdownProps {
  userName: string;
  userEmail: string;
  avatarUrl: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isSearchOpen: boolean;
}

export function ProfileDropdown({ userName, userEmail, avatarUrl, isOpen, setIsOpen, isSearchOpen }: ProfileDropdownProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    setIsOpen(false);
    await logoutAction();
    router.push('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className={clsx(
          'w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#4a90e2] to-[#2563eb] flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-lg ring-2 ring-blue-100 transition-transform hover:scale-105 overflow-hidden',
          isSearchOpen && 'hidden sm:flex'
        )}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
          ) : (
            userName.charAt(0).toUpperCase()
          )}
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200" role="menu">
            <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate" title={userName}>{userName}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 truncate" title={userEmail}>{userEmail}</p>
            </div>
            <div className="p-1">
              <Link
                href="/dashboard/perfil"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                role="menuitem"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Meu Perfil
              </Link>

              <button
                onClick={() => {
                  setTheme(theme === 'dark' ? 'light' : 'dark');
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-left"
                role="menuitem"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                Tema {theme === 'dark' ? 'Claro' : 'Escuro'}
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-left"
                role="menuitem"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
