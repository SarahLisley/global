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
import { ArrowLeft } from 'lucide-react';

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
    <div className="max-w-md w-full">
      <BrandLogo className="mb-6" />

      <h1 className="text-2xl font-extrabold tracking-tight">RECUPERAR SENHA</h1>
      <p className="text-slate-600 mt-1 mb-6">Informe seu e-mail para receber as instruções de recuperação.</p>

      {serverMessage && (
        <div className={`p-3 rounded mb-4 text-sm ${serverMessage.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {serverMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Seu e-mail cadastrado"
            rightIcon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-3.866 0-7 3.134-7 7h2a5 5 0 0 1 10 0h2c0-3.866-3.134-7-7-7Z" fill="#334155" />
              </svg>
            }
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
        </div>

        <Button type="submit" className="w-full mt-2" disabled={isPending}>
          {isPending ? 'Enviando...' : 'Enviar link de recuperação'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="inline-flex items-center text-sm text-slate-600 hover:text-[color:var(--brand-orange)] transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
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
