type RedactOptions = { fields?: string[] };

export function safeLogBinds(binds: Record<string, unknown>, opts: RedactOptions = {}) {
  const hide = new Set((opts.fields ?? []).map(s => s.toLowerCase()));
  const redacted: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(binds)) {
    const key = k.toLowerCase();
    const isSensitive = hide.has(key) || /(password|senha|token|email)/i.test(key);
    redacted[k] = isSensitive ? '[redacted]' : v;
  }
  return redacted;
}