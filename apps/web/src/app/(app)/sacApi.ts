import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4001';

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
    const token = (await cookies()).get('pgb_session')?.value;
    if (!token) {
      return emptySeries('sem sessão');
    }
    const res = await fetch(`${API_BASE}/dashboard/sac/series`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return emptySeries(err?.error ? `erro API: ${err.error}` : `falha API (${res.status})`);
    }
    return res.json();
  } catch (e: any) {
    return emptySeries(e?.message ?? 'erro inesperado');
  }
}