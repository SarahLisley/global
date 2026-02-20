import { useState, useCallback, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type PersistenceType = 'cookie' | 'localStorage';

interface UseFiltersOptions<T> {
  initialFilters: T;
  persistence?: {
    type: PersistenceType;
    keyPrefix?: string;
    storageKey?: string;
    fields: (keyof T)[];
  };
}

export function useFilters<T extends Record<string, string>>({
  initialFilters,
  persistence,
}: UseFiltersOptions<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState<T>(initialFilters);

  const updateURL = useCallback(
    (newFilters: T) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value as string);
        } else {
          params.delete(key);
        }
      });

      // Default page to 1 if not present
      if (!newFilters.page) {
        params.set('page', '1');
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  const saveToPersistence = useCallback(
    (newFilters: T) => {
      if (!persistence) return;

      if (persistence.type === 'cookie' && persistence.keyPrefix) {
        persistence.fields.forEach((field) => {
          const key = `${persistence.keyPrefix}_${String(field)}`;
          const value = newFilters[field];
          if (value) {
            document.cookie = `${key}=${value}; path=/; max-age=2592000; samesite=lax`;
          } else {
            document.cookie = `${key}=; path=/; max-age=0; samesite=lax`;
          }
        });
      } else if (persistence.type === 'localStorage' && persistence.storageKey) {
        const toSave: Partial<T> = {};
        persistence.fields.forEach((field) => {
          toSave[field] = newFilters[field];
        });
        localStorage.setItem(persistence.storageKey, JSON.stringify(toSave));
      }
    },
    [persistence]
  );

  const setFilter = useCallback(
    (key: keyof T, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const updateFilters = useCallback(
    (newValues: Partial<T>) => {
      // We use 'filters' from closure to calculate next state
      const next = { ...filters, ...newValues };
      setFilters(next);
      updateURL(next);
      saveToPersistence(next);
    },
    [filters, updateURL, saveToPersistence]
  );

  const clearFilters = useCallback(
    (defaultValues: T) => {
      setFilters(defaultValues);
      updateURL(defaultValues);
      saveToPersistence(defaultValues);
    },
    [updateURL, saveToPersistence]
  );

  return {
    filters,
    setFilter,
    updateFilters,
    clearFilters,
    isNavigationLoading: isPending,
  };
}
