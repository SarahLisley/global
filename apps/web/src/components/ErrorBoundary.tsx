'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary genérico para envolver seções do dashboard.
 * Quando um componente filho lança um erro durante o render,
 * mostra uma UI de erro amigável em vez de quebrar toda a página.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): State {
    // Se for um erro de redirecionamento do Next.js (NEXT_REDIRECT), 
    // não capturamos como erro de UI para que o Next.js lide com o redirect.
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      return { hasError: false };
    }
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-red-500"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm font-medium text-red-800">
            Erro ao carregar esta seção
          </p>
          <p className="mt-1 text-xs text-red-600">
            {this.state.error?.message || 'Tente recarregar a página.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-3 rounded-lg bg-red-100 px-4 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
