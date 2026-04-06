import { select } from '../db/query';
import { OWNER } from '../utils/env';

type SearchResultRow = {
  ID: number;
  NROPEDIDO?: number | null;
  NRONF?: number | null;
  VLRTOTAL?: number | null;
  DATA?: Date | string | null;
  DESTINATARIO?: string | null;
  TIPO: string;
};

function mapSearchResults(rows: SearchResultRow[]) {
  return rows.map((row) => ({
    id: row.ID,
    nroPedido: row.NROPEDIDO,
    nroNF: row.NRONF,
    vlrTotal: row.VLRTOTAL,
    data: row.DATA,
    destinatario: row.DESTINATARIO,
    tipo: row.TIPO,
  }));
}

export async function searchGlobal(query: string, codcli: number | null, tipo?: string | null) {
  const isAdmin = tipo === 'A';
  if (!codcli && !isAdmin) return [];
  const normalizedQuery = query.trim().toLowerCase();
  const isNumericQuery = /^\d+$/.test(normalizedQuery);

  if (isNumericQuery) {
    const searchNumber = Number(normalizedQuery);
    const exactMatches = await select<SearchResultRow>(
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
      WHERE ${codcli ? 'N.CODCLI = :CODCLI' : '1=1'}
        AND (
          N.NUMTRANSVENDA = :SEARCH_NUMBER
          OR N.NUMPED = :SEARCH_NUMBER
          OR N.NUMNOTA = :SEARCH_NUMBER
        )
      ORDER BY
        CASE
          WHEN N.NUMPED = :SEARCH_NUMBER THEN 0
          WHEN N.NUMNOTA = :SEARCH_NUMBER THEN 1
          ELSE 2
        END,
        N.DTFAT DESC
      FETCH FIRST 20 ROWS ONLY
      `,
      codcli ? { CODCLI: codcli, SEARCH_NUMBER: searchNumber } : { SEARCH_NUMBER: searchNumber }
    );

    if (exactMatches.length > 0) {
      return mapSearchResults(exactMatches);
    }
  }

  const searchTerm = `%${normalizedQuery}%`;
  const results = await select<SearchResultRow>(
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
    WHERE ${codcli ? 'N.CODCLI = :CODCLI' : '1=1'}
      AND (
        TO_CHAR(N.NUMTRANSVENDA) LIKE :SEARCH
        OR TO_CHAR(N.NUMPED) LIKE :SEARCH
        OR TO_CHAR(N.NUMNOTA) LIKE :SEARCH
        OR LOWER(C.CLIENTE) LIKE :SEARCH
      )
    FETCH FIRST 20 ROWS ONLY
    `,
    codcli ? { CODCLI: codcli, SEARCH: searchTerm } : { SEARCH: searchTerm }
  );

  return mapSearchResults(results);
}
