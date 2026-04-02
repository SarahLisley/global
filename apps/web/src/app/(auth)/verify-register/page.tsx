'use client';

import { useState, useTransition, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { BrandLogo } from '../../../components/brand-logo';
import { verifyRegisterAction, resendCodeAction } from '../actions';
import { ArrowLeft, RefreshCw, Loader2, CheckCircle2, AlertCircle, MailOpen } from 'lucide-react';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isResending, startResend] = useTransition();
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email) {
      router.push('/register');
    }
  }, [email, router]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (code.length !== 6) return;
    setMessage(null);
    startTransition(async () => {
      const res = await verifyRegisterAction({ email, code });
      if (res.ok) {
        setSuccess(true);
      } else {
        setMessage({ ok: false, text: res.message });
      }
    });
  };

  if (success) {
    return (
      <div className="flex flex-col items-center text-center space-y-6 py-8 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">E-mail Confirmado!</h2>
          <p className="text-slate-500 dark:text-zinc-400 max-w-[280px] mx-auto">
            Sua conta Bravo foi ativada com sucesso. Você já pode acessar o sistema.
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 min-w-[200px]">
          <Link href="/login">Entrar no Portal</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px] mx-auto">
      <div className="mb-8 text-center">
        <BrandLogo className="mb-6 mx-auto" width={180} height={60} />
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MailOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          Verificar sua conta
        </h1>
        <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm">
          Enviamos um código de 6 dígitos para
        </p>
        <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm">{email}</p>
      </div>

      {message && (
        <div className={`w-full p-3 rounded-xl border flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-top-1 duration-200 ${
          message.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
        }`}>
          {message.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />}
          <p className={`text-sm ${message.ok ? 'text-emerald-700' : 'text-red-700'}`}>{message.text}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2 block">
            Código de Verificação
          </label>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full h-14 text-center text-3xl font-mono font-bold tracking-[0.5em] rounded-xl border-2 border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-200 dark:placeholder:text-zinc-800"
            autoFocus
          />
        </div>

        <Button
          type="submit"
          disabled={code.length !== 6 || isPending}
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Validando...
            </span>
          ) : (
            'Ativar minha Conta'
          )}
        </Button>

        <div className="flex items-center justify-between pt-2">
          <Link href="/register" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Alterar e-mail
          </Link>
          <button
            type="button"
            onClick={() => {
              setMessage(null);
              startResend(async () => {
                const res = await resendCodeAction({ email });
                setMessage({ ok: res.ok, text: res.message });
              });
            }}
            disabled={isResending}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            {isResending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Reenviar código
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VerifyRegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
