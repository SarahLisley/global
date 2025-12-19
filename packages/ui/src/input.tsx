'use client';

import { InputHTMLAttributes, ReactNode, forwardRef, useState } from 'react';
import clsx from 'clsx';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
  withPasswordToggle?: boolean;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, leftIcon, rightIcon, error, type, withPasswordToggle, ...props },
  ref
) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={clsx('w-full', className)}>
      <div className="relative flex items-center">
        {leftIcon && (
          <span className="absolute left-3 text-slate-500 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          type={isPassword && withPasswordToggle ? (show ? 'text' : 'password') : type}
          className={clsx(
            'input-pill w-full',
            leftIcon && 'pl-10',
            (rightIcon || (isPassword && withPasswordToggle)) && 'pr-10',
            error && 'border-red-400 focus:ring-red-300'
          )}
          aria-invalid={!!error || undefined}
          {...props}
        />
        {withPasswordToggle && isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 text-slate-500 hover:text-slate-700"
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {show ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3l18 18M10.6 10.6A3 3 0 0 0 9 13a3 3 0 0 0 4.8 2.4M6.5 6.9C4.5 8.2 3 10 3 12c0 0 3 6 9 6 1.7 0 3.1-.4 4.3-1.1M17.4 14.1C19.3 12.9 21 11 21 12c0 0-3-6-9-6-1.1 0-2.1.2-3 .5" stroke="#334155" strokeWidth="2" strokeLinecap="round"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 5c6 0 9 6 9 6s-3 6-9 6-9-6-9-6 3-6 9-6Zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" stroke="#334155" strokeWidth="2" strokeLinecap="round"/></svg>
            )}
          </button>
        )}
        {!withPasswordToggle && rightIcon && (
          <span className="absolute right-3 text-slate-500">{rightIcon}</span>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
});