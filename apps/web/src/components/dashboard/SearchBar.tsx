import clsx from 'clsx';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  isSearchOpen: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  toggleSearch: () => void;
}

export function SearchBar({ isSearchOpen, searchQuery, setSearchQuery, toggleSearch }: SearchBarProps) {
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/busca?q=${encodeURIComponent(searchQuery.trim())}`);
      toggleSearch(); // fecha a busca
    }
  };

  return (
    <>
      <div className={clsx(
        'flex-1 transition-all duration-300',
        isSearchOpen ? 'max-w-2xl' : 'max-w-0 overflow-hidden'
      )}>
        <form onSubmit={handleSearch} className="relative">
          <svg
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-10 sm:pl-12 pr-10 py-2 sm:py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
            autoFocus={isSearchOpen}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </form>
      </div>

      <button
        onClick={toggleSearch}
        className={clsx(
          'p-2 sm:p-2.5 rounded-xl transition-all duration-200',
          isSearchOpen
            ? 'text-white bg-[#4a90e2] hover:bg-[#2563eb] shadow-lg'
            : 'text-gray-600 dark:text-zinc-400 hover:text-[#4a90e2] hover:bg-blue-50 dark:hover:bg-blue-900/30'
        )}
        title={isSearchOpen ? 'Fechar busca' : 'Buscar'}
      >
        {isSearchOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        )}
      </button>
    </>
  );
}
