'use client';

import { Card, Button } from '@pgb/ui';
import Link from 'next/link';

export type SearchResult = {
  id: string; // NUMTRANSVENDA
  nroPedido?: string; // NUMPED
  nroNF?: string; // NUMNOTA
  vlrTotal: number;
  data: string; // DTFAT ou afins
  destinatario?: string; // CLIENTE
  tipo: 'pedido' | 'entrega';
};

interface BuscaClientProps {
  query: string;
  initialResults: SearchResult[];
}

export default function BuscaClient({ query, initialResults }: BuscaClientProps) {
  if (!query) {
    return (
      <Card className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <p>Utilize a barra de pesquisa no topo para encontrar Pedidos e Entregas rapidamente.</p>
      </Card>
    );
  }

  if (initialResults.length === 0) {
    return (
      <Card className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-slate-200 bg-slate-50/50">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum resultado encontrado</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
          Não localizamos documentos contendo <strong>"{query}"</strong>. Tente buscar pelo número exato do Pedido ou Nota Fiscal.
        </p>
      </Card>
    );
  }

  const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtBR = new Intl.DateTimeFormat('pt-BR');

  return (
    <Card className="p-0 overflow-hidden shadow-sm border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Identificação</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Destinatário</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Data</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Valor Total</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialResults.map((e, idx) => (
              <tr key={`${e.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-slate-900 inline-flex items-center gap-2">
                      {e.tipo === 'pedido' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-blue-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                      )}
                      Pedido: {e.nroPedido || '-'}
                    </span>
                    {e.nroNF && (
                      <span className="text-xs text-slate-500 flex items-center gap-1.5 ml-0.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                        NF: {e.nroNF}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-700 font-medium line-clamp-2 max-w-[250px]">{e.destinatario || '-'}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {e.data ? fmtBR.format(new Date(e.data)) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                  {fmtBRL.format(e.vlrTotal || 0)}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/dashboard/entregas?pedido=${e.nroPedido || ''}&nf=${e.nroNF || ''}`}>
                    <Button variant="secondary" size="sm" className="bg-white hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm outline-none">
                      Rastrear Entrega
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-slate-50/80 px-6 py-3 border-t border-slate-200">
        <span className="text-xs text-slate-500">
          Exibindo até 20 resultados mais relevantes baseados na busca.
        </span>
      </div>
    </Card>
  );
}
