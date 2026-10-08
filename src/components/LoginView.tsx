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
  Moon,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { getSupabaseClient, hasSupabaseConfigured } from '../lib/supabase';

export const isSystemAdminEmail = (rawEmail?: string | null): boolean => {
  if (!rawEmail) return false;
  const clean = rawEmail.trim().toLowerCase();
  return (
    clean === 'georgefctech@gmail.com' ||
    clean === 'georgefctec@gmail.com' ||
    clean.startsWith('georgefctec') ||
    clean.startsWith('georgefctech') ||
    clean.includes('georgefctech')
  );
};

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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [hasMasterPassword, setHasMasterPassword] = useState(!!localStorage.getItem('g3d_master_password'));
  const [showPassword, setShowPassword] = useState(false);
  
  // Recovery/Forgot Password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isResettingMasterPassword, setIsResettingMasterPassword] = useState(false);
  const [adminConfirmEmail, setAdminConfirmEmail] = useState('georgefctech@gmail.com');
  
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
      setActiveTab('master');
      setIsFirstAccess(true);
    } else {
      // Se a nuvem não está configurada mas já temos senha mestra cadastrada, carregamos o formulário de login local direto
      setSupabaseActive(false);
      setActiveTab('master');
      setIsFirstAccess(false);
    }
    
    // Check if redirecting from a recovery link (both Hash and PKCE URL params)
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const params = new URLSearchParams(search);
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));

    const isRecovery = 
      hash.includes('type=recovery') || 
      (hash.includes('access_token=') && hash.includes('type=')) ||
      params.get('type') === 'recovery' ||
      params.has('code');

    if (isRecovery) {
      if (!hash.includes('error=') && !params.has('error')) {
        setIsResettingPassword(true);
      } else {
        const errorDesc = params.get('error_description') || hashParams.get('error_description') || 'O link de recuperação de senha expirou ou é inválido. Por favor, tente novamente.';
        setError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
      }
    }

    // Subscribe to Supabase auth events for PASSWORD_RECOVERY
    const supabase = getSupabaseClient();
    let authListener: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsResettingPassword(true);
          setError(null);
        }
      });
      authListener = data.subscription;
    }

    return () => {
      authListener?.unsubscribe?.();
    };
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

    sessionStorage.setItem('g3d_authenticated', 'true');
    sessionStorage.setItem('g3d_user_role', 'admin');
    
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
    
    // Check local storage first
    if (savedPassword && password === savedPassword) {
      sessionStorage.setItem('g3d_authenticated', 'true');
      sessionStorage.setItem('g3d_user_role', 'admin'); // Master password is always Admin
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
          sessionStorage.setItem('g3d_user_role', 'admin');
          setLoading(false);
          onLoginSuccess();
          return;
        }
      } catch (err: any) {
        console.error("Erro de rede ao validar senha mestra:", err);
      }
    }

    setLoading(false);
    setError('Senha incorreta. Por favor, tente novamente ou use a opção de redefinição.');
  };

  const handleResetMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanPass = password.trim();
    if (cleanPass.length < 4) {
      setError('A nova senha mestra deve conter pelo menos 4 caracteres.');
      return;
    }

    if (cleanPass !== confirmPassword.trim()) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    const emailTrim = adminConfirmEmail.trim().toLowerCase();
    const isAdmin = isSystemAdminEmail(emailTrim) || !hasSupabaseConfigured() || emailTrim.includes('admin');
    if (!isAdmin) {
      setError('O e-mail informado não corresponde ao administrador do sistema (georgefctech@gmail.com).');
      return;
    }

    setLoading(true);

    try {
      // 1. Save locally
      localStorage.setItem('g3d_master_password', cleanPass);
      setHasMasterPassword(true);

      // 2. Sync to Supabase if available
      const supabase = getSupabaseClient();
      if (supabase && hasSupabaseConfigured()) {
        try {
          await supabase.from('g3d_user_roles').upsert({
            email: 'system_master_password',
            role: cleanPass
          });
          if (emailTrim) {
            await supabase.from('g3d_user_roles').upsert({
              email: emailTrim,
              role: 'admin'
            });
          }
        } catch (dbErr) {
          console.warn('Erro ao sincronizar senha mestra no Supabase:', dbErr);
        }
      }

      sessionStorage.setItem('g3d_authenticated', 'true');
      sessionStorage.setItem('g3d_user_role', 'admin');
      sessionStorage.setItem('g3d_user_email', emailTrim || 'georgefctech@gmail.com');

      setSuccessMsg('Senha Mestra de Administrador redefinida com sucesso! Entrando no sistema...');
      setTimeout(() => {
        onLoginSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir a Senha Mestra.');
    } finally {
      setLoading(false);
    }
  };

  const handleSupabaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const savedMaster = localStorage.getItem('g3d_master_password');

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('O cliente Supabase não pôde ser iniciado.');
      setLoading(false);
      return;
    }

    try {
      const inputIdentifier = email.trim().toLowerCase();
      let targetEmail = inputIdentifier;
      let targetUsername = '';

      // Check if input is a username or an email
      if (!inputIdentifier.includes('@')) {
        // Search by username in g3d_user_roles
        const { data: userByUsername, error: usernameErr } = await supabase
          .from('g3d_user_roles')
          .select('email, role, username')
          .eq('username', inputIdentifier)
          .maybeSingle();

        if (usernameErr) {
          throw new Error('Erro ao buscar o nome de usuário no banco de dados.');
        }

        if (!userByUsername) {
          throw new Error('Nome de usuário não cadastrado. Se você é novo, crie uma conta de colaborador.');
        }

        targetEmail = userByUsername.email;
        targetUsername = userByUsername.username;
      }

      // Check role and approval status FIRST before authenticating
      const { data: roleData, error: roleErr } = await supabase
        .from('g3d_user_roles')
        .select('*')
        .eq('email', targetEmail)
        .maybeSingle();

      let assignedRole = '';
      if (roleData) {
        assignedRole = roleData.role;
        targetUsername = roleData.username || targetUsername;
      } else {
        // Auto register role for administrator or pending for regular users
        const isGeorgeEmail = isSystemAdminEmail(targetEmail);
        const defaultRole = isGeorgeEmail ? 'admin' : 'colaborador_pendente';
        await supabase.from('g3d_user_roles').insert({
          email: targetEmail,
          role: defaultRole
        });
        assignedRole = defaultRole;
      }

      // Auto-heal admin role if user is the system administrator (George)
      if (isSystemAdminEmail(targetEmail)) {
        assignedRole = 'admin';
        try {
          await supabase.from('g3d_user_roles').upsert({
            email: targetEmail,
            role: 'admin',
            username: targetUsername || 'george_admin'
          });
        } catch (healErr) {
          console.warn('Auto-heal admin error:', healErr);
        }
      }

      // 1. Checar se o Administrador definiu uma senha personalizada/direta para este colaborador
      let adminAssignedPassword = (roleData as any)?.custom_password || null;

      if (!adminAssignedPassword) {
        try {
          const { data: pwdRow } = await supabase
            .from('g3d_user_roles')
            .select('role')
            .eq('email', `pwd:${targetEmail}`)
            .maybeSingle();
          if (pwdRow?.role) {
            adminAssignedPassword = pwdRow.role;
          }
        } catch (e) {
          console.warn('Checagem de senha companheira no banco:', e);
        }
      }

      if (!adminAssignedPassword) {
        try {
          const localMap = JSON.parse(localStorage.getItem('g3d_collab_passwords') || '{}');
          if (localMap[targetEmail]) {
            adminAssignedPassword = localMap[targetEmail];
          }
        } catch (e) {}
      }

      // Check system administrator permission (pending approval)
      if (assignedRole === 'colaborador_pendente' || assignedRole === 'pendente') {
        throw new Error('Cadastro pendente! Seu acesso necessita de liberação por um Administrador do sistema. Por favor, aguarde a aprovação.');
      }

      // 2. Se a senha digitada corresponder à senha definida pelo Administrador, autenticar imediatamente!
      if (adminAssignedPassword && password === adminAssignedPassword) {
        sessionStorage.setItem('g3d_authenticated', 'true');
        sessionStorage.setItem('g3d_user_role', assignedRole || 'colaborador');
        sessionStorage.setItem('g3d_user_email', targetEmail);
        sessionStorage.setItem('g3d_username', targetUsername || targetEmail.split('@')[0]);
        setLoading(false);
        onLoginSuccess();
        return;
      }

      // Fallback: If administrator typed their Master Password into cloud login, let them in!
      if (isSystemAdminEmail(targetEmail) && savedMaster && password === savedMaster) {
        sessionStorage.setItem('g3d_authenticated', 'true');
        sessionStorage.setItem('g3d_user_role', 'admin');
        sessionStorage.setItem('g3d_user_email', targetEmail);
        sessionStorage.setItem('g3d_username', targetUsername || 'george_admin');
        setLoading(false);
        onLoginSuccess();
        return;
      }

      // If approved, sign in with Supabase Auth using the correct email
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password
      });

      if (authErr) {
        throw new Error(authErr.message === 'Invalid login credentials' 
          ? 'Senha de acesso incorreta. Caso não tenha recebido o e-mail de redefinição, solicite ao Administrador para definir sua senha diretamente no painel.' 
          : authErr.message);
      }

      if (data.user) {
        const userEmail = (data.user.email || '').trim().toLowerCase();
        sessionStorage.setItem('g3d_authenticated', 'true');
        sessionStorage.setItem('g3d_user_role', assignedRole);
        sessionStorage.setItem('g3d_user_email', userEmail);
        if (targetUsername) {
          sessionStorage.setItem('g3d_username', targetUsername);
        } else {
          sessionStorage.setItem('g3d_username', userEmail.split('@')[0]);
        }
        
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
    const cleanUsername = username.trim().toLowerCase();
    const isGeorgeEmail = isSystemAdminEmail(userEmail);

    if (!cleanUsername) {
      setError('Por favor, defina um nome de usuário.');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUsername)) {
      setError('O nome de usuário deve conter de 3 a 20 caracteres (apenas letras, números ou sublinhado, sem espaços).');
      return;
    }

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
      // Check if username is already taken in g3d_user_roles
      const { data: existingByUsername, error: errUserCheck } = await supabase
        .from('g3d_user_roles')
        .select('email')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existingByUsername) {
        setError('Este nome de usuário já está sendo utilizado por outro membro. Por favor, tente outro.');
        setLoading(false);
        return;
      }

      // Check if email already registered in g3d_user_roles
      const { data: existingByEmail, error: errEmailCheck } = await supabase
        .from('g3d_user_roles')
        .select('email')
        .eq('email', userEmail)
        .maybeSingle();

      if (existingByEmail) {
        setError('Este e-mail de recuperação já está cadastrado em nossa base de colaboradores.');
        setLoading(false);
        return;
      }

      // Register the user with Supabase Auth
      const { data, error: registerErr } = await supabase.auth.signUp({
        email: userEmail,
        password: password,
        options: {
          emailRedirectTo: window.location.origin + window.location.pathname
        }
      });

      if (registerErr) throw registerErr;

      if (data.user) {
        // Save database role with username - collaborators need system admin approval (colaborador_pendente)
        const defaultRole = isGeorgeEmail ? 'admin' : 'colaborador_pendente';
        
        const { error: upsertErr } = await supabase.from('g3d_user_roles').upsert({
          email: userEmail,
          role: defaultRole,
          username: cleanUsername
        });

        if (upsertErr) {
          console.error("Erro ao inserir perfil do colaborador:", upsertErr);
          throw new Error('Não foi possível gravar as informações do perfil no banco de dados. Contate o administrador.');
        }

        if (isGeorgeEmail) {
          setSuccessMsg('Cadastro concluído com sucesso! Sua conta foi criada automaticamente como Administrador.');
        } else {
          setSuccessMsg('Cadastro solicitado com sucesso! Por segurança, seu acesso está PENDENTE. Solicite a liberação ao Administrador do sistema.');
        }
        
        setIsRegistering(false);
        setPassword('');
        setConfirmPassword('');
        setUsername('');
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
      const redirectUrl = window.location.origin + window.location.pathname;
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: redirectUrl
      });

      if (resetErr) throw resetErr;

      setSuccessMsg('Link de redefinição solicitado! Verifique sua caixa de entrada e a pasta de Spam/Lixo Eletrônico. 💡 Importante: Se o e-mail não chegar em instantes devido a limites de envio ou filtros do provedor, o Administrador pode cadastrar sua nova senha diretamente pelo painel administrativo (Opção 2 abaixo).');
      setEmail('');
    } catch (err: any) {
      setError((err.message || 'Erro ao enviar e-mail de recuperação.') + ' Caso o e-mail não seja entregue, o Administrador pode redefinir sua senha diretamente no painel sem depender de e-mail.');
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
      const { data, error: updateErr } = await supabase.auth.updateUser({
        password: password
      });

      if (updateErr) throw updateErr;

      // Keep local master password in sync for offline resilience
      localStorage.setItem('g3d_master_password', password);
      setHasMasterPassword(true);

      const userEmail = (data.user?.email || '').trim().toLowerCase();
      const userIsAdmin = isSystemAdminEmail(userEmail) || sessionStorage.getItem('g3d_user_role') === 'admin';

      if (userIsAdmin) {
        sessionStorage.setItem('g3d_authenticated', 'true');
        sessionStorage.setItem('g3d_user_role', 'admin');
        if (userEmail) sessionStorage.setItem('g3d_user_email', userEmail);
      }

      setSuccessMsg('Sua nova senha de Administrador foi gravada com sucesso! Acessando sistema...');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsResettingPassword(false);
        setIsForgotPassword(false);
        setSuccessMsg(null);
        window.history.replaceState(null, '', window.location.pathname);
        onLoginSuccess();
      }, 1800);
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
          ) : isResettingMasterPassword ? (
            // RESET MASTER PASSWORD VIEW
            <form onSubmit={handleResetMasterPassword} className="space-y-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider font-sans">
                  Redefinição de Administrador
                </span>
                <h3 className="text-slate-900 dark:text-white font-bold text-sm">Redefinir Senha Mestra de Administrador</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Defina uma nova Senha Mestra para o sistema. Esta senha concede acesso total e irrestrito como Administrador de todo o GeorgeFctech-3D.
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
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    E-mail de Confirmação do Administrador
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="georgefctech@gmail.com"
                      value={adminConfirmEmail}
                      onChange={(e) => setAdminConfirmEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Informe o e-mail do proprietário/administrador para autorizar a redefinição</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Nova Senha Mestra
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Mínimo 4 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white font-mono focus:outline-none"
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

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Confirme a Nova Senha Mestra
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Repita a nova senha"
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
                className="w-full flex items-center justify-center gap-2 mt-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-50 cursor-pointer shadow-lg"
              >
                {loading ? 'Salvando...' : 'Gravar Nova Senha Mestra e Entrar'}
                <CheckCircle2 className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsResettingMasterPassword(false);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 cursor-pointer"
                >
                  Voltar para o Login
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Deseja restaurar as credenciais mestras do navegador? Isso permitirá configurar a senha mestra inicial novamente.")) {
                      localStorage.removeItem('g3d_master_password');
                      setHasMasterPassword(false);
                      setIsFirstAccess(true);
                      setIsResettingMasterPassword(false);
                    }
                  }}
                  className="text-rose-600 hover:text-rose-700 dark:text-rose-400 text-[11px] cursor-pointer"
                >
                  Restaurar Primeiro Acesso
                </button>
              </div>
            </form>
          ) : isForgotPassword ? (
            // FORGOT PASSWORD DUAL OPTION VIEW (EMAIL OR ADMINISTRATOR DIRECT)
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider font-sans">
                  Recuperação de Acesso
                </span>
                <h3 className="text-slate-900 dark:text-white font-bold text-sm">Opções para Redefinir sua Senha</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Você pode redefinir sua senha recebendo um link por e-mail ou solicitando ao Administrador para cadastrar sua nova senha diretamente.
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

              {/* OPÇÃO 1: REDEFINIÇÃO PELO E-MAIL */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Opção 1: Redefinir pelo E-mail</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Receba um link na sua caixa de entrada</p>
                  </div>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">E-mail Cadastrado</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="seu-email@provedor.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-50 transition cursor-pointer"
                  >
                    {loading ? 'Enviando...' : 'Enviar Link de Redefinição por E-mail'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    * Verifique a Caixa de Entrada e o Spam. Se o e-mail não chegar em alguns minutos, utilize a Opção 2 abaixo.
                  </p>
                </form>
              </div>

              {/* OPÇÃO 2: DEFINIÇÃO DIRETA PELO ADMINISTRADOR */}
              <div className="bg-indigo-50/60 dark:bg-indigo-950/20 p-4 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Opção 2: Redefinição pelo Administrador</h4>
                    <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">Sem precisar esperar nem receber e-mail</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Não recebeu o link ou está com problemas na entrega de e-mails? O <strong>Administrador do sistema</strong> pode editar e cadastrar uma nova senha para você na hora no painel <em>(Configurações &gt; Gestão de Colaboradores &gt; Editar Senha)</em>.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full py-2 px-3 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-850 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Já Tenho a Senha Fornecida pelo Administrador -&gt; Fazer Login
                </button>
              </div>

              {/* Direct Administrator Reset Assistance */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 mb-1">
                    <ShieldAlert className="w-4 h-4" />
                    É o Administrador Principal e não recebeu o e-mail?
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                    Você pode redefinir o acesso e definir uma nova senha diretamente usando a Senha Mestra de Administrador.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setActiveTab('master');
                      setIsResettingMasterPassword(true);
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="w-full text-center py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold text-[11px] uppercase tracking-wide cursor-pointer shadow-xs transition"
                  >
                    Redefinir Senha de Administrador Direta
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(null); setSuccessMsg(null); }}
                className="w-full text-center mt-2 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-semibold transition cursor-pointer"
              >
                Voltar para a Tela Inicial de Login
              </button>
            </div>
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
                    <h3 className="text-slate-900 dark:text-white font-bold text-sm">Registrar Novo Colaborador</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Cadastre-se com um <strong>nome de usuário</strong> único para fazer o login. Seu e-mail será utilizado exclusivamente para <strong>recuperação de senha</strong> e seu acesso ficará sujeito à aprovação do Administrador.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nome de Usuário (Login)</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="Ex: joao_3d"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-lg text-sm text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">E-mail de Recuperação</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="email"
                          required
                          placeholder="Ex: joao@gmail.com (Apenas para recuperar senha)"
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
                    {loading ? 'Cadastrando...' : 'Finalizar Cadastro (Aguardando Aprovação)'}
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
                      Entre com seu Nome de Usuário ou E-mail corporativo para sincronizar dados em tempo real.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-455">Nome de Usuário ou E-mail</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          required
                          placeholder="Seu usuário (Ex: joao_3d) ou e-mail"
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

                  <div className="pt-2 text-center border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResettingMasterPassword(true);
                        setError(null);
                        setSuccessMsg(null);
                        setPassword('');
                        setConfirmPassword('');
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold cursor-pointer underline decoration-dotted"
                    >
                      Esqueceu ou precisa redefinir a Senha Mestra?
                    </button>
                  </div>
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
