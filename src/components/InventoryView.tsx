/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Database,
  Coins, 
  Package, 
  AlertCircle,
  Link,
  Image as ImageIcon,
  Upload,
  ExternalLink,
  Edit2,
  Grid,
  List,
  Eye,
  Check,
  X,
  QrCode,
  Scan,
  Minus,
  Camera,
  Search,
  Sparkles,
  Printer,
  FileSpreadsheet,
  Download,
  Layers,
  Cpu,
  Wrench,
  Fan,
  Tag,
  Globe,
  RefreshCw,
  FileText,
  Lock,
  Shield,
  User,
  Crown
} from 'lucide-react';
import { InventoryItem, ShoppingItem } from '../types';
import { Html5Qrcode } from 'html5-qrcode';
// @ts-ignore
import XLSX from 'xlsx-js-style';

const CATEGORIES = [
  'Filamento',
  'Placas & Fontes',
  'Componentes Eletrônicos',
  'Peças Geral',
  'Refrigeração',
  'Acessórios/Insumos',
  'Outros'
] as const;

export function normalizeUserIdentifier(val?: string | null): string {
  if (!val) return '';
  return String(val)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // removes accents, e.g. ftéx -> ftex
}

export const getItemCreatorInfo = (item: InventoryItem): { role: 'admin' | 'colaborador'; user: string; createdAt?: string } => {
  if (!item) return { role: 'admin', user: 'Administrador George' };

  let resolvedRole = item.createdByRole || '';
  let resolvedUser = item.createdByUser || '';
  let resolvedCreatedAt = item.createdAt;

  try {
    const localCreatorMap = JSON.parse(localStorage.getItem('g3d_item_creator_map') || '{}');
    if (localCreatorMap[item.id]) {
      if (!resolvedRole && localCreatorMap[item.id].role) resolvedRole = localCreatorMap[item.id].role;
      if (!resolvedUser && localCreatorMap[item.id].user) resolvedUser = localCreatorMap[item.id].user;
      if (!resolvedCreatedAt && localCreatorMap[item.id].createdAt) resolvedCreatedAt = localCreatorMap[item.id].createdAt;
    }
  } catch (e) {}

  // Check default admin item IDs
  const defaultAdminIds = ['INV-001', 'INV-002', 'INV-003', 'INV-004', 'INV-005', 'INV-006', 'INV-007', 'INV-008'];
  if (item.id && defaultAdminIds.includes(item.id)) {
    return { role: 'admin', user: 'Administrador George', createdAt: resolvedCreatedAt };
  }

  const normUser = normalizeUserIdentifier(resolvedUser);
  if (
    normUser === 'admin' ||
    normUser === 'administrador' ||
    normUser === 'george' ||
    normUser.includes('georgefctec') ||
    normUser.includes('georgefctech')
  ) {
    return { role: 'admin', user: resolvedUser || 'Administrador George', createdAt: resolvedCreatedAt };
  }

  if (resolvedRole === 'admin') {
    return { role: 'admin', user: resolvedUser || 'Administrador George', createdAt: resolvedCreatedAt };
  }

  if (resolvedRole === 'colaborador' || resolvedUser) {
    let displayName = resolvedUser || 'Colaborador';
    const cleanNorm = normalizeUserIdentifier(displayName);
    if (cleanNorm === 'ftex' || cleanNorm === 'colaborador ftex') {
      displayName = 'Colaborador Ftéx';
    } else if (!displayName.toLowerCase().startsWith('colaborador') && !displayName.toLowerCase().startsWith('admin')) {
      displayName = `Colaborador ${displayName.charAt(0).toUpperCase() + displayName.slice(1)}`;
    }
    return {
      role: 'colaborador',
      user: displayName,
      createdAt: resolvedCreatedAt
    };
  }

  return { role: 'admin', user: 'Administrador George', createdAt: resolvedCreatedAt };
};

export const isItemCreatedByColaborador = (item: InventoryItem): boolean => {
  return getItemCreatorInfo(item).role === 'colaborador';
};

export const canUserEditOrDeleteItem = (
  item: InventoryItem, 
  userRole?: string,
  currentUsername?: string,
  currentUserEmail?: string
): boolean => {
  const role = userRole || sessionStorage.getItem('g3d_user_role') || 'colaborador';
  if (role !== 'colaborador') {
    // Administrator has full permissions to edit and delete any item
    return true;
  }

  if (!item) return false;

  const creator = getItemCreatorInfo(item);
  if (creator.role === 'admin') {
    return false;
  }

  const activeUser = currentUsername || sessionStorage.getItem('g3d_username') || '';
  const activeEmail = currentUserEmail || sessionStorage.getItem('g3d_user_email') || '';

  const normCreator = normalizeUserIdentifier(creator.user);
  const normActiveUser = normalizeUserIdentifier(activeUser);
  const normActiveEmail = normalizeUserIdentifier(activeEmail);
  const normActiveEmailPrefix = normActiveEmail ? normActiveEmail.split('@')[0] : '';

  if (!normActiveUser && !normActiveEmail) {
    return false;
  }

  // Strict per-collaborator verification:
  // ONLY the specific collaborator who registered the product (e.g. Jhonatan, Ftéx, Lucas, etc.) can edit or delete it
  const isMatch =
    (normActiveUser && (normCreator === normActiveUser || normCreator.includes(normActiveUser) || normActiveUser.includes(normCreator))) ||
    (normActiveEmail && (normCreator === normActiveEmail || normCreator.includes(normActiveEmail))) ||
    (normActiveEmailPrefix && (normCreator === normActiveEmailPrefix || normCreator.includes(normActiveEmailPrefix)));

  return Boolean(isMatch);
};

export const matchItemCategory = (item: InventoryItem, filterCategory: string): boolean => {
  if (!filterCategory || filterCategory === 'Todos') return true;

  const itemCat = (item.category || '').trim();
  const name = (item.material || '').toLowerCase();

  // If item has an explicit category assigned:
  if (itemCat) {
    if (filterCategory === itemCat) return true;
    if ((filterCategory === 'Placas & Fontes' || filterCategory === 'Placas') && (itemCat === 'Placas & Fontes' || itemCat === 'Placas')) return true;
    if ((filterCategory === 'Peças Geral' || filterCategory === 'Peças de Reposição') && (itemCat === 'Peças Geral' || itemCat === 'Peças de Reposição')) return true;
    if ((filterCategory === 'Acessórios/Insumos' || filterCategory === 'Acessórios') && (itemCat === 'Acessórios/Insumos' || itemCat === 'Acessórios')) return true;
    // Strict isolation: explicit non-matching category must not spill over via keywords
    return false;
  }

  // Fallback keyword matching only if itemCat is missing/empty
  if (filterCategory === 'Refrigeração') {
    if (name.includes('manifold') || name.includes('monifold') || name.includes('cooler') || name.includes('fan') || name.includes('ventoinha') || name.includes('ventilador') || name.includes('duto') || name.includes('coifa') || name.includes('dissipador') || name.includes('heatsink') || name.includes('5015') || name.includes('4010') || name.includes('4020') || name.includes('refrigera')) {
      return true;
    }
    return false;
  }

  if (filterCategory === 'Placas & Fontes' || filterCategory === 'Placas') {
    if (name.includes('placa') || name.includes('fonte') || name.includes('motherboard') || name.includes('skr') || name.includes('mks') || name.includes('btt') || name.includes('chaveada') || name.includes('meanwell') || name.includes('v4.2.7') || name.includes('silent board') || name.includes('mainboard')) {
      return true;
    }
    return false;
  }

  if (filterCategory === 'Componentes Eletrônicos') {
    if (name.includes('sensor') || name.includes('driver') || name.includes('tmc') || name.includes('motor') || name.includes('termistor') || name.includes('aquecedor') || name.includes('bltouch') || name.includes('3dtouch') || name.includes('cabo') || name.includes('mosfet') || name.includes('display') || name.includes('lcd')) {
      return true;
    }
    return false;
  }

  if (filterCategory === 'Peças Geral' || filterCategory === 'Peças de Reposição') {
    if (name.includes('bico') || name.includes('nozzle') || name.includes('correia') || name.includes('polia') || name.includes('heatbreak') || name.includes('bloco') || name.includes('garganta') || name.includes('tubo ptfe') || name.includes('engrenagem') || name.includes('extrusora') || name.includes('extrusor') || name.includes('rolamento') || name.includes('fuso') || name.includes('acoplador') || name.includes('mola') || name.includes('mesa') || name.includes('vidro') || name.includes('pei')) {
      return true;
    }
    return false;
  }

  if (filterCategory === 'Acessórios/Insumos' || filterCategory === 'Acessórios') {
    if (name.includes('álcool') || name.includes('spray') || name.includes('cola') || name.includes('adesivo') || name.includes('espátula') || name.includes('alicate') || name.includes('chave') || name.includes('graxa') || name.includes('lubrificante') || name.includes('silicone') || name.includes('organizador')) {
      return true;
    }
    return false;
  }

  if (filterCategory === 'Filamento') {
    if (name.includes('pla') || name.includes('petg') || name.includes('abs') || name.includes('tpu') || name.includes('nylon') || name.includes('filamento') || name.includes('resina') || name.includes('asa') || name.includes('hips') || name.includes('pc') || name.includes('peek') || name.includes('pvb')) {
      return true;
    }
    return false;
  }

  if (filterCategory === 'Outros') {
    return !matchItemCategory(item, 'Filamento') && !matchItemCategory(item, 'Placas & Fontes') && !matchItemCategory(item, 'Componentes Eletrônicos') && !matchItemCategory(item, 'Peças Geral') && !matchItemCategory(item, 'Refrigeração') && !matchItemCategory(item, 'Acessórios/Insumos');
  }

  return false;
};

const getCategoryBadgeStyle = (cat?: string) => {
  const c = cat?.toLowerCase() || '';
  if (c.includes('filamento')) {
    return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
  }
  if (c.includes('placa') || c.includes('fonte')) {
    return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
  }
  if (c.includes('componente') || c.includes('eletr')) {
    return 'bg-purple-50 text-purple-700 border border-purple-200';
  }
  if (c.includes('peça') || c.includes('peca')) {
    return 'bg-blue-50 text-blue-700 border border-blue-200';
  }
  if (c.includes('refrigera') || c.includes('cooler') || c.includes('fan')) {
    return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
  }
  if (c.includes('acess') || c.includes('insumo')) {
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  }
  return 'bg-slate-100 text-slate-700 border border-slate-200';
};

const getCategoryIcon = (cat?: string, className = "w-3.5 h-3.5") => {
  const c = cat?.toLowerCase() || '';
  if (c.includes('filamento')) return <Layers className={`${className} text-indigo-500`} />;
  if (c.includes('placa') || c.includes('fonte')) return <Cpu className={`${className} text-emerald-500`} />;
  if (c.includes('componente') || c.includes('eletr')) return <Sparkles className={`${className} text-purple-500`} />;
  if (c.includes('peça') || c.includes('peca')) return <Wrench className={`${className} text-blue-500`} />;
  if (c.includes('refrigera') || c.includes('cooler') || c.includes('fan')) return <Fan className={`${className} text-cyan-500`} />;
  if (c.includes('acess') || c.includes('insumo')) return <Package className={`${className} text-amber-500`} />;
  return <Tag className={`${className} text-slate-500`} />;
};

const ensureAbsoluteUrl = (url: string | undefined): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^(f|ht)tps?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAddInventoryItem: (item: Omit<InventoryItem, 'id' | 'gramCost' | 'status'> & { id?: string; image?: string; purchaseLink?: string; category?: string }) => void;
  onDeleteInventoryItem: (id: string) => void;
  onUpdateQty: (id: string, newQty: number) => void;
  onEditInventoryItem?: (id: string, updatedFields: Partial<InventoryItem>) => void;
  onAddShoppingItem?: (item: Omit<ShoppingItem, 'id' | 'checked'>) => void;
  userRole?: string;
  onNavigate?: (view: string) => void;
}

export default function InventoryView({
  inventory,
  onAddInventoryItem,
  onDeleteInventoryItem,
  onUpdateQty,
  onEditInventoryItem,
  onAddShoppingItem,
  userRole,
  onNavigate
}: InventoryViewProps) {
  const currentUserRole = userRole || sessionStorage.getItem('g3d_user_role') || 'colaborador';
  const currentUsername = sessionStorage.getItem('g3d_username') || '';
  const currentUserEmail = sessionStorage.getItem('g3d_user_email') || '';

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Category filter state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('Todos');

  // Add item state
  const [materialName, setMaterialName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Filamento');
  const [qty, setQty] = useState('1');
  const [unitCost, setUnitCost] = useState('150.00');
  const [purchaseLink, setPurchaseLink] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [manualImgUrl, setManualImgUrl] = useState('');
  const [uploadedBase64, setUploadedBase64] = useState('');
  const [selectedPresetColor, setSelectedPresetColor] = useState('#6366f1'); // default indigo brand

  // QR/Barcode scan and input states
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [customBarcodeId, setCustomBarcodeId] = useState(''); // Stores barcode to pre-fill registration
  const [scanSuccessMsg, setScanSuccessMsg] = useState('');

  // Audio system for scan feedback (Web Audio API)
  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // Professional register sound
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12); // Short bip
    } catch (e) {
      console.warn("Audio blocked or unsupported:", e);
    }
  };

  const handleCodeDetected = (code: string) => {
    if (!code) return;
    setScannedCode(code);
    playScanBeep();
    setScanSuccessMsg(`Código identificado com sucesso: "${code}"`);
    setTimeout(() => setScanSuccessMsg(''), 3000);
  };

  // Camera scanner life-cycle
  useEffect(() => {
    let qrcodeScannerInstance: any = null;
    
    if (isScanning) {
      const timer = setTimeout(() => {
        try {
          const qrScanner = new Html5Qrcode("scanner-viewport");
          qrcodeScannerInstance = qrScanner;
          
          qrScanner.start(
            { facingMode: "environment" },
            {
              fps: 15,
              qrbox: (width, height) => {
                const scannerSize = Math.min(width, height) * 0.70;
                return { width: scannerSize, height: scannerSize };
              }
            },
            (decodedText) => {
              handleCodeDetected(decodedText);
            },
            () => {
              // verbose scan logs avoided
            }
          ).catch((e) => {
            console.warn("Iframe or hardware camera media constraint error:", e);
          });
        } catch (err) {
          console.error("Failed to boot Html5Qrcode widget:", err);
        }
      }, 300);
      
      return () => {
        clearTimeout(timer);
        if (qrcodeScannerInstance && qrcodeScannerInstance.isScanning) {
          qrcodeScannerInstance.stop().then(() => {
            console.log("Scanner stopped.");
          }).catch((err: any) => console.error("Error stopping scanner:", err));
        }
      };
    }
  }, [isScanning]);

  // Edit item state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<string>('Filamento');
  const [editQty, setEditQty] = useState(0);
  const [editUnitCost, setEditUnitCost] = useState(0);
  const [editLink, setEditLink] = useState('');
  const [editImg, setEditImg] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Purchase / Add to shopping states
  const [purchasingItem, setPurchasingItem] = useState<InventoryItem | null>(null);
  const [purchaseQty, setPurchaseQty] = useState<number>(1);
  const [purchaseNotes, setPurchaseNotes] = useState<string>('');
  const [purchaseSuccessMsg, setPurchaseSuccessMsg] = useState<string>('');

  const handleAddToShopping = () => {
    if (!purchasingItem) return;
    
    // Map item category to shopping category if supported
    const itemCat = purchasingItem.category || 'Filamento';
    let shopCat: 'Filamento' | 'Peças de Reposição' | 'Acessórios/Insumos' | 'Refrigeração' | 'Outros' = 'Outros';
    if (itemCat === 'Filamento') shopCat = 'Filamento';
    else if (itemCat === 'Refrigeração') shopCat = 'Refrigeração';
    else if (itemCat === 'Placas' || itemCat === 'Componentes Eletrônicos' || itemCat === 'Peças Geral') shopCat = 'Peças de Reposição';
    
    if (onAddShoppingItem) {
      onAddShoppingItem({
        materialName: purchasingItem.material,
        qtyNeeded: purchaseQty,
        estUnitCost: purchasingItem.unitCost,
        purchaseLink: purchasingItem.purchaseLink || '',
        category: shopCat,
        notes: purchaseNotes ? `Solicitado via inventário (${itemCat}). Obs: ${purchaseNotes}` : `Solicitado via inventário (${itemCat}).`,
        requestedBy: userRole === 'colaborador' ? 'Colaborador' : 'Administrador',
        company: userRole === 'colaborador' ? 'Ftéx' : 'GeorgeFctech-3D'
      });
    }

    if (purchasingItem.purchaseLink) {
      window.open(ensureAbsoluteUrl(purchasingItem.purchaseLink), '_blank', 'noreferrer,noopener');
    }

    setPurchaseSuccessMsg(`Item "${purchasingItem.material}" adicionado à lista de compras com sucesso (Quantidade: ${purchaseQty})!`);
    setPurchasingItem(null);
    setPurchaseQty(1);
    setPurchaseNotes('');

    if (onNavigate) {
      onNavigate('compras');
    }

    setTimeout(() => {
      setPurchaseSuccessMsg('');
    }, 4500);
  };

  const presetColors = [
    { name: 'Preto Técnico', color: '#1e293b', url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&q=80' },
    { name: 'Branco Neve', color: '#f8fafc', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eae6?w=300&q=80' },
    { name: 'Vermelho Flerte', color: '#ef4444', url: 'https://images.unsplash.com/photo-1615840287214-7fe58a8b668f?w=300&q=80' },
    { name: 'Azul Espacial', color: '#3b82f6', url: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=300&q=80' },
    { name: 'Dourado Escultura', color: '#eab308', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300&q=80' }
  ];

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEditMode = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check size limit (max 1MB to preserve localStorage space)
    if (file.size > 1.2 * 1024 * 1024) {
      alert('A foto selecionada é muito grande. Escolha uma foto com menos de 1MB para preservar espaço no banco local.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (isEditMode) {
        setEditImg(result);
      } else {
        setUploadedBase64(result);
        setImgUrl(''); // Clear url if uploaded file
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (presetUrl: string) => {
    setImgUrl(presetUrl);
    setUploadedBase64(''); // Clear local file if choosing preset
  };

  const handleAdditem = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess(false);

    if (!materialName.trim()) {
      setErrorMsg('Informe as especificações do insumo (ex: PETG CF10, Placa V4.2.7...).');
      return;
    }

    const qtyNum = parseInt(qty) || 0;
    const costNum = parseFloat(unitCost) || 0;

    if (qtyNum < 0) {
      setErrorMsg('A quantidade em estoque deve ser igual ou superior a zero.');
      return;
    }

    if (costNum <= 0) {
      setErrorMsg('O preço pago unitário/rolo deve ser superior a zero.');
      return;
    }

    const finalImage = uploadedBase64 || manualImgUrl.trim() || imgUrl || 'https://images.unsplash.com/photo-1612815154858-60aa4c59eae6?w=300&q=80';

    const activeUser = currentUsername || (currentUserRole === 'colaborador' ? 'Colaborador' : 'Administrador George');
    const createdByRole = currentUserRole === 'colaborador' ? 'colaborador' : 'admin';
    const createdByUser = activeUser;
    const createdAt = new Date().toISOString();

    onAddInventoryItem({
      id: customBarcodeId.trim() ? customBarcodeId.trim() : undefined,
      material: materialName.trim(),
      qty: qtyNum,
      unitCost: costNum,
      image: finalImage,
      purchaseLink: purchaseLink.trim(),
      category: selectedCategory,
      createdByRole,
      createdByUser,
      createdAt
    });

    // Reset Form
    setMaterialName('');
    setSelectedCategory('Filamento');
    setQty('1');
    setUnitCost('150.00');
    setPurchaseLink('');
    setImgUrl('');
    setManualImgUrl('');
    setUploadedBase64('');
    setCustomBarcodeId('');
    setSuccess(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    const creator = getItemCreatorInfo(editingItem);
    if (currentUserRole === 'colaborador' && !canUserEditOrDeleteItem(editingItem, currentUserRole, currentUsername, currentUserEmail)) {
      alert(`Apenas ${creator.user} (quem cadastrou) ou o Administrador pode editar este insumo.`);
      setEditingItem(null);
      return;
    }

    if (onEditInventoryItem) {
      onEditInventoryItem(editingItem.id, {
        material: editName,
        category: editCategory,
        qty: editQty,
        unitCost: editUnitCost,
        purchaseLink: editLink,
        image: editImg,
        createdByRole: editingItem.createdByRole,
        createdByUser: editingItem.createdByUser,
        createdAt: editingItem.createdAt
      });
    }
    setEditingItem(null);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Em Estoque':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      case 'Poucas Unidades':
        return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'Esgotado':
        return 'bg-rose-50 text-rose-700 border border-rose-100';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-150';
    }
  };

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // EXCEL REPORT GENERATION WITH DEDICATED SHEETS FOR PLACAS, FILAMENTOS, ETC.
  const downloadInventoryExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const reportDate = new Date().toLocaleDateString('pt-BR');

      const styleTitle = {
        font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E1B4B' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      const styleHeader = {
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4338CA' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } }
        }
      };

      const styleCell = {
        font: { name: 'Calibri', sz: 10 },
        alignment: { vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
          left: { style: 'thin', color: { rgb: 'E2E8F0' } },
          right: { style: 'thin', color: { rgb: 'E2E8F0' } }
        }
      };

      const styleNumber = {
        ...styleCell,
        alignment: { horizontal: 'right', vertical: 'center' },
        numFmt: 'R$ #,##0.00'
      };

      const styleTotal = {
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '1E1B4B' } },
        fill: { fgColor: { rgb: 'EEF2FF' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '4338CA' } },
          bottom: { style: 'double', color: { rgb: '4338CA' } }
        },
        numFmt: 'R$ #,##0.00'
      };

      // 1. GENERAL CONSOLIDATED SHEET
      const generalData: any[][] = [
        ['GEORGEFCTECH-3D — RELATÓRIO CONSOLIDADO DE ESTOQUE E INSUMOS'],
        [`Data da Emissão: ${reportDate} | Total de Itens: ${inventory.length}`],
        [],
        ['ID / SKU', 'Categoria', 'Insumo / Especificação', 'Qtd Estoque', 'Preço Unitário (R$)', 'Custo p/ Grama (R$)', 'Total Imobilizado (R$)', 'Status', 'Link Fornecedor']
      ];

      inventory.forEach(item => {
        const totalCost = (item.qty || 0) * (item.unitCost || 0);
        generalData.push([
          item.id || '-',
          item.category || 'Filamento',
          item.material || '-',
          item.qty || 0,
          item.unitCost || 0,
          item.gramCost || (item.unitCost ? item.unitCost / 1000 : 0),
          totalCost,
          item.status || 'Em Estoque',
          item.purchaseLink || 'Sem Link'
        ]);
      });

      const totalGeneral = inventory.reduce((sum, i) => sum + ((i.qty || 0) * (i.unitCost || 0)), 0);
      generalData.push([]);
      generalData.push(['TOTAL GERAL IMOBILIZADO NO ESTOQUE', '', '', inventory.reduce((s, i) => s + (i.qty || 0), 0), '', '', totalGeneral, '', '']);

      const wsGeneral = XLSX.utils.aoa_to_sheet(generalData);
      wsGeneral['!cols'] = [
        { wch: 14 }, { wch: 22 }, { wch: 38 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 35 }
      ];
      XLSX.utils.book_append_sheet(wb, wsGeneral, 'Estoque Geral');

      // 2. DEDICATED SHEETS PER CATEGORY (Placas & Fontes, Filamentos, Componentes, etc.)
      const reportCategories = ['Placas & Fontes', 'Filamento', 'Componentes Eletrônicos', 'Peças Geral', 'Refrigeração', 'Acessórios/Insumos', 'Outros'];

      reportCategories.forEach(catName => {
        const catItems = inventory.filter(item => matchItemCategory(item, catName));
        if (catItems.length === 0) return;

        const sheetTitle = catName.length > 28 ? catName.substring(0, 28) : catName;
        const catData: any[][] = [
          [`GEORGEFCTECH-3D — ESTOQUE: ${catName.toUpperCase()}`],
          [`Data da Emissão: ${reportDate} | Itens Cadastrados: ${catItems.length}`],
          [],
          ['ID / SKU', 'Insumo / Especificação', 'Qtd em Estoque', 'Preço Unitário (R$)', 'Custo p/ g ou Un. (R$)', 'Total Imobilizado (R$)', 'Status', 'Link Fornecedor']
        ];

        catItems.forEach(item => {
          const totalCost = (item.qty || 0) * (item.unitCost || 0);
          catData.push([
            item.id || '-',
            item.material || '-',
            item.qty || 0,
            item.unitCost || 0,
            item.gramCost || (item.unitCost ? item.unitCost / 1000 : 0),
            totalCost,
            item.status || 'Em Estoque',
            item.purchaseLink || 'Sem Link'
          ]);
        });

        const catTotalValue = catItems.reduce((sum, i) => sum + ((i.qty || 0) * (i.unitCost || 0)), 0);
        const catTotalQty = catItems.reduce((sum, i) => sum + (i.qty || 0), 0);
        catData.push([]);
        catData.push([`SUBTOTAL ${catName.toUpperCase()}`, '', catTotalQty, '', '', catTotalValue, '', '']);

        const wsCat = XLSX.utils.aoa_to_sheet(catData);
        wsCat['!cols'] = [
          { wch: 14 }, { wch: 38 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 35 }
        ];
        XLSX.utils.book_append_sheet(wb, wsCat, sheetTitle.replace('/', '-'));
      });

      const todayStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Relatorio_Estoque_GeorgeFctech_3D_${todayStr}.xlsx`);
    } catch (e) {
      console.error("Erro ao gerar planilha Excel de estoque:", e);
      alert("Houve um problema ao compilar o arquivo Excel. Verifique os dados e tente novamente.");
    }
  };

  // PRINTABLE HTML / PDF REPORT GENERATOR WITH DEDICATED TABLES PER CATEGORY
  const downloadInventoryHtmlReport = () => {
    const reportDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const isAll = activeCategoryFilter === 'Todos';
    const categoriesToRender = isAll
      ? ['Placas & Fontes', 'Filamento', 'Componentes Eletrônicos', 'Peças Geral', 'Refrigeração', 'Acessórios/Insumos', 'Outros']
      : [activeCategoryFilter];

    const totalItemsCount = inventory.length;
    const totalStockValue = inventory.reduce((acc, i) => acc + ((i.qty || 0) * (i.unitCost || 0)), 0);
    const lowStockCount = inventory.filter(i => i.qty <= 1).length;

    let tablesHtml = '';

    categoriesToRender.forEach(catName => {
      const itemsInCat = inventory.filter(item => matchItemCategory(item, catName));
      if (itemsInCat.length === 0) return;

      const catSubtotal = itemsInCat.reduce((acc, i) => acc + ((i.qty || 0) * (i.unitCost || 0)), 0);
      const catTotalQty = itemsInCat.reduce((acc, i) => acc + (i.qty || 0), 0);

      tablesHtml += `
        <div class="category-block">
          <div class="category-header">
            <div class="category-title">
              <span class="category-badge">${catName}</span>
              <span class="category-count">${itemsInCat.length} produto(s) • ${catTotalQty} unidade(s)</span>
            </div>
            <div class="category-total">
              Subtotal: <strong>${formatBRL(catSubtotal)}</strong>
            </div>
          </div>
          
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 55px; text-align: center;">FOTO</th>
                <th style="text-align: left;">INSUMO / ESPECIFICAÇÃO</th>
                <th style="width: 100px; text-align: center;">CÓDIGO / SKU</th>
                <th style="width: 75px; text-align: center;">QTD</th>
                <th style="width: 105px; text-align: right;">PREÇO UN.</th>
                <th style="width: 110px; text-align: right;">CUSTO P/ G OU UN.</th>
                <th style="width: 120px; text-align: right;">TOTAL ESTOQUE</th>
                <th style="width: 95px; text-align: center;">STATUS</th>
                <th style="width: 120px; text-align: center;">LINK FORNECEDOR</th>
              </tr>
            </thead>
            <tbody>
              ${itemsInCat.map(item => {
                const itemTotal = (item.qty || 0) * (item.unitCost || 0);
                const statusClass = item.qty === 0 ? 'status-esgotado' : (item.qty <= 1 ? 'status-pouco' : 'status-ok');
                const costPerGramStr = item.gramCost ? `R$ ${item.gramCost.toFixed(3)}/g` : (item.unitCost ? `R$ ${(item.unitCost / 1000).toFixed(3)}/g` : '--');
                const imageSrc = item.image || 'https://images.unsplash.com/photo-1612815154858-60aa4c59eae6?w=100&q=80';
                
                return `
                  <tr>
                    <td style="text-align: center;">
                      <img src="${imageSrc}" alt="${item.material}" class="thumb-img" onerror="this.style.display='none'" />
                    </td>
                    <td>
                      <div class="material-name">${item.material}</div>
                      <div class="material-cat">${item.category || catName}</div>
                    </td>
                    <td style="text-align: center; font-family: monospace; font-size: 10.5px; font-weight: bold; color: #4338ca;">
                      ${item.id || '-'}
                    </td>
                    <td style="text-align: center; font-weight: bold; font-family: monospace;">
                      ${item.qty} un
                    </td>
                    <td style="text-align: right; font-family: monospace;">
                      ${formatBRL(item.unitCost)}
                    </td>
                    <td style="text-align: right; font-family: monospace; color: #4338ca; font-weight: 600;">
                      ${costPerGramStr}
                    </td>
                    <td style="text-align: right; font-weight: bold; font-family: monospace; color: #0f172a;">
                      ${formatBRL(itemTotal)}
                    </td>
                    <td style="text-align: center;">
                      <span class="status-pill ${statusClass}">${item.status || (item.qty === 0 ? 'Esgotado' : 'Em Estoque')}</span>
                    </td>
                    <td style="text-align: center; font-size: 10px;">
                      ${item.purchaseLink ? `<a href="${ensureAbsoluteUrl(item.purchaseLink)}" target="_blank" class="buy-link">Acessar Loja ↗</a>` : '<span style="color: #94a3b8;">-</span>'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr class="subtotal-row">
                <td colspan="3" style="text-align: right; font-weight: bold;">SUBTOTAL ${catName.toUpperCase()}:</td>
                <td style="text-align: center; font-weight: bold; font-family: monospace;">${catTotalQty} un</td>
                <td colspan="2"></td>
                <td style="text-align: right; font-weight: bold; font-family: monospace; color: #4338ca;">${formatBRL(catSubtotal)}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    });

    const printHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Oficial de Estoque e Insumos — GeorgeFctech-3D</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');
          
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background: #ffffff;
            color: #0f172a;
            padding: 30px;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 18px;
            margin-bottom: 22px;
          }
          
          .brand-logo {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .brand-badge {
            background: #4338ca;
            color: #ffffff;
            font-weight: 800;
            font-size: 16px;
            padding: 8px 14px;
            border-radius: 8px;
            letter-spacing: 0.5px;
          }
          
          .brand-info h1 {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 2px;
          }
          
          .brand-info p {
            font-size: 11px;
            color: #64748b;
          }
          
          .header-meta {
            text-align: right;
            font-size: 11px;
            color: #475569;
          }
          
          .header-meta strong {
            color: #0f172a;
          }

          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }

          .metric-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 12px 16px;
          }

          .metric-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            margin-bottom: 4px;
          }

          .metric-value {
            font-size: 18px;
            font-weight: 800;
            font-family: 'JetBrains Mono', monospace;
            color: #0f172a;
          }

          .metric-value.highlight {
            color: #4338ca;
          }

          .category-block {
            margin-bottom: 28px;
            page-break-inside: avoid;
          }

          .category-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f1f5f9;
            padding: 8px 14px;
            border-radius: 8px 8px 0 0;
            border: 1px solid #cbd5e1;
            border-bottom: none;
          }

          .category-title {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .category-badge {
            background: #4338ca;
            color: #ffffff;
            font-weight: 700;
            font-size: 11px;
            padding: 3px 10px;
            border-radius: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .category-count {
            font-size: 11px;
            color: #475569;
            font-weight: 600;
          }

          .category-total {
            font-size: 12px;
            color: #0f172a;
          }

          .category-total strong {
            color: #4338ca;
            font-family: 'JetBrains Mono', monospace;
          }

          .data-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cbd5e1;
            font-size: 11px;
            background: #ffffff;
          }

          .data-table th {
            background: #f8fafc;
            color: #475569;
            font-weight: 700;
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
          }

          .data-table td {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
          }

          .data-table tr:nth-child(even) {
            background: #fafafa;
          }

          .thumb-img {
            width: 32px;
            height: 32px;
            object-fit: cover;
            border-radius: 6px;
            border: 1px solid #cbd5e1;
          }

          .material-name {
            font-weight: 700;
            color: #0f172a;
            font-size: 11.5px;
          }

          .material-cat {
            font-size: 9.5px;
            color: #64748b;
          }

          .status-pill {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 9.5px;
            font-weight: 700;
          }

          .status-ok { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
          .status-pouco { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
          .status-esgotado { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

          .buy-link {
            color: #4338ca;
            text-decoration: none;
            font-weight: 600;
          }

          .subtotal-row td {
            background: #f8fafc;
            border-top: 2px solid #cbd5e1;
            padding: 8px 10px;
          }

          .report-footer {
            margin-top: 36px;
            border-top: 2px solid #e2e8f0;
            padding-top: 18px;
            display: flex;
            justify-content: space-between;
            font-size: 10.5px;
            color: #64748b;
          }

          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 35px;
          }

          .sig-box {
            border-top: 1px solid #94a3b8;
            padding-top: 6px;
            text-align: center;
            font-size: 11px;
            color: #334155;
          }

          .no-print {
            margin-bottom: 20px;
            background: #e0e7ff;
            padding: 12px 16px;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .btn-print {
            background: #4338ca;
            color: #ffffff;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
            font-size: 12px;
          }

          @media print {
            .no-print { display: none; }
            body { padding: 10px; font-size: 10px; }
            .category-block { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <div>
            <strong>Pré-visualização do Relatório de Estoque</strong> — Configure para salvar em PDF ou imprimir na sua impressora.
          </div>
          <button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
        </div>

        <div class="report-header">
          <div class="brand-logo">
            <div class="brand-badge">GF3D</div>
            <div class="brand-info">
              <h1>GEORGEFCTECH-3D — RELATÓRIO OFICIAL DE ESTOQUE</h1>
              <p>Controle de Insumos, Matéria-Prima, Placas e Componentes Eletrônicos</p>
            </div>
          </div>
          <div class="header-meta">
            <p><strong>Emissão:</strong> ${reportDate}</p>
            <p><strong>Filtro Aplicado:</strong> ${isAll ? 'Todas as Categorias' : activeCategoryFilter}</p>
            <p><strong>Emitido por:</strong> ${userRole === 'colaborador' ? 'Colaborador Ftéx' : 'Administrador GeorgeFctech'}</p>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total de Itens Cadastrados</div>
            <div class="metric-value">${totalItemsCount} produtos</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Valor Imobilizado em Estoque</div>
            <div class="metric-value highlight">${formatBRL(totalStockValue)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Itens em Alerta / Reposição</div>
            <div class="metric-value" style="color: ${lowStockCount > 0 ? '#b45309' : '#166534'};">${lowStockCount} itens</div>
          </div>
        </div>

        ${tablesHtml}

        <div class="signatures">
          <div class="sig-box">
            <strong>Responsável Técnico / Estoque</strong><br />
            GeorgeFctech-3D — Controle Patrimonial
          </div>
          <div class="sig-box">
            <strong>Auditoria e Conferência Física</strong><br />
            Data: ____ / ____ / ________
          </div>
        </div>

        <div class="report-footer">
          <div>GeorgeFctech-3D & FTÉX Soluções Industriais — Gestão de Impressão 3D e Manufatura Aditiva</div>
          <div>Página 1 de 1</div>
        </div>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(printHtml);
      printWin.document.close();
      printWin.focus();
    } else {
      alert('O bloqueador de pop-ups impediu a abertura do relatório. Por favor, permita pop-ups para imprimir.');
    }
  };

  return (
    <div className="font-sans antialiased text-slate-800">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-950 mb-1">
            Gestão de Insumos & Custos de Matéria-Prima
          </h1>
          <p className="text-sm text-slate-500">
            Gerencie o estoque de filamentos, veja custos reais de impressão, associe links de compra e visualize fotos dos carretéis.
          </p>
        </div>

        {/* ACTION BUTTONS & VIEW MODE TOGGLER */}
        <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={downloadInventoryHtmlReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition shadow-2xs hover:border-slate-300 cursor-pointer"
            title="Imprimir ou gerar PDF formatado por categoria"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600" />
            Imprimir Relatório (PDF)
          </button>

          <button
            onClick={downloadInventoryExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            title="Baixar planilha Excel com abas separadas por categoria (Placas, Filamentos...)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Exportar Excel (.xlsx)
          </button>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition duration-150 ${
                viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Galeria
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold tracking-wide transition duration-150 ${
                viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Tabela
            </button>
          </div>
        </div>
      </div>

      {/* SCANNER DE INSUMOS TRIGGER BANNER */}
      <div className="mb-6 p-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 rounded-xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-950/40">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/15 rounded-lg text-indigo-400 border border-indigo-500/20 shadow-inner">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide flex items-center gap-1.5">
              Controle Inteligente de Estoque por QR / Código de Barras
              <span className="text-[9px] bg-indigo-500/30 text-indigo-300 font-extrabold uppercase px-1.5 py-0.5 rounded tracking-widest border border-indigo-500/25">Móvel</span>
            </h3>
            <p className="text-xs text-slate-300">
              Escaneie o QR da embalagem com a câmera do celular para atualizar o estoque ou cadastrar novos insumos imediatamente!
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsScanning(true);
            setScannedCode('');
            setManualCode('');
          }}
          className="px-4 py-2.5 bg-white text-indigo-950 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto shrink-0"
        >
          <Scan className="w-4 h-4 text-indigo-600" />
          Abrir Escaneador
        </button>
      </div>

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm shadow-sm">
          Insumo cadastrado com sucesso com fotos e link de compra!
        </div>
      )}

      {purchaseSuccessMsg && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2 shadow-sm font-semibold">
          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
          {purchaseSuccessMsg}
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {errorMsg}
        </div>
      )}

      {/* CORE INPUT & DISPLAY CONTAINERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COMPONENT: ADD FORM */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
              <Package className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Cadastrar Novo Insumo
              </h3>
            </div>

            <form onSubmit={handleAdditem} className="space-y-4">
              {/* Category Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Categoria do Insumo *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition duration-150 text-left flex items-center justify-between cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      {selectedCategory === cat && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* ID / Barcode Field */}
              <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                <label className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                  <span>Código de Barras / SKU (Opcional)</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsScanning(true);
                      setScannedCode('');
                      setManualCode('');
                    }}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Scan className="w-3 h-3 text-indigo-600 animate-pulse" />
                    Escanear Câmera
                  </button>
                </label>
                <input
                  type="text"
                  placeholder="Código de barra ou gera automático"
                  value={customBarcodeId}
                  onChange={(e) => setCustomBarcodeId(e.target.value)}
                  className="px-3 py-1.5 w-full border border-slate-200 rounded-md bg-white text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Nome do Insumo / Fabricante / Especificação *
                </label>
                <input
                  type="text"
                  required
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  placeholder="Ex: Placa V4.2.7 ou PETG Creality 1kg"
                  className="px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white placeholder-slate-400 transition-all font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Qtd em Estoque
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Preço Unitário (R$)
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>

              {/* PURCHASE LINK INPUT */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Link de Compra Direta
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Link className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="url"
                    value={purchaseLink}
                    onChange={(e) => setPurchaseLink(e.target.value)}
                    placeholder="Ex: https://www.mercadolivre.com.br/..."
                    className="px-4 pl-9 py-2 w-full border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white placeholder-slate-400 transition-all font-sans"
                  />
                </div>
              </div>

              {/* INSUMO PHOTO UPLOADER & URL INPUT */}
              <div className="flex flex-col gap-2.5 pt-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Foto / Imagem do Insumo
                </label>
                
                {/* PRESETS SLIDER */}
                <div>
                  <div className="text-[10px] uppercase font-mono text-slate-400 mb-1.5">Escolher Presets de Cores:</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {presetColors.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          handlePresetSelect(preset.url);
                          setManualImgUrl('');
                        }}
                        title={preset.name}
                        className={`h-7 px-2.5 rounded text-[11px] font-semibold border flex items-center gap-1.5 transition ${
                          imgUrl === preset.url && !uploadedBase64 && !manualImgUrl
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full inline-block shadow-inner" style={{ backgroundColor: preset.color }}></span>
                        {preset.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-center py-0.5">
                  <span className="text-[10px] font-mono text-slate-400">OU INSERIR URL / LINK DA IMAGEM NA WEB</span>
                </div>

                {/* MANUAL IMAGE URL INPUT */}
                <div className="flex flex-col gap-1">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400">
                      <Globe className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="url"
                      value={manualImgUrl}
                      onChange={(e) => {
                        setManualImgUrl(e.target.value);
                        if (e.target.value.trim()) {
                          setUploadedBase64('');
                          setImgUrl(e.target.value.trim());
                        }
                      }}
                      placeholder="Ex: https://dominio.com/foto-placa-fonte.jpg"
                      className="px-4 pl-9 py-2 w-full border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white placeholder-slate-400 transition-all font-sans"
                    />
                    {manualImgUrl && (
                      <button
                        type="button"
                        onClick={() => setManualImgUrl('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                        title="Limpar URL"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {manualImgUrl.trim() && (
                    <div className="flex items-center gap-2 p-2 bg-indigo-50/60 rounded-lg border border-indigo-100 mt-1">
                      <img
                        src={manualImgUrl}
                        alt="Preview da URL"
                        className="w-10 h-10 object-cover rounded border border-indigo-200 shrink-0 bg-white"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <span className="text-[11px] text-indigo-700 font-medium truncate">
                        Imagem carregada via URL
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-center py-0.5">
                  <span className="text-[10px] font-mono text-slate-400">OU SUBIR FOTO REAL DO CELULAR ou ARQUIVO</span>
                </div>

                {/* FILE UPLOAD DRAG/CLICK */}
                <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 min-h-[70px] rounded-lg p-3 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer transition select-none">
                  {uploadedBase64 ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={uploadedBase64}
                        alt="Preview"
                        className="w-10 h-10 object-cover rounded border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-left">
                        <span className="text-xs text-indigo-600 font-semibold truncate block max-w-[140px]">Foto Real Anexada</span>
                        <span className="text-[10px] text-slate-400 block">Clique para alterar</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[11px] font-semibold text-slate-600">Procurar ou arrastar imagem do arquivo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleImageFileChange(e);
                      setManualImgUrl('');
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                Injetar ao Inventário
              </button>
            </form>
          </div>

          {/* REALTIME TRIVIA */}
          <div className="mt-8 p-4 rounded-lg bg-slate-50 border border-slate-100 space-y-3">
            <h4 className="text-[10px] font-bold text-indigo-650 tracking-widest uppercase mb-1">
              ESTRUTURA DE COMPRA 3D
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              O software de precificação GeorgeFctech usará o valor por rolo ou unidade para encontrar de forma precisa a taxa de consumo de cada material.
            </p>
          </div>
        </div>

        {/* RIGHT COMPONENT: GALLERIES AND DETAILS */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Insumos no Estoque ({inventory.length})
              </h3>
            </div>
            
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                  viewMode === 'grid'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                  viewMode === 'table'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Tabela
              </button>
            </div>
          </div>

          {/* CATEGORY FILTER TABS */}
          <div className="flex flex-wrap items-center gap-1.5 mb-6 pb-2">
            <button
              onClick={() => setActiveCategoryFilter('Todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeCategoryFilter === 'Todos'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Todos</span>
              <span className="px-1.5 py-0.2 bg-black/15 rounded-full text-[10px] font-mono">
                {inventory.length}
              </span>
            </button>

            {CATEGORIES.map((cat) => {
              const count = inventory.filter(i => matchItemCategory(i, cat)).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    activeCategoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {getCategoryIcon(cat, "w-3 h-3")}
                    {cat}
                  </span>
                  <span className="px-1.5 py-0.2 bg-black/15 rounded-full text-[10px] font-mono">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {(() => {
            const filteredInventory = inventory.filter(item => {
              if (activeCategoryFilter === 'Todos') return true;
              return matchItemCategory(item, activeCategoryFilter);
            });

            return viewMode === 'grid' ? (
              /* GRID COMPONET LAYOUT */
              filteredInventory.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredInventory.map((item) => (
                    <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition duration-200 flex flex-col bg-white">
                      {/* Filament spool / item representation */}
                      <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center group select-none">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.material}
                            className="w-full h-full object-cover select-none group-hover:scale-105 duration-300 pointer-events-none"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 to-indigo-950 flex flex-col items-center justify-center">
                            <Plus className="w-10 h-10 text-indigo-400 stroke-1" />
                          </div>
                        )}
                        
                        {/* Zoom Trigger Button */}
                        {item.image && (
                          <button
                            onClick={() => setZoomImage(item.image || null)}
                            className="absolute right-3.5 bottom-3.5 p-2 bg-black/60 rounded-lg text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 duration-150 shadow-sm"
                            title="Visualizar Detalhes"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border border-white/10 uppercase">
                          {item.id}
                        </div>

                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full ${getCategoryBadgeStyle(item.category)}`}>
                            {item.category || 'Filamento'}
                          </span>
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${getStatusStyle(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>

                      {/* Meta info body */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${getCategoryBadgeStyle(item.category)}`}>
                              {item.category || 'Filamento'}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm leading-snug tracking-tight truncate-2-lines">{item.material}</h4>
                          
                          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100 text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 block">Estoque</span>
                              <span className="font-bold text-slate-800 text-sm">{item.qty} Un/Rolos</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 block">Preço Unitário</span>
                              <span className="font-semibold text-slate-800 text-sm">{formatBRL(item.unitCost)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 block">Custo por Grama</span>
                              <span className="font-bold font-mono text-indigo-600 text-sm">R$ {item.gramCost?.toFixed(3)}/g</span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 block">Origem</span>
                              <div className="mt-0.5">
                                {(() => {
                                  const creatorInfo = getItemCreatorInfo(item);
                                  return creatorInfo.role === 'colaborador' ? (
                                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                      <User className="w-2.5 h-2.5" /> {creatorInfo.user}
                                    </span>
                                  ) : (
                                    <span className="text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                      <Crown className="w-2.5 h-2.5" /> Admin
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          {item.purchaseLink ? (
                            <button
                              onClick={() => {
                                setPurchasingItem(item);
                                setPurchaseQty(1);
                                setPurchaseNotes('');
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Link de Compra
                            </button>
                          ) : (
                            <span className="flex-1 text-[11px] text-slate-400 italic text-center py-2">Sem Link Cadastrado</span>
                          )}

                          {(() => {
                            const creatorInfo = getItemCreatorInfo(item);
                            const canManage = canUserEditOrDeleteItem(item, currentUserRole, currentUsername, currentUserEmail);
                            return canManage ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setEditName(item.material);
                                    setEditCategory(item.category || 'Filamento');
                                    setEditQty(item.qty);
                                    setEditUnitCost(item.unitCost);
                                    setEditLink(item.purchaseLink || '');
                                    setEditImg(item.image || '');
                                  }}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-100 transition cursor-pointer"
                                  title="Editar Insumo"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                
                                <button
                                  onClick={() => {
                                    if (confirm(`Deseja realmente apagar o insumo "${item.material}"?`)) {
                                      onDeleteInventoryItem(item.id);
                                    }
                                  }}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-100 transition cursor-pointer"
                                  title="Remover Insumo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div 
                                className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400" 
                                title={`Insumo cadastrado por ${creatorInfo.user}. Edição e exclusão restritas.`}
                              >
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 truncate max-w-[80px]">{creatorInfo.user}</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Database className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Nenhum insumo cadastrado na categoria "{activeCategoryFilter}".</p>
                </div>
              )
            ) : (
              /* STANDARD DATA TABLE LAYOUT */
              <div className="overflow-x-auto">
                {filteredInventory.length > 0 ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                        <th className="py-3 px-4">Foto/Nome</th>
                        <th className="py-3 px-4 text-center">Categoria</th>
                        <th className="py-3 px-4 text-center">Volume Estoque</th>
                        <th className="py-3 px-4 text-right">Preço Un.</th>
                        <th className="py-3 px-4 text-right">Custo p/ Grama</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Mercado/Link</th>
                        <th className="py-3 px-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredInventory.map((item) => {
                        const creatorInfo = getItemCreatorInfo(item);
                        const canManage = canUserEditOrDeleteItem(item, currentUserRole, currentUsername, currentUserEmail);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50 text-sm transition-colors duration-150">
                            <td className="py-3 px-4 font-semibold text-slate-800 max-w-[240px]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100 cursor-pointer" onClick={() => item.image && setZoomImage(item.image)}>
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.material}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-indigo-50 text-indigo-500 font-mono text-[10px] font-bold flex items-center justify-center">3D</div>
                                  )}
                                </div>
                                <span className="truncate block" title={item.material}>
                                  {item.material}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${getCategoryBadgeStyle(item.category)}`}>
                                {item.category || 'Filamento'}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              {canManage ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => onUpdateQty(item.id, Math.max(0, item.qty - 1))}
                                    className="w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                                    title="Diminuir Estoque"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono font-semibold text-slate-700 px-2 min-w-[50px] inline-block text-center">
                                    {item.qty} Un
                                  </span>
                                  <button
                                    onClick={() => onUpdateQty(item.id, item.qty + 1)}
                                    className="w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                                    title="Aumentar Estoque"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <span className="font-mono font-semibold text-slate-700 px-2 min-w-[50px] inline-block text-center">
                                  {item.qty} Un
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-slate-600">
                              {formatBRL(item.unitCost)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-indigo-650 font-semibold">
                              {item.gramCost ? `R$ ${item.gramCost.toFixed(3)}/g` : '--'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${getStatusStyle(item.status)}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              {item.purchaseLink ? (
                                <button
                                  onClick={() => {
                                    setPurchasingItem(item);
                                    setPurchaseQty(1);
                                    setPurchaseNotes('');
                                  }}
                                  className="inline-flex p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded cursor-pointer"
                                  title="Adicionar à lista de compras e ver link"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              {canManage ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setEditingItem(item);
                                      setEditName(item.material);
                                      setEditCategory(item.category || 'Filamento');
                                      setEditQty(item.qty);
                                      setEditUnitCost(item.unitCost);
                                      setEditLink(item.purchaseLink || '');
                                      setEditImg(item.image || '');
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50 transition cursor-pointer"
                                    title="Editar Insumo"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Deseja realmente remover o material "${item.material}" do inventário?`)) {
                                        onDeleteInventoryItem(item.id);
                                      }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                                    title="Remover Insumo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span 
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold" 
                                  title={`Insumo cadastrado por ${creatorInfo.user}. Edição e exclusão restritas.`}
                                >
                                  <Lock className="w-3 h-3 text-slate-400" />
                                  {creatorInfo.user} (Fixo)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-sm">Nenhum estoque ou insumo cadastrado para esta categoria.</p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* DETAILED PHOTO EXPAND OVERLAY (ZOOM DIALOG) */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl animate-scale-up">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 hover:scale-105 rounded-full text-white cursor-pointer duration-100 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-1">
              <img
                src={zoomImage}
                alt="Zoom view"
                className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="py-3 px-6 bg-slate-900 border-t border-slate-800 text-center text-xs text-slate-400 font-mono">
              Visualizador de Matéria Prisma Integrado — GeorgeFctech-3D
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL OVERLAY */}
      {editingItem && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-850 text-md flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-500" />
                Editar Insumo: {editingItem.id}
              </h3>
              <button onClick={() => setEditingItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Categoria do Insumo</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white font-semibold"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Especificação do Insumo</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Qtd em Estoque</label>
                  <input
                    type="number"
                    min="0"
                    value={editQty}
                    onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Preço Unitário (R$)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editUnitCost}
                    onChange={(e) => setEditUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Link de Compra</label>
                <input
                  type="url"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  placeholder="Se houver, ex: https://www.mercadolivre.com.br/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">URL / Link da Imagem</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Globe className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="url"
                    value={editImg}
                    onChange={(e) => setEditImg(e.target.value)}
                    className="w-full text-sm px-3 pl-9 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                    placeholder="https://exemplo.com/foto.jpg"
                  />
                </div>
                {editImg && (
                  <div className="mt-2 flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                    <img
                      src={editImg}
                      alt="Preview"
                      className="w-8 h-8 object-cover rounded border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[11px] text-slate-600 truncate">Preview da Imagem Atual</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Ou Substituir por Upload / Arquivo</label>
                <label className="border border-dashed border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center justify-center gap-3 cursor-pointer text-xs font-semibold text-slate-600 hover:bg-slate-100">
                  <Upload className="w-4 h-4 text-slate-400" />
                  Substituir Imagem Real
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, true)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE CAMERA SCAN DRAWER / DIALOG COVER */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col font-sans animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 px-1.5 bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 rounded-md">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Escaneador de Insumos</h3>
                  <p className="text-[10px] text-slate-400">Posicione o QR Code ou digite o código de barras</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsScanning(false);
                  setScannedCode('');
                  setManualCode('');
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 flex-1 space-y-4 overflow-y-auto max-h-[70vh]">
              
              {/* Camera Viewport Area */}
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <div id="scanner-viewport" className="absolute inset-0 w-full h-full object-cover"></div>
                
                {/* Visual Camera Retro Crosshair overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10 border border-slate-900/10">
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-t-2 border-l-2 border-indigo-500"></div>
                    <div className="w-6 h-6 border-t-2 border-r-2 border-indigo-500"></div>
                  </div>
                  
                  {/* Glowing dynamic horizontal scanner bar */}
                  <div className="h-0.5 bg-indigo-500 opacity-60 w-3/4 mx-auto animate-pulse shadow-[0_0_10px_#5f5af6]"></div>
                  
                  <div className="flex justify-between">
                    <div className="w-6 h-6 border-b-2 border-l-2 border-indigo-500"></div>
                    <div className="w-6 h-6 border-b-2 border-r-2 border-indigo-500"></div>
                  </div>
                </div>

                {!scannedCode && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-[10px] font-mono text-center text-indigo-300 font-bold tracking-widest uppercase border border-indigo-500/20 z-10">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping mr-1.5"></span>
                    Câmera Ativa
                  </div>
                )}
              </div>

              {/* Feedback messages */}
              {scanSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  {scanSuccessMsg}
                </div>
              )}

              {/* Manual Input or Scanned Code Input Option */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Digitação Manual ou Leitor de Pistola USB
                </label>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (manualCode.trim()) {
                      handleCodeDetected(manualCode.trim());
                      setScannedCode(manualCode.trim());
                    }
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ex: 7891000300105 ou INV-001..."
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 border border-slate-200 bg-white rounded-lg font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase rounded-lg tracking-wider"
                  >
                    Buscar
                  </button>
                </form>
              </div>

              {/* Result Panel (if code scanned/detected) */}
              {scannedCode && (() => {
                const matchedItem = inventory.find(item => item.id.toUpperCase() === scannedCode.toUpperCase());
                
                return (
                  <div className="border border-indigo-100 rounded-xl overflow-hidden p-4 bg-indigo-50/30 space-y-3">
                    <div className="text-[10px] uppercase font-mono font-bold text-slate-400">Resultado da Consulta</div>
                    
                    {matchedItem ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded border border-slate-200 overflow-hidden bg-white shrink-0">
                            {matchedItem.image ? (
                              <img src={matchedItem.image} alt={matchedItem.material} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center font-bold text-xs bg-indigo-50 text-indigo-600">3D</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-slate-900 truncate leading-snug">{matchedItem.material}</h4>
                            <p className="text-[10px] font-mono text-slate-500">Código/ID: {matchedItem.id}</p>
                            <span className="text-[10px] font-bold font-mono text-indigo-600 mt-0.5 inline-block">R$ {matchedItem.gramCost?.toFixed(3)}/g</span>
                          </div>
                        </div>

                        {/* Inventory Quick Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-indigo-50 bg-white p-3 rounded-lg border border-indigo-100/50">
                          <div>
                            <span className="text-[9px] uppercase font-mono font-bold text-slate-400 block mb-0.5">Qtd Atual</span>
                            <span className="text-sm font-bold text-slate-800 font-mono">{matchedItem.qty} Rolos</span>
                          </div>
                          
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateQty(matchedItem.id, Math.max(0, matchedItem.qty - 1));
                              }}
                              className="w-10 h-10 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-750 font-bold flex items-center justify-center transition border border-rose-150 shadow-xs cursor-pointer text-sm"
                              title="Subtrair 1 rolo"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateQty(matchedItem.id, matchedItem.qty + 1);
                              }}
                              className="w-10 h-10 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center transition border border-emerald-150 shadow-xs cursor-pointer text-sm"
                              title="Adicionar 1 rolo"
                            >
                              +1
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Nenhum filamento encontrado com o código <strong className="font-mono text-slate-800">"{scannedCode}"</strong> em sua conta.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomBarcodeId(scannedCode);
                            setIsScanning(false);
                            setScannedCode('');
                            setManualCode('');
                            // Scroll to form smoothly
                            setTimeout(() => {
                              const inputEl = document.querySelector('input[placeholder*="PETG Creality"]');
                              if (inputEl) {
                                (inputEl as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                                (inputEl as HTMLInputElement).focus();
                              }
                            }, 300);
                          }}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Cadastrar como Novo Insumo
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsScanning(false);
                  setScannedCode('');
                  setManualCode('');
                }}
                className="px-5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                Concluir / Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ADD TO SHOPPING LIST / PURCHASE DIALOG */}
      {purchasingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-850 overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-55 dark:bg-slate-905">
              <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-2 uppercase tracking-wide">
                <Plus className="w-4 h-4 text-indigo-500" />
                Planejar Compra de Insumo
              </h3>
              <button 
                onClick={() => setPurchasingItem(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/40 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block font-mono">Produto Identificado</span>
                <h4 className="font-bold text-slate-900 dark:text-slate-150 text-sm leading-snug">{purchasingItem.material}</h4>
                <div className="flex justify-between items-center text-xs font-mono pt-1 text-slate-500 dark:text-slate-400">
                  <span>Custo Unitário Estimado:</span>
                  <span className="font-bold text-slate-850 dark:text-slate-205">{formatBRL(purchasingItem.unitCost)}</span>
                </div>
              </div>

              {/* Quantity input with custom design */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-450 uppercase tracking-wider">Quantidade Necessária</label>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Quantos rolos deseja pedir?</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPurchaseQty(prev => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-250 font-bold hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center transition cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono font-bold text-base text-slate-800 dark:text-slate-150 w-8 text-center">
                      {purchaseQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPurchaseQty(prev => prev + 1)}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-250 font-bold hover:bg-slate-100 dark:hover:bg-slate-850 flex items-center justify-center transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Total projection */}
              <div className="flex justify-between items-center bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-900/30 p-3 rounded-xl text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Investimento Estimado Total:</span>
                <strong className="font-mono font-extrabold text-sm text-emerald-650 dark:text-emerald-400">
                  {formatBRL(purchasingItem.unitCost * purchaseQty)}
                </strong>
              </div>

              {/* Optional notes */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-450 uppercase tracking-wider">Observações do Pedido (Opcional)</label>
                <textarea
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  placeholder="Ex: Pedido urgente, reposição de estoque crítico..."
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-205 bg-white dark:bg-slate-950 focus:outline-none focus:border-indigo-500 h-16 resize-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-905 border-t border-slate-100 dark:border-slate-850 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setPurchasingItem(null)}
                className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddToShopping}
                className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Confirmar & Ir para Loja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
