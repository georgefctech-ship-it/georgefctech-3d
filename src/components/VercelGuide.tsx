/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CloudLightning, 
  Settings, 
  Terminal, 
  Github, 
  CheckCircle,
  FileCode,
  AlertCircle
} from 'lucide-react';

export default function VercelGuide() {
  const [checklist, setChecklist] = useState({
    env: false,
    build: false,
    github: false,
    ci: false
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist({ ...checklist, [key]: !checklist[key] });
  };

  const percentage = Math.round(
    (Object.values(checklist).filter(Boolean).length / Object.keys(checklist).length) * 100
  );

  return (
    <div className="font-sans antialiased text-slate-800 max-w-5xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-950 mb-1">
            Manual de Deploy Profissional na Vercel
          </h1>
          <p className="text-sm text-slate-500">
            Siga os procedimentos de infraestrutura para publicar este projeto de forma otimizada utilizando CI/CD automático.
          </p>
        </div>
      </div>

      {/* TRACKING PROGRESS */}
      <div className="mb-8 p-6 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between">
        <div>
          <h3 className="text-md font-bold text-slate-800 mb-1">Seu Progresso de Preparação</h3>
          <p className="text-xs text-slate-500">Marque as tarefas recomendadas para verificar a conformidade do código-fonte.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-48 bg-slate-100 border border-slate-200 rounded-full h-3 overflow-hidden relative">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full duration-500 rounded-full"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            {percentage}% PRONTO
          </span>
        </div>
      </div>

      {/* 3 CORE PILLARS DIRECTIVE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* PILLAR 1: ENVIRONMENT VARIABLES */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
                <Settings className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-850">1. Variáveis de Ambiente</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              O projeto possui um arquivo <code className="bg-slate-50 px-1 py-0.5 border border-slate-100 rounded text-slate-700">.env.example</code> na raiz. No painel da Vercel, você deve configurar:
            </p>
            <div className="p-3 bg-slate-50 text-[11px] font-mono text-slate-700 rounded border border-slate-100 space-y-1.5 mb-4">
              <p className="text-purple-600 font-semibold"># Chave da API Gemini (Se usar backend)</p>
              <p>GEMINI_API_KEY=&quot;sua_chave_secreta&quot;</p>
              <p className="text-indigo-600 font-semibold"># Domínio do aplicativo na Vercel</p>
              <p>APP_URL=&quot;https://app-vercel.vercel.app&quot;</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              *Passo na Vercel:* Vá em <strong>Project Settings</strong> &gt; <strong>Environment Variables</strong> e insira chave/valor.
            </p>
          </div>

          <button
            onClick={() => toggleCheck('env')}
            className={`w-full mt-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition flex items-center justify-center gap-2 ${
              checklist.env 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {checklist.env ? 'Configurado' : 'Marcar como Lido'}
          </button>
        </div>

        {/* PILLAR 2: BUILD PERFORMANCE */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
                <Terminal className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-850">2. Configurações de Build</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Durante o deploy, a Vercel lê o arquivo <code className="bg-slate-50 px-1 py-0.5 border border-slate-100 rounded text-slate-700">package.json</code> da raiz e executa o comando de compilação.
            </p>
            <div className="p-3 bg-slate-50 text-[11px] font-mono text-slate-700 rounded border border-slate-100 space-y-1 mb-4">
              <p className="text-emerald-700 font-semibold">&quot;build&quot;: &quot;vite build&quot;</p>
              <p className="text-slate-400">// Isso gera a pasta estática &quot;dist&quot;</p>
              <p className="text-slate-400">// na raiz e a serve de forma veloz.</p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Vite está configurado para empacotar o React 19 em arquivos estáticos minificados sem a necessidade de servidores Node ativos.
            </p>
          </div>

          <button
            onClick={() => toggleCheck('build')}
            className={`w-full mt-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition flex items-center justify-center gap-2 ${
              checklist.build 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {checklist.build ? 'Estrutura Validada' : 'Marcar como Lido'}
          </button>
        </div>

        {/* PILLAR 3: INTEGRATION CI/CD */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
                <Github className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-855">3. Fluxo de Git + CI/CD</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Para automatizar as atualizações para a Vercel em tempo real:
            </p>
            <ul className="text-xs text-slate-550 leading-relaxed space-y-12 list-disc pl-4 mb-4">
              <li>Suba a pasta completa para um repositório no seu GitHub.</li>
              <li>Acesse <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">Vercel.com</a> e crie uma conta grátis.</li>
              <li>Clique em <strong>Add New</strong> &gt; <strong>Project</strong> e importe o repositório cadastrado.</li>
            </ul>
            <p className="text-xs text-slate-500 leading-relaxed">
              Toda vez que fizer um <code>git push</code> na branch mestre, a Vercel recompilará e subirá as novidades automaticamente!
            </p>
          </div>

          <button
            onClick={() => toggleCheck('github')}
            className={`w-full mt-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition flex items-center justify-center gap-2 ${
              checklist.github 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {checklist.github ? 'Entendido' : 'Marcar como Lido'}
          </button>
        </div>

      </div>

      {/* TECHNICAL SETUP ADVICES */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <FileCode className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Garantias Anti-Falhas no Deploy</h3>
        </div>

        <div className="space-y-4 text-xs text-slate-500 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
            <p><strong>Configuração de Build Manual</strong> : No painel Vercel, o Framework Preset padrão deve ser reconhecido como <strong>Vite</strong> de forma automática. Se as configurações falharem, mantenha o Build Command como <code>npm run build</code> e Output Directory como <code>dist</code>.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
            <p><strong>React 19 Compatibility</strong> : O gerenciador de pacotes listado em seu <code>package.json</code> está utilizando as definições exatas modernas, garantindo estabilidade e renderização rápida.</p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
            <p><strong>Estrutura de Rota de API (Importante)</strong> : Se você expandir o aplicativo futuramente para o Supabase ou outra ferramenta baseada em APIs secretas, certifique-se de realizar requisições usando chaves seguras passadas via variáveis customizadas no painel, garantindo que o backend proteja suas senhas contra acessos em DevTools do navegador.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
