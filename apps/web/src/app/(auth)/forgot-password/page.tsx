'use client';

import { Suspense, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { BrandLogo } from '../../../components/brand-logo';
import { forgotPasswordAction } from '../actions';
import { Mail, ArrowLeft, AlertCircle, Loader2, Send, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
});

type FormData = z.infer<typeof schema>;

function ForgotPasswordContent() {
  const [serverMessage, setServerMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = (data: FormData) => {
    setServerMessage(null);
    startTransition(async () => {
      const res = await forgotPasswordAction(data);
      setServerMessage({ ok: res.ok, text: res.message });
    });
  };

  return (
    <div className="w-full max-w-[400px] mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
        <BrandLogo className="mb-4 sm:mb-6 mx-auto" width={180} height={60} />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Recuperar Senha
        </h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base">
          Informe seu e-mail para receber as instruções de recuperação.
        </p>
      </div>

      {/* Success / Error Messages */}
      {serverMessage && (
        <div
          className={`w-full p-3 rounded-xl border flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-top-1 duration-200 ${serverMessage.ok
            ? 'bg-emerald-50 border-emerald-100'
            : 'bg-red-50 border-red-100'
            }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${serverMessage.ok ? 'bg-emerald-100' : 'bg-red-100'
              }`}
          >
            {serverMessage.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div className="pt-0.5">
            <p
              className={`text-sm font-semibold ${serverMessage.ok ? 'text-emerald-800' : 'text-red-800'
                }`}
            >
              {serverMessage.ok ? 'E-mail enviado' : 'Erro ao enviar'}
            </p>
            <p
              className={`text-xs mt-0.5 ${serverMessage.ok ? 'text-emerald-600' : 'text-red-600'
                }`}
            >
              {serverMessage.text}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 ease-out fill-mode-both">
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
            disabled={isPending}
            className="h-11 bg-white border-slate-200 rounded-xl pl-11 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
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

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 !mt-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 group"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Enviar link de recuperação
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ease-out fill-mode-both">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Login
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
