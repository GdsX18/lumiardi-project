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
  acceptsOffers?: boolean;
  isRepresented?: boolean;
  representedAgencyName?: string;
  representedAgencyId?: string;
}

export interface CurationAppointment {
  date: string;       // YYYY-MM-DD
  timeSlot: string;   // ex: 10:00, 14:30
  status: 'scheduled' | 'confirmed' | 'completed';
  notes?: string;
}

export type CurationStatusType =
  | 'EM_CURATORIA'
  | 'APROVADO'
  | 'REJEITADO'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected';

export interface CompleteCreatorProfile {
  id: string;
  basicInfo: CreatorBasicRegistration;
  qualitative: CreatorQualitativeData;
  appointment?: CurationAppointment;
  curationStatus: CurationStatusType;
  acceptsOffers?: boolean;
  isRepresented?: boolean;
  representedAgencyName?: string;
  representedAgencyId?: string;
  photos?: Array<{ id: string; url: string; title: string; tag?: string }>;
  videoUrl?: string;
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
  curationStatus: CurationStatusType;
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
  searchTerm?: string;
  minAge?: number;
  maxAge?: number;
  acceptsOffersOnly?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// DRIVE COMPARTILHADO & CONTRATOS
// ═══════════════════════════════════════════════════════════════

export interface SharedDriveItem {
  id: string;
  agencyId: string;
  modelId: string;
  name: string;
  category: 'raw-photos' | 'videos' | 'contracts' | 'briefings' | 'compostos' | string;
  type: 'image' | 'video' | 'document' | string;
  size: string;
  uploadedById: string;
  uploadedByName: string;
  fileUrl: string;
  downloads: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AgencyModelContract {
  id: string;
  agencyId: string;
  modelId: string;
  agencyName: string;
  modelName: string;
  status: 'active' | 'pending' | 'terminated';
  commissionRate: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface ScoutProposal {
  id: string;
  agencyId: string;
  modelId: string;
  agencyName: string;
  modelName: string;
  message: string;
  proposedCommission: string;
  status: 'sent' | 'accepted' | 'declined' | 'blocked';
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// RBAC & AUDIT LOGS — CURADORIA
// ═══════════════════════════════════════════════════════════════

export type CurationRole = 'curador_junior' | 'curador_senior' | 'supervisor' | 'admin';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  curationRole: CurationRole;
  role?: string;
  isActive: boolean;
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export type AuditActionType =
  | 'CURATION_APPROVED'
  | 'CURATION_REJECTED'
  | 'CURATION_NOTE_ADDED'
  | 'TEAM_MEMBER_CREATED'
  | 'TEAM_ROLE_CHANGED'
  | 'TEAM_MEMBER_DEACTIVATED'
  | 'TEAM_MEMBER_DELETED'
  | 'APROVOU_MODELO'
  | 'RECUSOU_MODELO'
  | 'APROVOU_AGENCIA'
  | 'RECUSOU_AGENCIA'
  | 'ADICIONOU_NOTA'
  | 'CRIOU_CURADOR'
  | 'ALTEROU_CARGO_CURADOR'
  | 'STATUS_CURADOR_ALTERADO'
  | 'REMOVEU_CURADOR'
  | 'EXPORTOU_DOSSIE'
  | 'ALTEROU_CADASTRO'
  | 'DELETOU_REGISTRO';

export interface CurationAuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  performedBy?: string;
  performedByName?: string;
  performedByEmail?: string;
  performedByRole?: string;
  actionType: AuditActionType | string;
  targetId?: string;
  targetName?: string;
  targetType: 'criadora' | 'agencia' | 'MODELO' | 'AGENCIA' | 'USUARIO_CURADORIA' | 'DOCUMENTO' | string;
  reason?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

