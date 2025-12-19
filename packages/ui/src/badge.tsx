'use client';

import clsx from 'clsx';
import { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
};

export function Badge({ className, variant = 'neutral', ...props }: Props) {
  const map = {
    neutral: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger:  'bg-red-100 text-red-800',
    info:    'bg-blue-100 text-blue-800',
  } as const;

  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', map[variant], className)} {...props} />
  );
}