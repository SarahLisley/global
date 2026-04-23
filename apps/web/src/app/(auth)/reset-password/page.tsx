'use client';

import { useState, useTransition, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { BrandLogo } from '@/components/brand-logo';
import { LockKeyhole, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { resetPasswordAction } from '../actions';

const schema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  confirmPassword: z.string().min(6, 'Mínimo de 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"]
});

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  useEffect(() => {
    if (!token) {
      setMessage({ type: 'error', text: 'Token de recuperação ausente ou inválido.' });
    }
  }, [token]);

  const onSubmit = (data: FormData) => {
    if (!token) return;

    setMessage(null);
    startTransition(async () => {
      const res = await resetPasswordAction({ token, password: data.password });
      if (res.ok) {
        setMessage({ type: 'success', text: res.message });
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    });
  };

  if (message?.type === 'success') {
    return (
      <div className="flex flex-col items-center text-center space-y-6 py-8 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">Senha Alterada!</h2>
          <p className="text-slate-500 dark:text-zinc-400 max-w-[280px] mx-auto">
            Sua senha foi redefinida com sucesso. Você será redirecionado para o login em instantes.
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 min-w-[200px]">
          <Link href="/login">Ir para Login Agora</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
        <BrandLogo className="mb-4 sm:mb-6 mx-auto" width={180} height={60} />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          Nova Senha
        </h1>
        <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm sm:text-base">
          Crie uma nova senha segura para sua conta
        </p>
      </div>

      {/* Error Message */}
      {message && message.type === 'error' && (
        <div className="w-full p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="pt-0.5">
            <p className="text-sm font-semibold text-red-800">Erro</p>
            <p className="text-xs text-red-600 mt-0.5">{message.text}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 ease-out fill-mode-both">
        {/* Nova Senha */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300" htmlFor="password">
            Nova Senha
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            withPasswordToggle
            disabled={isPending || !token}
            className="h-11 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl pl-11 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            leftIcon={<LockKeyhole className="w-5 h-5 text-slate-400 dark:text-zinc-500" />}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirmar Senha */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300" htmlFor="confirmPassword">
            Confirmar Senha
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            autoComplete="new-password"
            withPasswordToggle
            disabled={isPending || !token}
            className="h-11 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl pl-11 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            leftIcon={<ShieldCheck className="w-5 h-5 text-slate-400 dark:text-zinc-500" />}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 !mt-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
          disabled={isPending || !token}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Redefinindo...
            </>
          ) : (
            'Redefinir Senha'
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ease-out fill-mode-both">
        <Link
          href="/login"
          prefetch={true}
          className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
