import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});
export type User = z.infer<typeof UserSchema>;

export const SessionSchema = z.object({
  token: z.string(),
  user: UserSchema,
});
export type Session = z.infer<typeof SessionSchema>;

export const KPISchema = z.object({
  label: z.string(),
  value: z.number(),
  delta: z.number().optional(),
});
export type KPI = z.infer<typeof KPISchema>;

export const PatientSchema = z.object({
  id: z.string(),
  name: z.string(),
  lastVisit: z.string(),
  status: z.enum(['aguardando', 'em_andamento', 'finalizado']),
});
export type Patient = z.infer<typeof PatientSchema>;

export const DashboardDataSchema = z.object({
  kpis: z.array(KPISchema),
  recentPatients: z.array(PatientSchema),
});
export type DashboardData = z.infer<typeof DashboardDataSchema>;

export const TicketStatusEnum = z.enum(['pendente', 'em_andamento', 'finalizado']);
export type TicketStatus = z.infer<typeof TicketStatusEnum>;

export const TicketSchema = z.object({
  id: z.string(),
  openedAt: z.string(),       // ISO date
  closedAt: z.string().optional(),
  orderNumber: z.string().optional(),
  invoiceNumber: z.string().optional(),
  subject: z.string(),
  origin: z.string().optional(), 
  status: TicketStatusEnum,
});
export type Ticket = z.infer<typeof TicketSchema>;

export const OrderStatusEnum = z.enum(['faturado', 'bloqueado', 'liberado']);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const OrderSchema = z.object({
  orderNumber: z.string(),
  seller: z.string(),
  total: z.number(), 
  status: OrderStatusEnum,
});
export type Order = z.infer<typeof OrderSchema>;

export const DocStatusEnum = z.enum(['valido', 'vencido', 'proximo_vencer']);
export type DocStatus = z.infer<typeof DocStatusEnum>;

export const DocumentAlertSchema = z.object({
  description: z.string(),
  dueDate: z.string(),   
  docNumber: z.string(),
  status: DocStatusEnum,
});
export type DocumentAlert = z.infer<typeof DocumentAlertSchema>;