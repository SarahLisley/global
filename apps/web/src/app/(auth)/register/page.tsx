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
    <div className="w-full max-w-[460px] mx-auto -my-6">
      <div className="mb-0 text-center sm:text-left">
        <BrandLogo className="mx-auto sm:mx-0" width={80} height={28} />
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 mt-0">Cadastro</h1>
        <p className="text-slate-500 mt-0 text-xs">Crie sua conta para acessar o sistema.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-1.5">
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
                value={field.value}
                onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                className="h-9 bg-white border-slate-200 transition-all sm:text-sm py-2"
              />
            )}
          />
          {errors.cnpj && <p className="text-sm text-red-600 font-medium ml-1">{errors.cnpj.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-semibold text-slate-700">Nome completo</label>
          <Input
            id="name"
            placeholder="Ex.: Maria Souza"
            className="h-9 bg-white border-slate-200 transition-all sm:text-sm py-2"
            {...register('name')}
          />
          {errors.name && <p className="text-sm text-red-600 font-medium ml-1">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-semibold text-slate-700">E-mail</label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            className="h-9 bg-white border-slate-200 transition-all sm:text-sm py-2"
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-red-600 font-medium ml-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-semibold text-slate-700">Senha</label>
          <Input
            id="password"
            type="password"
            withPasswordToggle
            placeholder="••••••••"
            className="h-9 bg-white border-slate-200 transition-all sm:text-sm py-2"
            {...register('password')}
          />
          {errors.password && <p className="text-sm text-red-600 font-medium ml-1">{errors.password.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="confirm" className="text-sm font-semibold text-slate-700">Confirmar senha</label>
          <Input
            id="confirm"
            type="password"
            withPasswordToggle
            placeholder="••••••••"
            className="h-9 bg-white border-slate-200 transition-all sm:text-sm py-2"
            {...register('confirm')}
          />
          {errors.confirm && <p className="text-sm text-red-600 font-medium ml-1">{errors.confirm.message}</p>}
        </div>

        {serverError && (
          <div className="w-full p-2 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2">
            <p className="text-xs text-red-700 leading-relaxed font-medium">{serverError}</p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-10 mt-3 btn-gradient text-sm font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-1"
          disabled={isPending}
        >
          {isPending ? 'Criando conta...' : 'Criar conta'}
        </Button>
      </form>

      <div className="mt-2 text-left pt-2 border-t border-slate-100">
        <p className="text-slate-600">
          Já tem conta?{' '}
          <Link className="font-semibold text-[color:var(--brand-blue)] hover:text-[color:var(--brand-blue-dark)] hover:underline transition-colors" href="/login">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}