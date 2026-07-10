/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Printer, Calendar, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ProjectOrder } from '../types';

interface ReportViewProps {
  projects: ProjectOrder[];
}

export default function ReportView({ projects }: ReportViewProps) {
  const [selectedSub, setSelectedSub] = useState('Todos');
  const [showIframeNotice, setShowIframeNotice] = useState(false);

  useEffect(() => {
    try {
      if (window.self !== window.top) {
        setShowIframeNotice(true);
      }
    } catch (e) {
      setShowIframeNotice(true);
    }
  }, []);

  // Math helper
  const calculateEarnings = (p: ProjectOrder) => {
    return (p.hours * p.hourlyRate) + (p.weight * p.materialRate) + p.profitMargin;
  };

  // Extract unique clients for filtering report
  const clients = ['Todos', ...Array.from(new Set(projects.map(p => p.client)))];

  const filteredProjects = projects.filter(p => {
    return selectedSub === 'Todos' || p.client === selectedSub;
  });

  const totalHours = filteredProjects.reduce((sum, p) => sum + p.hours, 0);
  const totalWeight = filteredProjects.reduce((sum, p) => sum + p.weight, 0);
  const totalValue = filteredProjects.reduce((sum, p) => sum + calculateEarnings(p), 0);

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const downloadHtmlReport = () => {
    if (filteredProjects.length === 0) return;

    const clientLabel = selectedSub === 'Todos' ? 'Geral / Setores Consolidados' : selectedSub;
    const reportTitle = `Demonstrativo_Tecnico_${clientLabel.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const dateFormatted = new Date().toLocaleDateString('pt-BR');
    const timeFormatted = new Date().toLocaleTimeString('pt-BR');

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Demonstrativo Técnico & Faturamento Comercial - GeorgeFctech-3D</title>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 40px 20px;
      background-color: #f8fafc;
      color: #1e293b;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 50px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .logo-title h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #0f172a;
      text-transform: uppercase;
    }
    .logo-title h1 span {
      color: #4f46e5;
    }
    .logo-title p.subtitle {
      margin: 4px 0 0 0;
      font-size: 11px;
      font-family: monospace;
      letter-spacing: 0.1em;
      color: #4f46e5;
      text-transform: uppercase;
      font-weight: bold;
    }
    .logo-title p.desc {
      margin: 8px 0 0 0;
      font-size: 13px;
      color: #64748b;
    }
    .header-meta {
      text-align: right;
      font-family: monospace;
      font-size: 12px;
      color: #475569;
    }
    .header-meta .doc-title {
      font-weight: bold;
      color: #0f172a;
      font-size: 13px;
      margin-bottom: 6px;
    }
    .intro-details {
      background-color: #f8fafc;
      border-left: 4px solid #0f172a;
      padding: 16px;
      font-size: 13px;
      color: #334155;
      border-radius: 0 8px 8px 0;
      margin-bottom: 30px;
      line-height: 1.6;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0f172a;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: bold;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 10px 12px;
      border-bottom: 1px solid #cbd5e1;
      text-align: left;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12px;
      color: #334155;
    }
    .metric-table td {
      font-size: 13px;
    }
    .metric-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      background-color: #0f172a;
      border-radius: 50%;
      margin-right: 8px;
    }
    .price-col {
      text-align: right;
      font-family: monospace;
      font-weight: bold;
    }
    .commercial-terms {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      margin-bottom: 40px;
      font-size: 11px;
      color: #64748b;
      line-height: 1.6;
    }
    .signatures {
      border-top: 1px solid #cbd5e1;
      padding-top: 30px;
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 40px;
    }
    .signature-line {
      border-top: 1px solid #94a3b8;
      margin-top: 50px;
      padding-top: 8px;
      font-size: 12px;
      color: #475569;
      text-align: center;
      font-weight: 600;
    }
    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-title">
        <h1>GeorgeFctech-<span>3D</span></h1>
        <p class="subtitle">Modelagem • Escultura • Impressão 3D</p>
        <p class="desc">Manufatura Aditiva de Engenharia & Prototipagem Avançada</p>
      </div>
      <div class="header-meta">
        <div class="doc-title" style="font-weight: bold; font-size: 13px;">PROPOSTA DE FATURAMENTO</div>
        <div style="font-weight: bold; color: #1e1b4b; margin: 4px 0;">Firma Responsável: GeorgeFctech-3D</div>
        <div>Emissão: ${dateFormatted}</div>
        <div>ID: G3D-REP-${new Date().getFullYear()}</div>
      </div>
    </div>

    <div class="intro-details">
      <div><strong>Destinatário / Solicitante:</strong> ${clientLabel}</div>
      <div style="margin-top: 6px;"><strong>Descrição do Escopo:</strong> Consolidação periódica de serviços englobando Engenharia Mecânica de Campo, Modelagem Tridimensional Paramétrica de Peças Técnicas, Fatiamento Computacional e Impressão 3D (FDM). Valores baseados em custos operacionais e técnicos de peças.</div>
    </div>

    <div class="section-title">1. Demonstrativo Financeiro Comercial</div>
    <table class="metric-table">
      <thead>
        <tr>
          <th>Métrica Técnica</th>
          <th style="text-align: right;">Valor Acumulado</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="metric-dot"></span>Tempo Alocado em Processamento / Máquina Ativo</td>
          <td style="text-align: right; font-family: monospace; font-weight: bold;">${totalHours.toFixed(1)} h</td>
        </tr>
        <tr>
          <td><span class="metric-dot"></span>Massa Total de Polímeros Termoplásticos Utilizada</td>
          <td style="text-align: right; font-family: monospace; font-weight: bold;">${totalWeight.toFixed(2)} g</td>
        </tr>
        <tr style="background-color: #f8fafc; font-weight: bold;">
          <td style="font-size: 14px; color: #0f172a;">VALOR LÍQUIDO TOTAL A FATURAR DA ORDEM</td>
          <td style="text-align: right; font-size: 16px; color: #059669; font-family: monospace;">${formatBRL(totalValue)}</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">2. Detalhamento de Serviços Realizados</div>
    <table>
      <thead>
        <tr>
          <th>Origem</th>
          <th>Modelo / Especificação Física</th>
          <th>Material</th>
          <th style="text-align: center;">Tempo (h)</th>
          <th style="text-align: right;">Preço</th>
        </tr>
      </thead>
      <tbody>
        ${filteredProjects.map(p => `
          <tr>
            <td style="font-weight: bold; color: #0f172a;">${p.client}</td>
            <td>
              <div style="font-weight: bold;">${p.name}</div>
              <div style="font-size: 10px; color: #64748b; font-style: italic; margin-top: 2px;">${p.description}</div>
            </td>
            <td style="font-family: monospace; color: #475569;">${p.materialType}</td>
            <td style="text-align: center; font-family: monospace; font-weight: 600;">${p.hours.toFixed(1)}h</td>
            <td class="price-col">${formatBRL(calculateEarnings(p))}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="commercial-terms">
      <div style="font-weight: bold; margin-bottom: 6px; color: #0f172a;">Termos & Condições Comerciais:</div>
      <div>• <strong>Prazo de Validade Comercial</strong>: Esta estimativa/proposta é válida por 10 dias úteis a contar de sua emissão.</div>
      <div>• <strong>Garantia Mecânica</strong>: Todas as peças técnicas de reposição passam por inspeção de tensões físicas e térmicas antes do envio.</div>
      <div>• <strong>Observação</strong>: Impressão realizada por deposição de termoplástico fundido (FDM) calibrado sob bicos de engenharia.</div>
    </div>

    <div class="signatures">
      <div>
        <div class="signature-line">GeorgeFctech-3D<br><span style="font-size: 10px; font-weight: normal; color: #64748b;">Especialista Responsável</span></div>
      </div>
      <div>
        <div class="signature-line">Conferido por / Setor<br><span style="font-size: 10px; font-weight: normal; color: #64748b;">Visto de Recepção</span></div>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Download compiled HTML Document
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `${reportTitle}_${new Date().toISOString().split('T')[0]}.html`);
    downloadAnchor.click();
  };

  return (
    <div className="font-sans antialiased text-slate-800">
      {/* HEADER WITH PRINTABLE EXPLANATION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-950 mb-1">
            Demonstrativo Técnico & Faturamento Comercial
          </h1>
          <p className="text-sm text-slate-500">
            Gere demonstrativos fiscais ou propostas em papel físico ou PDF. Use filtros para exportar relatórios de setores específicos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-4 md:mt-0 no-print">
          {/* Customer Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase font-mono whitespace-nowrap">Solicitante:</span>
            <select
              value={selectedSub}
              onChange={(e) => setSelectedSub(e.target.value)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {clients.map(cl => (
                <option key={cl} value={cl}>{cl}</option>
              ))}
            </select>
          </div>

          <button
            onClick={downloadHtmlReport}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition duration-200 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            SALVAR EM HTML
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition duration-200"
          >
            <Printer className="w-4 h-4" />
            IMPRIMIR DOCUMENTO
          </button>
        </div>
      </div>

      {showIframeNotice && (
        <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs shadow-xs no-print flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-800 shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm mb-0.5 text-amber-950">Aviso sobre Impressão no Modo de Visualização</p>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              O navegador bloqueia a impressão direta quando o aplicativo está sendo mostrado dentro de um painel incorporado (iframe). 
              Para gerar o PDF ou imprimir fisicamente, clique no ícone <strong className="font-semibold text-amber-950">"Open in new window" / "Abrir em nova janela"</strong> (no canto superior direito do painel de visualização) e tente imprimir por lá!
            </p>
          </div>
        </div>
      )}

      {/* REPORT PAPER - ELEGANT CHASTE WHITE STYLE SHEET */}
      <div id="print-area" className="bg-white text-slate-800 p-8 md:p-14 rounded-xl border border-slate-200 shadow-md relative max-w-4xl mx-auto print:p-0 print:border-none print:shadow-none print:text-black">
        
        {/* PREMIUM GOLD CORNER TAB */}
        <div className="absolute top-0 right-0 w-32 h-3 bg-gradient-to-l from-indigo-500 to-indigo-700 rounded-tr-xl print:hidden"></div>

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b-2 border-slate-800">
          <div>
            <div className="text-2xl font-extrabold font-display uppercase tracking-tight text-slate-900">
              GeorgeFctech-<span className="text-indigo-650">3D</span>
            </div>
            <p className="text-[10px] font-mono tracking-widest text-indigo-600 uppercase mt-1">
              Modelagem • Escultura • Impressão 3D
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Manufatura Aditiva de Engenharia & Prototipagem Avançada.
            </p>
          </div>
          
          <div className="text-right mt-4 sm:mt-0 font-mono text-xs text-slate-600">
            <div className="font-bold text-slate-950 uppercase tracking-wider mb-1">PROPOSTA DE FATURAMENTO</div>
            <div className="font-bold text-slate-900 mb-1">Firma Responsável: GeorgeFctech-3D</div>
            <div>Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
            <div className="text-[10px] mt-1 text-slate-500">Documento ID: G3D-REP-{new Date().getFullYear()}</div>
          </div>
        </div>

        {/* INTRO DETAILS */}
        <div className="mb-8 p-4 rounded bg-slate-100 text-xs text-slate-600 border-l-4 border-slate-800">
          <p className="mb-1"><strong>Destinatário / Solicitante:</strong> {selectedSub === 'Todos' ? 'Geral / Setores Consolidados' : selectedSub}</p>
          <p><strong>Descrição do Escopo:</strong> Consolidação periódica de serviços englobando Engenharia Mecânica de Campo, Modelagem Tridimensional Paramétrica de Peças Técnicas, Fatiamento Computacional e Impressão 3D (FDM). Valores baseados em custos operacionais e técnicos de peças.</p>
        </div>

        {/* FINANCIAL CONSOLIDATION SUMMARY */}
        <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase border-b-2 border-slate-300 pb-2 mb-4 font-display">
          1. Demonstrativo Financeiro Comercial
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full mb-8 border-collapse text-sm">
            <thead>
              <tr className="bg-slate-200">
                <th className="p-3 text-left font-mono uppercase text-xs text-slate-700">Métrica Técnica</th>
                <th className="p-3 text-right font-mono uppercase text-xs text-slate-700">Valor Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              <tr>
                <td className="p-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                  Tempo Alocado em Processamento / Máquina Activo
                </td>
                <td className="p-3 text-right font-mono font-bold text-slate-900">
                  {totalHours.toFixed(1)} h
                </td>
              </tr>
              <tr>
                <td className="p-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                  Massa Total de Polímeros Termoplásticos Utilizada
                </td>
                <td className="p-3 text-right font-mono font-bold text-slate-900">
                  {totalWeight.toFixed(2)} g
                </td>
              </tr>
              <tr className="bg-slate-100">
                <td className="p-3 font-semibold text-slate-900">
                  VALOR LÍQUIDO TOTAL A FATURAR DA ORDEM
                </td>
                <td className="p-3 text-right font-mono font-extrabold text-emerald-600 text-base md:text-lg">
                  {formatBRL(totalValue)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DETAILED LOG */}
        <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase border-b-2 border-slate-300 pb-2 mb-4 font-display">
          2. Detalhamento de Serviços Realizados
        </h3>

        <div className="overflow-x-auto mb-10">
          {filteredProjects.length > 0 ? (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-50 text-slate-700 text-left">
                  <th className="py-2.5 px-3">Origem</th>
                  <th className="py-2.5 px-3">Modelo / Especificação Física</th>
                  <th className="py-2.5 px-3">Material</th>
                  <th className="py-2.5 px-3 text-center">Tempo (h)</th>
                  <th className="py-2.5 px-3 text-right">Preço (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {filteredProjects.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-3 font-semibold text-slate-950">
                      {p.client}
                    </td>
                    <td className="py-3 px-3 max-w-xs">
                      <div className="font-bold">{p.name}</div>
                      <div className="text-[10px] text-slate-500 italic mt-0.5">{p.description}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {p.materialType}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-semibold">
                      {p.hours.toFixed(1)}h
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                      {formatBRL(calculateEarnings(p))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-6 text-slate-500 italic">
              Nenhuma ordem comercial pendente ou lançada neste escopo.
            </div>
          )}
        </div>

        {/* COMMERCIAL TERMS */}
        <div className="border-t border-slate-300 pt-6 space-y-2 text-[11px] text-slate-500 leading-relaxed mb-12">
          <p>• <strong>Prazo de Validade Comercial</strong>: Esta estimativa/proposta é válida por 10 dias úteis a contar de sua emissão.</p>
          <p>• <strong>Garantia Mecânica</strong>: Todas as peças técnicas de reposição passam por inspeção de tensões físicas e térmicas antes do envio.</p>
          <p>• <strong>Observação</strong>: Impressão realizada por deposição de termoplástico fundido (FDM) calibrado sob bicos de engenharia.</p>
        </div>

        {/* SIGNATURE FIELDS */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-12 text-xs font-mono text-slate-600 pt-8 border-t border-slate-200">
          <div className="text-center w-52">
            <div className="h-0.5 w-full bg-slate-400 mb-2"></div>
            <strong>GeorgeFctech-3D</strong>
            <div className="text-[10px] text-slate-500 mt-1">Especialista Responsável</div>
          </div>
          <div className="text-center w-52">
            <div className="h-0.5 w-full bg-slate-400 mb-2"></div>
            <strong>Conferido por / Setor</strong>
            <div className="text-[10px] text-slate-500 mt-1">Visto de Recepção</div>
          </div>
        </div>
      </div>
    </div>
  );
}
