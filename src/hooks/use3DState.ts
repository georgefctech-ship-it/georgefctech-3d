/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { ProjectOrder, InventoryItem, ShoppingItem, SettingsConfig } from '../types';
import { getSupabaseClient, hasSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEYS = {
  PROJECTS: 'g3d_projects',
  INVENTORY: 'g3d_inventory',
  SHOPPING: 'g3d_shopping_v2', // Nova versão da chave de compras
  SETTINGS: 'g3d_settings'
};

const DEFAULT_PROJECTS: ProjectOrder[] = [
  {
    id: 'PRJ-2026-001',
    date: '2026-06-17',
    client: 'Manutenção Preventiva',
    name: 'Lote de Protetores de Conectores Rápidos (64 unidades)',
    hours: 6.4,
    weight: 61.17,
    materialType: 'PETG CF10',
    hourlyRate: 50.00,
    materialRate: 0.21,
    profitMargin: 15.00,
    description: 'Modelagem e fatiamento técnico otimizado para produção em massa de travas de segurança mecânica, prevenindo desconexão indesejada por vibração.',
    status: 'concluido',
    image: 'https://images.unsplash.com/photo-1581092334247-44dfa8c569ca?w=400&q=80'
  },
  {
    id: 'PRJ-2026-002',
    date: '2026-06-15',
    client: 'Almoxarifado Geral',
    name: 'Engrenagem Bi-Material de Redução de Torque',
    hours: 4.2,
    weight: 48.50,
    materialType: 'ABS Alta Performance',
    hourlyRate: 60.00,
    materialRate: 0.18,
    profitMargin: 25.00,
    description: 'Engrenagem helicoidal desenvolvida para absorver impacto operacional em redutoras. Tolerâncias mecânicas ajustadas para alta rotação.',
    status: 'concluido',
    image: 'https://images.unsplash.com/photo-1615840287214-7fe58a8b668f?w=400&q=80'
  },
  {
    id: 'PRJ-2026-003',
    date: '2026-06-10',
    client: 'Engenharia de Campo',
    name: 'Gabarito de Alinhamento Sensor Óptico',
    hours: 3.5,
    weight: 28.10,
    materialType: 'PLA Premium Plus',
    hourlyRate: 50.00,
    materialRate: 0.14,
    profitMargin: 10.00,
    description: 'Dispositivo temporário para fixação e calibração fina de sensores na esteira transportadora.',
    status: 'concluido',
    image: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=400&q=80'
  }
];

const DEFAULT_INVENTORY: InventoryItem[] = [
  {
    id: 'INV-001',
    material: 'PETG Fibra de Carbono CF10 1kg',
    qty: 2,
    unitCost: 210.00,
    gramCost: 0.21,
    status: 'Em Estoque',
    image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&q=80',
    purchaseLink: 'https://www.mercadolivre.com.br/filamento-creality-petg-1-kg-175-mm-para-impresso-3d-em-cor-preta/p/MLB51382966'
  },
  {
    id: 'INV-002',
    material: 'PLA Premium Plus 1kg',
    qty: 3,
    unitCost: 140.00,
    gramCost: 0.14,
    status: 'Em Estoque',
    image: 'https://images.unsplash.com/photo-1615840287214-7fe58a8b668f?w=300&q=80',
    purchaseLink: 'https://www.mercadolivre.com.br/filamento-creality-petg-1-kg-175-mm-para-impresso-3d-em-cor-preta/p/MLB51382966'
  },
  {
    id: 'INV-003',
    material: 'ABS Alta Performance 1kg',
    qty: 1,
    unitCost: 180.00,
    gramCost: 0.18,
    status: 'Poucas Unidades',
    image: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=300&q=80',
    purchaseLink: 'https://www.mercadolivre.com.br/filamento-creality-petg-1-kg-175-mm-para-impresso-3d-em-cor-preta/p/MLB51382966'
  },
  {
    id: 'INV-004',
    material: 'PETG Standard 1kg',
    qty: 0,
    unitCost: 130.00,
    gramCost: 0.13,
    status: 'Esgotado',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300&q=80',
    purchaseLink: 'https://www.mercadolivre.com.br/filamento-creality-petg-1-kg-175-mm-para-impresso-3d-em-cor-preta/p/MLB51382966'
  }
];

const DEFAULT_SHOPPING: ShoppingItem[] = [
  {
    id: 'SHOP-001',
    materialName: 'Filamento Creality PETG 1kg Preto/Preto 1.75mm',
    qtyNeeded: 2,
    estUnitCost: 119.90,
    purchaseLink: 'https://www.mercadolivre.com.br/filamento-creality-petg-1-kg-175-mm-para-impresso-3d-em-cor-preta/p/MLB51382966?product_trigger_id=MLB50257710&picker=true&quantity=1',
    category: 'Filamento',
    notes: 'Insumo de reposição rápida para prototipagem de adaptadores mecânicos',
    checked: false
  },
  {
    id: 'SHOP-002',
    materialName: 'Jogo de Bicos de Latão Extrusor Premium 0.4mm (M6)',
    qtyNeeded: 1,
    estUnitCost: 45.00,
    purchaseLink: 'https://www.mercadolivre.com.br/',
    category: 'Peças de Reposição',
    notes: 'Manutenção preventiva nas cabeças de extrusão Creality',
    checked: false
  },
  {
    id: 'SHOP-003',
    materialName: 'Álcool Isopropílico 99.8% 1 Litro',
    qtyNeeded: 1,
    estUnitCost: 35.00,
    purchaseLink: 'https://www.mercadolivre.com.br/',
    category: 'Acessórios/Insumos',
    notes: 'Limpeza e desengorduramento técnico das mesas de PEI texturizadas',
    checked: true
  }
];

const DEFAULT_SETTINGS: SettingsConfig = {
  defaultHourlyRate: 50.00,
  defaultMaterialRate: 0.35,
  defaultProfitMargin: 15.00
};

export function use3DState() {
  const [projects, setProjects] = useState<ProjectOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [settings, setSettings] = useState<SettingsConfig>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseErrorMsg, setSupabaseErrorMsg] = useState<string | null>(null);

  // Helper functions to map snake_case to camelCase
  const mapDbProject = (db: any): ProjectOrder => ({
    id: db.id,
    date: db.date,
    client: db.client,
    name: db.name,
    hours: Number(db.hours),
    weight: Number(db.weight),
    materialType: db.material_type,
    hourlyRate: Number(db.hourly_rate),
    materialRate: Number(db.material_rate),
    profitMargin: Number(db.profit_margin),
    description: db.description || '',
    status: db.status,
    image: db.image || undefined
  });

  const mapProjectToDb = (app: ProjectOrder) => ({
    id: app.id,
    date: app.date,
    client: app.client,
    name: app.name,
    hours: app.hours,
    weight: app.weight,
    material_type: app.materialType,
    hourly_rate: app.hourlyRate,
    material_rate: app.materialRate,
    profit_margin: app.profitMargin,
    description: app.description,
    status: app.status,
    image: app.image || null
  });

  const mapDbInventory = (db: any): InventoryItem => ({
    id: db.id,
    material: db.material,
    qty: Number(db.qty),
    unitCost: Number(db.unit_cost),
    gramCost: Number(db.gram_cost),
    status: db.status,
    image: db.image || undefined,
    purchaseLink: db.purchase_link || undefined
  });

  const mapInventoryToDb = (app: InventoryItem) => ({
    id: app.id,
    material: app.material,
    qty: app.qty,
    unit_cost: app.unitCost,
    gram_cost: app.gramCost,
    status: app.status,
    image: app.image || null,
    purchase_link: app.purchaseLink || null
  });

  const mapDbShopping = (db: any): ShoppingItem => ({
    id: db.id,
    materialName: db.material_name,
    qtyNeeded: Number(db.qty_needed),
    estUnitCost: Number(db.est_unit_cost),
    purchaseLink: db.purchase_link,
    category: db.category,
    notes: db.notes || undefined,
    checked: !!db.checked,
    requestedBy: db.requested_by || undefined,
    department: db.department || undefined,
    company: db.company || undefined
  });

  const mapShoppingToDb = (app: ShoppingItem) => ({
    id: app.id,
    material_name: app.materialName,
    qty_needed: app.qtyNeeded,
    est_unit_cost: app.estUnitCost,
    purchase_link: app.purchaseLink,
    category: app.category,
    notes: app.notes || null,
    checked: app.checked,
    requested_by: app.requestedBy || null,
    department: app.department || null,
    company: app.company || null
  });

  const syncLocalBackupToSupabase = useCallback(async (projectsToSync: ProjectOrder[], inventoryToSync: InventoryItem[], shoppingToSync: ShoppingItem[]) => {
    const supabase = getSupabaseClient();
    if (!supabase || !hasSupabaseConfigured()) return false;

    try {
      for (const project of projectsToSync) {
        await supabase.from('g3d_projects').upsert(mapProjectToDb(project), { onConflict: 'id' });
      }
      for (const item of inventoryToSync) {
        await supabase.from('g3d_inventory').upsert(mapInventoryToDb(item), { onConflict: 'id' });
      }
      for (const shoppingItem of shoppingToSync) {
        await supabase.from('g3d_shopping').upsert(mapShoppingToDb(shoppingItem), { onConflict: 'id' });
      }
      return true;
    } catch (err) {
      console.error('Falha ao sincronizar dados locais com o Supabase:', err);
      return false;
    }
  }, []);
  // Load state (either from Supabase or LocalStorage)
  const loadData = useCallback(async () => {
    setLoading(true);
    setSupabaseErrorMsg(null);

    // Sincroniza configuração de nuvem com o servidor para acesso multi-dispositivo unificado
    try {
      const configRes = await fetch('/api/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        const localUrl = localStorage.getItem('g3d_supabase_url')?.trim();
        const localKey = localStorage.getItem('g3d_supabase_key')?.trim();

        if (configData.isCustom && configData.url && configData.key) {
          // O servidor tem credenciais personalizadas salvas. Sincroniza para o cliente.
          localStorage.setItem('g3d_supabase_url', configData.url);
          localStorage.setItem('g3d_supabase_key', configData.key);
        } else if (!configData.isCustom && localUrl && localKey) {
          // O cliente tem credenciais personalizadas, mas o servidor não. Faz o upload para o servidor!
          await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: localUrl, key: localKey })
          });
        }
      }
    } catch (err) {
      console.warn('Falha ao sincronizar configuração global do banco:', err);
    }

    const supabase = getSupabaseClient();
    const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (supabase && hasSupabaseConfigured()) {
      try {
        const { data: dbProjects, error: pError } = await supabase
          .from('g3d_projects')
          .select('*')
          .order('date', { ascending: false });

        const { data: dbInventory, error: iError } = await supabase
          .from('g3d_inventory')
          .select('*')
          .order('material', { ascending: true });

        const { data: dbShopping, error: sError } = await supabase
          .from('g3d_shopping')
          .select('*');

        if (pError || iError || sError) {
          throw new Error('As tabelas do Supabase podem não estar prontas ou o acesso foi negado.');
        }

        const remoteProjects = (dbProjects || []).map(mapDbProject);
        const remoteInventory = (dbInventory || []).map(mapDbInventory);
        const remoteShopping = (dbShopping || []).map(mapDbShopping);

        // Confia 100% no Banco de Dados (sem misturar com caches antigos do navegador)
        setProjects(remoteProjects);
        setInventory(remoteInventory);
        setShopping(remoteShopping);

        // Garante que nenhum dado seja salvo no navegador local
        localStorage.removeItem(STORAGE_KEYS.PROJECTS);
        localStorage.removeItem(STORAGE_KEYS.INVENTORY);
        localStorage.removeItem(STORAGE_KEYS.SHOPPING);

        if (storedSettings) {
          setSettings(JSON.parse(storedSettings));
        }

        setSupabaseConnected(true);
      } catch (err: any) {
        console.error('Supabase Sync Error, falling back to LocalStorage:', err);
        setSupabaseErrorMsg('Não foi possível conectar às tabelas do Supabase. Verifique se o script SQL foi executado no painel.');
        setSupabaseConnected(false);
        loadLocalBackup();
      } finally {
        setLoading(false);
      }
    } else {
      setSupabaseConnected(false);
      loadLocalBackup();
      setLoading(false);
    }
  }, []);

  const loadLocalBackup = () => {
    try {
      const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const storedInventory = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      const storedShopping = localStorage.getItem(STORAGE_KEYS.SHOPPING);
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (storedProjects) setProjects(JSON.parse(storedProjects));
      else {
        setProjects(DEFAULT_PROJECTS);
        localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(DEFAULT_PROJECTS));
      }

      if (storedInventory) setInventory(JSON.parse(storedInventory));
      else {
        setInventory(DEFAULT_INVENTORY);
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(DEFAULT_INVENTORY));
      }

      if (storedShopping) setShopping(JSON.parse(storedShopping));
      else {
        setShopping(DEFAULT_SHOPPING);
        localStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(DEFAULT_SHOPPING));
      }

      if (storedSettings) setSettings(JSON.parse(storedSettings));
      else {
        setSettings(DEFAULT_SETTINGS);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      }
    } catch (e) {
      console.error('Falha ao carregar dados locais:', e);
    }
  };

  useEffect(() => {
    loadData();

    // Sincronização automática em tempo real ao voltar o foco para a janela/guia do navegador
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);

  // Save changes to localStorage (Backup/Fallback always ready)
  const backupToLocal = (projs: ProjectOrder[], inv: InventoryItem[], shop: ShoppingItem[]) => {
    if (hasSupabaseConfigured()) {
      // Se houver banco configurado, limpa do navegador para respeitar a privacidade
      localStorage.removeItem(STORAGE_KEYS.PROJECTS);
      localStorage.removeItem(STORAGE_KEYS.INVENTORY);
      localStorage.removeItem(STORAGE_KEYS.SHOPPING);
      return;
    }
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projs));
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inv));
    localStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(shop));
  };

  // Sync state mutation helper
  const syncOperation = async (table: string, action: 'insert' | 'update' | 'delete', payload: any, id: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !hasSupabaseConfigured()) return;

    try {
      if (action === 'insert') {
        await supabase.from(table).upsert(payload, { onConflict: 'id' });
      } else if (action === 'update') {
        await supabase.from(table).upsert({ ...payload, id }, { onConflict: 'id' });
      } else if (action === 'delete') {
        await supabase.from(table).delete().eq('id', id);
      }
    } catch (err) {
      console.error(`Falha ao sincronizar operação em ${table}:`, err);
    }
  };

  // Project managers
  const addProject = async (project: Omit<ProjectOrder, 'id'>) => {
    const nextId = `PRJ-2026-${String(projects.length + 1).padStart(3, '0')}`;
    const fullProject: ProjectOrder = { ...project, id: nextId };
    
    // Optimistic Update
    const updated = [fullProject, ...projects];
    setProjects(updated);
    backupToLocal(updated, inventory, shopping);

    // Sync
    await syncOperation('g3d_projects', 'insert', mapProjectToDb(fullProject), nextId);
  };

  const deleteProject = async (id: string) => {
    const updated = projects.filter(p => p.id !== id);
    setProjects(updated);
    backupToLocal(updated, inventory, shopping);

    await syncOperation('g3d_projects', 'delete', null, id);
  };

  // Inventory managers
  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'gramCost' | 'status'> & { id?: string }) => {
    const nextId = item.id || `INV-${String(inventory.length + 1).padStart(3, '0')}`;
    const gramCost = item.unitCost / 1000;
    const status = item.qty === 0 ? 'Esgotado' : item.qty <= 1 ? 'Poucas Unidades' : 'Em Estoque';
    const fullItem: InventoryItem = { ...item, id: nextId, gramCost, status };

    const updated = [...inventory, fullItem];
    setInventory(updated);
    backupToLocal(projects, updated, shopping);

    await syncOperation('g3d_inventory', 'insert', mapInventoryToDb(fullItem), nextId);
  };

  const editInventoryItem = async (id: string, updatedFields: Partial<InventoryItem>) => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        const nextItem = { ...item, ...updatedFields };
        if (updatedFields.unitCost !== undefined) {
          nextItem.gramCost = updatedFields.unitCost / 1000;
        }
        if (updatedFields.qty !== undefined) {
          nextItem.status = updatedFields.qty === 0 ? 'Esgotado' : updatedFields.qty <= 1 ? 'Poucas Unidades' : 'Em Estoque';
        }
        return nextItem;
      }
      return item;
    });

    setInventory(updated);
    backupToLocal(projects, updated, shopping);

    const editedItem = updated.find(i => i.id === id);
    if (editedItem) {
      await syncOperation('g3d_inventory', 'update', mapInventoryToDb(editedItem), id);
    }
  };

  const deleteInventoryItem = async (id: string) => {
    const updated = inventory.filter(i => i.id !== id);
    setInventory(updated);
    backupToLocal(projects, updated, shopping);

    await syncOperation('g3d_inventory', 'delete', null, id);
  };

  const updateInventoryQty = async (id: string, newQty: number) => {
    const updated = inventory.map(item => {
      if (item.id === id) {
        const status = newQty === 0 ? 'Esgotado' : newQty <= 1 ? 'Poucas Unidades' : 'Em Estoque';
        return { ...item, qty: newQty, status };
      }
      return item;
    });

    setInventory(updated);
    backupToLocal(projects, updated, shopping);

    const targetItem = updated.find(i => i.id === id);
    if (targetItem) {
      await syncOperation('g3d_inventory', 'update', mapInventoryToDb(targetItem), id);
    }
  };

  // Shopping List managers
  const addShoppingItem = async (item: Omit<ShoppingItem, 'id' | 'checked'>) => {
    const nextId = `SHOP-${String(shopping.length + 1).padStart(3, '0')}`;
    const newItem: ShoppingItem = { ...item, id: nextId, checked: false };

    const updated = [...shopping, newItem];
    setShopping(updated);
    backupToLocal(projects, inventory, updated);

    await syncOperation('g3d_shopping', 'insert', mapShoppingToDb(newItem), nextId);
  };

  const deleteShoppingItem = async (id: string) => {
    const updated = shopping.filter(s => s.id !== id);
    setShopping(updated);
    backupToLocal(projects, inventory, updated);

    await syncOperation('g3d_shopping', 'delete', null, id);
  };

  const updateShoppingItem = async (id: string, updatedFields: Partial<ShoppingItem>) => {
    const updated = shopping.map(item => {
      if (item.id === id) {
        return { ...item, ...updatedFields };
      }
      return item;
    });

    setShopping(updated);
    backupToLocal(projects, inventory, updated);

    const targetItem = updated.find(i => i.id === id);
    if (targetItem) {
      await syncOperation('g3d_shopping', 'update', mapShoppingToDb(targetItem), id);
    }
  };

  const toggleShoppingItemChecked = async (id: string) => {
    const updated = shopping.map(item => {
      if (item.id === id) {
        const isChecking = !item.checked;
        let notes = item.notes || '';
        // Se estiver marcando como comprado/recebido (checked) e não tiver uma data no notes, adicionamos automaticamente
        if (isChecking) {
          const dateStr = new Date().toLocaleDateString('pt-BR');
          if (!notes.includes('/') || !/\d{2}\/\d{2}\/\d{4}/.test(notes)) {
            notes = notes ? `${notes} (Baixa: ${dateStr})` : `Baixa: ${dateStr}`;
          }
        }
        return { ...item, checked: isChecking, notes: notes || undefined };
      }
      return item;
    });

    setShopping(updated);
    backupToLocal(projects, inventory, updated);

    const targetItem = updated.find(i => i.id === id);
    if (targetItem) {
      await syncOperation('g3d_shopping', 'update', mapShoppingToDb(targetItem), id);
    }
  };

  const saveSettings = (newSettings: SettingsConfig) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
  };

  const exportData = () => {
    const dataStr = JSON.stringify({ projects, inventory, shopping, settings }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `georgefctech_3d_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = async (jsonData: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.projects && parsed.inventory) {
        setProjects(parsed.projects);
        setInventory(parsed.inventory);
        setShopping(parsed.shopping || []);
        if (parsed.settings) setSettings(parsed.settings);
        
        backupToLocal(parsed.projects, parsed.inventory, parsed.shopping || []);

        // Mass insert/merge into supabase if configured
        const supabase = getSupabaseClient();
        if (supabase && hasSupabaseConfigured()) {
          for (const proj of parsed.projects) {
            await supabase.from('g3d_projects').upsert(mapProjectToDb(proj));
          }
          for (const item of parsed.inventory) {
            await supabase.from('g3d_inventory').upsert(mapInventoryToDb(item));
          }
          if (parsed.shopping) {
            for (const s of parsed.shopping) {
              await supabase.from('g3d_shopping').upsert(mapShoppingToDb(s));
            }
          }
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return {
    projects,
    inventory,
    shopping,
    settings,
    loading,
    supabaseConnected,
    supabaseErrorMsg,
    loadData,
    addProject,
    deleteProject,
    addInventoryItem,
    editInventoryItem,
    deleteInventoryItem,
    updateInventoryQty,
    addShoppingItem,
    deleteShoppingItem,
    updateShoppingItem,
    toggleShoppingItemChecked,
    saveSettings,
    exportData,
    importData
  };
}
