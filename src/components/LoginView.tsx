/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Cpu, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  Database,
  Mail,
  UserPlus,
  LogIn,
  Users,
  Sun,
  Moon
} from 'lucide-react';
import { getSupabaseClient, hasSupabaseConfigured } from '../lib/supabase';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'colaborador'>('admin');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [hasMasterPassword, setHasMasterPassword] = useState(!!localStorage.getItem('g3d_master_password'));
  const [showPassword, setShowPassword] = useState(false);
  const [supabaseActive, setSupabaseActive] = useState(false);
  
  // Recovery/Forgot Password states
  const [email, setEmail] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Feedback states
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Theme state
  const [localDarkMode, setLocalDarkMode] = useState(() => {
    return localStorage.getItem('g3d_dark_mode') === 'true';
  });

  // Sync theme
  useEffect(() => {
    if (localDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [localDarkMode]);

  const toggleLocalDarkMode = () => {
    const nextVal = !localDarkMode;
    setLocalDarkMode(nextVal);
    localStorage.setItem('g3d_dark_mode', nextVal ? 'true' : 'false');
  };

  useEffect(() => {
    const supabaseConfigured = hasSupabaseConfigured();
    // Check if master password exists in localStorage
    const savedPassword = localStorage.getItem('g3d_master_password');
    setHasMasterPassword(!!savedPassword);
    
    if (supabaseConfigured) {
      setSupabaseActive(true);
      setIsFirstAccess(false);

      // Centralized Check: If not in localStorage, check if it's already registered on Supabase query!
      if (!savedPassword) {
        const checkMasterGlobal = async () => {
          const supabase = getSupabaseClient();
          if (supabase) {
            try {
              const { data } = await supabase
                .from('g3d_user_roles')
                .select('role')
                .eq('email', 'system_master_password')
                .maybeSingle();
              if (data?.role) {
                setHasMasterPassword(true);
                setIsFirstAccess(false);
              } else {
                setIsFirstAccess(true);
              }
            } catch (err) {
              console.error("Erro ao checar senha mestra global:", err);
            }
          }
        };
        checkMasterGlobal();
      }
    } else if (!savedPassword) {
      // Se a nuvem não está configurada e não temos senha mestra, precisamos cadastrar a senha mestra
      setSupabaseActive(false);
      setIsFirstAccess(true);
    } else {
      // Se a nuvem não está configurada mas já temos senha mestra cadastrada, carregamos o formulário de login local direto
      setSupabaseActive(false);
      setIsFirstAccess(false);
    }

    // Check if redirecting from a recovery link
    const hash = window.location.hash || '';
    if (hash.includes('type=recovery') || (hash.includes('access_token=') && hash.includes('type='))) {
      if (!hash.includes('error=')) {
        setIsResettingPassword(true);
      } else {
        setError('O link de recuperação de senha expirou ou é inválido. Por favor, tente novamente.');
      }
    }
  }, []);

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 4) {
      setError('A senha deve conter pelo menos 4 caracteres.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      setLoading(false);
      return;
    }

    // Save master password configuration locally
    localStorage.setItem('g3d_master_password', password);
    setHasMasterPassword(true);
    
    // Save to Supabase globally if active
    const supabase = getSupabaseClient();
    if (supabase && hasSupabaseConfigured()) {
      try {
        await supabase.from('g3d_user_roles').upsert({
          email: 'system_master_password',
          role: password
        });
      } catch (upsertErr) {
        console.error("Erro ao salvar senha mestra global no Supabase:", upsertErr);
      }
    }

    const finalUsername = userName.trim() || (selectedRole === 'admin' ? 'Administrador' : 'Colaborador');
    sessionStorage.setItem('g3d_authenticated', 'true');
    sessionStorage.setItem('g3d_user_role', selectedRole);
    sessionStorage.setItem('g3d_username', finalUsername);
    
    setLoading(false);
    setSuccessMsg('Senha Mestra configurada com sucesso!');
    setTimeout(() => {
      onLoginSuccess();
    }, 1500);
  };

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const savedPassword = localStorage.getItem('g3d_master_password');
    const finalUsername = userName.trim() || (selectedRole === 'admin' ? 'Administrador' : 'Colaborador');
    
    // Check local storage first
    if (savedPassword && password === savedPassword) {
      sessionStorage.setItem('g3d_authenticated', 'true');
      sessionStorage.setItem('g3d_user_role', selectedRole);
      sessionStorage.setItem('g3d_username', finalUsername);
      setLoading(false);
      onLoginSuccess();
      return;
    }

    // Fallback: Check Supabase global master password
    const supabase = getSupabaseClient();
    if (supabase && hasSupabaseConfigured()) {
      try {
        const { data, error: queryErr } = await supabase
          .from('g3d_user_roles')
          .select('role')
          .eq('email', 'system_master_password')
          .maybeSingle();

        if (queryErr) throw queryErr;

        if (data && data.role === password) {
          // Synchronize locally for offline speed/redundancy
          localStorage.setItem('g3d_master_password', password);
          setHasMasterPassword(true);
          sessionStorage.setItem('g3d_authenticated', 'true');
          sessionStorage.setItem('g3d_user_role', selectedRole);
          sessionStorage.setItem('g3d_username', finalUsername);
          setLoading(false);
          onLoginSuccess();
          return;
        }
      } catch (err: any) {
        console.error("Erro de rede ao validar senha mestra:", err);
      }
    }

    setLoading(false);
    setError('Senha incorreta. Por favor, tente novamente.');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const userEmail = email.trim().toLowerCase();
    if (!userEmail) {
      setError('Por favor, informe seu endereço de e-mail cadastrado.');
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('O cliente Supabase não pôde ser iniciado.');
      setLoading(false);
      return;
    }

    try {
      // Verification: Check if the email belongs to an administrator or collaborator to prevent arbitrary requests
      const { data: roleData, error: roleErr } = await supabase
        .from('g3d_user_roles')
        .select('role')
        .eq('email', userEmail)
        .maybeSingle();

      if (roleErr) throw roleErr;

      // Allow recovery for registered system users (like georgefctec@gmail.com)
      if (!roleData) {
        setError('Este e-mail não está cadastrado ou autorizado no sistema GeorgeFctech-3D.');
        setLoading(false);
        return;
      }

      // Supabase Auth reset password call
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: window.location.origin
      });

      if (resetErr) throw resetErr;

      setSuccessMsg('E-mail enviado! Verifique sua caixa de entrada para redefinir a senha do sistema.');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (password.length < 4) {
      setError('A nova senha deve possuir no mínimo 4 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('A confirmação da nova senha está diferente.');
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('O cliente Supabase não pôde ser iniciado.');
      setLoading(false);
      return;
    }

    try {
      // 1. Update master password globally in the user_roles table
      const { error: dbErr } = await supabase.from('g3d_user_roles').upsert({
        email: 'system_master_password',
        role: password
      });

      if (dbErr) throw dbErr;

      // 2. Also update the user's password in Supabase Auth (since they clicked the recovery link, they are logged in)
      try {
        await supabase.auth.updateUser({ password: password });
      } catch (authErr) {
        console.warn("Aviso ao atualizar senha auth:", authErr);
      }

      // 3. Save locally in localStorage
      localStorage.setItem('g3d_master_password', password);
      setHasMasterPassword(true);

      setSuccessMsg('Senha de acesso única redefinida com sucesso! Redirecionando...');
      setPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        setIsResettingPassword(false);
        setIsForgotPassword(false);
        setSuccessMsg(null);
        window.location.hash = ''; // Clear hash
        onLoginSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-4 font-sans antialiased text-slate-800 dark:text-slate-100 selection:bg-indigo-500 selection:text-white relative">
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleLocalDarkMode}
          className="p-2.5 rounded-full bg-slate-100/50 dark:bg-slate-900/60 hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition shadow-sm cursor-pointer"
          title={localDarkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
        >
          {localDarkMode ? <Sun className="w-4.5 h-4.5 text-amber-500 animate-[spin_10s_linear_infinite]" /> : <Moon className="w-4.5 h-4.5" />}
        </button>
      </div>

      {/* Background radial soft light gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(55,48,163,0.08)_0%,transparent_65%)] pointer-events-none" />

      <div className="w-full max-w-md z-10 transition-all duration-300">
        
        {/* LOGO AREA */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-24 h-24 p-0 bg-transparent rounded-full mb-4 overflow-hidden transition-all duration-300">
            <img 
              referrerPolicy="no-referrer"
              src="https://vyvompcoiaizoluuxnzx.supabase.co/storage/v1/object/sign/img/meu_logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lYTFhZWQwNC03M2Y5LTQwODQtOWNiOS04ODBkMTA3MzAwY2UiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWcvbWV1X2xvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MTc5NTUxOCwiZXhwIjoxODc2NDAzNTE4fQ.JgHY5piKmwxjB0nfW08joAWsNE-JYRA5kUUkVra9hFI"
              alt="GeorgeFctech 3D Logo"
              className="w-full h-full object-cover transition-transform duration-350 hover:scale-110"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
            GeorgeFctech 3D
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pb-1">
            Gestor de Suprimentos &amp; Precificação
          </p>
        </div>

        {/* LOGIN CONTAINER CARD */}
        <div className="bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-xl dark:shadow-2xl shadow-slate-200/50 dark:shadow-black/85 backdrop-blur-md">
          
          {isFirstAccess ? (
            // CONFIGURING INITIAL LOCAL MASTER PASSWORD
            <form onSubmit={handleSetupPassword} className="space-y-5">
              <div className="space-y-1.5 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  Configuração de Primeiro Acesso
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Defina sua Senha Mestra
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Crie uma senha de segurança para proteger seus cálculos comerciais de acessos não autorizados. No futuro, você poderá ativar a sincronização na nuvem com o seu Supabase.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Nova Senha Mestra
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo de 4 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-600 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Confirme a Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Repita a senha escrita"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-600 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 mt-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg cursor-pointer"
              >
                Configurar e Entrar
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => { setIsFirstAccess(false); setError(null); }}
                className="w-full text-center mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition cursor-pointer"
              >
                Voltar para o Login
              </button>
            </form>
          ) : isResettingPassword ? (
            // PASSWORD RESET/CHOOSE NEW PASSWORD VIEW
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider font-sans">
                  Recuperação de Acesso
                </span>
                <h3 className="text-slate-900 dark:text-white font-bold text-sm">Defina a Nova Senha do Sistema</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Insira e confirme a nova senha de acesso única que será utilizada por todos os usuários do sistema.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 font-sans">Nova Senha Única</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo de 4 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 font-sans">Confirme a Nova Senha</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Digite a senha novamente"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 mt-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-50 cursor-pointer animate-[pulse_3s_infinite]"
              >
                {loading ? 'Salvando...' : 'Atualizar e Gravar Senha'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          ) : isForgotPassword ? (
            // FORGOT PASSWORD EMAIL REQUEST VIEW
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider font-sans">
                  Recuperação de Acesso
                </span>
                <h3 className="text-slate-900 dark:text-white font-bold text-sm">Recuperar Senha do Sistema</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Insira o seu e-mail cadastrado (de Administrador ou Colaborador) para receber um link de redefinição de senha por e-mail.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 font-sans">Seu E-mail Cadastrado</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="seu-email@provedor.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 mt-4 px-5 py-3 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(null); setSuccessMsg(null); }}
                className="w-full text-center mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition cursor-pointer"
              >
                Voltar para o Login
              </button>
            </form>
          ) : (
            // SINGLE UNIQUE SYSTEM LOGIN
            <form onSubmit={handleMasterLogin} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-slate-900 dark:text-white font-bold text-sm">Painel de Acesso Único</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Insira a chave de acesso única para entrar no sistema. Escolha o perfil desejado.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs rounded-lg flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* ROLE SELECTOR */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Selecione seu Perfil de Acesso
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all cursor-pointer ${
                      selectedRole === 'admin'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    Administrador
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('colaborador')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all cursor-pointer ${
                      selectedRole === 'colaborador'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Colaborador
                  </button>
                </div>
              </div>

              {/* IDENTIFICATION NAME INPUT */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Seu Nome / Identificação <span className="text-slate-400 dark:text-slate-600 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Users className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: George, João, Maria..."
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-600 transition-all"
                  />
                </div>
              </div>

              {/* UNIQUE PASSWORD INPUT */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Senha de Acesso Única
                  </label>
                  {supabaseActive && (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setError(null); setSuccessMsg(null); }}
                      className="text-[10.5px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold cursor-pointer underline decoration-dotted"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Digite a senha mestra do sistema"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-600 font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 mt-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-950/40 cursor-pointer animate-[pulse_3.5s_infinite]"
              >
                {loading ? 'Autenticando...' : 'Entrar no Sistema'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex flex-col gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 mt-3">
                <button
                  type="button"
                  onClick={() => { setIsFirstAccess(true); setError(null); setSuccessMsg(null); }}
                  className="w-full text-center text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Primeiro acesso? Cadastrar senha mestra
                </button>
              </div>
            </form>
          )}
        </div>

        {/* SECURITY INFO FOOTER */}
        <div className="mt-6 p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-850/80 text-center flex items-center justify-center gap-3 shadow-xs">
          <Database className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <span className="text-[10px] text-slate-500 dark:text-slate-500 leading-relaxed">
            {supabaseActive 
              ? 'Conectado de forma segura à nuvem Supabase. Dados criptografados ponta a ponta.' 
              : 'Executando em modo local offline. Seus dados cadastrados ficam salvos localmente neste navegador.'}
          </span>
        </div>

      </div>
    </div>
  );
}
