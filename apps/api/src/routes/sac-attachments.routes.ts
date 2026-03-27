import type { FastifyInstance } from 'fastify';
import { extractCodcli, handleAuthError } from '../utils/auth';
import { parseTicketId, SAC_UPLOADS_DIR, ALLOWED_UPLOAD_EXTENSIONS, MIME_TYPES_MAP } from './sac-helpers';
import path from 'path';
import fs from 'fs';

export default async function sacAttachmentsRoutes(app: FastifyInstance) {

  // ────────── Upload de Anexo ──────────

  app.post('/tickets/:id/attachments', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);
      const numTicket = parseTicketId(req);

      const data = await (req as any).file();
      if (!data) return reply.status(400).send({ error: 'Nenhum arquivo enviado' });

      // Validar extensão do arquivo
      const ext = path.extname(data.filename).toLowerCase();
      if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
        return reply.status(400).send({
          error: `Tipo de arquivo não permitido (${ext}). Extensões aceitas: ${[...ALLOWED_UPLOAD_EXTENSIONS].join(', ')}`,
        });
      }

      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Max 5MB para SAC
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.status(400).send({ error: 'Arquivo muito grande. Máximo 5MB.' });
      }

      const random = Math.random().toString(36).substring(2, 8);
      const filenameOnDisk = `ticket_${numTicket}_${Date.now()}_${random}${ext}`;
      const filepath = path.join(SAC_UPLOADS_DIR, filenameOnDisk);

      // Escrita assíncrona (não bloqueia event loop)
      await fs.promises.writeFile(filepath, buffer);

      app.log.info({ numTicket, codcli, filename: data.filename, filenameOnDisk }, 'SAC attachment uploaded');

      return reply.send({
        ok: true,
        filename: data.filename,
        path: filenameOnDisk,
        url: `/sac/attachments/${filenameOnDisk}`,
      });
    } catch (err) {
      return handleAuthError(err, reply);
    }
  });

  // ────────── Servir Anexo ──────────

  app.get('/attachments/:filename', async (req, reply) => {
    try {
      const filename = (req.params as { filename: string }).filename;

      // Proteção contra path traversal
      const resolved = path.resolve(SAC_UPLOADS_DIR, filename);
      if (!resolved.startsWith(SAC_UPLOADS_DIR)) {
        return reply.status(400).send({ error: 'Caminho inválido' });
      }

      const ext = path.extname(filename).toLowerCase();
      const contentType = MIME_TYPES_MAP[ext] || 'application/octet-stream';

      // Usa try/catch direto no stream (sem race condition TOCTOU)
      try {
        const stream = fs.createReadStream(resolved);

        // Captura erro de arquivo inexistente antes de enviar
        await new Promise<void>((resolve, reject) => {
          stream.once('error', reject);
          stream.once('open', () => {
            stream.removeListener('error', reject);
            resolve();
          });
        });

        return reply
          .header('Content-Type', contentType)
          .header('Content-Disposition', `inline; filename="${filename}"`)
          .send(stream);
      } catch (fileErr: any) {
        if (fileErr.code === 'ENOENT') {
          return reply.status(404).send({ error: 'Arquivo não encontrado' });
        }
        throw fileErr;
      }
    } catch (err) {
      app.log.error({ err }, 'Error serving SAC attachment');
      return reply.status(500).send({ error: 'Erro ao ler arquivo' });
    }
  });
}
