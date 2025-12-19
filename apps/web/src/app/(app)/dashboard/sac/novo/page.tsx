'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, FormField, Input } from '@pgb/ui';
import { createTicketAction } from '../actions';

export default function NovoTicketPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const today = new Date().toISOString().slice(0,10);

  const onSubmit = () => {
    if (!subject.trim()) {
      alert('Por favor, preencha o assunto do ticket');
      return;
    }
    
    startTransition(async () => {
      const res = await createTicketAction({ subject, orderNumber, invoiceNumber });
      if (res.ok) {
        setErrorMessage('');
        router.push('/dashboard/sac');
      } else {
        setErrorMessage(res.message ?? 'Falha ao salvar o ticket');
      }
    });

    console.log('[novo] submit', { subject, orderNumber, invoiceNumber });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Controle de Relacionamento com Cliente</h1>
      </div>

      <Card className="p-4 sm:p-5 lg:p-6">
        <div className="space-y-4 sm:space-y-5">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4 text-red-700 text-sm sm:text-base">
              {errorMessage}
            </div>
          )}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg width="20" height="20" className="sm:w-6 sm:h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Novo Ticket</h2>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <FormField label="Nro Ticket" htmlFor="ticketNumber">
              <Input 
                id="ticketNumber"
                value="—" 
                disabled 
                className="bg-gray-50 text-sm sm:text-base"
              />
            </FormField>

            <FormField label="Assunto" htmlFor="subject">
              <textarea
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Descreva detalhadamente o problema..."
                className="input-pill w-full min-h-24 sm:min-h-32 text-sm sm:text-base resize-y"
                required
              />
            </FormField>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
              <FormField label="Dt Abertura" htmlFor="openDate">
                <Input 
                  id="openDate"
                  value={new Date(today).toLocaleDateString('pt-BR')} 
                  disabled 
                  className="bg-gray-50 text-sm sm:text-base"
                />
              </FormField>
              <div className="hidden sm:block" />
            </div>

            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
              <FormField label="Nro do Pedido" htmlFor="orderNumber">
                <Input 
                  id="orderNumber"
                  value={orderNumber} 
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="Ex.: 15025165"
                  className="text-sm sm:text-base"
                />
              </FormField>
              <FormField label="Nro da Nota Fiscal" htmlFor="invoiceNumber">
                <Input 
                  id="invoiceNumber"
                  value={invoiceNumber} 
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ex.: NF-12345"
                  className="text-sm sm:text-base"
                />
              </FormField>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <label className="font-medium text-sm sm:text-base text-slate-700">
                  Enviar Imagem
                </label>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <label className="flex-1">
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*"
                    onChange={(e) => setFiles(e.target.files)}
                    className="block w-full text-xs sm:text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </label>
                {files && files.length > 0 && (
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={() => setFiles(null)}
                    className="w-full sm:w-auto text-sm"
                  >
                    Limpar
                  </Button>
                )}
              </div>

              {files && files.length > 0 && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    {files.length} {files.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}:
                  </p>
                  <ul className="space-y-1">
                    {Array.from(files).map((f, idx) => (
                      <li key={idx} className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                          <polyline points="13 2 13 9 20 9"/>
                        </svg>
                        <span className="truncate">{f.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={() => { console.log('[novo] submit', { subject, orderNumber, invoiceNumber }); onSubmit(); }} 
              loading={isPending}
              disabled={!subject.trim()}
              className="w-full sm:w-auto"
            >
              Salvar Ticket
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}