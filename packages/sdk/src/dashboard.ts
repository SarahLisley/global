import { DashboardDataSchema, DocumentAlertSchema, OrderSchema, type DocumentAlert, type Order } from './types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getMetrics() {
  await wait(400);
  return DashboardDataSchema.shape.kpis.parse([
    { label: 'Atendimentos Hoje', value: 42, delta: 5.2 },
    { label: 'Pacientes Ativos', value: 318 },
    { label: 'Taxa Ocupação', value: 76.4 },
    { label: 'Tempo Médio (min)', value: 18.5 },
  ]);
}

export async function getRecentPatients() {
  await wait(300);
  return DashboardDataSchema.shape.recentPatients.parse([
    { id: 'p_1', name: 'Maria Souza', lastVisit: '2025-10-10', status: 'finalizado' },
    { id: 'p_2', name: 'João Lima', lastVisit: '2025-10-12', status: 'aguardando' },
    { id: 'p_3', name: 'Ana Rita', lastVisit: '2025-10-12', status: 'em_andamento' },
  ]);
}

export async function getSACSeries() {
  await wait(300);
  const labels = ['00:00','01:00','02:00','03:00','04:00','05:00','06:00','07:00'];
  return {
    labels,
    datasets: [
      { label: 'Resolvidos', data: [28, 35, 40, 30, 45, 40, 80, 55], borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.15)', tension: 0.4, fill: true },
      { label: 'Em andamento', data: [10, 22, 35, 44, 32, 34, 50, 38], borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.15)', tension: 0.4, fill: true },
      { label: 'Pendentes', data: [15, 10, 10, 28, 18, 12, 20, 8], borderColor: '#F97316', backgroundColor: 'rgba(249,115,22,0.15)', tension: 0.4, fill: true },
    ],
  };
}

// Pedidos recentes (últimos 30 dias)
export async function getRecentOrders(): Promise<Order[]> {
  await wait(350);
  const seller = 'LÍVIA SANTOS';
  const rows: Order[] = [
    { orderNumber: '15025231', seller, total: 13122.20, status: 'bloqueado' },
    { orderNumber: '15025165', seller, total: 12703.00, status: 'faturado' },
    { orderNumber: '15025152', seller, total: 22200.00, status: 'faturado' },
    { orderNumber: '15025056', seller, total: 1449.18,  status: 'liberado' },
    { orderNumber: '15024969', seller, total: 703.77,   status: 'faturado' },
    { orderNumber: '15024947', seller, total: 1430.00,  status: 'faturado' },
    { orderNumber: '15024934', seller, total: 759.01,   status: 'faturado' },
    { orderNumber: '15024883', seller, total: 12230.28, status: 'faturado' },
    { orderNumber: '15024856', seller, total: 2756.16,  status: 'faturado' },
    { orderNumber: '15024802', seller, total: 1680.00,  status: 'faturado' },
  ];
  return rows.map((r) => OrderSchema.parse(r));
}

// Alertas de validade de documentos
export async function getDocumentAlerts(): Promise<DocumentAlert[]> {
  await wait(200);
  const rows: DocumentAlert[] = [
    { description: 'ALVARÁ SANITÁRIO', dueDate: '12/11/2025', docNumber: 'Declaração VISA 182656', status: 'valido' },
    { description: 'CRT',              dueDate: '18/02/2026 17:33:31', docNumber: '1347',            status: 'valido' },
  ];
  return rows.map((r) => DocumentAlertSchema.parse(r));
}