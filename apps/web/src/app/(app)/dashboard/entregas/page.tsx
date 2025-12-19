'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, FormField, Input, Badge } from '@pgb/ui';

type Entrega = {
  id: string;
  nroPedido: string;
  filial: string;
  nroNF?: string;
  vlrTotal: number;
  prevEntrega?: string;
  dtAgendamento?: string;
  dtEntrega?: string;
  transportadora?: string;
  status?: string;
  rastreio?: string;
};

const fmtBR = new Intl.DateTimeFormat('pt-BR');
const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function EntregasPage() {
  const hoje = useMemo(() => new Date(), []);
  const trintaDiasAtras = useMemo(() => new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), []);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  const [dtInicial, setDtInicial] = useState(toISODate(trintaDiasAtras));
  const [dtFinal, setDtFinal] = useState(toISODate(hoje));
  const [pedidoNum, setPedidoNum] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');

  const [dados, setDados] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  const API_ROUTE = '/api/dashboard/entregas';

  async function fetchEntregas(nextPage = 1) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        dtInicial,
        dtFinal,
        page: String(nextPage),
        pageSize: String(pageSize),
      });

      if (pedidoNum.trim()) params.append('pedido', pedidoNum.trim());
      if (notaFiscal.trim()) params.append('nf', notaFiscal.trim());

      const res = await fetch(`${API_ROUTE}?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao carregar entregas');

      const data = await res.json();
      setDados(data.entregas || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Erro ao carregar entregas');
      setDados([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEntregas(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function onPesquisar() {
    fetchEntregas(1);
  }

  function onLimpar() {
    setDtInicial(toISODate(trintaDiasAtras));
    setDtFinal(toISODate(hoje));
    setPedidoNum('');
    setNotaFiscal('');
    fetchEntregas(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Controle de Relacionamento com Cliente</h1>
        <h2 className="text-xl font-semibold text-gray-800 mt-1">Entregas</h2>
      </div>

      {/* Filtros */}
      <Card className="p-5">
        <div className="text-sm text-slate-600 mb-4">Informe os dados para localizar suas entregas</div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Período */}
          <div>
            <div className="mb-3 font-medium text-slate-700">Período de Emissão</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Dt Inicial">
                <Input
                  type="date"
                  value={dtInicial}
                  onChange={(e) => setDtInicial(e.target.value)}
                />
              </FormField>
              <FormField label="Dt Final">
                <Input
                  type="date"
                  value={dtFinal}
                  onChange={(e) => setDtFinal(e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* Pedido / NF */}
          <div>
            <div className="mb-3 font-medium text-slate-700">Pedido / Nota Fiscal</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Pedido">
                <Input
                  placeholder="Número do pedido"
                  value={pedidoNum}
                  onChange={(e) => setPedidoNum(e.target.value)}
                />
              </FormField>
              <FormField label="Nota Fiscal">
                <Input
                  placeholder="Número da NF"
                  value={notaFiscal}
                  onChange={(e) => setNotaFiscal(e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" onClick={onPesquisar} loading={loading}>
            Pesquisar
          </Button>
          <Button type="button" variant="secondary" onClick={onLimpar}>
            Limpar Pesquisa
          </Button>
        </div>
      </Card>

      {/* Resultados */}
      <Card className="p-5">
        <div className="mb-4 font-medium text-slate-700">
          Agendamentos / Entregas Realizados {total > 0 && `(${total})`}
        </div>

        {error ? (
          <div className="py-8 text-center">
            <div className="text-red-600 mb-2">❌ Erro ao carregar entregas</div>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        ) : loading ? (
          <div className="py-8 text-center text-slate-500">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full mb-3" />
            <p>Carregando entregas...</p>
          </div>
        ) : dados.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            📦 Nenhuma entrega encontrada com os filtros aplicados
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 border-b">
                  <tr>
                    <th className="py-2 px-2">Nro Pedido</th>
                    <th className="py-2 px-2">Filial</th>
                    <th className="py-2 px-2">Nro NF</th>
                    <th className="py-2 px-2">Vlr. Total</th>
                    <th className="py-2 px-2">Prev. Entrega</th>
                    <th className="py-2 px-2">Dt Agendamento</th>
                    <th className="py-2 px-2">Dt Entrega</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Transportadora</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.map((e) => (
                    <tr key={e.id} className="border-t hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium">{e.nroPedido}</td>
                      <td className="py-2 px-2">{e.filial}</td>
                      <td className="py-2 px-2">{e.nroNF || '-'}</td>
                      <td className="py-2 px-2 font-semibold">{fmtBRL.format(e.vlrTotal)}</td>
                      <td className="py-2 px-2">
                        {e.prevEntrega ? fmtBR.format(new Date(e.prevEntrega)) : '-'}
                      </td>
                      <td className="py-2 px-2">
                        {e.dtAgendamento ? fmtBR.format(new Date(e.dtAgendamento)) : '-'}
                      </td>
                      <td className="py-2 px-2">
                        {e.dtEntrega ? (
                          <span className="text-green-600 font-medium">
                            {fmtBR.format(new Date(e.dtEntrega))}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {e.status === 'Entregue' ? (
                          <Badge variant="success">Entregue</Badge>
                        ) : e.status === 'Em trânsito' ? (
                          <Badge variant="info">Em trânsito</Badge>
                        ) : e.status === 'Aguardando coleta' ? (
                          <Badge variant="warning">Aguardando</Badge>
                        ) : (
                          <Badge>Agendado</Badge>
                        )}
                      </td>
                      <td className="py-2 px-2">
                        {e.transportadora ? (
                          <div>
                            <div>{e.transportadora}</div>
                            {e.rastreio && (
                              <button
                                onClick={() => alert(`Código de rastreio:\n${e.rastreio}`)}
                                className="text-xs text-[#4a90e2] hover:underline mt-1"
                              >
                                🔍 Rastrear
                              </button>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
              <div className="text-sm text-slate-700">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => fetchEntregas(1)}
                >
                  {'<<'}
                </button>
                <button
                  className="px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => fetchEntregas(page - 1)}
                >
                  {'<'}
                </button>
                <button
                  className="px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => fetchEntregas(page + 1)}
                >
                  {'>'}
                </button>
                <button
                  className="px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => fetchEntregas(totalPages)}
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