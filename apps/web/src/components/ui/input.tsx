'use client';

import { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import clsx from 'clsx';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, leftIcon, rightIcon, ...props },
  ref
) {
  return (
    <div className={clsx('relative flex items-center', className)}>
      {leftIcon && (
        <span className="absolute left-3 text-slate-500 pointer-events-none z-10">
          {leftIcon}
        </span>
      )}
      {rightIcon && (
        <span className="absolute right-3 text-slate-500 pointer-events-none z-10">
          {rightIcon}
        </span>
      )}
      <input
        ref={ref}
        className={clsx(
          'input-pill w-full relative',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10'
        )}
        {...props}
      />
    </div>
  );
});