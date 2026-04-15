'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Lock, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Building2,
  Phone,
  MapPin,
  Clock,
  CheckCheck
} from 'lucide-react';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação é obrigatória'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
  });

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        profileForm.reset({ name: data.name });
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  }

  async function onUpdateProfile(data: ProfileData) {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (res.ok) {
          setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
          setUser((prev: any) => ({ ...prev, name: data.name }));
        } else {
          setMessage({ type: 'error', text: result.message || 'Erro ao atualizar perfil' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Erro de conexão' });
      }
    });
  }

  async function onUpdatePassword(data: PasswordData) {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/profile/password', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          }),
        });
        const result = await res.json();
        if (res.ok) {
          setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
          passwordForm.reset();
        } else {
          setMessage({ type: 'error', text: result.message || 'Erro ao alterar senha' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Erro de conexão' });
      }
    });
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-100 dark:from-zinc-800 dark:to-zinc-900 rounded-lg w-1/3 animate-pulse"></div>
          <div className="h-4 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-zinc-900 dark:to-zinc-950 rounded-lg w-2/3 animate-pulse"></div>
        </div>

        {/* Content skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Card 1 skeleton */}
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950 animate-pulse"></div>
              <div className="p-6 space-y-4">
                <div className="h-10 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-zinc-900 dark:to-zinc-950 rounded-lg animate-pulse"></div>
                <div className="h-10 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-zinc-900 dark:to-zinc-950 rounded-lg animate-pulse"></div>
                <div className="h-10 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-zinc-900 dark:to-zinc-950 rounded-lg w-1/3 animate-pulse ml-auto"></div>
              </div>
            </div>

            {/* Card 2 skeleton */}
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950 animate-pulse"></div>
              <div className="p-6 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-zinc-900 dark:to-zinc-950 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column skeleton */}
          <div>
            <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden sticky top-24">
              <div className="h-16 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950 animate-pulse"></div>
              <div className="p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-zinc-900 dark:to-zinc-950 rounded-lg animate-pulse"></div>
                ))}
                <div className="h-10 bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-950/30 rounded-lg animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100">Meu Perfil</h1>
            <p className="text-slate-500 dark:text-zinc-400 text-sm mt-0.5">Gerenciar dados pessoais e segurança</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300' 
            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Info Card */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800/50 transition-all duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white dark:from-zinc-900/50 dark:to-zinc-950">
              <div className="p-2 bg-blue-100 dark:bg-blue-950/40 rounded-lg">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-bold text-slate-900 dark:text-zinc-100">Dados Pessoais</h2>
            </div>
            <div className="p-6">
              <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 block">Nome Completo</label>
                    <Input 
                      {...profileForm.register('name')}
                      placeholder="Seu nome"
                      disabled={isPending}
                      className="bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 transition-colors"
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-xs text-red-500 font-medium mt-1">{profileForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 block">E-mail</label>
                    <div className="relative">
                      <Input 
                        value={user?.email || ''} 
                        disabled 
                        className="bg-slate-100/50 dark:bg-zinc-900/30 border-slate-200 dark:border-zinc-800 cursor-not-allowed text-slate-600 dark:text-zinc-400 pl-10"
                      />
                      <Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-3" />
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-zinc-400">Identificador único da conta</p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button 
                    type="submit" 
                    disabled={isPending} 
                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Business Info (Read Only) */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800/50 transition-all duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white dark:from-zinc-900/50 dark:to-zinc-950">
              <div className="p-2 bg-orange-100 dark:bg-orange-950/40 rounded-lg">
                <Building2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="font-bold text-slate-900 dark:text-zinc-100">Vínculo Empresarial</h2>
              <span className="ml-auto inline-block px-2.5 py-1 bg-orange-100/50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-full">Somente Leitura</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2 p-3 rounded-lg bg-blue-50/30 dark:bg-blue-950/10 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 transition-colors">
                <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Código WinThor</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">{user?.client?.code || 'N/A'}</span>
                  <CheckCheck className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-purple-50/30 dark:bg-purple-950/10 hover:bg-purple-50/60 dark:hover:bg-purple-950/20 transition-colors">
                <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Cliente / Empresa</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{user?.client?.name || 'Não vinculado'}</p>
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-cyan-50/30 dark:bg-cyan-950/10 hover:bg-cyan-50/60 dark:hover:bg-cyan-950/20 transition-colors">
                <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">CNPJ</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{user?.client?.document || 'N/A'}</p>
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-green-50/30 dark:bg-green-950/10 hover:bg-green-50/60 dark:hover:bg-green-950/20 transition-colors">
                <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Contato Principal</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                  {user?.client?.phone || 'N/A'}
                </div>
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-red-50/30 dark:bg-red-950/10 hover:bg-red-50/60 dark:hover:bg-red-950/20 transition-colors">
                <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">CEP</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{user?.client?.address?.zip || 'N/A'}</p>
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-indigo-50/30 dark:bg-indigo-950/10 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 transition-colors">
                <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Cidade / UF</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {user?.client?.address?.city} - {user?.client?.address?.state}
                </div>
              </div>
              <div className="md:col-span-2 lg:col-span-3 space-y-2 p-3 rounded-lg bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-800">
                <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Endereço Completo</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                   {user?.client?.address?.street}{user?.client?.address?.neighborhood ? `, ${user?.client?.address?.neighborhood}` : ''}
                </p>
              </div>
            </div>
            <div className="px-6 py-3 bg-gradient-to-r from-orange-50/50 to-amber-50/50 dark:from-orange-950/10 dark:to-amber-950/10 border-t border-orange-100/50 dark:border-orange-900/20">
              <p className="text-[11px] text-orange-700 dark:text-orange-400 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Dados vinculados ao WinThor. Para alterações, contate o comercial.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Password */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800/50 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all duration-300 sticky top-24">
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white dark:from-zinc-900/50 dark:to-zinc-950">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="font-bold text-slate-900 dark:text-zinc-100">Segurança</h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Security Info Section */}
              <div className="space-y-3 pb-5 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/30 dark:bg-emerald-950/10">
                  <CheckCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">Conta Segura</p>
                    <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">Sua conta está com proteção ativa</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50 dark:bg-zinc-900/30 hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <Clock className="w-5 h-5 text-slate-500 dark:text-zinc-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-slate-700 dark:text-zinc-300">Último Acesso</p>
                    <p className="text-slate-600 dark:text-zinc-400 mt-0.5">
                      {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Primeiro acesso'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Password Form */}
              <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-zinc-400 font-medium">Altere sua senha periodicamente para melhor segurança.</p>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 block">Senha Atual</label>
                  <Input 
                    {...passwordForm.register('currentPassword')}
                    type="password" 
                    placeholder="••••••••"
                    disabled={isPending}
                    className="bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-xs text-red-500 font-medium">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 block">Nova Senha</label>
                  <Input 
                    {...passwordForm.register('newPassword')}
                    type="password" 
                    placeholder="••••••••"
                    disabled={isPending}
                    className="bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-red-500 font-medium">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 block">Confirmar Nova Senha</label>
                  <Input 
                    {...passwordForm.register('confirmPassword')}
                    type="password" 
                    placeholder="••••••••"
                    disabled={isPending}
                    className="bg-slate-50 dark:bg-zinc-900/50 border-slate-200 dark:border-zinc-800 focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500 font-medium">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={isPending} 
                  className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white gap-2 transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Atualizar Senha
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
