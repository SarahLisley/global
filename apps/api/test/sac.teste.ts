import { describe, it, expect } from 'vitest';
import { hourIdx, classify } from '../src/controllers/sacController.ts';

describe('hourIdx', () => {
  it('caps between 0 and 23', () => {
    expect(hourIdx('2025-01-01T00:00:00Z')).toBeGreaterThanOrEqual(0);
    expect(hourIdx('2025-01-01T23:00:00Z')).toBeLessThanOrEqual(23);
  });
});

describe('classify', () => {
  it('resolved when DTFINALIZA present', () => {
    expect(classify({ STATUS: 'Aberto', DTFINALIZA: '2025-01-01' })).toBe('resolved');
  });
  it('pending for Aberto', () => {
    expect(classify({ STATUS: 'Aberto' })).toBe('pending');
  });
  it('in_progress for andamento', () => {
    expect(classify({ STATUS: 'Em Andamento' })).toBe('in_progress');
  });
  it('fallback to in_progress', () => {
    expect(classify({ STATUS: 'Foo' })).toBe('in_progress');
  });
});