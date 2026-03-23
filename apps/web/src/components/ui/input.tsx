'use client';

import { InputHTMLAttributes, ReactNode, forwardRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import clsx, { ClassValue } from 'clsx';

// Utility helper if not already available in project, locally defined to be safe
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Props = InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  withPasswordToggle?: boolean;
  wrapperClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className, wrapperClassName, leftIcon, rightIcon, withPasswordToggle, type, ...props },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);

  // Se tiver toggle, o tipo alterna. Se não, usa o tipo passado (ex: 'email', 'text'...)
  const inputType = withPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  // Se tiver toggle, o ícone da direita vira o botão de olho.
  // Se tiver rightIcon passado manualmente, ele tem prioridade (ou podemos concatenar, mas aqui vou substituir)
  const finalRightIcon = withPasswordToggle ? (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="focus:outline-none hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-200/50 dark:hover:bg-zinc-800 p-1.5 rounded-full transition-all"
      tabIndex={-1} // Não focar no tab
    >
      {showPassword ? (
        // Eye Off (Ocultar)
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      ) : (
        // Eye (Mostrar)
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  ) : rightIcon;

  return (
    <div className={cn('relative flex items-center w-full', wrapperClassName)}>
      {leftIcon && (
        <span className="absolute left-3 text-slate-500 dark:text-zinc-400 pointer-events-none z-10 flex items-center justify-center">
          {leftIcon}
        </span>
      )}
      {finalRightIcon && (
        <span className={`absolute right-3 text-slate-500 dark:text-zinc-400 z-10 flex items-center justify-center ${withPasswordToggle ? '' : 'pointer-events-none'}`}>
          {finalRightIcon}
        </span>
      )}
      <input
        ref={ref}
        type={inputType}
        className={cn(
          'w-full relative transition-all duration-200 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 px-4 py-3 text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-500/50',
          leftIcon && 'pl-10',
          finalRightIcon && 'pr-10',
          className
        )}
        {...props}
      />
    </div>
  );
});