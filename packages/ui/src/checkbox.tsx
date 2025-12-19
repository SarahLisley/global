'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, Props>(function Checkbox({ className, label, ...props }, ref) {
  return (
    <label className={clsx('inline-flex items-center gap-2 text-sm text-slate-700', className)}>
      <input
        ref={ref}
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-[color:var(--brand-orange)] focus:ring-[color:var(--brand-orange)]"
        {...props}
      />
      {label}
    </label>
  );
});