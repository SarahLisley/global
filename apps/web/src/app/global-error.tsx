'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <title>Erro Crítico - Portal Global Bravo</title>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            text-align: center;
          }
          .container {
            max-width: 480px;
            padding: 2rem;
            background: white;
            border-radius: 1rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
          h1 { font-size: 1.5rem; margin-bottom: 1rem; color: #ef4444; }
          p { color: #64748b; line-height: 1.5; margin-bottom: 2rem; }
          button {
            background: #2563eb;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }
          button:hover { background: #1d4ed8; }
          pre {
            background: #f1f5f9;
            padding: 1rem;
            border-radius: 0.5rem;
            font-size: 0.75rem;
            text-align: left;
            overflow: auto;
            max-height: 200px;
            margin-top: 1.5rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1>Erro Fatal ao Carregar</h1>
          <p>
            O Portal Global encontrou um erro crítico durante a inicialização. Isso pode ser um problema temporário de conexão ou cache de sessão.
          </p>
          <button onClick={() => reset()}>Tentar carregar novamente</button>
          
          {process.env.NODE_ENV === 'development' && (
            <pre>
              {error.message}
              {"\n"}
              {error.stack}
            </pre>
          )}
        </div>
      </body>
    </html>
  );
}
