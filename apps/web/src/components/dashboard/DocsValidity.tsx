import { Badge, Card } from '@pgb/ui';

type Doc = {
  description: string;
  dueDate: string;
  docNumber: string;
  status: 'valido' | 'vencido' | 'proximo_vencer';
};

export function DocsValidity({ docs }: { docs: Doc[] }) {
  const badge = (s: Doc['status']) => {
    if (s === 'valido') return <Badge variant="success">Válido</Badge>;
    if (s === 'proximo_vencer') return <Badge variant="warning">Próx. vencimento</Badge>;
    return <Badge variant="danger">Vencido</Badge>;
  };

  const icon = (s: Doc['status']) => {
    if (s === 'valido') return (
      <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" className="text-emerald-500" />
      </svg>
    );
    if (s === 'proximo_vencer') return (
      <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" className="text-yellow-500" />
        <line x1="12" y1="8" x2="12" y2="12" className="text-yellow-500" />
        <line x1="12" y1="16" x2="12.01" y2="16" className="text-yellow-500" />
      </svg>
    );
    return (
      <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" className="text-red-500" />
        <line x1="15" y1="9" x2="9" y2="15" className="text-red-500" />
        <line x1="9" y1="9" x2="15" y2="15" className="text-red-500" />
      </svg>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header Responsivo */}
      <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex-shrink-0">
            <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" className="text-orange-600" />
              <polyline points="14 2 14 8 20 8" className="text-orange-600" />
              <line x1="16" y1="13" x2="8" y2="13" className="text-orange-600" />
              <line x1="16" y1="17" x2="8" y2="17" className="text-orange-600" />
              <polyline points="10 9 9 9 8 9" className="text-orange-600" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Validade de Documentos</h2>
            <p className="text-xs sm:text-sm text-gray-500 truncate">Fique atento aos prazos</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {docs.map((d) => (
            <div key={d.description} className="p-3 sm:p-4 rounded-xl border border-gray-200 hover:border-[#4a90e2] hover:shadow-md transition-all group">
              {/* Layout em coluna no mobile, grid no desktop */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 self-start">
                  {icon(d.status)}
                </div>

                {/* Grid responsivo */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="sm:col-span-1">
                    <div className="text-[10px] sm:text-xs font-medium text-gray-500 mb-0.5 sm:mb-1 uppercase tracking-wide">Descrição</div>
                    <a className="text-xs sm:text-sm font-semibold text-[#4a90e2] hover:text-[#2563eb] hover:underline cursor-pointer break-words">
                      {d.description}
                    </a>
                  </div>

                  <div>
                    <div className="text-[10px] sm:text-xs font-medium text-gray-500 mb-0.5 sm:mb-1 uppercase tracking-wide">Dt. Validade</div>
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">
                      {(() => {
                        const date = new Date(d.dueDate);
                        return isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(date);
                      })()}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] sm:text-xs font-medium text-gray-500 mb-0.5 sm:mb-1 uppercase tracking-wide">Nro Documento</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-700 break-all">{d.docNumber}</div>
                  </div>

                  <div>
                    <div className="text-[10px] sm:text-xs font-medium text-gray-500 mb-0.5 sm:mb-1 uppercase tracking-wide">Status</div>
                    <div>{badge(d.status)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}