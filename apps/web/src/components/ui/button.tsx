'use client';

import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  full?: boolean;
  variant?: 'primary' | 'ghost';
};

export function Button({ className, full, variant = 'primary', ...props }: Props) {
  if (variant === 'ghost') {
    return (
      <button
        className={clsx(
          'rounded-xl px-5 py-2.5 text-sm font-medium text-slate-700',
          'hover:bg-slate-100 active:bg-slate-200',
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
  
  return (
    <button
      className={clsx(
        'btn-gradient',
        'px-8 py-3.5 rounded-xl',
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