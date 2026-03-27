import type { FastifyRequest } from 'fastify';
import path from 'path';
import fs from 'fs';
import { OWNER } from '../utils/env';

// ────────── Diretório de uploads ──────────

export const SAC_UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads', 'sac');

// Garante que o diretório existe
if (!fs.existsSync(SAC_UPLOADS_DIR)) {
  fs.mkdirSync(SAC_UPLOADS_DIR, { recursive: true });
}

// ────────── Validação de ID ──────────

/**
 * Extrai e valida o ID do ticket a partir de req.params.
 * Lança erro com status 400 se inválido.
 */
export function parseTicketId(req: FastifyRequest): number {
  const id = String((req.params as Record<string, string>)?.id ?? '').trim();
  if (!/^\d+$/.test(id)) {
    throw { status: 400, error: 'ID inválido' };
  }
  return Number(id);
}

// ────────── Normalização de status ──────────

export function normalizeStatus(status: unknown, dtFinaliza: unknown): 'pendente' | 'em_andamento' | 'finalizado' {
  if (dtFinaliza != null) return 'finalizado';
  const s = String(status ?? '').trim().toLowerCase();
  if (['em andamento', 'andamento', 'aguardando'].includes(s)) return 'em_andamento';
  if (['aberto', 'inicial'].includes(s)) return 'pendente';
  return 'em_andamento';
}

// ────────── Mapeamento de comentários ──────────

export interface CommentRow {
  ID: number;
  AUTOR: string;
  TIPO_AUTOR: string;
  TIPO_MSG: string;
  CONTEUDO: string | { toString(): string } | null;
  ANEXO_FILENAME: string | null;
  ANEXO_PATH: string | null;
  DTCRIACAO: string | Date;
  PUBLICO: string;
}

/** Mapeia uma linha de BRSACC_COMMENTS para o formato de resposta da API */
export function mapCommentRow(c: CommentRow) {
  let content = '';
  if (c.CONTEUDO) {
    if (typeof c.CONTEUDO === 'string') {
      content = c.CONTEUDO;
    } else if (typeof c.CONTEUDO === 'object' && c.CONTEUDO.toString) {
      content = c.CONTEUDO.toString();
    }
  }
  return {
    id: String(c.ID),
    author: String(c.AUTOR ?? 'Sistema'),
    authorType: c.TIPO_AUTOR === 'S' ? 'suporte' : (c.TIPO_AUTOR === 'W' ? 'winthor' : 'cliente'),
    type: (c.TIPO_MSG === 'N' ? 'note' : 'message') as 'note' | 'message',
    content,
    isPublic: c.PUBLICO === 'S',
    attachment: c.ANEXO_PATH
      ? {
        filename: c.ANEXO_FILENAME,
        url: `/sac/attachments/${c.ANEXO_PATH}`,
      }
      : undefined,
    createdAt: new Date(c.DTCRIACAO).toISOString(),
  };
}

// ────────── SQL reutilizável de comentários ──────────

export const COMMENTS_SELECT_SQL = `
  SELECT 
    ID,
    AUTOR,
    TIPO_AUTOR,
    TIPO_MSG,
    CONTEUDO,
    ANEXO_FILENAME,
    ANEXO_PATH,
    DTCRIACAO,
    NVL(PUBLICO, 'N') AS PUBLICO
  FROM ${OWNER}.BRSACC_COMMENTS 
  WHERE NUMTICKET = :NUMTICKET 
  ORDER BY DTCRIACAO ASC`;

// ────────── Verificação de propriedade do ticket ──────────

export const TICKET_OWNERSHIP_SQL = `
  SELECT 1 FROM ${OWNER}.BRSACC 
  WHERE NUMTICKET = :NUMTICKET 
    AND CODCLI = :CODCLI 
    AND NUMTICKET = NUMTICKETPRINC
    AND NVL(STATUS,'') <> 'Cancelado'`;

// ────────── Upload: extensões e MIME types ──────────

export const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.pdf', '.txt', '.csv',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.rar', '.7z',
]);

export const MIME_TYPES_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
};
