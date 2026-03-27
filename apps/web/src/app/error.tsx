'use client';

import { useEffect } from 'react';
import { Button } from '../components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error('PGB_RUNTIME_ERROR:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 mb-2">
        Ops! Algo deu errado
      </h2>
      <p className="text-slate-500 dark:text-zinc-400 mb-8 max-w-md">
        Ocorreu um erro inesperado no navegador. Isso pode ser causado por extensões, problemas de rede ou falha no carregamento de recursos.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => reset()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Tentar novamente
        </Button>
        
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl"
        >
          Recarregar página completa
        </Button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-slate-100 dark:bg-zinc-900 rounded-lg text-left overflow-auto max-w-full">
          <p className="text-xs font-mono text-red-600 dark:text-red-400">{error.message}</p>
          {error.stack && (
            <pre className="mt-2 text-[10px] text-slate-500 font-mono leading-tight">
              {error.stack}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
