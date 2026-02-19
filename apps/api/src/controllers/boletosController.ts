import fs from 'fs';
import path from 'path';
import { select } from '../db/query';
import { OWNER } from '../utils/env';

export async function downloadBoleto(params: {
  codcli: number;
  id: string; // Format: NUMTRANSVENDA-PREST
}) {
  // 1. Parse ID
  const [numTransVenda, prest] = params.id.split('-');
  if (!numTransVenda || !prest) {
    throw new Error('ID inválido. Formato esperado: NUMTRANSVENDA-PREST');
  }

  // 2. Query file path from DB
  const rows = await select<any>(
    `SELECT PASTAARQUIVOBOLETO, NOMEARQUIVO 
     FROM ${OWNER}.PCPREST 
     WHERE NUMTRANSVENDA = :NUMTRANSVENDA 
       AND PREST = :PREST 
       AND CODCLI = :CODCLI`,
    {
      NUMTRANSVENDA: Number(numTransVenda),
      PREST: Number(prest),
      CODCLI: params.codcli
    }
  );

  if (rows.length === 0) {
    throw new Error('Boleto não encontrado ou não pertence a este cliente.');
  }

  const { PASTAARQUIVOBOLETO, NOMEARQUIVO } = rows[0];

  if (!PASTAARQUIVOBOLETO || !NOMEARQUIVO) {
    throw new Error('Caminho do arquivo não registrado no banco.');
  }

  // 3. Construct full path
  // Handle potential backslashes/forward slashes mix
  // Assuming PASTAARQUIVOBOLETO is like 'F:\WINTHOR\...' and NOMEARQUIVO is 'BOLETO.PDF'

  // We clean up the path to be safe
  const cleanDir = path.normalize(PASTAARQUIVOBOLETO);
  const cleanFile = path.normalize(NOMEARQUIVO);
  const fullPath = path.join(cleanDir, cleanFile);

  console.log(`[DOWNLOAD BOLETO] Tentando ler arquivo: ${fullPath}`);

  // 4. Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.error(`[DOWNLOAD BOLETO] Arquivo não encontrado em disco: ${fullPath}`);
    throw new Error('Arquivo do boleto não encontrado no servidor.');
  }

  // 5. Read file stream
  const fileStream = fs.createReadStream(fullPath);
  const stat = fs.statSync(fullPath);
  const ext = path.extname(cleanFile).toLowerCase();
  const mimeType = ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';

  return {
    stream: fileStream,
    filename: cleanFile,
    size: stat.size,
    mimeType
  };
}
