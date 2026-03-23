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
  MapPin
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">Meu Perfil</h1>
        <p className="text-slate-500 dark:text-zinc-400 mt-1">Gerencie suas informações pessoais e segurança da conta.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800 text-red-800 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Info Card */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 dark:border-zinc-800 flex items-center gap-3 bg-slate-50/50 dark:bg-zinc-900/50">
              <User className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-slate-800 dark:text-zinc-100">Dados Pessoais</h2>
            </div>
            <div className="p-6">
              <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Nome Completo</label>
                    <Input 
                      {...profileForm.register('name')}
                      placeholder="Seu nome"
                      disabled={isPending}
                      className="bg-white dark:bg-zinc-950"
                    />
                    {profileForm.formState.errors.name && (
                      <p className="text-xs text-red-500 mt-1">{profileForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">E-mail</label>
                    <Input 
                      value={user?.email || ''} 
                      disabled 
                      className="bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 cursor-not-allowed opacity-70"
                      leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                    />
                    <p className="text-[10px] text-slate-400">O e-mail é usado como identificador e não pode ser alterado.</p>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Business Info (Read Only) */}
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden opacity-90">
            <div className="p-6 border-b border-slate-50 dark:border-zinc-800 flex items-center gap-3 bg-slate-50/50 dark:bg-zinc-900/50">
              <Building2 className="w-5 h-5 text-orange-500" />
              <h2 className="font-bold text-slate-800 dark:text-zinc-100">Vínculo Empresarial</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente / Empresa</p>
                <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{user?.client?.name || 'Não vinculado'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CNPJ</p>
                <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">{user?.client?.document || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contato</p>
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-300">
                  <Phone className="w-3.5 h-3.5" />
                  {user?.client?.phone || 'N/A'}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Endereço</p>
                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-300">
                  <MapPin className="w-3.5 h-3.5" />
                  {user?.client?.address?.city} - {user?.client?.address?.state}
                </div>
              </div>
            </div>
            <div className="px-6 py-3 bg-orange-50/50 dark:bg-orange-950/10 border-t border-orange-50 dark:border-orange-900/20">
              <p className="text-[11px] text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Dados vinculados ao seu cadastro no WinThor. Para alterações, contate o comercial.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Password */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden sticky top-24">
            <div className="p-6 border-b border-slate-50 dark:border-zinc-800 flex items-center gap-3 bg-slate-50/50 dark:bg-zinc-900/50">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2 className="font-bold text-slate-800 dark:text-zinc-100">Segurança</h2>
            </div>
            <div className="p-6">
              <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
                <p className="text-xs text-slate-500 mb-2">Altere sua senha de acesso periodicamente para manter sua conta segura.</p>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Senha Atual</label>
                  <Input 
                    {...passwordForm.register('currentPassword')}
                    type="password" 
                    placeholder="••••••••"
                    disabled={isPending}
                    className="bg-white dark:bg-zinc-950"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Nova Senha</label>
                  <Input 
                    {...passwordForm.register('newPassword')}
                    type="password" 
                    placeholder="••••••••"
                    disabled={isPending}
                    className="bg-white dark:bg-zinc-950"
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Confirmar Nova Senha</label>
                  <Input 
                    {...passwordForm.register('confirmPassword')}
                    type="password" 
                    placeholder="••••••••"
                    disabled={isPending}
                    className="bg-white dark:bg-zinc-950"
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isPending} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Atualizar Senha
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
