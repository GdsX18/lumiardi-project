/**
 * Serviço de Armazenamento e Autenticação da LUMIARDI
 * Integrado ao banco de dados PostgreSQL Local (pgAdmin) e com fallback resiliente.
 */

import bcrypt from 'bcryptjs';
import { pool, initDatabase, fallbackStore, withTransaction } from '@/lib/db';
import type { PoolClient } from 'pg';
import { encryptTOTPSecret } from '@/lib/security/twoFactor';
import {
  CompleteCreatorProfile,
  CompleteAgencyProfile,
  CreatorFilterQuery,
  CurationStatusType,
  SharedDriveItem,
  AgencyModelContract,
  ScoutProposal,
  AdminUser,
  CurationRole,
  NotificationItem,
  CurationInterview,
  PreInterviewAnswers,
} from '@/types';
import { SessionUser } from '@/lib/auth';
import crypto from 'crypto';
import { getDirectConversationId, isAdminRole, normalizeSenderRole } from '@/lib/chatRoles';

/** Política mínima de senha: 8+ caracteres, com letras e números. */
export function isStrongPassword(password: unknown): password is string {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 128 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
}

/** Lê profiles.pre_interview (JSONB, ou string no fallback) sem medidas/fisionomia, que já têm colunas próprias. */
function parsePreInterview(raw: unknown): PreInterviewAnswers | null {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const { measurements: _m, physiognomy: _p, ...answers } = value as Record<string, unknown>;
  return answers as PreInterviewAnswers;
}

// Id canônico do canal direto agência ↔ modelo (definido em chatRoles, que também roda no cliente)
export { getDirectConversationId };

const CREATOR_CATALOG_COLUMNS = `u.id, u.email, u.full_name, u.curation_status, u.created_at,
               p.artistic_name, p.category, p.instagram, p.gender, p.measurements,
               p.physiognomy, p.address, p.photos, p.video_url, p.bio, p.monthly_revenue_estimate,
               p.accepts_offers, p.is_represented, p.represented_agency_name, p.represented_agency_id`;

/**
 * Linha users ⨝ profiles → perfil de catálogo. Campos não preenchidos pela modelo ficam vazios
 * (a UI exibe "Não informado"): nunca inventar medidas, fisionomia, @ ou cidade.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCreatorCatalogRow(row: any): Record<string, unknown> {
  return {
    id: row.id,
    basicInfo: {
      fullName: row.full_name,
      email: row.email,
      address: row.address || {},
    },
    qualitative: {
      artisticName: row.artistic_name || row.full_name,
      category: row.category || '',
      gender: row.gender || '',
      platforms: { instagram: row.instagram || '' },
      measurements: row.measurements || {},
      physiognomy: row.physiognomy || {},
      monthlyRevenueEstimate: row.monthly_revenue_estimate || '',
      bio: row.bio || '',
      acceptsOffers: row.accepts_offers !== false,
      isRepresented: Boolean(row.is_represented),
      representedAgencyName: row.represented_agency_name || undefined,
      representedAgencyId: row.represented_agency_id || undefined,
    },
    acceptsOffers: row.accepts_offers !== false,
    isRepresented: Boolean(row.is_represented),
    representedAgencyName: row.represented_agency_name || undefined,
    photos: row.photos || [],
    videoUrl: row.video_url || '',
    curationStatus: row.curation_status,
    createdAt: row.created_at,
  };
}

/** Erro de regra de negócio do fluxo proposta/candidatura/contrato, com código de API e status HTTP. */
export class ScoutFlowError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
    this.name = 'ScoutFlowError';
  }
}

/** "20", "20%", " 20 % " → "20%". Valores fora de 0–100 voltam ao padrão de 20%. */
export function normalizeCommission(raw?: unknown): string {
  const value = Number(String(raw ?? '').replace(/[^0-9.,]/g, '').replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0 || value > 100) return '20%';
  return `${Number(value.toFixed(2))}%`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapScoutProposalRow(p: any): ScoutProposal {
  return {
    id: p.id,
    agencyId: p.agency_id,
    modelId: p.model_id,
    agencyName: p.agency_name,
    modelName: p.model_name,
    message: p.message,
    proposedCommission: p.proposed_commission,
    status: p.status,
    initiatedBy: p.initiated_by === 'model' ? 'model' : 'agency',
    respondedAt: p.responded_at ? new Date(p.responded_at).toISOString() : undefined,
    createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapContractRow(c: any): AgencyModelContract {
  return {
    id: c.id,
    agencyId: c.agency_id,
    modelId: c.model_id,
    agencyName: c.agency_name,
    modelName: c.model_name,
    status: c.status,
    commissionRate: c.commission_rate,
    startDate: c.start_date ? new Date(c.start_date).toISOString() : '',
    endDate: c.end_date ? new Date(c.end_date).toISOString() : undefined,
    createdAt: c.created_at ? new Date(c.created_at).toISOString() : '',
  };
}

export const StorageService = {
  /**
   * Autenticação universal com PostgreSQL e hash bcrypt
   */
  async authenticate(
    email: string,
    pass: string,
    role: 'criadora' | 'agencia'
  ): Promise<{ user: SessionUser; profile?: Record<string, unknown> | null; twoFactorSecretEncrypted?: string | null } | null> {
    const normEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    const targetRole = role === 'criadora' ? 'MODELO' : 'AGENCIA';

    await initDatabase();

    try {
      // 1. Tenta buscar no PostgreSQL
      const res = await pool.query(
        'SELECT * FROM users WHERE LOWER(email) = $1 AND role = $2',
        [normEmail, targetRole]
      );

      if (res.rows.length > 0) {
        const user = res.rows[0];
        const match = await bcrypt.compare(cleanPass, user.password_hash);

        if (match) {
          const profRes = await pool.query(
            'SELECT * FROM profiles WHERE user_id = $1',
            [user.id]
          );
          return {
            user: {
              id: user.id,
              email: user.email,
              name: user.full_name,
              role: user.role === 'MODELO' ? 'criadora' : 'agencia',
              curationStatus: user.curation_status,
              createdAt: user.created_at,
            },
            profile: (profRes.rows[0] as Record<string, unknown>) || null,
            // Só devolvido com 2FA ativo; a rota de login decifra e exige o código TOTP
            twoFactorSecretEncrypted: user.two_factor_enabled ? user.two_factor_secret || null : null,
          };
        }
      }
    } catch (err) {
      console.error('[StorageService.authenticate] Falha ao consultar o banco:', err);
      throw new Error('DATABASE_UNAVAILABLE');
    }

    return null;
  },

  /**
   * Autenticação exclusiva para equipe de Curadoria e Gestores (Admin RBAC)
   */
  async authenticateAdmin(email: string, pass: string): Promise<{ user: SessionUser } | null> {
    const normEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    await initDatabase();

    try {
      // 1. Tenta buscar na tabela admin_users
      const adminRes = await pool.query(
        'SELECT * FROM admin_users WHERE LOWER(email) = $1 AND status = $2',
        [normEmail, 'active']
      );

      if (adminRes.rows.length > 0) {
        const au = adminRes.rows[0];
        const match = await bcrypt.compare(cleanPass, au.password_hash);
        if (match) {
          try {
            await pool.query('UPDATE users SET last_seen_at = NOW() WHERE id = $1 OR id = $2 OR LOWER(email) = $3', [au.id, 'admin-curadoria-1', normEmail]);
            await pool.query('UPDATE admin_users SET updated_at = NOW() WHERE id = $1', [au.id]);
          } catch {}
          return {
            user: {
              id: au.id,
              email: au.email,
              name: au.full_name,
              role: 'admin',
              curationRole: au.role || 'admin',
              curationStatus: 'APROVADO',
              createdAt: au.created_at,
            },
          };
        }
      }
    } catch (err) {
      console.error('[StorageService.authenticateAdmin] Falha ao consultar o banco:', err);
      throw new Error('DATABASE_UNAVAILABLE');
    }

    return null;
  },

  /**
   * Métricas globais da Mesa de Curadoria
   */
  async getAdminMetrics() {
    await initDatabase();

    try {
      const res = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE curation_status IN ('EM_CURATORIA', 'AGUARDANDO_REUNIAO', 'APROVADA_PAGAMENTO')) AS pending,
          COUNT(*) FILTER (WHERE curation_status = 'APROVADO' AND role = 'MODELO') AS approved_models,
          COUNT(*) FILTER (WHERE curation_status = 'APROVADO' AND role = 'AGENCIA') AS approved_agencies,
          COUNT(*) FILTER (WHERE curation_status IN ('REJEITADO', 'RECUSADO')) AS rejected
        FROM users
        WHERE role != 'ADMIN';
      `);

      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          pending: Number(row.pending) || 0,
          approvedModels: Number(row.approved_models) || 0,
          approvedAgencies: Number(row.approved_agencies) || 0,
          rejected: Number(row.rejected) || 0,
        };
      }
    } catch (err) {
      console.error('[StorageService.getAdminMetrics] Falha ao consultar o banco:', err);
      throw new Error('DATABASE_UNAVAILABLE');
    }

    return { pending: 0, approvedModels: 0, approvedAgencies: 0, rejected: 0 };
  },

  /**
   * Lista solicitações de cadastro para curadoria
   */
  async listApplications(type: 'all' | 'criadora' | 'agencia' = 'all', status?: string) {
    await initDatabase();

    const targetRole = type === 'criadora' ? 'MODELO' : type === 'agencia' ? 'AGENCIA' : null;

    try {
      let query = `
        SELECT u.*, p.artistic_name, p.corporate_name, p.responsible_name, p.category, p.instagram, 
               p.birth_date, p.document_number, p.cnpj, p.gender, p.measurements, p.physiognomy, p.address, 
               p.photos, p.video_url, p.bio, p.exposure_opinion, p.monthly_revenue_estimate, p.commission_rate, p.specialties,
               p.hobbies, p.pre_interview,
               (SELECT ci.meet_link FROM curation_interviews ci
                 WHERE ci.user_id = u.id AND ci.meet_link IS NOT NULL
                 ORDER BY ci.updated_at DESC LIMIT 1) AS meet_link
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.role != 'ADMIN'
      `;
      const params: unknown[] = [];

      if (targetRole) {
        params.push(targetRole);
        query += ` AND u.role = $${params.length}`;
      }

      if (status && status !== 'ALL') {
        params.push(status);
        query += ` AND u.curation_status = $${params.length}`;
      }

      query += ` ORDER BY u.created_at DESC`;

      const res = await pool.query(query, params);
      if (res.rows.length > 0) {
        let BillingService: any = null;
        try {
          const billingModule = await import('@/lib/payments/billingService');
          BillingService = billingModule.BillingService;
        } catch {}

        const subsMap = new Map();
        const invsMap = new Map();

        if (BillingService) {
          try {
            const userIds = res.rows.map(r => r.id);
            if (userIds.length > 0) {
              const placeholders = userIds.map((_, i) => `$${i + 1}`).join(', ');
              
              const subsRes = await pool.query(
                `SELECT DISTINCT ON (user_id) * FROM subscriptions WHERE user_id IN (${placeholders}) ORDER BY user_id, created_at DESC`,
                userIds
              );
              subsRes.rows.forEach(s => subsMap.set(s.user_id, s));

              const invsRes = await pool.query(
                `SELECT DISTINCT ON (user_id) * FROM invoices WHERE user_id IN (${placeholders}) ORDER BY user_id, created_at DESC`,
                userIds
              );
              invsRes.rows.forEach(i => invsMap.set(i.user_id, i));
            }
          } catch {}
        }

        const apps = res.rows.map((row) => {
          const isModel = row.role === 'MODELO';
          let paymentInfo: any = null;
          
          if (BillingService) {
            const sub = subsMap.get(row.id);
            const latestInv = invsMap.get(row.id);
            
            if (sub || latestInv) {
              paymentInfo = {
                hasPaid: sub?.status === 'active' || latestInv?.status === 'paid',
                planId: sub?.plan_id,
                planCategory: sub?.plan_category,
                billingInterval: sub?.billing_interval,
                amount: latestInv?.amount || sub?.amount,
                currency: latestInv?.currency || 'BRL',
                status: latestInv?.status || sub?.status || 'pending',
                receiptNumber: latestInv?.receipt_number,
              };
            }
          }

          return {
              id: row.id,
              email: row.email,
              fullName: row.full_name,
              role: isModel ? 'criadora' : 'agencia',
              curationStatus: row.curation_status,
              phone: row.phone || row.whatsapp || '-',
              whatsapp: row.whatsapp || row.phone || '',
              interviewDate: row.interview_date || null,
              interviewTime: row.interview_time || null,
              documentType: row.document_type || (isModel ? 'Documento de Identificação' : 'Contrato Social & CNPJ'),
              documentName: row.document_name || null,
              documentUrl: row.document_url || '',
              rejectionReason: row.rejection_reason,
              createdAt: row.created_at,
              profile: {
                artisticName: row.artistic_name || row.full_name,
                corporateName: row.corporate_name || row.full_name,
                responsibleName: row.responsible_name || row.full_name,
                category: row.category || (isModel ? 'Modelo & Criadora VIP' : 'Agência de Casting & Modelos'),
                instagram: row.instagram || '-',
                birthDate: row.birth_date || '-',
                documentNumber: row.document_number || row.cnpj || '-',
                cnpj: row.cnpj || row.document_number || '-',
                gender: row.gender || '-',
                measurements: row.measurements || null,
                physiognomy: row.physiognomy || null,
                address: row.address || null,
                photos: row.photos || [],
                videoUrl: row.video_url || '',
                bio: row.bio || '',
                exposureOpinion: row.exposure_opinion || '',
                monthlyRevenueEstimate: row.monthly_revenue_estimate || null,
                commissionRate: row.commission_rate || null,
                specialties: row.specialties || [],
                hobbies: row.hobbies || '',
              },
              preInterview: parsePreInterview(row.pre_interview),
              planId: row.plan_id || null,
              planBillingInterval: row.plan_billing_interval || null,
              meetLink: row.meet_link || null,
              twoFactorEnabled: !!row.two_factor_enabled,
              kycSelfieUrl: row.kyc_selfie_url || null,
              paymentInfo: paymentInfo || (row as any).payment_info || null,
            };
          });
        return apps;
      }
    } catch {
      // Fallback
    }

    // Fallback store
    const list: Record<string, unknown>[] = [];
    for (const u of fallbackStore.users.values()) {
      if (u.role === 'ADMIN') continue;
      if (targetRole && u.role !== targetRole) continue;
      if (status && status !== 'ALL' && u.curation_status !== status) continue;

      const p = (fallbackStore.profiles.get(u.id as string) as Record<string, unknown>) || {};
      const isModel = u.role === 'MODELO';

      const sub = (fallbackStore.subscriptions.get(u.id as string) as Record<string, any>) || undefined;
      let paymentInfo: any = null;
      if (sub) {
        paymentInfo = {
          hasPaid: sub.status === 'active',
          planId: sub.plan_id || sub.planId,
          planCategory: sub.plan_category || sub.planCategory,
          billingInterval: sub.billing_interval || sub.billingInterval,
          amount: sub.amount,
          currency: sub.currency || 'BRL',
          status: sub.status,
        };
      } else {
        for (const inv of fallbackStore.invoices.values()) {
          const raw = inv as Record<string, any>;
          if (raw.user_id === u.id || raw.userId === u.id) {
            paymentInfo = {
              hasPaid: raw.status === 'paid',
              amount: raw.amount,
              currency: raw.currency || 'BRL',
              status: raw.status,
              billingReason: raw.billing_reason || raw.billingReason,
              receiptNumber: raw.receipt_number || raw.receiptNumber,
            };
            break;
          }
        }
      }

      list.push({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: isModel ? 'criadora' : 'agencia',
        curationStatus: u.curation_status,
        phone: u.phone || p.phone || '-',
        whatsapp: (u.whatsapp || u.phone || '') as string,
        interviewDate: (u.interview_date || u.interviewDate || null) as string | null,
        interviewTime: (u.interview_time || u.interviewTime || null) as string | null,
        documentType: u.document_type || (isModel ? 'Passaporte / RG' : 'Contrato Social & CNPJ'),
        documentName: u.document_name || (isModel ? 'doc_identidade.pdf' : 'contrato_social_cnpj.pdf'),
        documentUrl: u.document_url || '',
        rejectionReason: u.rejection_reason,
        createdAt: u.created_at,
        paymentInfo,
        profile: {
          artisticName: p.artistic_name || u.full_name,
          corporateName: p.corporate_name || u.full_name,
          responsibleName: p.responsible_name || u.full_name,
          category: p.category || (isModel ? 'Modelo & Criadora VIP' : 'Agência de Casting & Modelos'),
          instagram: p.instagram || '-',
          birthDate: p.birth_date || '-',
          documentNumber: p.document_number || p.cnpj || '-',
          cnpj: p.cnpj || '-',
          gender: p.gender || '-',
          measurements: p.measurements || null,
          physiognomy: p.physiognomy || null,
          address: p.address || (u.address ? u.address : null),
          photos: p.photos || [],
          videoUrl: p.video_url || '',
          bio: p.bio || '',
          exposureOpinion: p.exposure_opinion || '',
          monthlyRevenueEstimate: p.monthly_revenue_estimate || 'Sob Consulta',
          commissionRate: p.commission_rate || '20%',
          specialties: p.specialties || ['Alta Moda', 'Editorial', 'Campanhas Digitais'],
          hobbies: p.hobbies || '',
        },
        preInterview: parsePreInterview(p.pre_interview),
        planId: (u.plan_id as string) || null,
        planBillingInterval: (u.plan_billing_interval as string) || null,
        meetLink: (fallbackStore.curation_interviews.get(`user_${u.id}`)?.meetLink as string) || null,
        twoFactorEnabled: !!u.two_factor_enabled,
        kycSelfieUrl: (u.kyc_selfie_url as string) || null,
      });
    }

    return list.sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());
  },

  /**
   * Busca detalhes completos de uma solicitação por ID
   */
  async getApplicationById(id: string) {
    await initDatabase();
    try {
      const res = await pool.query(`
        SELECT u.*, p.artistic_name, p.corporate_name, p.responsible_name, p.category, p.instagram, 
               p.birth_date, p.document_number, p.cnpj, p.gender, p.measurements, p.physiognomy, p.address, 
               p.photos, p.video_url, p.bio, p.exposure_opinion, p.monthly_revenue_estimate, p.commission_rate, p.specialties,
               p.hobbies, p.pre_interview,
               (SELECT ci.meet_link FROM curation_interviews ci
                 WHERE ci.user_id = u.id AND ci.meet_link IS NOT NULL
                 ORDER BY ci.updated_at DESC LIMIT 1) AS meet_link
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = $1
      `, [id]);
      
      if (res.rows.length > 0) {
        const row = res.rows[0];
        const isModel = row.role === 'MODELO';
        let paymentInfo: any = null;
        try {
          const billingModule = await import('@/lib/payments/billingService');
          const sub = await billingModule.BillingService.getUserSubscription(row.id);
          const invs = await billingModule.BillingService.getUserInvoices(row.id);
          const latestInv = invs[0] || null;
          if (sub || latestInv) {
            paymentInfo = {
              hasPaid: sub?.status === 'active' || latestInv?.status === 'paid',
              planId: sub?.planId,
              planCategory: sub?.planCategory,
              billingInterval: sub?.billingInterval,
              amount: latestInv?.amount || sub?.amount,
              currency: latestInv?.currency || 'BRL',
              status: latestInv?.status || sub?.status || 'pending',
              receiptNumber: latestInv?.receiptNumber,
            };
          }
        } catch {}
        
        return {
          id: row.id,
          email: row.email,
          fullName: row.full_name,
          role: isModel ? 'criadora' : 'agencia',
          curationStatus: row.curation_status,
          phone: row.phone || '-',
          whatsapp: (row.whatsapp || row.phone || '') as string,
          interviewDate: (row.interview_date || null) as string | null,
          interviewTime: (row.interview_time || null) as string | null,
          documentType: row.document_type || (isModel ? 'Passaporte / RG' : 'Contrato Social & CNPJ'),
          documentName: row.document_name || (isModel ? 'doc_identidade.pdf' : 'contrato_social_cnpj.pdf'),
          documentUrl: row.document_url || '',
          rejectionReason: row.rejection_reason,
          createdAt: row.created_at,
          profile: {
            artisticName: row.artistic_name || row.full_name,
            corporateName: row.corporate_name || row.full_name,
            responsibleName: row.responsible_name || row.full_name,
            category: row.category || (isModel ? 'Modelo & Criadora VIP' : 'Agência de Casting & Modelos'),
            instagram: row.instagram || '-',
            birthDate: row.birth_date || '-',
            documentNumber: row.document_number || row.cnpj || '-',
            cnpj: row.cnpj || row.document_number || '-',
            gender: row.gender || '-',
            measurements: row.measurements || null,
            physiognomy: row.physiognomy || null,
            address: row.address || null,
            photos: row.photos || [],
            videoUrl: row.video_url || '',
            bio: row.bio || '',
            exposureOpinion: row.exposure_opinion || '',
            monthlyRevenueEstimate: row.monthly_revenue_estimate || 'Sob Consulta',
            commissionRate: row.commission_rate || '20%',
            specialties: row.specialties || ['Alta Moda', 'Editorial', 'Campanhas Digitais'],
            hobbies: row.hobbies || '',
          },
          preInterview: parsePreInterview(row.pre_interview),
          planId: (row.plan_id || null) as string | null,
          planBillingInterval: (row.plan_billing_interval || null) as string | null,
          meetLink: (row.meet_link || null) as string | null,
          twoFactorEnabled: !!row.two_factor_enabled,
          kycSelfieUrl: (row.kyc_selfie_url || null) as string | null,
          paymentInfo: paymentInfo || (row as any).payment_info || null,
        };
      }
    } catch {}
    
    // Fallback if not found in DB
    const list = await this.listApplications('all');
    return list.find((app) => app.id === id) || null;
  },

  /**
   * Atualiza status da credencial (Aprovar ou Recusar com motivo)
   */
  async updateApplicationStatus(
    id: string,
    status: CurationStatusType | string,
    rejectionReason?: string
  ): Promise<boolean> {
    await initDatabase();

    // Falhas de banco são propagadas: quem chama não pode registrar auditoria/e-mails
    // de uma mudança que não aconteceu.
    const res = await pool.query(
      `UPDATE users SET curation_status = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3`,
      [status, rejectionReason || null, id]
    );
    return (res.rowCount ?? 0) > 0;
  },

  /**
   * Anotações internas da Curadoria (persistidas em `application_notes`)
   */
  async addApplicationNote(userId: string, note: { author: string; text: string }) {
    await initDatabase();
    const noteObj = {
      id: `note-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId,
      author: note.author || 'curadoria@lumiardi.com',
      text: note.text.trim(),
      createdAt: new Date().toISOString(),
    };

    await pool.query(
      'INSERT INTO application_notes (id, user_id, author, text, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [noteObj.id, userId, noteObj.author, noteObj.text]
    );

    return noteObj;
  },

  async getApplicationNotes(userId: string) {
    await initDatabase();
    const res = await pool.query(
      'SELECT id, user_id, author, text, created_at FROM application_notes WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.rows.map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      author: String(r.author),
      text: String(r.text),
      createdAt: new Date(r.created_at).toISOString(),
    }));
  },

  /**
   * Registra um novo usuário no PostgreSQL com status EM_CURATORIA
   */
  async registerUser(data: {
    id?: string;
    email: string;
    password?: string;
    fullName: string;
    role: 'criadora' | 'agencia';
    artisticName?: string;
    category?: string;
    instagram?: string;
    documentName?: string;
    documentUrl?: string;
    whatsapp?: string;
    phone?: string;
    curationStatus?: CurationStatusType | string;
    planId?: string;
    billingInterval?: string;
    interviewDate?: string;
    interviewTime?: string;
    qualitative?: any;
    address?: any;
    birthDate?: string;
    cpf?: string;
    /** Segredo TOTP já validado (em claro); é gravado cifrado */
    twoFactorSecret?: string | null;
  }, client?: PoolClient) {
    // Mesmo trim aplicado em authenticate(): senha com espaço nas pontas continua funcionando no login
    const password = typeof data.password === 'string' ? data.password.trim() : data.password;
    const normEmail = data.email.trim().toLowerCase();
    if (!isStrongPassword(password)) {
      throw new Error('WEAK_PASSWORD');
    }
    const hash = await bcrypt.hash(password, 10);
    const db = client ?? pool;
    const id = data.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const roleDb = data.role === 'criadora' ? 'MODELO' : 'AGENCIA';
    const now = new Date().toISOString();
    const statusDb = data.curationStatus || 'AGUARDANDO_REUNIAO';
    const phoneVal = data.whatsapp || data.phone || null;

    await initDatabase();

    const userObj = {
      id,
      email: normEmail,
      password_hash: hash,
      role: roleDb,
      curation_status: statusDb,
      full_name: data.fullName,
      phone: phoneVal,
      whatsapp: phoneVal,
      document_name: data.documentName,
      document_url: data.documentUrl,
      plan_id: data.planId,
      plan_billing_interval: data.billingInterval,
      interview_date: data.interviewDate,
      interview_time: data.interviewTime,
      interview_scheduled_at: data.interviewDate ? now : null,
      created_at: now,
    };
    void userObj;

    const existing = await db.query('SELECT 1 FROM users WHERE LOWER(email) = $1 LIMIT 1', [normEmail]);
    if (existing.rows.length > 0) {
      throw new Error('EMAIL_IN_USE');
    }

    const profileObj = {
      user_id: id,
      artistic_name: data.artisticName || data.fullName,
      category: data.category,
      instagram: data.instagram,
      gender: data.qualitative?.gender || null,
      birth_date: data.birthDate || null,
      document_number: data.cpf || null,
      bio: data.qualitative?.hobbies || null,
      hobbies: data.qualitative?.hobbies || null,
      exposure_opinion: data.qualitative?.exposureOpinion || null,
      measurements: data.qualitative?.measurements || null,
      physiognomy: data.qualitative?.physiognomy || null,
      address: data.address || null,
      monthly_revenue_estimate: data.qualitative?.monthlyRevenueEstimate || null,
      created_at: now,
    };
    void profileObj;

    try {
      await db.query(
        `INSERT INTO users (
           id, email, password_hash, role, curation_status, full_name,
           phone, whatsapp, document_name, document_url, plan_id,
           plan_billing_interval, interview_date, interview_time,
           interview_scheduled_at, two_factor_secret, two_factor_enabled, created_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())`,
        [
          id,
          normEmail,
          hash,
          roleDb,
          statusDb,
          data.fullName,
          phoneVal,
          phoneVal,
          data.documentName ? data.documentName.slice(0, 255) : null,
          // Data URLs (Base64) nunca vão para a coluna: o documento é persistido no vault R2
          data.documentUrl && !data.documentUrl.startsWith('data:') ? data.documentUrl : null,
          data.planId || null,
          data.billingInterval || null,
          data.interviewDate || null,
          data.interviewTime || null,
          data.interviewDate ? now : null,
          data.twoFactorSecret ? encryptTOTPSecret(data.twoFactorSecret) : null,
          !!data.twoFactorSecret,
        ]
      );

      await db.query(
        `INSERT INTO profiles (
           user_id, artistic_name, category, instagram, gender, birth_date,
           document_number, bio, hobbies, exposure_opinion, measurements,
           physiognomy, address, monthly_revenue_estimate, pre_interview, created_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
         ON CONFLICT (user_id) DO UPDATE SET 
           artistic_name = EXCLUDED.artistic_name,
           category = COALESCE(EXCLUDED.category, profiles.category),
           instagram = COALESCE(EXCLUDED.instagram, profiles.instagram),
           gender = COALESCE(EXCLUDED.gender, profiles.gender),
           birth_date = COALESCE(EXCLUDED.birth_date, profiles.birth_date),
           document_number = COALESCE(EXCLUDED.document_number, profiles.document_number),
           measurements = COALESCE(EXCLUDED.measurements, profiles.measurements),
           physiognomy = COALESCE(EXCLUDED.physiognomy, profiles.physiognomy),
           address = COALESCE(EXCLUDED.address, profiles.address),
           monthly_revenue_estimate = COALESCE(EXCLUDED.monthly_revenue_estimate, profiles.monthly_revenue_estimate),
           pre_interview = COALESCE(EXCLUDED.pre_interview, profiles.pre_interview)`,
        [
          id,
          data.artisticName || data.fullName,
          data.category || null,
          data.instagram || null,
          data.qualitative?.gender || null,
          data.birthDate || null,
          data.cpf || null,
          data.qualitative?.hobbies || null,
          data.qualitative?.hobbies || null,
          data.qualitative?.exposureOpinion || null,
          data.qualitative?.measurements ? JSON.stringify(data.qualitative.measurements) : null,
          data.qualitative?.physiognomy ? JSON.stringify(data.qualitative.physiognomy) : null,
          data.address ? JSON.stringify(data.address) : null,
          data.qualitative?.monthlyRevenueEstimate || null,
          // Ficha completa: as colunas acima não cobrem limites, objetivo, demais redes, disponibilidade etc.
          data.qualitative ? JSON.stringify(data.qualitative) : null,
        ]
      );
    } catch (err) {
      if ((err as { code?: string })?.code === '23505') {
        throw new Error('EMAIL_IN_USE');
      }
      console.error('[StorageService registerUser DB ERROR]:', err);
      throw new Error('DATABASE_UNAVAILABLE');
    }

    return { id, email: normEmail, role: roleDb, curation_status: statusDb, full_name: data.fullName };
  },

  async updateCurationStatus(userId: string, status: CurationStatusType, rejectionReason?: string): Promise<boolean> {
    let mappedStatus: CurationStatusType | string = status;
    if (status === 'approved') mappedStatus = 'APROVADO';
    else if (status === 'rejected') mappedStatus = 'REJEITADO';
    else if (status === 'submitted' || status === 'under_review') mappedStatus = 'EM_CURATORIA';
    return this.updateApplicationStatus(userId, mappedStatus, rejectionReason);
  },

  async updateUserLastSeen(userId: string): Promise<void> {
    if (!userId) return;
    try {
      await pool.query(
        'UPDATE users SET last_seen_at = NOW() WHERE id = $1',
        [userId]
      );
      await pool.query(
        'UPDATE admin_users SET updated_at = NOW() WHERE id = $1',
        [userId]
      );
      if (userId.startsWith('cur-') || userId.startsWith('admin-') || userId === '6f8d2da2-0df9-4dd2-8638-245c6f1f7dad') {
        await pool.query(
          'UPDATE users SET last_seen_at = NOW() WHERE id = \'admin-curadoria-1\' OR id = \'cur-admin-1\' OR id = \'6f8d2da2-0df9-4dd2-8638-245c6f1f7dad\''
        );
      }
    } catch {
      // Fallback tolerante se banco inacessível
    }

    // Atualiza também no fallbackStore
    for (const u of fallbackStore.users.values()) {
      const user = u as Record<string, any>;
      if (user.id === userId) {
        user.last_seen_at = new Date().toISOString();
        break;
      }
    }
  },

  async getUserById(userId: string) {
    await initDatabase();

    try {
      const res = await pool.query(`
        SELECT 
          u.id, u.email, u.full_name, u.role, u.curation_status, u.rejection_reason, u.created_at,
          p.user_id, p.avatar_url, p.photos, p.video_url, p.logo_url, p.artistic_name, p.category, p.gender,
          p.instagram, p.measurements, p.physiognomy, p.address, p.monthly_revenue_estimate, p.bio,
          p.exposure_opinion, p.accepts_offers, p.is_represented,
          p.represented_agency_name, p.represented_agency_id, p.corporate_name, p.responsible_name
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = $1
        LIMIT 1;
      `, [userId]);

      if (res.rows.length > 0) {
        const row = res.rows[0];
        const rawPhotos = Array.isArray(row.photos) ? row.photos : [];
        const avatarUrl = (row.avatar_url as string) || (rawPhotos.length > 0 && rawPhotos[0]?.url ? rawPhotos[0].url : '');
        const logoUrl = (row.logo_url as string) || '';

        const formattedProfile = {
          userId: row.id,
          avatarUrl,
          avatar_url: avatarUrl,
          logoUrl,
          logo_url: logoUrl,
          videoUrl: (row.video_url as string) || '',
          video_url: (row.video_url as string) || '',
          photos: rawPhotos,
          basicInfo: {
            fullName: row.full_name,
            email: row.email,
            address: (row.address as Record<string, unknown>) || { country: 'Brasil', state: 'SP', city: 'São Paulo' },
            corporateName: (row.corporate_name as string) || row.full_name,
            responsibleName: (row.responsible_name as string) || row.full_name,
          },
          qualitative: {
            artisticName: (row.artistic_name as string) || row.full_name,
            category: (row.category as string) || (row.role === 'MODELO' ? 'Modelo Editorial & Criadora VIP' : 'Agência de Casting'),
            gender: (row.gender as string) || 'Feminino',
            platforms: { instagram: (row.instagram as string) || '' },
            measurements: (row.measurements as Record<string, unknown>) || {},
            physiognomy: (row.physiognomy as Record<string, unknown>) || {},
            monthlyRevenueEstimate: (row.monthly_revenue_estimate as string) || 'Sob Consulta',
            bio: (row.bio as string) || '',
            exposureOpinion: (row.exposure_opinion as string) || '',
            personalLimits: (row.personal_limits as string) || '',
            mainGoal: (row.main_goal as string) || '',
            acceptsOffers: row.accepts_offers !== false,
            isRepresented: Boolean(row.is_represented),
            representedAgencyName: (row.represented_agency_name as string) || undefined,
            representedAgencyId: (row.represented_agency_id as string) || undefined,
          },
        };

        return {
          user: {
            id: row.id,
            email: row.email,
            name: row.full_name,
            role: row.role === 'MODELO' ? 'criadora' : row.role === 'ADMIN' ? 'admin' : 'agencia',
            curationStatus: row.curation_status,
            rejectionReason: row.rejection_reason || undefined,
            createdAt: row.created_at,
          },
          profile: formattedProfile,
        };
      }
    } catch (dbErr) {
      console.warn('Fallback para getUserById devido a erro no DB:', dbErr);
    }

    for (const u of fallbackStore.users.values()) {
      if (u.id === userId || u.email === userId) {
        const prof = (fallbackStore.profiles.get(u.id as string) as Record<string, unknown>) || {};
        const rawPhotos = (prof.photos as Array<{ id: string; url: string; title: string; tag?: string }>) || [];
        const avatarUrl = (prof.avatarUrl as string) || (prof.avatar_url as string) || (rawPhotos.length > 0 && rawPhotos[0]?.url ? rawPhotos[0].url : '');
        const logoUrl = (prof.logoUrl as string) || (prof.logo_url as string) || '';

        const formattedProfile = {
          ...prof,
          avatarUrl,
          avatar_url: avatarUrl,
          logoUrl,
          logo_url: logoUrl,
          videoUrl: (prof.videoUrl as string) || (prof.video_url as string) || '',
          video_url: (prof.videoUrl as string) || (prof.video_url as string) || '',
          photos: rawPhotos,
          basicInfo: {
            fullName: u.full_name,
            email: u.email,
            address: (prof.address as Record<string, unknown>) || { country: 'Brasil', state: 'SP', city: 'São Paulo' },
            corporateName: (prof.corporate_name as string) || u.full_name,
            responsibleName: (prof.responsible_name as string) || u.full_name,
          },
          qualitative: {
            artisticName: (prof.artistic_name as string) || (prof.artisticName as string) || u.full_name,
            category: (prof.category as string) || (u.role === 'MODELO' ? 'Modelo Editorial & Criadora VIP' : 'Agência de Casting'),
            gender: (prof.gender as string) || 'Feminino',
            platforms: { instagram: (prof.instagram as string) || '' },
            measurements: (prof.measurements as Record<string, unknown>) || {},
            physiognomy: (prof.physiognomy as Record<string, unknown>) || {},
            monthlyRevenueEstimate: (prof.monthly_revenue_estimate as string) || (prof.monthlyRevenueEstimate as string) || 'Sob Consulta',
            bio: (prof.bio as string) || '',
            exposureOpinion: (prof.exposure_opinion as string) || (prof.exposureOpinion as string) || '',
            personalLimits: (prof.personal_limits as string) || (prof.personalLimits as string) || '',
            mainGoal: (prof.main_goal as string) || (prof.mainGoal as string) || '',
            acceptsOffers: prof.accepts_offers !== false && prof.acceptsOffers !== false,
            isRepresented: Boolean(prof.is_represented || prof.isRepresented),
            representedAgencyName: (prof.represented_agency_name as string) || (prof.representedAgencyName as string) || undefined,
            representedAgencyId: (prof.represented_agency_id as string) || (prof.representedAgencyId as string) || undefined,
          },
        };

        return {
          user: {
            id: u.id as string,
            email: u.email as string,
            name: u.full_name as string,
            role: u.role === 'MODELO' ? 'criadora' : u.role === 'ADMIN' ? 'admin' : 'agencia',
            curationStatus: u.curation_status as 'EM_CURATORIA' | 'APROVADO' | 'REJEITADO',
            rejectionReason: (u.rejection_reason as string) || undefined,
            createdAt: u.created_at as string,
          },
          profile: formattedProfile,
        };
      }
    }

    return null;
  },

  async getCreatorById(id: string) {
    const data = await this.getUserById(id);
    return data?.profile || null;
  },

  async getAgencyById(id: string) {
    const data = await this.getUserById(id);
    return data?.profile || null;
  },

  /**
   * Atualização de Perfil e Book (Modelos & Agências)
   */
  async updateUserProfile(userId: string, _role: 'criadora' | 'agencia', updates: Record<string, unknown>) {
    await initDatabase();

    try {
      // 1. Atualiza na tabela users se houver nome
      const nameToUpdate = updates.fullName || updates.artisticName || updates.name || updates.responsibleName;
      if (nameToUpdate) {
        await pool.query(
          `UPDATE users SET full_name = $1, updated_at = NOW() WHERE id = $2`,
          [nameToUpdate, userId]
        );
      }

      // 2. Garante que o registro do perfil existe na tabela profiles
      await pool.query(
        `INSERT INTO profiles (user_id, created_at, updated_at) VALUES ($1, NOW(), NOW()) ON CONFLICT (user_id) DO NOTHING`,
        [userId]
      );

      // 3. Atualiza os campos na tabela profiles
      const profileUpdates: string[] = [];
      const params: unknown[] = [userId];

      if (updates.artisticName !== undefined) {
        params.push(updates.artisticName);
        profileUpdates.push(`artistic_name = $${params.length}`);
      }
      if (updates.corporateName !== undefined) {
        params.push(updates.corporateName);
        profileUpdates.push(`corporate_name = $${params.length}`);
      }
      if (updates.responsibleName !== undefined) {
        params.push(updates.responsibleName);
        profileUpdates.push(`responsible_name = $${params.length}`);
      }
      if (updates.avatarUrl !== undefined) {
        params.push(updates.avatarUrl);
        profileUpdates.push(`avatar_url = $${params.length}`);
      }
      if (updates.logoUrl !== undefined) {
        params.push(updates.logoUrl);
        profileUpdates.push(`logo_url = $${params.length}`);
      }
      if (updates.cnpj !== undefined) {
        params.push(updates.cnpj);
        profileUpdates.push(`cnpj = $${params.length}`);
      }
      if (updates.commissionRate !== undefined) {
        params.push(updates.commissionRate);
        profileUpdates.push(`commission_rate = $${params.length}`);
      }
      if (updates.specialties !== undefined) {
        params.push(JSON.stringify(updates.specialties));
        profileUpdates.push(`specialties = $${params.length}::jsonb`);
      }
      if (updates.category !== undefined) {
        params.push(updates.category);
        profileUpdates.push(`category = $${params.length}`);
      }
      if (updates.instagram !== undefined) {
        params.push(updates.instagram);
        profileUpdates.push(`instagram = $${params.length}`);
      }
      if (updates.bio !== undefined) {
        params.push(updates.bio);
        profileUpdates.push(`bio = $${params.length}`);
      }
      if (updates.hobbies !== undefined) {
        params.push(updates.hobbies);
        profileUpdates.push(`hobbies = $${params.length}`);
      }
      if (updates.exposureOpinion !== undefined) {
        params.push(updates.exposureOpinion);
        profileUpdates.push(`exposure_opinion = $${params.length}`);
      }
      if (updates.videoUrl !== undefined) {
        params.push(updates.videoUrl);
        profileUpdates.push(`video_url = $${params.length}`);
      }
      if (updates.monthlyRevenueEstimate !== undefined) {
        params.push(updates.monthlyRevenueEstimate);
        profileUpdates.push(`monthly_revenue_estimate = $${params.length}`);
      }
      if (updates.measurements !== undefined) {
        params.push(JSON.stringify(updates.measurements));
        profileUpdates.push(`measurements = $${params.length}::jsonb`);
      }
      if (updates.physiognomy !== undefined) {
        params.push(JSON.stringify(updates.physiognomy));
        profileUpdates.push(`physiognomy = $${params.length}::jsonb`);
      }
      if (updates.address !== undefined) {
        params.push(JSON.stringify(updates.address));
        profileUpdates.push(`address = $${params.length}::jsonb`);
      }
      if (updates.acceptsOffers !== undefined) {
        params.push(Boolean(updates.acceptsOffers));
        profileUpdates.push(`accepts_offers = $${params.length}`);
      }
      if (updates.isRepresented !== undefined) {
        params.push(Boolean(updates.isRepresented));
        profileUpdates.push(`is_represented = $${params.length}`);
      }
      if (updates.representedAgencyName !== undefined) {
        params.push(updates.representedAgencyName);
        profileUpdates.push(`represented_agency_name = $${params.length}`);
      }
      if (updates.representedAgencyId !== undefined) {
        params.push(updates.representedAgencyId);
        profileUpdates.push(`represented_agency_id = $${params.length}`);
      }
      if (updates.photos !== undefined) {
        params.push(JSON.stringify(updates.photos));
        profileUpdates.push(`photos = $${params.length}::jsonb`);
      }

      if (profileUpdates.length > 0) {
        profileUpdates.push(`updated_at = NOW()`);
        const query = `
          UPDATE profiles 
          SET ${profileUpdates.join(', ')}
          WHERE user_id = $1
        `;
        await pool.query(query, params);
      }
    } catch (err) {
      console.warn('Erro ao atualizar perfil no PostgreSQL:', err);
    }

    // Fallback store update
    for (const u of fallbackStore.users.values()) {
      if (u.id === userId) {
        const nameToUpdate = updates.fullName || updates.artisticName || updates.name || updates.responsibleName;
        if (nameToUpdate) {
          u.full_name = nameToUpdate as string;
        }
        break;
      }
    }

    const currentProfile = (fallbackStore.profiles.get(userId) as Record<string, unknown>) || { user_id: userId };
    const mergedProfile = {
      ...currentProfile,
      ...updates,
      user_id: userId,
      avatar_url: updates.avatarUrl !== undefined ? updates.avatarUrl : (currentProfile.avatar_url || currentProfile.avatarUrl),
      avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : (currentProfile.avatarUrl || currentProfile.avatar_url),
      logo_url: updates.logoUrl !== undefined ? updates.logoUrl : (currentProfile.logo_url || currentProfile.logoUrl),
      logoUrl: updates.logoUrl !== undefined ? updates.logoUrl : (currentProfile.logoUrl || currentProfile.logo_url),
      accepts_offers: updates.acceptsOffers !== undefined ? updates.acceptsOffers : (currentProfile.accepts_offers !== undefined ? currentProfile.accepts_offers : true),
      is_represented: updates.isRepresented !== undefined ? updates.isRepresented : Boolean(currentProfile.is_represented),
      represented_agency_name: updates.representedAgencyName || currentProfile.represented_agency_name || undefined,
      represented_agency_id: updates.representedAgencyId || currentProfile.represented_agency_id || undefined,
      measurements: { ...((currentProfile.measurements as Record<string, unknown>) || {}), ...((updates.measurements as Record<string, unknown>) || {}) },
      physiognomy: { ...((currentProfile.physiognomy as Record<string, unknown>) || {}), ...((updates.physiognomy as Record<string, unknown>) || {}) },
      address: { ...((currentProfile.address as Record<string, unknown>) || {}), ...((updates.address as Record<string, unknown>) || {}) },
      photos: updates.photos !== undefined ? updates.photos : (currentProfile.photos || []),
    };
    fallbackStore.profiles.set(userId, mergedProfile);

    return this.getUserById(userId);
  },

  /**
   * Listar todos os criadores aprovados
   */
  async listCreators(): Promise<Record<string, unknown>[]> {
    await initDatabase();
    try {
      const res = await pool.query(`
        SELECT ${CREATOR_CATALOG_COLUMNS}
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.role = 'MODELO' AND u.curation_status = 'APROVADO'
        ORDER BY u.created_at DESC;
      `);
      if (res.rows.length > 0) {
        return res.rows.map(mapCreatorCatalogRow);
      }
    } catch {
      // Fallback
    }

    const creators: Record<string, unknown>[] = [];
    for (const u of fallbackStore.users.values()) {
      if (u.role === 'MODELO' && u.curation_status === 'APROVADO') {
        const p = (fallbackStore.profiles.get(u.id as string) as Record<string, unknown>) || {};
        creators.push(mapCreatorCatalogRow({ ...p, ...u }));
      }
    }
    return creators;
  },

  /**
   * Listar todas as agências aprovadas
   */
  async listAgencies(): Promise<Record<string, unknown>[]> {
    await initDatabase();
    try {
      const res = await pool.query(`
        SELECT u.id, u.email, u.full_name, u.curation_status, u.created_at,
               p.corporate_name, p.responsible_name, p.category, p.cnpj, p.instagram,
               p.address, p.commission_rate, p.specialties, p.bio
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.role = 'AGENCIA' AND u.curation_status = 'APROVADO'
        ORDER BY u.created_at DESC;
      `);
      if (res.rows.length > 0) {
        return res.rows.map((row) => ({
          id: row.id,
          basicInfo: {
            corporateName: row.corporate_name || row.full_name,
            responsibleName: row.responsible_name || row.full_name,
            corporateEmail: row.email,
            cnpj: row.cnpj || '',
            address: row.address || { country: 'Brasil', state: 'SP', city: 'São Paulo' },
          },
          qualitative: {
            category: row.category || 'Agência de Casting & Modelos',
            commissionRate: row.commission_rate || '20%',
            specialties: row.specialties || ['Alta Moda', 'Editorial'],
            instagram: row.instagram || '',
            bio: row.bio || '',
          },
          curationStatus: row.curation_status,
          createdAt: row.created_at,
        }));
      }
    } catch {
      // Fallback
    }

    const agencies: Record<string, unknown>[] = [];
    for (const u of fallbackStore.users.values()) {
      if (u.role === 'AGENCIA' && u.curation_status === 'APROVADO') {
        const p = (fallbackStore.profiles.get(u.id as string) as Record<string, unknown>) || {};
        agencies.push({
          id: u.id,
          basicInfo: {
            corporateName: p.corporate_name || u.full_name,
            responsibleName: p.responsible_name || u.full_name,
            corporateEmail: u.email,
            cnpj: p.cnpj || '',
            address: p.address || { country: 'Brasil', state: 'SP', city: 'São Paulo' },
          },
          qualitative: {
            category: p.category || 'Agência de Casting & Modelos',
            commissionRate: p.commission_rate || '20%',
            specialties: p.specialties || ['Alta Moda', 'Editorial'],
            instagram: p.instagram || '',
            bio: p.bio || '',
          },
          curationStatus: u.curation_status,
          createdAt: u.created_at,
        });
      }
    }
    return agencies;
  },

  // ══════════════════════════════════════════════════════════════════
  // KANBAN CRUD
  // ══════════════════════════════════════════════════════════════════
  async listKanbanTasks(userId?: string) {
    await initDatabase();
    try {
      const res = await pool.query(
        userId
          ? 'SELECT * FROM kanban_tasks WHERE user_id = $1 ORDER BY created_at DESC'
          : 'SELECT * FROM kanban_tasks ORDER BY created_at DESC',
        userId ? [userId] : []
      );
      return res.rows.map((r) => ({
        id: r.id,
        title: r.title,
        agency: r.agency_name,
        priority: r.priority,
        date: r.due_date,
        column: r.column_status,
        createdAt: r.created_at,
      }));
    } catch {
      // Fallback para quando o banco estiver inacessível
    }

    const tasks = Array.from(fallbackStore.kanban_tasks.values());
    if (userId) {
      const filtered = tasks.filter((t) => t.user_id === userId);
      return filtered.map((t) => ({
        id: t.id as string,
        title: t.title as string,
        agency: (t.agency_name || t.agency) as string,
        priority: t.priority as string,
        date: (t.due_date || t.date) as string,
        column: (t.column_status || t.column) as string,
        createdAt: t.created_at as string,
      }));
    }
    return tasks.map((t) => ({
      id: t.id as string,
      title: t.title as string,
      agency: (t.agency_name || t.agency) as string,
      priority: t.priority as string,
      date: (t.due_date || t.date) as string,
      column: (t.column_status || t.column) as string,
      createdAt: t.created_at as string,
    }));
  },

  async createKanbanTask(data: {
    userId?: string;
    title: string;
    agencyName?: string;
    priority?: string;
    dueDate?: string;
    columnStatus?: string;
  }) {
    await initDatabase();
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const col = data.columnStatus || 'todo';
    const prio = data.priority || 'Normal';
    const agency = data.agencyName || 'Lumiardi Onboarding';
    const due = data.dueDate || 'Em aberto';

    try {
      await pool.query(
        `INSERT INTO kanban_tasks (id, user_id, title, agency_name, column_status, priority, due_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [id, data.userId || null, data.title, agency, col, prio, due]
      );
    } catch {
      // Fallback
    }

    const taskObj = {
      id,
      user_id: data.userId,
      title: data.title,
      agency_name: agency,
      column_status: col,
      priority: prio,
      due_date: due,
      created_at: new Date().toISOString(),
    };
    fallbackStore.kanban_tasks.set(id, taskObj);
    return {
      id,
      title: data.title,
      agency,
      priority: prio,
      date: due,
      column: col,
    };
  },

  async updateKanbanTask(id: string, updates: Partial<any>, userId?: string, isAdmin?: boolean) {
    await initDatabase();

    // Mapeia campos camelCase do JS para snake_case das colunas PostgreSQL
    const fieldMap: Record<string, string> = {
      columnStatus: 'column_status',
      agencyName: 'agency_name',
      dueDate: 'due_date',
      title: 'title',
      priority: 'priority',
    };

    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let i = 1;
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) {
          const col = fieldMap[k] || k; // traduz para snake_case se mapeado
          setClauses.push(`${col} = $${i}`);
          values.push(v);
          i++;
        }
      }
      if (setClauses.length > 0) {
        if (isAdmin) {
          values.push(id);
          await pool.query(
            `UPDATE kanban_tasks SET ${setClauses.join(', ')} WHERE id = $${i}`,
            values
          );
        } else if (userId) {
          values.push(id);
          values.push(userId);
          await pool.query(
            `UPDATE kanban_tasks SET ${setClauses.join(', ')} WHERE id = $${i} AND user_id = $${i + 1}`,
            values
          );
        }
      }
    } catch {
      // Fallback store para quando o DB estiver indisponível
    }

    // Atualiza também o fallback em memória
    const task = fallbackStore.kanban_tasks.get(id);
    if (task && (isAdmin || task.user_id === userId || task.userId === userId)) {
      Object.assign(task, updates);
      // Sincroniza snake_case no fallback para consistência
      if (updates.columnStatus) (task as any).column_status = updates.columnStatus;
      if (updates.agencyName) (task as any).agency_name = updates.agencyName;
      if (updates.dueDate) (task as any).due_date = updates.dueDate;
      fallbackStore.kanban_tasks.set(id, task);
    }
    return true;
  },

  async deleteKanbanTask(id: string, userId?: string, isAdmin?: boolean) {
    await initDatabase();
    try {
      if (isAdmin) {
        await pool.query('DELETE FROM kanban_tasks WHERE id = $1', [id]);
      } else if (userId) {
        await pool.query('DELETE FROM kanban_tasks WHERE id = $1 AND user_id = $2', [id, userId]);
      }
    } catch {
      // Fallback
    }
    const t = fallbackStore.kanban_tasks.get(id);
    if (t && (isAdmin || t.user_id === userId || t.userId === userId)) {
      fallbackStore.kanban_tasks.delete(id);
    }
    return true;
  },

  // ══════════════════════════════════════════════════════════════════
  // CHAT & MESSAGES CRUD
  // ══════════════════════════════════════════════════════════════════
  async listMessages(
    conversationId: string = 'curation',
    since?: string,
    requestUserId?: string,
    requestUserRole?: string,
    targetUserId?: string
  ) {
    await initDatabase();

    let sinceParam: string | null = null;
    if (since) {
      const sinceMs = new Date(since).getTime();
      sinceParam = !isNaN(sinceMs) ? new Date(sinceMs - 1000).toISOString() : since;
    }

    // Canal de Curadoria: a modelo vê apenas a própria conversa; o admin vê a conversa da candidata
    // selecionada (targetUserId) — TODAS as mensagens dela, enviadas pela modelo ou pela curadoria.
    // Sem targetUserId, o admin recebe o canal inteiro.
    const participantId =
      conversationId === 'curation'
        ? (requestUserRole === 'admin' ? targetUserId : requestUserId)
        : undefined;

    const columns =
      'id, sender_id, sender_name, sender_role, receiver_id, conversation_id, text, attachment_url, attachment_name, attachment_type, is_read, created_at';

    const conditions = ['conversation_id = $1'];
    const params: unknown[] = [conversationId];

    if (participantId) {
      params.push(participantId);
      // Mensagens da curadoria sem destinatário (avisos gerais) aceitam o papel canônico e o legado
      conditions.push(
        `(sender_id = $${params.length} OR receiver_id = $${params.length} OR (sender_role IN ('admin', 'curadoria') AND receiver_id IS NULL))`
      );
    }

    let query: string;
    if (sinceParam) {
      params.push(sinceParam);
      conditions.push(`created_at > $${params.length}`);
      query = `SELECT ${columns} FROM messages WHERE ${conditions.join(' AND ')} ORDER BY created_at ASC`;
    } else {
      query = `SELECT * FROM (
                 SELECT ${columns} FROM messages WHERE ${conditions.join(' AND ')}
                 ORDER BY created_at DESC LIMIT 100
               ) sub ORDER BY created_at ASC`;
    }

    // Falhas de banco são propagadas (a rota responde 5xx): nunca servir conversas de memória local,
    // que divergem entre instâncias e escondem mensagens reais.
    const res = await pool.query(query, params);

    return res.rows.map((m) => {
      const senderRole = normalizeSenderRole(m.sender_role, m.sender_id);
      return {
        id: m.id,
        senderId: m.sender_id,
        senderName: m.sender_name || (senderRole === 'admin' ? 'Mesa de Curadoria Lumiardi' : undefined),
        senderRole,
        receiverId: m.receiver_id,
        text: m.text,
        attachmentUrl: m.attachment_url,
        attachmentName: m.attachment_name,
        attachmentType: m.attachment_type,
        createdAt: m.created_at ? new Date(m.created_at).toISOString() : new Date().toISOString(),
        isRead: m.is_read,
      };
    });
  },

  /**
   * Marca como lidas as mensagens que o leitor acabou de receber (zera o contador de não lidas do admin).
   * - Admin abrindo a conversa de uma candidata: mensagens enviadas por ela no canal 'curation'.
   * - Modelo/agência no canal 'curation': respostas da curadoria para ela (ou avisos gerais).
   * - Conversa direta: mensagens destinadas ao leitor.
   */
  async markMessagesRead(params: {
    conversationId: string;
    viewerId: string;
    viewerRole: string;
    targetUserId?: string;
  }): Promise<void> {
    const { conversationId, viewerId, viewerRole, targetUserId } = params;
    await initDatabase();

    if (conversationId === 'curation') {
      if (viewerRole === 'admin') {
        if (!targetUserId) return;
        await pool.query(
          `UPDATE messages SET is_read = TRUE
           WHERE conversation_id = 'curation' AND sender_id = $1 AND is_read = FALSE`,
          [targetUserId]
        );
        return;
      }
      await pool.query(
        `UPDATE messages SET is_read = TRUE
         WHERE conversation_id = 'curation' AND is_read = FALSE AND sender_id <> $1
           AND (receiver_id = $1 OR (sender_role IN ('admin', 'curadoria') AND receiver_id IS NULL))`,
        [viewerId]
      );
      return;
    }

    await pool.query(
      `UPDATE messages SET is_read = TRUE
       WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [conversationId, viewerId]
    );
  },

  async getLastMessage(conversationId: string, userId?: string, role?: string): Promise<{ text: string; createdAt: string } | null> {
    await initDatabase();
    try {
      let res;
      if (conversationId === 'curation' && role !== 'admin' && userId) {
        res = await pool.query(
          `SELECT text, created_at FROM messages
           WHERE conversation_id = $1
             AND (sender_id = $2 OR receiver_id = $2 OR (sender_role IN ('admin', 'curadoria') AND receiver_id IS NULL))
           ORDER BY created_at DESC LIMIT 1`,
          [conversationId, userId]
        );
      } else {
        res = await pool.query(
          `SELECT text, created_at FROM messages
           WHERE conversation_id = $1
           ORDER BY created_at DESC LIMIT 1`,
          [conversationId]
        );
      }
      if (res && res.rows.length > 0) {
        return {
          text: res.rows[0].text,
          createdAt: res.rows[0].created_at ? new Date(res.rows[0].created_at).toISOString() : new Date().toISOString(),
        };
      }
    } catch {
      // Fallback
    }

    const fallbackMsgs = Array.from(fallbackStore.messages.values())
      .filter((m: any) => {
        if (m.conversation_id !== conversationId) return false;
        if (conversationId === 'curation' && role !== 'admin' && userId) {
          return (
            m.sender_id === userId ||
            m.receiver_id === userId ||
            (isAdminRole(m.sender_role) && !m.receiver_id)
          );
        }
        return true;
      })
      .sort((a: any, b: any) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime());

    if (fallbackMsgs.length > 0) {
      return {
        text: String(fallbackMsgs[0].text || ''),
        createdAt: String(fallbackMsgs[0].created_at || new Date().toISOString()),
      };
    }

    return null;
  },

  async sendMessage(data: {
    senderId: string;
    senderName?: string;
    senderRole?: string;
    receiverId?: string;
    conversationId: string;
    text: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
  }) {
    await initDatabase();
    const id = `msg-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // Se receiverId não foi fornecido e o canal for direto determinístico (conv_idA_idB), infere automaticamente
    let targetReceiverId = data.receiverId;
    if (!targetReceiverId && data.conversationId.startsWith('conv_')) {
      const parts = data.conversationId.slice(5).split('_');
      if (parts.length === 2) {
        targetReceiverId = parts[0] === data.senderId ? parts[1] : parts[0];
      }
    }

    // Papel canônico ('admin' | 'creator' | 'agencia'), nunca nulo
    const senderRole = normalizeSenderRole(data.senderRole, data.senderId);

    // Limites das colunas: valores maiores (ex.: MIME de .docx) não podem derrubar o INSERT
    const clip = (value: string | undefined | null, max: number) =>
      value ? String(value).slice(0, max) : null;

    // Sem fallback em memória: se o INSERT falhar, o erro sobe e a rota responde 5xx. Antes a mensagem
    // era guardada só na memória da instância, parecia enviada para a modelo e nunca chegava ao admin.
    const dbRes = await pool.query(
      `INSERT INTO messages (id, sender_id, sender_name, sender_role, receiver_id, conversation_id, text, attachment_url, attachment_name, attachment_type, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, NOW())
       RETURNING id, sender_id, sender_name, sender_role, receiver_id, conversation_id, text, attachment_url, attachment_name, attachment_type, is_read, created_at`,
      [
        id,
        data.senderId,
        clip(data.senderName, 255),
        senderRole,
        targetReceiverId || null,
        data.conversationId,
        data.text,
        data.attachmentUrl || null,
        clip(data.attachmentName, 255),
        clip(data.attachmentType, 255),
      ]
    );

    const row = dbRes.rows[0];
    return {
      id: row.id,
      senderId: row.sender_id,
      senderName: row.sender_name || data.senderName,
      senderRole: normalizeSenderRole(row.sender_role, row.sender_id),
      receiverId: row.receiver_id,
      conversationId: row.conversation_id,
      text: row.text,
      attachmentUrl: row.attachment_url,
      attachmentName: row.attachment_name,
      attachmentType: row.attachment_type,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      isRead: false,
    };
  },

  // ══════════════════════════════════════════════════════════════════
  // CONVERSATIONS — Lista dinâmica condicionada a contratos ativos e presença real
  // ══════════════════════════════════════════════════════════════════
  async listActiveConversations(userId: string, role: 'criadora' | 'agencia' | 'admin') {
    await initDatabase();

    const checkFallbackUserOnline = (targetId: string, windowMin: number = 3): boolean => {
      for (const u of fallbackStore.users.values()) {
        const user = u as Record<string, any>;
        if (user.id === targetId && user.last_seen_at) {
          const diff = Date.now() - new Date(user.last_seen_at).getTime();
          return diff <= windowMin * 60 * 1000;
        }
      }
      return false;
    };

    // 1. Presença Real da Curadoria (Mesa Oficial)
    let isCurationOnline = false;
    try {
      const curRes = await pool.query(
        `SELECT id FROM users
         WHERE (role ILIKE 'admin%' OR id LIKE 'admin-%' OR id LIKE 'cur-%' OR email LIKE '%curadoria%')
           AND last_seen_at IS NOT NULL
           AND last_seen_at > NOW() - INTERVAL '5 minutes'
         LIMIT 1`
      );
      if (curRes.rows.length > 0) {
        isCurationOnline = true;
      } else {
        const auRes = await pool.query(
          `SELECT id FROM admin_users
           WHERE updated_at > NOW() - INTERVAL '5 minutes'
           LIMIT 1`
        );
        isCurationOnline = auRes.rows.length > 0 || checkFallbackUserOnline('admin-curadoria-1', 5) || checkFallbackUserOnline('cur-admin-1', 5);
      }
    } catch {
      isCurationOnline = checkFallbackUserOnline('admin-curadoria-1', 5) || checkFallbackUserOnline('cur-admin-1', 5);
    }

    const lastCurationMsg = await this.getLastMessage('curation', userId, role);

    const curationChannel = {
      id: 'curation',
      partnerId: 'admin-curadoria-1',
      name: 'Mesa de Curadoria Lumiardi',
      avatarText: 'LM',
      subtitle: 'Suporte Oficial & Atendimento VIP',
      lastMessage: lastCurationMsg?.text || 'Canal direto com a equipe de Curadoria e Compliance.',
      lastTime: lastCurationMsg?.createdAt
        ? new Date(lastCurationMsg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : 'Hoje',
      unreadCount: 0,
      verified: true,
      isOnline: isCurationOnline,
    };

    if (role === 'admin') {
      return [curationChannel];
    }

    const directChannels: Array<{
      id: string;
      partnerId: string;
      name: string;
      avatarText: string;
      subtitle: string;
      lastMessage: string;
      lastTime: string;
      unreadCount: number;
      verified: boolean;
      isOnline: boolean;
    }> = [];

    // Busca contratos ativos no PostgreSQL com canal determinístico unificado
    try {
      let contractRows: Array<{
        agency_id: string; agency_name: string;
        model_id: string; model_name: string;
      }> = [];

      if (role === 'criadora') {
        const res = await pool.query(
          `SELECT amc.agency_id, amc.agency_name, amc.model_id, amc.model_name
           FROM agency_model_contracts amc
           WHERE amc.model_id = $1 AND amc.status = 'active'`,
          [userId]
        );
        contractRows = res.rows;
      } else if (role === 'agencia') {
        const res = await pool.query(
          `SELECT amc.agency_id, amc.agency_name, amc.model_id, amc.model_name
           FROM agency_model_contracts amc
           WHERE amc.agency_id = $1 AND amc.status = 'active'`,
          [userId]
        );
        contractRows = res.rows;
      }

      // 2. Inclui canais de Propostas de Scouting existentes (mesmo antes da assinatura do contrato)
      try {
        const scoutQuery = role === 'criadora'
          ? `SELECT agency_id, agency_name, model_id, model_name FROM scout_proposals WHERE model_id = $1`
          : `SELECT agency_id, agency_name, model_id, model_name FROM scout_proposals WHERE agency_id = $1`;
        const scoutRes = await pool.query(scoutQuery, [userId]);
        for (const sr of scoutRes.rows) {
          if (!contractRows.some((cr) => cr.agency_id === sr.agency_id && cr.model_id === sr.model_id)) {
            contractRows.push(sr);
          }
        }
      } catch {}

      // Mapeia canais determinísticos com getDirectConversationId
      const convMap = new Map<string, { partnerId: string; partnerName: string; subtitle: string }>();
      for (const row of contractRows) {
        const convId = getDirectConversationId(row.agency_id, row.model_id);
        const partnerId = role === 'criadora' ? row.agency_id : row.model_id;
        const partnerName = role === 'criadora' ? row.agency_name : row.model_name;
        convMap.set(convId, {
          partnerId,
          partnerName,
          subtitle: role === 'criadora' ? 'Agência Parceira Oficial' : 'Modelo Representada',
        });
      }

      // Consulta de presença real dos parceiros (ativos nos últimos 3 minutos)
      const partnerIds = Array.from(new Set(Array.from(convMap.values()).map((m) => m.partnerId)));
      const onlineStatusMap = new Map<string, boolean>();
      if (partnerIds.length > 0) {
        try {
          const presRes = await pool.query(
            `SELECT id, (last_seen_at IS NOT NULL AND last_seen_at > NOW() - INTERVAL '3 minutes') AS is_online
             FROM users
             WHERE id = ANY($1)`,
            [partnerIds]
          );
          for (const row of presRes.rows) {
            onlineStatusMap.set(row.id, Boolean(row.is_online));
          }
        } catch {
          // Fallback presença
        }
      }

      // Busca as mensagens mais recentes de todos os canais de uma só vez (elimina N+1 queries)
      const convIds = Array.from(convMap.keys());
      const latestMsgsByConv = new Map<string, { text: string; createdAt: string }>();
      if (convIds.length > 0) {
        const msgRes = await pool.query(
          `SELECT DISTINCT ON (conversation_id) conversation_id, text, created_at
           FROM messages
           WHERE conversation_id = ANY($1)
           ORDER BY conversation_id, created_at DESC`,
          [convIds]
        );
        for (const m of msgRes.rows) {
          latestMsgsByConv.set(m.conversation_id, { text: m.text, createdAt: m.created_at });
        }
      }

      for (const [convId, meta] of convMap.entries()) {
        const initials = meta.partnerName
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((n: string) => n[0].toUpperCase())
          .join('');

        const lastMsg = latestMsgsByConv.get(convId);
        const isOnline = onlineStatusMap.has(meta.partnerId)
          ? Boolean(onlineStatusMap.get(meta.partnerId))
          : checkFallbackUserOnline(meta.partnerId, 3);

        directChannels.push({
          id: convId,
          partnerId: meta.partnerId,
          name: meta.partnerName,
          avatarText: initials || 'AG',
          subtitle: meta.subtitle,
          lastMessage: lastMsg?.text || 'Canal criptografado ativo.',
          lastTime: lastMsg?.createdAt
            ? new Date(lastMsg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            : 'Hoje',
          unreadCount: 0,
          verified: true,
          isOnline,
        });
      }

      return [curationChannel, ...directChannels];
    } catch {
      // Fallback store
    }

    // Fallback: verificar contratos no fallbackStore
    for (const contract of fallbackStore.agency_model_contracts.values()) {
      const c = contract as Record<string, unknown>;
      if (c.status !== 'active') continue;

      const isRelevant =
        (role === 'criadora' && c.model_id === userId) ||
        (role === 'agencia' && c.agency_id === userId);

      if (!isRelevant) continue;

      const partnerId = String(role === 'criadora' ? c.agency_id : c.model_id);
      const partnerName = String(role === 'criadora' ? c.agency_name : c.model_name);
      const convId = getDirectConversationId(String(c.agency_id), String(c.model_id));

      const initials = partnerName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n: string) => n[0].toUpperCase())
        .join('');

      const lastMsg = await this.getLastMessage(convId, userId, role);
      const isOnline = checkFallbackUserOnline(partnerId, 3);

      directChannels.push({
        id: convId,
        partnerId,
        name: partnerName,
        avatarText: initials || 'AG',
        subtitle: role === 'criadora' ? 'Agência Parceira Oficial' : 'Modelo Representada',
        lastMessage: lastMsg?.text || 'Canal criptografado ativo.',
        lastTime: lastMsg?.createdAt
          ? new Date(lastMsg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          : 'Hoje',
        unreadCount: 0,
        verified: true,
        isOnline,
      });
    }

    return [curationChannel, ...directChannels];
  },

  // ══════════════════════════════════════════════════════════════════
  // DRIVE FILES CRUD
  // ══════════════════════════════════════════════════════════════════
  async listDriveFiles(userId?: string) {
    await initDatabase();
    const mockNames = new Set([
      'Manual_de_Compliance_e_Diretrizes_Lumiardi.pdf',
      'Modelo_Padrao_NDA_Blindagem_de_Imagem.pdf',
    ]);

    const officialDoc = {
      id: `official-termos-${userId || 'root'}`,
      name: 'Termos_de_Uso_e_Diretrizes_Lumiardi.pdf',
      category: 'contracts',
      type: 'document',
      size: '1.2 MB',
      uploadedBy: 'Lumiardi Compliance Oficial',
      fileUrl: '/documents/Termos_de_Uso_e_Diretrizes_Lumiardi.pdf',
      downloads: 0,
      privacy: 'official',
      isOfficial: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    let files: Array<{
      id: string;
      name: string;
      category: string;
      type: string;
      size: string;
      uploadedBy: string;
      fileUrl: string;
      downloads: number;
      privacy: string;
      isOfficial?: boolean;
      createdAt: string;
    }> = [];

    try {
      const res = await pool.query(
        userId
          ? 'SELECT * FROM drive_files WHERE user_id = $1 OR privacy = \'public\' ORDER BY created_at DESC'
          : 'SELECT * FROM drive_files ORDER BY created_at DESC',
        userId ? [userId] : []
      );
      if (res.rows.length > 0) {
        files = res.rows
          .filter((f) => !mockNames.has(f.name))
          .map((f) => ({
            id: f.id,
            name: f.name,
            category: f.category,
            type: f.type,
            size: f.size,
            uploadedBy: f.uploaded_by,
            fileUrl: f.file_url,
            downloads: f.downloads,
            privacy: f.privacy,
            isOfficial: Boolean(f.is_official || f.name === 'Termos_de_Uso_e_Diretrizes_Lumiardi.pdf'),
            createdAt: f.created_at,
          }));
      }
    } catch {
      // Fallback
    }

    if (files.length === 0) {
      const allFiles = Array.from(fallbackStore.drive_files.values());
      const rawFallback = userId
        ? allFiles.filter((f) => f.user_id === userId)
        : allFiles;

      files = rawFallback
        .filter((f) => !mockNames.has(String(f.name)))
        .map((f) => ({
          id: f.id as string,
          name: f.name as string,
          category: f.category as string,
          type: f.type as string,
          size: f.size as string,
          uploadedBy: (f.uploaded_by || f.uploadedBy) as string,
          fileUrl: (f.file_url || f.fileUrl) as string,
          downloads: Number(f.downloads || 0),
          privacy: f.privacy as string,
          isOfficial: Boolean(f.is_official || (f as any).isOfficial || f.name === 'Termos_de_Uso_e_Diretrizes_Lumiardi.pdf'),
          createdAt: f.created_at as string,
        }));
    }

    // Garante que o documento oficial obrigatório está sempre presente
    const hasOfficial = files.some((f) => f.name === 'Termos_de_Uso_e_Diretrizes_Lumiardi.pdf');
    if (!hasOfficial) {
      files.unshift(officialDoc);
    }

    return files;
  },

  async saveDriveFile(data: {
    userId?: string;
    name: string;
    category?: string;
    type?: string;
    size?: string;
    uploadedBy?: string;
    fileUrl: string;
    privacy?: string;
    isOfficial?: boolean;
  }) {
    await initDatabase();
    const id = `drive-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const category = data.category || 'raw-photos';
    const type = data.type || 'image';
    const size = data.size || '1.0 MB';
    const uploadedBy = data.uploadedBy || 'Você';
    const privacy = data.privacy || 'agency-only';
    const isOfficial = Boolean(data.isOfficial);
    const now = new Date().toISOString();

    try {
      await pool.query(
        `INSERT INTO drive_files (id, user_id, name, category, type, size, uploaded_by, file_url, downloads, privacy, is_official, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, NOW())`,
        [id, data.userId || null, data.name, category, type, size, uploadedBy, data.fileUrl, privacy, isOfficial]
      );
    } catch {
      // Fallback
    }

    const fileObj = {
      id,
      user_id: data.userId,
      name: data.name,
      category,
      type,
      size,
      uploaded_by: uploadedBy,
      file_url: data.fileUrl,
      downloads: 0,
      privacy,
      is_official: isOfficial,
      created_at: now,
    };
    fallbackStore.drive_files.set(id, fileObj);

    return {
      id,
      name: data.name,
      category,
      type,
      size,
      uploadedBy,
      fileUrl: data.fileUrl,
      downloads: 0,
      privacy,
      isOfficial,
      createdAt: now,
    };
  },

  async deleteDriveFile(id: string, userId?: string, isAdmin?: boolean) {
    if (id.startsWith('official-')) {
      return false; // Documento oficial protegido contra exclusão
    }
    await initDatabase();
    try {
      const checkRes = await pool.query('SELECT name, is_official FROM drive_files WHERE id = $1', [id]);
      if (checkRes.rows.length > 0) {
        if (checkRes.rows[0].is_official || checkRes.rows[0].name === 'Termos_de_Uso_e_Diretrizes_Lumiardi.pdf') {
          return false;
        }
      }

      if (isAdmin) {
        await pool.query('DELETE FROM drive_files WHERE id = $1', [id]);
      } else if (userId) {
        await pool.query('DELETE FROM drive_files WHERE id = $1 AND user_id = $2', [id, userId]);
      }
    } catch {
      // Fallback
    }
    const f = fallbackStore.drive_files.get(id);
    if (f && (isAdmin || f.user_id === userId)) {
      if (f.name === 'Termos_de_Uso_e_Diretrizes_Lumiardi.pdf' || (f as any).is_official) {
        return false;
      }
      fallbackStore.drive_files.delete(id);
    }
    return true;
  },

  async incrementDriveDownloads(id: string) {
    await initDatabase();
    try {
      await pool.query('UPDATE drive_files SET downloads = downloads + 1 WHERE id = $1', [id]);
    } catch {
      // Fallback
    }
    const f = fallbackStore.drive_files.get(id);
    if (f) {
      f.downloads = (Number(f.downloads) || 0) + 1;
      fallbackStore.drive_files.set(id, f);
    }
    return true;
  },

  parseSizeToBytes(sizeStr: string): number {
    if (!sizeStr) return 0;
    const clean = sizeStr.trim().toUpperCase();
    if (clean.endsWith('GB')) {
      return (parseFloat(clean) || 0) * 1024 * 1024 * 1024;
    }
    if (clean.endsWith('MB')) {
      return (parseFloat(clean) || 0) * 1024 * 1024;
    }
    if (clean.endsWith('KB')) {
      return (parseFloat(clean) || 0) * 1024;
    }
    if (clean.endsWith('B')) {
      return parseFloat(clean) || 0;
    }
    return parseFloat(clean) || 0;
  },

  async getUserDriveUsage(userId: string): Promise<{ totalBytes: number; totalGB: number; fileCount: number }> {
    const files = await this.listDriveFiles(userId);
    let totalBytes = 0;
    for (const f of files) {
      totalBytes += this.parseSizeToBytes(f.size);
    }
    const totalGB = totalBytes / (1024 * 1024 * 1024);
    return {
      totalBytes,
      totalGB: Number(totalGB.toFixed(2)),
      fileCount: files.length,
    };
  },

  /**
   * Cálculo de cota total consumida pela Agência (arquivos privados + todos os compartilhados de suas modelos)
   */
  async getAgencyTotalDriveUsage(agencyId: string): Promise<{ totalBytes: number; totalGB: number; fileCount: number }> {
    await initDatabase();
    let totalBytes = 0;
    let fileCount = 0;

    try {
      // 1. Arquivos privados da agência
      const privRes = await pool.query('SELECT size FROM drive_files WHERE user_id = $1', [agencyId]);
      for (const row of privRes.rows) {
        totalBytes += this.parseSizeToBytes(row.size);
        fileCount++;
      }

      // 2. Arquivos compartilhados onde a agência é a contratante responsável
      const sharedRes = await pool.query('SELECT size FROM shared_drive_files WHERE agency_id = $1', [agencyId]);
      for (const row of sharedRes.rows) {
        totalBytes += this.parseSizeToBytes(row.size);
        fileCount++;
      }

      const totalGB = Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2));
      return { totalBytes, totalGB, fileCount };
    } catch {
      // Fallback
    }

    for (const f of fallbackStore.drive_files.values()) {
      if (f.user_id === agencyId) {
        totalBytes += this.parseSizeToBytes(String(f.size || ''));
        fileCount++;
      }
    }
    for (const sf of fallbackStore.shared_drive_files.values()) {
      const sAgencyId = sf.agency_id || (sf as any).agencyId;
      if (sAgencyId === agencyId) {
        totalBytes += this.parseSizeToBytes(String(sf.size || ''));
        fileCount++;
      }
    }

    const totalGB = Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2));
    return { totalBytes, totalGB, fileCount };
  },

  async saveCreator(creatorData: Partial<CompleteCreatorProfile> & { planId?: string; billingInterval?: string; twoFactorSecret?: string | null }): Promise<CompleteCreatorProfile> {
    // O id é sempre gerado no servidor: nunca aceitar id vindo do cliente (evita sobrescrever contas)
    const id = `creator-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const fullProfile: CompleteCreatorProfile = {
      id,
      basicInfo: creatorData.basicInfo || ({} as CompleteCreatorProfile['basicInfo']),
      qualitative: creatorData.qualitative || ({} as CompleteCreatorProfile['qualitative']),
      appointment: creatorData.appointment || {
        date: now.split('T')[0],
        timeSlot: '14:00',
        status: 'scheduled',
      },
      curationStatus: (creatorData.curationStatus as CurationStatusType) || 'AGUARDANDO_REUNIAO',
      createdAt: creatorData.createdAt || now,
      updatedAt: now,
    };

    // Conta + entrevista são atômicas: se a entrevista falhar, o usuário é desfeito (e-mail não fica "preso")
    const user = await withTransaction(async (client) => {
      const created = await this.registerUser({
        id,
        email: fullProfile.basicInfo.email,
        password: fullProfile.basicInfo.password,
        fullName: fullProfile.basicInfo.fullName,
        role: 'criadora',
        artisticName: fullProfile.qualitative.artisticName,
        category: fullProfile.qualitative.category,
        instagram: fullProfile.qualitative.platforms?.instagram,
        documentName: fullProfile.basicInfo.document?.fileName || (fullProfile.basicInfo.document as any)?.name || 'documento_identidade.jpg',
        documentUrl: fullProfile.basicInfo.document?.fileUrl || fullProfile.basicInfo.document?.fileData || (fullProfile.basicInfo.document as any)?.url || '',
        whatsapp: fullProfile.basicInfo.whatsapp || fullProfile.basicInfo.phone,
        phone: fullProfile.basicInfo.phone || fullProfile.basicInfo.whatsapp,
        curationStatus: fullProfile.curationStatus,
        planId: creatorData.planId || 'glow',
        billingInterval: creatorData.billingInterval || 'monthly',
        interviewDate: fullProfile.appointment?.date,
        interviewTime: fullProfile.appointment?.timeSlot,
        qualitative: fullProfile.qualitative,
        address: fullProfile.basicInfo.address,
        birthDate: fullProfile.basicInfo.birthDate,
        cpf: fullProfile.basicInfo.cpf,
        twoFactorSecret: creatorData.twoFactorSecret,
      }, client);

      if (fullProfile.appointment?.date) {
        await this.saveInterview({
          userId: created.id,
          fullName: fullProfile.basicInfo.fullName,
          artisticName: fullProfile.qualitative.artisticName,
          email: fullProfile.basicInfo.email,
          whatsapp: fullProfile.basicInfo.whatsapp || fullProfile.basicInfo.phone || '',
          planId: creatorData.planId || 'glow',
          billingInterval: creatorData.billingInterval || 'monthly',
          interviewDate: fullProfile.appointment.date,
          interviewTime: fullProfile.appointment.timeSlot,
          status: 'aguardando_reuniao',
          notes: fullProfile.appointment.notes,
        }, client);
      }
      return created;
    });

    fullProfile.id = user.id;
    return fullProfile;
  },

  async saveAgency(agencyData: Partial<CompleteAgencyProfile> & { twoFactorSecret?: string | null }): Promise<CompleteAgencyProfile> {
    const id = `agency-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const fullProfile: CompleteAgencyProfile = {
      id,
      basicInfo: agencyData.basicInfo || ({} as CompleteAgencyProfile['basicInfo']),
      qualitative: agencyData.qualitative || ({} as CompleteAgencyProfile['qualitative']),
      curationStatus: (agencyData.curationStatus as CurationStatusType) || 'AGUARDANDO_REUNIAO',
      createdAt: agencyData.createdAt || now,
      updatedAt: now,
    };

    // users + profiles na mesma transação: falha parcial não deixa conta órfã
    const user = await withTransaction((client) => this.registerUser({
      id,
      email: fullProfile.basicInfo.corporateEmail,
      password: fullProfile.basicInfo.password,
      fullName: fullProfile.basicInfo.responsibleName,
      role: 'agencia',
      instagram: fullProfile.qualitative.instagram,
      documentName: fullProfile.basicInfo.document?.fileName || (fullProfile.basicInfo.document as any)?.name || 'contrato_social.pdf',
      documentUrl: fullProfile.basicInfo.document?.fileUrl || fullProfile.basicInfo.document?.fileData || (fullProfile.basicInfo.document as any)?.url || '',
      whatsapp: fullProfile.basicInfo.whatsapp || fullProfile.basicInfo.phone,
      phone: fullProfile.basicInfo.phone || fullProfile.basicInfo.whatsapp,
      curationStatus: fullProfile.curationStatus,
      twoFactorSecret: agencyData.twoFactorSecret,
    }, client));

    fullProfile.id = user.id;
    return fullProfile;
  },

  async saveInterview(interviewData: {
    id?: string;
    userId: string;
    fullName: string;
    artisticName?: string;
    email: string;
    whatsapp: string;
    planId: string;
    billingInterval?: string;
    interviewDate: string;
    interviewTime: string;
    status?: string;
    photoUrl?: string;
    notes?: string;
  }, client?: PoolClient): Promise<CurationInterview> {
    await initDatabase();
    const id = interviewData.id || `interview-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const interviewObj: CurationInterview = {
      id,
      userId: interviewData.userId,
      fullName: interviewData.fullName,
      artisticName: interviewData.artisticName,
      email: interviewData.email,
      whatsapp: interviewData.whatsapp,
      planId: interviewData.planId,
      billingInterval: interviewData.billingInterval || 'monthly',
      interviewDate: interviewData.interviewDate,
      interviewTime: interviewData.interviewTime,
      status: (interviewData.status as any) || 'aguardando_reuniao',
      photoUrl: interviewData.photoUrl,
      notes: interviewData.notes,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await (client ?? pool).query(
        `INSERT INTO curation_interviews (
           id, user_id, full_name, artistic_name, email, whatsapp,
           plan_id, billing_interval, interview_date, interview_time,
           status, photo_url, notes, created_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           interview_date = EXCLUDED.interview_date,
           interview_time = EXCLUDED.interview_time,
           status = EXCLUDED.status,
           whatsapp = EXCLUDED.whatsapp,
           updated_at = NOW()`,
        [
          id,
          interviewData.userId,
          interviewData.fullName,
          interviewData.artisticName || null,
          interviewData.email,
          interviewData.whatsapp,
          interviewData.planId,
          interviewData.billingInterval || 'monthly',
          interviewData.interviewDate,
          interviewData.interviewTime,
          interviewData.status || 'aguardando_reuniao',
          interviewData.photoUrl || null,
          interviewData.notes || null,
        ]
      );
    } catch (err) {
      console.error('[StorageService saveInterview DB ERROR]:', err);
      // Dentro de transação (cadastro) a falha precisa abortar tudo para o ROLLBACK
      if (client) throw new Error('DATABASE_UNAVAILABLE');
    }

    fallbackStore.curation_interviews.set(id, interviewObj as any);
    fallbackStore.curation_interviews.set(`user_${interviewData.userId}`, interviewObj as any);

    return interviewObj;
  },

  async getInterviews(filter?: { status?: string; date?: string }): Promise<CurationInterview[]> {
    await initDatabase();
    try {
      let query = `
        SELECT 
          ci.*,
          p.avatar_url, p.photos
        FROM curation_interviews ci
        LEFT JOIN profiles p ON ci.user_id = p.user_id
      `;
      const conditions: string[] = [];
      const values: any[] = [];

      if (filter?.status && filter.status !== 'ALL') {
        values.push(filter.status);
        conditions.push(`ci.status = $${values.length}`);
      }
      if (filter?.date) {
        values.push(filter.date);
        conditions.push(`ci.interview_date = $${values.length}`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY ci.interview_date ASC, ci.interview_time ASC`;

      const res = await pool.query(query, values);
      if (res.rows.length > 0) {
        return res.rows.map((r) => {
          const rawPhotos = Array.isArray(r.photos) ? r.photos : [];
          const photoUrl = r.photo_url || r.avatar_url || (rawPhotos[0]?.url || '');
          let dateStr = r.interview_date;
          if (dateStr instanceof Date) {
            dateStr = dateStr.toISOString().split('T')[0];
          } else if (typeof dateStr === 'string' && dateStr.includes('T')) {
            dateStr = dateStr.split('T')[0];
          }
          return {
            id: r.id,
            userId: r.user_id,
            fullName: r.full_name,
            artisticName: r.artistic_name,
            email: r.email,
            whatsapp: r.whatsapp,
            planId: r.plan_id,
            billingInterval: r.billing_interval,
            interviewDate: String(dateStr),
            interviewTime: r.interview_time,
            status: r.status,
            rejectionReason: r.rejection_reason,
            approvedBy: r.approved_by,
            approvedAt: r.approved_at,
            rejectedBy: r.rejected_by,
            rejectedAt: r.rejected_at,
            notes: r.notes,
            photoUrl,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          };
        });
      }
    } catch (err) {
      console.error('[StorageService getInterviews DB ERROR]:', err);
    }

    // Fallback store
    const list: CurationInterview[] = [];
    for (const [key, val] of fallbackStore.curation_interviews.entries()) {
      if (key.startsWith('user_')) continue;
      const item = val as unknown as CurationInterview;
      if (filter?.status && filter.status !== 'ALL' && item.status !== filter.status) continue;
      if (filter?.date && item.interviewDate !== filter.date) continue;
      list.push(item);
    }
    return list.sort((a, b) => `${a.interviewDate} ${a.interviewTime}`.localeCompare(`${b.interviewDate} ${b.interviewTime}`));
  },

  async updateInterviewStatus(
    userIdOrInterviewId: string,
    status: 'aguardando_reuniao' | 'confirmada' | 'realizada' | 'aprovada' | 'recusada',
    reason?: string,
    curatorId?: string
  ): Promise<boolean> {
    await initDatabase();
    const now = new Date().toISOString();
    try {
      if (status === 'aprovada') {
        await pool.query(
          `UPDATE curation_interviews 
           SET status = $1, approved_by = $2, approved_at = NOW(), updated_at = NOW() 
           WHERE id = $3 OR user_id = $3`,
          [status, curatorId || 'curadoria', userIdOrInterviewId]
        );
      } else if (status === 'recusada') {
        await pool.query(
          `UPDATE curation_interviews 
           SET status = $1, rejected_by = $2, rejected_at = NOW(), rejection_reason = $3, updated_at = NOW() 
           WHERE id = $4 OR user_id = $4`,
          [status, curatorId || 'curadoria', reason || null, userIdOrInterviewId]
        );
      } else {
        await pool.query(
          `UPDATE curation_interviews 
           SET status = $1, updated_at = NOW() 
           WHERE id = $2 OR user_id = $2`,
          [status, userIdOrInterviewId]
        );
      }
    } catch {
      // Fallback
    }

    for (const item of fallbackStore.curation_interviews.values()) {
      const interview = item as unknown as CurationInterview;
      if (interview.id === userIdOrInterviewId || interview.userId === userIdOrInterviewId) {
        interview.status = status;
        if (status === 'aprovada') {
          interview.approvedBy = curatorId || 'curadoria';
          interview.approvedAt = now;
        } else if (status === 'recusada') {
          interview.rejectedBy = curatorId || 'curadoria';
          interview.rejectedAt = now;
          interview.rejectionReason = reason;
        }
        interview.updatedAt = now;
      }
    }

    return true;
  },

  /** Verifica se já existe conta (de qualquer tipo) com o e-mail informado. */
  async emailExists(email: string): Promise<boolean> {
    await initDatabase();
    const res = await pool.query('SELECT 1 FROM users WHERE LOWER(email) = $1 LIMIT 1', [email.trim().toLowerCase()]);
    return res.rows.length > 0;
  },

  async findCreatorByEmail(email: string) {
    return (await this.emailExists(email)) ? { email } : null;
  },

  async findAgencyByEmail(email: string) {
    return (await this.emailExists(email)) ? { email } : null;
  },

  /**
   * Catálogo filtrado direto no PostgreSQL (somente modelos aprovadas). Erros de banco sobem para a rota.
   */
  async filterCreators(query: CreatorFilterQuery = {}): Promise<Record<string, unknown>[]> {
    await initDatabase();

    const conditions = [`u.role = 'MODELO'`, `u.curation_status = 'APROVADO'`];
    const params: unknown[] = [];
    const where = (build: (param: string) => string, value: unknown) => {
      params.push(value);
      conditions.push(build(`$${params.length}`));
    };
    const lowerList = (values?: string[]) =>
      (values || []).map((v) => String(v).trim().toLowerCase()).filter(Boolean);
    // Altura gravada como texto livre ("175", "1,75", "175 cm"): extrai só os dígitos
    const heightCm = `NULLIF(regexp_replace(COALESCE(p.measurements->>'height', ''), '[^0-9]', '', 'g'), '')::numeric`;

    const categories = lowerList(query.category);
    if (categories.length) where((p) => `LOWER(p.category) = ANY(${p}::text[])`, categories);
    const genders = lowerList(query.gender);
    if (genders.length) where((p) => `LOWER(p.gender) = ANY(${p}::text[])`, genders);
    const hair = lowerList(query.hairColor);
    if (hair.length) where((p) => `LOWER(p.physiognomy->>'hairColor') = ANY(${p}::text[])`, hair);
    const eyes = lowerList(query.eyeColor);
    if (eyes.length) where((p) => `LOWER(p.physiognomy->>'eyeColor') = ANY(${p}::text[])`, eyes);
    const skin = lowerList(query.skinTone);
    if (skin.length) where((p) => `LOWER(p.physiognomy->>'skinTone') = ANY(${p}::text[])`, skin);
    if (typeof query.minHeight === 'number' && Number.isFinite(query.minHeight)) {
      where((p) => `${heightCm} >= ${p}`, query.minHeight);
    }
    if (typeof query.maxHeight === 'number' && Number.isFinite(query.maxHeight)) {
      where((p) => `${heightCm} <= ${p}`, query.maxHeight);
    }
    if (query.country) where((p) => `LOWER(p.address->>'country') = LOWER(${p})`, query.country.trim());
    if (query.state) where((p) => `LOWER(p.address->>'state') = LOWER(${p})`, query.state.trim());
    if (query.searchTerm) {
      where(
        (p) => `(p.artistic_name ILIKE ${p} OR p.address->>'city' ILIKE ${p} OR p.category ILIKE ${p})`,
        `%${query.searchTerm.trim().replace(/[%_\\]/g, '\\$&')}%`
      );
    }

    const res = await pool.query(
      `SELECT ${CREATOR_CATALOG_COLUMNS}
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY u.created_at DESC
       LIMIT 500`,
      params
    );
    return res.rows.map(mapCreatorCatalogRow);
  },

  // ══════════════════════════════════════════════════════════════════
  // DRIVE COMPARTILHADO (MODELO ↔ AGÊNCIA)
  // ══════════════════════════════════════════════════════════════════
  async listSharedDriveFiles(params: { agencyId?: string; modelId?: string; currentUserId?: string }): Promise<SharedDriveItem[]> {
    await initDatabase();
    const mockNames = new Set([
      'Contrato_Agenciamento_Exclusivo_2026.pdf',
      'Composto_Digital_Alta_Moda_SS26.pdf',
      'Ensaio_Milan_Look01_RAW_Master.jpg',
      'Manual_de_Compliance_e_Diretrizes_Lumiardi.pdf',
      'Modelo_Padrao_NDA_Blindagem_de_Imagem.pdf',
    ]);

    try {
      let query = 'SELECT * FROM shared_drive_files WHERE 1=1';
      const qParams: unknown[] = [];

      if (params.agencyId && params.modelId) {
        qParams.push(params.agencyId, params.modelId);
        query += ` AND agency_id = $1 AND model_id = $2`;
      } else if (params.agencyId) {
        qParams.push(params.agencyId);
        query += ` AND agency_id = $1`;
      } else if (params.modelId) {
        qParams.push(params.modelId);
        query += ` AND model_id = $1`;
      } else if (params.currentUserId) {
        qParams.push(params.currentUserId);
        query += ` AND (agency_id = $1 OR model_id = $1)`;
      }

      query += ' ORDER BY created_at DESC';

      const res = await pool.query(query, qParams);
      if (res.rows.length > 0) {
        return res.rows
          .filter((f) => !mockNames.has(f.name))
          .map((f) => ({
            id: f.id,
            agencyId: f.agency_id,
            modelId: f.model_id,
            name: f.name,
            category: f.category,
            type: f.type,
            size: f.size,
            uploadedById: f.uploaded_by_id,
            uploadedByName: f.uploaded_by_name,
            fileUrl: f.file_url,
            downloads: Number(f.downloads || 0),
            createdAt: f.created_at,
            updatedAt: f.updated_at,
          }));
      }
    } catch {
      // Fallback
    }

    // Fallback Store
    let all = Array.from(fallbackStore.shared_drive_files.values()) as unknown as SharedDriveItem[];

    if (params.agencyId && params.modelId) {
      all = all.filter((f) => (f.agencyId === params.agencyId || (f as any).agency_id === params.agencyId) &&
                              (f.modelId === params.modelId || (f as any).model_id === params.modelId));
    } else if (params.agencyId) {
      all = all.filter((f) => f.agencyId === params.agencyId || (f as any).agency_id === params.agencyId);
    } else if (params.modelId) {
      all = all.filter((f) => f.modelId === params.modelId || (f as any).model_id === params.modelId);
    } else if (params.currentUserId) {
      all = all.filter((f) => f.agencyId === params.currentUserId || (f as any).agency_id === params.currentUserId ||
                              f.modelId === params.currentUserId || (f as any).model_id === params.currentUserId);
    }

    return all.map((f: any) => ({
      id: f.id,
      agencyId: f.agencyId || f.agency_id,
      modelId: f.modelId || f.model_id,
      name: f.name,
      category: f.category,
      type: f.type,
      size: f.size,
      uploadedById: f.uploadedById || f.uploaded_by_id,
      uploadedByName: f.uploadedByName || f.uploaded_by_name,
      fileUrl: f.fileUrl || f.file_url,
      downloads: Number(f.downloads || 0),
      createdAt: f.createdAt || f.created_at,
      updatedAt: f.updatedAt || f.updated_at,
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async saveSharedDriveFile(data: {
    agencyId: string;
    modelId: string;
    name: string;
    category?: string;
    type?: string;
    size?: string;
    uploadedById: string;
    uploadedByName: string;
    fileUrl: string;
  }): Promise<SharedDriveItem> {
    await initDatabase();
    const id = `sfile-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const category = data.category || 'raw-photos';
    const type = data.type || 'image';
    const size = data.size || '1.0 MB';
    const now = new Date().toISOString();

    const fileItem: SharedDriveItem = {
      id,
      agencyId: data.agencyId,
      modelId: data.modelId,
      name: data.name,
      category,
      type,
      size,
      uploadedById: data.uploadedById,
      uploadedByName: data.uploadedByName,
      fileUrl: data.fileUrl,
      downloads: 0,
      createdAt: now,
      updatedAt: now,
    };

    fallbackStore.shared_drive_files.set(id, fileItem as unknown as Record<string, unknown>);

    try {
      await pool.query(
        `INSERT INTO shared_drive_files (
          id, agency_id, model_id, name, category, type, size,
          uploaded_by_id, uploaded_by_name, file_url, downloads, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, NOW(), NOW())`,
        [
          id,
          data.agencyId,
          data.modelId,
          data.name,
          category,
          type,
          size,
          data.uploadedById,
          data.uploadedByName,
          data.fileUrl,
        ]
      );
    } catch (err) {
      console.warn('Erro ao salvar arquivo no Drive Compartilhado PostgreSQL:', err);
    }

    return fileItem;
  },

  async renameSharedDriveFile(id: string, newName: string, requesterId: string): Promise<boolean> {
    await initDatabase();
    const cleanName = newName.trim();
    if (!cleanName) return false;

    try {
      await pool.query(
        `UPDATE shared_drive_files 
         SET name = $1, updated_at = NOW() 
         WHERE id = $2 AND (agency_id = $3 OR model_id = $3)`,
        [cleanName, id, requesterId]
      );
    } catch {
      // Fallback
    }

    const file = fallbackStore.shared_drive_files.get(id) as any;
    if (file && (file.agency_id === requesterId || file.agencyId === requesterId || file.model_id === requesterId || file.modelId === requesterId)) {
      file.name = cleanName;
      file.updated_at = new Date().toISOString();
      file.updatedAt = file.updated_at;
      fallbackStore.shared_drive_files.set(id, file);
      return true;
    }

    return true;
  },

  async deleteSharedDriveFile(id: string, requesterId: string): Promise<boolean> {
    await initDatabase();
    try {
      await pool.query(
        `DELETE FROM shared_drive_files 
         WHERE id = $1 AND (agency_id = $2 OR model_id = $2)`,
        [id, requesterId]
      );
    } catch {
      // Fallback
    }

    const file = fallbackStore.shared_drive_files.get(id) as any;
    if (file && (file.agency_id === requesterId || file.agencyId === requesterId || file.model_id === requesterId || file.modelId === requesterId)) {
      fallbackStore.shared_drive_files.delete(id);
      return true;
    }

    return true;
  },

  async incrementSharedDriveDownloads(id: string): Promise<boolean> {
    await initDatabase();
    try {
      await pool.query('UPDATE shared_drive_files SET downloads = downloads + 1 WHERE id = $1', [id]);
    } catch {
      // Fallback
    }
    const f = fallbackStore.shared_drive_files.get(id) as any;
    if (f) {
      f.downloads = (Number(f.downloads) || 0) + 1;
      fallbackStore.shared_drive_files.set(id, f);
    }
    return true;
  },

  // ══════════════════════════════════════════════════════════════════
  // CONTRATOS & VÍNCULOS (AGENCY ↔ MODEL)
  // ══════════════════════════════════════════════════════════════════
  async getAgencyModelContract(agencyId: string, modelId: string): Promise<AgencyModelContract | null> {
    await initDatabase();
    try {
      const res = await pool.query(
        'SELECT * FROM agency_model_contracts WHERE agency_id = $1 AND model_id = $2 AND status = $3 LIMIT 1',
        [agencyId, modelId, 'active']
      );
      if (res.rows.length > 0) {
        const c = res.rows[0];
        return {
          id: c.id,
          agencyId: c.agency_id,
          modelId: c.model_id,
          agencyName: c.agency_name,
          modelName: c.model_name,
          status: c.status,
          commissionRate: c.commission_rate,
          startDate: c.start_date,
          endDate: c.end_date,
          createdAt: c.created_at,
        };
      }
    } catch {
      // Fallback
    }

    for (const c of fallbackStore.agency_model_contracts.values() as any) {
      if (
        (c.agency_id === agencyId || c.agencyId === agencyId) &&
        (c.model_id === modelId || c.modelId === modelId) &&
        c.status === 'active'
      ) {
        return {
          id: c.id,
          agencyId: c.agency_id || c.agencyId,
          modelId: c.model_id || c.modelId,
          agencyName: c.agency_name || c.agencyName,
          modelName: c.model_name || c.modelName,
          status: c.status,
          commissionRate: c.commission_rate || c.commissionRate || '20%',
          startDate: c.start_date || c.startDate,
          endDate: c.end_date || c.endDate,
          createdAt: c.created_at || c.createdAt,
        };
      }
    }
    return null;
  },

  async listAgencyContracts(agencyId: string): Promise<AgencyModelContract[]> {
    await initDatabase();
    try {
      const res = await pool.query(
        'SELECT * FROM agency_model_contracts WHERE agency_id = $1 ORDER BY created_at DESC',
        [agencyId]
      );
      if (res.rows.length > 0) {
        return res.rows.map((c) => ({
          id: c.id,
          agencyId: c.agency_id,
          modelId: c.model_id,
          agencyName: c.agency_name,
          modelName: c.model_name,
          status: c.status,
          commissionRate: c.commission_rate,
          startDate: c.start_date,
          endDate: c.end_date,
          createdAt: c.created_at,
        }));
      }
    } catch {
      // Fallback
    }

    const contracts: AgencyModelContract[] = [];
    for (const c of fallbackStore.agency_model_contracts.values() as any) {
      if (c.agency_id === agencyId || c.agencyId === agencyId) {
        contracts.push({
          id: c.id,
          agencyId: c.agency_id || c.agencyId,
          modelId: c.model_id || c.modelId,
          agencyName: c.agency_name || c.agencyName,
          modelName: c.model_name || c.modelName,
          status: c.status,
          commissionRate: c.commission_rate || c.commissionRate || '20%',
          startDate: c.start_date || c.startDate,
          endDate: c.end_date || c.endDate,
          createdAt: c.created_at || c.createdAt,
        });
      }
    }
    return contracts;
  },

  async listModelContracts(modelId: string): Promise<AgencyModelContract[]> {
    await initDatabase();
    try {
      const res = await pool.query(
        'SELECT * FROM agency_model_contracts WHERE model_id = $1 ORDER BY created_at DESC',
        [modelId]
      );
      if (res.rows.length > 0) {
        return res.rows.map((c) => ({
          id: c.id,
          agencyId: c.agency_id,
          modelId: c.model_id,
          agencyName: c.agency_name,
          modelName: c.model_name,
          status: c.status,
          commissionRate: c.commission_rate,
          startDate: c.start_date,
          endDate: c.end_date,
          createdAt: c.created_at,
        }));
      }
    } catch {
      // Fallback
    }

    const contracts: AgencyModelContract[] = [];
    for (const c of fallbackStore.agency_model_contracts.values() as any) {
      if (c.model_id === modelId || c.modelId === modelId) {
        contracts.push({
          id: c.id,
          agencyId: c.agency_id || c.agencyId,
          modelId: c.model_id || c.modelId,
          agencyName: c.agency_name || c.agencyName,
          modelName: c.model_name || c.modelName,
          status: c.status,
          commissionRate: c.commission_rate || c.commissionRate || '20%',
          startDate: c.start_date || c.startDate,
          endDate: c.end_date || c.endDate,
          createdAt: c.created_at || c.createdAt,
        });
      }
    }
    return contracts;
  },

  // ══════════════════════════════════════════════════════════════════
  // PROPOSTAS DE SCOUTING (SCOUT PROPOSALS)
  // ══════════════════════════════════════════════════════════════════
  /**
   * Registra uma proposta (agência → modelo, initiatedBy 'agency') ou uma candidatura (modelo → agência,
   * initiatedBy 'model') e abre o canal direto determinístico com a mensagem formal. As validações de
   * papel, aprovação e duplicidade ficam nas rotas. Falhas de banco sobem (sem fallback em memória).
   */
  async createScoutProposal(data: {
    agencyId: string;
    modelId: string;
    agencyName: string;
    modelName: string;
    message: string;
    proposedCommission?: string;
    initiatedBy?: 'agency' | 'model';
  }): Promise<{ proposal: ScoutProposal; conversationId: string }> {
    await initDatabase();
    const initiatedBy = data.initiatedBy || 'agency';
    const id = `${initiatedBy === 'agency' ? 'prop' : 'appl'}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const proposedCommission = normalizeCommission(data.proposedCommission);

    const res = await pool.query(
      `INSERT INTO scout_proposals (id, agency_id, model_id, agency_name, model_name, message, proposed_commission, status, initiated_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', $8, NOW())
       RETURNING *`,
      [id, data.agencyId, data.modelId, data.agencyName, data.modelName, data.message, proposedCommission, initiatedBy]
    );
    const proposal = mapScoutProposalRow(res.rows[0]);

    // Canal direto agência ↔ modelo: passa a existir na listagem de conversas assim que o registro
    // é gravado (listActiveConversations lê scout_proposals)
    const conversationId = getDirectConversationId(data.agencyId, data.modelId);
    const text =
      initiatedBy === 'agency'
        ? [
            '📋 PROPOSTA FORMAL DE AGENCIAMENTO',
            `Agência: ${data.agencyName}`,
            `Comissão Proposta: ${proposedCommission}`,
            'Detalhes / Mensagem:',
            `"${data.message}"`,
          ].join('\n')
        : [
            '📁 CANDIDATURA DE CASTING',
            `Modelo: ${data.modelName}`,
            'Mensagem:',
            `"${data.message}"`,
          ].join('\n');

    try {
      await this.sendMessage({
        senderId: initiatedBy === 'agency' ? data.agencyId : data.modelId,
        senderName: initiatedBy === 'agency' ? data.agencyName : data.modelName,
        senderRole: initiatedBy === 'agency' ? 'agencia' : 'creator',
        receiverId: initiatedBy === 'agency' ? data.modelId : data.agencyId,
        conversationId,
        text,
      });
    } catch (err) {
      // O registro já foi gravado; a conversa continua acessível pela listagem
      console.warn('[scout] Falha ao gravar a mensagem inicial da conversa:', err);
    }

    return { proposal, conversationId };
  },

  /** Proposta/candidatura ainda sem resposta para o par (evita duplicidade). */
  async findOpenScoutRequest(agencyId: string, modelId: string, initiatedBy: 'agency' | 'model'): Promise<ScoutProposal | null> {
    await initDatabase();
    const res = await pool.query(
      `SELECT * FROM scout_proposals
       WHERE agency_id = $1 AND model_id = $2 AND initiated_by = $3 AND status = 'sent'
       ORDER BY created_at DESC LIMIT 1`,
      [agencyId, modelId, initiatedBy]
    );
    return res.rows[0] ? mapScoutProposalRow(res.rows[0]) : null;
  },

  /**
   * Existe relação legítima entre os dois usuários (proposta, candidatura ou contrato não encerrado)?
   * É o que autoriza um canal de chat direto entre eles.
   */
  async hasDirectRelationship(userA: string, userB: string): Promise<boolean> {
    if (!userA || !userB || userA === userB) return false;
    await initDatabase();
    const res = await pool.query(
      `SELECT 1 FROM scout_proposals
       WHERE (agency_id = $1 AND model_id = $2) OR (agency_id = $2 AND model_id = $1)
       UNION ALL
       SELECT 1 FROM agency_model_contracts
       WHERE ((agency_id = $1 AND model_id = $2) OR (agency_id = $2 AND model_id = $1)) AND status <> 'terminated'
       LIMIT 1`,
      [userA, userB]
    );
    return res.rows.length > 0;
  },

  async getScoutProposal(id: string): Promise<ScoutProposal | null> {
    await initDatabase();
    const res = await pool.query('SELECT * FROM scout_proposals WHERE id = $1 LIMIT 1', [id]);
    return res.rows[0] ? mapScoutProposalRow(res.rows[0]) : null;
  },

  /**
   * Resposta da modelo destinatária a uma proposta de agência. Numa única transação:
   * - 'accept': proposta → accepted, contrato ativo em agency_model_contracts (idempotente) e
   *   perfil da modelo marcado como representada pela agência;
   * - 'decline': proposta → declined.
   */
  async respondToScoutProposal(params: {
    proposalId: string;
    modelId: string;
    action: 'accept' | 'decline';
  }): Promise<{ proposal: ScoutProposal; contract: AgencyModelContract | null }> {
    return withTransaction(async (client) => {
      const res = await client.query('SELECT * FROM scout_proposals WHERE id = $1 FOR UPDATE', [params.proposalId]);
      const row = res.rows[0];
      // Só a modelo destinatária de uma proposta de agência pode responder (candidaturas não passam por aqui)
      if (!row || row.model_id !== params.modelId || (row.initiated_by || 'agency') !== 'agency') {
        throw new ScoutFlowError('not_found', 'Proposta não encontrada.', 404);
      }
      if (row.status !== 'sent') {
        throw new ScoutFlowError('proposal_closed', 'Esta proposta já foi respondida.', 409);
      }

      if (params.action === 'decline') {
        const upd = await client.query(
          `UPDATE scout_proposals SET status = 'declined', responded_at = NOW() WHERE id = $1 RETURNING *`,
          [row.id]
        );
        return { proposal: mapScoutProposalRow(upd.rows[0]), contract: null };
      }

      const upd = await client.query(
        `UPDATE scout_proposals SET status = 'accepted', responded_at = NOW() WHERE id = $1 RETURNING *`,
        [row.id]
      );

      const existing = await client.query(
        `SELECT * FROM agency_model_contracts WHERE agency_id = $1 AND model_id = $2 AND status = 'active' LIMIT 1`,
        [row.agency_id, row.model_id]
      );
      let contractRow = existing.rows[0];
      if (!contractRow) {
        const inserted = await client.query(
          `INSERT INTO agency_model_contracts
             (id, agency_id, model_id, agency_name, model_name, status, commission_rate, start_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'active', $6, NOW(), NOW(), NOW())
           RETURNING *`,
          [
            `contract-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
            row.agency_id,
            row.model_id,
            row.agency_name,
            row.model_name,
            normalizeCommission(row.proposed_commission),
          ]
        );
        contractRow = inserted.rows[0];
      }

      await client.query(
        `INSERT INTO profiles (user_id, is_represented, represented_agency_id, represented_agency_name, updated_at)
         VALUES ($1, TRUE, $2, $3, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           is_represented = TRUE,
           represented_agency_id = EXCLUDED.represented_agency_id,
           represented_agency_name = EXCLUDED.represented_agency_name,
           updated_at = NOW()`,
        [row.model_id, row.agency_id, row.agency_name]
      );

      return { proposal: mapScoutProposalRow(upd.rows[0]), contract: mapContractRow(contractRow) };
    });
  },

  async listScoutProposals(params: {
    agencyId?: string;
    modelId?: string;
    initiatedBy?: 'agency' | 'model';
  }): Promise<ScoutProposal[]> {
    await initDatabase();
    const conditions: string[] = [];
    const qParams: unknown[] = [];

    if (params.agencyId) {
      qParams.push(params.agencyId);
      conditions.push(`agency_id = $${qParams.length}`);
    }
    if (params.modelId) {
      qParams.push(params.modelId);
      conditions.push(`model_id = $${qParams.length}`);
    }
    if (params.initiatedBy) {
      qParams.push(params.initiatedBy);
      conditions.push(`initiated_by = $${qParams.length}`);
    }

    const res = await pool.query(
      `SELECT * FROM scout_proposals
       ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
       ORDER BY created_at DESC
       LIMIT 200`,
      qParams
    );
    return res.rows.map(mapScoutProposalRow);
  },

  /**
   * Elenco real da agência: contratos não encerrados com os dados públicos da modelo
   * (nome artístico, foto, categoria). Sem nome civil nem e-mail.
   */
  async listAgencyRoster(agencyId: string): Promise<Array<{
    contract: AgencyModelContract;
    model: { id: string; name: string; avatarUrl: string; category: string; monthlyRevenueEstimate: string };
    conversationId: string;
  }>> {
    await initDatabase();
    const res = await pool.query(
      `SELECT c.*, p.artistic_name, p.avatar_url, p.photos, p.category, p.monthly_revenue_estimate
       FROM agency_model_contracts c
       LEFT JOIN profiles p ON p.user_id = c.model_id
       WHERE c.agency_id = $1 AND c.status <> 'terminated'
       ORDER BY c.created_at DESC`,
      [agencyId]
    );
    return res.rows.map((row) => {
      const photos = Array.isArray(row.photos) ? row.photos : [];
      return {
        contract: mapContractRow(row),
        model: {
          id: row.model_id,
          name: row.artistic_name || row.model_name,
          avatarUrl: row.avatar_url || photos[0]?.url || '',
          category: row.category || '',
          monthlyRevenueEstimate: row.monthly_revenue_estimate || '',
        },
        conversationId: getDirectConversationId(row.agency_id, row.model_id),
      };
    });
  },

  // ══════════════════════════════════════════════════════════════════
  // GESTÃO DE EQUIPE & CARGOS DA CURADORIA (RBAC: ADMIN USERS)
  // ══════════════════════════════════════════════════════════════════
  async listAdminUsers(): Promise<AdminUser[]> {
    await initDatabase();
    try {
      const res = await pool.query(
        `SELECT * FROM admin_users 
         WHERE email NOT IN ('admin@lumiardi.com', 'curador.senior@lumiardi.com', 'curador.junior@lumiardi.com', 'supervisor@lumiardi.com')
         ORDER BY created_at ASC`
      );
      if (res.rows.length > 0) {
        return res.rows.map((au) => ({
          id: au.id,
          email: au.email,
          name: au.full_name || au.name || 'Curador Lumiardi',
          fullName: au.full_name || au.name || 'Curador Lumiardi',
          curationRole: (au.role as CurationRole) || 'curador_junior',
          role: au.role,
          isActive: au.status !== 'inactive',
          status: au.status,
          createdAt: au.created_at,
          updatedAt: au.updated_at,
        }));
      }
    } catch {
      // Fallback
    }

    const fakeEmails = new Set(['admin@lumiardi.com', 'curador.senior@lumiardi.com', 'curador.junior@lumiardi.com', 'supervisor@lumiardi.com']);
    const list = (Array.from(fallbackStore.admin_users.values()) as unknown as AdminUser[]).filter(
      (au: any) => !fakeEmails.has(String(au.email).toLowerCase())
    );
    return list.map((au: any) => ({
      id: au.id,
      email: au.email,
      name: au.fullName || au.full_name || au.name || 'Curador Lumiardi',
      fullName: au.fullName || au.full_name || au.name || 'Curador Lumiardi',
      curationRole: (au.curationRole || au.role as CurationRole) || 'curador_junior',
      role: au.role || au.curationRole,
      isActive: au.isActive !== undefined ? au.isActive : au.status !== 'inactive',
      status: au.status || 'active',
      createdAt: au.createdAt || au.created_at,
      updatedAt: au.updatedAt || au.updated_at,
    })).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async createAdminUser(data: {
    email: string;
    fullName: string;
    role: CurationRole;
    password?: string;
  }): Promise<AdminUser> {
    await initDatabase();
    const id = `cur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    if (!isStrongPassword(data.password)) {
      throw new Error('WEAK_PASSWORD');
    }
    const hash = await bcrypt.hash(data.password as string, 10);
    const normEmail = data.email.trim().toLowerCase();
    const now = new Date().toISOString();

    const adminUser: AdminUser = {
      id,
      email: normEmail,
      name: data.fullName.trim(),
      fullName: data.fullName.trim(),
      curationRole: data.role,
      role: data.role,
      isActive: true,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    try {
      await pool.query(
        `INSERT INTO admin_users (id, email, password_hash, full_name, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())`,
        [id, normEmail, hash, data.fullName.trim(), data.role]
      );
    } catch (err) {
      if ((err as { code?: string })?.code === '23505') {
        throw new Error('EMAIL_IN_USE');
      }
      console.error('Erro ao inserir admin_user no PostgreSQL:', err);
      throw new Error('DATABASE_UNAVAILABLE');
    }

    return adminUser;
  },

  async updateAdminUser(
    id: string,
    updates: { role?: CurationRole; status?: 'active' | 'inactive'; fullName?: string }
  ): Promise<AdminUser | null> {
    await initDatabase();
    try {
      const setClauses: string[] = [];
      const params: unknown[] = [id];

      if (updates.role) {
        params.push(updates.role);
        setClauses.push(`role = $${params.length}`);
      }
      if (updates.status) {
        params.push(updates.status);
        setClauses.push(`status = $${params.length}`);
      }
      if (updates.fullName) {
        params.push(updates.fullName.trim());
        setClauses.push(`full_name = $${params.length}`);
      }

      if (setClauses.length > 0) {
        setClauses.push(`updated_at = NOW()`);
        await pool.query(
          `UPDATE admin_users SET ${setClauses.join(', ')} WHERE id = $1`,
          params
        );
      }
    } catch {
      // Fallback
    }

    const current = fallbackStore.admin_users.get(id) as any;
    if (current) {
      if (updates.role) current.role = updates.role;
      if (updates.status) current.status = updates.status;
      if (updates.fullName) current.full_name = updates.fullName.trim();
      current.updated_at = new Date().toISOString();
      fallbackStore.admin_users.set(id, current);

      return {
        id: current.id,
        email: current.email,
        name: current.full_name || current.fullName || current.name || 'Curador Lumiardi',
        fullName: current.full_name || current.fullName || current.name || 'Curador Lumiardi',
        curationRole: (current.role as CurationRole) || 'curador_junior',
        role: current.role,
        isActive: current.status !== 'inactive',
        status: current.status,
        createdAt: current.created_at || current.createdAt,
        updatedAt: current.updated_at,
      };
    }

    return null;
  },

  async deleteAdminUser(id: string): Promise<boolean> {
    await initDatabase();
    try {
      await pool.query('DELETE FROM admin_users WHERE id = $1', [id]);
    } catch {
      // Fallback
    }
    fallbackStore.admin_users.delete(id);
    return true;
  },

  // ═══════════════════════════════════════════════════════════════
  // SISTEMA DE NOTIFICAÇÕES EM TEMPO REAL
  // ═══════════════════════════════════════════════════════════════

  async createNotification(data: {
    userId: string;
    title: string;
    desc: string;
    category?: string;
    type?: 'info' | 'success' | 'warn' | 'invite' | string;
    link?: string;
    linkText?: string;
  }): Promise<NotificationItem> {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const notification: NotificationItem = {
      id,
      userId: data.userId,
      title: data.title,
      desc: data.desc,
      category: data.category || 'Geral',
      type: data.type || 'info',
      link: data.link,
      linkText: data.linkText,
      isRead: false,
      createdAt: now,
    };

    fallbackStore.notifications.set(id, {
      id,
      user_id: data.userId,
      title: data.title,
      description: data.desc,
      category: notification.category,
      type: notification.type,
      link: data.link,
      link_text: data.linkText,
      is_read: false,
      created_at: now,
    });

    await initDatabase();
    try {
      await pool.query(
        `INSERT INTO notifications (id, user_id, title, description, category, type, link, link_text, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          id,
          data.userId,
          data.title,
          data.desc,
          notification.category,
          notification.type,
          data.link || null,
          data.linkText || null,
          false,
        ]
      );
    } catch {
      // Fallback in-memory já armazenado
    }

    return notification;
  },

  async listNotifications(userId: string): Promise<NotificationItem[]> {
    await initDatabase();
    try {
      const res = await pool.query(
        `SELECT id, user_id, title, description, category, type, link, link_text, is_read, created_at
         FROM notifications
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      );
      if (res.rows.length > 0) {
        return res.rows.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          title: r.title,
          desc: r.description,
          category: r.category,
          type: r.type,
          link: r.link,
          linkText: r.link_text,
          isRead: Boolean(r.is_read),
          createdAt: r.created_at,
        }));
      }
    } catch {
      // Fallback
    }

    // Fallback store
    const list: NotificationItem[] = [];
    fallbackStore.notifications.forEach((val: any) => {
      if (val.user_id === userId || val.userId === userId) {
        list.push({
          id: val.id,
          userId: val.user_id || val.userId,
          title: val.title,
          desc: val.description || val.desc,
          category: val.category || 'Geral',
          type: val.type || 'info',
          link: val.link,
          linkText: val.link_text || val.linkText,
          isRead: Boolean(val.is_read || val.isRead),
          createdAt: val.created_at || val.createdAt,
        });
      }
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async markNotificationAsRead(id: string, userId: string): Promise<boolean> {
    await initDatabase();
    try {
      await pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
    } catch {
      // Fallback
    }

    const item = fallbackStore.notifications.get(id) as any;
    if (item && (item.user_id === userId || item.userId === userId)) {
      item.is_read = true;
      item.isRead = true;
      fallbackStore.notifications.set(id, item);
    }
    return true;
  },

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    await initDatabase();
    try {
      await pool.query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
        [userId]
      );
    } catch {
      // Fallback
    }

    fallbackStore.notifications.forEach((val: any, key: string) => {
      if (val.user_id === userId || val.userId === userId) {
        val.is_read = true;
        val.isRead = true;
        fallbackStore.notifications.set(key, val);
      }
    });
    return true;
  },
};

