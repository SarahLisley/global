'use client';

import { Suspense, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { BrandLogo } from '../../../components/brand-logo';
import { LoginInputSchema } from '@pgb/sdk';
import { loginAction } from '../actions';
import { Mail, LockKeyhole, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Redefine o schema completo para evitar problemas de inferência de tipos com .extend()
const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Senha é obrigatória'),
  remember: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

function LoginContent() {
  const router = useRouter();
  const search = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: FormData) => {
    setServerError(null);
    startTransition(async () => {
      // Cast explícito para resolver erro de tipo, já que FormData estende o tipo esperado
      const res = await loginAction(data as { email: string; password: string });
      if (!res.ok) {
        setServerError(res.message ?? 'Erro ao entrar');
        return;
      }
      const to = search.get('from') || res.redirectTo || '/dashboard';
      router.push(to);
    });
  };

  return (
    <div className="w-full max-w-[400px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <BrandLogo className="mb-6" width={130} height={44} />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Bem-vindo
        </h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">
          Entre com suas credenciais para continuar
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700" htmlFor="email">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com.br"
            autoFocus
            autoComplete="email"
            className="h-11 bg-white border-slate-200 rounded-xl pl-11 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            leftIcon={<Mail className="w-5 h-5 text-slate-400" />}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700" htmlFor="password">
            Senha
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="h-11 bg-white border-slate-200 rounded-xl pl-11 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            leftIcon={<LockKeyhole className="w-5 h-5 text-slate-400" />}
            withPasswordToggle
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="inline-flex items-center cursor-pointer group" title="Sessão expira após 2 horas de inatividade">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer transition-colors"
              {...register('remember')}
            />
            <span className="ml-2 text-sm text-slate-600 group-hover:text-slate-800 transition-colors select-none">
              Manter conectado
            </span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            Esqueceu a senha?
          </Link>
        </div>

        {/* Error Message */}
        {serverError && (
          <div className="w-full p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-semibold text-red-800">Erro ao entrar</p>
              <p className="text-xs text-red-600 mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Entrando...
            </>
          ) : (
            <>
              Entrar
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center pt-6 border-t border-slate-100">
        <p className="text-sm text-slate-600">
          Ainda não tem uma conta?{' '}
          <Link
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            href="/register"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}