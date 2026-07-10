/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo, useEffect } from 'react';
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
  AlertCircle,
  QrCode,
  Camera,
  ScanLine,
  FileText
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { ShoppingItem, InventoryItem } from '../types';

const ensureAbsoluteUrl = (url: string | undefined, productName?: string): string => {
  if (!url || !url.trim()) {
    if (productName) {
      return `https://lista.mercadolivre.com.br/${encodeURIComponent(productName)}`;
    }
    return '';
  }
  const trimmed = url.trim();
  
  // If it is just a search phrase or non-standard link like "mercado livre"
  if (!trimmed.includes('.') || trimmed.includes(' ')) {
    if (trimmed.toLowerCase().includes('mercado') || trimmed.toLowerCase().includes('ml')) {
      return `https://lista.mercadolivre.com.br/${encodeURIComponent(productName || trimmed)}`;
    }
    return `https://www.google.com/search?q=${encodeURIComponent(productName || trimmed)}`;
  }

  if (/^(f|ht)tps?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

const getProductImage = (item: ShoppingItem): string => {
  // If item already contains an image (optional, in case we add one in future)
  if ((item as any).image) return (item as any).image;
  
  const link = (item.purchaseLink || '').toLowerCase();
  const name = item.materialName.toLowerCase();
  
  // Specific checks for common items with high-resolution Unsplash photos
  if (name.includes('papel') || name.includes('sulfite') || name.includes('a4') || name.includes('report')) {
    return 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=200&auto=format&fit=crop&q=80';
  }
  if (name.includes('caneta') || name.includes('lápis') || name.includes('bic')) {
    return 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&auto=format&fit=crop&q=80';
  }
  if (name.includes('teclado') || name.includes('keyboard') || name.includes('mouse')) {
    return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=200&auto=format&fit=crop&q=80';
  }
  if (name.includes('fita') || name.includes('adesiva') || name.includes('marrom') || name.includes('embalagem')) {
    return 'https://images.unsplash.com/photo-1603513492128-ba7bc9b3e143?w=200&auto=format&fit=crop&q=80';
  }
  if (name.includes('grampeador') || name.includes('clip')) {
    return 'https://images.unsplash.com/photo-1541829015-64654fd2c906?w=200&auto=format&fit=crop&q=80';
  }
  if (name.includes('organizador') || name.includes('acrílico') || name.includes('gaveta')) {
    return 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=200&auto=format&fit=crop&q=80';
  }
  if (name.includes('almofada') || name.includes('ergonômica') || name.includes('cadeira') || name.includes('assento')) {
    return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=200&auto=format&fit=crop&q=80';
  }
  if (name.includes('filamento') || name.includes('pla') || name.includes('petg') || name.includes('abs') || name.includes('rolo')) {
    return 'https://images.unsplash.com/photo-1615840287214-7fe58a8f3685?w=200&auto=format&fit=crop&q=80';
  }
  if (name.includes('bico') || name.includes('nozzle') || name.includes('extrusora') || name.includes('reparo')) {
    return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80';
  }
  if (name.includes('placa') || name.includes('fonte') || name.includes('circuito') || name.includes('cooler') || name.includes('módulo')) {
    return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=80';
  }
  
  // Try mapping common websites from link
  if (link.includes('mercadolivre') || link.includes('mlb')) {
    return 'https://images.unsplash.com/photo-1472851294608-062f824d296e?w=200&auto=format&fit=crop&q=80';
  }
  if (link.includes('amazon')) {
    return 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=200&auto=format&fit=crop&q=80';
  }
  if (link.includes('shopee')) {
    return 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=200&auto=format&fit=crop&q=80';
  }
  if (link.includes('aliexpress')) {
    return 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=200&auto=format&fit=crop&q=80';
  }

  // Fallback default professional product box
  return 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&auto=format&fit=crop&q=80';
};

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
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMode, setScannerMode] = useState<'create' | 'search'>('create');
  
  // Form states (Add)
  const [materialName, setMaterialName] = useState('');
  const [qtyNeeded, setQtyNeeded] = useState(1);
  const [estUnitCost, setEstUnitCost] = useState(120.00);
  const [purchaseLink, setPurchaseLink] = useState('');
  const [category, setCategory] = useState<'Filamento' | 'Peças de Reposição' | 'Acessórios/Insumos' | 'Outros'>(() => {
    return userRole === 'colaborador' ? 'Acessórios/Insumos' : 'Filamento';
  });
  const [notes, setNotes] = useState('');
  const [requestedBy, setRequestedBy] = useState(() => {
    return sessionStorage.getItem('g3d_username') || sessionStorage.getItem('g3d_user_email') || '';
  });
  const [department, setDepartment] = useState('');
  const [company, setCompany] = useState('');
  const [barcode, setBarcode] = useState('');

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Todos');
  const [filterStatus, setFilterStatus] = useState<string>('Todos'); // 'Todos' | 'Pendentes' | 'Comprados'
  const [filterCompany, setFilterCompany] = useState<string>('Todos'); // Custom filter for Company

  // Edit mode states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState(1);
  const [editCost, setEditCost] = useState(0);
  const [editLink, setEditLink] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategory, setEditCategory] = useState<'Filamento' | 'Peças de Reposição' | 'Acessórios/Insumos' | 'Outros'>('Filamento');
  const [editRequestedBy, setEditRequestedBy] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editBarcode, setEditBarcode] = useState('');

  // General Independent Report customizer fields (stored in local state for print visualization)
  const [reportCompany, setReportCompany] = useState('');
  const [reportResponsible, setReportResponsible] = useState('');
  const [reportDepartment, setReportDepartment] = useState('');

  // Inventory Registration Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleScanSuccess = (code: string, matchedProduct?: any) => {
    if (scannerMode === 'search') {
      setSearchQuery(code);
      setToastMessage(`Busca ativada pelo código: ${code}. ${matchedProduct ? `Item: ${matchedProduct.name}` : ''}`);
    } else {
      if (matchedProduct) {
        setMaterialName(matchedProduct.name);
        setEstUnitCost(matchedProduct.cost);
        setCategory(matchedProduct.category);
        setNotes(`[Escaneado: ${code}] ${matchedProduct.notes}`);
        setCompany(matchedProduct.company || 'GeorgeFctech Comercial');
        setBarcode(code);
        
        // Auto-open form if closed
        setFormOpen(true);
        setToastMessage(`Produto localizado: ${matchedProduct.name}! Preenchido com sucesso.`);
      } else {
        // Unknown code
        setMaterialName(`Produto [Código: ${code}]`);
        setNotes(`[Código de barras/QR: ${code}]`);
        setCompany('GeorgeFctech Comercial');
        setBarcode(code);
        setFormOpen(true); // Ensure open
        setToastMessage(`Código desconhecido (${code}). Preparamos o campo com o código do produto.`);
      }
    }
    setScannerOpen(false);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim()) return;

    onAddShoppingItem({
      materialName: materialName.trim(),
      qtyNeeded,
      estUnitCost,
      purchaseLink: purchaseLink.trim(),
      category,
      notes: notes.trim(),
      requestedBy: requestedBy.trim() || undefined,
      department: department.trim() || undefined,
      company: company.trim() || undefined,
      barcode: barcode.trim() || undefined
    });

    // Reset Form
    setMaterialName('');
    setQtyNeeded(1);
    setEstUnitCost(120.00);
    setPurchaseLink('');
    setCategory(userRole === 'colaborador' ? 'Acessórios/Insumos' : 'Filamento');
    setNotes('');
    setRequestedBy(sessionStorage.getItem('g3d_username') || sessionStorage.getItem('g3d_user_email') || '');
    setDepartment('');
    setCompany('');
    setBarcode('');
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
    setEditRequestedBy(item.requestedBy || '');
    setEditDepartment(item.department || '');
    setEditCompany(item.company || '');
    setEditBarcode(item.barcode || '');
  };

  const handleSaveEdit = (id: string) => {
    onUpdateShoppingItem(id, {
      materialName: editName.trim(),
      qtyNeeded: editQty,
      estUnitCost: editCost,
      purchaseLink: editLink.trim(),
      category: editCategory,
      notes: editNotes.trim(),
      requestedBy: editRequestedBy.trim() || undefined,
      department: editDepartment.trim() || undefined,
      company: editCompany.trim() || undefined,
      barcode: editBarcode.trim() || undefined
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

  // Standalone HTML Commercial Report Generation with Product Photos & Active Links
  const generateReport = () => {
    if (shopping.length === 0) return;

    const selectedCompany = filterCompany !== 'Todos' ? filterCompany : 'GERAL / GeorgeFctech-3D';
    const reportTitle = `${selectedCompany.toUpperCase()} - PEDIDO COMERCIAL`;
    const dateFormatted = new Date().toLocaleDateString('pt-BR');
    const timeFormatted = new Date().toLocaleTimeString('pt-BR');

    // Excel-compatible HTML Spreadsheet 2003 wrapper that preserves rich styling, gridlines, and hyperlinks
    const excelContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Pedido Comercial</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      margin: 0;
      padding: 30px;
      background-color: #f8fafc;
    }
    .wrapper {
      max-width: 1150px;
      margin: 0 auto;
    }
    table.main-table {
      width: 1150px;
      border-collapse: collapse;
      table-layout: fixed;
      background-color: #ffffff;
    }
    .title-banner {
      background: #0f172a;
      background-image: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      color: #ffffff;
      padding: 30px;
      border-radius: 12px;
      border: 1px solid #0f172a;
    }
    .stat-card {
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 16px;
      vertical-align: top;
    }
    .stat-title {
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 6px;
    }
    .stat-value {
      font-size: 18pt;
      font-weight: 800;
    }
    th {
      background-color: #1e1b4b;
      color: #ffffff;
      font-weight: bold;
      font-size: 11pt;
      border: 1px solid #cbd5e1;
      text-align: left;
      padding: 12px 10px;
      height: 30pt;
      vertical-align: middle;
    }
    td {
      border: 1px solid #cbd5e1;
      padding: 12px 10px;
      font-size: 10pt;
      color: #1e293b;
      vertical-align: middle;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 8.5pt;
      font-weight: bold;
      text-transform: uppercase;
      text-align: center;
    }
    .link-btn {
      color: #4f46e5;
      font-weight: bold;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table" style="width: 1150px; table-layout: fixed; border-collapse: collapse;">
      <colgroup>
        <col width="380" style="width: 380px;" />
        <col width="140" style="width: 140px;" />
        <col width="60"  style="width: 60px;" />
        <col width="120" style="width: 120px;" />
        <col width="130" style="width: 130px;" />
        <col width="110" style="width: 110px;" />
        <col width="210" style="width: 210px;" />
      </colgroup>

      <!-- 1. HEADER BANNER ROW -->
      <tr style="height: 100pt;">
        <td colspan="7" class="title-banner" style="background-color: #0f172a; color: #ffffff; padding: 25px 30px; border-radius: 12px; border: 1px solid #0f172a; height: 100pt; vertical-align: middle;">
          <div style="font-size: 10pt; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; color: #818cf8; margin-bottom: 6px;">
            GeorgeFctech 3D &bull; Gestão de Insumos
          </div>
          <div style="font-size: 20pt; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 10px; color: #ffffff;">
            ${reportTitle}
          </div>
          <div style="font-size: 10pt; color: #94a3b8; font-family: 'Segoe UI', sans-serif;">
            <span>🕒 Gerado em: <strong style="color: #cbd5e1;">${dateFormatted} às ${timeFormatted}</strong></span>
            &nbsp;&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;&nbsp;
            <span>🏢 Empresa: <strong style="color: #cbd5e1;">${selectedCompany}</strong></span>
            &nbsp;&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;&nbsp;
            <span>📦 Total de Itens: <strong style="color: #cbd5e1;">${shopping.length}</strong></span>
          </div>
        </td>
      </tr>

      <!-- Spacing Row -->
      <tr style="height: 15pt;"><td colspan="7" style="border: none; height: 15pt;"></td></tr>

      <!-- 2. STATS CARD ROW (Implemented as nested table for absolute side-by-side reliability) -->
      <tr style="height: 65pt;">
        <td colspan="7" style="border: none; padding: 0; height: 65pt;">
          <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
            <tr>
              <!-- Card 1 -->
              <td class="stat-card" style="width: 32%; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; vertical-align: top;">
                <div class="stat-title" style="font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Custo Previsto Geral</div>
                <div class="stat-value" style="font-size: 18pt; font-weight: 800; color: #4f46e5;">R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </td>
              <!-- Spacing -->
              <td style="width: 2%; border: none;"></td>
              <!-- Card 2 -->
              <td class="stat-card" style="width: 32%; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; vertical-align: top;">
                <div class="stat-title" style="font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Itens Pendentes</div>
                <div class="stat-value" style="font-size: 18pt; font-weight: 800; color: #b45309;">${shopping.filter(i => !i.checked).length} de ${shopping.length}</div>
              </td>
              <!-- Spacing -->
              <td style="width: 2%; border: none;"></td>
              <!-- Card 3 -->
              <td class="stat-card" style="width: 32%; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; vertical-align: top;">
                <div class="stat-title" style="font-size: 9pt; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Itens Adquiridos</div>
                <div class="stat-value" style="font-size: 18pt; font-weight: 800; color: #059669;">${shopping.filter(i => i.checked).length}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Spacing Row -->
      <tr style="height: 20pt;"><td colspan="7" style="border: none; height: 20pt;"></td></tr>

      <!-- 3. DATA TABLE HEADERS -->
      <tr style="height: 32pt;">
        <th style="width: 380px; background-color: #1e1b4b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 12px 10px; font-size: 11pt; vertical-align: middle; text-align: left;">Material / Produto</th>
        <th style="width: 140px; background-color: #1e1b4b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 12px 10px; font-size: 11pt; vertical-align: middle; text-align: center;">Categoria</th>
        <th style="width: 60px; background-color: #1e1b4b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 12px 10px; font-size: 11pt; vertical-align: middle; text-align: center;">Qtd</th>
        <th style="width: 120px; background-color: #1e1b4b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 12px 10px; font-size: 11pt; vertical-align: middle; text-align: right;">Unitário</th>
        <th style="width: 130px; background-color: #1e1b4b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 12px 10px; font-size: 11pt; vertical-align: middle; text-align: right;">Custo Total</th>
        <th style="width: 110px; background-color: #1e1b4b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 12px 10px; font-size: 11pt; vertical-align: middle; text-align: center;">Status</th>
        <th style="width: 210px; background-color: #1e1b4b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 12px 10px; font-size: 11pt; vertical-align: middle; text-align: center;">Link de Acesso</th>
      </tr>

      <!-- 4. DATA ROWS -->
      ${shopping.map((item, index) => {
        const itemTotal = item.qtyNeeded * item.estUnitCost;
        const absoluteUrl = ensureAbsoluteUrl(item.purchaseLink, item.materialName);
        
        const statusText = item.checked ? 'Comprado' : 'Pendente';
        const statusColor = item.checked ? '#047857' : '#b45309';
        const statusBg = item.checked ? '#ecfdf5' : '#fffbeb';
        const statusBorder = item.checked ? '#a7f3d0' : '#fde68a';
        
        const categoryLabel = item.category || 'Outros';
        
        // Custom Category styling based on standard modern palette
        let catColor = '#334155';
        let catBg = '#f1f5f9';
        let catBorder = '#e2e8f0';
        if (categoryLabel === 'Filamento') {
          catColor = '#4338ca';
          catBg = '#eef2ff';
          catBorder = '#c7d2fe';
        } else if (categoryLabel === 'Peças de Reposição') {
          catColor = '#b91c1c';
          catBg = '#fef2f2';
          catBorder = '#fecaca';
        } else if (categoryLabel === 'Acessórios/Insumos') {
          catColor = '#0f766e';
          catBg = '#f0fdfa';
          catBorder = '#ccfbf1';
        }

        const rowBg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        const details = item.notes ? `<div style="font-size: 8.5pt; color: #64748b; font-weight: normal; margin-top: 4px; font-style: italic;">Obs: ${item.notes}</div>` : '';
        const barcodeText = item.barcode ? `<div style="font-size: 8.5pt; color: #4338ca; font-weight: bold; margin-top: 2px;">Cód/Modelo: ${item.barcode}</div>` : '';

        return `
          <tr style="height: auto; background-color: ${rowBg};">
            <td style="width: 380px; border: 1px solid #cbd5e1; text-align: left; padding: 12px 10px; font-weight: bold; color: #0f172a; vertical-align: middle;">
              <div style="font-size: 10.5pt; color: #0f172a;">${item.materialName}</div>
              ${barcodeText}
              ${details}
            </td>
            <td style="width: 140px; border: 1px solid #cbd5e1; text-align: center; padding: 12px 10px; vertical-align: middle;">
              <span class="badge" style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 8pt; font-weight: bold; text-transform: uppercase; background-color: ${catBg}; color: ${catColor}; border: 1px solid ${catBorder};">
                ${categoryLabel}
              </span>
            </td>
            <td style="width: 60px; border: 1px solid #cbd5e1; text-align: center; padding: 12px 10px; font-weight: bold; color: #0f172a; vertical-align: middle; font-size: 11pt;">
              ${item.qtyNeeded}
            </td>
            <td style="width: 120px; border: 1px solid #cbd5e1; text-align: right; padding: 12px 10px; color: #1e293b; vertical-align: middle; font-family: Courier New, monospace; font-weight: bold;">
              R$ ${item.estUnitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td style="width: 130px; border: 1px solid #cbd5e1; text-align: right; padding: 12px 10px; font-weight: bold; color: #4f46e5; vertical-align: middle; font-family: Courier New, monospace;">
              R$ ${itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td style="width: 110px; border: 1px solid #cbd5e1; text-align: center; padding: 12px 10px; vertical-align: middle;">
              <span class="badge" style="display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 8.5pt; font-weight: bold; text-transform: uppercase; background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">
                ${statusText}
              </span>
            </td>
            <td style="width: 210px; border: 1px solid #cbd5e1; text-align: center; padding: 12px 10px; vertical-align: middle;">
              <a href="${absoluteUrl}" class="link-btn" style="color: #4f46e5; text-decoration: underline; font-weight: bold; font-size: 9.5pt;">Acessar Link</a>
            </td>
          </tr>
        `;
      }).join('')}

      <!-- 5. VALOR TOTAL ROW -->
      <tr style="height: 35pt; background-color: #f1f5f9;">
        <td colspan="4" style="border: 1px solid #cbd5e1; text-align: right; font-weight: bold; font-size: 11pt; color: #1e293b; padding: 12px 10px; vertical-align: middle;">
          VALOR TOTAL ESTIMADO DO PEDIDO:
        </td>
        <td style="border: 1px solid #cbd5e1; text-align: right; font-weight: bold; font-size: 12pt; color: #4f46e5; padding: 12px 10px; vertical-align: middle; font-family: Courier New, monospace;">
          R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td colspan="2" style="border: 1px solid #cbd5e1; background-color: #f1f5f9; vertical-align: middle;"></td>
      </tr>
    </table>
  </div>
</body>
</html>`;

    // Download compiled Excel Spreadsheet
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `Pedido_Comercial_${new Date().toISOString().split('T')[0]}.xls`);
    downloadAnchor.click();
  };

  // Standalone HTML Commercial Report Generation with Product Photos & Active Links
  const downloadHtmlReport = () => {
    if (shopping.length === 0) return;

    const selectedCompany = filterCompany !== 'Todos' ? filterCompany : 'GERAL / GeorgeFctech-3D';
    const reportTitle = `${selectedCompany.toUpperCase()} - PEDIDO COMERCIAL`;
    const dateFormatted = new Date().toLocaleDateString('pt-BR');
    const timeFormatted = new Date().toLocaleTimeString('pt-BR');

    // Create a beautifully-styled, print-ready standalone HTML document
    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle}</title>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 40px 20px;
      background-color: #f8fafc;
      color: #1e293b;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    }
    .header-banner {
      background-color: #1e1b4b;
      background-image: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      color: #ffffff;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left h1 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.025em;
    }
    .header-left p {
      margin: 0;
      font-size: 14px;
      color: #c7d2fe;
    }
    .header-right {
      text-align: right;
    }
    .header-right h2 {
      margin: 0 0 5px 0;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #a5b4fc;
    }
    .header-right p {
      margin: 0;
      font-size: 12px;
      color: #cbd5e1;
      font-family: monospace;
    }
    .stats-grid {
      display: grid;
      grid-template-cols: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
    }
    .stat-card h3 {
      margin: 0 0 8px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }
    .stat-card p {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      color: #1e1b4b;
      font-family: monospace;
    }
    .stat-card.amber p {
      color: #b45309;
    }
    .stat-card.emerald p {
      color: #047857;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 16px;
      border-bottom: 2px solid #e2e8f0;
      text-align: left;
    }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
      color: #334155;
    }
    tr:hover td {
      background-color: #f8fafc;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-filamento { background-color: #eef2ff; color: #4338ca; }
    .badge-pecas { background-color: #fef2f2; color: #b91c1c; }
    .badge-acessorios { background-color: #f0fdfa; color: #0d9488; }
    .badge-outros { background-color: #f1f5f9; color: #475569; }
    
    .badge-status-comprado { background-color: #ecfdf5; color: #047857; }
    .badge-status-pendente { background-color: #fffbeb; color: #b45309; }

    .price {
      font-family: monospace;
      font-weight: bold;
      text-align: right;
    }
    .price-total {
      color: #4f46e5;
    }
    .link-btn {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }
    .link-btn:hover {
      text-decoration: underline;
    }
    .notes {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      font-style: italic;
    }
    .barcode {
      font-family: monospace;
      font-size: 10px;
      color: #4f46e5;
      font-weight: bold;
      background-color: #eef2ff;
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 4px;
    }
    .total-row {
      background-color: #f8fafc;
      font-weight: 800;
    }
    .total-row td {
      border-top: 2px solid #e2e8f0;
      font-size: 14px;
      color: #1e1b4b;
    }
    .footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 25px;
      margin-top: 4px;
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 40px;
    }
    .signature-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #cbd5e1;
      margin-top: 40px;
      padding-top: 8px;
      font-size: 12px;
      color: #64748b;
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
      }
      .header-banner {
        background-color: #ffffff !important;
        background-image: none !important;
        color: #000000 !important;
        border-bottom: 2px solid #000000;
        padding: 10px 0;
        margin-bottom: 20px;
      }
      .header-left p, .header-right h2, .header-right p {
        color: #334155 !important;
      }
      .stat-card {
        border: 1px solid #cbd5e1 !important;
      }
      th {
        background-color: #f8fafc !important;
        color: #000000 !important;
        border-bottom: 2px solid #cbd5e1 !important;
      }
      tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-banner">
      <div class="header-left">
        <h1>GeorgeFctech 3D &bull; Gestão de Insumos</h1>
        <p>Relatório de Planejamento de Compras Comerciais</p>
      </div>
      <div class="header-right">
        <h2>${selectedCompany.toUpperCase()}</h2>
        <p>Gerado em: ${dateFormatted} às ${timeFormatted}</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>Custo Previsto Geral</h3>
        <p>R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      <div class="stat-card amber">
        <h3>Itens Pendentes</h3>
        <p>${shopping.filter(i => !i.checked).length} de ${shopping.length}</p>
      </div>
      <div class="stat-card emerald">
        <h3>Itens Adquiridos</h3>
        <p>${shopping.filter(i => i.checked).length}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Material / Produto</th>
          <th>Categoria</th>
          <th>Solicitante / Setor</th>
          <th style="text-align: center;">Qtd</th>
          <th style="text-align: right;">Unitário</th>
          <th style="text-align: right;">Custo Total</th>
          <th>Status</th>
          <th>Link para Compra</th>
        </tr>
      </thead>
      <tbody>
        ${filteredShopping.map(item => {
          const itemTotal = item.qtyNeeded * item.estUnitCost;
          const absoluteUrl = ensureAbsoluteUrl(item.purchaseLink, item.materialName);
          const statusText = item.checked ? 'Adquirido' : 'Pendente';
          const statusClass = item.checked ? 'badge-status-comprado' : 'badge-status-pendente';
          
          let catClass = 'badge-outros';
          if (item.category === 'Filamento') catClass = 'badge-filamento';
          else if (item.category === 'Peças de Reposição') catClass = 'badge-pecas';
          else if (item.category === 'Acessórios/Insumos') catClass = 'badge-acessorios';

          const reqText = item.requestedBy || 'Administração';
          const deptText = item.department ? ` - Setor: ${item.department}` : '';

          return `
            <tr>
              <td>
                <div style="font-weight: bold; color: #0f172a;">${item.materialName}</div>
                ${item.barcode ? `<div class="barcode">Cód: ${item.barcode}</div>` : ''}
                ${item.notes ? `<div class="notes">Obs: ${item.notes}</div>` : ''}
              </td>
              <td>
                <span class="badge ${catClass}">${item.category || 'Outros'}</span>
              </td>
              <td>
                <div style="font-weight: 500;">${reqText}</div>
                <div style="font-size: 11px; color: #64748b;">${deptText}</div>
              </td>
              <td style="text-align: center; font-weight: bold;">
                ${item.qtyNeeded}
              </td>
              <td class="price">
                R$ ${item.estUnitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td class="price price-total">
                R$ ${itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td>
                <span class="badge ${statusClass}">${statusText}</span>
              </td>
              <td>
                <a href="${absoluteUrl}" class="link-btn" target="_blank" rel="noreferrer">Acessar Link</a>
              </td>
            </tr>
          `;
        }).join('')}
        
        <tr class="total-row">
          <td colspan="5" style="text-align: right; padding-right: 20px;">VALOR TOTAL DO PEDIDO:</td>
          <td class="price" style="color: #4f46e5; font-size: 15px;">
            R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
          <td colspan="2"></td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <div class="signature-box">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-align: left;">Assinatura do Responsável Técnico:</p>
        <div class="signature-line">Gestão de Suprimentos - GeorgeFctech-3D</div>
      </div>
      <div class="signature-box">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-align: left;">Liberação e Aprovação de Custos:</p>
        <div class="signature-line">Departamento Financeiro / Comercial</div>
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
    downloadAnchor.setAttribute('download', `Pedido_Comercial_${new Date().toISOString().split('T')[0]}.html`);
    downloadAnchor.click();
    
    setToastMessage("Sucesso! O relatório de compras foi baixado como arquivo HTML.");
    setTimeout(() => setToastMessage(null), 4000);
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

  // Dynamic list of unique companies for filtering
  const companiesList = useMemo(() => {
    const list = new Set<string>();
    shopping.forEach(item => {
      if (item.company?.trim()) {
        list.add(item.company.trim());
      }
    });
    return Array.from(list);
  }, [shopping]);

  // Filtering Logic
  const filteredShopping = shopping.filter(item => {
    const matchesSearch = item.materialName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.barcode && item.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.requestedBy && item.requestedBy.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.department && item.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.company && item.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (searchQuery.replace(/\D/g, '').length > 0 && 
                           item.notes && item.notes.replace(/\D/g, '').includes(searchQuery.replace(/\D/g, '')));
    const matchesCategory = filterCategory === 'Todos' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'Todos' || 
                          (filterStatus === 'Pendentes' && !item.checked) || 
                          (filterStatus === 'Comprados' && item.checked);
    const matchesCompany = filterCompany === 'Todos' ||
                          (item.company && item.company.toLowerCase() === filterCompany.toLowerCase()) ||
                          (!item.company && filterCompany.toLowerCase() === 'georgefctech-3d');

    return matchesSearch && matchesCategory && matchesStatus && matchesCompany;
  });

  // Calculate stats per category
  const categoriesList = userRole === 'colaborador'
    ? ['Acessórios/Insumos', 'Outros']
    : ['Filamento', 'Peças de Reposição', 'Acessórios/Insumos', 'Outros'];
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
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-transparent border border-slate-200 flex items-center justify-center p-0">
              <img 
                referrerPolicy="no-referrer"
                src={userRole === 'colaborador'
                  ? "https://lh3.googleusercontent.com/gps-cs-s/APNQkAForRZzi0p_dHcu4q-uB5_6Hmh_ZWM1hwqil-EcrY-fKLUJWx-Z1RHuhgUQTtqJXsV29-B0tbj3CuhgI93tL_ygBJPL6nmLWh2TGr4Imchb-7y8ozTXVOdxt5UFk-PmJqQndhUJLw=w229-h164-n-k-no-nu"
                  : "https://vyvompcoiaizoluuxnzx.supabase.co/storage/v1/object/sign/img/meu_logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lYTFhZWQwNC03M2Y5LTQwODQtOWNiOS04ODBkMTA3MzAwY2UiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWcvbWV1X2xvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MTc5NTUxOCwiZXhwIjoxODc2NDAzNTE4fQ.JgHY5piKmwxjB0nfW08joAWsNE-JYRA5kUUkVra9hFI"}
                alt="GeorgeFctech Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {userRole === 'colaborador' ? 'GeorgeFctech Comercial' : 'GeorgeFctech-3D'}
              </h2>
              <p className="text-[10px] text-slate-500 font-mono">
                {userRole === 'colaborador' ? 'Gestão Comercial & Planejamento de Compras' : 'Gestão Comercial & Suprimentos de Impressão 3D'}
              </p>
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
            {userRole === 'colaborador' ? 'Fazer Pedido de Compras' : 'Planejamento de Compras & Suprimentos'}
          </h1>
          <p className="text-sm text-slate-500">
            {userRole === 'colaborador' 
              ? 'Cadastre novos pedidos de compras comerciais para reabastecimento. Pesquise e imprima a tabela comercial.'
              : 'Monitore custos operacionais de aquisição de filamentos e peças sob demanda para sua oficina. Economize exportando ordens prontas para planilhas.'
            }
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 select-none">
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            {formOpen ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {formOpen ? "Fechar Painel" : (userRole === 'colaborador' ? "Fazer Pedido" : "Cadastrar Item de Compra")}
          </button>

          <button
            onClick={generateReport}
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
            onClick={downloadHtmlReport}
            disabled={shopping.length === 0}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-200 ${
              shopping.length === 0 
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-800 hover:scale-102 cursor-pointer'
            }`}
          >
            <FileText className="w-4 h-4" />
            SALVAR RELATÓRIO EM HTML
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
            IMPRIMIR TABELA COMERCIAL
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
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
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
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Nome do Material ou Insumo *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setScannerMode('create');
                      setScannerOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 rounded-lg transition-all duration-150 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Escanear Código (Barras/QR)</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder={userRole === 'colaborador' ? "Ex: Papel Sulfite A4 Report, Teclado USB, Caneta Bic..." : "Ex: Filamento PETG HT Alta Temperatura 1kg Preto"}
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
                  {userRole !== 'colaborador' && <option value="Filamento">Filamento de Impressão</option>}
                  {userRole !== 'colaborador' && <option value="Peças de Reposição">Peças de Reposição (Bicos, Correias)</option>}
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
              <div>
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

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Código de Barras / Modelo do Produto</label>
                <input
                  type="text"
                  placeholder="Ex: 7891000311500 ou QR_ORGANIZER_PRO"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full text-sm px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 bg-white shadow-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-dashed border-slate-200">
              <div>
                <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1.5">Nome da Empresa (Destino do Relatório) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: FTEX, GeorgeFctech-3D..."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full text-sm px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 bg-white shadow-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nome do Funcionário Responsável *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: José, George..."
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="w-full text-sm px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 bg-white shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Setor de Trabalho *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Linha branca, Manutenção..."
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
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
      {lowStockItems.length > 0 && userRole !== 'colaborador' && (
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
        <div className="relative flex-1 flex gap-2">
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
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
          
          <button
            type="button"
            onClick={() => {
              setScannerMode('search');
              setScannerOpen(true);
            }}
            title="Escanear Código de Barras / QR para Buscar"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs uppercase tracking-wider cursor-pointer shadow-3xs transition duration-150 shrink-0"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Buscar p/ Scanner</span>
          </button>
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

        {/* Company filter dropdown */}
        <div className="flex items-center gap-1.5 bg-slate-150 p-1 rounded-lg">
          <span className="text-[10px] font-bold font-mono uppercase text-slate-500 px-1.5">
            Empresa:
          </span>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-md py-1 px-2.5 focus:outline-none focus:border-indigo-500 text-slate-800"
          >
            <option value="Todos">Todas</option>
            <option value="georgefctech-3d">GeorgeFctech-3D</option>
            {companiesList.filter(c => c.toLowerCase() !== 'georgefctech-3d').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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
          <div className="hidden md:block print:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 select-none">
                  <th className="py-3 px-5 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono w-12 text-center no-print">Status</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono material-col">Material / Item Planejado</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono category-col">Categoria</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono company-col">Empresa</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono requester-col">Solicitante / Setor</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono text-center qty-col">Qtd.</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono text-right price-col">Valor Unitário</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono text-right total-col">Custo Total</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono text-center no-print">Ações</th>
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
                      <td className="py-3.5 px-4 material-col">
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
                            <input
                              type="text"
                              value={editBarcode}
                              onChange={(e) => setEditBarcode(e.target.value)}
                              placeholder="Código de Barras ou Modelo do Produto..."
                              className="w-full text-[11px] px-3 py-1.5 border border-slate-300 rounded-md focus:border-indigo-500 text-slate-850 bg-white font-mono"
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
                          <div className="flex items-center gap-3">
                            {/* Product Image Thumbnail */}
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center shadow-3xs print:border print:border-slate-300">
                              <img 
                                src={getProductImage(item)} 
                                alt={item.materialName} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className={`font-bold text-sm leading-tight block ${
                                item.checked ? 'text-slate-400 line-through font-semibold' : 'text-slate-900 font-sans'
                              }`}>
                                {item.materialName}
                              </span>
                              {item.barcode && (
                                <div className="mt-0.5">
                                  <span className="inline-block font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 select-all dark:bg-indigo-950/40 dark:border-indigo-900">
                                    Cód/Modelo: {item.barcode}
                                  </span>
                                </div>
                              )}
                              {item.notes && (
                                <p className={`text-xs mt-0.5 max-w-md truncate ${item.checked ? 'text-slate-400 line-through' : 'text-slate-500'}`}>
                                  {item.notes}
                                </p>
                              )}
                              {item.purchaseLink ? (
                                <a
                                  href={ensureAbsoluteUrl(item.purchaseLink, item.materialName)}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-650 hover:text-indigo-800 mt-1 hover:underline print:text-blue-600 print:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 no-print" />
                                  <span>Acessar Link de Compra</span>
                                </a>
                              ) : (
                                <a
                                  href={ensureAbsoluteUrl(undefined, item.materialName)}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-450 hover:text-indigo-700 mt-1 hover:underline print:text-blue-600 print:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 no-print" />
                                  <span>Pesquisar para Comprar</span>
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Category icon and tag badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap category-col">
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

                      {/* Empresa */}
                      <td className="py-3.5 px-4 company-col">
                        {isEditing ? (
                          <input
                            type="text"
                            placeholder="Empresa (Ex: FTEX)"
                            value={editCompany}
                            onChange={(e) => setEditCompany(e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500 text-slate-800 bg-white"
                          />
                        ) : (
                          <span className={`font-semibold text-sm ${item.checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            {item.company || <span className="text-slate-400 italic text-xs">GeorgeFctech-3D</span>}
                          </span>
                        )}
                      </td>

                      {/* Solicitante / Setor */}
                      <td className="py-3.5 px-4 requester-col">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="Funcionário (Ex: José)"
                              value={editRequestedBy}
                              onChange={(e) => setEditRequestedBy(e.target.value)}
                              className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500 text-slate-800 bg-white"
                            />
                            <input
                              type="text"
                              placeholder="Setor (Ex: Linha branca)"
                              value={editDepartment}
                              onChange={(e) => setEditDepartment(e.target.value)}
                              className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded-md focus:outline-none focus:border-indigo-500 text-slate-800 bg-white"
                            />
                          </div>
                        ) : (
                          <div>
                            <p className={`font-semibold text-xs ${item.checked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                              {item.requestedBy || <span className="text-slate-400 italic text-xs">Administração</span>}
                            </p>
                            {item.department && (
                              <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-bold tracking-wider">
                                Setor: {item.department}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Qtd */}
                      <td className="py-3.5 px-4 text-center font-mono text-sm qty-col">
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
                      <td className="py-3.5 px-4 text-right font-mono text-xs price-col">
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
                      <td className="py-3.5 px-4 text-right font-mono text-sm total-col">
                        <span className={`font-bold ${item.checked ? 'text-slate-400 font-semibold' : 'text-indigo-700 font-semibold'}`}>
                          R$ {itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Actions Column */}
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
                              {item.category === 'Filamento' && item.checked && userRole !== 'colaborador' && (
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE LIST */}
          <div className="md:hidden print:hidden divide-y divide-slate-200">
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
                    <div className="flex items-start gap-3 w-full">
                      <button
                        onClick={() => onToggleShoppingItemChecked(item.id)}
                        className={`mt-1.5 h-6 w-6 rounded border flex items-center justify-center transition cursor-pointer no-print shrink-0 ${
                          item.checked 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-slate-300 hover:border-indigo-500 bg-white'
                        }`}
                      >
                        {item.checked && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="flex-1 min-w-0">
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
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Código de Barras / Modelo</label>
                              <input
                                type="text"
                                value={editBarcode}
                                onChange={(e) => setEditBarcode(e.target.value)}
                                className="w-full text-xs font-mono px-2.5 py-1.5 border border-slate-300 rounded-md focus:border-indigo-500 text-slate-800 bg-white"
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
                            <div className="space-y-2 pt-2 border-t border-dashed border-slate-200">
                              <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Empresa</label>
                                <input
                                  type="text"
                                  value={editCompany}
                                  onChange={(e) => setEditCompany(e.target.value)}
                                  className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded-md text-slate-800 bg-white"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Solicitante</label>
                                  <input
                                    type="text"
                                    value={editRequestedBy}
                                    onChange={(e) => setEditRequestedBy(e.target.value)}
                                    className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded-md text-slate-800 bg-white"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Setor</label>
                                  <input
                                    type="text"
                                    value={editDepartment}
                                    onChange={(e) => setEditDepartment(e.target.value)}
                                    className="w-full text-xs px-2.5 py-1 border border-slate-300 rounded-md text-slate-800 bg-white"
                                  />
                                </div>
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
                            {item.barcode && (
                              <div className="mt-1">
                                <span className="inline-block font-mono text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 select-all dark:bg-indigo-950/40 dark:border-indigo-900">
                                  Cód/Modelo: {item.barcode}
                                </span>
                              </div>
                            )}
                            {item.notes && (
                              <p className={`text-xs mt-1 ${item.checked ? 'text-slate-400 line-through' : 'text-slate-500'}`}>
                                {item.notes}
                              </p>
                            )}
                            <div className="mt-1 bg-slate-50 p-2 rounded border border-slate-150 space-y-1">
                              <p className="text-[11px] text-slate-700">
                                <strong className="text-slate-500">Empresa:</strong> {item.company || 'GeorgeFctech-3D'}
                              </p>
                              <p className="text-[11px] text-slate-700">
                                <strong className="text-slate-500">Solicitante:</strong> {item.requestedBy || 'Administração'} {item.department ? `(${item.department})` : ''}
                              </p>
                            </div>
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
                                  href={ensureAbsoluteUrl(item.purchaseLink)}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-650 hover:underline print:text-blue-600 print:underline"
                                >
                                  <ExternalLink className="w-2.5 h-2.5 no-print" />
                                  <span>Acessar Link de Compra</span>
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

                      <div className="flex items-center gap-1 no-print">
                        {item.category === 'Filamento' && item.checked && userRole !== 'colaborador' && (
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
      {userRole !== 'colaborador' && (
        <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-5 no-print text-xs text-slate-600 space-y-2.5 select-none">
          <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Dicas de Gestor de Suprimentos
          </h5>
          <p className="leading-relaxed">
            Sempre que um filamento em planejamento for adquirido, marque o checkbox correspondente. Se o item pertencer à categoria **Filamentos**, um assistente de 1 clique ficará visível permitindo empurrar esses rolos direto pro seu estoque físico de insumos sem precisar redigitar dados.
          </p>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-indigo-600 text-white font-bold text-xs px-4 py-3 rounded-lg shadow-xl uppercase tracking-wider animate-bounce no-print">
          {toastMessage}
        </div>
      )}

      {/* SCANNER MODAL */}
      <ScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

    </div>
  );
}

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string, productData?: any) => void;
}

export function ScannerModal({ isOpen, onClose, onScanSuccess }: ScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'simulation' | 'camera'>('simulation');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [typedCode, setTypedCode] = useState('');

  const MOCK_BARCODES: Record<string, { name: string; cost: number; category: 'Acessórios/Insumos' | 'Outros'; company: string; notes: string }> = {
    "7891000311500": {
      name: "Papel Sulfite A4 Report 75g (Pacote 500 folhas)",
      cost: 32.50,
      category: "Acessórios/Insumos",
      company: "GeorgeFctech Comercial",
      notes: "Papel de alta alvura para relatórios e faturas comerciais"
    },
    "7891234567890": {
      name: "Caneta Esferográfica Azul Bic (Caixa com 50un)",
      cost: 45.00,
      category: "Acessórios/Insumos",
      company: "GeorgeFctech Comercial",
      notes: "Canetas para preenchimento de termos e notas"
    },
    "7890123456789": {
      name: "Teclado USB Com Fio Standard Dell",
      cost: 89.90,
      category: "Outros",
      company: "GeorgeFctech Comercial",
      notes: "Substituição de periférico operacional"
    },
    "7896001201550": {
      name: "Fita Adesiva Larga Marrom 45mm x 50m (Pacote com 4)",
      cost: 28.00,
      category: "Acessórios/Insumos",
      company: "GeorgeFctech Comercial",
      notes: "Embalagens de remessas comerciais"
    },
    "7898000505100": {
      name: "Grampeador de Mesa de Metal Standard",
      cost: 42.90,
      category: "Acessórios/Insumos",
      company: "GeorgeFctech Comercial",
      notes: "Organização de tabelas e recibos de compras"
    },
    "QR_ORGANIZER_PRO": {
      name: "Organizador de Documentos Acrílico Triplo",
      cost: 65.00,
      category: "Acessórios/Insumos",
      company: "GeorgeFctech Comercial",
      notes: "Organização de notas e relatórios mensais"
    },
    "QR_CHAIR_PAD": {
      name: "Almofada Ergonômica de Assento de Espuma de Memória",
      cost: 120.00,
      category: "Outros",
      company: "GeorgeFctech Comercial",
      notes: "Ergonomia para o caixa comercial"
    }
  };

  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') return;

    let html5QrCode: Html5Qrcode | null = null;
    const elementId = "qr-reader-container";

    const startScanner = async () => {
      try {
        setCameraError(null);
        setScanning(true);
        html5QrCode = new Html5Qrcode(elementId);
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            // Success
            handleCodeScanned(decodedText);
          },
          () => {
            // seeking...
          }
        );
      } catch (err: any) {
        console.error("Camera access error:", err);
        setCameraError("Não foi possível acessar a câmera do dispositivo. Certifique-se de que o aplicativo tem permissão de acesso à câmera ou use a Simulação.");
        setScanning(false);
      }
    };

    startScanner();

    return () => {
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => {
            html5QrCode?.clear();
          }).catch(err => console.error("Error stopping scanner:", err));
        }
      }
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleCodeScanned = (code: string) => {
    const codeTrimmed = code.trim();
    const matched = MOCK_BARCODES[codeTrimmed];
    onScanSuccess(codeTrimmed, matched);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedCode.trim()) return;
    handleCodeScanned(typedCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-indigo-50/20 dark:bg-slate-950/20">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
              Leitor de Código de Barras / QR Code
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition duration-150 cursor-pointer text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-955/40 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('simulation')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'simulation'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-3xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Simulador / Entrada Manual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-3xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Leitor via Câmera (Real)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'camera' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Aponte a câmera para o código de barras ou código QR do produto.
              </p>
              
              <div className="relative">
                <div id="qr-reader-container" className="overflow-hidden rounded-xl bg-black aspect-video w-full max-w-sm mx-auto border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  {!scanning && !cameraError && (
                    <span className="text-xs text-slate-400">Iniciando câmera...</span>
                  )}
                  {cameraError && (
                    <div className="p-4 text-center max-w-xs space-y-2">
                      <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 leading-normal">{cameraError}</p>
                    </div>
                  )}
                </div>
                {scanning && !cameraError && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-indigo-500 border-dashed rounded-lg animate-pulse flex items-center justify-center">
                      <ScanLine className="w-full text-indigo-450 animate-bounce" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Manual Input */}
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Digite ou Cole o Código de Barras / QR Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={typedCode}
                    onChange={(e) => setTypedCode(e.target.value)}
                    placeholder="Ex: 7891000311500 ou QR_ORGANIZER_PRO"
                    className="flex-1 text-xs px-3.5 py-2 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-white bg-white dark:bg-slate-950 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition cursor-pointer"
                  >
                    Simular
                  </button>
                </div>
              </form>

              {/* Simulation options */}
              <div className="space-y-2 pt-2 border-t border-dashed border-slate-100 dark:border-slate-800">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Sugestões de Produtos Comerciais Prontos
                </span>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {Object.entries(MOCK_BARCODES).map(([code, prod]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleCodeScanned(code)}
                      className="p-3 bg-slate-50 dark:bg-slate-950/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 rounded-xl text-left transition text-xs font-medium cursor-pointer"
                    >
                      <div className="font-bold text-slate-800 dark:text-white flex items-center justify-between gap-1">
                        <span className="truncate">{prod.name}</span>
                        <span className="text-[10px] text-indigo-650 dark:text-indigo-400 shrink-0 font-mono font-bold">R$ {prod.cost.toFixed(2)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 flex items-center justify-between">
                        <span>Código: {code}</span>
                        <span>{prod.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg duration-150 cursor-pointer"
          >
            Fechar
          </button>
        </div>

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
