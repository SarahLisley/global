'use client';

import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  full?: boolean;
  variant?: 'primary' | 'ghost' | 'outline';
  asChild?: boolean;
};

export function Button({ className, full, variant = 'primary', asChild, ...props }: Props) {
  const Comp = asChild ? 'span' : 'button'; // Simple fallback or use Slot if available
  if (variant === 'ghost') {
    return (
      <Comp
        className={clsx(
          'rounded-lg px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-300',
          'hover:bg-slate-100 dark:hover:bg-zinc-800 active:bg-slate-200 dark:active:bg-zinc-800/80',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent',
          'inline-flex items-center justify-center gap-2',
          full && 'w-full',
          className
        )}
        {...props}
      />
    );
  }

  if (variant === 'outline') {
    return (
      <Comp
        className={clsx(
          'rounded-lg px-5 py-2.5 text-sm font-medium',
          'border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-300',
          'hover:bg-slate-50 dark:hover:bg-zinc-800 active:bg-slate-100 dark:active:bg-zinc-800/80',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'inline-flex items-center justify-center gap-2',
          full && 'w-full',
          className
        )}
        {...props}
      />
    );
  }

  return (
    <Comp
      className={clsx(
        'btn-gradient',
        'px-8 py-3.5 rounded-lg',
        'text-base font-semibold text-white',
        'inline-flex items-center justify-center gap-2',
        'hover:opacity-90 active:scale-[0.98]',
        'transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50 disabled:active:scale-100',
        'shadow-sm hover:shadow-md',
        full && 'w-full',
        className
      )}
      {...props}
    />
  );
}