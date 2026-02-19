'use client';

import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { BrandLogo } from '../../../components/brand-logo';
import { registerAction } from '../actions';
import { maskCNPJ, unmask } from '../../../lib/mask';
import { Building2, User, Mail, LockKeyhole, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

function isValidCNPJ(value: string) {
  const cnpj = (value || '').replace(/[^\d]+/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  const calc = (cnpjSlice: string, length: number) => {
    let sum = 0;
    let pos = length - 7;
    for (let i = length; i >= 1; i--) {
      sum += Number(cnpjSlice[length - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result;
  };

  const d1 = calc(cnpj.substring(0, 12), 12);
  if (d1 !== Number(cnpj.charAt(12))) return false;

  const d2 = calc(cnpj.substring(0, 13), 13);
  if (d2 !== Number(cnpj.charAt(13))) return false;

  return true;
}

const schema = z.object({
  cnpj: z.string().min(1, 'Informe o CNPJ'),
  name: z.string().min(2, 'Informe seu nome'),
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
  confirm: z.string().min(6),
}).refine((d) => d.password === d.confirm, {
  path: ['confirm'],
  message: 'As senhas não coincidem',
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cnpj: '', name: '', email: '', password: '', confirm: '' },
  });

  const onSubmit = (data: FormData) => {
    setServerError(null);
    startTransition(async () => {
      const res = await registerAction({
        cnpj: unmask(data.cnpj),
        name: data.name,
        email: data.email,
        password: data.password,
      });
      if (!res.ok) {
        setServerError(res.message ?? 'Erro ao cadastrar');
        return;
      }
      router.push(res.redirectTo || '/dashboard');
    });
  };

  return (
    <div className="w-full max-w-[420px] mx-auto -my-4">
      {/* Header */}
      <div className="mb-5 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
        <BrandLogo className="mx-auto mb-4" width={110} height={38} />
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Criar Conta
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Preencha os dados abaixo para acessar o sistema.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 ease-out fill-mode-both">
        {/* CNPJ */}
        <div className="space-y-1">
          <label htmlFor="cnpj" className="text-sm font-semibold text-slate-700">CNPJ</label>
          <Controller
            name="cnpj"
            control={control}
            render={({ field }) => (
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
                disabled={isPending}
                value={field.value}
                onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                className="h-10 bg-white border-slate-200 rounded-xl pl-11 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                leftIcon={<Building2 className="w-5 h-5 text-slate-400" />}
              />
            )}
          />
          {errors.cnpj && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.cnpj.message}
            </p>
          )}
        </div>

        {/* Nome */}
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-semibold text-slate-700">Nome completo</label>
          <Input
            id="name"
            placeholder="Ex.: Maria Souza"
            disabled={isPending}
            className="h-10 bg-white border-slate-200 rounded-xl pl-11 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            leftIcon={<User className="w-5 h-5 text-slate-400" />}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* E-mail */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-semibold text-slate-700">E-mail</label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com.br"
            disabled={isPending}
            className="h-10 bg-white border-slate-200 rounded-xl pl-11 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            leftIcon={<Mail className="w-5 h-5 text-slate-400" />}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Senha */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-semibold text-slate-700">Senha</label>
          <Input
            id="password"
            type="password"
            withPasswordToggle
            placeholder="••••••••"
            disabled={isPending}
            className="h-10 bg-white border-slate-200 rounded-xl pl-11 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            leftIcon={<LockKeyhole className="w-5 h-5 text-slate-400" />}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirmar senha */}
        <div className="space-y-1">
          <label htmlFor="confirm" className="text-sm font-semibold text-slate-700">Confirmar senha</label>
          <Input
            id="confirm"
            type="password"
            withPasswordToggle
            placeholder="••••••••"
            disabled={isPending}
            className="h-10 bg-white border-slate-200 rounded-xl pl-11 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            leftIcon={<ShieldCheck className="w-5 h-5 text-slate-400" />}
            {...register('confirm')}
          />
          {errors.confirm && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.confirm.message}
            </p>
          )}
        </div>

        {/* Error Message */}
        {serverError && (
          <div className="w-full p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-semibold text-red-800">Erro ao cadastrar</p>
              <p className="text-xs text-red-600 mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 !mt-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Criando conta...
            </>
          ) : (
            'Criar conta'
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-5 text-center pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ease-out fill-mode-both">
        <p className="text-sm text-slate-600">
          Já tem conta?{' '}
          <Link
            className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            href="/login"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}