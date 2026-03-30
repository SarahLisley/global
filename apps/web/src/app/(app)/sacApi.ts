import { apiServer } from '../../lib/api';

export type SACDataset = {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  tension?: number;
  fill?: boolean;
};

export type SACSeries = { labels: string[]; datasets: SACDataset[] };

function emptySeries(reason?: string): SACSeries {
  const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
  const mk = (label: string, color: string, bg: string): SACDataset => ({
    label,
    data: Array.from({ length: 24 }, () => 0),
    borderColor: color,
    backgroundColor: bg,
    tension: 0.3,
    fill: true,
  });
  const ds = [
    mk('Resolvidos', '#4a90e2', 'rgba(74, 144, 226, 0.2)'),
    mk('Em andamento', '#22c55e', 'rgba(34, 197, 94, 0.15)'),
    mk('Pendentes', '#f59e0b', 'rgba(245, 158, 11, 0.15)'),
  ];
  if (reason) ds[0].label = `Resolvidos (${reason})`;
  return { labels, datasets: ds };
}

export async function fetchSacSeries(): Promise<SACSeries> {
  try {
    return await apiServer<SACSeries>('/sac/series');
  } catch (e: any) {
    const reason = e?.message === 'NOT_AUTHENTICATED' ? 'sem sessão' : (e?.message ?? 'erro inesperado');
    return emptySeries(reason);
  }
}