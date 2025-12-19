'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, FormField, Input, Badge } from '@pgb/ui';

type Status = 'all' | 'unpaid' | 'paid';

type Titulo = {
  id: string;
  codCliente: string;
  dtEmissao: string;
  nroDocto: string;
  parcela: string;
  valor: number;
  dtVencimento: string;
  cobranca: string;
  jurosTaxas: number;
  dtPgto?: string;
  vlrPago?: number;
  boletoUrl?: string;
  numped?: string;
  notaFiscal?: string;
};

const fmtBR = new Intl.DateTimeFormat('pt-BR');
const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FinanceiroPage() {
  const hoje = useMemo(() => new Date(), []);
  const trintaDiasAtras = useMemo(() => new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), []);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  const [dtInicial, setDtInicial] = useState(toISODate(trintaDiasAtras));
  const [dtFinal, setDtFinal] = useState(toISODate(hoje));
  const [status, setStatus] = useState<Status>('all');
  const [numped, setNumped] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');

  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  async function fetchTitulos(nextPage = 1) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        dtInicial,
        dtFinal,
        status,
        page: String(nextPage),
        pageSize: String(pageSize),
      });
      
      if (numped.trim()) {
        params.append('numped', numped.trim());
      }
      
      if (notaFiscal.trim()) {
        params.append('nf', notaFiscal.trim());
      }

      const res = await fetch(`/api/financeiro?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error('Falha ao carregar títulos');
      }
      
      const data = await res.json();
      setTitulos(data.titulos || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Erro ao carregar títulos');
      setTitulos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTitulos(1);
  }, []);

  function onPesquisar() {
    fetchTitulos(1);
  }

  function onLimpar() {
    setDtInicial(toISODate(trintaDiasAtras));
    setDtFinal(toISODate(hoje));
    setStatus('all');
    setNumped('');
    setNotaFiscal('');
    fetchTitulos(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Controle de Relacionamento com Cliente</h1>
        <h2 className="text-xl font-semibold text-gray-800 mt-1">Financeiro</h2>
      </div>

      <Card className="p-5">
        <div className="text-sm text-slate-600 mb-4">Informe os dados para localizar seus títulos</div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-3 font-medium text-slate-700">Período de Vencimento dos Títulos</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Dt Inicial">
                <Input
                  type="date"
                  value={dtInicial}
                  onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setDtInicial(e.target.value)}
                />
              </FormField>
              <FormField label="Dt Final">
                <Input
                  type="date"
                  value={dtFinal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDtFinal(e.target.value)}
                />
              </FormField>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="status"
                  checked={status === 'all'}
                  onChange={() => setStatus('all')}
                />
                Todos
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="status"
                  checked={status === 'paid'}
                  onChange={() => setStatus('paid')}
                />
                Pagos
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="status"
                  checked={status === 'unpaid'}
                  onChange={() => setStatus('unpaid')}
                />
                Não Pagos
              </label>
            </div>
          </div>

          <div>
            <div className="mb-3 font-medium text-slate-700">Nro do Pedido ou da Nota Fiscal</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Numped">
                <Input
                  placeholder="Ex.: PED001234"
                  value={numped}
                  onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setNumped(e.target.value)}
                />
              </FormField>
              <FormField label="Nota Fiscal">
                <Input
                  placeholder="Ex.: NF-123456"
                  value={notaFiscal}
                  onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setNotaFiscal(e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" onClick={onPesquisar} loading={loading}>
            Pesquisar
          </Button>
          <Button type="button" variant="secondary" onClick={onLimpar}>
            Limpar Pesquisa
          </Button>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 font-medium text-slate-700">
          Títulos Localizados {total > 0 && `(${total})`}
        </div>

        {error ? (
          <div className="py-8 text-center">
            <div className="text-red-600 mb-2">❌ Erro ao carregar títulos</div>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        ) : loading ? (
          <div className="py-8 text-center text-slate-500">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full mb-3" />
            <p>Carregando títulos...</p>
          </div>
        ) : titulos.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            📄 Nenhum título encontrado com os filtros aplicados
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 border-b">
                  <tr>
                    <th className="py-2 px-2">Documento</th>
                    <th className="py-2 px-2">Parcela</th>
                    <th className="py-2 px-2">Emissão</th>
                    <th className="py-2 px-2">Vencimento</th>
                    <th className="py-2 px-2">Valor</th>
                    <th className="py-2 px-2">Cobrança</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {titulos.map((t) => {
                    const vencido = !t.dtPgto && new Date(t.dtVencimento) < new Date();
                    
                    return (
                      <tr key={t.id} className="border-t hover:bg-slate-50">
                        <td className="py-2 px-2">
                          <div className="font-medium">{t.nroDocto}</div>
                          {t.numped && <div className="text-xs text-slate-500">Pedido: {t.numped}</div>}
                          {t.notaFiscal && <div className="text-xs text-slate-500">NF: {t.notaFiscal}</div>}
                        </td>
                        <td className="py-2 px-2">{t.parcela}</td>
                        <td className="py-2 px-2">{fmtBR.format(new Date(t.dtEmissao))}</td>
                        <td className="py-2 px-2">
                          <div>{fmtBR.format(new Date(t.dtVencimento))}</div>
                          {vencido && !t.dtPgto && (
                            <div className="text-xs text-red-600 font-medium">Vencido</div>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <div className="font-semibold">{fmtBRL.format(t.valor)}</div>
                          {t.jurosTaxas > 0 && (
                            <div className="text-xs text-slate-500">
                              +{fmtBRL.format(t.jurosTaxas)} juros
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2">{t.cobranca}</td>
                        <td className="py-2 px-2">
                          {t.dtPgto ? (
                            <Badge variant="success">✓ Pago</Badge>
                          ) : vencido ? (
                            <Badge variant="danger">⚠ Vencido</Badge>
                          ) : (
                            <Badge variant="warning">⏳ Pendente</Badge>
                          )}
                          {t.dtPgto && (
                            <div className="text-xs text-slate-500 mt-1">
                              {fmtBR.format(new Date(t.dtPgto))}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {t.boletoUrl && !t.dtPgto && (
                            <a
                              href={t.boletoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#4a90e2] hover:underline text-sm"
                            >
                              📄 Ver Boleto
                            </a>
                          )}
                          {t.dtPgto && t.vlrPago && (
                            <div className="text-sm text-green-600 font-medium">
                              Pago: {fmtBRL.format(t.vlrPago)}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
              <div className="text-sm text-slate-700">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => fetchTitulos(1)}
                >
                  {'<<'}
                </button>
                <button
                  className="px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => fetchTitulos(page - 1)}
                >
                  {'<'}
                </button>
                <button
                  className="px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => fetchTitulos(page + 1)}
                >
                  {'>'}
                </button>
                <button
                  className="px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => fetchTitulos(totalPages)}
                >
                  {'>>'}
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}