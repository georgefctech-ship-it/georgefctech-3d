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
  FileText,
  Barcode,
  CheckSquare,
  FileClock,
  Calculator
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
  currentSubView?: string;
}

export default function ShoppingListView({
  shopping: allShopping,
  inventory,
  onAddShoppingItem,
  onDeleteShoppingItem,
  onUpdateShoppingItem,
  onToggleShoppingItemChecked,
  onAddInventoryItem,
  userRole,
  currentSubView
}: ShoppingListViewProps) {
  const currentUserEmail = useMemo(() => sessionStorage.getItem('g3d_user_email') || '', []);
  const currentUsername = useMemo(() => sessionStorage.getItem('g3d_username') || '', []);

  const shopping = useMemo(() => {
    if (userRole === 'colaborador') {
      return allShopping.filter(item => {
        const reqBy = (item.requestedBy || '').toLowerCase().trim();
        const myEmail = currentUserEmail.toLowerCase().trim();
        const myName = currentUsername.toLowerCase().trim();
        
        if (!reqBy) return false;
        
        return (
          reqBy === myEmail ||
          reqBy === myName ||
          (myEmail && reqBy.includes(myEmail)) ||
          (myName && reqBy.includes(myName)) ||
          (myEmail && myEmail.split('@')[0] === reqBy)
        );
      });
    }
    return allShopping;
  }, [allShopping, userRole, currentUserEmail, currentUsername]);

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
    const username = sessionStorage.getItem('g3d_username') || '';
    const email = sessionStorage.getItem('g3d_user_email') || '';
    if (username.toLowerCase() === 'ftex' || username.toLowerCase() === 'ftéx') {
      if (email && !email.toLowerCase().includes('ftex') && !email.toLowerCase().includes('ftéx')) {
        const prefix = email.split('@')[0];
        return prefix.charAt(0).toUpperCase() + prefix.slice(1);
      }
      return '';
    }
    return username || email || '';
  });
  const [department, setDepartment] = useState('');
  const [company, setCompany] = useState(() => {
    return userRole === 'colaborador' ? 'Ftéx' : '';
  });
  const [barcode, setBarcode] = useState('');

  // Automatically pre-fill company and requestedBy for colaboradores
  useEffect(() => {
    if (userRole === 'colaborador') {
      if (!company) {
        setCompany('Ftéx');
      }
      const username = sessionStorage.getItem('g3d_username') || '';
      const email = sessionStorage.getItem('g3d_user_email') || '';
      let defaultUser = username;
      if (username.toLowerCase() === 'ftex' || username.toLowerCase() === 'ftéx') {
        if (email && !email.toLowerCase().includes('ftex') && !email.toLowerCase().includes('ftéx')) {
          const prefix = email.split('@')[0];
          defaultUser = prefix.charAt(0).toUpperCase() + prefix.slice(1);
        } else {
          defaultUser = '';
        }
      }
      if (defaultUser && !requestedBy) {
        setRequestedBy(defaultUser);
      }
    }
  }, [userRole, formOpen]);

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

  // Validation and baixa states
  const [validatingItem, setValidatingItem] = useState<ShoppingItem | null>(null);
  const [autoPushToStock, setAutoPushToStock] = useState<boolean>(true);

  const handleToggleOrValidate = (item: ShoppingItem) => {
    if (item.checked) {
      // If already checked, toggle back to unchecked (pending)
      onToggleShoppingItemChecked(item.id);
    } else {
      // If unchecked, open validation modal to offer the baixa option!
      setValidatingItem(item);
      setAutoPushToStock(true);
    }
  };

  const handleConfirmValidation = () => {
    if (!validatingItem) return;

    // 1. Mark as checked (Completed) in the database & state
    onToggleShoppingItemChecked(validatingItem.id);

    // 2. If autoPushToStock is checked, add to active inventory (estoque)
    if (autoPushToStock) {
      onAddInventoryItem({
        material: validatingItem.materialName.replace(" (Reposição)", ""),
        qty: validatingItem.qtyNeeded,
        unitCost: validatingItem.estUnitCost,
        purchaseLink: validatingItem.purchaseLink
      });
      setToastMessage(`Compra Validada! "${validatingItem.materialName}" marcada como COMPRADA e enviada para o estoque ativo.`);
    } else {
      setToastMessage(`Compra Validada! "${validatingItem.materialName}" marcada como COMPRADA.`);
    }

    // Reset state & close modal
    setValidatingItem(null);
    setTimeout(() => setToastMessage(null), 5005);
  };

  // --- COLLABORATOR EXTENDED MENUS AND CALCULATOR STATES ---
  const [colabActiveTab, setColabActiveTab] = useState<'baixa' | 'compras' | 'calculadora'>('baixa');
  const [completedPeriodFilter, setCompletedPeriodFilter] = useState<'todos' | 'hoje' | 'semana' | 'mes'>('todos');

  // Função para obter a data de compra de um item baseado no notes ou data atual
  const getPurchasedDate = (item: ShoppingItem): Date => {
    if (item.notes) {
      const dateRegex = /(\d{2})\/(\d{2})\/(\d{4}|\d{2})/;
      const match = item.notes.match(dateRegex);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        let year = parseInt(match[3], 10);
        if (year < 100) year += 2000;
        return new Date(year, month, day);
      }
    }
    return new Date();
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isThisWeek = (date: Date): boolean => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    return date >= sevenDaysAgo && date <= today;
  };

  const isThisMonth = (date: Date): boolean => {
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  // Sync colabActiveTab with currentSubView if navigated from sidebar
  useEffect(() => {
    if (currentSubView === 'baixa') {
      setColabActiveTab('baixa');
    } else if (currentSubView === 'compras_efetuadas') {
      setColabActiveTab('compras');
    } else if (currentSubView === 'calculadoras') {
      setColabActiveTab('calculadora');
    }
  }, [currentSubView]);

  // Screen Simulated Calculator States
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcSubDisplay, setCalcSubDisplay] = useState('');
  const [calcResetOnNextKey, setCalcResetOnNextKey] = useState(false);

  const handleCalcKeyPress = (key: string) => {
    if (key === 'C') {
      setCalcDisplay('0');
      setCalcSubDisplay('');
      setCalcResetOnNextKey(false);
    } else if (key === 'DEL') {
      if (calcDisplay.length > 1) {
        setCalcDisplay(calcDisplay.slice(0, -1));
      } else {
        setCalcDisplay('0');
      }
    } else if (key === '=') {
      try {
        const cleanExpression = calcDisplay.replace(/×/g, '*').replace(/÷/g, '/');
        if (/^[0-9.+\-*/\s()]+$/.test(cleanExpression)) {
          // eslint-disable-next-line no-eval
          const result = eval(cleanExpression);
          setCalcSubDisplay(calcDisplay + ' =');
          setCalcDisplay(String(Number(result.toFixed(6))));
          setCalcResetOnNextKey(true);
        } else {
          setCalcDisplay('Erro');
        }
      } catch (err) {
        setCalcDisplay('Erro');
      }
    } else if (['+', '-', '×', '÷'].includes(key)) {
      setCalcResetOnNextKey(false);
      const lastChar = calcDisplay.slice(-1);
      if (['+', '-', '×', '÷'].includes(lastChar)) {
        setCalcDisplay(calcDisplay.slice(0, -1) + key);
      } else {
        setCalcDisplay(calcDisplay + key);
      }
    } else {
      if (calcDisplay === '0' || calcDisplay === 'Erro' || calcResetOnNextKey) {
        setCalcDisplay(key === '.' ? '0.' : key);
        setCalcResetOnNextKey(false);
      } else {
        if (key === '.') {
          const parts = calcDisplay.split(/[+\-×÷]/);
          const lastPart = parts[parts.length - 1];
          if (lastPart.includes('.')) return;
        }
        setCalcDisplay(calcDisplay + key);
      }
    }
  };
  
  // Compras Efetuadas Search State
  const [completedSearchQuery, setCompletedSearchQuery] = useState('');

  // Filament Gram Cost Calculator States
  const [calcFilPrice, setCalcFilPrice] = useState<number>(150);
  const [calcFilWeight, setCalcFilWeight] = useState<number>(1000);

  // Batch Budget Calculator States
  const [calcQty, setCalcQty] = useState<number>(5);
  const [calcUnitPrice, setCalcUnitPrice] = useState<number>(35);
  const [calcShipping, setCalcShipping] = useState<number>(15);

  // Filament Length/Volumetric States
  const [calcFilType, setCalcFilType] = useState<'PLA' | 'PETG' | 'ABS'>('PLA');
  const [calcFilTotalWeight, setCalcFilTotalWeight] = useState<number>(1); // in kg

  const handleDirectBaixa = (item: ShoppingItem, pushToStock: boolean) => {
    // 1. Toggle checked status to true
    if (!item.checked) {
      onToggleShoppingItemChecked(item.id);
    }
    
    // 2. If pushToStock is selected, add to inventory
    if (pushToStock) {
      onAddInventoryItem({
        material: item.materialName.replace(" (Reposição)", ""),
        qty: item.qtyNeeded,
        unitCost: item.estUnitCost,
        purchaseLink: item.purchaseLink
      });
      setToastMessage(`Baixa Realizada! "${item.materialName}" foi marcado como COMPRADO e enviado ao estoque ativo!`);
    } else {
      setToastMessage(`Baixa Realizada! "${item.materialName}" marcado como COMPRADO.`);
    }

    setTimeout(() => setToastMessage(null), 5000);
  };

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
    const username = sessionStorage.getItem('g3d_username') || '';
    const email = sessionStorage.getItem('g3d_user_email') || '';
    let defaultUser = username;
    if (username.toLowerCase() === 'ftex' || username.toLowerCase() === 'ftéx') {
      if (email && !email.toLowerCase().includes('ftex') && !email.toLowerCase().includes('ftéx')) {
        const prefix = email.split('@')[0];
        defaultUser = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      } else {
        defaultUser = '';
      }
    }
    setRequestedBy(defaultUser);
    setDepartment('');
    setCompany(userRole === 'colaborador' ? 'Ftéx' : '');
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
    const targetItem = allShopping.find(i => i.id === id);
    if (targetItem && targetItem.checked && userRole === 'colaborador') {
      setToastMessage("Erro: Colaboradores não podem editar compras já concluídas!");
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

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

  const handleDeleteShoppingItem = (id: string) => {
    const targetItem = allShopping.find(i => i.id === id);
    if (targetItem && targetItem.checked && userRole === 'colaborador') {
      setToastMessage("Erro: Colaboradores não podem excluir compras já concluídas!");
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }
    onDeleteShoppingItem(id);
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

    const defaultCompanyLabel = userRole === 'colaborador' ? (company || 'Empresa Solicitante') : 'GeorgeFctech-3D';
    const selectedCompany = filterCompany !== 'Todos' ? filterCompany : (userRole === 'colaborador' ? (company || 'Empresa Solicitante') : `GERAL / ${defaultCompanyLabel}`);
    const reportTitle = userRole === 'colaborador' ? 'PEDIDO COMERCIAL DE COMPRAS' : `${selectedCompany.toUpperCase()} - PEDIDO COMERCIAL`;
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
          ${userRole === 'colaborador' ? '' : `
          <div style="font-size: 10pt; font-weight: bold; letter-spacing: 0.1em; text-transform: uppercase; color: #818cf8; margin-bottom: 6px;">
            GeorgeFctech 3D &bull; Gestão de Insumos
          </div>
          `}
          <div style="font-size: 20pt; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 10px; color: #ffffff;">
            ${userRole === 'colaborador' ? 'Pedido de Compras Comercial' : reportTitle}
          </div>
          <div style="font-size: 10pt; color: #94a3b8; font-family: 'Segoe UI', sans-serif;">
            <span>🕒 Gerado em: <strong style="color: #cbd5e1;">${dateFormatted} às ${timeFormatted}</strong></span>
            &nbsp;&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;&nbsp;
            <span>👤 Responsável: <strong style="color: #cbd5e1;">${requestedBy || 'Colaborador'}</strong></span>
            &nbsp;&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;&nbsp;
            <span>🏷️ Setor Responsável: <strong style="color: #cbd5e1;">${department || 'Geral'}</strong></span>
            &nbsp;&nbsp;&nbsp;&nbsp;&bull;&nbsp;&nbsp;&nbsp;&nbsp;
            <span>🏢 Empresa: <strong style="color: #cbd5e1;">${userRole === 'colaborador' ? (company || 'Empresa Solicitante') : selectedCompany}</strong></span>
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

    const defaultCompanyLabel = userRole === 'colaborador' ? (company || 'Empresa Solicitante') : 'GeorgeFctech-3D';
    const selectedCompany = filterCompany !== 'Todos' ? filterCompany : (userRole === 'colaborador' ? (company || 'Empresa Solicitante') : `GERAL / ${defaultCompanyLabel}`);
    const reportTitle = userRole === 'colaborador' ? 'PEDIDO COMERCIAL DE COMPRAS' : `${selectedCompany.toUpperCase()} - PEDIDO COMERCIAL`;
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
        <h1>${userRole === 'colaborador' ? 'Pedido de Compras Comercial' : 'GeorgeFctech 3D &bull; Gestão de Insumos'}</h1>
        <p>${userRole === 'colaborador' ? 'Gestão de Insumos e Pedidos' : 'Relatório de Planejamento de Compras Comerciais'}</p>
        ${userRole === 'colaborador' ? `
        <p style="margin-top: 6px; font-size: 11px; color: #cbd5e1; font-weight: bold;">Responsável: ${requestedBy || 'Colaborador'} &bull; Setor Responsável: ${department || 'Geral'} &bull; Empresa: ${company || 'Empresa Solicitante'}</p>
        ` : `
        <p style="margin-top: 6px; font-size: 11px; color: #cbd5e1; font-weight: bold;">Firma Responsável: GeorgeFctech-3D</p>
        `}
      </div>
      <div class="header-right">
        <h2>${userRole === 'colaborador' ? (company || 'Empresa Solicitante').toUpperCase() : selectedCompany.toUpperCase()}</h2>
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
        <div class="signature-line">${userRole === 'colaborador' ? requestedBy || 'Colaborador' : 'Gestão de Suprimentos - GeorgeFctech-3D'}</div>
      </div>
      <div class="signature-box">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-align: left;">Liberação e Aprovação de Custos:</p>
        <div class="signature-line">${userRole === 'colaborador' ? company || 'Empresa Solicitante' : 'Departamento Financeiro / Comercial'}</div>
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

  const downloadCompletedPurchasesHtmlReport = () => {
    let completedPurchases = shopping.filter(item => item.checked);

    // Filtrar pelo período selecionado no histórico
    if (completedPeriodFilter === 'hoje') {
      completedPurchases = completedPurchases.filter(item => isToday(getPurchasedDate(item)));
    } else if (completedPeriodFilter === 'semana') {
      completedPurchases = completedPurchases.filter(item => isThisWeek(getPurchasedDate(item)));
    } else if (completedPeriodFilter === 'mes') {
      completedPurchases = completedPurchases.filter(item => isThisMonth(getPurchasedDate(item)));
    }

    if (completedPurchases.length === 0) {
      setToastMessage("Aviso: Nenhuma compra encontrada para o período selecionado para gerar o relatório.");
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    // Extrator de mês/ano baseado na nota (formato DD/MM/YYYY) ou fallback para o mês atual
    const getMonthYearFromItem = (item: ShoppingItem): string => {
      if (item.notes) {
        const dateRegex = /(\d{2})\/(\d{2})\/(\d{4}|\d{2})/;
        const match = item.notes.match(dateRegex);
        if (match) {
          const monthNum = parseInt(match[2], 10);
          const months = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
          ];
          if (monthNum >= 1 && monthNum <= 12) {
            let year = match[3];
            if (year.length === 2) year = `20${year}`;
            return `${months[monthNum - 1]} de ${year}`;
          }
        }
      }
      const currentDate = new Date();
      const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      return `${months[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
    };

    // Estrutura de agrupamento: Mês -> Setor | Responsável
    const groups: {
      [month: string]: {
        [sectorAndResponsible: string]: {
          sector: string;
          responsible: string;
          items: ShoppingItem[];
          subtotal: number;
        }
      }
    } = {};

    completedPurchases.forEach(item => {
      const month = getMonthYearFromItem(item);
      const sector = item.department || 'Geral';
      const responsible = item.requestedBy || 'Administração';
      const key = `${sector} | ${responsible}`;

      if (!groups[month]) {
        groups[month] = {};
      }

      if (!groups[month][key]) {
        groups[month][key] = {
          sector,
          responsible,
          items: [],
          subtotal: 0
        };
      }

      groups[month][key].items.push(item);
      groups[month][key].subtotal += item.qtyNeeded * item.estUnitCost;
    });

    const totalValueCompleted = completedPurchases.reduce((sum, item) => sum + (item.qtyNeeded * item.estUnitCost), 0);
    const dateFormatted = new Date().toLocaleDateString('pt-BR');
    const timeFormatted = new Date().toLocaleTimeString('pt-BR');

    // Build HTML template
    let htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Mensal de Compras Efetuadas</title>
  <style>
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 40px 20px;
      background-color: #f1f5f9;
      color: #1e293b;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    }
    .header-banner {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
      color: #ffffff;
      padding: 35px;
      border-radius: 12px;
      margin-bottom: 35px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header-left h1 {
      margin: 0 0 8px 0;
      font-size: 26px;
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
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #818cf8;
    }
    .header-right p {
      margin: 0;
      font-size: 12px;
      color: #cbd5e1;
      font-family: monospace;
    }
    .stats-summary {
      display: grid;
      grid-template-cols: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 35px;
    }
    .stat-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 20px;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
    }
    .stat-card h3 {
      margin: 0 0 6px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      font-weight: 700;
    }
    .stat-card p {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      font-family: monospace;
    }
    .stat-card.accent p {
      color: #10b981;
    }
    .month-container {
      margin-bottom: 45px;
    }
    .month-header {
      background-color: #f8fafc;
      border-left: 6px solid #4f46e5;
      padding: 12px 20px;
      margin-bottom: 25px;
      border-radius: 0 8px 8px 0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .month-header h2 {
      margin: 0;
      font-size: 18px;
      color: #1e1b4b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 800;
    }
    .group-wrapper {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 30px;
      overflow: hidden;
      background-color: #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    }
    .group-banner {
      background-color: #f1f5f9;
      padding: 16px 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .group-title h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 800;
      color: #1e293b;
    }
    .group-title p {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: #475569;
    }
    .group-subtotal {
      font-size: 15px;
      font-weight: 800;
      color: #047857;
      background-color: #d1fae5;
      padding: 4px 10px;
      border-radius: 6px;
      font-family: monospace;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background-color: #fafafb;
      color: #475569;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 14px 24px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    td {
      padding: 14px 24px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
      color: #334155;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background-color: #fafbfc;
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

    .price {
      font-family: monospace;
      font-weight: bold;
    }
    .link-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: #e0f2fe;
      color: #0369a1;
      text-decoration: none;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      transition: all 0.15s ease;
      border: 1px solid #bae6fd;
    }
    .link-btn:hover {
      background-color: #0284c7;
      color: #ffffff;
      border-color: #0284c7;
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
    .no-link {
      font-size: 11px;
      color: #94a3b8;
      font-style: italic;
    }
    .footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 30px;
      margin-top: 40px;
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 40px;
    }
    .signature-box {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 24px;
      text-align: center;
      background-color: #f8fafc;
    }
    .signature-line {
      border-top: 1px solid #cbd5e1;
      margin-top: 45px;
      padding-top: 8px;
      font-size: 12px;
      color: #475569;
      font-weight: 700;
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
        background: #ffffff !important;
        color: #000000 !important;
        border-bottom: 3px solid #000000;
        padding: 10px 0;
        margin-bottom: 25px;
        box-shadow: none;
      }
      .header-left p {
        color: #334155 !important;
      }
      .header-right h2, .header-right p {
        color: #000000 !important;
      }
      .stat-card {
        border: 1px solid #cbd5e1 !important;
        background-color: #ffffff !important;
      }
      .group-banner {
        background-color: #f1f5f9 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .group-subtotal {
        background-color: #e2e8f0 !important;
        color: #000000 !important;
        border: 1px solid #cbd5e1;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .link-btn {
        border: 1px solid #000000 !important;
        color: #000000 !important;
        background: none !important;
      }
      .group-wrapper {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-banner">
      <div class="header-left">
        <h1>Relatório de Compras Efetuadas</h1>
        <p>Histórico Consolidado de Suprimentos Recebidos e Auditados</p>
      </div>
      <div class="header-right">
        <h2 style="margin: 0; font-size: 16px; font-weight: 800; color: #ffffff; text-transform: uppercase; letter-spacing: 0.05em;">
          ${company || 'Ftéx'}
        </h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1;">
          <strong>Responsável:</strong> ${requestedBy || 'ftex'}
        </p>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #a5b4fc; font-family: monospace;">
          <strong>Setor:</strong> ${department || 'Setor Responsável'}
        </p>
        <p style="margin: 6px 0 0 0; font-size: 10px; color: #94a3b8; font-family: monospace; border-top: 1px solid #312e81; padding-top: 4px;">
          Gerado em: ${dateFormatted} às ${timeFormatted}
        </p>
      </div>
    </div>

    <div class="stats-summary">
      <div class="stat-card">
        <h3>Total Investido</h3>
        <p>R$ ${totalValueCompleted.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
      </div>
      <div class="stat-card accent">
        <h3>Total de Itens</h3>
        <p>${completedPurchases.length} finalizados</p>
      </div>
      <div class="stat-card">
        <h3>Meses Ativos</h3>
        <p>${Object.keys(groups).length}</p>
      </div>
    </div>
`;

    // Loop through each Month
    Object.keys(groups).sort((a, b) => {
      return b.localeCompare(a); // recent months first
    }).forEach(month => {
      htmlContent += `
    <div class="month-section">
      <div class="month-header">
        <h2>${month}</h2>
      </div>
      `;

      // Loop through Sector & Responsible groups in this Month
      const monthGroups = groups[month];
      Object.keys(monthGroups).sort().forEach(groupKey => {
        const { sector, responsible, items, subtotal } = monthGroups[groupKey];
        
        htmlContent += `
      <div class="group-wrapper">
        <div class="group-banner">
          <div class="group-title">
            <h3>Setor: ${sector}</h3>
            <p>Responsável Técnico: <strong>${responsible}</strong></p>
          </div>
          <div class="group-subtotal">
            Subtotal: R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 35%;">Item de Compra</th>
              <th style="width: 15%;">Categoria</th>
              <th style="width: 10%; text-align: center;">Qtd</th>
              <th style="width: 15%; text-align: right;">Unitário</th>
              <th style="width: 15%; text-align: right;">Total Pago</th>
              <th style="width: 10%; text-align: center;">Ações</th>
            </tr>
          </thead>
          <tbody>
        `;

        items.forEach(item => {
          const itemTotal = item.qtyNeeded * item.estUnitCost;
          const absoluteUrl = ensureAbsoluteUrl(item.purchaseLink, item.materialName);
          const hasLink = item.purchaseLink && item.purchaseLink.trim() !== '';

          let catClass = 'badge-outros';
          if (item.category === 'Filamento') catClass = 'badge-filamento';
          else if (item.category === 'Peças de Reposição') catClass = 'badge-pecas';
          else if (item.category === 'Acessórios/Insumos') catClass = 'badge-acessorios';

          htmlContent += `
            <tr>
              <td>
                <div style="font-weight: bold; color: #0f172a;">${item.materialName}</div>
                ${item.barcode ? `<div class="barcode">Cód: ${item.barcode}</div>` : ''}
                ${item.notes ? `<div class="notes">Obs: ${item.notes}</div>` : ''}
              </td>
              <td>
                <span class="badge ${catClass}">${item.category || 'Outros'}</span>
              </td>
              <td style="text-align: center; font-weight: 700; color: #1e293b;">
                ${item.qtyNeeded}
              </td>
              <td class="price" style="text-align: right; color: #475569;">
                R$ ${item.estUnitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td class="price" style="text-align: right; color: #0f172a; font-weight: 800;">
                R$ ${itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td style="text-align: center;">
                ${hasLink ? `
                  <a href="${absoluteUrl}" class="link-btn" target="_blank" rel="noreferrer" title="Acessar fornecedor">
                    Comprar 🔗
                  </a>
                ` : `
                  <span class="no-link">Sem link</span>
                `}
              </td>
            </tr>
          `;
        });

        htmlContent += `
          </tbody>
        </table>
      </div>
        `;
      });

      htmlContent += `
    </div>
      `;
    });

    htmlContent += `
    <div class="footer">
      <div class="signature-box">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-align: left;">Assinatura do Conferente Técnico:</p>
        <div class="signature-line">Gestão de Oficina & Estoque</div>
      </div>
      <div class="signature-box">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-align: left;">Liberação e Homologação de Custos:</p>
        <div class="signature-line">Diretoria Executiva / Comercial</div>
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
    downloadAnchor.setAttribute('download', `Relatorio_Compras_Efetuadas_Mensal_${new Date().toISOString().split('T')[0]}.html`);
    downloadAnchor.click();
    
    setToastMessage("Sucesso! O relatório mensal de compras efetuadas foi gerado em HTML.");
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Export Completed purchases as Excel spreadsheet (XLS)
  const generateCompletedPurchasesExcelReport = () => {
    let completedPurchases = shopping.filter(item => item.checked);

    // Filtrar pelo período selecionado no histórico
    if (completedPeriodFilter === 'hoje') {
      completedPurchases = completedPurchases.filter(item => isToday(getPurchasedDate(item)));
    } else if (completedPeriodFilter === 'semana') {
      completedPurchases = completedPurchases.filter(item => isThisWeek(getPurchasedDate(item)));
    } else if (completedPeriodFilter === 'mes') {
      completedPurchases = completedPurchases.filter(item => isThisMonth(getPurchasedDate(item)));
    }

    if (completedPurchases.length === 0) {
      setToastMessage("Aviso: Nenhuma compra encontrada para o período selecionado para gerar a planilha.");
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    const dateFormatted = new Date().toLocaleDateString('pt-BR');
    const timeFormatted = new Date().toLocaleTimeString('pt-BR');
    const totalSpent = completedPurchases.reduce((acc, i) => acc + (i.qtyNeeded * i.estUnitCost), 0);

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
          <x:Name>Histórico de Compras</x:Name>
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
    }
    table {
      width: 1000px;
      border-collapse: collapse;
    }
    th {
      background-color: #0f172a;
      color: #ffffff;
      font-weight: bold;
      border: 1px solid #cbd5e1;
      text-align: left;
      padding: 12px 10px;
    }
    td {
      border: 1px solid #cbd5e1;
      padding: 12px 10px;
    }
    .title-banner {
      background-color: #1e1b4b;
      color: #ffffff;
      padding: 20px;
      font-weight: bold;
      font-size: 16pt;
    }
  </style>
</head>
<body>
  <table>
    <tr>
      <td colspan="7" class="title-banner" style="background-color: #1e1b4b; color: #ffffff; padding: 20px; font-weight: bold; font-size: 16pt;">
        HISTÓRICO DE COMPRAS EFETUADAS - ${userRole === 'colaborador' ? 'Ftéx' : 'GeorgeFctech 3D'}
        <div style="font-size: 10pt; color: #cbd5e1; font-weight: normal; margin-top: 4px;">
          Gerado em: ${dateFormatted} às ${timeFormatted} &bull; Período: ${completedPeriodFilter.toUpperCase()}
        </div>
      </td>
    </tr>
    <tr style="height: 10px;"><td colspan="7" style="border: none;"></td></tr>
    <tr>
      <th style="width: 250px;">Material / Produto</th>
      <th style="width: 120px;">Categoria</th>
      <th style="width: 120px;">Empresa</th>
      <th style="width: 120px;">Solicitante / Setor</th>
      <th style="width: 60px; text-align: center;">Qtd</th>
      <th style="width: 120px; text-align: right;">Unitário</th>
      <th style="width: 120px; text-align: right;">Total Pago</th>
    </tr>
    ${completedPurchases.map(item => {
      const itemTotal = item.qtyNeeded * item.estUnitCost;
      return `
        <tr>
          <td style="font-weight: bold;">
            ${item.materialName}
            ${item.barcode ? `<br/><span style="font-size: 8.5pt; color: #4338ca;">Cód: ${item.barcode}</span>` : ''}
            ${item.notes ? `<br/><span style="font-size: 8.5pt; color: #64748b; font-style: italic;">Obs: ${item.notes}</span>` : ''}
          </td>
          <td>${item.category || 'Outros'}</td>
          <td>${item.company || 'Ftéx'}</td>
          <td>${item.requestedBy || 'Colaborador'}${item.department ? ` - ${item.department}` : ''}</td>
          <td style="text-align: center;">${item.qtyNeeded}</td>
          <td style="text-align: right; font-family: Courier New, monospace;">R$ ${item.estUnitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align: right; font-family: Courier New, monospace; font-weight: bold; color: #059669;">R$ ${itemTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;
    }).join('')}
    <tr style="background-color: #f1f5f9; font-weight: bold;">
      <td colspan="6" style="text-align: right;">VALOR TOTAL PAGO:</td>
      <td style="text-align: right; font-family: Courier New, monospace; font-weight: bold; color: #047857;">R$ ${totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
  </table>
</body>
</html>`;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `Historico_Compras_Excel_${new Date().toISOString().split('T')[0]}.xls`);
    downloadAnchor.click();
  };

  // Import Purchased items directly to Active Inventory (Dar Baixa)
  const handleImportToStock = (item: ShoppingItem) => {
    onAddInventoryItem({
      material: item.materialName.replace(" (Reposição)", ""),
      qty: item.qtyNeeded,
      unitCost: item.estUnitCost,
      purchaseLink: item.purchaseLink
    });

    setToastMessage(`Sucesso! ${item.qtyNeeded} unidade(s) de "${item.materialName}" foram lançados no estoque ativo (Baixa Efetuada)!`);
    setTimeout(() => setToastMessage(null), 5005);
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
        const companyName = item.company.trim();
        if (userRole === 'colaborador' && (companyName.toLowerCase() === 'georgefctech-3d' || companyName.toLowerCase().includes('geral'))) {
          // Skip admin-specific company name in collaborator view
          return;
        }
        list.add(companyName);
      }
    });
    return Array.from(list);
  }, [shopping, userRole]);

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
            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-indigo-50 border border-slate-200 flex items-center justify-center p-0">
              {userRole === 'colaborador' ? (
                <ShoppingBag className="w-6 h-6 text-indigo-600" />
              ) : (
                <img 
                  referrerPolicy="no-referrer"
                  src="https://vyvompcoiaizoluuxnzx.supabase.co/storage/v1/object/sign/img/meu_logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lYTFhZWQwNC03M2Y5LTQwODQtOWNiOS04ODBkMTA3MzAwY2UiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWcvbWV1X2xvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MTc5NTUxOCwiZXhwIjoxODc2NDAzNTE4fQ.JgHY5piKmwxjB0nfW08joAWsNE-JYRA5kUUkVra9hFI"
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {userRole === 'colaborador' ? (company || 'Empresa Solicitante') : 'GeorgeFctech-3D'}
              </h2>
              <p className="text-[10px] text-slate-500 font-mono">
                {userRole === 'colaborador' ? 'Planejamento de Compras' : 'Gestão Comercial & Suprimentos de Impressão 3D'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-700 font-mono">Relatório Comercial de Pedidos</h3>
            {userRole === 'colaborador' ? (
              <>
                <p className="text-[10px] text-slate-800 font-bold font-mono">Responsável: {requestedBy || 'Colaborador'}</p>
                <p className="text-[10px] text-slate-800 font-bold font-mono">Setor Responsável: {department || 'Geral'}</p>
                <p className="text-[10px] text-slate-800 font-bold font-mono">Empresa: {company || 'Empresa Solicitante'}</p>
              </>
            ) : (
              <p className="text-[10px] text-slate-800 font-bold font-mono">Firma Responsável: GeorgeFctech-3D</p>
            )}
            <p className="text-[10px] text-slate-500 font-mono">Data: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* SECTOR & RESPONSIBLE EDITABLE INFO FOR PRINT */}
      {(userRole === 'colaborador' || currentSubView === 'compras_efetuadas') && (
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 mb-6 shadow-3xs no-print flex flex-col lg:flex-row items-center gap-4">
          <div className="flex-1">
            <span className="block text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 mb-1">Identificação do Relatório (Topo do Impresso)</span>
            <p className="text-xs text-slate-500">
              Preencha os campos abaixo para definir a empresa, funcionário responsável e setor que serão impressos no cabeçalho do relatório.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[55%]">
            <div>
              <label className="block text-[9px] uppercase font-bold text-slate-450 dark:text-slate-500 mb-1">Empresa</label>
              <input
                type="text"
                placeholder="Empresa"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-bold text-slate-450 dark:text-slate-500 mb-1">Funcionário Responsável</label>
              <input
                type="text"
                placeholder="Nome do Funcionário"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-bold text-slate-450 dark:text-slate-500 mb-1">Setor Responsável</label>
              <input
                type="text"
                placeholder="Setor"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {currentSubView && (
        <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800 no-print flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {currentSubView === 'baixa' && (
                <>
                  <CheckSquare className="text-indigo-600 dark:text-indigo-400 w-8 h-8" />
                  <span>Baixa de Compras (Recebimento)</span>
                </>
              )}
              {currentSubView === 'compras_efetuadas' && (
                <>
                  <FileClock className="text-emerald-600 dark:text-emerald-400 w-8 h-8" />
                  <span>Histórico de Compras Efetuadas</span>
                </>
              )}
              {currentSubView === 'calculadoras' && (
                <>
                  <Calculator className="text-amber-500 dark:text-amber-400 w-8 h-8" />
                  <span>{userRole === 'colaborador' ? 'Cálculos Gerais' : 'Calculadoras Oficina'}</span>
                </>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {currentSubView === 'baixa' && 'Registre a chegada e baixa de suprimentos solicitados na oficina em tempo real.'}
              {currentSubView === 'compras_efetuadas' && 'Visualize todos os itens de compra que já foram recebidos e auditados.'}
              {currentSubView === 'calculadoras' && (userRole === 'colaborador' ? 'Calculadora de bolso integrada para contas rápidas, fechamentos e cálculos gerais.' : 'Estime o custo de gramas de filamento, comprimentos de rolo e orçamentos rápidos para novos lotes.')}
            </p>
          </div>
        </div>
      )}

      {!currentSubView && (
        <>
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
            onClick={downloadCompletedPurchasesHtmlReport}
            disabled={shopping.filter(i => i.checked).length === 0}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-200 ${
              shopping.filter(i => i.checked).length === 0 
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 hover:scale-102 cursor-pointer'
            }`}
          >
            <Printer className="w-4 h-4" />
            IMPRIMIR COMPRAS EFETUADAS
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
                  {userRole !== 'colaborador' && (
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
                  )}
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
                  placeholder={userRole === 'colaborador' ? "Ex: FTEX, Empresa Comercial..." : "Ex: FTEX, GeorgeFctech-3D..."}
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
        
        {/* Search input with Barcode indication */}
        <div className="relative flex-1">
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="🔍 Buscar pelo Código de Barras cadastrado (ex: 789...) ou Nome do Item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 text-slate-800 bg-slate-50 focus:bg-white font-medium"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-sm font-bold h-6 w-6 flex items-center justify-center rounded-full hover:bg-slate-200/50 cursor-pointer"
              >
                ×
              </button>
            ) : (
              <span className="absolute right-3.5 top-2.5 text-slate-400" title="Busca por Código de Barras Ativa">
                <Barcode className="w-4 h-4" />
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-indigo-600 font-bold px-1">
            <Barcode className="w-3.5 h-3.5 text-indigo-500" />
            <span>Colaborador: Digite ou use o leitor de código de barras para filtrar instantaneamente.</span>
          </div>
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
            {userRole !== 'colaborador' && <option value="georgefctech-3d">GeorgeFctech-3D</option>}
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
                          onClick={() => handleToggleOrValidate(item)}
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
                          <div className="min-w-0 py-1">
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
                              {/* Import to Stock (Any category & Checked) */}
                              {item.checked && userRole !== 'colaborador' && (
                                <button
                                  onClick={() => handleImportToStock(item)}
                                  title="Dar baixa no estoque ativo de suprimentos"
                                  className="p-1 px-2 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer transition-all duration-150"
                                >
                                  <ArchiveRestore className="w-3.5 h-3.5" />
                                  +Estoque
                                </button>
                              )}

                              {!item.checked && (
                                <button
                                  onClick={() => handleToggleOrValidate(item)}
                                  title="Validar compra e dar baixa"
                                  className="p-1 px-2 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer transition-all duration-150"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  Validar
                                </button>
                              )}

                              {(!item.checked || userRole !== 'colaborador') && (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(item)}
                                    title="Editar entrada técnico comercial"
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  
                                  <button
                                    onClick={() => handleDeleteShoppingItem(item.id)}
                                    title="Remover do cronograma"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
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
                        onClick={() => handleToggleOrValidate(item)}
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
                        {item.checked && userRole !== 'colaborador' && (
                          <button
                            onClick={() => handleImportToStock(item)}
                            className="p-1 px-2 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer"
                          >
                            +Estoque
                          </button>
                        )}
                        {!item.checked && (
                          <button
                            onClick={() => handleToggleOrValidate(item)}
                            className="p-1 px-2 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1 text-[10px] font-bold uppercase cursor-pointer hover:bg-emerald-100"
                          >
                            Validar
                          </button>
                        )}
                        {(!item.checked || userRole !== 'colaborador') && (
                          <>
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteShoppingItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
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
      </>
      )}

      {/* HUB OPERACIONAL DO COLABORADOR */}
      <div className={`${currentSubView ? 'bg-transparent border-none' : 'mt-12 mb-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden no-print'}`}>
        {/* Tab headers */}
        {!currentSubView && (
          <div className="bg-slate-100 dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg">
              <Layers className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Central de Operações do Colaborador
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                Controles rápidos de recebimento, histórico de auditoria e utilitários
              </p>
            </div>
          </div>

          {/* Tabs list with beautiful icons */}
          <div className="flex flex-wrap gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
            <button
              onClick={() => setColabActiveTab('baixa')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition duration-150 cursor-pointer ${
                colabActiveTab === 'baixa'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-3xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Baixa de Compras
            </button>
            <button
              onClick={() => setColabActiveTab('compras')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition duration-150 cursor-pointer ${
                colabActiveTab === 'compras'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-3xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              Compras Efetuadas
            </button>
            <button
              onClick={() => setColabActiveTab('calculadora')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition duration-150 cursor-pointer ${
                colabActiveTab === 'calculadora'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-3xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Wrench className="w-4 h-4" />
              Calculadoras
            </button>
          </div>
        </div>
        )}

        {/* TAB CONTENT: BAIXA DE COMPRAS */}
        {colabActiveTab === 'baixa' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-6">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-150 text-sm mb-1 flex items-center gap-2">
                  <span>📦 Recebimento e Baixa Rápida de Suprimentos</span>
                </h4>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Os itens listados abaixo foram solicitados pela empresa e estão pendentes. Ao chegarem na oficina, dê a baixa para que o setor comercial saiba que já estão disponíveis.
                </p>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-3 text-right">
                <span className="block text-[10px] font-bold uppercase text-amber-600 font-mono">Pedidos Pendentes</span>
                <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">
                  {shopping.filter(i => !i.checked).length} itens
                </span>
              </div>
            </div>

            {shopping.filter(i => !i.checked).length === 0 ? (
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <h5 className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-1">Tudo Recebido!</h5>
                <p className="text-xs text-slate-400">Nenhum pedido de compra pendente na fila no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shopping.filter(i => !i.checked).map(item => {
                  const costValue = item.qtyNeeded * item.estUnitCost;
                  return (
                    <div 
                      key={item.id} 
                      className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-900 transition-all duration-200"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">
                            {item.category}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            Qtd: <strong className="text-slate-700 dark:text-slate-300 font-bold">{item.qtyNeeded} un</strong>
                          </span>
                        </div>
                        
                        <h5 className="font-bold text-slate-850 dark:text-slate-100 text-sm line-clamp-1 mb-1">
                          {item.materialName}
                        </h5>
                        
                        {item.barcode && (
                          <p className="text-[10px] font-mono font-bold text-slate-400 mb-1">
                            Cód: {item.barcode}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mb-3 text-[10px] text-slate-400">
                          <span>Solicitante: <strong>{item.requestedBy || 'Ftéx'}</strong></span>
                          <span>•</span>
                          <span>Empresa: <strong>{item.company || 'Ftéx'}</strong></span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="font-mono text-xs">
                          <span className="text-slate-400 text-[10px] block">Estimativa:</span>
                          <strong className="text-slate-700 dark:text-slate-200 font-bold">
                            R$ {costValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleToggleOrValidate(item)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-3xs cursor-pointer"
                            title="Validar compra e dar baixa no estoque"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Validar & Baixar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: COMPRAS EFETUADAS (HISTORICO) */}
        {colabActiveTab === 'compras' && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-150 text-sm mb-1 flex items-center gap-2">
                  <span>📜 Histórico de Compras Efetuadas (Entregues)</span>
                </h4>
                <p className="text-xs text-slate-450 leading-relaxed">
                  Histórico consolidado dos itens de compras que já foram adquiridos e receberam baixa pela equipe da empresa.
                </p>
              </div>

              {/* Filtros de Período & Busca */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-150 dark:bg-slate-900 p-1 rounded-xl border border-slate-250 dark:border-slate-800">
                  <button
                    onClick={() => setCompletedPeriodFilter('todos')}
                    className={`px-3 py-1 text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer ${
                      completedPeriodFilter === 'todos'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-3xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setCompletedPeriodFilter('hoje')}
                    className={`px-3 py-1 text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer ${
                      completedPeriodFilter === 'hoje'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-3xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setCompletedPeriodFilter('semana')}
                    className={`px-3 py-1 text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer ${
                      completedPeriodFilter === 'semana'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-3xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Semanal
                  </button>
                  <button
                    onClick={() => setCompletedPeriodFilter('mes')}
                    className={`px-3 py-1 text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer ${
                      completedPeriodFilter === 'mes'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-3xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                  >
                    Mensal
                  </button>
                </div>

                {/* Search Input for Completed Purchases */}
                <div className="relative w-full md:w-48">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={completedSearchQuery}
                    onChange={(e) => setCompletedSearchQuery(e.target.value)}
                    placeholder="Pesquisar histórico..."
                    className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Relatórios e Pedidos Buttons */}
                <button
                  onClick={downloadCompletedPurchasesHtmlReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold text-[10px] uppercase tracking-wider hover:bg-indigo-100 transition duration-150 cursor-pointer"
                  title="Gerar Relatório Comercial das Compras Efetuadas"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Gerar Relatório HTML</span>
                </button>

                <button
                  onClick={generateCompletedPurchasesExcelReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider hover:bg-emerald-100 transition duration-150 cursor-pointer"
                  title="Exportar Compras Efetuadas para Planilha Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Planilha Excel</span>
                </button>
              </div>
            </div>

            {(() => {
              let baseCompletedItems = shopping.filter(item => item.checked);

              // Aplicar filtro de período
              if (completedPeriodFilter === 'hoje') {
                baseCompletedItems = baseCompletedItems.filter(item => isToday(getPurchasedDate(item)));
              } else if (completedPeriodFilter === 'semana') {
                baseCompletedItems = baseCompletedItems.filter(item => isThisWeek(getPurchasedDate(item)));
              } else if (completedPeriodFilter === 'mes') {
                baseCompletedItems = baseCompletedItems.filter(item => isThisMonth(getPurchasedDate(item)));
              }

              // Aplicar busca
              const completedItems = baseCompletedItems.filter(item => {
                if (!completedSearchQuery) return true;
                return (
                  item.materialName.toLowerCase().includes(completedSearchQuery.toLowerCase()) ||
                  (item.barcode && item.barcode.toLowerCase().includes(completedSearchQuery.toLowerCase())) ||
                  (item.company && item.company.toLowerCase().includes(completedSearchQuery.toLowerCase())) ||
                  (item.requestedBy && item.requestedBy.toLowerCase().includes(completedSearchQuery.toLowerCase()))
                );
              });

              // Estatísticas calculadas dinamicamente com baseCompletedItems
              const totalSpent = baseCompletedItems.reduce((acc, i) => acc + (i.qtyNeeded * i.estUnitCost), 0);
              const itemsCount = baseCompletedItems.length;
              const avgUnitCost = baseCompletedItems.reduce((acc, i) => acc + i.estUnitCost, 0) / (itemsCount || 1);

              return (
                <>
                  {/* Cost Statistics Card for History */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-emerald-600 font-mono mb-1">
                        Total Economizado / Investido ({completedPeriodFilter === 'todos' ? 'Geral' : completedPeriodFilter === 'hoje' ? 'Hoje' : completedPeriodFilter === 'semana' ? 'Esta Semana' : 'Este Mês'})
                      </span>
                      <strong className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                        R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-xl p-4 flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-indigo-600 font-mono mb-1">Total de Itens Recebidos</span>
                      <strong className="text-xl font-bold font-mono text-indigo-700 dark:text-indigo-400">
                        {itemsCount} itens
                      </strong>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-4 flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-slate-500 font-mono mb-1">Custo Médio por Unidade</span>
                      <strong className="text-xl font-bold font-mono text-slate-700 dark:text-slate-300">
                        R$ {avgUnitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>

                  {completedItems.length === 0 ? (
                    <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400">
                      <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-55" />
                      <p className="text-xs">Nenhum item encontrado no histórico para os filtros ativos.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-905 border-b border-slate-200 dark:border-slate-800 select-none text-[10px] font-mono text-slate-500 uppercase">
                            <th className="p-3">Item / Especificação</th>
                            <th className="p-3">Categoria</th>
                            <th className="p-3">Empresa</th>
                            <th className="p-3">Qtd</th>
                            <th className="p-3 text-right">Unitário</th>
                            <th className="p-3 text-right">Total Pago</th>
                            <th className="p-3 text-center">Status</th>
                            {userRole !== 'colaborador' && <th className="p-3 text-center">Ações</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                          {completedItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/55 dark:hover:bg-slate-800/30 transition">
                              <td className="p-3">
                                <span className="font-bold text-slate-800 dark:text-slate-100 block">{item.materialName}</span>
                                {item.barcode && <span className="text-[10px] text-slate-400 font-mono">Código: {item.barcode}</span>}
                              </td>
                              <td className="p-3">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                                  {item.category}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500 dark:text-slate-400">{item.company || 'Ftéx'}</td>
                              <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{item.qtyNeeded}x</td>
                              <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">R$ {item.estUnitCost.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                R$ {(item.qtyNeeded * item.estUnitCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3 text-center">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded">
                                  <Check className="w-3 h-3 stroke-[3]" /> Recebido
                                </span>
                              </td>
                              {userRole !== 'colaborador' && (
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => handleStartEdit(item)}
                                      title="Editar registro do histórico"
                                      className="p-1 text-slate-400 hover:text-slate-755 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteShoppingItem(item.id)}
                                      title="Remover do histórico"
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* TAB CONTENT: CALCULADORAS OPERACIONAIS */}
        {colabActiveTab === 'calculadora' && (
          <div className="p-6">
            <div className="mb-6 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-slate-800 dark:text-slate-150 text-sm mb-1 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-indigo-500 animate-spin-slow" />
                <span>{userRole === 'colaborador' ? '🧮 Cálculos Gerais' : '🧮 Calculadoras e Utilitários de Impressão & Compras'}</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {userRole === 'colaborador' ? 'Calculadora de bolso integrada para auxiliar colaboradores em contas rápidas de compras, rateio de insumos e fechamento de valores.' : 'Ferramentas interativas para ajudar colaboradores no planejamento de consumo de insumos de impressão 3D e cálculo de orçamentos rápidos para compras.'}
              </p>
            </div>

            <div className={userRole === 'colaborador' ? "max-w-md mx-auto" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"}>
              {userRole !== 'colaborador' && (
                <>
                  {/* 1. FILAMENT COST CALCULATOR */}
              <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Custo por Grama (Filamentos)
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 leading-relaxed">
                    Descubra o custo por grama com base no preço do rolo. Crucial para faturar peças impressas em 3D.
                  </p>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Preço do Rolo (R$)</label>
                      <input
                        type="number"
                        value={calcFilPrice === 0 ? '' : calcFilPrice}
                        onChange={(e) => setCalcFilPrice(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-mono font-bold px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Peso do Rolo (Gramas)</label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          value={calcFilWeight === 0 ? '' : calcFilWeight}
                          onChange={(e) => setCalcFilWeight(parseInt(e.target.value) || 0)}
                          className="w-full text-xs font-mono font-bold px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:border-indigo-500"
                        />
                        <button
                          onClick={() => setCalcFilWeight(1000)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold rounded duration-100 cursor-pointer text-slate-700 dark:text-slate-300"
                        >
                          1kg
                        </button>
                        <button
                          onClick={() => setCalcFilWeight(500)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[10px] font-bold rounded duration-100 cursor-pointer text-slate-700 dark:text-slate-300"
                        >
                          500g
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Custo Estimado por Grama</span>
                  <strong className="text-xl font-bold font-mono text-indigo-650 dark:text-indigo-400">
                    R$ {(calcFilPrice / (calcFilWeight || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                  </strong>
                </div>
              </div>

              {/* 2. BATCH BUDGET ESTIMATOR */}
              <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingBag className="w-4 h-4 text-emerald-500" />
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Orçamento de Lote de Compras
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 leading-relaxed">
                    Consolide preços com cálculo rápido de quantidade, frete e tarifas para compras comerciais rápidas.
                  </p>

                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quantidade</label>
                        <input
                          type="number"
                          value={calcQty === 0 ? '' : calcQty}
                          onChange={(e) => setCalcQty(parseInt(e.target.value) || 0)}
                          className="w-full text-xs font-mono font-bold px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Custo Unit. (R$)</label>
                        <input
                          type="number"
                          value={calcUnitPrice === 0 ? '' : calcUnitPrice}
                          onChange={(e) => setCalcUnitPrice(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs font-mono font-bold px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Frete / Custos Extras (R$)</label>
                      <input
                        type="number"
                        value={calcShipping === 0 ? '' : calcShipping}
                        onChange={(e) => setCalcShipping(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-mono font-bold px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Custo Total de Aquisição</span>
                  <strong className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    R$ {((calcQty * calcUnitPrice) + calcShipping).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>

              {/* 3. FILAMENT LENGTH CALCULATOR */}
              <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-rose-500" />
                    <h5 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Conversor de Comprimento (1.75mm)
                    </h5>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 leading-relaxed">
                    Estime o comprimento total em metros disponível em um rolo com base no seu peso e material.
                  </p>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Material do Insumo</label>
                      <select
                        value={calcFilType}
                        onChange={(e) => setCalcFilType(e.target.value as any)}
                        className="w-full text-xs font-bold px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:border-indigo-500"
                      >
                        <option value="PLA">PLA (Densidade ~1.24 g/cm³)</option>
                        <option value="PETG">PETG (Densidade ~1.27 g/cm³)</option>
                        <option value="ABS">ABS (Densidade ~1.04 g/cm³)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Peso Total (Kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={calcFilTotalWeight === 0 ? '' : calcFilTotalWeight}
                        onChange={(e) => setCalcFilTotalWeight(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs font-mono font-bold px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 rounded-lg focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Comprimento Estimado</span>
                  <strong className="text-xl font-bold font-mono text-rose-600 dark:text-rose-500">
                    {(() => {
                      const metersPerKg = calcFilType === 'PLA' ? 330 : calcFilType === 'PETG' ? 310 : 400;
                      return `${(calcFilTotalWeight * metersPerKg).toFixed(0)} metros`;
                    })()}
                  </strong>
                </div>
              </div>
                </>
              )}

              {/* 4. DIGITAL POCKET CALCULATOR */}
              <div className="bg-gradient-to-b from-[#24282e] to-[#121417] text-white p-6 rounded-[24px] border-4 border-[#3a3f47] flex flex-col justify-between shadow-[0_20px_40px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.15)] relative overflow-hidden select-none max-w-sm mx-auto w-full">
                {/* Visual glass sheen across the entire calculator */}
                <div className="absolute top-0 left-0 right-0 h-[40%] bg-gradient-to-b from-white/5 to-white/0 pointer-events-none skew-y-6 origin-top-left" />

                {/* Brand Header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#2d323b] relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono tracking-widest text-slate-300 font-extrabold uppercase">
                      GeorgeFctech
                    </span>
                    <span className="text-[7px] font-mono tracking-wider text-slate-500 uppercase -mt-0.5">
                      ELECTRONIC GT-1200X
                    </span>
                  </div>

                  {/* SOLAR CELL PANEL */}
                  <div className="bg-gradient-to-r from-[#201008] via-[#4d2512] to-[#201008] rounded border border-black flex gap-0.5 p-0.5 h-5 w-14 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                    <span className="w-full bg-[#3c1e0f]/80 rounded-[1px] border-r border-[#1a0c06]" />
                    <span className="w-full bg-[#3c1e0f]/80 rounded-[1px] border-r border-[#1a0c06]" />
                    <span className="w-full bg-[#3c1e0f]/80 rounded-[1px] border-r border-[#1a0c06]" />
                    <span className="w-full bg-[#3c1e0f]/80 rounded-[1px]" />
                  </div>
                </div>

                <div>
                  {/* SCREEN / LCD DISPLAY */}
                  <div 
                    className="border-3 border-[#0b0c0e] rounded-xl p-3.5 text-right font-mono relative overflow-hidden mb-5 select-text shadow-[inset_0_4px_10px_rgba(0,0,0,0.8),0_1px_2px_rgba(255,255,255,0.1)]"
                    style={{
                      backgroundColor: '#9cae8d',
                      backgroundImage: 'radial-gradient(circle, rgba(156,174,141,1) 0%, rgba(144,161,129,1) 100%)',
                      boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.1)',
                      color: '#1d2618'
                    }}
                  >
                    {/* Retro LCD screen glass glare */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                    
                    {/* Faint LCD background numbers to simulate segmented screen */}
                    <div className="absolute right-3.5 bottom-3 text-2xl font-bold tracking-tight text-[#1d2618]/5 select-none font-mono pointer-events-none">
                      8888888888
                    </div>

                    {/* Formula / Sub-display */}
                    <div className="text-[10px] text-[#1d2618]/60 min-h-[15px] truncate tracking-normal font-bold">
                      {calcSubDisplay || '\u00A0'}
                    </div>

                    {/* Main Display value */}
                    <div className="text-2xl font-black truncate tracking-tight mt-0.5 select-all font-mono drop-shadow-[0.5px_0.5px_0px_rgba(255,255,255,0.4)]">
                      {calcDisplay}
                    </div>
                  </div>

                  {/* BUTTONS GRID WITH REALISTIC 3D MECHANICAL KEY PRESS FEEL */}
                  <div className="grid grid-cols-4 gap-2.5 text-xs font-mono">
                    {/* Row 1 */}
                    <button
                      onClick={() => handleCalcKeyPress('C')}
                      className="h-10 font-bold bg-[#df4242] hover:bg-[#eb4e4e] text-white rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#8a2121] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] select-none text-sm"
                    >
                      C
                    </button>
                    <button
                      onClick={() => handleCalcKeyPress('DEL')}
                      className="h-10 font-bold bg-[#e07431] hover:bg-[#ed813e] text-white rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#9c4a16] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] select-none"
                    >
                      DEL
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(calcDisplay);
                        setToastMessage("Valor copiado!");
                        setTimeout(() => setToastMessage(null), 2500);
                      }}
                      title="Copiar resultado"
                      className="h-10 text-[9px] font-extrabold bg-[#555d6a] hover:bg-[#626a79] text-[#ffd26a] rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#363b44] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] select-none tracking-tighter"
                    >
                      COPIAR
                    </button>
                    <button
                      onClick={() => handleCalcKeyPress('÷')}
                      className="h-10 font-extrabold bg-[#47608a] hover:bg-[#5470a1] text-indigo-150 rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center text-sm border-b-[3px] border-[#293a57] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] select-none"
                    >
                      ÷
                    </button>

                    {/* Row 2 */}
                    <button
                      onClick={() => handleCalcKeyPress('7')}
                      className="h-10 font-bold bg-[#373d47] hover:bg-[#434b57] text-white rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#1d2127] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] select-none text-sm"
                    >
                      7
                    </button>
                    <button
                      onClick={() => handleCalcKeyPress('8')}
                      className="h-10 font-bold bg-[#373d47] hover:bg-[#434b57] text-white rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#1d2127] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] select-none text-sm"
                    >
                      8
                    </button>
                    <button
                      onClick={() => handleCalcKeyPress('9')}
                      className="h-10 font-bold bg-[#373d47] hover:bg-[#434b57] text-white rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#1d2127] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] select-none text-sm"
                    >
                      9
                    </button>
                    <button
                      onClick={() => handleCalcKeyPress('×')}
                      className="h-10 font-extrabold bg-[#47608a] hover:bg-[#5470a1] text-indigo-150 rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center text-sm border-b-[3px] border-[#293a57] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] select-none"
                    >
                      ×
                    </button>

                    {/* Row 3 */}
                    <button
                      onClick={() => handleCalcKeyPress('4')}
                      className="h-10 font-bold bg-[#373d47] hover:bg-[#434b57] text-white rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#1d2127] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] select-none text-sm"
                    >
                      4
                    </button>
                    <button
                      onClick={() => handleCalcKeyPress('5')}
                      className="h-10 font-bold bg-[#373d47] hover:bg-[#434b57] text-white rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#1d2127] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] select-none text-sm"
                    >
                      5
                    </button>
                    <button
                      onClick={() => handleCalcKeyPress('6')}
                      className="h-10 font-bold bg-[#373d47] hover:bg-[#434b57] text-white rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#1d2127] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] select-none text-sm"
                    >
                      6
                    </button>
                    <button
                      onClick={() => handleCalcKeyPress('-')}
                      className="h-10 font-extrabold bg-[#47608a] hover:bg-[#5470a1] text-indigo-150 rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center text-sm border-b-[3px] border-[#293a57] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] select-none"
                    >
                      -
                    </button>

                    {/* Row 4 */}
                    <button
                      onClick={() => handleCalcKeyPress('1')}
                      className="h-10 font-bold bg-[#373d47] hover:bg-[#434b57] text-white rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#1d2127] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] select-none text-sm"
                    >
                      1
                    </button>
                    <button
                      onClick={() => handleCalcKeyPress('2')}
                      className="h-10 font-bold bg-[#373d47] hover:bg-[#434b57] text-white rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#1d2127] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] select-none text-sm"
                    >
                      2
                    </button>
                    <button
                      onClick={() => handleCalcKeyPress('3')}
                      className="h-10 font-bold bg-[#373d47] hover:bg-[#434b57] text-white rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#1d2127] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] select-none text-sm"
                    >
                      3
                    </button>
                    <button
                      onClick={() => handleCalcKeyPress('+')}
                      className="h-10 font-extrabold bg-[#47608a] hover:bg-[#5470a1] text-indigo-150 rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center text-sm border-b-[3px] border-[#293a57] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] select-none"
                    >
                      +
                    </button>

                    {/* Row 5 */}
                    <button
                      onClick={() => handleCalcKeyPress('0')}
                      className="h-10 font-bold bg-[#373d47] hover:bg-[#434b57] text-white rounded-lg col-span-2 transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#1d2127] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] select-none text-sm"
                    >
                      0
                    </button>
                    <button
                      onClick={() => handleCalcKeyPress('.')}
                      className="h-10 font-bold bg-[#373d47] hover:bg-[#434b57] text-white rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center border-b-[3px] border-[#1d2127] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] select-none text-sm"
                    >
                      .
                    </button>
                    <button
                      onClick={() => handleCalcKeyPress('=')}
                      className="h-10 font-extrabold bg-[#1e8f54] hover:bg-[#25ad67] text-white rounded-lg transition duration-75 cursor-pointer active:translate-y-[3px] active:border-b-0 flex items-center justify-center text-base border-b-[3px] border-[#0f5430] shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] select-none"
                    >
                      =
                    </button>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#22252c] text-[8px] text-center text-slate-500 font-mono tracking-widest uppercase">
                  Pocket Calculator GT-1200
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* VALIDATION MODAL */}
      {validatingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/30 dark:bg-slate-950/20">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                  Validar Compra Efetuada
                </h3>
              </div>
              <button 
                onClick={() => setValidatingItem(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition duration-150 cursor-pointer text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 uppercase">
                  {validatingItem.category}
                </span>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-snug">
                  {validatingItem.materialName}
                </h4>
                {validatingItem.barcode && (
                  <p className="text-[10px] font-mono font-bold text-slate-400">
                    Código de Barras / SKU: {validatingItem.barcode}
                  </p>
                )}
              </div>

              {/* Purchase Details Card */}
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Solicitante:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{validatingItem.requestedBy || 'Ftéx'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Empresa Responsável:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{validatingItem.company || 'Ftéx'}</span>
                </div>
                {validatingItem.department && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Setor do Pedido:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{validatingItem.department}</span>
                  </div>
                )}
                <div className="border-t border-slate-200/60 dark:border-slate-800/60 my-2 pt-2 flex justify-between font-mono">
                  <span className="text-slate-400">Quantidade x Unitário:</span>
                  <span className="text-slate-600 dark:text-slate-300">{validatingItem.qtyNeeded}x R$ {validatingItem.estUnitCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-mono text-sm pt-1">
                  <span className="text-slate-500 font-bold">Total a Pagar:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {(validatingItem.qtyNeeded * validatingItem.estUnitCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Option to give Baixa to Stock */}
              <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/30 rounded-xl p-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="autoPushToStock"
                  checked={autoPushToStock}
                  onChange={(e) => setAutoPushToStock(e.target.checked)}
                  className="mt-1 h-4.5 w-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="space-y-0.5">
                  <label htmlFor="autoPushToStock" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                    Dar Baixa Automática no Estoque Ativo
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                    Se marcado, adicionará automaticamente esta quantidade ({validatingItem.qtyNeeded} un) ao seu estoque atual de suprimentos sem necessidade de reinserção de dados.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setValidatingItem(null)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg duration-150 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmValidation}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg duration-150 shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Confirmar e Salvar
              </button>
            </div>
          </div>
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
