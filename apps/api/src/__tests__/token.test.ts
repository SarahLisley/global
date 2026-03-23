import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '../utils/token';

const SECRET = 'test-secret-key-for-unit-tests';

describe('signToken', () => {
  it('deve gerar um JWT válido com 3 partes', () => {
    const token = signToken({ sub: 'user@test.com', codcli: 123 }, SECRET);
    expect(token.split('.')).toHaveLength(3);
  });

  it('deve incluir iat no payload', () => {
    const token = signToken({ sub: 'user@test.com' }, SECRET);
    const result = verifyToken(token, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.iat).toBeDefined();
      expect(typeof result.payload.iat).toBe('number');
    }
  });

  it('deve incluir exp quando expiresInSec é fornecido', () => {
    const token = signToken({ sub: 'user@test.com' }, SECRET, 3600);
    const result = verifyToken(token, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.exp).toBeDefined();
      expect(result.payload.exp).toBe(result.payload.iat + 3600);
    }
  });

  it('não deve incluir exp quando expiresInSec não é fornecido', () => {
    const token = signToken({ sub: 'user@test.com' }, SECRET);
    const result = verifyToken(token, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.exp).toBeUndefined();
    }
  });
});

describe('verifyToken', () => {
  it('deve validar um token corretamente assinado', () => {
    const token = signToken({ sub: 'user@test.com', codcli: 42 }, SECRET, 3600);
    const result = verifyToken(token, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.sub).toBe('user@test.com');
      expect(result.payload.codcli).toBe(42);
    }
  });

  it('deve rejeitar token com secret errado', () => {
    const token = signToken({ sub: 'user@test.com' }, SECRET);
    const result = verifyToken(token, 'wrong-secret');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('inválida');
    }
  });

  it('deve rejeitar token expirado', () => {
    // Cria token que já expirou (exp no passado)
    const token = signToken({ sub: 'user@test.com' }, SECRET, -10);
    const result = verifyToken(token, SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('expirado');
    }
  });

  it('deve rejeitar token com formato inválido', () => {
    const result = verifyToken('nao-eh-um-jwt', SECRET);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('Formato inválido');
    }
  });

  it('deve rejeitar token adulterado', () => {
    const token = signToken({ sub: 'user@test.com' }, SECRET);
    // Altera o payload mantendo a assinatura original
    const [header, , signature] = token.split('.');
    const fakePayload = Buffer.from(JSON.stringify({ sub: 'hacker@evil.com', iat: Math.floor(Date.now() / 1000) })).toString('base64url');
    const tamperedToken = `${header}.${fakePayload}.${signature}`;
    const result = verifyToken(tamperedToken, SECRET);
    expect(result.ok).toBe(false);
  });

  it('deve preservar todos os campos custom do payload', () => {
    const payload = { sub: 'user@test.com', codcli: 99, name: 'Test', email: 'test@test.com' };
    const token = signToken(payload, SECRET, 3600);
    const result = verifyToken(token, SECRET);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.codcli).toBe(99);
      expect(result.payload.name).toBe('Test');
      expect(result.payload.email).toBe('test@test.com');
    }
  });
});
