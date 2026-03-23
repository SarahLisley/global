import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signToken } from '../utils/token';

// Mock env para testes
vi.mock('../utils/env', () => ({
  env: { JWT_SECRET: 'test-secret-for-auth' },
  OWNER: 'TEST_OWNER',
}));

import { extractCodcli, handleAuthError } from '../utils/auth';

const SECRET = 'test-secret-for-auth';

function createRequest(token?: string): any {
  return {
    headers: {
      authorization: token ? `Bearer ${token}` : undefined,
    },
  };
}

describe('extractCodcli', () => {
  it('deve extrair codcli de um token válido', () => {
    const token = signToken({ sub: 'user@test.com', codcli: 42, name: 'Test' }, SECRET, 3600);
    const req = createRequest(token);
    const result = extractCodcli(req);
    expect(result.codcli).toBe(42);
    expect(result.payload.sub).toBe('user@test.com');
  });

  it('deve lançar erro quando não há header Authorization', () => {
    const req = createRequest();
    expect(() => extractCodcli(req)).toThrow();
    try {
      extractCodcli(req);
    } catch (err: any) {
      expect(err.status).toBe(401);
      expect(err.error).toBe('Token ausente');
    }
  });

  it('deve lançar erro quando token é inválido', () => {
    const req = createRequest('token-invalido');
    expect(() => extractCodcli(req)).toThrow();
    try {
      extractCodcli(req);
    } catch (err: any) {
      expect(err.status).toBe(401);
    }
  });

  it('deve lançar erro quando codcli é inválido (0 ou ausente)', () => {
    const token = signToken({ sub: 'user@test.com', codcli: 0 }, SECRET, 3600);
    const req = createRequest(token);
    expect(() => extractCodcli(req)).toThrow();
    try {
      extractCodcli(req);
    } catch (err: any) {
      expect(err.status).toBe(400);
      expect(err.error).toContain('CODCLI');
    }
  });

  it('deve lançar erro quando token está expirado', () => {
    const token = signToken({ sub: 'user@test.com', codcli: 42 }, SECRET, -10);
    const req = createRequest(token);
    expect(() => extractCodcli(req)).toThrow();
    try {
      extractCodcli(req);
    } catch (err: any) {
      expect(err.status).toBe(401);
    }
  });
});

describe('handleAuthError', () => {
  it('deve retornar status e error do objeto de erro de auth', () => {
    const reply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    const err = { status: 401, error: 'Token ausente' };
    handleAuthError(err, reply);
    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Token ausente' });
  });

  it('deve retornar 500 para erros genéricos', () => {
    const reply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    const err = new Error('Algo deu errado');
    handleAuthError(err, reply);
    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({ error: 'Algo deu errado' });
  });
});
