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
  
  // Individual user registration states
  const [isRegister, setIsRegister] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerRole, setRegisterRole] = useState<'admin' | 'colaborador'>('colaborador');

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

  const handleUserRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const emailVal = registerEmail.trim().toLowerCase();
    const usernameVal = registerUsername.trim();
    const passwordVal = password;
    const confirmPasswordVal = confirmPassword;

    if (!emailVal || !usernameVal || !passwordVal) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    if (passwordVal.length < 4) {
      setError('A senha deve conter pelo menos 4 caracteres.');
      setLoading(false);
      return;
    }

    if (passwordVal !== confirmPasswordVal) {
      setError('As senhas digitadas não coincidem.');
      setLoading(false);
      return;
    }

    const finalRole = registerRole === 'admin' ? 'admin' : 'colaborador';
    const localUsersStr = localStorage.getItem('g3d_local_users') || '[]';
    let localUsers: any[] = [];
    try {
      localUsers = JSON.parse(localUsersStr);
    } catch (e) {
      localUsers = [];
    }

    const newUser = {
      email: emailVal,
      username: usernameVal,
      password: passwordVal,
      role: finalRole
    };

    if (localUsers.some(u => u.email === emailVal)) {
      setError('Este e-mail já está cadastrado no sistema.');
      setLoading(false);
      return;
    }

    localUsers.push(newUser);
    localStorage.setItem('g3d_local_users', JSON.stringify(localUsers));

    const supabase = getSupabaseClient();
    if (supabase && hasSupabaseConfigured()) {
      try {
        const { data: existingRemoteUser, error: remoteCheckErr } = await supabase
          .from('g3d_user_roles')
          .select('email')
          .eq('email', emailVal)
          .maybeSingle();

        if (remoteCheckErr) throw remoteCheckErr;
        if (existingRemoteUser) {
          setError('Este e-mail já está cadastrado no sistema.');
          setLoading(false);
          return;
        }

        const { error: upsertErr } = await supabase.from('g3d_user_roles').upsert({
          email: newUser.email,
          username: newUser.username,
          password: newUser.password,
          role: newUser.role
        }, { onConflict: 'email' });

        if (upsertErr) throw upsertErr;
      } catch (upsertErr: any) {
        console.error('Erro ao salvar no Supabase:', upsertErr);
        setError(`Cadastro salvo localmente, mas falhou ao sincronizar no Supabase: ${upsertErr.message}`);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    setSuccessMsg('Cadastro realizado com sucesso! Você já pode entrar no sistema.');

    // Reset fields
    setRegisterEmail('');
    setRegisterUsername('');
    setPassword('');
    setConfirmPassword('');

    setTimeout(() => {
      setIsRegister(false);
      setIsFirstAccess(false);
      setError(null);
      setSuccessMsg(null);
    }, 4000);
  };

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const inputEmailOrUser = userName.trim();
    const inputPassword = password;

    if (!inputEmailOrUser || !inputPassword) {
      setError('Por favor, preencha o e-mail/usuário e senha para logar.');
      setLoading(false);
      return;
    }

    // 1. Legacy Fallback: Master Password check
    const savedMasterPassword = localStorage.getItem('g3d_master_password');
    if (savedMasterPassword && inputPassword === savedMasterPassword) {
      sessionStorage.setItem('g3d_authenticated', 'true');
      sessionStorage.setItem('g3d_user_role', selectedRole);
      sessionStorage.setItem('g3d_username', inputEmailOrUser || (selectedRole === 'admin' ? 'Administrador' : 'Colaborador'));
      sessionStorage.setItem('g3d_user_email', inputEmailOrUser.includes('@') ? inputEmailOrUser : 'admin@master.com');
      setLoading(false);
      onLoginSuccess();
      return;
    }

    // 2. Local database check
    const localUsersStr = localStorage.getItem('g3d_local_users') || '[]';
    let localUsers: any[] = [];
    try {
      localUsers = JSON.parse(localUsersStr);
    } catch (err) {
      localUsers = [];
    }

    const matchedLocalUser = localUsers.find(
      u => u.email?.toLowerCase() === inputEmailOrUser.toLowerCase() || u.username?.toLowerCase() === inputEmailOrUser.toLowerCase()
    );

    if (matchedLocalUser) {
      if (matchedLocalUser.password === inputPassword) {
        if (matchedLocalUser.role.includes('_pendente') || matchedLocalUser.role === 'pendente') {
          setError('Acesso bloqueado. Seu cadastro está pendente de liberação pelo administrador.');
          setLoading(false);
          return;
        }
        
        sessionStorage.setItem('g3d_authenticated', 'true');
        sessionStorage.setItem('g3d_user_role', matchedLocalUser.role);
        sessionStorage.setItem('g3d_username', matchedLocalUser.username);
        sessionStorage.setItem('g3d_user_email', matchedLocalUser.email);
        setLoading(false);
        onLoginSuccess();
        return;
      } else {
        setError('Senha incorreta para o usuário especificado.');
        setLoading(false);
        return;
      }
    }

    // 3. Remote Supabase check
    const supabase = getSupabaseClient();
    if (supabase && hasSupabaseConfigured()) {
      try {
        const { data: dbUser, error: queryErr } = await supabase
          .from('g3d_user_roles')
          .select('*')
          .or(`email.eq.${inputEmailOrUser},username.eq.${inputEmailOrUser}`)
          .maybeSingle();

        if (queryErr) throw queryErr;

        if (dbUser) {
          if (dbUser.password === inputPassword) {
            const normalizedRole = dbUser.role === 'admin' || dbUser.role === 'colaborador' ? dbUser.role : 'colaborador';

            const updatedLocalUsers = localUsers.filter(u => u.email !== dbUser.email);
            updatedLocalUsers.push({
              email: dbUser.email,
              username: dbUser.username,
              password: dbUser.password,
              role: normalizedRole
            });
            localStorage.setItem('g3d_local_users', JSON.stringify(updatedLocalUsers));

            sessionStorage.setItem('g3d_authenticated', 'true');
            sessionStorage.setItem('g3d_user_role', normalizedRole);
            sessionStorage.setItem('g3d_username', dbUser.username || inputEmailOrUser);
            sessionStorage.setItem('g3d_user_email', dbUser.email || inputEmailOrUser);
            setLoading(false);
            onLoginSuccess();
            return;
          } else {
            setError('Senha incorreta para o usuário especificado.');
            setLoading(false);
            return;
          }
        }
      } catch (err: any) {
        console.error("Erro ao validar login no Supabase:", err);
      }
    }

    setLoading(false);
    setError('Nenhum usuário cadastrado com este e-mail/nome ou senha inválida.');
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

        {/* TABS CONTAINER */}
        <div className="flex w-full items-stretch h-14 select-none">
          {/* LOGIN TAB */}
          <button
            type="button"
            onClick={() => {
              setIsFirstAccess(false);
              setIsRegister(false);
              setIsForgotPassword(false);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
              !isFirstAccess && !isRegister
                ? 'bg-slate-100 dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-t border-x border-slate-200 dark:border-slate-800 rounded-tl-2xl'
                : 'bg-blue-700 hover:bg-blue-650 text-white/90 border-b border-blue-800 rounded-tl-2xl shadow-inner'
            }`}
          >
            <LogIn className="w-4 h-4 mr-2" />
            LOGIN
          </button>

          {/* REGISTER TAB */}
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setIsFirstAccess(false);
              setIsForgotPassword(false);
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 flex items-center justify-center text-xs font-extrabold uppercase tracking-widest transition-all cursor-pointer ${
              isRegister
                ? 'bg-blue-600 dark:bg-blue-900 text-white border-t border-x border-blue-600 dark:border-blue-800 rounded-tr-2xl'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-b border-slate-200 dark:border-slate-800 rounded-tr-2xl shadow-inner'
            }`}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            CADASTRAR
          </button>
        </div>

        {/* CONTAINER CONTENT BOX */}
        <div className={`border shadow-xl dark:shadow-2xl transition-all duration-300 rounded-b-2xl p-6 md:p-8 backdrop-blur-md ${
          isFirstAccess || isRegister
            ? 'bg-blue-600 dark:bg-blue-950 border-blue-600 dark:border-blue-850 text-white'
            : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-slate-100'
        }`}>
          
          {isRegister ? (
            // NEW INDIVIDUAL USER REGISTRATION FORM
            <form onSubmit={handleUserRegistration} className="space-y-4 text-left">
              <div className="space-y-1 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/20 border border-white/25 text-white text-[10px] font-bold uppercase tracking-wider">
                  Cadastro de Novo Usuário
                </span>
                <h2 className="text-lg font-extrabold text-white mt-1">
                  Crie sua Conta Individual
                </h2>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Cadastre suas credenciais de acesso individuais para usar o painel do GeorgeFctech-3D. Colaboradores precisarão de aprovação do administrador para entrar.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-100 text-xs rounded-xl flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-200 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-200 text-emerald-100 text-xs rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* NOME / USUÁRIO INPUT */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    Seu Nome / Usuário
                  </label>
                  <div className="relative flex items-center bg-white dark:bg-slate-800 border border-blue-400 dark:border-slate-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-white transition-all px-3 py-1">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mr-3" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: João, Maria..."
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2"
                    />
                  </div>
                </div>

                {/* EMAIL INPUT */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    Seu E-mail
                  </label>
                  <div className="relative flex items-center bg-white dark:bg-slate-800 border border-blue-400 dark:border-slate-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-white transition-all px-3 py-1">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mr-3" />
                    <input
                      type="email"
                      required
                      placeholder="exemplo@fctech.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2"
                    />
                  </div>
                </div>

                {/* ROLE / CARGO SELECTOR */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    Selecione seu Perfil desejado
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRegisterRole('admin')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all cursor-pointer ${
                        registerRole === 'admin'
                          ? 'bg-white text-blue-600 border-white shadow-md'
                          : 'bg-blue-700 text-white/80 border-blue-500 hover:bg-blue-650'
                      }`}
                    >
                      <Lock className="w-4 h-4" />
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegisterRole('colaborador')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all cursor-pointer ${
                        registerRole === 'colaborador'
                          ? 'bg-white text-blue-600 border-white shadow-md'
                          : 'bg-blue-700 text-white/80 border-blue-500 hover:bg-blue-650'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Colaborador
                    </button>
                  </div>
                </div>

                {/* SENHA INPUT */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    Senha de Acesso
                  </label>
                  <div className="relative flex items-center bg-white dark:bg-slate-800 border border-blue-400 dark:border-slate-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-white transition-all px-3 py-1">
                    <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mr-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo de 4 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-650 ml-2 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* CONFIRMAÇÃO DE SENHA INPUT */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    Confirme a Senha
                  </label>
                  <div className="relative flex items-center bg-white dark:bg-slate-800 border border-blue-400 dark:border-slate-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-white transition-all px-3 py-1">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mr-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirme sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2 font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 mt-4 px-5 py-3.5 bg-white hover:bg-slate-50 text-blue-600 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all duration-200 cursor-pointer"
              >
                Cadastrar Conta
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : isFirstAccess ? (
            // CONFIGURING INITIAL LOCAL MASTER PASSWORD
            <form onSubmit={handleSetupPassword} className="space-y-5">
              <div className="space-y-1 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/20 border border-white/25 text-white text-[10px] font-bold uppercase tracking-wider">
                  Configuração de Primeiro Acesso
                </span>
                <h2 className="text-lg font-extrabold text-white mt-1">
                  Defina sua Senha Mestra
                </h2>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Crie uma senha de segurança para proteger seus cálculos comerciais. No futuro, você poderá ativar a sincronização na nuvem com o seu Supabase.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-100 text-xs rounded-xl flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-200 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-100 text-xs rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* IDENTIFICATION NAME INPUT (Optional, like the image) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    Seu Nome / Identificação <span className="opacity-75 font-normal">(Opcional)</span>
                  </label>
                  <div className="relative flex items-center bg-white dark:bg-slate-800 border border-blue-400 dark:border-slate-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-white transition-all px-3 py-1">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mr-3" />
                    <input
                      type="text"
                      placeholder="Nome de usuário"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2"
                    />
                  </div>
                </div>

                {/* NEW PASSWORD INPUT */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    Nova Senha Mestra
                  </label>
                  <div className="relative flex items-center bg-white dark:bg-slate-800 border border-blue-400 dark:border-slate-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-white transition-all px-3 py-1">
                    <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mr-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo de 4 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-650 ml-2 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD INPUT */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    Confirme a Senha
                  </label>
                  <div className="relative flex items-center bg-white dark:bg-slate-800 border border-blue-400 dark:border-slate-700 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-white transition-all px-3 py-1">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mr-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Repita a senha escrita"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2 font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 mt-4 px-5 py-3.5 bg-white hover:bg-slate-50 text-blue-600 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all duration-200 cursor-pointer"
              >
                Cadastrar
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : isResettingPassword ? (
            // PASSWORD RESET/CHOOSE NEW PASSWORD VIEW
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                  Recuperação de Acesso
                </span>
                <h3 className="text-slate-900 dark:text-white font-extrabold text-sm mt-1">Defina a Nova Senha do Sistema</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Insira e confirme a nova senha de acesso única que será utilizada por todos os usuários do sistema.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nova Senha Única</label>
                  <div className="relative flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 transition-all px-3 py-1">
                    <KeyRound className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mr-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo de 4 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2 font-mono"
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

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Confirme a Nova Senha</label>
                  <div className="relative flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 transition-all px-3 py-1">
                    <Lock className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mr-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Digite a senha novamente"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2 font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 mt-4 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50 cursor-pointer transition-all"
              >
                {loading ? 'Salvando...' : 'Atualizar e Gravar Senha'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          ) : isForgotPassword ? (
            // FORGOT PASSWORD EMAIL REQUEST VIEW
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                  Recuperação de Acesso
                </span>
                <h3 className="text-slate-900 dark:text-white font-extrabold text-sm mt-1">Recuperar Senha do Sistema</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Insira o seu e-mail cadastrado (de Administrador ou Colaborador) para receber um link de redefinição de senha por e-mail.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Seu E-mail Cadastrado</label>
                  <div className="relative flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 transition-all px-3 py-1">
                    <Mail className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mr-3" />
                    <input
                      type="email"
                      required
                      placeholder="seu-email@provedor.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 mt-4 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50 cursor-pointer transition-all"
              >
                {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(null); setSuccessMsg(null); }}
                className="w-full text-center mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition cursor-pointer"
              >
                Voltar para o Login
              </button>
            </form>
          ) : (
            // SINGLE UNIQUE SYSTEM LOGIN
            <form onSubmit={handleMasterLogin} className="space-y-5">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-slate-900 dark:text-white font-extrabold text-base">Painel de Acesso Único</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Insira a chave de acesso única para entrar no sistema. Escolha o perfil desejado.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2.5">
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
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
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
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/10'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
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
                <div className="relative flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 transition-all px-3 py-1">
                  <Users className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mr-3" />
                  <input
                    type="text"
                    placeholder="Nome de usuário"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2"
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
                      className="text-[10.5px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold cursor-pointer underline decoration-dotted"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 transition-all px-3 py-1">
                  <KeyRound className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mr-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm py-2 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-650 ml-2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 mt-4 px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/15 cursor-pointer transition-all duration-200"
              >
                {loading ? 'Autenticando...' : 'Login'}
                <ArrowRight className="w-4 h-4" />
              </button>
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
