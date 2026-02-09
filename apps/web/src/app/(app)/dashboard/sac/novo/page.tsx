'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, FormField, Input } from '@pgb/ui';
import { createTicketAction } from '../actions';

export default function NovoTicketPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subject, setSubject] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [touched, setTouched] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched(true);

    if (!subject.trim()) {
      return;
    }

    startTransition(async () => {
      const res = await createTicketAction({ subject, orderNumber, invoiceNumber });
      if (res.ok) {
        setErrorMessage('');
        setSuccessMessage(true);
        // Delay redirect to show success message
        setTimeout(() => {
          router.push('/dashboard/sac');
        }, 1500);
      } else {
        setErrorMessage(res.message ?? 'Falha ao salvar o ticket');
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  };

  if (successMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ticket Criado com Sucesso!</h2>
        <p className="text-slate-500 text-center max-w-md">
          Sua solicitação foi registrada. Você será redirecionado para a lista de tickets em instantes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50 flex items-center justify-center transition-all group"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500 group-hover:text-slate-700 transition-colors">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Novo Ticket</h1>
            <p className="text-slate-500 mt-1">Abra uma nova solicitação para nossa equipe.</p>
          </div>
        </div>
        <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm capitalize hidden sm:block">
          {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <form onSubmit={onSubmit} className="divide-y divide-slate-100">
          <div className="p-3 space-y-3">
            {errorMessage && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-red-900">Erro ao criar ticket</h4>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {/* Section 1: Identificação */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-2 pb-1 border-b border-slate-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                  Identificação do Pedido
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-2 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <label htmlFor="orderNumber" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Número do Pedido *</label>
                    <input
                      id="orderNumber"
                      type="text"
                      placeholder="Ex.: 15025165"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      aria-required="true"
                      className="block w-full border-0 p-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm bg-transparent"
                    />
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <label htmlFor="invoiceNumber" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nota Fiscal *</label>
                    <input
                      id="invoiceNumber"
                      type="text"
                      placeholder="Ex.: NF-12345"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      aria-required="true"
                      className="block w-full border-0 p-0 text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none text-sm bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2 & 3: Descrição e Anexos lado a lado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Descrição */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-2 pb-1 border-b border-slate-100">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    Descrição *
                  </h3>

                  <textarea
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Descreva o problema..."
                    aria-required="true"
                    className={`w-full min-h-[80px] p-2 rounded-lg border bg-white text-sm shadow-sm transition-all outline-none resize-none focus:ring-4 focus:ring-blue-500/10 ${touched && !subject.trim()
                      ? 'border-red-300 focus:border-red-300'
                      : 'border-slate-200 focus:border-blue-400'
                      }`}
                    required
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center">
                    {touched && !subject.trim() && (
                      <p className="text-xs text-red-500 font-medium">Obrigatório</p>
                    )}
                    <p className="text-xs text-slate-400 text-right font-medium ml-auto">{subject.length}/500</p>
                  </div>
                </div>

                {/* Section 3: Anexos */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-2 pb-1 border-b border-slate-100">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    Anexos
                  </h3>

                  <div
                    className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-lg p-3 flex flex-col items-center justify-center text-center hover:bg-blue-50/30 hover:border-blue-300 transition-all cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-blue-500 flex items-center justify-center mb-1 group-hover:scale-110 group-hover:border-blue-300 transition-all shadow-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                    </div>
                    <p className="text-xs font-medium text-slate-700 group-hover:text-blue-700 transition-colors">Clique para enviar</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {files && files.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{files.length} arquivo(s) selecionado(s)</span>
                        <button type="button" onClick={() => setFiles(null)} className="text-sm text-red-600 hover:text-red-700 font-medium">Remover todos</button>
                      </div>
                      <ul className="divide-y divide-slate-100">
                        {Array.from(files).map((f, idx) => (
                          <li key={idx} className="px-4 py-3 flex items-center gap-3 text-sm text-slate-700">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                            <span className="truncate flex-1">{f.name}</span>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{(f.size / 1024).toFixed(0)} KB</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-slate-100/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
            <Button
              type="submit"
              loading={isPending}
              className="w-full sm:w-auto min-w-[160px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 font-semibold px-8 py-2.5 rounded-full outline-none focus:outline-none focus:ring-0"
            >
              Criar Ticket
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-300 font-medium px-8 py-2.5 rounded-full outline-none focus:outline-none focus:ring-0"
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div >
  );
}