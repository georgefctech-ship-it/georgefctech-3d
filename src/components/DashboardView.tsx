/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Clock, 
  Weight, 
  Layers, 
  Trash2, 
  Search, 
  Calendar,
  Layers2,
  SlidersHorizontal,
  Plus,
  X
} from 'lucide-react';
import { ProjectOrder } from '../types';

interface DashboardViewProps {
  projects: ProjectOrder[];
  onDeleteProject: (id: string) => void;
  onNavigateToRegister: () => void;
}

export default function DashboardView({ 
  projects, 
  onDeleteProject, 
  onNavigateToRegister 
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('Todos');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Math helper
  const calculateEarnings = (p: ProjectOrder) => {
    return (p.hours * p.hourlyRate) + (p.weight * p.materialRate) + p.profitMargin;
  };

  // Get totals of current scope
  const totalEarnings = projects.reduce((sum, p) => sum + calculateEarnings(p), 0);
  const totalHours = projects.reduce((sum, p) => sum + p.hours, 0);
  const totalWeight = projects.reduce((sum, p) => sum + p.weight, 0);
  const totalCount = projects.length;

  // Filter logic
  const materials = ['Todos', ...Array.from(new Set(projects.map(p => p.materialType)))];
  
  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMaterial = selectedMaterial === 'Todos' || p.materialType === selectedMaterial;
    return matchesSearch && matchesMaterial;
  });

  // Currency Formatter
  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const statCards = [
    {
      id: 'stat-earnings',
      label: 'Faturamento Líquido Est.',
      value: formatBRL(totalEarnings),
      icon: TrendingUp,
      color: 'border-emerald-200 text-emerald-600 bg-emerald-50',
      glow: 'shadow-[0_2px_12px_rgba(16,185,129,0.04)]'
    },
    {
      id: 'stat-hours',
      label: 'Horas Alocadas de Trabalho',
      value: `${totalHours.toFixed(1)} h`,
      icon: Clock,
      color: 'border-indigo-200 text-indigo-600 bg-indigo-50',
      glow: 'shadow-[0_2px_12px_rgba(79,70,229,0.04)]'
    },
    {
      id: 'stat-weight',
      label: 'Volume de Polímeros',
      value: `${totalWeight.toFixed(2)} g`,
      icon: Weight,
      color: 'border-amber-200 text-amber-600 bg-amber-50',
      glow: 'shadow-[0_2px_12px_rgba(245,158,11,0.04)]'
    },
    {
      id: 'stat-count',
      label: 'Ordens Processadas',
      value: totalCount,
      icon: Layers,
      color: 'border-blue-200 text-blue-600 bg-blue-50',
      glow: 'shadow-[0_2px_12px_rgba(59,130,246,0.04)]'
    }
  ];

  return (
    <div className="font-sans antialiased">
      {/* TITLE CONTAINER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-950 mb-1">
            Faturamento e Escopo Comercial
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Métricas financeiras calculadas com base em custos reais de insumos técnicos, margens operacionais e valorização do seu trabalho técnico.
          </p>
        </div>
        <button
          onClick={onNavigateToRegister}
          className="mt-4 md:mt-0 flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm tracking-wide shadow-sm hover:shadow-md transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          REGISTRAR SERVIÇO
        </button>
      </div>

      {/* METRIC CARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`p-6 rounded-xl border border-slate-200 bg-white flex flex-col justify-between hover:border-slate-300 transition-all duration-200 ${card.glow}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  {card.label}
                </span>
                <span className={`p-2 rounded-lg border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2">
                <h3 className="text-2xl font-mono font-bold text-slate-800 tracking-tight">
                  {card.value}
                </h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CONTROL ACTIONS FOR LIST */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white mb-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
            <h3 className="text-md font-bold font-display text-slate-800">
              Histórico de Projetos e Peças Entregues
            </h3>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nome, cliente..."
                className="w-full md:w-64 pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
            
            {/* Filter Dropdown */}
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            >
              {materials.map(mat => (
                <option key={mat} value={mat}>{mat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* PROJECTS DATA TABLE */}
        <div className="overflow-x-auto">
          {filteredProjects.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Projeto / Cliente</th>
                  <th className="py-3 px-4">Material</th>
                  <th className="py-3 px-4 text-center">Métricas Slicer</th>
                  <th className="py-3 px-4 text-right">Valor Final</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProjects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 text-sm transition-colors duration-150">
                    <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(p.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div 
                          onClick={() => p.image && setZoomImage(p.image)}
                          className="w-10 h-10 rounded border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100 cursor-pointer hover:scale-105 duration-150 shadow-xs"
                          title="Clique para ampliar"
                        >
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover animate-fade-in"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-50 text-slate-400 text-[10px] font-mono font-bold flex items-center justify-center">3D</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate max-w-[280px]" title={p.name}>{p.name}</div>
                          <div className="text-xs text-slate-500 mt-1">{p.client}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                        <Layers2 className="w-3 h-3" />
                        {p.materialType}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-center font-mono text-xs text-slate-600">
                      <div className="font-semibold">{p.hours.toFixed(1)} h</div>
                      <div className="text-[10px] text-slate-400">{p.weight.toFixed(2)} g</div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-right font-mono font-bold text-emerald-600">
                      {formatBRL(calculateEarnings(p))}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => {
                          if (confirm('Deseja realmente remover este registro comercial do faturamento?')) {
                            onDeleteProject(p.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Remover Registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">Nenhum serviço ou peça técnica encontrado para os termos filtrados.</p>
              {projects.length === 0 && (
                <button
                  onClick={onNavigateToRegister}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-650 border border-indigo-200 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-all"
                >
                  Criar Primeiro Serviço
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ZOOM IMAGE OVERLAY DIALOG */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl animate-scale-up">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/99 hover:scale-105 rounded-full text-white cursor-pointer duration-100 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-1 animate-fade-in">
              <img
                src={zoomImage}
                alt="Peça Impressa ampliada"
                className="w-full h-auto max-h-[75vh] object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
