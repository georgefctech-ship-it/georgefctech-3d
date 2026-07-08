/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  MessageCircle
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout?: () => void;
  userRole?: string;
}

export default function Sidebar({ currentView, onViewChange, onLogout, userRole = 'colaborador' }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Comercial', icon: BarChart3, adminOnly: true },
    { id: 'pecas', label: 'Registrar Ordem 3D', icon: Layers, adminOnly: true },
    { id: 'suprimentos', label: 'Insumos & Custos', icon: Database, adminOnly: true },
    { id: 'compras', label: 'Lista de Compras', icon: ShoppingCart },
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

  const logoUrl = userRole === 'colaborador'
    ? "https://lh3.googleusercontent.com/gps-cs-s/APNQkAForRZzi0p_dHcu4q-uB5_6Hmh_ZWM1hwqil-EcrY-fKLUJWx-Z1RHuhgUQTtqJXsV29-B0tbj3CuhgI93tL_ygBJPL6nmLWh2TGr4Imchb-7y8ozTXVOdxt5UFk-PmJqQndhUJLw=w229-h164-n-k-no-nu"
    : "https://vyvompcoiaizoluuxnzx.supabase.co/storage/v1/object/sign/img/meu_logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lYTFhZWQwNC03M2Y5LTQwODQtOWNiOS04ODBkMTA3MzAwY2UiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWcvbWV1X2xvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MTc5NTUxOCwiZXhwIjoxODc2NDAzNTE4fQ.JgHY5piKmwxjB0nfW08joAWsNE-JYRA5kUUkVra9hFI";

  return (
    <aside id="sidebar-nav" className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen flex flex-col justify-between p-6 fixed top-0 left-0 no-print z-20 font-sans shadow-sm">
      <div className="flex flex-col">
        {/* LOGO EMBLEM DE EMPRESA */}
        <div className="flex flex-col items-center text-center mb-8 pb-6 border-b border-slate-100 dark:border-slate-800 select-none">
          <div className="relative w-24 h-24 rounded-full bg-transparent flex items-center justify-center overflow-hidden p-0 group transition-all duration-300">
            <img 
              referrerPolicy="no-referrer"
              src={logoUrl}
              alt="GeorgeFctech Logo"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>

          <h2 className="text-lg font-bold font-display text-slate-800 dark:text-slate-100 tracking-wide mt-3">
            {userRole === 'colaborador' ? 'GeorgeFctech Comercial' : 'GeorgeFctech-3D'}
          </h2>
          <p className="text-[10px] font-mono tracking-[0.18em] text-slate-400 mt-1 uppercase">
            {userRole === 'colaborador' ? 'Pedidos • Compras • Suprimentos' : 'Modelagem • Escultura • Impressão 3D'}
          </p>
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-2.5 ${
            userRole === 'admin' 
              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${userRole === 'admin' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            Acesso: {userRole === 'admin' ? 'Administrador' : 'Colaborador'}
          </span>
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
