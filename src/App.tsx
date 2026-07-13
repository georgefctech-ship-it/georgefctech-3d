/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { use3DState } from './hooks/use3DState';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import RegistrationForm from './components/RegistrationForm';
import InventoryView from './components/InventoryView';
import ShoppingListView from './components/ShoppingListView';
import ReportView from './components/ReportView';
import VercelGuide from './components/VercelGuide';
import SettingsView from './components/SettingsView';
import LoginView from './components/LoginView';
import { 
  Menu, 
  X, 
  Download, 
  Upload, 
  HardDrive,
  Info,
  Sun,
  Moon,
  Instagram,
  Youtube,
  Linkedin,
  Facebook,
  Github,
  MessageCircle
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('g3d_authenticated') === 'true';
  });

  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('g3d_user_role') || 'colaborador';
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('g3d_dark_mode') === 'true';
  });

  useEffect(() => {
    document.title = 'georgefctech-3D';
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('g3d_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('g3d_dark_mode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    if (isAuthenticated) {
      const role = sessionStorage.getItem('g3d_user_role') || 'colaborador';
      setUserRole(role);
      if (role === 'colaborador') {
        setCurrentView('compras');
      }
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    sessionStorage.removeItem('g3d_authenticated');
    setIsAuthenticated(false);
  };

  const {
    projects,
    inventory,
    shopping,
    settings,
    loading,
    supabaseConnected,
    supabaseErrorMsg,
    addProject,
    deleteProject,
    addInventoryItem,
    editInventoryItem,
    deleteInventoryItem,
    updateInventoryQty,
    addShoppingItem,
    deleteShoppingItem,
    updateShoppingItem,
    toggleShoppingItemChecked,
    exportData,
    importData,
    saveSettings
  } = use3DState();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      const success = await importData(result);
      if (success) {
        setImportStatus('Sucesso: Os dados do faturamento foram restaurados!');
        setTimeout(() => setImportStatus(null), 3500);
      } else {
        setImportStatus('Erro: O arquivo enviado é inválido ou está corrompido.');
        setTimeout(() => setImportStatus(null), 3500);
      }
    };
    reader.readAsText(file);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            projects={projects} 
            onDeleteProject={deleteProject} 
            onNavigateToRegister={() => setCurrentView('pecas')}
          />
        );
      case 'pecas':
        return (
          <RegistrationForm 
            inventory={inventory}
            defaultHourlyRate={settings.defaultHourlyRate}
            defaultMaterialRate={settings.defaultMaterialRate}
            defaultProfitMargin={settings.defaultProfitMargin}
            onAddProject={addProject}
            onNavigateToDashboard={() => setCurrentView('dashboard')}
          />
        );
      case 'suprimentos':
        return (
          <InventoryView 
            inventory={inventory}
            onAddInventoryItem={addInventoryItem}
            onDeleteInventoryItem={deleteInventoryItem}
            onUpdateQty={updateInventoryQty}
            onEditInventoryItem={editInventoryItem}
            userRole={userRole}
          />
        );
      case 'compras':
        return (
          <ShoppingListView
            shopping={shopping}
            inventory={inventory}
            onAddShoppingItem={addShoppingItem}
            onDeleteShoppingItem={deleteShoppingItem}
            onUpdateShoppingItem={updateShoppingItem}
            onToggleShoppingItemChecked={toggleShoppingItemChecked}
            onAddInventoryItem={addInventoryItem}
            userRole={userRole}
          />
        );
      case 'baixa_compras':
        return (
          <ShoppingListView
            shopping={shopping}
            inventory={inventory}
            onAddShoppingItem={addShoppingItem}
            onDeleteShoppingItem={deleteShoppingItem}
            onUpdateShoppingItem={updateShoppingItem}
            onToggleShoppingItemChecked={toggleShoppingItemChecked}
            onAddInventoryItem={addInventoryItem}
            userRole={userRole}
            currentSubView="baixa"
          />
        );
      case 'compras_efetuadas':
        return (
          <ShoppingListView
            shopping={shopping}
            inventory={inventory}
            onAddShoppingItem={addShoppingItem}
            onDeleteShoppingItem={deleteShoppingItem}
            onUpdateShoppingItem={updateShoppingItem}
            onToggleShoppingItemChecked={toggleShoppingItemChecked}
            onAddInventoryItem={addInventoryItem}
            userRole={userRole}
            currentSubView="compras_efetuadas"
          />
        );
      case 'calculadoras':
        return (
          <ShoppingListView
            shopping={shopping}
            inventory={inventory}
            onAddShoppingItem={addShoppingItem}
            onDeleteShoppingItem={deleteShoppingItem}
            onUpdateShoppingItem={updateShoppingItem}
            onToggleShoppingItemChecked={toggleShoppingItemChecked}
            onAddInventoryItem={addInventoryItem}
            userRole={userRole}
            currentSubView="calculadoras"
          />
        );
      case 'relatorio':
        return <ReportView projects={projects} />;
      case 'vercel':
        return <VercelGuide />;
      case 'configuracoes':
        return (
          <SettingsView
            settings={settings}
            onSaveSettings={saveSettings}
            onExportData={exportData}
            onImportData={importData}
          />
        );
      default:
        return (
          <DashboardView 
            projects={projects} 
            onDeleteProject={deleteProject} 
            onNavigateToRegister={() => setCurrentView('pecas')}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="relative w-16 h-16 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin mb-4"></div>
          <p className="text-slate-500 text-sm font-mono tracking-wider uppercase">Carregando Banco Local...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginView 
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          setUserRole(sessionStorage.getItem('g3d_user_role') || 'colaborador');
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex text-slate-800 dark:text-slate-100 font-sans print:bg-white print:text-black">
      
      {/* SIDEBAR ON DESKTOP */}
      <div className="hidden lg:block no-print">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} onLogout={handleLogout} userRole={userRole} />
      </div>

      {/* MOBILE HEADER BUTTONS */}
      <header className="lg:hidden w-full h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 fixed top-0 left-0 flex items-center justify-between no-print z-30">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-transparent flex items-center justify-center p-0 overflow-hidden">
            <img 
              referrerPolicy="no-referrer"
              src={userRole === 'colaborador'
                ? "https://lh3.googleusercontent.com/gps-cs-s/APNQkAForRZzi0p_dHcu4q-uB5_6Hmh_ZWM1hwqil-EcrY-fKLUJWx-Z1RHuhgUQTtqJXsV29-B0tbj3CuhgI93tL_ygBJPL6nmLWh2TGr4Imchb-7y8ozTXVOdxt5UFk-PmJqQndhUJLw=w229-h164-n-k-no-nu"
                : "https://vyvompcoiaizoluuxnzx.supabase.co/storage/v1/object/sign/img/meu_logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lYTFhZWQwNC03M2Y5LTQwODQtOWNiOS04ODBkMTA3MzAwY2UiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWcvbWV1X2xvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MTc5NTUxOCwiZXhwIjoxODc2NDAzNTE4fQ.JgHY5piKmwxjB0nfW08joAWsNE-JYRA5kUUkVra9hFI"}
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-sm tracking-wide text-slate-800 dark:text-slate-100">
            {userRole === 'colaborador' ? 'GeorgeFctech Comercial' : 'GeorgeFctech-3D'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Mobile Dark Mode Toggle */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-650 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER SIDEBAR */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm no-print">
          <div className="w-72 h-full bg-white dark:bg-slate-900 flex flex-col justify-between border-r border-slate-200 dark:border-slate-800">
            <Sidebar 
              currentView={currentView} 
              onViewChange={(view) => {
                setCurrentView(view);
                setMobileMenuOpen(false);
              }} 
              onLogout={handleLogout}
              userRole={userRole}
            />
          </div>
          {/* TAP OUTWARDS CLOSER */}
          <div className="absolute inset-y-0 right-0 left-72" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* MAIN CONTAINER CONTENT */}
      <main className="flex-1 w-full lg:pl-72 pt-16 lg:pt-0 max-w-7xl mx-auto flex flex-col min-h-screen">
        
        {/* TOP STATUS RIBBON */}
        <div className="no-print bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 select-none">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            {supabaseConnected ? (
              <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Modo Sincronizado: Conectado ao banco Supabase da empresa de forma ativa!
              </span>
            ) : supabaseErrorMsg ? (
              <span className="flex items-center gap-1.5 font-medium text-amber-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {supabaseErrorMsg}
              </span>
            ) : (
              <span>Modo Local: Dados salvos offline no navegador. Configure o Supabase para sincronização em nuvem.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {importStatus && (
              <span className={`font-semibold mr-1 ${importStatus.startsWith('Erro') ? 'text-rose-600' : 'text-emerald-600'}`}>
                {importStatus}
              </span>
            )}
            
            {/* Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-800 shadow-sm font-medium cursor-pointer"
              title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Modo Escuro</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* COMPONENT FRAME VIEWPORT */}
        <div className="p-6 md:p-8 flex-1">
          {renderView()}
        </div>

        {/* SYSTEM FOOTER WITH COPYRIGHT AND SOCIALS */}
        <footer className="no-print mt-auto bg-white dark:bg-slate-900 border-t border-slate-200/85 dark:border-slate-800 px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 font-sans">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex flex-col sm:flex-row items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 text-center md:text-left">
              <span>© {new Date().getFullYear()} George Ferreira Costa.</span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="text-[10px] text-indigo-600 font-mono">Todos os Direitos Reservados</span>
            </div>
            <p className="text-[10px] text-slate-400 text-center md:text-left">GeorgeFctech 3D Manager • Gestão Profissional para Impressão e Modelagem 3D</p>
          </div>

          <div className="flex items-center gap-2">
            <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-[#25D366] hover:bg-slate-50 rounded-full transition-all" title="WhatsApp">
              <MessageCircle className="w-4 h-4" />
            </a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-pink-600 hover:bg-slate-50 rounded-full transition-all" title="Instagram">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-full transition-all" title="YouTube">
              <Youtube className="w-4 h-4" />
            </a>
            <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 rounded-full transition-all" title="LinkedIn">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-all" title="Facebook">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://github.com/georgefctech-ship-it" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all" title="GitHub">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </footer>

      </main>
    </div>
  );
}
