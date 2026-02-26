import { select } from '../db/query';
import { OWNER } from '../utils/env';

export async function searchGlobal(query: string, codcli: number) {
  const searchTerm = `%${query.toLowerCase()}%`;

  // Busca em PCNFSAID (Notas/Pedidos)
  const results = await select<any>(
    `
    SELECT
      N.NUMTRANSVENDA AS id,
      N.NUMPED AS nroPedido,
      N.NUMNOTA AS nroNF,
      N.VLTOTAL AS vlrTotal,
      N.DTFAT AS data,
      C.CLIENTE AS destinatario,
      'pedido' AS tipo
    FROM ${OWNER}.PCNFSAID N
    JOIN ${OWNER}.PCCLIENT C ON C.CODCLI = N.CODCLI
    WHERE N.CODCLI = :CODCLI
      AND (
        TO_CHAR(N.NUMPED) LIKE :SEARCH
        OR TO_CHAR(N.NUMNOTA) LIKE :SEARCH
        OR LOWER(C.CLIENTE) LIKE :SEARCH
      )
    FETCH FIRST 20 ROWS ONLY
    `,
    { CODCLI: codcli, SEARCH: searchTerm }
  );

  return results.map(r => ({
    id: r.ID,
    nroPedido: r.NROPEDIDO,
    nroNF: r.NRONF,
    vlrTotal: r.VLRTOTAL,
    data: r.DATA,
    destinatario: r.DESTINATARIO,
    tipo: r.TIPO
  }));
}
