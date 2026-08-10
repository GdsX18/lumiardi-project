/**
 * Serviço de Armazenamento e Indexação Estruturada da LUMIARDI
 * Gerencia a persistência de dados de Criadoras e Agências com índices de busca para filtragem rápida.
 */

import {
  CompleteCreatorProfile,
  CompleteAgencyProfile,
  CreatorFilterQuery,
} from '@/types';

// Banco de dados em memória persistente durante a sessão do servidor (mock de banco de dados relacional / NoSQL pronto para migração ORM)
const creatorsDatabase: Map<string, CompleteCreatorProfile> = new Map();
const agenciesDatabase: Map<string, CompleteAgencyProfile> = new Map();

// Perfis iniciais mockados para alimentar o showcase e demonstração
const initialCreators: CompleteCreatorProfile[] = [
  {
    id: 'creator-elena-vance',
    basicInfo: {
      fullName: 'Elena Vance',
      cpf: '***.***.***-**',
      birthDate: '1998-04-12',
      email: 'elena.vance@lumiardi.exclusive',
      address: {
        country: 'Brasil',
        state: 'RJ',
        city: 'Rio de Janeiro',
      },
      document: {
        documentType: 'passaporte',
        fileName: 'passaporte_elena.pdf',
        uploadedAt: new Date().toISOString(),
        verifiedStatus: 'verified',
      },
      createdAt: new Date().toISOString(),
    },
    qualitative: {
      artisticName: 'Elena Vance',
      category: 'Criadora de conteúdo +18',
      gender: 'Feminino Cisgênero',
      hobbies: 'Fotografia editorial, pilates e viagens de luxo',
      platforms: {
        instagram: '@elena.vance',
        privacy: 'elena_vance',
        onlyfans: 'elenavance_vip',
      },
      monthlyRevenueEstimate: 'R$ 80.000 - R$ 150.000',
      conversionRateEstimate: '14.5%',
      availability: ['Tarde', 'Noite'],
      hasChildren: false,
      languages: ['Português', 'Inglês', 'Espanhol'],
      exposureOpinion: 'Posicionamento artístico de alto padrão e bom gosto.',
      personalLimits: 'Não trabalho com conteúdos explícitos sem curadoria.',
      mainGoal: 'Internacionalizar a marca pessoal com agência de topo.',
      measurements: {
        height: '172',
        weight: '58',
        waist: '64',
        bust: '90',
        hips: '96',
      },
      physiognomy: {
        hairColor: 'Castanho Claro',
        eyeColor: 'Verdes',
        skinTone: 'Clara',
      },
    },
    curationStatus: 'approved',
    appointment: {
      date: '2026-08-20',
      timeSlot: '15:00',
      status: 'confirmed',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'creator-sophia-m',
    basicInfo: {
      fullName: 'Sophia Marchetti',
      cpf: '***.***.***-**',
      birthDate: '1996-09-22',
      email: 'sophia.m@lumiardi.exclusive',
      address: {
        country: 'Itália',
        state: 'Lombardia',
        city: 'Milão',
      },
      document: {
        documentType: 'passaporte',
        fileName: 'id_sophia.pdf',
        uploadedAt: new Date().toISOString(),
        verifiedStatus: 'verified',
      },
      createdAt: new Date().toISOString(),
    },
    qualitative: {
      artisticName: 'SOPHIA M.',
      category: 'Criadora de conteúdo +18',
      gender: 'Feminino Cisgênero',
      hobbies: 'Moda de luxo, arte contemporânea, gastronomia',
      platforms: {
        instagram: '@sophiam_official',
        onlyfans: 'sophiam_icon',
      },
      monthlyRevenueEstimate: 'R$ 150.000+',
      conversionRateEstimate: '18.2%',
      availability: ['Manhã', 'Tarde'],
      hasChildren: false,
      languages: ['Italiano', 'Inglês', 'Francês', 'Espanhol'],
      exposureOpinion: 'Preservação de imagem com ensaios cinematográficos.',
      personalLimits: 'Contratos estritos de confidencialidade apenas.',
      mainGoal: 'Expandir presença nos mercados de Paris e Milão.',
      measurements: {
        height: '176',
        weight: '56',
        waist: '60',
        bust: '88',
        hips: '92',
      },
      physiognomy: {
        hairColor: 'Loiro',
        eyeColor: 'Azuis',
        skinTone: 'Clara',
      },
    },
    curationStatus: 'approved',
    appointment: {
      date: '2026-08-22',
      timeSlot: '11:00',
      status: 'confirmed',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Inicializa dados no Map
initialCreators.forEach((c) => creatorsDatabase.set(c.id, c));

export const StorageService = {
  /**
   * Salva ou atualiza o perfil completo de uma Criadora.
   */
  async saveCreator(profile: CompleteCreatorProfile): Promise<CompleteCreatorProfile> {
    const id = profile.id || `creator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const record: CompleteCreatorProfile = {
      ...profile,
      id,
      updatedAt: new Date().toISOString(),
    };
    creatorsDatabase.set(id, record);
    return record;
  },

  /**
   * Obtém o perfil de uma criadora pelo ID.
   */
  async getCreatorById(id: string): Promise<CompleteCreatorProfile | null> {
    return creatorsDatabase.get(id) || null;
  },

  /**
   * Lista todas as criadoras registradas.
   */
  async listCreators(): Promise<CompleteCreatorProfile[]> {
    return Array.from(creatorsDatabase.values());
  },

  /**
   * Busca e filtra criadoras com base nos critérios qualitativos e físicos para agências.
   */
  async filterCreators(query: CreatorFilterQuery): Promise<CompleteCreatorProfile[]> {
    let results = Array.from(creatorsDatabase.values());

    if (query.category && query.category.length > 0) {
      results = results.filter((c) => query.category!.includes(c.qualitative.category));
    }

    if (query.gender && query.gender.length > 0) {
      results = results.filter((c) => query.gender!.includes(c.qualitative.gender));
    }

    if (query.hairColor && query.hairColor.length > 0) {
      results = results.filter((c) =>
        query.hairColor!.some((hc) =>
          c.qualitative.physiognomy.hairColor.toLowerCase().includes(hc.toLowerCase())
        )
      );
    }

    if (query.eyeColor && query.eyeColor.length > 0) {
      results = results.filter((c) =>
        query.eyeColor!.some((ec) =>
          c.qualitative.physiognomy.eyeColor.toLowerCase().includes(ec.toLowerCase())
        )
      );
    }

    if (query.skinTone && query.skinTone.length > 0) {
      results = results.filter((c) =>
        query.skinTone!.some((st) =>
          c.qualitative.physiognomy.skinTone.toLowerCase().includes(st.toLowerCase())
        )
      );
    }

    if (query.minHeight) {
      results = results.filter((c) => Number(c.qualitative.measurements.height) >= query.minHeight!);
    }

    if (query.maxHeight) {
      results = results.filter((c) => Number(c.qualitative.measurements.height) <= query.maxHeight!);
    }

    if (query.languages && query.languages.length > 0) {
      results = results.filter((c) =>
        query.languages!.some((l) => c.qualitative.languages.includes(l))
      );
    }

    if (query.availability && query.availability.length > 0) {
      results = results.filter((c) =>
        query.availability!.some((av) => c.qualitative.availability.includes(av))
      );
    }

    if (query.country) {
      results = results.filter(
        (c) => c.basicInfo.address.country.toLowerCase() === query.country!.toLowerCase()
      );
    }

    return results;
  },

  /**
   * Salva ou atualiza os dados da Agência.
   */
  async saveAgency(profile: CompleteAgencyProfile): Promise<CompleteAgencyProfile> {
    const id = profile.id || `agency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const record: CompleteAgencyProfile = {
      ...profile,
      id,
      updatedAt: new Date().toISOString(),
    };
    agenciesDatabase.set(id, record);
    return record;
  },

  /**
   * Lista todas as agências registradas.
   */
  async listAgencies(): Promise<CompleteAgencyProfile[]> {
    return Array.from(agenciesDatabase.values());
  },
};
