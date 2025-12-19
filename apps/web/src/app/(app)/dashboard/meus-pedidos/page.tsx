'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, FormField, Input } from '@pgb/ui';

type Item = {
  codProduto: string;
  descricao: string;
  qtd: number;
  qtdFalta: number;
  pvUnit: number;
  pvTotal: number;
};

type Pedido = {
  id: string;
  nroPedido: string;
  nroNF?: string;
  nroTransVenda?: string;
  posicao?: string;
  data: string;
  filial?: string;
  codCliente?: string;
  vendedor?: string;
  vlrTotal?: number;
  vlrDesconto?: number;
  vlrFrete?: number;
  nroItens?: number;
  itens?: Item[];
};

const fmtBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function MeusPedidosPage() {
  const hoje = useMemo(() => new Date(), []);
  const trintaDiasAtras = useMemo(() => new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), []);
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  const [dtInicial, setDtInicial] = useState(toISODate(trintaDiasAtras));
  const [dtFinal, setDtFinal] = useState(toISODate(hoje));
  const [pedidoNum, setPedidoNum] = useState('');
  const [notaFiscal, setNotaFiscal] = useState('');

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  async function fetchPedidos(nextPage = 1) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        dtInicial,
        dtFinal,
        page: String(nextPage),
        pageSize: String(pageSize),
      });

      if (pedidoNum.trim()) {
        params.append('pedido', pedidoNum.trim());
      }

      if (notaFiscal.trim()) {
        params.append('nf', notaFiscal.trim());
      }

      const res = await fetch(`/api/meus-pedidos?${params.toString()}`);
      
      if (!res.ok) {
        throw new Error('Falha ao carregar pedidos');
      }
      
      const data = await res.json();
      setPedidos(data.pedidos || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Erro ao carregar pedidos');
      setPedidos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPedidos(1);
  }, []);

  function onPesquisar() {
    setOpen({});
    fetchPedidos(1);
  }

  function onLimpar() {
    setDtInicial(toISODate(trintaDiasAtras));
    setDtFinal(toISODate(hoje));
    setPedidoNum('');
    setNotaFiscal('');
    setOpen({});
    fetchPedidos(1);
  }

  function toggleRow(id: string) {
    setOpen((s) => ({ ...s, [id]: !s[id] }));
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Controle de Relacionamento com Cliente</h1>
        <h2 className="text-xl font-semibold text-gray-800 mt-1">Pedidos e Notas Fiscais - Cliente Cod.: 964</h2>
      </div>

      <Card className="p-5">
        <div className="text-sm text-slate-600 mb-4">Informe os dados para localizar seus pedidos</div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-3 font-medium text-slate-700">Período de Emissão dos Pedidos</div>
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
          Pedidos Localizados {total > 0 && `(${total})`}
        </div>

        {error ? (
          <div className="py-8 text-center">
            <div className="text-red-600 mb-2">❌ Erro ao carregar pedidos</div>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        ) : loading ? (
          <div className="py-8 text-center text-slate-500">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent rounded-full mb-3" />
            <p>Carregando pedidos...</p>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            📦 Nenhum pedido encontrado com os filtros aplicados
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 border-b">
                  <tr>
                    <th className="py-2 px-2">Nro Pedido</th>
                    <th className="py-2 px-2">Nro NF</th>
                    <th className="py-2 px-2">Nro Trans. Venda</th>
                    <th className="py-2 px-2">Posição</th>
                    <th className="py-2 px-2">Data</th>
                    <th className="py-2 px-2">Filial</th>
                    <th className="py-2 px-2">Cod.Cliente</th>
                    <th className="py-2 px-2">Vendedor</th>
                    <th className="py-2 px-2">Vlr. Total</th>
                    <th className="py-2 px-2">Vlr. Desconto</th>
                    <th className="py-2 px-2">Vlr. Frete</th>
                    <th className="py-2 px-2">Nro Itens</th>
                    <th className="py-2 px-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((p) => (
                    <React.Fragment key={p.id}>
                      <tr className="border-t hover:bg-slate-50">
                        <td className="py-2 px-2 font-medium">{p.nroPedido}</td>
                        <td className="py-2 px-2">{p.nroNF || '-'}</td>
                        <td className="py-2 px-2">{p.nroTransVenda || '-'}</td>
                        <td className="py-2 px-2">{p.posicao || '-'}</td>
                        <td className="py-2 px-2">{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                        <td className="py-2 px-2">{p.filial || '-'}</td>
                        <td className="py-2 px-2">{p.codCliente || '-'}</td>
                        <td className="py-2 px-2">{p.vendedor || '-'}</td>
                        <td className="py-2 px-2 font-semibold">{fmtBRL.format(p.vlrTotal ?? 0)}</td>
                        <td className="py-2 px-2">{fmtBRL.format(p.vlrDesconto ?? 0)}</td>
                        <td className="py-2 px-2">{fmtBRL.format(p.vlrFrete ?? 0)}</td>
                        <td className="py-2 px-2">{p.nroItens ?? p.itens?.length ?? 0}</td>
                        <td className="py-2 px-2">
                          <button
                            className="px-3 py-1.5 text-sm bg-[#4a90e2] text-white rounded hover:bg-[#357abd] transition"
                            onClick={() => toggleRow(p.id)}
                          >
                            {open[p.id] ? 'Fechar' : 'Ver Itens'}
                          </button>
                        </td>
                      </tr>

                      {open[p.id] && p.itens && p.itens.length > 0 && (
                        <tr className="bg-slate-50">
                          <td colSpan={13} className="p-4">
                            <div className="overflow-x-auto">
                              <table className="min-w-full text-sm">
                                <thead>
                                  <tr className="bg-slate-100">
                                    <th className="px-3 py-2 text-left">Cod.Produto</th>
                                    <th className="px-3 py-2 text-left">Descrição</th>
                                    <th className="px-3 py-2 text-left">Qtd</th>
                                    <th className="px-3 py-2 text-left">Qtd Falta</th>
                                    <th className="px-3 py-2 text-left">P.Venda Unit.</th>
                                    <th className="px-3 py-2 text-left">P.Venda Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {p.itens.map((it, idx) => (
                                    <tr key={idx} className="border-t">
                                      <td className="px-3 py-2">{it.codProduto}</td>
                                      <td className="px-3 py-2">{it.descricao}</td>
                                      <td className="px-3 py-2">{it.qtd}</td>
                                      <td className="px-3 py-2">{it.qtdFalta}</td>
                                      <td className="px-3 py-2">{fmtBRL.format(it.pvUnit)}</td>
                                      <td className="px-3 py-2">{fmtBRL.format(it.pvTotal)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t">
              <div className="text-sm text-slate-700">
                Página {page} de {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page <= 1}
                  onClick={() => fetchPedidos(1)}
                >
                  {'<<'}
                </button>
                <button
                  className="px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page <= 1}
                  onClick={() => fetchPedidos(page - 1)}
                >
                  {'<'}
                </button>
                <button
                  className="px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page >= totalPages}
                  onClick={() => fetchPedidos(page + 1)}
                >
                  {'>'}
                </button>
                <button
                  className="px-3 py-1.5 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page >= totalPages}
                  onClick={() => fetchPedidos(totalPages)}
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