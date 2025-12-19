'use client';

import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  full?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
};

export function Button({ className, full, variant = 'primary', loading, children, disabled, ...props }: Props) {
  const base = 'inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium transition';
  const variants = {
    primary: 'btn-gradient shadow-md hover:brightness-105 active:brightness-95',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
    ghost: 'text-slate-700 hover:bg-slate-100',
  } as const;

  return (
    <button
      className={clsx(base, variants[variant], full && 'w-full', className)}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />}
      {children}
    </button>
  );
}