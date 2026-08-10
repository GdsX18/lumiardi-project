/**
 * Definições globais de tipos TypeScript para a plataforma LUMIARDI.
 */

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface AnimationProps extends BaseComponentProps {
  delay?: number;
  duration?: number;
}

// ═══════════════════════════════════════════════════════════════
// TIPOS DE CADASTRO E QUALIFICAÇÃO — CRIADORAS
// ═══════════════════════════════════════════════════════════════

export interface DocumentUploadData {
  documentType: 'rg_cnh' | 'passaporte';
  fileName: string;
  fileSize?: number;
  fileData?: string; // Base64 ou URL
  uploadedAt: string;
  verifiedStatus: 'pending' | 'verified' | 'rejected';
}

export interface ResidentialAddress {
  country: string;
  state: string;
  city: string;
}

export interface CreatorBasicRegistration {
  id?: string;
  fullName: string;
  cpf: string;
  birthDate: string;
  email: string;
  password?: string;
  address: ResidentialAddress;
  document: DocumentUploadData;
  createdAt: string;
}

export type CreatorCategory =
  | 'Criadora de conteúdo +18'
  | 'Criadora e acompanhante'
  | 'Acompanhante'
  | 'Outro';

export type GenderIdentity =
  | 'Feminino Cisgênero'
  | 'Feminino Transgênero'
  | 'Não-binário'
  | 'Travesti'
  | 'Masculino Cisgênero'
  | 'Masculino Transgênero'
  | 'Agênero'
  | 'Prefiro não informar'
  | 'Outro';

export type AvailabilityPeriod = 'Manhã' | 'Tarde' | 'Noite' | 'Madrugada' | 'Total';

export interface ActivePlatforms {
  instagram: string; // Obrigatório com @
  privacy?: string;
  onlyfans?: string;
  fatalModels?: string;
  fatalFans?: string;
  twitter?: string;
  other?: string;
}

export interface BodyMeasurements {
  height: string; // cm
  weight: string; // kg
  waist: string;  // cm
  bust: string;   // cm
  hips: string;   // cm
}

export interface Physiognomy {
  hairColor: string;
  eyeColor: string;
  skinTone: string;
}

export interface CreatorQualitativeData {
  artisticName: string;
  category: CreatorCategory;
  categoryOtherExplanation?: string;
  gender: GenderIdentity;
  genderOther?: string;
  hobbies: string;
  platforms: ActivePlatforms;
  monthlyRevenueEstimate: string;
  conversionRateEstimate: string;
  availability: AvailabilityPeriod[];
  hasChildren: boolean;
  childrenCount?: number;
  languages: string[];
  exposureOpinion: string; // Máximo de 50 caracteres
  personalLimits: string;  // O que não faria
  mainGoal: string;        // Máximo de 50 caracteres
  measurements: BodyMeasurements;
  physiognomy: Physiognomy;
}

export interface CurationAppointment {
  date: string;       // YYYY-MM-DD
  timeSlot: string;   // ex: 10:00, 14:30
  status: 'scheduled' | 'confirmed' | 'completed';
  notes?: string;
}

export interface CompleteCreatorProfile {
  id: string;
  basicInfo: CreatorBasicRegistration;
  qualitative: CreatorQualitativeData;
  appointment?: CurationAppointment;
  curationStatus: 'submitted' | 'under_review' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// TIPOS DE CADASTRO E QUALIFICAÇÃO — AGÊNCIAS
// ═══════════════════════════════════════════════════════════════

export interface AgencyBasicRegistration {
  id?: string;
  responsibleName: string;
  taxId: string; // CPF ou CNPJ
  corporateEmail: string;
  password?: string;
  document: DocumentUploadData;
  createdAt: string;
}

export interface AgencyQualitativeData {
  aboutUs: string;
  mission: string;
  values: string;
  lookingFor: string;
  commissionPercentage: string; // '10%' | '20%' | '30%' | '40%' | '50%' | '60%' | '70%' | '80%' | 'Outro a definir'
  commissionCustom?: string;
  instagram: string; // Exigir @
  country: string;
  city: string;
}

export interface CompleteAgencyProfile {
  id: string;
  basicInfo: AgencyBasicRegistration;
  qualitative: AgencyQualitativeData;
  appointment?: CurationAppointment;
  curationStatus: 'submitted' | 'under_review' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// ESTRUTURA DE FILTROS INDEXADOS PARA BUSCA DE AGÊNCIAS
// ═══════════════════════════════════════════════════════════════

export interface CreatorFilterQuery {
  category?: CreatorCategory[];
  gender?: GenderIdentity[];
  hairColor?: string[];
  eyeColor?: string[];
  skinTone?: string[];
  minHeight?: number;
  maxHeight?: number;
  languages?: string[];
  availability?: AvailabilityPeriod[];
  platforms?: (keyof ActivePlatforms)[];
  hasChildren?: boolean;
  country?: string;
  state?: string;
}
