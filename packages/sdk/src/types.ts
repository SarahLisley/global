// Types shared between the API and the Web Client

export type SacSeriesData = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
    tension?: number;
  }>;
};

export type TicketListItem = {
  id: string;
  openedAt: string;
  closedAt?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  subject: string;
  status: 'em_andamento' | 'finalizado' | 'pendente';
};

export type DashboardSummary = {
  usuarios_total: number;
  usuarios_clientes: number;
  usuarios_outros: number;
  nf_total_hoje: number;
  nf_erros_hoje: number;
  nf_sucesso_hoje: number;
  nf_ultimos7d: number;
  atualizado_em: string;
};
