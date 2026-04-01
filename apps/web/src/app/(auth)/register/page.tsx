'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { BrandLogo } from '../../../components/brand-logo';
import { registerAction, verifyRegisterAction, resendCodeAction } from '../actions';
import { maskCNPJ, unmask } from '../../../lib/mask';
import { Building2, User, Mail, LockKeyhole, ShieldCheck, AlertCircle, Loader2, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';

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
  confirmEmail: z.string().email('Confirme seu e-mail'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
  confirm: z.string().min(6),
}).refine((d) => d.email === d.confirmEmail, {
  path: ['confirmEmail'],
  message: 'Os e-mails não coincidem',
}).refine((d) => d.password === d.confirm, {
  path: ['confirm'],
  message: 'As senhas não coincidem',
});

type FormData = z.infer<typeof schema>;

/* ─────────────────── Verification Code Input ─────────────────── */
function CodeInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleChange = (idx: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const arr = [...digits];
    arr[idx] = char;
    const next = arr.join('');
    onChange(next.replace(/ /g, ''));
    if (char && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d === ' ' ? '' : d}
          disabled={disabled}
          className="w-11 h-13 text-center text-2xl font-bold rounded-xl border-2 border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 disabled:opacity-50"
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
        />
      ))}
    </div>
  );
}

/* ─────────────────── Success View ─────────────────── */
function SuccessView() {
  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8 animate-in fade-in zoom-in duration-500">
      <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100">Conta Criada!</h2>
        <p className="text-slate-500 dark:text-zinc-400 max-w-[280px] mx-auto">
          Seu cadastro foi concluído com sucesso. Faça login para acessar o portal.
        </p>
      </div>
      <Button asChild className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 min-w-[200px]">
        <Link href="/login">Ir para Login</Link>
      </Button>
    </div>
  );
}

/* ─────────────────── Verification Step ─────────────────── */
function VerificationStep({ email, onBack }: { email: string; onBack: () => void }) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isResending, startResend] = useTransition();
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
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

  const handleResend = () => {
    setMessage(null);
    startResend(async () => {
      const res = await resendCodeAction({ email });
      setMessage({ ok: res.ok, text: res.message });
    });
  };

  if (success) return <SuccessView />;

  return (
    <div className="w-full max-w-[400px] mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="mb-6 sm:mb-8 text-center">
        <BrandLogo className="mb-4 sm:mb-6 mx-auto" width={180} height={60} />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          Verificar E-mail
        </h1>
        <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm sm:text-base">
          Enviamos um código de 6 dígitos para
        </p>
        <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm mt-1">{email}</p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`w-full p-3 rounded-xl border flex items-start gap-3 mb-6 animate-in fade-in slide-in-from-top-1 duration-200 ${message.ok
            ? 'bg-emerald-50 border-emerald-100'
            : 'bg-red-50 border-red-100'
            }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.ok ? 'bg-emerald-100' : 'bg-red-100'}`}>
            {message.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
          </div>
          <p className={`text-sm pt-1.5 ${message.ok ? 'text-emerald-700' : 'text-red-700'}`}>{message.text}</p>
        </div>
      )}

      <div className="space-y-6">
        <CodeInput value={code} onChange={setCode} disabled={isPending} />

        <Button
          onClick={handleSubmit}
          disabled={code.length !== 6 || isPending}
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Verificando...
            </>
          ) : (
            'Verificar e Criar Conta'
          )}
        </Button>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {isResending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Reenviar código
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Main Register Page ─────────────────── */
export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cnpj: '', name: '', email: '', confirmEmail: '', password: '', confirm: '' },
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
      if (res.needsVerification) {
        setRegisteredEmail(data.email);
        setStep('verify');
      }
    });
  };

  if (step === 'verify') {
    return <VerificationStep email={registeredEmail} onBack={() => setStep('form')} />;
  }

  return (
    <div className="w-full max-w-[400px] mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
        <BrandLogo className="mb-4 sm:mb-6 mx-auto" width={180} height={60} />
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
          Criar Conta
        </h1>
        <p className="text-slate-500 dark:text-zinc-400 mt-2 text-sm sm:text-base">
          Preencha os dados abaixo para acessar o sistema.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 ease-out fill-mode-both">
        {/* CNPJ */}
        <div className="space-y-1">
          <label htmlFor="cnpj" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">CNPJ</label>
          <Controller
            name="cnpj"
            control={control}
            render={({ field }) => (
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                inputMode="numeric"
                autoComplete="off"
                disabled={isPending}
                value={field.value}
                onChange={(e) => field.onChange(maskCNPJ(e.target.value))}
                className="h-10 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl pl-11 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
                leftIcon={<Building2 className="w-5 h-5 text-slate-400 dark:text-zinc-500" />}
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
          <label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Nome completo</label>
          <Input
            id="name"
            placeholder="Ex.: Maria Souza"
            autoComplete="name"
            disabled={isPending}
            className="h-10 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl pl-11 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            leftIcon={<User className="w-5 h-5 text-slate-400 dark:text-zinc-500" />}
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
          <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">E-mail</label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com.br"
            autoComplete="email"
            disabled={isPending}
            className="h-10 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl pl-11 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            leftIcon={<Mail className="w-5 h-5 text-slate-400 dark:text-zinc-500" />}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Confirmar E-mail */}
        <div className="space-y-1">
          <label htmlFor="confirmEmail" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Confirmar E-mail</label>
          <Input
            id="confirmEmail"
            type="email"
            placeholder="Confirme seu e-mail"
            autoComplete="email"
            disabled={isPending}
            className="h-10 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl pl-11 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            leftIcon={<Mail className="w-5 h-5 text-slate-400 dark:text-zinc-500" />}
            {...register('confirmEmail')}
          />
          {errors.confirmEmail && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-0.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.confirmEmail.message}
            </p>
          )}
        </div>

        {/* Senha */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Senha</label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            withPasswordToggle
            placeholder="••••••••"
            disabled={isPending}
            className="h-10 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl pl-11 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            leftIcon={<LockKeyhole className="w-5 h-5 text-slate-400 dark:text-zinc-500" />}
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
          <label htmlFor="confirm" className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Confirmar senha</label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            withPasswordToggle
            placeholder="••••••••"
            disabled={isPending}
            className="h-10 bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 rounded-xl pl-11 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-blue-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
            leftIcon={<ShieldCheck className="w-5 h-5 text-slate-400 dark:text-zinc-500" />}
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
          className="w-full h-11 !mt-8 md:!mt-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando...
            </>
          ) : (
            'Criar conta'
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ease-out fill-mode-both">
        <p className="text-sm text-slate-600 dark:text-zinc-400">
          Já tem conta?{' '}
          <Link
            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
            href="/login"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}