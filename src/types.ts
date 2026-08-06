/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProjectOrder {
  id: string; // SKU / ID único do projeto
  date: string; // Data de conclusão
  client: string; // Solicitante / Setor / Cliente (ex: Manutenção Preventiva)
  name: string; // Nome do Projeto / Modelo (ex: Lote de Protetores...)
  hours: number; // Tempo de impressão/operação em horas
  weight: number; // Peso final em gramas
  materialType: string; // ex: PETG CF10, PLA Premium...
  hourlyRate: number; // custo hora técnica do operador (R$/hora)
  materialRate: number; // custo do g de filamento (R$/g)
  profitMargin: number; // margem ou taxa adicional em Reais (R$)
  description: string; // Observações técnicas do serviço
  status: 'concluido' | 'rascunho';
  image?: string; // foto da peça imprimida (Base64 ou URL)
}

export type ItemCategory = 
  | 'Filamento' 
  | 'Placas & Fontes' 
  | 'Placas' 
  | 'Componentes Eletrônicos' 
  | 'Peças Geral' 
  | 'Peças de Reposição' 
  | 'Refrigeração' 
  | 'Acessórios/Insumos' 
  | 'Outros';

export interface InventoryItem {
  id: string; // ID único do insumo
  material: string; // Especificação / Marca (ex: PETG Fibra de Carbono CF10 1kg)
  qty: number; // Quantidade em Rolos / Unidades
  unitCost: number; // Custo do rolo ou unidade (R$)
  gramCost: number; // Custo por grama ou unidade (R$/g) (unitCost / roloSizeGrams)
  status: 'Em Estoque' | 'Esgotado' | 'Poucas Unidades';
  image?: string; // foto do insumo (Base64 ou URL)
  purchaseLink?: string; // Link de compra (ex: Mercado Livre, Amazon...)
  category?: ItemCategory | string; // Categoria do insumo
  createdByRole?: 'admin' | 'colaborador' | string; // Papel de quem cadastrou o insumo
  createdByUser?: string; // Nome ou e-mail de quem cadastrou
  createdAt?: string; // Data e hora de criação
}

export interface ShoppingItem {
  id: string; // ID único do item de compra
  materialName: string; // Nome do filamento ou material (bicos, fitas, etc)
  qtyNeeded: number; // Quantidade desejada
  estUnitCost: number; // Preço estimado unitário (R$)
  purchaseLink: string; // URL da loja ou vendedor
  category: ItemCategory | string;
  notes?: string; // Observações customizadas
  checked?: boolean; // Se já foi comprado ou checado
  requestedBy?: string; // Nome do funcionário responsável pelo pedido
  department?: string; // Setor do funcionário
  company?: string; // Empresa do pedido
  barcode?: string; // Código de barras ou modelo do produto
}

export interface SettingsConfig {
  defaultHourlyRate: number;
  defaultMaterialRate: number;
  defaultProfitMargin: number;
}

// Shared profile constants and helper functions
export const DEFAULT_ADMIN_LOGO = "https://vyvompcoiaizoluuxnzx.supabase.co/storage/v1/object/sign/img/meu_logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lYTFhZWQwNC03M2Y5LTQwODQtOWNiOS04ODBkMTA3MzAwY2UiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWcvbWV1X2xvZ28ucG5nIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4MTc5NTUxOCwiZXhwIjoxODc2NDAzNTE4fQ.JgHY5piKmwxjB0nfW08joAWsNE-JYRA5kUUkVra9hFI";
export const DEFAULT_COLAB_LOGO = "https://lh3.googleusercontent.com/gps-cs-s/APNQkAForRZzi0p_dHcu4q-uB5_6Hmh_ZWM1hwqil-EcrY-fKLUJWx-Z1RHuhgUQTtqJXsV29-B0tbj3CuhgI93tL_ygBJPL6nmLWh2TGr4Imchb-7y8ozTXVOdxt5UFk-PmJqQndhUJLw=w229-h164-n-k-no-nu";

export const DEFAULT_ADMIN_NAME = "GeorgeFctech-3D";
export const DEFAULT_COLAB_NAME = "GeorgeFctech Comercial";

export const DEFAULT_ADMIN_SUB = "Modelagem • Escultura • Impressão 3D";
export const DEFAULT_COLAB_SUB = "Pedidos • Compras • Suprimentos";

export function normalizeUserKey(userOrEmail?: string | null): string {
  if (!userOrEmail) return '';
  return String(userOrEmail)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getUserAvatar(role?: string, username?: string, email?: string): string {
  const currentRole = role || sessionStorage.getItem('g3d_user_role') || 'colaborador';
  const rawUser = username || sessionStorage.getItem('g3d_username') || '';
  const rawEmail = email || sessionStorage.getItem('g3d_user_email') || '';
  const key = normalizeUserKey(rawUser) || normalizeUserKey(rawEmail ? rawEmail.split('@')[0] : '');

  if (currentRole === 'admin') {
    return localStorage.getItem("g3d_admin_logo") || (key ? localStorage.getItem(`g3d_avatar_${key}`) : null) || DEFAULT_ADMIN_LOGO;
  }

  // 1. Check user-specific custom avatar in localStorage
  if (key) {
    const userCustomAvatar = localStorage.getItem(`g3d_avatar_${key}`);
    if (userCustomAvatar) return userCustomAvatar;

    try {
      const avatarsMap = JSON.parse(localStorage.getItem('g3d_user_avatars_map') || '{}');
      if (avatarsMap[key]) return avatarsMap[key];
    } catch (e) {}
  }

  // 2. If it is specifically Ftéx / default initial collaborator
  if (key === 'ftex' || key.includes('ftex') || key === 'comercial') {
    return localStorage.getItem("g3d_colab_logo") || DEFAULT_COLAB_LOGO;
  }

  // 3. For any other collaborator (e.g. Jhonatan, Lucas, etc.) - provide a personalized avatar
  if (rawUser || rawEmail) {
    const seed = encodeURIComponent(rawUser || (rawEmail ? rawEmail.split('@')[0] : 'colaborador'));
    return `https://ui-avatars.com/api/?name=${seed}&background=059669&color=fff&bold=true&size=128`;
  }

  return localStorage.getItem("g3d_colab_logo") || DEFAULT_COLAB_LOGO;
}

export function getUserDisplayName(role?: string, username?: string, email?: string): string {
  const currentRole = role || sessionStorage.getItem('g3d_user_role') || 'colaborador';
  const rawUser = username || sessionStorage.getItem('g3d_username') || '';
  const rawEmail = email || sessionStorage.getItem('g3d_user_email') || '';
  const key = normalizeUserKey(rawUser) || normalizeUserKey(rawEmail ? rawEmail.split('@')[0] : '');

  if (currentRole === 'admin') {
    return localStorage.getItem("g3d_admin_name") || DEFAULT_ADMIN_NAME;
  }

  // 1. Check user custom name
  if (key) {
    const userCustomName = localStorage.getItem(`g3d_name_${key}`);
    if (userCustomName) return userCustomName;
  }

  // 2. Format username nicely (e.g. "jhonatan" -> "Colaborador Jhonatan", "ftex" -> "Colaborador Ftéx")
  if (rawUser) {
    const clean = rawUser.trim();
    if (clean.toLowerCase() === 'ftex' || clean.toLowerCase() === 'ftéx') {
      return 'Colaborador Ftéx';
    }
    const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
    if (capitalized.toLowerCase().startsWith('colaborador')) {
      return capitalized;
    }
    return `Colaborador ${capitalized}`;
  }

  if (rawEmail) {
    const namePart = rawEmail.split('@')[0];
    const capitalized = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    return `Colaborador ${capitalized}`;
  }

  return localStorage.getItem("g3d_colab_name") || DEFAULT_COLAB_NAME;
}

export function getUserSubtitle(role?: string, username?: string): string {
  const currentRole = role || sessionStorage.getItem('g3d_user_role') || 'colaborador';
  if (currentRole === 'admin') {
    return localStorage.getItem("g3d_admin_sub") || DEFAULT_ADMIN_SUB;
  }
  return localStorage.getItem("g3d_colab_sub") || DEFAULT_COLAB_SUB;
}

export function setUserProfileData(
  role: string,
  username: string,
  email: string,
  avatarUrl?: string,
  displayName?: string,
  sub?: string
) {
  const key = normalizeUserKey(username) || normalizeUserKey(email ? email.split('@')[0] : '');

  if (role === 'admin') {
    if (avatarUrl) localStorage.setItem("g3d_admin_logo", avatarUrl.trim());
    if (displayName) localStorage.setItem("g3d_admin_name", displayName.trim());
    if (sub) localStorage.setItem("g3d_admin_sub", sub.trim());
  } else {
    if (key) {
      if (avatarUrl) {
        localStorage.setItem(`g3d_avatar_${key}`, avatarUrl.trim());
        try {
          const map = JSON.parse(localStorage.getItem('g3d_user_avatars_map') || '{}');
          map[key] = avatarUrl.trim();
          localStorage.setItem('g3d_user_avatars_map', JSON.stringify(map));
        } catch (e) {}
      }
      if (displayName) localStorage.setItem(`g3d_name_${key}`, displayName.trim());
    }
    if (avatarUrl) localStorage.setItem("g3d_colab_logo", avatarUrl.trim());
    if (displayName) localStorage.setItem("g3d_colab_name", displayName.trim());
    if (sub) localStorage.setItem("g3d_colab_sub", sub.trim());
  }

  window.dispatchEvent(new Event('g3d_visual_settings_updated'));
}

export function getAdminLogo(): string {
  return getUserAvatar('admin');
}

export function getColabLogo(): string {
  return getUserAvatar('colaborador');
}

export function getAdminName(): string {
  return getUserDisplayName('admin');
}

export function getColabName(): string {
  return getUserDisplayName('colaborador');
}

export function getAdminSub(): string {
  return getUserSubtitle('admin');
}

export function getColabSub(): string {
  return getUserSubtitle('colaborador');
}

