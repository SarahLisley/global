import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

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
    <div className="flex items-center gap-2 w-full justify-center">
      <div className={clsx(
        'transition-all duration-300 relative',
        isSearchOpen ? 'w-full max-w-2xl' : 'hidden sm:block sm:w-64 lg:w-[500px]'
      )}>
        <form onSubmit={handleSearch} className="relative group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4a90e2] transition-colors"
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar pedido, NF ou transação..."
            className="w-full pl-10 pr-10 py-2 sm:py-2.5 bg-gray-100/50 dark:bg-zinc-900 border-none rounded-xl text-sm text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#4a90e2]/50 focus:bg-white dark:bg-zinc-900 dark:focus:bg-zinc-800 transition-all placeholder:text-gray-400"
            autoFocus={isSearchOpen}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      <button
        onClick={toggleSearch}
        className={clsx(
          'p-2 sm:p-2.5 rounded-xl transition-all duration-200 sm:hidden', // Hidden on desktop since search is persistent
          isSearchOpen
            ? 'text-white bg-[#4a90e2] hover:bg-[#2563eb] shadow-lg'
            : 'text-gray-600 dark:text-zinc-400 hover:text-[#4a90e2] hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:bg-blue-950/30 dark:hover:bg-blue-900/30'
        )}
        title={isSearchOpen ? 'Fechar busca' : 'Buscar'}
      >
        {isSearchOpen ? (
          <X size={20} />
        ) : (
          <Search size={20} />
        )}
      </button>
    </div>
  );
}
