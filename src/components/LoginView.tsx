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
  const [activeTab, setActiveTab] = useState<'master' | 'supabase'>('master');
  const [isRegistering, setIsRegistering] = useState(false);
  const [supabaseActive, setSupabaseActive] = useState(false);
  
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

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [hasMasterPassword, setHasMasterPassword] = useState(!!localStorage.getItem('g3d_master_password'));
  const [showPassword, setShowPassword] = useState(false);
  
  // Recovery/Forgot Password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Feedback states
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabaseConfigured = hasSupabaseConfigured();
    // Check if master password exists in localStorage
    const savedPassword = localStorage.getItem('g3d_master_password');
    setHasMasterPassword(!!savedPassword);
    
    if (supabaseConfigured) {
      setSupabaseActive(true);
      setActiveTab('supabase');
      setIsFirstAccess(false);
    } else if (!savedPassword) {
      // Se a nuvem não está configurada e não temos senha mestra, precisamos cadastrar a senha mestra
      setSupabaseActive(false);
      setActiveTab('master');
      setIsFirstAccess(true);
    } else {
      // Se a nuvem não está configurada mas já temos senha mestra cadastrada, carregamos o formulário de login local direto
      setSupabaseActive(false);
      setActiveTab('master');
      setIsFirstAccess(false);
    }
    
    // Check if redirecting from a recovery link
    const hash = window.location.hash || '';
    if (hash.includes('type=recovery') || hash.includes('access_token=') && hash.includes('type=')) {
      if (!hash.includes('error=')) {
        setIsResettingPassword(true);
      } else {
        setError('O link de recuperação de senha expirou ou é inválido. Por favor, tente novamente.');
      }
    }
  }, []);

  const handleSetupPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 4) {
      setError('A senha deve conter pelo menos 4 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    // Save master password configuration
    localStorage.setItem('g3d_master_password', password);
    setHasMasterPassword(true);
    sessionStorage.setItem('g3d_authenticated', 'true');
    sessionStorage.setItem('g3d_user_role', 'admin');
    
    setSuccessMsg('Senha Mestra configurada com sucesso!');
    setTimeout(() => {
      onLoginSuccess();
    }, 1500);
  };

  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const savedPassword = localStorage.getItem('g3d_master_password');
    if (!savedPassword) {
      setError('Nenhuma senha mestra configurada no sistema.');
      return;
    }

    if (password === savedPassword) {
      sessionStorage.setItem('g3d_authenticated', 'true');
      sessionStorage.setItem('g3d_user_role', 'admin'); // Master password is always Admin
      onLoginSuccess();
    } else {
      setError('Senha incorreta. Por favor, tente novamente.');
    }
  };

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('O cliente Supabase não pôde ser iniciado.');
      setLoading(false);
      return;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password
      });

      if (authErr) {
        throw new Error(authErr.message === 'Invalid login credentials' 
          ? 'Credenciais de acesso incorretas. Por favor, verifique se digitou o e-mail e a senha corretos.' 
          : authErr.message);
      }

      if (data.user) {
        // Fetch user role from database
        const userEmail = (data.user.email || '').trim().toLowerCase();
        const isGeorgeEmail = userEmail === 'georgefctec@gmail.com';
        
        const { data: roleData, error: roleErr } = await supabase
          .from('g3d_user_roles')
          .select('role')
          .eq('email', userEmail)
          .maybeSingle();

        let assignedRole = '';
        
        if (roleData) {
          assignedRole = roleData.role;
        } else {
          // Auto register role for this user if it doesn't exist
          const defaultRole = isGeorgeEmail ? 'admin' : 'colaborador';
          await supabase.from('g3d_user_roles').insert({
            email: userEmail,
            role: defaultRole
          });
          assignedRole = defaultRole;
        }

        // Se o colaborador estava listado como pendente, promovemos o acesso de entrada imediatamente de modo ativo
        if (assignedRole === 'colaborador_pendente' || assignedRole === 'pendente') {
          assignedRole = 'colaborador';
          // Atualiza também na nuvem para manter persistente
          try {
            await supabase.from('g3d_user_roles').upsert({
              email: userEmail,
              role: 'colaborador'
            });
          } catch (e) {
            console.error("Erro ao atualizar cargo pendente:", e);
          }
        }

        sessionStorage.setItem('g3d_authenticated', 'true');
        sessionStorage.setItem('g3d_user_role', assignedRole);
        sessionStorage.setItem('g3d_user_email', userEmail);
        
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const handleSupabaseRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const userEmail = email.trim().toLowerCase();
    const isGeorgeEmail = userEmail === 'georgefctec@gmail.com';

    if (password.length < 6) {
      setError('A senha de login deve conter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Supabase instável ou não configurado.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: registerErr } = await supabase.auth.signUp({
        email: userEmail,
        password: password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (registerErr) throw registerErr;

      if (data.user) {
        // Save database role
        const defaultRole = isGeorgeEmail ? 'admin' : 'colaborador';
        await supabase.from('g3d_user_roles').upsert({
          email: userEmail,
          role: defaultRole
        });

        if (isGeorgeEmail) {
          setSuccessMsg('Cadastro concluído com sucesso! Sua conta foi criada automaticamente como Administrador.');
        } else {
          setSuccessMsg('Cadastro concluído com sucesso! Sua conta de Colaborador está ativa e você já pode acessar o sistema.');
        }
        
        setIsRegistering(false);
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao registrar colaborador.');
    } finally {
      setLoading(false);
    }
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
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: window.location.origin
      });

      if (resetErr) throw resetErr;

      setSuccessMsg('E-mail enviado! Verifique seu lixo eletrônico ou caixa de entrada para continuar com a alteração.');
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

    if (password.length < 6) {
      setError('A nova senha deve possuir no mínimo 6 caracteres.');
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
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password
      });

      if (updateErr) throw updateErr;

      setSuccessMsg('Sua nova senha foi gravada com sucesso! Agora você já pode entrar na sua conta.');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsResettingPassword(false);
        setIsForgotPassword(false);
        setSuccessMsg(null);
        window.location.hash = ''; // Clear hash
      }, 3500);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha.');
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
            </form>
          ) : isResettingPassword ? (
            // PASSWORD RESET/CHOOSE NEW PASSWORD VIEW
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider font-sans">
                  Recuperação de Acesso
                </span>
                <h3 className="text-slate-900 dark:text-white font-bold text-sm">Defina sua Nova Senha</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Insira e confirme sua nova senha para atualizar seu cadastro em nuvem.
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
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nova Senha</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo de 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Confirme a Nova Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-400" />
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
                className="w-full flex items-center justify-center gap-2 mt-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-50 cursor-pointer animate-[pulse_3s_infinite]"
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
                <h3 className="text-slate-900 dark:text-white font-bold text-sm">Recuperar minha Senha</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Insira o seu e-mail cadastrado e enviaremos um link de acesso seguro para você definir uma nova senha no GeorgeFctech-3D.
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
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">E-mail Cadastrado</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
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
                className="w-full flex items-center justify-center gap-2 mt-4 px-5 py-3 bg-indigo-600 hover:bg-indigo-505 text-white font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Enviando...' : 'Solicitar Link de Alteração'}
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
            // STANDARD SYSTEM LOGIN / TABBED MODE
            <div className="space-y-5">
              
              {/* TABS SELECTOR (Active only if Supabase is configured) */}
              {supabaseActive && !isRegistering && (
                <div className="flex border border-slate-200 dark:border-slate-800 p-1 rounded-xl bg-slate-100 dark:bg-slate-950">
                  <button
                    type="button"
                    onClick={() => { 
                      setActiveTab('supabase'); 
                      setError(null); 
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                      activeTab === 'supabase'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Acesso em Nuvem (Multi-usuário)
                  </button>
                  <button
                    type="button"
                    onClick={() => { 
                      setActiveTab('master'); 
                      setError(null); 
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    className={`flex-1 flex-row flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                      activeTab === 'master'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-202'
                    }`}
                  >
                    <Lock className="w-4 h-4" />
                    Senha Mestra (Admin)
                  </button>
                </div>
              )}

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

              {/* REGISTER NEW COLABORADOR VIEW */}
              {isRegistering ? (
                <form onSubmit={handleSupabaseRegister} className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-slate-900 dark:text-white font-bold text-sm">Registrar Novo Membro</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      O usuário cadastrado terá o papel padrão de <strong>Colaborador</strong> (visualiza estoque de filamentos e lista de compras).
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">E-mail</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="email"
                          required
                          placeholder="exemplo@empresa.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nova Senha</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="password"
                          required
                          placeholder="Mínimo 6 dígitos"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Confirme a Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="password"
                          required
                          placeholder="Repita a senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 mt-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Cadastrando...' : 'Finalizar Cadastro de Membro'}
                    <UserPlus className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => { setIsRegistering(false); setError(null); }}
                    className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-white transition cursor-pointer"
                  >
                    Voltar para Login
                  </button>
                </form>
              ) : activeTab === 'supabase' ? (
                // SUPABASE MULTIUSER LOGIN
                <form onSubmit={handleSupabaseLogin} className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-slate-900 dark:text-white font-bold text-sm">Autenticidade em Nuvem</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Faça o login corporativo para começar a registrar e sincronizar dados com a empresa.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-450">E-mail Corporativo</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="email"
                          required
                          placeholder="colaborador@empresa.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center mb-0.5">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-455">Senha de Acesso</label>
                        <button
                          type="button"
                          onClick={() => { setIsForgotPassword(true); setError(null); setSuccessMsg(null); }}
                          className="text-[10.5px] text-indigo-650 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold cursor-pointer underline decoration-dotted"
                        >
                          Esqueceu a senha?
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Digite sua senha cadastrada"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 mt-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Validando...' : 'Fazer Login Sincronizado'}
                    <LogIn className="w-4 h-4" />
                  </button>

                  <div className="text-center pt-1 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setIsRegistering(true); setError(null); }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition cursor-pointer"
                    >
                      Cadastrar uma conta de Colaborador
                    </button>
                  </div>
                </form>
              ) : !hasMasterPassword ? (
                // LOCAL MASTER PASSWORD SIGN UP (IF NOT SET YET)
                <form onSubmit={handleSetupPassword} className="space-y-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                      Definir Senha Mestra
                    </span>
                    <h3 className="text-slate-900 dark:text-white font-bold text-sm">Cadastre sua Senha</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Não há nenhuma senha mestra definida localmente neste navegador. Defina uma para atuar como redundância administrativa e acesso offline.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nova Senha Mestra</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 font-sans" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Mínimo de 4 caracteres"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Confirme a Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 font-sans" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Repita a senha escrita"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 mt-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg cursor-pointer"
                  >
                    Gravar Senha e Entrar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                // LOCAL MASTER PASSWORD SIGN IN
                <form onSubmit={handleMasterLogin} className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-slate-900 dark:text-white font-bold text-sm">Painel de Administrador</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Insira a Senha Mestra interna do sistema para ter acesso offline completo às ferramentas do console.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      Senha Mestra Cadastrada
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Sua senha mestra"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none placeholder-slate-400 dark:placeholder-slate-600 font-mono transition-all"
                        autoFocus
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

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 mt-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-950/40 cursor-pointer animate-[pulse_3.5s_infinite]"
                  >
                    Autenticar Administrador
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
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
