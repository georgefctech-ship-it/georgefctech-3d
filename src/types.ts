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

export interface InventoryItem {
  id: string; // ID único do insumo
  material: string; // Especificação / Marca (ex: PETG Fibra de Carbono CF10 1kg)
  qty: number; // Quantidade em Rolos
  unitCost: number; // Custo do rolo (R$)
  gramCost: number; // Custo por grama de filamento (R$/g) (unitCost / roloSizeGrams)
  status: 'Em Estoque' | 'Esgotado' | 'Poucas Unidades';
  image?: string; // foto do filamento (Base64 ou URL)
  purchaseLink?: string; // Link de compra (ex: Mercado Livre, Amazon...)
}

export interface ShoppingItem {
  id: string; // ID único do item de compra
  materialName: string; // Nome do filamento ou material (bicos, fitas, etc)
  qtyNeeded: number; // Quantidade desejada
  estUnitCost: number; // Preço estimado unitário (R$)
  purchaseLink: string; // URL da loja ou vendedor
  category: 'Filamento' | 'Peças de Reposição' | 'Acessórios/Insumos' | 'Outros';
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

export function getAdminLogo(): string {
  return localStorage.getItem("g3d_admin_logo") || DEFAULT_ADMIN_LOGO;
}

export function getColabLogo(): string {
  return localStorage.getItem("g3d_colab_logo") || DEFAULT_COLAB_LOGO;
}

export function getAdminName(): string {
  return localStorage.getItem("g3d_admin_name") || DEFAULT_ADMIN_NAME;
}

export function getColabName(): string {
  return localStorage.getItem("g3d_colab_name") || DEFAULT_COLAB_NAME;
}

export function getAdminSub(): string {
  return localStorage.getItem("g3d_admin_sub") || DEFAULT_ADMIN_SUB;
}

export function getColabSub(): string {
  return localStorage.getItem("g3d_colab_sub") || DEFAULT_COLAB_SUB;
}

