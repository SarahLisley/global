'use client';

import { useState, useTransition, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { BrandLogo } from '@/components/brand-logo';
import { KeyRound, Eye, EyeOff, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { resetPasswordAction } from '../actions';

const schema = z.object({
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"]
});

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
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
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Senha Alterada!</h2>
          <p className="text-zinc-400 max-w-[280px] mx-auto">
            Sua senha foi redefinida com sucesso. Você será redirecionado para o login em instantes.
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[200px]">
          <Link href="/login">Ir para Login Agora</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center space-y-6">
        <BrandLogo className="w-[180px] h-[60px]" />
        
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Nova Senha</h1>
          <p className="text-sm text-zinc-400">
            Crie uma nova senha segura para sua conta
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova Senha</Label>
            <div className="relative group">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10 bg-zinc-900/50 border-zinc-800 focus:border-blue-500/50 focus:ring-blue-500/20"
                disabled={isPending || !token}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                disabled={!token}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <div className="relative group">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10 bg-zinc-900/50 border-zinc-800 focus:border-blue-500/50 focus:ring-blue-500/20"
                disabled={isPending || !token}
                {...register('confirmPassword')}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        {message && message.type === 'error' && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-500 font-medium">{message.text}</p>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all duration-300 transform active:scale-[0.98]"
          disabled={isPending || !token}
        >
          {isPending ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Redefinindo...</span>
            </div>
          ) : (
            'Redefinir Senha'
          )}
        </Button>

        <Button asChild variant="ghost" className="w-full text-zinc-500 hover:text-white hover:bg-white/5">
          <Link href="/login" className="flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Login
          </Link>
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px] text-white">Carregando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
