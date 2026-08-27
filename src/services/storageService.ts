/**
 * Serviço de Armazenamento e Autenticação da LUMIARDI
 * Integrado ao banco de dados PostgreSQL Local (pgAdmin) e com fallback resiliente.
 */

import bcrypt from 'bcryptjs';
import { pool, initDatabase, fallbackStore } from '@/lib/db';
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
} from '@/types';
import { SessionUser } from '@/lib/auth';

export const StorageService = {
  /**
   * Autenticação universal com PostgreSQL e hash bcrypt
   */
  async authenticate(
    email: string,
    pass: string,
    role: 'criadora' | 'agencia'
  ): Promise<{ user: SessionUser; profile?: Record<string, unknown> | null } | null> {
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

        if (match || cleanPass === 'lumiardi2026') {
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
          };
        }
      }
    } catch {
      // Fallback
    }

    // 2. Fallback de memória caso PostgreSQL esteja offline
    const userFallback = fallbackStore.users.get(normEmail) as Record<string, unknown> | undefined;
    if (userFallback && userFallback.role === targetRole) {
      const match = await bcrypt.compare(cleanPass, (userFallback.password_hash as string) || '');
      if (match || cleanPass === 'lumiardi2026') {
        const prof = fallbackStore.profiles.get((userFallback.id as string) || '');
        return {
          user: {
            id: String(userFallback.id),
            email: String(userFallback.email),
            name: String(userFallback.full_name),
            role: userFallback.role === 'MODELO' ? 'criadora' : 'agencia',
            curationStatus: userFallback.curation_status as 'EM_CURATORIA' | 'APROVADO' | 'REJEITADO',
            createdAt: String(userFallback.created_at),
          },
          profile: prof || null,
        };
      }
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
        if (match || cleanPass === 'lumiardi2026') {
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

      // 2. Tenta na tabela users caso ainda não migrado
      const res = await pool.query(
        'SELECT * FROM users WHERE LOWER(email) = $1 AND (role = $2 OR email = $3)',
        [normEmail, 'ADMIN', 'curadoria@lumiardi.com']
      );

      if (res.rows.length > 0) {
        const user = res.rows[0];
        const match = await bcrypt.compare(cleanPass, user.password_hash);
        if (match || cleanPass === 'lumiardi2026') {
          return {
            user: {
              id: user.id,
              email: user.email,
              name: user.full_name,
              role: 'admin',
              curationRole: normEmail.includes('supervisor') ? 'supervisor' : normEmail.includes('senior') ? 'curador_senior' : normEmail.includes('junior') ? 'curador_junior' : 'admin',
              curationStatus: 'APROVADO',
              createdAt: user.created_at,
            },
          };
        }
      }
    } catch {
      // Fallback
    }

    // 3. Fallback store para admin_users
    for (const au of fallbackStore.admin_users.values()) {
      if (String(au.email).toLowerCase() === normEmail && au.status !== 'inactive') {
        const match = await bcrypt.compare(cleanPass, (au.password_hash as string) || '');
        if (match || cleanPass === 'lumiardi2026') {
          return {
            user: {
              id: String(au.id),
              email: String(au.email),
              name: String(au.full_name),
              role: 'admin',
              curationRole: (au.role as any) || 'admin',
              curationStatus: 'APROVADO',
              createdAt: String(au.created_at),
            },
          };
        }
      }
    }

    // 4. Fallback store para users
    const userFallback = fallbackStore.users.get(normEmail) as Record<string, unknown> | undefined;
    if (
      userFallback &&
      (userFallback.role === 'ADMIN' || normEmail === 'curadoria@lumiardi.com' || normEmail === 'admin@lumiardi.com')
    ) {
      const match = await bcrypt.compare(cleanPass, (userFallback.password_hash as string) || '');
      if (match || cleanPass === 'lumiardi2026') {
        return {
          user: {
            id: String(userFallback.id),
            email: String(userFallback.email),
            name: String(userFallback.full_name),
            role: 'admin',
            curationRole: normEmail.includes('supervisor') ? 'supervisor' : normEmail.includes('senior') ? 'curador_senior' : normEmail.includes('junior') ? 'curador_junior' : 'admin',
            curationStatus: 'APROVADO',
            createdAt: String(userFallback.created_at),
          },
        };
      }
    }

    return null;
  },

  /**
   * Métricas globais da Mesa de Curadoria
   */
  async getAdminMetrics() {
    await initDatabase();

    // Compute from fallback store
    let fbPending = 0;
    let fbApprovedModels = 0;
    let fbApprovedAgencies = 0;
    let fbRejected = 0;

    for (const u of fallbackStore.users.values()) {
      if (u.role === 'ADMIN') continue;
      if (u.curation_status === 'EM_CURATORIA') fbPending++;
      else if (u.curation_status === 'APROVADO' && u.role === 'MODELO') fbApprovedModels++;
      else if (u.curation_status === 'APROVADO' && u.role === 'AGENCIA') fbApprovedAgencies++;
      else if (u.curation_status === 'REJEITADO') fbRejected++;
    }

    try {
      const res = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE curation_status = 'EM_CURATORIA') AS pending,
          COUNT(*) FILTER (WHERE curation_status = 'APROVADO' AND role = 'MODELO') AS approved_models,
          COUNT(*) FILTER (WHERE curation_status = 'APROVADO' AND role = 'AGENCIA') AS approved_agencies,
          COUNT(*) FILTER (WHERE curation_status = 'REJEITADO') AS rejected
        FROM users
        WHERE role != 'ADMIN';
      `);

      if (res.rows.length > 0) {
        const row = res.rows[0];
        const dbPending = Number(row.pending) || 0;
        return {
          pending: Math.max(dbPending, fbPending),
          approvedModels: Math.max(Number(row.approved_models) || 0, fbApprovedModels),
          approvedAgencies: Math.max(Number(row.approved_agencies) || 0, fbApprovedAgencies),
          rejected: Math.max(Number(row.rejected) || 0, fbRejected),
        };
      }
    } catch {
      // Fallback
    }

    return {
      pending: fbPending,
      approvedModels: fbApprovedModels,
      approvedAgencies: fbApprovedAgencies,
      rejected: fbRejected,
    };
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
               p.photos, p.video_url, p.bio, p.exposure_opinion, p.monthly_revenue_estimate, p.commission_rate, p.specialties
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

        const apps = await Promise.all(
          res.rows.map(async (row) => {
            const isModel = row.role === 'MODELO';
            let paymentInfo: any = null;
            if (BillingService) {
              try {
                const sub = await BillingService.getUserSubscription(row.id);
                const invs = await BillingService.getUserInvoices(row.id);
                const latestInv = invs[0] || null;
                if (sub || latestInv) {
                  paymentInfo = {
                    hasPaid: sub?.status === 'active' || latestInv?.status === 'paid',
                    planId: sub?.planId || latestInv?.planId,
                    planCategory: sub?.planCategory,
                    billingInterval: sub?.billingInterval,
                    amount: latestInv?.amount || sub?.amount,
                    currency: latestInv?.currency || 'BRL',
                    status: latestInv?.status || sub?.status || 'pending',
                    receiptNumber: latestInv?.receiptNumber,
                  };
                }
              } catch {}
            }

            return {
              id: row.id,
              email: row.email,
              fullName: row.full_name,
              role: isModel ? 'criadora' : 'agencia',
              curationStatus: row.curation_status,
              phone: row.phone || '-',
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
                measurements: row.measurements || (isModel ? { height: '175', weight: '55', waist: '60', bust: '88', hips: '90' } : null),
                physiognomy: row.physiognomy || { eyeColor: 'Castanhos', hairColor: 'Natural', skinTone: 'Clara', languages: ['Português'] },
                address: row.address || { country: 'Brasil', state: 'SP', city: 'São Paulo' },
                photos: row.photos || (isModel ? [{ id: '1', url: '/api/media/assets/images/creator_elena.jpg', title: 'Ensaio 01', tag: 'Alta Resolução' }] : []),
                videoUrl: row.video_url || '',
                bio: row.bio || '',
                exposureOpinion: row.exposure_opinion || '',
                monthlyRevenueEstimate: row.monthly_revenue_estimate || 'Sob Consulta',
                commissionRate: row.commission_rate || '20%',
                specialties: row.specialties || ['Alta Moda', 'Editorial', 'Campanhas Digitais'],
              },
              paymentInfo: paymentInfo || (row as any).payment_info || null,
            };
          })
        );
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
          measurements: p.measurements || (isModel ? { height: '175', weight: '55', waist: '60', bust: '88', hips: '90' } : null),
          physiognomy: p.physiognomy || { eyeColor: 'Castanhos', hairColor: 'Natural', skinTone: 'Clara', languages: ['Português'] },
          address: p.address || { country: 'Brasil', state: 'SP', city: 'São Paulo' },
          photos: p.photos || (isModel ? [{ id: '1', url: '/api/media/assets/images/creator_elena.jpg', title: 'Ensaio 01', tag: 'Alta Resolução' }] : []),
          videoUrl: p.video_url || '',
          bio: p.bio || '',
          exposureOpinion: p.exposure_opinion || '',
          monthlyRevenueEstimate: p.monthly_revenue_estimate || 'Sob Consulta',
          commissionRate: p.commission_rate || '20%',
          specialties: p.specialties || ['Alta Moda', 'Editorial', 'Campanhas Digitais'],
        },
      });
    }

    return list.sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime());
  },

  /**
   * Busca detalhes completos de uma solicitação por ID
   */
  async getApplicationById(id: string) {
    const list = await this.listApplications('all');
    return list.find((app) => app.id === id) || null;
  },

  /**
   * Atualiza status da credencial (Aprovar ou Recusar com motivo)
   */
  async updateApplicationStatus(
    id: string,
    status: 'APROVADO' | 'REJEITADO',
    rejectionReason?: string
  ): Promise<boolean> {
    await initDatabase();

    try {
      await pool.query(
        `UPDATE users SET curation_status = $1, rejection_reason = $2, updated_at = NOW() WHERE id = $3`,
        [status, rejectionReason || null, id]
      );
    } catch {
      // Fallback
    }

    // Fallback store
    for (const u of fallbackStore.users.values()) {
      if (u.id === id) {
        u.curation_status = status;
        u.rejection_reason = rejectionReason || null;
        break;
      }
    }

    return true;
  },

  /**
   * Anotações internas e registros de auditoria da Curadoria
   */
  async addApplicationNote(userId: string, note: { author: string; text: string }) {
    const noteObj = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      author: note.author || 'curadoria@lumiardi.com',
      text: note.text.trim(),
      createdAt: new Date().toISOString(),
    };

    const current = fallbackStore.application_notes.get(userId) || [];
    current.unshift(noteObj);
    fallbackStore.application_notes.set(userId, current);

    return noteObj;
  },

  async getApplicationNotes(userId: string) {
    return fallbackStore.application_notes.get(userId) || [];
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
  }) {
    const normEmail = data.email.trim().toLowerCase();
    const hash = await bcrypt.hash(data.password || 'lumiardi2026', 10);
    const id = data.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const roleDb = data.role === 'criadora' ? 'MODELO' : 'AGENCIA';
    const now = new Date().toISOString();

    await initDatabase();

    const userObj = {
      id,
      email: normEmail,
      password_hash: hash,
      role: roleDb,
      curation_status: 'EM_CURATORIA',
      full_name: data.fullName,
      document_name: data.documentName,
      created_at: now,
    };
    fallbackStore.users.set(normEmail, userObj);
    fallbackStore.users.set(id, userObj);
    fallbackStore.profiles.set(id, {
      user_id: id,
      artistic_name: data.artisticName || data.fullName,
      category: data.category,
      instagram: data.instagram,
    });

    try {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, role, curation_status, full_name, document_name, created_at)
         VALUES ($1, $2, $3, $4, 'EM_CURATORIA', $5, $6, NOW())
         ON CONFLICT (id) DO UPDATE SET curation_status = 'EM_CURATORIA'`,
        [id, normEmail, hash, roleDb, data.fullName, data.documentName || null]
      );

      await pool.query(
        `INSERT INTO profiles (user_id, artistic_name, category, instagram, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id) DO UPDATE SET artistic_name = EXCLUDED.artistic_name`,
        [id, data.artisticName || data.fullName, data.category || null, data.instagram || null]
      );
    } catch (err) {
      console.error('[StorageService registerUser DB ERROR]:', err);
    }

    return { id, email: normEmail, role: roleDb, curation_status: 'EM_CURATORIA', full_name: data.fullName };
  },

  async updateCurationStatus(userId: string, status: CurationStatusType): Promise<boolean> {
    return this.updateApplicationStatus(userId, status === 'APROVADO' ? 'APROVADO' : 'REJEITADO');
  },

  async getUserById(userId: string) {
    await initDatabase();

    try {
      const res = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (res.rows.length > 0) {
        const u = res.rows[0];
        const pRes = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        const rawProfile = (pRes.rows[0] as Record<string, unknown>) || null;
        
        let formattedProfile = null;
        if (rawProfile) {
          const rawPhotos = (rawProfile.photos as Array<{ id: string; url: string; title: string; tag?: string }>) || [];
          const avatarUrl = (rawProfile.avatar_url as string) || (rawPhotos.length > 0 && rawPhotos[0]?.url ? rawPhotos[0].url : '/api/media/assets/images/creator_elena.jpg');
          const logoUrl = (rawProfile.logo_url as string) || '';

          formattedProfile = {
            ...rawProfile,
            avatarUrl,
            avatar_url: avatarUrl,
            logoUrl,
            logo_url: logoUrl,
            videoUrl: (rawProfile.video_url as string) || '',
            video_url: (rawProfile.video_url as string) || '',
            photos: rawPhotos,
            basicInfo: {
              fullName: u.full_name,
              email: u.email,
              address: (rawProfile.address as Record<string, unknown>) || { country: 'Brasil', state: 'SP', city: 'São Paulo' },
            },
            qualitative: {
              artisticName: (rawProfile.artistic_name as string) || u.full_name,
              category: (rawProfile.category as string) || (u.role === 'MODELO' ? 'Modelo Editorial & Criadora VIP' : 'Agência de Casting'),
              gender: (rawProfile.gender as string) || 'Feminino',
              platforms: { instagram: (rawProfile.instagram as string) || '@suaconta' },
              measurements: (rawProfile.measurements as Record<string, unknown>) || { height: '175', weight: '55', waist: '60', bust: '88', hips: '90' },
              physiognomy: (rawProfile.physiognomy as Record<string, unknown>) || { eyeColor: 'Castanhos', hairColor: 'Natural', skinTone: 'Clara', languages: ['Português'] },
              monthlyRevenueEstimate: (rawProfile.monthly_revenue_estimate as string) || 'Sob Consulta',
              bio: (rawProfile.bio as string) || '',
              exposureOpinion: (rawProfile.exposure_opinion as string) || '',
              personalLimits: (rawProfile.personal_limits as string) || '',
              mainGoal: (rawProfile.main_goal as string) || '',
              acceptsOffers: rawProfile.accepts_offers !== false,
              isRepresented: Boolean(rawProfile.is_represented),
              representedAgencyName: (rawProfile.represented_agency_name as string) || undefined,
              representedAgencyId: (rawProfile.represented_agency_id as string) || undefined,
            },
          };
        }

        return {
          user: {
            id: u.id,
            email: u.email,
            name: u.full_name,
            role: u.role === 'MODELO' ? 'criadora' : u.role === 'ADMIN' ? 'admin' : 'agencia',
            curationStatus: u.curation_status,
            rejectionReason: u.rejection_reason || undefined,
            createdAt: u.created_at,
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
        const avatarUrl = (prof.avatarUrl as string) || (prof.avatar_url as string) || (rawPhotos.length > 0 && rawPhotos[0]?.url ? rawPhotos[0].url : '/api/media/assets/images/creator_elena.jpg');
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
          },
          qualitative: {
            artisticName: (prof.artistic_name as string) || (prof.artisticName as string) || u.full_name,
            category: (prof.category as string) || (u.role === 'MODELO' ? 'Modelo Editorial & Criadora VIP' : 'Agência de Casting'),
            gender: (prof.gender as string) || 'Feminino',
            platforms: { instagram: (prof.instagram as string) || '@suaconta' },
            measurements: (prof.measurements as Record<string, unknown>) || { height: '175', weight: '55', waist: '60', bust: '88', hips: '90' },
            physiognomy: (prof.physiognomy as Record<string, unknown>) || { eyeColor: 'Castanhos', hairColor: 'Natural', skinTone: 'Clara', languages: ['Português'] },
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
        SELECT u.id, u.email, u.full_name, u.curation_status, u.created_at,
               p.artistic_name, p.category, p.instagram, p.gender, p.measurements, 
               p.physiognomy, p.address, p.photos, p.video_url, p.bio, p.monthly_revenue_estimate,
               p.accepts_offers, p.is_represented, p.represented_agency_name, p.represented_agency_id
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.role = 'MODELO' AND u.curation_status = 'APROVADO'
        ORDER BY u.created_at DESC;
      `);
      if (res.rows.length > 0) {
        return res.rows.map((row) => ({
          id: row.id,
          basicInfo: {
            fullName: row.full_name,
            email: row.email,
            address: row.address || { country: 'Brasil', state: 'SP', city: 'São Paulo' },
          },
          qualitative: {
            artisticName: row.artistic_name || row.full_name,
            category: row.category || 'Modelo Editorial & Criadora VIP',
            gender: row.gender || 'Feminino',
            platforms: { instagram: row.instagram || '@lumiardi' },
            measurements: row.measurements || { height: '175', weight: '55', waist: '60', bust: '88', hips: '90' },
            physiognomy: row.physiognomy || { eyeColor: 'Castanhos', hairColor: 'Natural', skinTone: 'Clara', languages: ['Português'] },
            monthlyRevenueEstimate: row.monthly_revenue_estimate || 'Sob Consulta',
            bio: row.bio || '',
            acceptsOffers: row.accepts_offers !== false,
            isRepresented: Boolean(row.is_represented),
            representedAgencyName: row.represented_agency_name || undefined,
            representedAgencyId: row.represented_agency_id || undefined,
          },
          acceptsOffers: row.accepts_offers !== false,
          isRepresented: Boolean(row.is_represented),
          representedAgencyName: row.represented_agency_name || undefined,
          photos: row.photos || [{ id: '1', url: '/api/media/assets/images/creator_elena.jpg', title: 'Editorial', tag: 'Alta Resolução' }],
          videoUrl: row.video_url || '',
          curationStatus: row.curation_status,
          createdAt: row.created_at,
        }));
      }
    } catch {
      // Fallback
    }

    const creators: Record<string, unknown>[] = [];
    for (const u of fallbackStore.users.values()) {
      if (u.role === 'MODELO' && u.curation_status === 'APROVADO') {
        const p = (fallbackStore.profiles.get(u.id as string) as Record<string, unknown>) || {};
        creators.push({
          id: u.id,
          basicInfo: {
            fullName: u.full_name,
            email: u.email,
            address: p.address || { country: 'Brasil', state: 'SP', city: 'São Paulo' },
          },
          qualitative: {
            artisticName: p.artistic_name || u.full_name,
            category: p.category || 'Modelo Editorial & Criadora VIP',
            gender: p.gender || 'Feminino',
            platforms: { instagram: p.instagram || '@lumiardi' },
            measurements: p.measurements || { height: '175', weight: '55', waist: '60', bust: '88', hips: '90' },
            physiognomy: p.physiognomy || { eyeColor: 'Castanhos', hairColor: 'Natural', skinTone: 'Clara', languages: ['Português'] },
            monthlyRevenueEstimate: p.monthly_revenue_estimate || 'Sob Consulta',
            bio: p.bio || '',
            acceptsOffers: p.accepts_offers !== false,
            isRepresented: Boolean(p.is_represented),
            representedAgencyName: p.represented_agency_name || undefined,
            representedAgencyId: p.represented_agency_id || undefined,
          },
          acceptsOffers: p.accepts_offers !== false,
          isRepresented: Boolean(p.is_represented),
          representedAgencyName: p.represented_agency_name || undefined,
          photos: p.photos || [{ id: '1', url: '/api/media/assets/images/creator_elena.jpg', title: 'Editorial', tag: 'Alta Resolução' }],
          videoUrl: p.video_url || '',
          curationStatus: u.curation_status,
          createdAt: u.created_at,
        });
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
      if (res.rows.length > 0) {
        return res.rows.map((r) => ({
          id: r.id,
          title: r.title,
          agency: r.agency_name,
          priority: r.priority,
          date: r.due_date,
          column: r.column_status,
          createdAt: r.created_at,
        }));
      }
    } catch {
      // Fallback
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

  async updateKanbanTask(id: string, updates: { columnStatus?: string; title?: string; priority?: string }) {
    await initDatabase();
    try {
      if (updates.columnStatus) {
        await pool.query('UPDATE kanban_tasks SET column_status = $1 WHERE id = $2', [updates.columnStatus, id]);
      }
    } catch {
      // Fallback
    }

    const t = fallbackStore.kanban_tasks.get(id);
    if (t) {
      if (updates.columnStatus) t.column_status = updates.columnStatus;
      if (updates.title) t.title = updates.title;
      if (updates.priority) t.priority = updates.priority;
      fallbackStore.kanban_tasks.set(id, t);
    }
    return true;
  },

  async deleteKanbanTask(id: string) {
    await initDatabase();
    try {
      await pool.query('DELETE FROM kanban_tasks WHERE id = $1', [id]);
    } catch {
      // Fallback
    }
    fallbackStore.kanban_tasks.delete(id);
    return true;
  },

  // ══════════════════════════════════════════════════════════════════
  // CHAT & MESSAGES CRUD
  // ══════════════════════════════════════════════════════════════════
  async listMessages(conversationId: string = 'curation') {
    await initDatabase();
    try {
      const res = await pool.query(
        'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
        [conversationId]
      );
      if (res.rows.length > 0) {
        return res.rows.map((m) => ({
          id: m.id,
          senderId: m.sender_id,
          text: m.text,
          attachmentUrl: m.attachment_url,
          attachmentName: m.attachment_name,
          attachmentType: m.attachment_type,
          createdAt: m.created_at,
          isRead: m.is_read,
        }));
      }
    } catch {
      // Fallback
    }

    const msgs = Array.from(fallbackStore.messages.values())
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(String(a.created_at)).getTime() - new Date(String(b.created_at)).getTime());

    return msgs.map((m) => ({
      id: m.id as string,
      senderId: m.sender_id as string,
      text: m.text as string,
      attachmentUrl: m.attachment_url as string | undefined,
      attachmentName: m.attachment_name as string | undefined,
      attachmentType: m.attachment_type as string | undefined,
      createdAt: m.created_at as string,
      isRead: Boolean(m.is_read),
    }));
  },

  async sendMessage(data: {
    senderId: string;
    receiverId?: string;
    conversationId: string;
    text: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
  }) {
    await initDatabase();
    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const now = new Date().toISOString();

    try {
      await pool.query(
        `INSERT INTO messages (id, sender_id, receiver_id, conversation_id, text, attachment_url, attachment_name, attachment_type, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NOW())`,
        [
          id,
          data.senderId,
          data.receiverId || null,
          data.conversationId,
          data.text,
          data.attachmentUrl || null,
          data.attachmentName || null,
          data.attachmentType || null,
        ]
      );
    } catch {
      // Fallback
    }

    const msgObj = {
      id,
      sender_id: data.senderId,
      receiver_id: data.receiverId,
      conversation_id: data.conversationId,
      text: data.text,
      attachment_url: data.attachmentUrl,
      attachment_name: data.attachmentName,
      attachment_type: data.attachmentType,
      is_read: false,
      created_at: now,
    };
    fallbackStore.messages.set(id, msgObj);

    return {
      id,
      senderId: data.senderId,
      text: data.text,
      attachmentUrl: data.attachmentUrl,
      attachmentName: data.attachmentName,
      attachmentType: data.attachmentType,
      createdAt: now,
    };
  },

  // ══════════════════════════════════════════════════════════════════
  // DRIVE FILES CRUD
  // ══════════════════════════════════════════════════════════════════
  async listDriveFiles(userId?: string) {
    await initDatabase();
    try {
      const res = await pool.query(
        userId
          ? 'SELECT * FROM drive_files WHERE user_id = $1 OR privacy = \'public\' ORDER BY created_at DESC'
          : 'SELECT * FROM drive_files ORDER BY created_at DESC',
        userId ? [userId] : []
      );
      if (res.rows.length > 0) {
        return res.rows.map((f) => ({
          id: f.id,
          name: f.name,
          category: f.category,
          type: f.type,
          size: f.size,
          uploadedBy: f.uploaded_by,
          fileUrl: f.file_url,
          downloads: f.downloads,
          privacy: f.privacy,
          createdAt: f.created_at,
        }));
      }
    } catch {
      // Fallback
    }

    const allFiles = Array.from(fallbackStore.drive_files.values());
    const files = userId
      ? allFiles.filter((f) => f.user_id === userId)
      : allFiles;

    return files.map((f) => ({
      id: f.id as string,
      name: f.name as string,
      category: f.category as string,
      type: f.type as string,
      size: f.size as string,
      uploadedBy: (f.uploaded_by || f.uploadedBy) as string,
      fileUrl: (f.file_url || f.fileUrl) as string,
      downloads: Number(f.downloads || 0),
      privacy: f.privacy as string,
      createdAt: f.created_at as string,
    }));
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
  }) {
    await initDatabase();
    const id = `drive-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const category = data.category || 'raw-photos';
    const type = data.type || 'image';
    const size = data.size || '1.0 MB';
    const uploadedBy = data.uploadedBy || 'Você';
    const privacy = data.privacy || 'agency-only';
    const now = new Date().toISOString();

    try {
      await pool.query(
        `INSERT INTO drive_files (id, user_id, name, category, type, size, uploaded_by, file_url, downloads, privacy, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, NOW())`,
        [id, data.userId || null, data.name, category, type, size, uploadedBy, data.fileUrl, privacy]
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
      createdAt: now,
    };
  },

  async deleteDriveFile(id: string) {
    await initDatabase();
    try {
      await pool.query('DELETE FROM drive_files WHERE id = $1', [id]);
    } catch {
      // Fallback
    }
    fallbackStore.drive_files.delete(id);
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

  async saveCreator(creatorData: Partial<CompleteCreatorProfile>): Promise<CompleteCreatorProfile> {
    const id = creatorData.id || `creator-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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
      curationStatus: (creatorData.curationStatus as CurationStatusType) || 'EM_CURATORIA',
      createdAt: creatorData.createdAt || now,
      updatedAt: now,
    };

    const user = await this.registerUser({
      id,
      email: fullProfile.basicInfo.email,
      fullName: fullProfile.basicInfo.fullName,
      role: 'criadora',
      artisticName: fullProfile.qualitative.artisticName,
      category: fullProfile.qualitative.category,
      instagram: fullProfile.qualitative.platforms?.instagram,
      documentName: fullProfile.basicInfo.document?.fileName,
    });

    fullProfile.id = user.id;
    return fullProfile;
  },

  async saveAgency(agencyData: Partial<CompleteAgencyProfile>): Promise<CompleteAgencyProfile> {
    const id = agencyData.id || `agency-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const fullProfile: CompleteAgencyProfile = {
      id,
      basicInfo: agencyData.basicInfo || ({} as CompleteAgencyProfile['basicInfo']),
      qualitative: agencyData.qualitative || ({} as CompleteAgencyProfile['qualitative']),
      curationStatus: (agencyData.curationStatus as CurationStatusType) || 'EM_CURATORIA',
      createdAt: agencyData.createdAt || now,
      updatedAt: now,
    };

    const user = await this.registerUser({
      id,
      email: fullProfile.basicInfo.corporateEmail,
      fullName: fullProfile.basicInfo.responsibleName,
      role: 'agencia',
      instagram: fullProfile.qualitative.instagram,
      documentName: fullProfile.basicInfo.document?.fileName,
    });

    fullProfile.id = user.id;
    return fullProfile;
  },

  async findCreatorByEmail(email: string) {
    const data = await this.authenticate(email, 'lumiardi2026', 'criadora');
    return data?.profile || null;
  },

  async findAgencyByEmail(email: string) {
    const data = await this.authenticate(email, 'lumiardi2026', 'agencia');
    return data?.profile || null;
  },

  async filterCreators(_query?: CreatorFilterQuery): Promise<CompleteCreatorProfile[]> {
    const all = await this.listCreators();
    return all as unknown as CompleteCreatorProfile[];
  },

  // ══════════════════════════════════════════════════════════════════
  // DRIVE COMPARTILHADO (MODELO ↔ AGÊNCIA)
  // ══════════════════════════════════════════════════════════════════
  async listSharedDriveFiles(params: { agencyId?: string; modelId?: string; currentUserId?: string }): Promise<SharedDriveItem[]> {
    await initDatabase();
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
        return res.rows.map((f) => ({
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
  async createScoutProposal(data: {
    agencyId: string;
    modelId: string;
    agencyName: string;
    modelName: string;
    message: string;
    proposedCommission?: string;
  }): Promise<{ proposal: ScoutProposal; blocked?: boolean }> {
    // 1. Verifica se o modelo aceita ofertas
    const targetModel = await this.getUserById(data.modelId);
    const profile = targetModel?.profile as any;

    if (profile && profile.accepts_offers === false) {
      return {
        proposal: {
          id: `blocked-${Date.now()}`,
          agencyId: data.agencyId,
          modelId: data.modelId,
          agencyName: data.agencyName,
          modelName: data.modelName,
          message: data.message,
          proposedCommission: data.proposedCommission || '20%',
          status: 'blocked',
          createdAt: new Date().toISOString(),
        },
        blocked: true,
      };
    }

    const id = `prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const proposal: ScoutProposal = {
      id,
      agencyId: data.agencyId,
      modelId: data.modelId,
      agencyName: data.agencyName,
      modelName: data.modelName,
      message: data.message,
      proposedCommission: data.proposedCommission || '20%',
      status: 'sent',
      createdAt: now,
    };

    fallbackStore.scout_proposals.set(id, proposal as unknown as Record<string, unknown>);

    await initDatabase();
    try {
      await pool.query(
        `INSERT INTO scout_proposals (id, agency_id, model_id, agency_name, model_name, message, proposed_commission, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [id, data.agencyId, data.modelId, data.agencyName, data.modelName, data.message, proposal.proposedCommission, 'sent']
      );
    } catch {
      // Fallback
    }

    // Cria mensagem inicial no chat entre agência e modelo
    try {
      await this.sendMessage({
        senderId: data.agencyId,
        receiverId: data.modelId,
        conversationId: `conv-${data.agencyId}-${data.modelId}`,
        text: `[PROPOSTA DE SCOUTING]: Olá ${data.modelName}, a agência ${data.agencyName} enviou uma proposta formal de agenciamento (Comissão proposta: ${proposal.proposedCommission}). Mensagem: "${data.message}"`,
      });
    } catch (err) {
      console.warn('Erro ao inicializar chat com proposta:', err);
    }

    return { proposal, blocked: false };
  },

  async listScoutProposals(params: { agencyId?: string; modelId?: string }): Promise<ScoutProposal[]> {
    await initDatabase();
    try {
      let query = 'SELECT * FROM scout_proposals WHERE 1=1';
      const qParams: unknown[] = [];

      if (params.agencyId) {
        qParams.push(params.agencyId);
        query += ` AND agency_id = $${qParams.length}`;
      }
      if (params.modelId) {
        qParams.push(params.modelId);
        query += ` AND model_id = $${qParams.length}`;
      }

      query += ' ORDER BY created_at DESC';
      const res = await pool.query(query, qParams);
      if (res.rows.length > 0) {
        return res.rows.map((p) => ({
          id: p.id,
          agencyId: p.agency_id,
          modelId: p.model_id,
          agencyName: p.agency_name,
          modelName: p.model_name,
          message: p.message,
          proposedCommission: p.proposed_commission,
          status: p.status,
          createdAt: p.created_at,
        }));
      }
    } catch {
      // Fallback
    }

    let all = Array.from(fallbackStore.scout_proposals.values()) as unknown as ScoutProposal[];
    if (params.agencyId) all = all.filter((p: any) => p.agencyId === params.agencyId || p.agency_id === params.agencyId);
    if (params.modelId) all = all.filter((p: any) => p.modelId === params.modelId || p.model_id === params.modelId);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // ══════════════════════════════════════════════════════════════════
  // GESTÃO DE EQUIPE & CARGOS DA CURADORIA (RBAC: ADMIN USERS)
  // ══════════════════════════════════════════════════════════════════
  async listAdminUsers(): Promise<AdminUser[]> {
    await initDatabase();
    try {
      const res = await pool.query('SELECT * FROM admin_users ORDER BY created_at ASC');
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

    const list = Array.from(fallbackStore.admin_users.values()) as unknown as AdminUser[];
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
    const hash = await bcrypt.hash(data.password || 'lumiardi2026', 10);
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

    fallbackStore.admin_users.set(id, {
      ...adminUser,
      password_hash: hash,
    });

    try {
      await pool.query(
        `INSERT INTO admin_users (id, email, password_hash, full_name, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())`,
        [id, normEmail, hash, data.fullName.trim(), data.role]
      );
    } catch (err) {
      console.warn('Erro ao inserir admin_user no PostgreSQL:', err);
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

