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

// Versão ultra rápida - apenas dados essenciais
export async function getDocsValidityFast(params: { codcli: number | null; tipo?: string | null }): Promise<DocValidityDTO[]> {
  const startTime = Date.now();
  console.log(`[docs-fast] Iniciando busca rápida para codcli=${params.codcli}`);
  
  const isAdmin = params.tipo === 'A';
  if (!params.codcli && !isAdmin) {
    console.log(`[docs-fast] Retorno vazio - sem acesso`);
    return [];
  }
  
  // Cache mais longo para performance máxima
  const cacheKey = `docs:fast:${params.codcli}:${params.tipo}`;
  
  return getOrSetCache(cacheKey, 900_000, async () => {
    const queryStart = Date.now();
    
    // Query simplificada - apenas campos essenciais
    const rows = await select<any>(
      `
      SELECT 
        cv.DTVALIDADE,
        cv.NUMDOC,
        v.DESCRICAO
      FROM ${OWNER}.PCCLICONTROLEVENDA cv
      JOIN ${OWNER}.PCTIPOCONTROLEVENDA v
        ON v.CODTIPOCONTROLEVENDA = cv.CODTIPOCONTROLEVENDA
      WHERE ${params.codcli ? 'cv.CODCLI = :CODCLI' : '1=1'}
        AND cv.DTVALIDADE IS NOT NULL
        AND cv.DTVALIDADE <= SYSDATE + 30 -- Apenas próximos 30 dias
      ORDER BY cv.DTVALIDADE ASC
      `,
      params.codcli ? { CODCLI: params.codcli } : {}
    );
    
    const queryTime = Date.now() - queryStart;
    console.log(`[docs-fast] Query rápida: ${queryTime}ms - ${rows.length} docs`);
    
    // Processamento otimizado
    const result = rows.map((r: any) => {
      const dt = new Date(r.DTVALIDADE);
      const status = toStatus(dt, 7);
      return {
        description: String(r.DESCRICAO ?? '').trim(),
        dueDate: dt.toISOString(),
        docNumber: String(r.NUMDOC ?? '').trim(),
        status,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      };
    });
    
    const totalTime = Date.now() - startTime;
    console.log(`[docs-fast] Tempo total: ${totalTime}ms`);
    
    return result;
  });
}
