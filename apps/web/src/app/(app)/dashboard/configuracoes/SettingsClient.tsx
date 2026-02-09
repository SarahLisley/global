'use client';

import { useState, useRef } from 'react';
import clsx from 'clsx';
import { Button, Card, FormField, Input } from '@pgb/ui';

interface SettingsClientProps {
  user?: {
    name: string;
    email: string;
  };
}

export function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nome: user?.name || '',
    email: user?.email || '',
    telefone: '',
    notificacoesEmail: true,
    notificacoesPush: true,
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  const handleSave = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('Configurações salvas com sucesso!');
    }, 1000);
  };

  const handleImageClick = () => {
    console.log('Avatar click triggered');
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    {
      id: 'perfil', label: 'Meu Perfil', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    },
    {
      id: 'notificacoes', label: 'Notificações', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      )
    },
    {
      id: 'seguranca', label: 'Segurança', icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-3">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar de Tabs */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'w-full flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200',
                    activeTab === tab.id
                      ? 'bg-[#4a90e2]/10 text-[#4a90e2] shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
            {activeTab === 'perfil' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="text-xl font-bold text-gray-900">Informações Pessoais</h3>
                  <p className="text-sm text-gray-500 mt-1">Atualize seus dados de cadastro e contato.</p>
                </div>

                <div className="flex items-center gap-6 pb-6">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <div className="relative group cursor-pointer" onClick={handleImageClick}>
                    <div className={clsx(
                      "w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-4 ring-blue-50 overflow-hidden transition-transform group-hover:scale-105",
                      !avatarPreview && "bg-gradient-to-br from-[#4a90e2] to-[#2563eb]"
                    )}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                      ) : (
                        formData.nome.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{formData.nome || 'Usuário'}</h4>
                    <p className="text-sm text-gray-500">{formData.email}</p>
                    <button
                      onClick={handleImageClick}
                      className="text-sm text-[#4a90e2] hover:text-[#2563eb] font-medium mt-1 focus:outline-none"
                    >
                      Alterar foto
                    </button>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField label="Nome Completo">
                    <Input
                      value={formData.nome}
                      onChange={(e: any) => setFormData({ ...formData, nome: e.target.value })}
                      className="bg-gray-50 border-gray-200 text-gray-900 focus:bg-white transition-colors h-11"
                    />
                  </FormField>
                  <FormField label="Email">
                    <Input
                      value={formData.email}
                      disabled
                      className="bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed h-11"
                    />
                  </FormField>
                  <FormField label="Telefone">
                    <Input
                      value={formData.telefone}
                      placeholder="(00) 00000-0000"
                      onChange={(e: any) => setFormData({ ...formData, telefone: e.target.value })}
                      className="bg-gray-50 border-gray-200 text-gray-900 focus:bg-white transition-colors h-11"
                    />
                  </FormField>
                </div>
              </div>
            )}

            {activeTab === 'notificacoes' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="text-xl font-bold text-gray-900">Preferências de Notificação</h3>
                  <p className="text-sm text-gray-500 mt-1">Escolha como deseja ser comunicado.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100/80 transition-colors cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, notificacoesEmail: !prev.notificacoesEmail }))}>
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Notificações por Email</h4>
                        <p className="text-xs text-gray-500">Receba atualizações sobre seus pedidos via email.</p>
                      </div>
                    </div>
                    <div className={clsx(
                      "w-12 h-7 rounded-full transition-colors relative",
                      formData.notificacoesEmail ? "bg-[#4a90e2]" : "bg-gray-300"
                    )}>
                      <div className={clsx(
                        "w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                        formData.notificacoesEmail ? "left-6" : "left-1"
                      )} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100/80 transition-colors cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, notificacoesPush: !prev.notificacoesPush }))}>
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Push Notifications</h4>
                        <p className="text-xs text-gray-500">Receba alertas instantâneos no navegador.</p>
                      </div>
                    </div>
                    <div className={clsx(
                      "w-12 h-7 rounded-full transition-colors relative",
                      formData.notificacoesPush ? "bg-[#4a90e2]" : "bg-gray-300"
                    )}>
                      <div className={clsx(
                        "w-5 h-5 bg-white rounded-full absolute top-1 transition-all shadow-sm",
                        formData.notificacoesPush ? "left-6" : "left-1"
                      )} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'seguranca' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="text-xl font-bold text-gray-900">Segurança</h3>
                  <p className="text-sm text-gray-500 mt-1">Gerencie sua senha e acesso.</p>
                </div>

                <div className="space-y-6 max-w-lg">
                  <FormField label="Senha Atual">
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={formData.senhaAtual}
                      onChange={(e: any) => setFormData({ ...formData, senhaAtual: e.target.value })}
                      className="bg-gray-50 border-gray-200 text-gray-900 focus:bg-white transition-colors h-11"
                    />
                  </FormField>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField label="Nova Senha">
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={formData.novaSenha}
                        onChange={(e: any) => setFormData({ ...formData, novaSenha: e.target.value })}
                        className="bg-gray-50 border-gray-200 text-gray-900 focus:bg-white transition-colors h-11"
                      />
                    </FormField>
                    <FormField label="Confirmar Nova Senha">
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmarSenha}
                        onChange={(e: any) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                        className="bg-gray-50 border-gray-200 text-gray-900 focus:bg-white transition-colors h-11"
                      />
                    </FormField>
                  </div>

                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-600 mt-0.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p className="text-sm text-orange-800">
                      Recomendamos usar uma senha com pelo menos 8 caracteres, incluindo números e símbolos.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 -mx-8 -mb-8 rounded-b-2xl">
              <Button variant="secondary" className="px-6 h-11">Cancelar</Button>
              <Button onClick={handleSave} loading={loading} className="px-8 h-11 bg-[#4a90e2] hover:bg-[#357abd] text-white">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
