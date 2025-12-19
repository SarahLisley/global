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
import { loginAction } from '../actions';

export const dynamic = 'force-dynamic'; 

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(3, 'Mínimo de 3 caracteres'),
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
      const res = await loginAction(data);
      if (!res.ok) {
        setServerError(res.message ?? 'Erro ao entrar');
        return;
      }
      const to = search.get('from') || res.redirectTo || '/dashboard';
      router.push(to);
    });
  };

  return (
    <div className="max-w-md">
      <BrandLogo className="mb-6" />

      <h1 className="text-2xl font-extrabold tracking-tight">LOGIN</h1>
      <p className="text-slate-600 mt-1 mb-6">Preencha os campos para entrar na sua conta</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Usuário (e-mail)"
            rightIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 0 1 10 0h2c0-3.866-3.134-7-7-7Z" fill="#334155"/>
              </svg>
            }
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <Input
            type="password"
            placeholder="Senha"
            rightIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M17 8V7a5 5 0 1 0-10 0v1H5v14h14V8h-2Zm-8 0V7a3 3 0 1 1 6 0v1H9Zm3 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" fill="#334155"/>
              </svg>
            }
            {...register('password')}
          />
          {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <Button type="submit" className="mt-2" disabled={isPending}>
          {isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="text-sm text-slate-600 mt-6">
        Não tem conta?{' '}
        <Link className="text-[color:var(--brand-orange)] font-medium hover:underline" href="/register">
          Cadastre-se
        </Link>
      </p>
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