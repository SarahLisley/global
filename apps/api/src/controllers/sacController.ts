import { getConnection } from '../db/pool';
import { safeLogBinds } from '../utils/log';
import { select } from '../db/query';
import { OWNER } from '../utils/env';
import { getOrSetCache } from '../utils/ttlCache';
import type { FastifyRequest } from 'fastify';

export type SACSeriesDTO = {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        borderColor: string;
        backgroundColor: string;
        tension?: number;
        fill?: boolean;
    }>;
};

function empty24(): number[] {
    return Array.from({ length: 24 }, () => 0);
}

export function hourIdx(d: any): number {
    const dt = new Date(d);
    const h = dt.getHours();
    return Math.max(0, Math.min(23, h));
}

export function classify(row: any): 'resolved' | 'in_progress' | 'pending' {
    const status = String(row.STATUS ?? '').trim().toLowerCase();
    const finalized = row.DTFINALIZA != null;
    if (finalized) return 'resolved';
    if (['em andamento', 'andamento', 'aguardando'].includes(status)) return 'in_progress';
    if (['aberto', 'inicial'].includes(status)) return 'pending';
    // fallback
    return 'in_progress';
}

export async function getSACSeries(params: { codcli?: number | null; tipo?: string | null }): Promise<SACSeriesDTO> {
  const isAdmin = params.tipo === 'A';
  if (!params.codcli && !isAdmin) {
    const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    return {
      labels,
      datasets: [
        { label: 'Resolvidos', data: Array(24).fill(0), borderColor: '#4a90e2', backgroundColor: 'rgba(74, 144, 226, 0.2)', tension: 0.3, fill: true },
        { label: 'Em andamento', data: Array(24).fill(0), borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', tension: 0.3, fill: true },
        { label: 'Pendentes', data: Array(24).fill(0), borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.15)', tension: 0.3, fill: true },
      ],
    };
  }
  return getOrSetCache(`sac:series:${params.codcli}`, 30_000, async () => {
    try {
        const rows = await select<any>(
            `
        SELECT
          BRSACC.DTABERTURA,
          BRSACC.DTFINALIZA,
          BRSACC.STATUS
        FROM ${OWNER}.BRSACC
        WHERE BRSACC.NUMTICKET = BRSACC.NUMTICKETPRINC
          AND NVL(BRSACC.STATUS,'') <> 'Cancelado'
          AND BRSACC.DTABERTURA >= TRUNC(SYSDATE)
          AND BRSACC.DTABERTURA < TRUNC(SYSDATE) + 1
          ${params.codcli ? 'AND BRSACC.CODCLI = :CODCLI' : ''}
        `,
            params.codcli ? { CODCLI: params.codcli } : {}
        );

        const resolved = empty24();
        const inProgress = empty24();
        const pending = empty24();

        for (const r of rows) {
            const idx = hourIdx(r.DTABERTURA);
            const cls = classify(r);
            if (cls === 'resolved') resolved[idx] += 1;
            else if (cls === 'in_progress') inProgress[idx] += 1;
            else pending[idx] += 1;
        }

        const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
        return {
            labels,
            datasets: [
                {
                    label: 'Resolvidos',
                    data: resolved,
                    borderColor: '#4a90e2',
                    backgroundColor: 'rgba(74, 144, 226, 0.2)',
                    tension: 0.3,
                    fill: true,
                },
                {
                    label: 'Em andamento',
                    data: inProgress,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    tension: 0.3,
                    fill: true,
                },
                {
                    label: 'Pendentes',
                    data: pending,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    tension: 0.3,
                    fill: true,
                },
            ],
        };
    } catch (err: any) {
        const msg = err.message || String(err);
        if (msg.includes('ORA-00903') || msg.includes('ORA-00942')) {
            const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
            return {
                labels,
                datasets: [
                    { label: 'Resolvidos', data: Array(24).fill(0), borderColor: '#4a90e2', backgroundColor: 'rgba(74, 144, 226, 0.2)', tension: 0.3, fill: true },
                    { label: 'Em andamento', data: Array(24).fill(0), borderColor: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', tension: 0.3, fill: true },
                    { label: 'Pendentes', data: Array(24).fill(0), borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.15)', tension: 0.3, fill: true },
                ],
            };
        }
        throw err;
    }
    });
}

// ---------- Criação de ticket (INSERT em BRSACC) ----------

async function tryNextvalSequence(conn: any, seqName: string): Promise<number | null> {
    try {
        const sql = `SELECT ${OWNER}.${seqName}.NEXTVAL AS VAL FROM DUAL`;
        const r = await conn.execute(sql);
        const val = (r?.rows?.[0] as any)?.VAL ?? (r?.rows?.[0] as any)?.[0];
        if (val != null) return Number(val);
    } catch (_) { /* sequência não existe */ }
    return null;
}

async function getNextTicketNumber(conn: any): Promise<number> {
    const candidates = ['SEQ_BRSACC', 'BRSACC_SEQ', 'SEQ_TICKET', 'SEQ_BRSACC_TICKET'];
    for (const s of candidates) {
        const v = await tryNextvalSequence(conn, s);
        if (v != null) return v;
    }
    const r = await conn.execute(`SELECT NVL(MAX(NUMTICKET),0) + 1 AS NX FROM ${OWNER}.BRSACC`);
    const nx = (r?.rows?.[0] as any)?.NX ?? (r?.rows?.[0] as any)?.[0] ?? 1;
    return Number(nx);
}

export type CreateTicketInput = {
    codcli: number;
    subject: string;
    orderNumber?: string | number;
    invoiceNumber?: string | number;
    codfilial?: string;
    tipo?: string | null;
};

export type CreateTicketResult = {
    numTicket: number;
    openDate: string;
    status: string;
};

export async function createTicket(input: CreateTicketInput): Promise<CreateTicketResult> {
    const conn = await getConnection();
    try {
        const numTicket = await getNextTicketNumber(conn);

        const toNumberOrNull = (val: string | number | undefined | null) => {
            if (val == null) return null;
            const s = String(val);
            const digits = s.replace(/\D+/g, '');
            if (!digits) return null;
            const n = Number(digits);
            return Number.isFinite(n) ? n : null;
        };

        const binds = {
            NUMTICKET: numTicket,
            CODCLI: Number(input.codcli),
            CODFILIAL: (input.codfilial ?? '1'),
            NUMPED: input.orderNumber ? Number(input.orderNumber) : null,
            NUMNOTA: input.invoiceNumber ? Number(input.invoiceNumber) : null,
            RELATOCLIENTE: String(input.subject ?? '').slice(0, 4000),
        };

        await conn.execute(
            `
            INSERT INTO ${OWNER}.BRSACC
                (NUMTICKET, NUMTICKETPRINC, NUMSEQ, DTABERTURA, CODFILIAL, CODCLI, NUMPED, NUMNOTA, RELATOCLIENTE, TIPO, STATUS)
            VALUES
                (:NUMTICKET, :NUMTICKET, 1, SYSDATE, :CODFILIAL, :CODCLI, :NUMPED, :NUMNOTA, :RELATOCLIENTE, 'I', 'Aberto')
            `,
            binds,
            { autoCommit: true } as any
        );

        const nowIso = new Date().toISOString();
        return { numTicket, openDate: nowIso, status: 'Aberto' };
    } finally {
        await conn.close();
    }
}

export async function searchTickets(req: FastifyRequest) {
    const q = req.query as any;
    const status = (q.status as string) || null;

    const binds = {
        date_from: q.date_from ?? null,
        date_to: q.date_to ?? null,
        numped: q.numped ?? null,
        numnota: q.numnota ?? null,
        codcli: q.codcli ?? null,
    };

    req.log.info({ binds: safeLogBinds(binds, { fields: ['codcli'] }) }, 'SAC search binds');

    // Mapeamento de status para filtro SQL
    // Se status for 'pendente' ou 'em_andamento', queremos tickets ABERTOS (sem data de finalização)
    // Se status for 'finalizado', queremos tickets FECHADOS (com data de finalização)
    const statusFilter = status
        ? (status === 'finalizado' ? "AND DTFINALIZA IS NOT NULL" : "AND DTFINALIZA IS NULL")
        : "";

    try {
        const rows = await select<any>(
            `
        SELECT /*+ FIRST_ROWS */ *
        FROM ${OWNER}.BRSACC
        WHERE NUMTICKET = NUMTICKETPRINC
          AND NVL(STATUS,'') <> 'Cancelado'
          AND (:date_from IS NULL OR TRUNC(DTABERTURA) >= TRUNC(TO_DATE(:date_from, 'YYYY-MM-DD')))
          AND (:date_to   IS NULL OR TRUNC(DTABERTURA) <= TRUNC(TO_DATE(:date_to, 'YYYY-MM-DD')))
          AND (:numped    IS NULL OR NUMPED = :numped)
          AND (:numnota   IS NULL OR NUMNOTA = :numnota)
          AND (:codcli    IS NULL OR CODCLI = :codcli)
          ${statusFilter}
        ORDER BY DTABERTURA DESC
        FETCH FIRST 200 ROWS ONLY
        `,
            binds
        );

        return rows;
    } catch (err: any) {
        const msg = err.message || String(err);
        if (msg.includes('ORA-00903') || msg.includes('ORA-00942')) {
            req.log.warn('Tabela BRSACC não encontrada. Retornando vazio para searchTickets.');
            return [];
        }
        throw err;
    }
}
