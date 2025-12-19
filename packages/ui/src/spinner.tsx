'use client';

export function Spinner({ size = 16 }: { size?: number }) {
  const px = `${size}px`;
  return (
    <span
      style={{ width: px, height: px, borderWidth: Math.max(2, Math.floor(size / 8)) }}
      className="inline-block animate-spin rounded-full border-slate-300 border-t-slate-700 align-[-2px]"
    />
  );
}