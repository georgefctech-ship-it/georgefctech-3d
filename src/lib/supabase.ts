/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// Load Supabase credentials dynamically
// Priority:
// 1. Environment variables set on Vercel/TrueNAS (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
// 2. LocalStorage configuration set by the administrator in the Settings menu
const getSupabaseConfig = () => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, key: envKey, source: 'env' };
  }

  const localUrl = localStorage.getItem('g3d_supabase_url');
  const localKey = localStorage.getItem('g3d_supabase_key');

  if (localUrl && localKey) {
    return { url: localUrl, key: localKey, source: 'local' };
  }

  return null;
};

export const hasSupabaseConfigured = (): boolean => {
  return getSupabaseConfig() !== null;
};

export const getSupabaseClient = () => {
  const config = getSupabaseConfig();
  if (!config) return null;
  return createClient(config.url, config.key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
};

/**
 * SQL Bootstrap script to copy into Supabase SQL Editor
 */
export const SUPABASE_SQL_BOOTSTRAP = `-- SCRIPT DE BOOTSTRAP DO GEORGEFCTECH-3D
-- Cole este script no Editor SQL (SQL Editor) do seu Supabase para criar as tabelas necessárias:

-- 1. Projetos / Ordens 3D
CREATE TABLE IF NOT EXISTS g3d_projects (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  client TEXT NOT NULL,
  name TEXT NOT NULL,
  hours NUMERIC NOT NULL,
  weight NUMERIC NOT NULL,
  material_type TEXT NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  material_rate NUMERIC NOT NULL,
  profit_margin NUMERIC NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  image TEXT
);

-- 2. Estoque / Insumos de Filamentos
CREATE TABLE IF NOT EXISTS g3d_inventory (
  id TEXT PRIMARY KEY,
  material TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_cost NUMERIC NOT NULL,
  gram_cost NUMERIC NOT NULL,
  status TEXT NOT NULL,
  image TEXT,
  purchase_link TEXT
);

-- 3. Lista de Compras
CREATE TABLE IF NOT EXISTS g3d_shopping (
  id TEXT PRIMARY KEY,
  material_name TEXT NOT NULL,
  qty_needed INTEGER NOT NULL,
  est_unit_cost NUMERIC NOT NULL,
  purchase_link TEXT NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  checked BOOLEAN DEFAULT FALSE
);

-- 4. Tabela de Funções / Cargos por Email (Admin vs Colaborador)
CREATE TABLE IF NOT EXISTS g3d_user_roles (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'colaborador' -- 'admin' ou 'colaborador'
);

-- Habilitar leitura pública ou autenticada de todos os registros
-- (Para simplificar a integração profissional interna, ou sinta-se livre para customizar o RLS)
ALTER TABLE g3d_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE g3d_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE g3d_shopping ENABLE ROW LEVEL SECURITY;
ALTER TABLE g3d_user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS permissivas para o projeto interno (Anonimous/Authenticated can do everything)
DROP POLICY IF EXISTS "Permissivo Geral Projetos" ON g3d_projects;
CREATE POLICY "Permissivo Geral Projetos" ON g3d_projects USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissivo Geral Inventory" ON g3d_inventory;
CREATE POLICY "Permissivo Geral Inventory" ON g3d_inventory USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissivo Geral Shopping" ON g3d_shopping;
CREATE POLICY "Permissivo Geral Shopping" ON g3d_shopping USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissivo Geral Roles" ON g3d_user_roles;
CREATE POLICY "Permissivo Geral Roles" ON g3d_user_roles USING (true) WITH CHECK (true);
`;
