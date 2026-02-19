export type Status = 'todos' | 'em_andamento' | 'finalizado';

export type Ticket = {
  id: string;
  openedAt: string;
  closedAt?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  subject: string;
  status: 'em_andamento' | 'finalizado';
};
