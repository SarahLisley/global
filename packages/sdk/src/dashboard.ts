
import { z } from 'zod';

export const DateFilterSchema = z.object({
  dtInicial: z.string().optional(), // YYYY-MM-DD
  dtFinal: z.string().optional(),   // YYYY-MM-DD
});

export const PaginationSchema = z.object({
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(10),
});

export const BaseFilterSchema = DateFilterSchema.merge(PaginationSchema).extend({
  codcli: z.number().optional(),
});

// Filtros específicos
export const OrdersFilterSchema = BaseFilterSchema.extend({
  pedido: z.union([z.string(), z.number()]).optional(),
  nf: z.union([z.string(), z.number()]).optional(),
});

export const FinanceiroFilterSchema = BaseFilterSchema.extend({
  status: z.enum(['aberto', 'pago', 'todos']).optional(),
  numped: z.union([z.string(), z.number()]).optional(),
  nf: z.union([z.string(), z.number()]).optional(),
});

// Tipos de Retorno (DTOs)
export const KpiSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  trend: z.number().optional(), // % de crescimento/queda
});

export type Kpi = z.infer<typeof KpiSchema>;
