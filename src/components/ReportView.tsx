/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Printer, Calendar, FileText, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { ProjectOrder, InventoryItem } from '../types';

interface ReportViewProps {
  projects: ProjectOrder[];
  inventory: InventoryItem[];
}

export default function ReportView({ projects, inventory }: ReportViewProps) {
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

  const generateExcelReport = () => {
    const findInventoryItem = (materialName: string) => {
      if (!inventory) return null;
      return inventory.find(i => 
        i.material.toLowerCase().includes(materialName.toLowerCase()) ||
        materialName.toLowerCase().includes(i.material.toLowerCase())
      );
    };

    const formatBRLHtml = (val: number) => {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const ensureAbsoluteUrl = (url?: string, searchFallback?: string) => {
      if (!url) {
        return `https://lista.mercadolivre.com.br/${encodeURIComponent(searchFallback || 'filamento 3d')}`;
      }
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      return `https://${url}`;
    };

    const rowsHtml = filteredProjects.map((p, idx) => {
      const matchedFilament = findInventoryItem(p.materialType);
      const filamentPurchaseLink = ensureAbsoluteUrl(matchedFilament?.purchaseLink, `filamento ${p.materialType}`);
      const projectPrice = calculateEarnings(p);
      const rowClass = idx % 2 === 0 ? 'tr-odd' : 'tr-even';

      return `
        <tr class="${rowClass}">
          <td class="cell-id">${p.id}</td>
          <td style="text-align: center; border: 1px solid #cbd5e1;">${new Date(p.date).toLocaleDateString('pt-BR')}</td>
          <td style="border: 1px solid #cbd5e1;">${p.client}</td>
          <td style="border: 1px solid #cbd5e1;">${p.name}</td>
          <td style="font-family: monospace; text-align: center; border: 1px solid #cbd5e1;">${p.barcode || '-'}</td>
          <td style="border: 1px solid #cbd5e1;">${p.materialType}</td>
          <td class="cell-number" style="border: 1px solid #cbd5e1;">${p.hours.toFixed(1)}</td>
          <td class="cell-currency" style="border: 1px solid #cbd5e1;">${formatBRLHtml(p.hourlyRate)}</td>
          <td class="cell-number" style="border: 1px solid #cbd5e1;">${p.weight.toFixed(2)}</td>
          <td class="cell-currency" style="border: 1px solid #cbd5e1;">${formatBRLHtml(p.materialRate)}</td>
          <td class="cell-currency" style="border: 1px solid #cbd5e1;">${formatBRLHtml(p.profitMargin)}</td>
          <td class="cell-total-value" style="border: 1px solid #cbd5e1;">${formatBRLHtml(projectPrice)}</td>
          <td class="cell-link" style="border: 1px solid #cbd5e1;"><a href="${filamentPurchaseLink}" style="color: #2563eb; text-decoration: underline; font-weight: bold;">Ver Filamento 🔗</a></td>
        </tr>
      `;
    }).join('');

    const excelHtml = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8"/>
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Faturamento GeorgeFctech-3D</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    table {
      border-collapse: collapse;
      font-family: 'Segoe UI', 'Calibri', sans-serif;
    }
    td, th {
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      font-size: 10pt;
    }
    .header-main {
      background-color: #0f172a;
      color: #ffffff;
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      height: 40px;
    }
    .header-sub {
      background-color: #1e293b;
      color: #cbd5e1;
      font-size: 10pt;
      font-style: italic;
      text-align: center;
      height: 25px;
    }
    .meta-label {
      font-weight: bold;
      color: #475569;
      background-color: #f1f5f9;
      text-align: left;
    }
    .meta-value {
      color: #0f172a;
      text-align: left;
    }
    .metric-title {
      font-size: 11pt;
      font-weight: bold;
      color: #1e293b;
      background-color: #f1f5f9;
      text-align: center;
    }
    .metric-value {
      font-size: 13pt;
      font-weight: bold;
      text-align: center;
      color: #0f172a;
      background-color: #ffffff;
    }
    .metric-value-total {
      font-size: 13pt;
      font-weight: bold;
      text-align: center;
      color: #059669;
      background-color: #ecfdf5;
    }
    .th-col {
      background-color: #4f46e5;
      color: #ffffff;
      font-weight: bold;
      text-align: center;
      font-size: 10pt;
    }
    .tr-odd {
      background-color: #ffffff;
    }
    .tr-even {
      background-color: #f8fafc;
    }
    .cell-id {
      font-family: 'Courier New', monospace;
      text-align: center;
      font-weight: bold;
      color: #475569;
    }
    .cell-number {
      text-align: right;
    }
    .cell-currency {
      text-align: right;
      color: #334155;
    }
    .cell-total-value {
      text-align: right;
      font-weight: bold;
      color: #059669;
      background-color: #ecfdf5;
    }
    .cell-link {
      text-align: center;
    }
    .total-row {
      font-weight: bold;
      background-color: #f1f5f9;
      color: #0f172a;
    }
    .total-row-val {
      font-weight: bold;
      background-color: #ecfdf5;
      color: #059669;
    }
  </style>
</head>
<body>
  <table>
    <!-- Main Header -->
    <tr>
      <td colspan="13" class="header-main" style="background-color: #0f172a; color: #ffffff; font-size: 16pt; font-weight: bold; text-align: center; height: 40px; border: 1px solid #cbd5e1;">GeorgeFctech-3D</td>
    </tr>
    <tr>
      <td colspan="13" class="header-sub" style="background-color: #1e293b; color: #cbd5e1; font-size: 10pt; font-style: italic; text-align: center; height: 25px; border: 1px solid #cbd5e1;">Modelagem, Escultura & Manufatura Aditiva - Relatório de Faturamento</td>
    </tr>
    
    <!-- Spacers -->
    <tr><td colspan="13" style="border: none; height: 10px;"></td></tr>

    <!-- Meta Information -->
    <tr>
      <td colspan="2" class="meta-label" style="font-weight: bold; background-color: #f1f5f9; border: 1px solid #cbd5e1;">Data de Geração:</td>
      <td colspan="4" class="meta-value" style="border: 1px solid #cbd5e1;">${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</td>
      <td colspan="2" class="meta-label" style="font-weight: bold; background-color: #f1f5f9; border: 1px solid #cbd5e1;">Filtro Cliente:</td>
      <td colspan="5" class="meta-value" style="border: 1px solid #cbd5e1;"><strong>${selectedSub}</strong></td>
    </tr>

    <!-- Spacers -->
    <tr><td colspan="13" style="border: none; height: 10px;"></td></tr>

    <!-- Summary Box -->
    <tr>
      <td colspan="4" class="metric-title" style="font-weight: bold; background-color: #f1f5f9; text-align: center; border: 1px solid #cbd5e1;">Horas Técnicas Totais</td>
      <td colspan="4" class="metric-title" style="font-weight: bold; background-color: #f1f5f9; text-align: center; border: 1px solid #cbd5e1;">Peso de Filamento Consumido</td>
      <td colspan="5" class="metric-title" style="font-weight: bold; background-color: #f1f5f9; text-align: center; border: 1px solid #cbd5e1;">Valor Total Faturado (BRL)</td>
    </tr>
    <tr>
      <td colspan="4" class="metric-value" style="text-align: center; background-color: #ffffff; border: 1px solid #cbd5e1; font-weight: bold;">${totalHours.toFixed(1)} h</td>
      <td colspan="4" class="metric-value" style="text-align: center; background-color: #ffffff; border: 1px solid #cbd5e1; font-weight: bold;">${totalWeight.toFixed(2)} g</td>
      <td colspan="5" class="metric-value-total" style="text-align: center; background-color: #ecfdf5; color: #059669; border: 1px solid #cbd5e1; font-weight: bold;">${formatBRLHtml(totalValue)}</td>
    </tr>

    <!-- Spacers -->
    <tr><td colspan="13" style="border: none; height: 15px;"></td></tr>

    <!-- Table Header -->
    <tr>
      <th class="th-col" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; width: 100px;">Cód. Serviço</th>
      <th class="th-col" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; width: 100px;">Data</th>
      <th class="th-col" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; width: 150px;">Cliente</th>
      <th class="th-col" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; width: 250px;">Nome do Projeto</th>
      <th class="th-col" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; width: 120px;">Cód / Modelo</th>
      <th class="th-col" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; width: 150px;">Tipo de Material</th>
      <th class="th-col" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; width: 80px;">Horas (h)</th>
      <th class="th-col" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; width: 100px;">Taxa/h</th>
      <th class="th-col" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; width: 80px;">Peso (g)</th>
      <th class="th-col" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; width: 100px;">Taxa/g</th>
      <th class="th-col" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; width: 100px;">Margem</th>
      <th class="th-col" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; width: 120px;">Valor Total</th>
      <th class="th-col" style="background-color: #4f46e5; color: #ffffff; font-weight: bold; text-align: center; border: 1px solid #cbd5e1; width: 160px;">Link p/ Reposição</th>
    </tr>

    <!-- Table Rows -->
    ${rowsHtml || '<tr><td colspan="13" style="text-align: center; color: #64748b; border: 1px solid #cbd5e1;">Nenhum item lançado no escopo selecionado.</td></tr>'}

    <!-- Table Totals Footer -->
    <tr class="total-row" style="background-color: #f1f5f9; font-weight: bold;">
      <td colspan="6" style="text-align: right; font-weight: bold; border: 1px solid #cbd5e1;">TOTAIS CONSOLIDADOS:</td>
      <td class="cell-number" style="font-weight: bold; border: 1px solid #cbd5e1; text-align: right;">${totalHours.toFixed(1)}</td>
      <td style="background-color: #f1f5f9; border: 1px solid #cbd5e1;"></td>
      <td class="cell-number" style="font-weight: bold; border: 1px solid #cbd5e1; text-align: right;">${totalWeight.toFixed(2)}</td>
      <td style="background-color: #f1f5f9; border: 1px solid #cbd5e1;"></td>
      <td class="cell-number" style="font-weight: bold; border: 1px solid #cbd5e1; text-align: right;">${formatBRLHtml(filteredProjects.reduce((sum, p) => sum + p.profitMargin, 0))}</td>
      <td class="total-row-val" style="font-weight: bold; background-color: #ecfdf5; color: #059669; border: 1px solid #cbd5e1; text-align: right;">${formatBRLHtml(totalValue)}</td>
      <td style="background-color: #f1f5f9; border: 1px solid #cbd5e1;"></td>
    </tr>
  </table>
</body>
</html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-faturamento-G3D-${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            onClick={generateExcelReport}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition duration-200 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            EXPORTAR PARA EXCEL
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition duration-200 cursor-pointer"
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
