import { select } from '../db/query';
import { OWNER } from '../utils/env';
import { getOrSetCache } from '../utils/ttlCache';

export type DocValidityDTO = {
  description: string;
  dueDate: string;
  docNumber: string;
  status: 'valido' | 'vencido' | 'proximo_vencer';
  url?: string;
};

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function toStatus(dt: Date, thresholdDays = 7): 'valido' | 'vencido' | 'proximo_vencer' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dt);
  due.setHours(0, 0, 0, 0);

  const threshold = new Date(today);
  threshold.setDate(threshold.getDate() + thresholdDays);

  if (isNaN(due.getTime())) return 'vencido';
  if (due < today) return 'vencido';
  if (due <= threshold) return 'proximo_vencer';
  return 'valido';
}

// Versão otimizada com query melhorada e cache mais longo
export async function getDocsValidityOptimized(params: { codcli: number | null; tipo?: string | null }): Promise<DocValidityDTO[]> {
  const isAdmin = params.tipo === 'A';
  if (!params.codcli && !isAdmin) return [];
  
  // Cache de 10 minutos para melhor performance
  return getOrSetCache(`docs:validity:opt:${params.codcli}:${params.tipo}`, 600_000, async () => {
    const rows = await select<any>(
      `
      SELECT /*+ INDEX(cv IDX_PCCLICONTROLEVENDA_CODCLI) */
        v.DESCRICAO,
        cv.NUMDOC,
        cv.DTVALIDADE,
        cv.CODCLI
      FROM ${OWNER}.PCTIPOCONTROLEVENDA v
      JOIN ${OWNER}.PCCLICONTROLEVENDA cv
        ON v.CODTIPOCONTROLEVENDA = cv.CODTIPOCONTROLEVENDA
      WHERE ${params.codcli ? 'cv.CODCLI = :CODCLI' : '1=1'}
        AND cv.DTVALIDADE IS NOT NULL
      ORDER BY 
        CASE 
          WHEN cv.DTVALIDADE < SYSDATE THEN 1
          WHEN cv.DTVALIDADE <= SYSDATE + 7 THEN 2
          ELSE 3
        END,
        cv.DTVALIDADE ASC
      `,
      params.codcli ? { CODCLI: params.codcli } : {}
    );

    // Processamento otimizado
    return rows.map((r: any) => {
      const dtRaw = r.DTVALIDADE;
      const dt = dtRaw ? new Date(dtRaw) : new Date(NaN);
      const status = toStatus(dt, 7);
      return {
        description: String(r.DESCRICAO ?? '').trim(),
        dueDate: toIsoDate(dtRaw),
        docNumber: String(r.NUMDOC ?? '').trim(),
        status,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      };
    });
  });
}

// Função legacy para compatibilidade
export async function getDocsValidity(params: { codcli: number | null; tipo?: string | null }): Promise<DocValidityDTO[]> {
  return getDocsValidityOptimized(params);
}
