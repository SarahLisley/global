import { TicketSchema, TicketStatusEnum, type Ticket } from './types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DATASET: Ticket[] = [
  { id: '369', openedAt: '2025-10-16', subject: 'Divergência de nota fiscal', orderNumber: '15025165', invoiceNumber: 'NF-12345', status: 'pendente' },
  { id: '368', openedAt: '2025-10-15', subject: 'Produto avariado', orderNumber: '15025152', invoiceNumber: 'NF-12312', status: 'em_andamento' },
  { id: '367', openedAt: '2025-10-12', closedAt: '2025-10-13', subject: 'Solicitação de 2ª via', orderNumber: '15025056', invoiceNumber: 'NF-12222', status: 'finalizado' },
];

export async function searchTickets(params: {
  dateFrom?: string; // yyyy-mm-dd
  dateTo?: string;   // yyyy-mm-dd
  status?: 'todos' | 'em_andamento' | 'finalizado';
  orderNumber?: string;
  invoiceNumber?: string;
}): Promise<Ticket[]> {
  await wait(300);

  let list = [...DATASET];

  if (params.dateFrom) {
    list = list.filter(t => t.openedAt >= params.dateFrom!);
  }
  if (params.dateTo) {
    list = list.filter(t => t.openedAt <= params.dateTo!);
  }
  if (params.status && params.status !== 'todos') {
    list = list.filter(t => t.status === params.status);
  }
  if (params.orderNumber && params.orderNumber.trim()) {
    list = list.filter(t => t.orderNumber?.includes(params.orderNumber!.trim()));
  }
  if (params.invoiceNumber && params.invoiceNumber.trim()) {
    list = list.filter(t => t.invoiceNumber?.includes(params.invoiceNumber!.trim()));
  }

  return list.map((t) => TicketSchema.parse(t));
}

export async function createTicket(data: {
  subject: string;
  orderNumber?: string;
  invoiceNumber?: string;
  files?: File[] | undefined;
}): Promise<Ticket> {
  await wait(500);
  const id = String(370 + Math.floor(Math.random() * 1000));
  const ticket: Ticket = {
    id,
    subject: data.subject,
    orderNumber: data.orderNumber,
    invoiceNumber: data.invoiceNumber,
    openedAt: new Date().toISOString().slice(0, 10),
    status: TicketStatusEnum.enum.pendente,
  };
  return TicketSchema.parse(ticket);
}