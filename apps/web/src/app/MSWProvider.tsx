'use client';

import { useEffect, useState } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const useMocks = process.env.NEXT_PUBLIC_MOCK_AUTH === '1' || process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

      if (process.env.NODE_ENV === 'development' && useMocks) {
        if (typeof window !== 'undefined') {
          const { worker } = await import('../mocks/browser');
          await worker.start({
            onUnhandledRequest: 'bypass',
          });
          setMswReady(true);
        }
      } else {
        // Enforce cleanup of zombie Service Workers if mocks are disabled
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
              if (registration.active?.scriptURL.includes('mockServiceWorker.js')) {
                console.log('Unregistering MSW Service Worker:', registration.active.scriptURL);
                registration.unregister();
              }
            }
          });
        }
        setMswReady(true);
      }
    };

    init();
  }, []);

  const useMocks = process.env.NEXT_PUBLIC_MOCK_AUTH === '1' || process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
  if (!mswReady && process.env.NODE_ENV === 'development' && useMocks) {
    return null;
  }

  return <>{children}</>;
}
