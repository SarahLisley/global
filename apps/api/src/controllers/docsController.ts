import { select } from '../db/query';
import { OWNER } from '../utils/env';

export type DocValidityDTO = {
  description: string;
  dueDate: string;
  docNumber: string;
  status: 'valido' | 'vencido' | 'proximo_vencer';
};

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

export async function getDocsValidity(params: { codcli: number }): Promise<DocValidityDTO[]> {
  const rows = await select<any>(
    `
    SELECT 
      v.DESCRICAO,
      cv.NUMDOC,
      cv.DTVALIDADE
    FROM ${OWNER}.PCTIPOCONTROLEVENDA v
    JOIN ${OWNER}.PCCLICONTROLEVENDA cv
      ON v.CODTIPOCONTROLEVENDA = cv.CODTIPOCONTROLEVENDA
    WHERE cv.CODCLI = :CODCLI
    ORDER BY cv.CODCLI
    `,
    { CODCLI: params.codcli }
  );

  return rows.map((r: any) => {
    const dt = r.DTVALIDADE ? new Date(r.DTVALIDADE) : new Date(NaN);
    const status = toStatus(dt, 7);
    return {
      description: String(r.DESCRICAO ?? '').trim(),
      dueDate: dt.toISOString(),
      docNumber: String(r.NUMDOC ?? '').trim(),
      status,
    };
  });
}