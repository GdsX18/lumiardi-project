/**
 * LUMIARDI — CONFIGURAÇÃO OFICIAL DE PLANOS E LIMITES DE TIERS
 * Matriz de preços, cotas e identificadores de integração
 */

import { PlanDefinition, PlanId } from './types';

export const LUMIARDI_PLANS: Record<PlanId, PlanDefinition> = {
  glow: {
    id: 'glow',
    name: 'Glow',
    category: 'criadoras',
    priceBRL: {
      monthly: 19.90,
      yearly: 15.90,
    },
    priceUSD: {
      monthly: 3.99,
      yearly: 2.99,
    },
    badge: 'Essencial',
    description: 'Entrada no ecossistema Lumiardi com Book digital seguro e presença no catálogo oficial.',
    features: [
      'Presença no Catálogo Oficial de Modelos',
      'Book Digital com até 15 Fotos em Alta Resolução',
      'Lumiardi Drive com 5 GB de Armazenamento Criptografado',
      'Recebimento de Propostas Diretas de Agências Credenciadas',
      'Proteção Anti-Vazamento e Criptografia AES-256',
    ],
    limits: {
      maxDriveStorageGB: 5,
      maxScoutSearchesPerMonth: 10,
      maxDirectProposalsPerMonth: 5,
      priorityPlacement: 'standard',
      customWatermarking: false,
      ndaProtection: true,
    },
    gatewayIds: {
      ccbill: {
        subAccountMonthly: '0001',
        subAccountYearly: '0002',
        formName: 'lum_glow_flex',
      },
      nowpayments: {
        priceId: 'plan_glow_sub',
      },
    },
  },

  radiance: {
    id: 'radiance',
    name: 'Radiance',
    category: 'criadoras',
    priceBRL: {
      monthly: 69.90,
      yearly: 55.90,
    },
    priceUSD: {
      monthly: 13.99,
      yearly: 10.99,
    },
    badge: 'Mais Escolhido',
    isPopular: true,
    description: 'Visibilidade prioritária, armazenamento expandido e suporte jurídico padrão.',
    features: [
      'Destaque no Radar de Scouting para Agências Globais',
      'Book Ilimitado de Fotos + Reels em Alta Fidelidade',
      'Lumiardi Drive com 25 GB de Armazenamento Seguro',
      'Marca d’água Dinâmica Tokenizada em Todos os Módulos',
      'Assessoria e Modelos de NDA de Blindagem de Imagem',
      'Canal Direto de Suporte Prioritário com a Curadoria',
    ],
    limits: {
      maxDriveStorageGB: 25,
      maxScoutSearchesPerMonth: 50,
      maxDirectProposalsPerMonth: 25,
      priorityPlacement: 'high',
      customWatermarking: true,
      ndaProtection: true,
    },
    gatewayIds: {
      ccbill: {
        subAccountMonthly: '0003',
        subAccountYearly: '0004',
        formName: 'lum_radiance_flex',
      },
      nowpayments: {
        priceId: 'plan_radiance_sub',
      },
    },
  },

  icon: {
    id: 'icon',
    name: 'Icon',
    category: 'criadoras',
    priceBRL: {
      monthly: 129.90,
      yearly: 99.90,
    },
    priceUSD: {
      monthly: 25.99,
      yearly: 19.99,
    },
    badge: 'Máximo Prestígio',
    description: 'Máximo posicionamento, concierge de carreira e negociações de alto valor.',
    features: [
      'Top Posicionamento na Página Inicial e Vitrine Principal',
      'Lumiardi Drive com 100 GB de Armazenamento Ilimitado',
      'Relatórios Detalhados de Engajamento e Visualizações de Agências',
      'Gestão de Contratos de Alta Performance e Escrow Shield',
      'Acesso Antecipado a Campanhas Internacionais Exclusivas',
      'Gerente de Contas Dedicado e Linha Direta com Curadoria',
    ],
    limits: {
      maxDriveStorageGB: 100,
      maxScoutSearchesPerMonth: 'unlimited',
      maxDirectProposalsPerMonth: 'unlimited',
      priorityPlacement: 'exclusive',
      customWatermarking: true,
      ndaProtection: true,
    },
    gatewayIds: {
      ccbill: {
        subAccountMonthly: '0005',
        subAccountYearly: '0006',
        formName: 'lum_icon_flex',
      },
      nowpayments: {
        priceId: 'plan_icon_sub',
      },
    },
  },

  select: {
    id: 'select',
    name: 'Lumiardi Select',
    category: 'agencias',
    priceBRL: {
      monthly: 490.00,
      yearly: 390.00,
    },
    priceUSD: {
      monthly: 99.00,
      yearly: 79.00,
    },
    badge: 'Agências Boutique',
    description: 'Solução sob medida para agências boutique com gestão de até 10 modelos agenciadas.',
    features: [
      'Acesso ao Talent Scout Completo com Filtros Paramétricos',
      'Gestão de Roster para até 10 Criadoras Conectadas',
      'Kanban de Produção e Campanhas com Entregas Compartilhadas',
      'Lumiardi Drive Corporativo com 100 GB',
      'Chat Criptografado e Videochamadas Lumiardi Meet',
      'Geração Automática de Contratos de Comissão',
    ],
    limits: {
      maxRosterSlots: 10,
      maxDriveStorageGB: 100,
      maxScoutSearchesPerMonth: 200,
      maxDirectProposalsPerMonth: 50,
      priorityPlacement: 'high',
      customWatermarking: true,
      ndaProtection: true,
    },
    gatewayIds: {
      ccbill: {
        subAccountMonthly: '0010',
        subAccountYearly: '0011',
        formName: 'lum_agency_select_flex',
      },
      nowpayments: {
        priceId: 'plan_agency_select',
      },
    },
  },

  signature: {
    id: 'signature',
    name: 'Lumiardi Signature',
    category: 'agencias',
    priceBRL: {
      monthly: 1290.00,
      yearly: 990.00,
    },
    priceUSD: {
      monthly: 259.00,
      yearly: 199.00,
    },
    badge: 'Grandes Agências & Holdings',
    isPopular: true,
    description: 'Infraestrutura corporativa completa para holdings e grandes gestoras de talentos.',
    features: [
      'Roster Ilimitado de Criadoras e Modelos',
      'Lumiardi Drive Corporativo com 500 GB de Armazenamento',
      'Multi-Usuários com Controle de Acesso por Permissões (RBAC)',
      'Acesso Antecipado a Criadoras em Processo de Curadoria',
      'Módulo de Payouts e Conciliação de Pagamentos Automatizados',
      'API Dedicada para Integração com CRM Próprio da Agência',
    ],
    limits: {
      maxRosterSlots: 9999,
      maxDriveStorageGB: 500,
      maxScoutSearchesPerMonth: 'unlimited',
      maxDirectProposalsPerMonth: 'unlimited',
      priorityPlacement: 'exclusive',
      customWatermarking: true,
      ndaProtection: true,
    },
    gatewayIds: {
      ccbill: {
        subAccountMonthly: '0012',
        subAccountYearly: '0013',
        formName: 'lum_agency_signature_flex',
      },
      nowpayments: {
        priceId: 'plan_agency_signature',
      },
    },
  },
};

export function getPlan(planId: string): PlanDefinition {
  const plan = LUMIARDI_PLANS[planId as PlanId];
  if (!plan) {
    return LUMIARDI_PLANS.radiance;
  }
  return plan;
}
