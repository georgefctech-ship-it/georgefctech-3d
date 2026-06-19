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
  Image,
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
  Sparkles
} from 'lucide-react';
import { InventoryItem } from '../types';
import { Html5Qrcode } from 'html5-qrcode';

interface InventoryViewProps {
  inventory: InventoryItem[];
  onAddInventoryItem: (item: Omit<InventoryItem, 'id' | 'gramCost' | 'status'> & { id?: string; image?: string; purchaseLink?: string }) => void;
  onDeleteInventoryItem: (id: string) => void;
  onUpdateQty: (id: string, newQty: number) => void;
  onEditInventoryItem?: (id: string, updatedFields: Partial<InventoryItem>) => void;
}

export default function InventoryView({
  inventory,
  onAddInventoryItem,
  onDeleteInventoryItem,
  onUpdateQty,
  onEditInventoryItem
}: InventoryViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Add item state
  const [materialName, setMaterialName] = useState('');
  const [qty, setQty] = useState('1');
  const [unitCost, setUnitCost] = useState('150.00');
  const [purchaseLink, setPurchaseLink] = useState('');
  const [imgUrl, setImgUrl] = useState('');
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
  const [editQty, setEditQty] = useState(0);
  const [editUnitCost, setEditUnitCost] = useState(0);
  const [editLink, setEditLink] = useState('');
  const [editImg, setEditImg] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

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
      setErrorMsg('Informe as especificações do filamento (ex: PETG CF10 Premium 1kg).');
      return;
    }

    const qtyNum = parseInt(qty) || 0;
    const costNum = parseFloat(unitCost) || 0;

    if (qtyNum < 0) {
      setErrorMsg('A quantidade em rolos deve ser igual ou superior a zero.');
      return;
    }

    if (costNum <= 0) {
      setErrorMsg('O preço pago por rolo deve ser superior a zero.');
      return;
    }

    const finalImage = uploadedBase64 || imgUrl || 'https://images.unsplash.com/photo-1612815154858-60aa4c59eae6?w=300&q=80';

    onAddInventoryItem({
      id: customBarcodeId.trim() ? customBarcodeId.trim() : undefined,
      material: materialName.trim(),
      qty: qtyNum,
      unitCost: costNum,
      image: finalImage,
      purchaseLink: purchaseLink.trim()
    });

    // Reset Form
    setMaterialName('');
    setQty('1');
    setUnitCost('150.00');
    setPurchaseLink('');
    setImgUrl('');
    setUploadedBase64('');
    setCustomBarcodeId('');
    setSuccess(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    if (onEditInventoryItem) {
      onEditInventoryItem(editingItem.id, {
        material: editName,
        qty: editQty,
        unitCost: editUnitCost,
        purchaseLink: editLink,
        image: editImg
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

        {/* VIEW MODE TOGGLER */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg self-start mt-4 md:mt-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition duration-150 ${
              viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Ver Galeria
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition duration-150 ${
              viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Ver Tabela
          </button>
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
          Filamento cadastrado com sucesso com fotos e link de compra!
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
                Cadastrar Novo Filamento
              </h3>
            </div>

            <form onSubmit={handleAdditem} className="space-y-4">
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
                  Nome do Insumo / Fabricante / Tipo *
                </label>
                <input
                  type="text"
                  required
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  placeholder="Ex: PETG Creality Preto 1kg"
                  className="px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white placeholder-slate-400 transition-all font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Rolos em Estoque
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
                    Preço por Rolo (R$)
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

              {/* FILAMENT PHOTO UPLOADER */}
              <div className="flex flex-col gap-2.5 pt-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Foto do Filamento
                </label>
                
                {/* PRESETS SLIDER */}
                <div>
                  <div className="text-[10px] uppercase font-mono text-slate-400 mb-1.5">Escolher Presets de Cores:</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {presetColors.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handlePresetSelect(preset.url)}
                        title={preset.name}
                        className={`h-7 px-2.5 rounded text-[11px] font-semibold border flex items-center gap-1.5 transition ${
                          imgUrl === preset.url 
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

                <div className="text-center py-1">
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
                      <span className="text-xs text-indigo-600 font-semibold truncate max-w-[120px]">Imagem Real Pronta</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-[11px] font-semibold text-slate-600">Procurar ou arrastar imagem</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e)}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
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
              O software de precificação GeorgeFctech usará o valor por rolo de 1kg para encontrar de forma precisa a taxa por grama de cada material.
            </p>
          </div>
        </div>

        {/* RIGHT COMPONENT: GALLERIES AND DETAILS */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-slate-100">
            <Database className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Insumos Disponíveis para Faturamento ({inventory.length})
            </h3>
          </div>

          {viewMode === 'grid' ? (
            /* GRID COMPONET LAYOUT */
            inventory.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {inventory.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition duration-200 flex flex-col bg-white">
                    {/* Filament spool representation */}
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

                      <div className="absolute top-3 right-3">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${getStatusStyle(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Meta info body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug tracking-tight truncate-2-lines">{item.material}</h4>
                        
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 block">Estoque</span>
                            <span className="font-bold text-slate-800 text-sm">{item.qty} Rolos</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 block">Custo por Rolo</span>
                            <span className="font-semibold text-slate-800 text-sm">{formatBRL(item.unitCost)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 block">Custo por Grama</span>
                            <span className="font-bold font-mono text-indigo-600 text-sm">R$ {item.gramCost?.toFixed(3)}/g</span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 block">Tipo Insumo</span>
                            <span className="font-semibold text-slate-500 font-mono">1.000g Rolo</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        {item.purchaseLink ? (
                          <a
                            href={item.purchaseLink}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            rel="noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Link de Compra
                          </a>
                        ) : (
                          <span className="flex-1 text-[11px] text-slate-400 italic text-center py-2">Sem Link Cadastrado</span>
                        )}

                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-100"
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
                            className="p-2 text-slate-400 hover:text-rose-605 hover:bg-rose-50 rounded-lg border border-slate-100"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Database className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Nenhum filamento comercial cadastrado em sua conta.</p>
              </div>
            )
          ) : (
            /* STANDARD DATA TABLE LAYOUT */
            <div className="overflow-x-auto">
              {inventory.length > 0 ? (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                      <th className="py-3 px-4">Foto/Nome</th>
                      <th className="py-3 px-4 text-center">Volume Estoque</th>
                      <th className="py-3 px-4 text-right">Rolo unitário</th>
                      <th className="py-3 px-4 text-right">Custo por Grama</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Mercado Livre</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {inventory.map((item) => (
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
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => onUpdateQty(item.id, Math.max(0, item.qty - 1))}
                              className="w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
                            >
                              -
                            </button>
                            <span className="font-mono font-semibold text-slate-700 px-2 min-w-[50px] inline-block text-center">
                              {item.qty} Rolos
                            </span>
                            <button
                              onClick={() => onUpdateQty(item.id, item.qty + 1)}
                              className="w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
                            >
                              +
                            </button>
                          </div>
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
                            <a
                              href={item.purchaseLink}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              rel="noreferrer"
                              className="inline-flex p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-indigo-50"
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
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                              title="Remover Material"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400 text-sm">Nenhum estoque ou filamento cadastrado.</p>
                </div>
              )}
            </div>
          )}
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
                Editar Filamento: {editingItem.id}
              </h3>
              <button onClick={() => setEditingItem(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Especificação do Filamento</label>
                <input
                  type="text"
                  defaultValue={editingItem.material}
                  value={editName === '' && editName !== editingItem.material ? (setEditName(editingItem.material), editingItem.material) : editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Rolos em Estoque</label>
                  <input
                    type="number"
                    min="0"
                    value={editQty === 0 && editingItem.qty !== editQty ? (setEditQty(editingItem.qty), editingItem.qty) : editQty}
                    onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Preço por Rolo (R$)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editUnitCost === 0 ? (setEditUnitCost(editingItem.unitCost), editingItem.unitCost) : editUnitCost}
                    onChange={(e) => setEditUnitCost(parseFloat(e.target.value) || 0)}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Link de Compra</label>
                <input
                  type="url"
                  value={editLink === '' && editingItem.purchaseLink ? (setEditLink(editingItem.purchaseLink), editingItem.purchaseLink) : editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg text-slate-800 bg-white"
                  placeholder="Se houver, ex: https://www.mercadolivre.com.br/..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Atualizar Foto (Upload / File)</label>
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
                              const inputEl = document.querySelector('input[placeholder="Ex: PETG Creality Preto 1kg"]');
                              if (inputEl) {
                                inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }, 300);
                          }}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Cadastrar como Novo Filamento
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
    </div>
  );
}
