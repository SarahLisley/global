import type { FastifyInstance } from 'fastify';
import { extractCodcli, handleAuthError } from '../utils/auth';
import path from 'path';
import fs from 'fs';

const AVATARS_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');

// Garante que o diretório existe
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

export default async function avatarRoutes(app: FastifyInstance) {

  // POST /upload — recebe imagem multipart e salva em disco
  app.post('/upload', async (req, reply) => {
    try {
      const { codcli } = extractCodcli(req);

      const data = await (req as any).file();
      if (!data) {
        return reply.code(400).send({ error: 'Nenhum arquivo enviado' });
      }

      // Validar tipo
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowed.includes(data.mimetype)) {
        return reply.code(400).send({ error: 'Tipo de arquivo não suportado. Use JPG, PNG, WebP ou GIF.' });
      }

      // Ler o arquivo em buffer
      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Validar tamanho (2MB max)
      if (buffer.length > 2 * 1024 * 1024) {
        return reply.code(400).send({ error: 'Arquivo muito grande. Máximo 2MB.' });
      }

      // Determinar extensão
      const ext = data.mimetype.split('/')[1] === 'jpeg' ? 'jpg' : data.mimetype.split('/')[1];
      const filename = `${codcli}.${ext}`;
      const filepath = path.join(AVATARS_DIR, filename);

      // Remover avatar antigo (pode ter extensão diferente)
      const existing = fs.readdirSync(AVATARS_DIR).filter(f => f.startsWith(`${codcli}.`));
      existing.forEach(f => {
        try { fs.unlinkSync(path.join(AVATARS_DIR, f)); } catch { /* ignore */ }
      });

      // Salvar
      fs.writeFileSync(filepath, buffer);

      return reply.send({
        ok: true,
        url: `/avatar/${codcli}`,
        filename,
      });
    } catch (err: any) {
      return handleAuthError(err, reply);
    }
  });

  // GET /:codcli — serve a imagem do avatar
  app.get('/:codcli', async (req, reply) => {
    const { codcli } = req.params as { codcli: string };

    // Procurar arquivo com qualquer extensão
    const files = fs.readdirSync(AVATARS_DIR).filter(f => f.startsWith(`${codcli}.`));

    if (files.length === 0) {
      return reply.code(404).send({ error: 'Avatar não encontrado' });
    }

    const filepath = path.join(AVATARS_DIR, files[0]);
    const ext = path.extname(files[0]).slice(1);
    const mimeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    };

    const stream = fs.createReadStream(filepath);
    return reply
      .header('Content-Type', mimeMap[ext] || 'application/octet-stream')
      .header('Cache-Control', 'public, max-age=3600')
      .send(stream);
  });
}
