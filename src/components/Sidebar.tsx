/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Layers, 
  Database, 
  ShoppingCart,
  FileText, 
  Award, 
  BookOpen,
  CloudLightning,
  Settings,
  LogOut,
  Instagram,
  Youtube,
  Linkedin,
  Facebook,
  Github,
  MessageCircle,
  CheckSquare,
  FileClock,
  Calculator,
  Camera,
  Upload,
  User,
  Check,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { 
  getUserAvatar, 
  getUserDisplayName, 
  getUserSubtitle, 
  setUserProfileData,
  getAdminLogo, 
  getColabLogo, 
  getAdminName, 
  getColabName, 
  getAdminSub, 
  getColabSub 
} from '../types';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout?: () => void;
  userRole?: string;
}

export default function Sidebar({ currentView, onViewChange, onLogout, userRole = 'colaborador' }: SidebarProps) {
  const [updateTick, setUpdateTick] = useState(0);

  // Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarLogo, setAvatarLogo] = useState('');
  const [avatarName, setAvatarName] = useState('');
  const [avatarSub, setAvatarSub] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setUpdateTick(t => t + 1);
    window.addEventListener('g3d_visual_settings_updated', handleUpdate);
    return () => window.removeEventListener('g3d_visual_settings_updated', handleUpdate);
  }, []);

  const currentUserRole = userRole || sessionStorage.getItem('g3d_user_role') || 'colaborador';
  const currentUsername = sessionStorage.getItem('g3d_username') || '';
  const currentUserEmail = sessionStorage.getItem('g3d_user_email') || '';

  const logoUrl = getUserAvatar(currentUserRole, currentUsername, currentUserEmail);
  const profileName = getUserDisplayName(currentUserRole, currentUsername, currentUserEmail);
  const profileSubtitle = getUserSubtitle(currentUserRole, currentUsername);

  const openAvatarModal = () => {
    setAvatarLogo(logoUrl);
    setAvatarName(profileName);
    setAvatarSub(profileSubtitle);
    setAvatarSuccess(false);
    setIsAvatarModalOpen(true);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      alert('A foto selecionada é muito grande. Escolha uma imagem de até 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarLogo(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    setUserProfileData(
      currentUserRole,
      currentUsername,
      currentUserEmail,
      avatarLogo.trim(),
      avatarName.trim(),
      avatarSub.trim()
    );

    setAvatarSuccess(true);
    setTimeout(() => {
      setAvatarSuccess(false);
      setIsAvatarModalOpen(false);
    }, 1200);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Comercial', icon: BarChart3, adminOnly: true },
    { id: 'pecas', label: 'Registrar Ordem 3D', icon: Layers, adminOnly: true },
    { id: 'suprimentos', label: 'Insumos & Custos', icon: Database, adminOnly: false },
    { id: 'compras', label: 'Lista de Compras', icon: ShoppingCart },
    { id: 'baixa_compras', label: 'Baixa de Compras', icon: CheckSquare },
    { id: 'compras_efetuadas', label: 'Compras Efetuadas', icon: FileClock },
    { id: 'calculadoras', label: 'Calculadoras Oficina', icon: Calculator },
    { id: 'relatorio', label: 'Fechamento Mensal', icon: FileText, adminOnly: true },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, adminOnly: true },
    { id: 'vercel', label: 'Guia de Deploy Vercel', icon: CloudLightning, highlight: true, adminOnly: true }
  ];

  const visibleItems = menuItems.filter(item => {
    if (userRole === 'colaborador' && item.adminOnly) {
      return false;
    }
    return true;
  });

  return (
    <aside id="sidebar-nav" className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col justify-between p-6 fixed top-0 left-0 no-print z-20 font-sans shadow-sm">
      <div className="flex flex-col">
        {/* LOGO EMBLEM DE EMPRESA & AVATAR */}
        <div className="flex flex-col items-center text-center mb-6 pb-5 border-b border-slate-100 dark:border-slate-800 select-none">
          <div 
            onClick={openAvatarModal}
            className="relative w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden p-0 group transition-all duration-300 cursor-pointer ring-2 ring-indigo-500/20 hover:ring-indigo-500/60 shadow-md"
            title="Clique para alterar seu Avatar / Foto de Perfil"
          >
            <img 
              referrerPolicy="no-referrer"
              src={logoUrl}
              alt="Logo do Usuário"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1 p-1">
              <Camera className="w-5 h-5 text-indigo-300" />
              <span>Mudar Foto</span>
            </div>
          </div>

          <h2 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100 tracking-wide mt-3">
            {profileName}
          </h2>
          <p className="text-[10px] font-mono tracking-[0.18em] text-slate-400 mt-1 uppercase">
            {profileSubtitle}
          </p>
          
          <div className="flex items-center gap-2 mt-2.5">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
              userRole === 'admin' 
                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${userRole === 'admin' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              Acesso: {userRole === 'admin' ? 'Administrador' : 'Colaborador'}
            </span>

            <button
              onClick={openAvatarModal}
              className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 cursor-pointer transition-all"
              title="Mudar imagem de perfil"
            >
              <Camera className="w-2.5 h-2.5" />
              Editar Foto
            </button>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <button
                key={item.id}
                id={`btn-nav-${item.id}`}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 text-left ${
                  isActive 
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border-l-4 border-indigo-600 shadow-sm'
                    : item.highlight 
                      ? 'text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-805/50'
                }`}
              >
                <IconComponent className={`w-5 h-5 ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : item.highlight ? 'text-sky-500' : 'text-slate-400'
                }`} />
                <span className="truncate">{item.label}</span>
                {item.highlight && (
                  <span className="ml-auto flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* MODAL ALTERAR AVATAR & NOME DE PERFIL */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAvatarModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Alterar Avatar de {userRole === 'admin' ? 'Administrador' : 'Colaborador'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Atualize sua foto de perfil e dados de exibição do menu lateral
                </p>
              </div>
            </div>

            {avatarSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Foto de perfil e dados salvos com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleSaveAvatar} className="space-y-4">
              {/* PREVIEW AVATAR */}
              <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/60">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-indigo-500/30 shadow-md mb-2">
                  <img
                    referrerPolicy="no-referrer"
                    src={avatarLogo || logoUrl}
                    alt="Preview Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Pré-visualização do Perfil</span>
              </div>

              {/* UPLOAD FILE OR URL */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Enviar Foto do Celular/Dispositivo
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold cursor-pointer transition">
                    <Upload className="w-4 h-4" />
                    <span>Escolher Imagem / Tirar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Ou Cole o Link da Foto (URL HTTP)
                </label>
                <input
                  type="text"
                  placeholder="https://exemplo.com/minha-foto.png"
                  value={avatarLogo}
                  onChange={(e) => setAvatarLogo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* PROFILE NAME & SUBTITLE */}
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Nome de Exibição
                  </label>
                  <input
                    type="text"
                    required
                    value={avatarName}
                    onChange={(e) => setAvatarName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Legenda do Perfil
                  </label>
                  <input
                    type="text"
                    value={avatarSub}
                    onChange={(e) => setAvatarSub(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Salvar Perfil
                </button>
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOOTER METRICS/INFO */}
      <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-3 text-center select-none bg-white dark:bg-slate-950 -mx-6 -mb-6 p-4 rounded-b-xl space-y-3">
        <div className="flex items-center justify-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase tracking-wider">Sistema Ativo</span>
        </div>
        
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 rounded text-xs font-semibold transition border border-rose-150 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair da Conta
          </button>
        )}

        {/* SOCIAL NETWORKS ROW */}
        <div className="flex items-center justify-center gap-3 py-1 border-t border-b border-slate-105/40">
          <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-500 transition" title="WhatsApp">
            <MessageCircle className="w-4 h-4 text-slate-400 hover:text-[#25D366]" />
          </a>
          <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-pink-600 transition" title="instagram">
            <Instagram className="w-4 h-4" />
          </a>
          <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-red-600 transition" title="youtube">
            <Youtube className="w-4 h-4" />
          </a>
          <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 transition" title="linkedin">
            <Linkedin className="w-4 h-4" />
          </a>
          <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition" title="facebook">
            <Facebook className="w-4 h-4" />
          </a>
          <a href="https://github.com/georgefctech-ship-it" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition" title="github">
            <Github className="w-4 h-4" />
          </a>
        </div>

        <div className="text-[9px] text-slate-400 leading-tight">
          <p className="font-bold text-slate-650">George Ferreira Costa</p>
          <p className="font-mono mt-0.5">© {new Date().getFullYear()} • Todos os Direitos Reservados</p>
        </div>
      </div>
    </aside>
  );
}
