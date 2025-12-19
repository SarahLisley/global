'use client';

import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input, Button, FormField } from '@pgb/ui';
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
    <div className="max-w-md">
      <BrandLogo className="mb-6" />

      <h1 className="text-2xl font-extrabold tracking-tight">CADASTRO</h1>
      <p className="text-slate-600 mt-1 mb-6">Crie sua conta para acessar o sistema</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="CNPJ" htmlFor="cnpj" error={errors.cnpj?.message ?? undefined}>
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
              />
            )}
          />
        </FormField>

        <FormField label="Nome completo" htmlFor="name" error={errors.name?.message ?? undefined}>
          <Input id="name" placeholder="Ex.: Maria Souza" {...register('name')} />
        </FormField>

        <FormField label="E-mail" htmlFor="email" error={errors.email?.message ?? undefined}>
          <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
        </FormField>

        <FormField label="Senha" htmlFor="password" error={errors.password?.message ?? undefined}>
          <Input id="password" type="password" withPasswordToggle placeholder="••••••••" {...register('password')} />
        </FormField>

        <FormField label="Confirmar senha" htmlFor="confirm" error={errors.confirm?.message ?? undefined}>
          <Input id="confirm" type="password" withPasswordToggle placeholder="••••••••" {...register('confirm')} />
        </FormField>

        {serverError && <div className="text-sm text-red-600">{serverError}</div>}

        <Button type="submit" className="mt-2" loading={isPending}>
          Criar conta
        </Button>
      </form>

      <p className="text-sm text-slate-600 mt-6">
        Já tem conta?{' '}
        <Link className="text-[color:var(--brand-orange)] font-medium hover:underline" href="/login">
          Entrar
        </Link>
      </p>
    </div>
  );
}