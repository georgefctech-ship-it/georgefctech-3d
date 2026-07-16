/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  Save, 
  Database,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Lock,
  Key,
  LogOut,
  ShieldAlert,
  CloudLightning,
  Globe,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Users,
  Check,
  X,
  Shield,
  Trash2,
  Clock,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { SettingsConfig } from '../types';
import { SUPABASE_SQL_BOOTSTRAP, getSupabaseClient, hasSupabaseConfigured } from '../lib/supabase';

interface SettingsViewProps {
  settings: SettingsConfig;
  onSaveSettings: (settings: SettingsConfig) => void;
  onExportData: () => void;
  onImportData: (jsonData: string) => Promise<boolean> | boolean;
}

export default function SettingsView({
  settings,
  onSaveSettings,
  onExportData,
  onImportData
}: SettingsViewProps) {
  const [hourlyRate, setHourlyRate] = useState(String(settings.defaultHourlyRate));
  const [materialRate, setMaterialRate] = useState(String(settings.defaultMaterialRate));
  const [profitMargin, setProfitMargin] = useState(String(settings.defaultProfitMargin));
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // States for Security / Master Password
  const [newPassword, setNewPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState('');

  // States for Supabase
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('g3d_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('g3d_supabase_key') || '');
  const [supabaseConnectionStatus, setSupabaseConnectionStatus] = useState<string | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  // States for collaborator list & approvals
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabError, setCollabError] = useState<string | null>(null);
  const [collabSuccess, setCollabSuccess] = useState<string | null>(null);
  const [newCollabEmail, setNewCollabEmail] = useState('');
  const [newCollabRole, setNewCollabRole] = useState('colaborador_pendente');

  const isPendingRole = (role?: string | null) => {
    const normalizedRole = String(role ?? '').trim().toLowerCase();
    return normalizedRole === 'pendente' || normalizedRole === 'colaborador_pendente' || normalizedRole === 'admin_pendente';
  };

  const getApprovalRole = (role?: string | null) => {
    const normalizedRole = String(role ?? '').trim().toLowerCase();
    return normalizedRole.includes('admin') ? 'admin' : 'colaborador';
  };

  const fetchCollaborators = async () => {
    setCollabLoading(true);
    setCollabError(null);
    
    // Check local storage users
    const localUsersStr = localStorage.getItem('g3d_local_users') || '[]';
    let localUsers: any[] = [];
    try {
      localUsers = JSON.parse(localUsersStr);
    } catch (e) {
      localUsers = [];
    }

    const supabase = getSupabaseClient();
    if (supabase && hasSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('g3d_user_roles')
          .select('*')
          .order('email', { ascending: true });
        if (error) throw error;
        
        // Merge Supabase users and any local users to display them nicely
        const merged = [...(data || [])];
        localUsers.forEach(lu => {
          if (!merged.some(dbu => dbu.email?.toLowerCase() === lu.email?.toLowerCase())) {
            merged.push(lu);
          }
        });
        setCollaborators(merged);
      } catch (err: any) {
        console.warn("Erro ao buscar no Supabase, exibindo locais:", err);
        setCollaborators(localUsers);
      } finally {
        setCollabLoading(false);
      }
    } else {
      setCollaborators(localUsers);
      setCollabLoading(false);
    }
  };

  const handleApproveCollaborator = async (email: string) => {
    setCollabLoading(true);
    setCollabError(null);
    
    // 1. Update in local storage
    const localUsersStr = localStorage.getItem('g3d_local_users') || '[]';
    let localUsers: any[] = [];
    try {
      localUsers = JSON.parse(localUsersStr);
    } catch (e) {}
    
    const targetUser = localUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
    const nextRole = getApprovalRole(targetUser?.role);

    localUsers = localUsers.map(u => {
      if (u.email?.toLowerCase() === email.toLowerCase()) {
        return { ...u, role: nextRole };
      }
      return u;
    });
    localStorage.setItem('g3d_local_users', JSON.stringify(localUsers));

    // 2. Update in Supabase
    const supabase = getSupabaseClient();
    if (supabase && hasSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('g3d_user_roles')
          .update({ role: nextRole })
          .eq('email', email);
        if (error) throw error;
      } catch (err: any) {
        console.error("Erro ao atualizar no Supabase:", err);
      }
    }

    setCollabSuccess(`Acesso do colaborador ${email} liberado com sucesso!`);
    await fetchCollaborators();
    setTimeout(() => setCollabSuccess(null), 3500);
    setCollabLoading(false);
  };

  const handleBlockCollaborator = async (email: string) => {
    setCollabLoading(true);
    setCollabError(null);

    // 1. Update in local storage
    const localUsersStr = localStorage.getItem('g3d_local_users') || '[]';
    let localUsers: any[] = [];
    try {
      localUsers = JSON.parse(localUsersStr);
    } catch (e) {}

    const targetUser = localUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
    const nextRole = targetUser?.role?.toLowerCase().includes('admin') ? 'admin_pendente' : 'colaborador_pendente';

    localUsers = localUsers.map(u => {
      if (u.email?.toLowerCase() === email.toLowerCase()) {
        return { ...u, role: nextRole };
      }
      return u;
    });
    localStorage.setItem('g3d_local_users', JSON.stringify(localUsers));

    // 2. Update in Supabase
    const supabase = getSupabaseClient();
    if (supabase && hasSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('g3d_user_roles')
          .update({ role: nextRole })
          .eq('email', email);
        if (error) throw error;
      } catch (err: any) {
        console.error("Erro ao suspender no Supabase:", err);
      }
    }

    setCollabSuccess(`Acesso de ${email} suspenso/colocado em pendência.`);
    await fetchCollaborators();
    setTimeout(() => setCollabSuccess(null), 3500);
    setCollabLoading(false);
  };

  const handleChangeRole = async (email: string, newRole: string) => {
    setCollabLoading(true);
    setCollabError(null);

    // 1. Update in local storage
    const localUsersStr = localStorage.getItem('g3d_local_users') || '[]';
    let localUsers: any[] = [];
    try {
      localUsers = JSON.parse(localUsersStr);
    } catch (e) {}

    localUsers = localUsers.map(u => {
      if (u.email?.toLowerCase() === email.toLowerCase()) {
        return { ...u, role: newRole };
      }
      return u;
    });
    localStorage.setItem('g3d_local_users', JSON.stringify(localUsers));

    // 2. Update in Supabase
    const supabase = getSupabaseClient();
    if (supabase && hasSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('g3d_user_roles')
          .update({ role: newRole })
          .eq('email', email);
        if (error) throw error;
      } catch (err: any) {
        console.error("Erro ao alterar cargo no Supabase:", err);
      }
    }

    setCollabSuccess(`Cargo de ${email} alterado para ${newRole === 'admin' ? 'Administrador' : (newRole === 'colaborador' ? 'Colaborador Ativo' : 'Pendente')}!`);
    await fetchCollaborators();
    setTimeout(() => setCollabSuccess(null), 3500);
    setCollabLoading(false);
  };

  const handleDeleteCollaborator = async (email: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o colaborador ${email} do sistema?`)) {
      return;
    }
    setCollabLoading(true);
    setCollabError(null);

    // 1. Delete in local storage
    const localUsersStr = localStorage.getItem('g3d_local_users') || '[]';
    let localUsers: any[] = [];
    try {
      localUsers = JSON.parse(localUsersStr);
    } catch (e) {}

    localUsers = localUsers.filter(u => u.email?.toLowerCase() !== email.toLowerCase());
    localStorage.setItem('g3d_local_users', JSON.stringify(localUsers));

    // 2. Delete in Supabase
    const supabase = getSupabaseClient();
    if (supabase && hasSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('g3d_user_roles')
          .delete()
          .eq('email', email);
        if (error) throw error;
      } catch (err: any) {
        console.error("Erro ao deletar no Supabase:", err);
      }
    }

    setCollabSuccess(`Cadastro de ${email} foi excluído do sistema!`);
    await fetchCollaborators();
    setTimeout(() => setCollabSuccess(null), 3500);
    setCollabLoading(false);
  };

  const handleAddCollaboratorDirectly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollabEmail.trim()) return;
    setCollabLoading(true);
    setCollabError(null);

    const emailVal = newCollabEmail.trim().toLowerCase();

    // 1. Add/Upsert in local storage
    const localUsersStr = localStorage.getItem('g3d_local_users') || '[]';
    let localUsers: any[] = [];
    try {
      localUsers = JSON.parse(localUsersStr);
    } catch (e) {}

    const existingIdx = localUsers.findIndex(u => u.email?.toLowerCase() === emailVal);
    if (existingIdx >= 0) {
      localUsers[existingIdx] = { ...localUsers[existingIdx], role: newCollabRole };
    } else {
      localUsers.push({
        email: emailVal,
        username: emailVal.split('@')[0],
        password: '123', // Default password for pre-added
        role: newCollabRole
      });
    }
    localStorage.setItem('g3d_local_users', JSON.stringify(localUsers));

    // 2. Update/Upsert in Supabase
    const supabase = getSupabaseClient();
    if (supabase && hasSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('g3d_user_roles')
          .upsert({
            email: emailVal,
            role: newCollabRole,
            username: emailVal.split('@')[0],
            password: '123'
          });
        if (error) throw error;
      } catch (err: any) {
        console.error("Erro ao cadastrar diretamente no Supabase:", err);
      }
    }

    setCollabSuccess(`Colaborador ${newCollabEmail} registrado diretamente no sistema!`);
    setNewCollabEmail('');
    await fetchCollaborators();
    setTimeout(() => setCollabSuccess(null), 3500);
    setCollabLoading(false);
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseConnectionStatus('Conectando...');

    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      localStorage.removeItem('g3d_supabase_url');
      localStorage.removeItem('g3d_supabase_key');
      setSupabaseConnectionStatus('Chaves de conexão limpas. Reiniciando em modo local...');
      setTimeout(() => window.location.reload(), 1500);
      return;
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const testClient = createClient(supabaseUrl.trim(), supabaseKey.trim());
      
      // Ping tables
      const { error } = await testClient.from('g3d_user_roles').select('role').limit(1);
      
      if (error) {
        throw error;
      }

      localStorage.setItem('g3d_supabase_url', supabaseUrl.trim());
      localStorage.setItem('g3d_supabase_key', supabaseKey.trim());
      setSupabaseConnectionStatus('Sucesso: Conectado e autenticado! Reiniciando seu console de gestão...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      localStorage.setItem('g3d_supabase_url', supabaseUrl.trim());
      localStorage.setItem('g3d_supabase_key', supabaseKey.trim());
      setSupabaseConnectionStatus(`Alerta: Credenciais salvas, mas houve erro no ping. Verifique se você executou o código SQL no console do Supabase para inicializar as tabelas.`);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('g3d_authenticated');
    window.location.reload();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    const cleanPass = newPassword.trim();
    if (cleanPass.length < 4) {
      setPwError('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    localStorage.setItem('g3d_master_password', cleanPass);
    
    // Sync to Supabase in background if active
    const supabase = getSupabaseClient();
    if (supabase && hasSupabaseConfigured()) {
      try {
        await supabase.from('g3d_user_roles').upsert({
          email: 'system_master_password',
          role: cleanPass
        });
      } catch (err) {
        console.error("Erro ao sincronizar nova senha mestra no Supabase:", err);
      }
    }

    setNewPassword('');
    setPwSuccess(true);
    setTimeout(() => setPwSuccess(false), 3500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    const hRate = parseFloat(hourlyRate) || 0;
    const mRate = parseFloat(materialRate) || 0;
    const pMargin = parseFloat(profitMargin) || 0;

    onSaveSettings({
      defaultHourlyRate: hRate,
      defaultMaterialRate: mRate,
      defaultProfitMargin: pMargin
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result as string;
        const success = await onImportData(result);
        if (success) {
          setImportStatus({
            type: 'success',
            text: 'Dados de faturamento e inventário restaurados com sucesso!'
          });
          // Reload settings values in inputs
          const parsed = JSON.parse(result);
          if (parsed.settings) {
            setHourlyRate(String(parsed.settings.defaultHourlyRate));
            setMaterialRate(String(parsed.settings.defaultMaterialRate));
            setProfitMargin(String(parsed.settings.defaultProfitMargin));
          }
        } else {
          setImportStatus({
            type: 'error',
            text: 'O arquivo enviado não contém uma estrutura de backup compatível.'
          });
        }
      } catch (err) {
        setImportStatus({
          type: 'error',
          text: 'Falha crítica ao ler o arquivo JSON. Certifique-se de que o arquivo está íntegro.'
        });
      }
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="font-sans antialiased text-slate-800">
      {/* HEADER */}
      <div className="mb-8 pb-5 border-b border-slate-200">
        <h1 className="text-3xl font-bold font-display tracking-tight text-slate-950 mb-1">
          Configurações Gerais do Sistema
        </h1>
        <p className="text-sm text-slate-500">
          Gerencie taxas de operação de impressora, margens padrões do faturamento local, e realize cópias de backup de segurança.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PARTE ESQUERDA: PARÂMETROS COMERCIAIS */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-2">
              <Settings className="w-5 h-5 text-indigo-650" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Parâmetros Padrões para Precificação
              </h3>
            </div>

            {saveSuccess && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Preferências comerciais salvas com sucesso no banco de dados local!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-650 uppercase tracking-wide flex items-center gap-1">
                  Hora de Impressão (R$)
                  <span title="Custo de operação por hora da impressora 3D, cobrindo consumo elétrico, bicos de extrusão e depreciação física." className="text-slate-450 cursor-help">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white font-mono transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-650 uppercase tracking-wide flex items-center gap-1">
                  Valor por Grama Padrão (R$)
                  <span title="Taxa operacional padrão de filamento por grama, usada caso nenhum insumo específico do inventário seja selecionado no formulário." className="text-slate-450 cursor-help">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={materialRate}
                  onChange={(e) => setMaterialRate(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white font-mono transition-all"
                />
                <span className="text-[10px] text-slate-450 font-mono">Geralmente R$ 0.15 a R$ 0.35 por grama</span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-650 uppercase tracking-wide flex items-center gap-1">
                  Margem de Lucro Fixa (R$)
                  <span title="Margem de segurança inicial aplicada no cálculo final para remunerar a preparação de arquivos, suporte de software e embalagem." className="text-slate-450 cursor-help">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={profitMargin}
                  onChange={(e) => setProfitMargin(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white font-mono transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Save className="w-4 h-4" />
                Salvar Preferências Comercias
              </button>
            </div>
          </form>

          {/* TRIVIA CARD INFO */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-500" />
              Funcionamento do Algoritmo de Margens
            </h4>
            <p className="leading-relaxed">
              Os dados técnicos inseridos nesta tela preenchem automaticamente os campos iniciais ao registrar novas ordens industriais, simplificando o preenchimento de propostas de serviços.
            </p>
            <p className="leading-relaxed font-mono text-[10px] text-indigo-600 font-bold">
              Fórmula de ganho: (Tempo de modelagem/processamento * Custo Técnico) + (Massa do Polímero * Custo Insumo) + Lucro de Lacre.
            </p>
          </div>

          {/* SUPABASE CONNECTION SETTINGS CARD */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CloudLightning className="w-5 h-5 text-indigo-650" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Sincronização em Nuvem (Supabase)
                </h3>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                localStorage.getItem('g3d_supabase_url') 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {localStorage.getItem('g3d_supabase_url') ? 'Módulo Cloud Ativo' : 'Apenas Local'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Conecte seu console do <strong>GeorgeFctech 3D</strong> à sua própria conta de nuvem do Supabase. Isso permite que colaboradores registrem estoques, consultem listas de compras de qualquer navegador, mantendo todos os dados unificados e sincronizados em tempo real!
            </p>

            {supabaseConnectionStatus && (
              <div className={`p-4 rounded-lg text-xs flex items-start gap-2.5 border ${
                supabaseConnectionStatus.includes('Sucesso')
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : supabaseConnectionStatus.includes('Alerta')
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-800'
              }`}>
                <Database className="w-4.5 h-4.5 text-indigo-650 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{supabaseConnectionStatus}</span>
              </div>
            )}

            <form onSubmit={handleSaveSupabase} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 font-sans">
                  <label className="text-[10px] pr-2 font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzsomeid.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5 font-sans">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    Supabase anon key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Salvar &amp; Testar Conexão
                </button>
                
                {supabaseUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setSupabaseUrl('');
                      setSupabaseKey('');
                      localStorage.removeItem('g3d_supabase_url');
                      localStorage.removeItem('g3d_supabase_key');
                      setSupabaseConnectionStatus('Conexão excluída com sucesso! Recarregando sistema local...');
                      setTimeout(() => window.location.reload(), 1500);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-805 font-semibold cursor-pointer transition"
                  >
                    Desconectar Nuvem
                  </button>
                )}
              </div>
            </form>

            {/* SEPARADOR DE PROCEDIMENTOS */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setShowSqlGuide(!showSqlGuide)}
                className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-700 hover:text-slate-950 transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-500" />
                  Como Configurar seu Banco Supabase (Instruções Importantes)
                </span>
                {showSqlGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSqlGuide && (
                <div className="mt-3 text-slate-605 text-xs space-y-3 leading-relaxed bg-slate-50 p-4 border border-slate-150 rounded-xl animate-[fadeIn_0.2s_ease-out]">
                  <p>
                    Para que a sincronização funcione perfeitamente, você deve inicializar as tabelas no seu projeto do Supabase. Siga estes 3 passos fáceis:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 font-sans">
                    <li>Copie o script SQL abaixo clicando no botão de copiar ou selecionando o código.</li>
                    <li>Acesse o console do seu projeto no <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 font-bold">Supabase <ExternalLink className="w-3 h-3" /></a> e clique em <strong>SQL Editor</strong> na barra lateral esquerda.</li>
                    <li>Clique em <strong>New Query</strong>, cole todo o script contido na caixa amarela abaixo e execute-o (clique em <strong>Run</strong>).</li>
                  </ol>

                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Script SQL de Inicialização</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(SUPABASE_SQL_BOOTSTRAP);
                          alert('Código do script de bootstrap copiado com sucesso! Agora cole no SQL Editor do seu Supabase.');
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold bg-white px-2 py-1 rounded border border-slate-200 transition shadow-xs cursor-pointer"
                      >
                        Copiar Script SQL
                      </button>
                    </div>
                    <pre className="bg-slate-900 border border-slate-800 text-[#edf2f7] p-4 rounded-lg text-[10px] overflow-x-auto font-mono max-h-56">
                      {SUPABASE_SQL_BOOTSTRAP}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PARTE DIREITA: BACKUP E RESTAURAR (ADMINISTRATIVA) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Database className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Backup & Integridade de Dados
              </h3>
            </div>

            {importStatus && (
              <div className={`p-4 rounded-lg text-xs leading-normal flex items-start gap-2 ${
                importStatus.type === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {importStatus.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <span>{importStatus.text}</span>
              </div>
            )}

            <p className="text-xs text-slate-500 leading-relaxed">
              Como todos os dados ficam gravados exclusivamente no seu navegador (LocalStorage), recomendamos que você faça backups periódicos, especialmente antes de limpar os dados de navegação.
            </p>

            {/* SEÇÃO DE BOTÕES ADMINISTRATIVOS */}
            <div className="space-y-3 pt-2">
              {/* Baixar arquivo */}
              <div className="p-3 border border-slate-100 hover:border-indigo-100 rounded-lg bg-slate-50/50 transition">
                <span className="block text-xs font-bold text-slate-700 mb-1">Exportar banco:</span>
                <p className="text-[11px] text-slate-500 mb-2">Baixa um arquivo JSON com todos os seus registros de ordem, inventários, e listas de compra.</p>
                <button
                  onClick={onExportData}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-150 transition"
                  title="Exportar arquivo JSON"
                >
                  <Download className="w-4 h-4" />
                  BAIXAR BACKUP (.JSON)
                </button>
              </div>

              {/* Subir arquivo */}
              <div className="p-3 border border-slate-100 hover:border-amber-100 rounded-lg bg-slate-50/50 transition">
                <span className="block text-xs font-bold text-slate-700 mb-1">Restaurar banco:</span>
                <p className="text-[11px] text-slate-500 mb-2">Substitui os dados atuais do navegador pelos dados gravados de um arquivo de backup anterior.</p>
                <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-lg border border-amber-150 cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  RESTAURAR BACKUP (.JSON)
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* CARD DE SEGURANÇA & ACESSO */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lock className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Segurança &amp; Acesso Externo
              </h3>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Configure sua senha de acesso para proteger o GeorgeFctech-3D de navegações externas indesejadas via Cloudflare Tunnel ou rede local.
            </p>

            {pwError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Senha mestra atualizada com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 pt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Nova Senha Mestra
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Mínimo 4 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white font-mono transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition"
              >
                <Key className="w-4 h-4" />
                Ativar Nova Senha Mestra
              </button>
            </form>

            <div className="border-t border-slate-100 pt-4 mt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-150 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                LOGOUT / SAIR DO SISTEMA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO INTEGRAL: CONTROLE E APROVAÇÃO DE COLABORADORES */}
      <div className="mt-8 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 mb-6 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-650 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Controle de Acessos &amp; Aprovação de Colaboradores
              </h3>
              <p className="text-xs text-slate-500">
                Aprove cadastros pendentes, mude cargos ou bloqueie acessos em tempo real com a sincronização cloud.
              </p>
            </div>
          </div>
          <button
            onClick={fetchCollaborators}
            disabled={collabLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-950 text-xs font-semibold rounded-lg border border-slate-200 transition disabled:opacity-50 cursor-pointer"
            title="Recarregar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${collabLoading ? 'animate-spin' : ''}`} />
            Atualizar Lista
          </button>
        </div>

        {collabError && (
          <div className="mb-4 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-[fadeIn_0.2s_ease-out]">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{collabError}</span>
          </div>
        )}

        {collabSuccess && (
          <div className="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{collabSuccess}</span>
          </div>
        )}

        {!hasSupabaseConfigured() && (
          <div className="p-3 mb-4 bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] rounded-lg flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <span>
              <strong>Armazenamento Local Ativo:</strong> Seus colaboradores e aprovações estão salvos neste navegador. Ative a Sincronização Cloud acima se quiser usar banco na nuvem.
            </span>
          </div>
        )}

        <div className="space-y-6">
            {/* FORMULÁRIO DE PRÉ-CADASTRO / REGISTRO DIRETO CO-LAB */}
            <form onSubmit={handleAddCollaboratorDirectly} className="bg-slate-50/50 p-4 border border-slate-200 rounded-lg">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-705 mb-3 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-indigo-500" />
                Registrar ou Pré-Aprovar Email de Colaborador
              </h4>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail do Colaborador</label>
                  <input
                    type="email"
                    required
                    placeholder="exemplo@colaborador.com"
                    value={newCollabEmail}
                    onChange={(e) => setNewCollabEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="w-full md:w-56 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Acesso Autorizado?</label>
                  <select
                    value={newCollabRole}
                    onChange={(e) => setNewCollabRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="colaborador_pendente">Pendente de Aprovação (Bloqueado)</option>
                    <option value="colaborador">Colaborador Ativo (Acesso Liberado)</option>
                    <option value="admin">Administrador (Controle Total)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={collabLoading}
                  className="w-full md:w-auto px-5 py-2 hover:bg-slate-900 bg-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>

            {/* TABELA DE COLABORADORES */}
            {collaborators.length === 0 ? (
              <div className="text-center py-6 text-slate-405 text-xs">
                Nenhum colaborador registrado no banco de dados.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-3 pl-4">Colaborador / E-mail</th>
                        <th className="p-3">Cargo Atual</th>
                        <th className="p-3">Estado de Acesso</th>
                        <th className="p-3 text-right pr-4">Ações do Administrador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {collaborators.map((collab) => {
                        const isPending = isPendingRole(collab.role);
                        const isAdmin = collab.role === 'admin' || collab.role === 'admin_pendente';
                        const isActive = !isPending && !isAdmin && collab.role === 'colaborador';
                        const isSelf = collab.email?.trim().toLowerCase() === sessionStorage.getItem('g3d_user_email')?.trim().toLowerCase();

                        return (
                          <tr key={collab.email} className={`hover:bg-slate-50/50 transition-colors ${isPending ? 'bg-amber-500/[0.02]' : ''}`}>
                            <td className="p-3 pl-4">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-905 text-sm">{collab.username || 'Sem usuário'}</span>
                                  {isSelf && (
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-650 text-[9px] font-extrabold uppercase scale-90">VOCÊ</span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-500 font-mono truncate">{collab.email}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                {isAdmin ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                    <Shield className="w-3 h-3" />
                                    Administrador
                                  </span>
                                ) : isActive ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                    Colaborador
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                    Pendente
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              {isPending ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600">
                                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                                  Aguardando Liberação
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-605">
                                  <Check className="w-3.5 h-3.5" />
                                  Acesso Liberado
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right pr-4">
                              <div className="flex items-center justify-end gap-2.5">
                                {isPending && (
                                  <button
                                    onClick={() => handleApproveCollaborator(collab.email)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-md shadow-sm transition cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Liberar Acesso
                                  </button>
                                )}

                                {isActive && (
                                  <button
                                    onClick={() => handleBlockCollaborator(collab.email)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-semibold rounded-md transition cursor-pointer"
                                    title="Pausar / Bloquear acesso"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Bloquear
                                  </button>
                                )}

                                {!isSelf && (
                                  <div className="relative inline-flex">
                                    <select
                                      value={collab.role}
                                      onChange={(e) => handleChangeRole(collab.email, e.target.value)}
                                      className="py-1 px-1.5 pr-6 bg-slate-50 text-slate-700 text-[11px] font-medium rounded border border-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                    >
                                      <option value="colaborador_pendente">Mudar cargo...</option>
                                      <option value="colaborador_pendente">Pendente</option>
                                      <option value="colaborador">Colaborador</option>
                                      <option value="admin">Administrador</option>
                                    </select>
                                  </div>
                                )}

                                {!isSelf && (
                                  <button
                                    onClick={() => handleDeleteCollaborator(collab.email)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                    title="Excluir Colaborador"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
