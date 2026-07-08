/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Download, 
  Printer,
  Check, 
  AlertTriangle, 
  ClipboardList, 
  Link as LinkIcon,
  Edit2,
  Tag,
  Search,
  CheckCircle,
  Filter,
  Layers,
  Wrench,
  Sparkles,
  Package,
  HelpCircle,
  ArchiveRestore,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { ShoppingItem, InventoryItem } from '../types';

interface ShoppingListViewProps {
  shopping: ShoppingItem[];
  inventory: InventoryItem[];
  onAddShoppingItem: (item: Omit<ShoppingItem, 'id' | 'checked'>) => void;
  onDeleteShoppingItem: (id: string) => void;
  onUpdateShoppingItem: (id: string, updatedFields: Partial<ShoppingItem>) => void;
  onToggleShoppingItemChecked: (id: string) => void;
  onAddInventoryItem: (item: Omit<InventoryItem, 'id' | 'gramCost' | 'status'>) => void;
  userRole?: string;
}

export default function ShoppingListView({
  shopping,
  inventory,
  onAddShoppingItem,
  onDeleteShoppingItem,
  onUpdateShoppingItem,
  onToggleShoppingItemChecked,
  onAddInventoryItem,
  userRole
}: ShoppingListViewProps) {
  const [formOpen, setFormOpen] = useState(false);
  
  // Form states (Add)
  const [materialName, setMaterialName] = useState('');
  const [qtyNeeded, setQtyNeeded] = useState(1);
  const [estUnitCost, setEstUnitCost] = useState(120.00);
  const [purchaseLink, setPurchaseLink] = useState('');
  const [category, setCategory] = useState<'Filamento' | 'Peças de Reposição' | 'Acessórios/Insumos' | 'Outros'>('Filamento');
  const [notes, setNotes] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<string>('Todos'); // 'Todos' | 'Pendentes' | 'Comprados'

  // Edit mode states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState(1);
  const [editCost, setEditCost] = useState(0);
  const [editLink, setEditLink] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategory, setEditCategory] = useState<'Filamento' | 'Peças de Reposição' | 'Acessórios/Insumos' | 'Outros'>('Filamento');

  // Inventory Registration Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim()) return;

    onAddShoppingItem({
      materialName: materialName.trim(),
      qtyNeeded,
      estUnitCost,
      purchaseLink: purchaseLink.trim(),
      category,
      notes: notes.trim()
    });

    // Reset Form
    setMaterialName('');
    setQtyNeeded(1);
    setEstUnitCost(120.00);
    setPurchaseLink('');
    setCategory('Filamento');
    setNotes('');
    setFormOpen(false);
  };

  const handleStartEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditName(item.materialName);
    setEditQty(item.qtyNeeded);
    setEditCost(item.estUnitCost);
    setEditLink(item.purchaseLink);
    setEditNotes(item.notes || '');
    setEditCategory(item.category);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateShoppingItem(id, {
      materialName: editName.trim(),
      qtyNeeded: editQty,
      estUnitCost: editCost,
      purchaseLink: editLink.trim(),
      category: editCategory,
      notes: editNotes.trim()
    });
    setEditingId(null);
  };

  // Automated item replenishment from inventory warnings
  const lowStockItems = inventory.filter(item => item.qty <= 1);

  const handleAddFromLowStock = (item: InventoryItem) => {
    const defaultLink = item.purchaseLink || 'https://www.mercadolivre.com.br/';
    onAddShoppingItem({
      materialName: `Filamento ${item.material} (Reposição)`,
      qtyNeeded: 2, 
      estUnitCost: item.unitCost || 130.00,
      purchaseLink: defaultLink,
      category: 'Filamento',
      notes: `Reabastecimento sugerido. Estoque crítico atual: ${item.qty} rolos.`
    });
  };

  // Excel Link-Friendly Format HTML Spreadsheet Generation
  const generateExcel = () => {
    if (shopping.length === 0) return;

    const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<style>
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  th { background-color: #4f46e5; color: #ffffff; font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; font-weight: bold; padding: 10px; border: 1px solid #cbd5e1; text-align: left; }
  td { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; padding: 8px; border: 1px solid #e2e8f0; vertical-align: middle; }
  .title-cell { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 16px; font-weight: bold; color: #4f46e5; background-color: #f8fafc; padding: 15px; border-bottom: 2px solid #cbd5e1; }
  .info-cell { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 11px; color: #64748b; background-color: #f8fafc; padding: 5px 15px 15px 15px; border-bottom: 1px solid #e2e8f0; }
  .number-col { text-align: right; font-family: 'Consolas', monospace; font-size: 11px; }
  .center-col { text-align: center; }
  .status-bought { background-color: #d1fae5; color: #065f46; font-weight: bold; text-align: center; }
  .status-pending { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; }
  .link-btn { color: #2563eb; font-weight: bold; text-decoration: underline; }
</style>
</head>
<body>
  <table>
    <tr>
      <td colspan="9" class="title-cell" style="font-size: 16px; font-weight: bold; color: #4f46e5; text-align: center;">GEORGEFCTECH 3D - TABELA COMERCIAL DE PEDIDOS</td>
    </tr>
    <tr>
      <td colspan="9" class="info-cell" style="text-align: center; color: #475569;">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | Total Planejado: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
    <thead>
      <tr>
        <th style="width: 110px;">ID Único</th>
        <th style="width: 280px;">Material / Item Planejado</th>
        <th style="width: 140px;">Categoria</th>
        <th style="width: 70px; text-align: center;">Qtd.</th>
        <th style="width: 130px; text-align: right;">Custo Unitário</th>
        <th style="width: 130px; text-align: right;">Custo Total</th>
        <th style="width: 130px; text-align: center;">Status</th>
        <th style="width: 150px; text-align: center;">Link de Compra</th>
        <th style="width: 220px;">Observações</th>
      </tr>
    </thead>
    <tbody>
      ${shopping.map(item => `
        <tr>
          <td>${item.id}</td>
          <td style="font-weight: bold; color: #0f172a;">${item.materialName}</td>
          <td>${item.category}</td>
          <td class="center-col">${item.qtyNeeded}</td>
          <td class="number-col">R$ ${item.estUnitCost.toFixed(2)}</td>
          <td class="number-col" style="font-weight: bold; color: #4f46e5;">R$ ${(item.qtyNeeded * item.estUnitCost).toFixed(2)}</td>
          <td class="${item.checked ? 'status-bought' : 'status-pending'}">
            ${item.checked ? 'Comprado' : 'Pendente'}
          </td>
          <td class="center-col">
            ${item.purchaseLink ? `=HYPERLINK("${item.purchaseLink}"; "Acessar Produto")` : '<i>Sem Link</i>'}
          </td>
          <td style="color: #475569;">${item.notes || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `Pedido_de_Compras_GeorgeFctech_${new Date().toISOString().split('T')[0]}.xls`);
    downloadAnchor.click();
  };

  // Import Purchased Filament directly to Active Inventory
  const handleImportToStock = (item: ShoppingItem) => {
    if (item.category !== 'Filamento') {
      setToastMessage("Apenas itens da categoria 'Filamento' podem ser importados para o estoque de insumos.");
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    onAddInventoryItem({
      material: item.materialName.replace(" (Reposição)", ""),
      qty: item.qtyNeeded,
      unitCost: item.estUnitCost,
      purchaseLink: item.purchaseLink
    });

    setToastMessage(`Sucesso! ${item.qtyNeeded} rolo(s) de "${item.materialName}" foram lançados no estoque ativo!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Calculations
  const totalValue = shopping.reduce((acc, i) => acc + (i.qtyNeeded * i.estUnitCost), 0);
  const pendingValue = shopping.filter(i => !i.checked).reduce((acc, i) => acc + (i.qtyNeeded * i.estUnitCost), 0);
  const boughValue = shopping.filter(i => i.checked).reduce((acc, i) => acc + (i.qtyNeeded * i.estUnitCost), 0);

  // Filtering Logic
  const filteredShopping = shopping.filter(item => {
    const matchesSearch = item.materialName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'Todos' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'Todos' || 
                          (filterStatus === 'Pendentes' && !item.checked) || 
                          (filterStatus === 'Comprados' && item.checked);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate stats per category
  const categoriesList = ['Filamento', 'Peças de Reposição', 'Acessórios/Insumos', 'Outros'];
  const getCategoryStats = (cat: string) => {
    const items = shopping.filter(i => i.category === cat);
    const count = items.length;
    const total = items.reduce((sum, i) => sum + (i.qtyNeeded * i.estUnitCost), 0);
    return { count, total };
  };

  // Helper icons for categories
  const getCategoryIcon = (cat: string, sizeClass = "w-4 h-4") => {
    switch (cat) {
      case 'Filamento':
        return <Layers className={`${sizeClass} text-indigo-500`} />;
      case 'Peças de Reposição':
        return <Wrench className={`${sizeClass} text-rose-500`} />;
      case 'Acessórios/Insumos':
        return <Package className={`${sizeClass} text-sky-500`} />;
      default:
        return <Tag className={`${sizeClass} text-slate-500`} />;
    }
  };

  return (
    <div className="font-sans antialiased text-slate-800">

      {/* PRINT-ONLY HEADER FOR COMMERCIAL INVOICE */}
      <div className="hidden print:block border-b-2 border-indigo-600 pb-5 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-bold font-display text-lg">
              GF
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">GeorgeFctech-3D</h2>
              <p className="text-[10px] text-slate-500 font-mono">Gestão Comercial & Suprimentos de Impressão 3D</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-700 font-mono">Relatório Comercial de Pedidos</h3>
            <p className="text-[10px] text-slate-500 font-mono">Data: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>
      
      {/* HEADER WITH INDUSTRIAL ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-slate-200 no-print">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-950 mb-1">
            Planejamento de Compras & Suprimentos
          </h1>
          <p className="text-sm text-slate-500">
            Monitore custos operacionais de aquisição de filamentos e peças sob demanda para sua oficina. Economize exportando ordens prontas para planilhas.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 select-none">
          {userRole !== 'colaborador' && (
            <button
              onClick={() => setFormOpen(!formOpen)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              {formOpen ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {formOpen ? "Fechar Painel" : "Cadastrar Item de Compra"}
            </button>
          )}

          <button
            onClick={generateExcel}
            disabled={shopping.length === 0}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-200 ${
              shopping.length === 0 
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 hover:scale-102 cursor-pointer'
            }`}
          >
            <Download className="w-4 h-4" />
            GERAR PEDIDO COMERCIAL EXCEL
          </button>

          <button
            onClick={() => window.print()}
            disabled={shopping.length === 0}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-200 ${
              shopping.length === 0 
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 hover:scale-102 cursor-pointer'
            }`}
          >
            <Printer className="w-4 h-4" />
            IMPRIMIR TABELA
          </button>
        </div>
      </div>

      {/* FEEDBACK INTEGRATION TOAST */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700 max-w-md animate-scale-up flex items-center gap-3">
          <div className="p-2 bg-indigo-650 rounded-lg text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* COMPACT SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-slate-400">Total Previsto</span>
            <h4 className="text-2xl font-black text-slate-900 mt-1 font-mono">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
              {shopping.length} itens no cronograma geral
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-slate-400">Total Comprado</span>
            <h4 className="text-2xl font-black text-emerald-600 mt-1 font-mono">
              R$ {boughValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
            <p className="text-[10px] text-emerald-600 mt-1.5 flex items-center gap-1 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              {shopping.filter(i => i.checked).length} finalizados
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Check className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition-all">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-slate-400">Pendente de Caixa</span>
            <h4 className="text-2xl font-black text-amber-600 mt-1 font-mono">
              R$ {pendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h4>
            <p className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1 font-medium">
              <AlertSquareSize className="w-3.5 h-3.5 text-amber-500" />
              {shopping.filter(i => !i.checked).length} aquisições pendentes
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FORM: REGULATION SLIDEOVER PANEL */}
      {formOpen && (
        <div className="bg-white border border-slate-205 rounded-xl p-6 mb-8 shadow-md no-print animate-fade-in">
          <div className="flex items-center gap-2 pb-3 border-b border-rose-50/10 mb-5">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Registrar Necessidade no Planejamento de Compras
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nome do Material ou Insumo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Filamento PETG HT Alta Temperatura 1kg Preto"
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  className="w-full text-sm px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 bg-white shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Classificação / Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-sm px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs"
                >
                  <option value="Filamento">Filamento de Impressão</option>
                  <option value="Peças de Reposição">Peças de Reposição (Bicos, Correias)</option>
                  <option value="Acessórios/Insumos">Acessórios / Outros Insumos</option>
                  <option value="Outros">Outras Despesas</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Quantidade Desejada (Rolos/Pçs)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={qtyNeeded}
                  onChange={(e) => setQtyNeeded(parseInt(e.target.value) || 1)}
                  className="w-full text-sm px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 bg-white shadow-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Valor Unitário Pago / Est (R$)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={estUnitCost}
                  onChange={(e) => setEstUnitCost(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 bg-white shadow-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Custo Geral Total</label>
                <div className="w-full text-sm px-4 py-2 bg-slate-50 border border-slate-200 text-indigo-700 font-bold rounded-lg font-mono flex items-center justify-between">
                  <span>R$</span>
                  <span>{(qtyNeeded * estUnitCost).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Hiperlink / Link do Fornecedor ou Anúncio</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <LinkIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="url"
                    placeholder="https://produto.mercadolivre.com.br/MLB-filamento-petg..."
                    value={purchaseLink}
                    onChange={(e) => setPurchaseLink(e.target.value)}
                    className="w-full text-sm pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 bg-white shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Como reabastecer (Instrução)</label>
                <input
                  type="text"
                  placeholder="Ex: Fornecedor oficial Creality"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-sm px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 bg-white shadow-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-250 rounded-lg duration-150 cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm hover:shadow duration-150 cursor-pointer"
              >
                Adicionar no Planejamento
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REPLENISHMENT SHORTCUTS (LOW STOCK WARNING) */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 mb-8 no-print flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-3xs">
          <div className="flex items-start gap-3">
            <span className="p-2.5 bg-amber-150 text-amber-700 rounded-lg mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-pulse text-amber-600" />
            </span>
            <div>
              <h5 className="font-bold text-amber-900 text-sm">Alerta: Níveis de Filamentos Baixos ou Esgotados</h5>
              <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                O analisador identificou {lowStockItems.length} insumo(s) crítico(s). Planeje o reabastecimento imediato com 1 clique abaixo.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.slice(0, 3).map(item => (
              <button
                key={item.id}
                onClick={() => handleAddFromLowStock(item)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-amber-100 border border-amber-250 text-amber-800 rounded-lg shadow-xs hover:shadow-sm duration-150 transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Agendar {item.material.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FILTER & ADVANCED SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-3xs no-print flex flex-col lg:flex-row lg:items-center gap-4 select-none">
        
        {/* Search input */}
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-2.5 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Filtrar por nome do material, notas ou especificações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Categories selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold font-mono uppercase text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> CATEGORIA:
          </span>
          {['Todos', ...categoriesList].map((cat) => {
            const stats = cat !== 'Todos' ? getCategoryStats(cat) : { count: shopping.length };
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  filterCategory === cat
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat} {stats.count > 0 && <span className="text-[10px] ml-1 opacity-70 font-mono">({stats.count})</span>}
              </button>
            );
          })}
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          {['Todos', 'Pendentes', 'Comprados'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                filterStatus === st 
                  ? 'bg-white text-slate-900 shadow-3xs' 
                  : 'text-slate-550 hover:text-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* CORE DATA DISPLAY TABLE */}
      {filteredShopping.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-3xs">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h4 className="text-md font-bold text-slate-700 mb-1">Caminho livre no seu cronograma!</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-6">
            Nenhum item em planejamento corresponde às políticas e filtros escolhidos no momento. Agende agora acima.
          </p>
          <button
            onClick={() => {
              setFilterCategory('Todos');
              setFilterStatus('Todos');
              setSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs border border-indigo-150 transition"
          >
            Limpar Filtros e Ver Todos
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 select-none">
                  <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono w-12 text-center no-print">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Material / Item Planejado</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">Categoria</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono text-center">Qtd.</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono text-right">Valor Unitário</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono text-right">Custo Total</th>
                  {userRole !== 'colaborador' && <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono text-center no-print">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShopping.map((item) => {
                  const itemTotal = item.qtyNeeded * item.estUnitCost;
                  const isEditing = editingId === item.id;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-100/40 transition duration-150 ${
                        item.checked ? 'bg-slate-50/50 opacity-80' : 'bg-transparent'
                      }`}
                    >
                      {/* Checkbox Status */}
                      <td className="py-3 px-5 text-center no-print">
                        <button
                          onClick={() => onToggleShoppingItemChecked(item.id)}
                          className={`mx-auto h-5 w-5 rounded border flex items-center justify-center transition cursor-pointer select-none ${
                            item.checked 
                              ? 'bg-emerald-600 border-emerald-600 text-white' 
                              : 'border-slate-300 hover:border-indigo-500 bg-white'
                          }`}
                        >
                          {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      </td>

                      {/* Name / Form Editable Column */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <div className="space-y-2 py-1 max-w-lg">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full text-xs font-semibold px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500 text-slate-800 bg-white"
                            />
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Editar observações..."
                              className="w-full text-[11px] px-3 py-1 border border-slate-300 rounded-md text-slate-600 bg-white"
                              rows={2}
                            />
                            <div className="flex items-center gap-2">
                              {/* Inline Category Change */}
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value as any)}
                                className="text-[11px] px-2 py-1 border border-slate-300 bg-white rounded-md text-slate-700"
                              >
                                <option value="Filamento">Filamento</option>
                                <option value="Peças de Reposição">Peças de Reposição</option>
                                <option value="Acessórios/Insumos">Acessórios/Insumos</option>
                                <option value="Outros">Outras Despesas</option>
                              </select>
                              <input
                                type="url"
                                value={editLink}
                                onChange={(e) => setEditLink(e.target.value)}
                                placeholder="Link da compra..."
                                className="text-[11px] px-2 py-1 border border-slate-300 bg-white rounded-md text-slate-700 flex-1"
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className={`font-bold text-sm leading-tight block ${
                              item.checked ? 'text-slate-400 line-through font-semibold' : 'text-slate-900 font-sans'
                            }`}>
                              {item.materialName}
                            </span>
                            {item.notes && (
                              <p className={`text-xs mt-0.5 max-w-md ${item.checked ? 'text-slate-400 line-through' : 'text-slate-500'}`}>
                                {item.notes}
                              </p>
                            )}
                            {item.purchaseLink && (
                              <a
                                href={item.purchaseLink}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-650 hover:text-indigo-800 mt-1"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Link de Fornecimentos Externos
                              </a>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Category icon and tag badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {!isEditing && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                            item.category === 'Filamento' ? 'bg-indigo-50 text-indigo-700' :
                            item.category === 'Peças de Reposição' ? 'bg-rose-50 text-rose-700' :
                            item.category === 'Acessórios/Insumos' ? 'bg-sky-50 text-sky-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {getCategoryIcon(item.category, "w-3.5 h-3.5")}
                            {item.category}
                          </span>
                        )}
                      </td>

                      {/* Qtd */}
                      <td className="py-3.5 px-4 text-center font-mono text-sm">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            value={editQty}
                            onChange={(e) => setEditQty(parseInt(e.target.value) || 1)}
                            className="w-16 text-center font-bold px-1 py-1 border border-slate-300 text-slate-800 rounded bg-white"
                          />
                        ) : (
                          <span className={item.checked ? 'text-slate-400 font-bold' : 'text-slate-800 font-bold'}>
                            {item.qtyNeeded}
                          </span>
                        )}
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3.5 px-4 text-right font-mono text-xs">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editCost}
                            onChange={(e) => setEditCost(parseFloat(e.target.value) || 0)}
                            className="w-24 text-right font-bold px-1 py-1 border border-slate-300 text-slate-800 rounded bg-white"
                          />
                        ) : (
                          <span className={item.checked ? 'text-slate-400 font-semibold' : 'text-slate-700 font-semibold'}>
                            R$ {item.estUnitCost.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Total cost */}
                      <td className="py-3.5 px-4 text-right font-mono text-sm">
                        <span className={`font-bold ${item.checked ? 'text-slate-400 font-semibold' : 'text-indigo-700 font-semibold'}`}>
                          R$ {itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Actions Column */}
                      {userRole !== 'colaborador' && (
                        <td className="py-3.5 px-4 text-center select-none no-print">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-md cursor-pointer duration-100"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-md cursor-pointer"
                              >
                                Sair
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              {/* Import to Stock Filament (Only Filament & Checked) */}
                              {item.category === 'Filamento' && item.checked && (
                                <button
                                  onClick={() => handleImportToStock(item)}
                                  title="Enviar peças faturadas ao estoque ativo de Filamentos"
                                  className="p-1 px-2 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer transition-all duration-150"
                                >
                                  <ArchiveRestore className="w-3.5 h-3.5" />
                                  +Estoque
                                </button>
                              )}

                              <button
                                onClick={() => handleStartEdit(item)}
                                title="Editar entrada técnico comercial"
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => onDeleteShoppingItem(item.id)}
                                title="Remover do cronograma"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE LIST */}
          <div className="md:hidden divide-y divide-slate-200">
            {filteredShopping.map((item) => {
              const itemTotal = item.qtyNeeded * item.estUnitCost;
              const isEditing = editingId === item.id;

              return (
                <div 
                  key={item.id} 
                  className={`p-4 space-y-3 transition duration-150 ${
                    item.checked ? 'bg-slate-50/50' : 'bg-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onToggleShoppingItemChecked(item.id)}
                        className={`mt-1.5 h-6 w-6 rounded border flex items-center justify-center transition cursor-pointer no-print ${
                          item.checked 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-slate-300 hover:border-indigo-500 bg-white'
                        }`}
                      >
                        {item.checked && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div>
                        {isEditing ? (
                          <div className="space-y-3 py-1 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nome do Item</label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-md focus:border-indigo-500 text-slate-800 bg-white"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Quantidade</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={editQty}
                                  onChange={(e) => setEditQty(parseInt(e.target.value) || 1)}
                                  className="w-full text-xs font-mono font-bold px-2.5 py-1 border border-slate-300 text-slate-800 rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Custo Unitário (R$)</label>
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  value={editCost}
                                  onChange={(e) => setEditCost(parseFloat(e.target.value) || 0)}
                                  className="w-full text-xs font-mono font-bold px-2.5 py-1 border border-slate-300 text-slate-800 rounded bg-white shadow-sm"
                                />
                              </div>
                            </div>
                            <div className="flex gap-1.5 pt-1.5 border-t border-slate-200 justify-end">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 text-xs font-bold uppercase text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-md duration-100 cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                className="px-3 py-1.5 text-xs font-bold uppercase text-white bg-indigo-600 hover:bg-indigo-700 rounded-md duration-100 cursor-pointer"
                              >
                                Salvar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className={`font-bold text-sm leading-snug block ${
                              item.checked ? 'text-slate-400 line-through' : 'text-slate-900'
                            }`}>
                              {item.materialName}
                            </span>
                            {item.notes && (
                              <p className={`text-xs mt-1 ${item.checked ? 'text-slate-400 line-through' : 'text-slate-500'}`}>
                                {item.notes}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.category === 'Filamento' ? 'bg-indigo-50 text-indigo-700' :
                                item.category === 'Peças de Reposição' ? 'bg-rose-50 text-rose-700' :
                                item.category === 'Acessórios/Insumos' ? 'bg-sky-50 text-sky-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {item.category}
                              </span>
                              {item.purchaseLink && (
                                <a
                                  href={item.purchaseLink}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[10px] font-bold text-indigo-600"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" /> Ver Link
                                </a>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isEditing && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 bg-slate-50/20 p-2.5 rounded-lg">
                      <div className="font-mono text-xs">
                        <span className="text-slate-400 mr-2">{item.qtyNeeded}x R$ {item.estUnitCost.toFixed(2)}</span>
                        <strong className={item.checked ? 'text-slate-400' : 'text-slate-900 font-bold'}>
                          R$ {itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>

                      {userRole !== 'colaborador' && (
                        <div className="flex items-center gap-1 no-print">
                          {item.category === 'Filamento' && item.checked && (
                            <button
                              onClick={() => handleImportToStock(item)}
                              className="p-1 px-2 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer"
                            >
                              +Estoque
                            </button>
                          )}
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteShoppingItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono">
            Planilha consolidada compatível com Microsoft Excel e Google Planilhas. Fórmulas de hyperlink prontas.
          </div>
        </div>
      )}

      {/* FOOTER TIPS CARD */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5 no-print text-xs text-slate-600 space-y-2.5 select-none">
        <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          Dicas de Gestor de Suprimentos
        </h5>
        <p className="leading-relaxed">
          Sempre que um filamento em planejamento for adquirido, marque o checkbox correspondente. Se o item pertencer à categoria **Filamentos**, um assistente de 1 clique ficará visível permitindo empurrar esses rolos direto pro seu estoque físico de insumos sem precisar redigitar dados.
        </p>
      </div>

    </div>
  );
}

// Custom simple fallback wrapper for icon since name matches exactly what we need
// Used in header status card indicators
function AlertSquareSize(props: any) {
  return (
    <span className="text-amber-500 shrink-0 font-bold text-[13px] font-mono leading-none flex items-center justify-center">
      !
    </span>
  );
}
