/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  HelpCircle, 
  Layers, 
  Coins, 
  Briefcase, 
  Clock, 
  Weight, 
  Calculator,
  MessageSquare,
  AlertCircle,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { InventoryItem, ProjectOrder } from '../types';

interface RegistrationFormProps {
  inventory: InventoryItem[];
  defaultHourlyRate: number;
  defaultMaterialRate: number;
  defaultProfitMargin: number;
  onAddProject: (project: Omit<ProjectOrder, 'id'>) => void;
  onNavigateToDashboard: () => void;
}

export default function RegistrationForm({
  inventory,
  defaultHourlyRate,
  defaultMaterialRate,
  defaultProfitMargin,
  onAddProject,
  onNavigateToDashboard
}: RegistrationFormProps) {
  // Form input states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [client, setClient] = useState('');
  const [name, setName] = useState('');
  const [hours, setHours] = useState('6.4');
  const [weight, setWeight] = useState('61.17');
  const [materialType, setMaterialType] = useState('PETG CF10');
  const [hourlyRate, setHourlyRate] = useState(String(defaultHourlyRate));
  const [materialRate, setMaterialRate] = useState(String(defaultMaterialRate));
  const [profitMargin, setProfitMargin] = useState(String(defaultProfitMargin));
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [uploadedBase64, setUploadedBase64] = useState('');

  const printPresets = [
    { name: 'Engrenagem', url: 'https://images.unsplash.com/photo-1581092334247-44dfa8c569ca?w=400&q=80' },
    { name: 'Peça Mecânica', url: 'https://images.unsplash.com/photo-1615840287214-7fe58a8b668f?w=400&q=80' },
    { name: 'Gabarito Técnico', url: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=400&q=80' }
  ];

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.2 * 1024 * 1024) {
      alert('A imagem é muito grande. Escolha uma foto menor do que 1.2MB para poupar armazenamento.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedBase64(event.target?.result as string);
      setImage(''); // clear preset
    };
    reader.readAsDataURL(file);
  };
  
  // Validation state
  const [errorMsgs, setErrorMsgs] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  // Synchronize filament cost when material selection changes
  useEffect(() => {
    // Try to auto-resolve gram cost from inventory
    const matched = inventory.find(i => i.material.toLowerCase().includes(materialType.toLowerCase()) || materialType.toLowerCase().includes(i.material.toLowerCase()));
    if (matched) {
      // Suggest gram cost + standard 50% technical markup for premium overheads
      const recommendedRate = parseFloat((matched.gramCost * 1.5).toFixed(2));
      setMaterialRate(String(recommendedRate));
    }
  }, [materialType, inventory]);

  // Pricing helper math
  const hrsNum = parseFloat(hours) || 0;
  const wgtNum = parseFloat(weight) || 0;
  const rateHrsNum = parseFloat(hourlyRate) || 0;
  const rateMatNum = parseFloat(materialRate) || 0;
  const marginNum = parseFloat(profitMargin) || 0;

  const costHours = hrsNum * rateHrsNum;
  const costMaterial = wgtNum * rateMatNum;
  const finalPrice = costHours + costMaterial + marginNum;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const currErrors: string[] = [];
    
    if (!name.trim()) currErrors.push('Por favor, defina um nome profissional para o projeto/modelo.');
    if (!client.trim()) currErrors.push('Informe o setor solicitante ou cliente final.');
    if (hrsNum <= 0) currErrors.push('O tempo estimado em horas deve ser maior do que zero.');
    if (wgtNum <= 0) currErrors.push('O peso em gramas do filamento deve ser maior do que zero.');
    
    if (currErrors.length > 0) {
      setErrorMsgs(currErrors);
      setSuccess(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    onAddProject({
      date,
      client: client.trim(),
      name: name.trim(),
      hours: hrsNum,
      weight: wgtNum,
      materialType,
      hourlyRate: rateHrsNum,
      materialRate: rateMatNum,
      profitMargin: marginNum,
      description: description.trim() || 'Serviço sob demanda técnica concluído sem observações.',
      status: 'concluido',
      image: uploadedBase64 || image || 'https://images.unsplash.com/photo-1581092334247-44dfa8c569ca?w=400&q=80'
    });

    setSuccess(true);
    setErrorMsgs([]);
    
    // Clear major form entries
    setName('');
    setDescription('');
    
    // Smooth scroll and redirect after delay
    setTimeout(() => {
      onNavigateToDashboard();
    }, 1500);
  };

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="font-sans antialiased max-w-5xl">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-950 mb-1">
            Registro de Nova Ordem de Produção
          </h1>
          <p className="text-sm text-slate-500">
            Determine o preço correto somando infraestrutura de energia, desgaste de bico e engenharia de fatiamento.
          </p>
        </div>
      </div>

      {success && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2 text-sm shadow-sm"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          Ordem técnica registrada com sucesso! Sincronizando com o faturamento comercial...
        </motion.div>
      )}

      {errorMsgs.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm space-y-1 shadow-sm">
          <div className="font-bold flex items-center gap-1.5 mb-1 text-rose-800">
            <AlertCircle className="w-4 h-4" />
            Não foi possível computar a ordem:
          </div>
          {errorMsgs.map((err, i) => (
            <p key={i}>• {err}</p>
          ))}
        </div>
      )}

      {/* FORM AND BREAKDOWN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM */}
        <div className="lg:col-span-2 p-8 rounded-xl border border-slate-200 bg-white shadow-sm">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Data do Serviço
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Solicitante / Setor / Cliente
                </label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="Ex: Manutenção Preventiva / João Silva"
                  className="px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder-slate-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Nome do Projeto / Modelo 3D
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Adaptador de Conector Rápido Mecânico"
                className="px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  Tempo Slicer (h)
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Tempo total impresso fornecido pelo fatiador" />
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  Peso Final (g)
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Consumo estimado ou peso final pesado em balança" />
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Material de Impressão
                </label>
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                >
                  <option value="PETG CF10">PETG Fibra Carbono CF10</option>
                  <option value="PLA Premium">PLA Premium Plus</option>
                  <option value="PETG Standard">PETG Standard</option>
                  <option value="ABS Alta Performance">ABS Alta Performance</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                Custos Customizados e Técnicos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Sua Hora Técnica (R$/h)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Custo do Grama (R$/g)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={materialRate}
                    onChange={(e) => setMaterialRate(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase text-slate-500">
                    Preço Margem/Risco (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(e.target.value)}
                    className="px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* PHOTO ATTACHMENT SECTION */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Foto Real da Peça Impressa
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload camera file */}
                <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center cursor-pointer transition select-none">
                  {uploadedBase64 ? (
                    <div className="flex items-center gap-2.5">
                      <img
                        src={uploadedBase64}
                        alt="Peça Impressa real"
                        className="w-12 h-12 object-cover rounded border border-slate-300"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-xs font-semibold text-indigo-700">Foto Carregada com Sucesso</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs font-semibold text-slate-600">Subir foto do Celular ou Arquivo</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Captura real da mesa da impressora</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>

                {/* Preset defaults standard models */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-mono text-slate-400 mb-2 block font-bold">Ou escolha uma foto de demonstração:</span>
                  <div className="flex flex-wrap gap-2">
                    {printPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImage(preset.url);
                          setUploadedBase64(''); // clear file upload
                        }}
                        className={`px-2.5 py-1.5 rounded text-[11px] font-bold border transition ${
                          image === preset.url 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Ex primeiramente: Peça mecanicamente carregada, impressa com bico super temperado e fluxo calibrado..."
                className="px-4 py-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder-slate-400 text-sm"
              />
            </div>

            <div className="pt-4 flex gap-4">
              <button
                type="submit"
                id="btn-register-submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm tracking-wide rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                COMPUTAR E SALVAR ORDEM
              </button>
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="px-6 py-3 border border-slate-200 text-slate-600 font-semibold text-sm bg-slate-50 rounded-lg hover:bg-slate-100 transition-all duration-200"
              >
                CANCELAR
              </button>
            </div>
          </form>
        </div>

        {/* PRICING BREAKDOWN CARD */}
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Calculator className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Demonstrativo de Orçamento
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Operação Técnica ({hrsNum.toFixed(1)}h)
                </span>
                <span className="font-mono text-slate-800 font-semibold">
                  {formatBRL(costHours)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500 flex items-center gap-2">
                  <Weight className="w-3.5 h-3.5 text-slate-400" />
                  Consumo Matéria-Prima ({wgtNum.toFixed(2)}g)
                </span>
                <span className="font-mono text-slate-800 font-semibold">
                  {formatBRL(costMaterial)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-100 text-sm">
                <span className="text-slate-500 flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5 text-slate-400" />
                  Taxa Risco / Setup
                </span>
                <span className="font-mono text-slate-800 font-semibold">
                  {formatBRL(marginNum)}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-indigo-50/75 border border-indigo-100 text-center mt-6">
                <span className="text-xs text-indigo-650 font-bold tracking-wider uppercase">
                  VALOR DE COBRANÇA RECOMENDADO
                </span>
                <h2 className="text-3xl font-mono font-bold text-slate-900 mt-1">
                  {formatBRL(finalPrice)}
                </h2>
              </div>
            </div>
          </div>

          {/* SLA CHECKS */}
          <div className="p-6 rounded-xl border border-slate-100 bg-slate-50 text-xs text-slate-500 space-y-3 shadow-sm">
            <h4 className="font-bold text-slate-700 uppercase tracking-widest text-[10px] pb-2 border-b border-slate-200/60 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
              SLA DE MANUFATURA ADITIVA
            </h4>
            <p>• <strong>Consumo g</strong>: Inclui suportes gerados pelo algoritmo e as camadas finais.</p>
            <p>• <strong>Energia / Desgaste</strong>: Custos embutidos na hora-máquina, amortizando o desgaste mecânico e térmico.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
