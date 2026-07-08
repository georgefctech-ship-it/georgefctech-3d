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
