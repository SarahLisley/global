'use client';

import { HTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: 'info' | 'success' | 'warning' | 'error';
};

export function Alert({ className, variant = 'info', ...props }: Props) {
  const map = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  } as const;

  return (
    <div className={clsx('rounded-xl border px-4 py-3 text-sm', map[variant], className)} {...props} />
  );
}