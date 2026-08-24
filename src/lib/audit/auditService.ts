/**
 * Serviço de Auditoria e Rastreabilidade da Curadoria Lumiardi (Audit Logs)
 * Registra e consulta logs imutáveis com suporte a PostgreSQL e fallback em memória.
 */

import { pool, initDatabase, fallbackStore } from '@/lib/db';
import { CurationAuditLog, AuditActionType } from '@/types';

export interface LogActionParams {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  actionType: AuditActionType | string;
  targetId?: string;
  targetName?: string;
  targetType?: 'MODELO' | 'AGENCIA' | 'USUARIO_CURADORIA' | 'DOCUMENTO' | string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export interface ListLogsParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  actionType?: string;
  curadorId?: string;
  searchTerm?: string;
}

export const AuditLogService = {
  /**
   * Registra um evento imutável na trilha de auditoria
   */
  async logAction(params: LogActionParams): Promise<CurationAuditLog> {
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const logEntry: CurationAuditLog = {
      id,
      userId: params.userId,
      userName: params.userName,
      userEmail: params.userEmail,
      userRole: params.userRole,
      actionType: params.actionType,
      targetId: params.targetId,
      targetName: params.targetName,
      targetType: params.targetType || 'MODELO',
      details: params.details || {},
      ipAddress: params.ipAddress || '127.0.0.1',
      createdAt: now,
    };

    // Salva no fallbackStore em memória
    fallbackStore.curation_audit_logs.set(id, logEntry as unknown as Record<string, unknown>);

    await initDatabase();

    try {
      await pool.query(
        `INSERT INTO curation_audit_logs (
          id, user_id, user_name, user_email, user_role, action_type,
          target_id, target_name, target_type, details, ip_address, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [
          id,
          params.userId,
          params.userName,
          params.userEmail,
          params.userRole,
          params.actionType,
          params.targetId || null,
          params.targetName || null,
          params.targetType || null,
          JSON.stringify(params.details || {}),
          params.ipAddress || '127.0.0.1',
        ]
      );
    } catch (err) {
      console.warn('[AuditLogService] Falha ao persistir log no PostgreSQL, mantido no fallbackStore:', err);
    }

    return logEntry;
  },

  /**
   * Consulta logs com filtros e paginação
   */
  async listLogs(params: ListLogsParams = {}): Promise<{
    logs: CurationAuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    await initDatabase();

    try {
      let query = `SELECT * FROM curation_audit_logs WHERE 1=1`;
      const queryParams: unknown[] = [];

      if (params.actionType && params.actionType !== 'ALL') {
        queryParams.push(params.actionType);
        query += ` AND action_type = $${queryParams.length}`;
      }

      if (params.curadorId && params.curadorId !== 'ALL') {
        queryParams.push(params.curadorId);
        query += ` AND user_id = $${queryParams.length}`;
      }

      if (params.startDate) {
        queryParams.push(params.startDate);
        query += ` AND created_at >= $${queryParams.length}`;
      }

      if (params.endDate) {
        queryParams.push(params.endDate);
        query += ` AND created_at <= $${queryParams.length}`;
      }

      if (params.searchTerm && params.searchTerm.trim()) {
        const term = `%${params.searchTerm.trim().toLowerCase()}%`;
        queryParams.push(term);
        query += ` AND (
          LOWER(user_name) LIKE $${queryParams.length} OR
          LOWER(user_email) LIKE $${queryParams.length} OR
          LOWER(target_name) LIKE $${queryParams.length} OR
          LOWER(action_type) LIKE $${queryParams.length}
        )`;
      }

      // Total count query
      const countRes = await pool.query(
        query.replace('SELECT * FROM curation_audit_logs', 'SELECT COUNT(*) as total FROM curation_audit_logs'),
        queryParams
      );
      const total = Number(countRes.rows[0]?.total) || 0;

      // Paged logs query
      queryParams.push(limit);
      query += ` ORDER BY created_at DESC LIMIT $${queryParams.length}`;
      queryParams.push(offset);
      query += ` OFFSET $${queryParams.length}`;

      const res = await pool.query(query, queryParams);

      if (res.rows.length > 0) {
        const logs: CurationAuditLog[] = res.rows.map((row) => ({
          id: row.id,
          userId: row.user_id,
          userName: row.user_name,
          userEmail: row.user_email,
          userRole: row.user_role,
          actionType: row.action_type,
          targetId: row.target_id,
          targetName: row.target_name,
          targetType: row.target_type,
          details: row.details,
          ipAddress: row.ip_address,
          createdAt: row.created_at,
        }));

        return {
          logs,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        };
      }
    } catch {
      // Fallback
    }

    // Fallback store
    let allLogs = Array.from(fallbackStore.curation_audit_logs.values()) as unknown as CurationAuditLog[];

    if (params.actionType && params.actionType !== 'ALL') {
      allLogs = allLogs.filter((l) => l.actionType === params.actionType);
    }
    if (params.curadorId && params.curadorId !== 'ALL') {
      allLogs = allLogs.filter((l) => l.userId === params.curadorId);
    }
    if (params.startDate) {
      const startTime = new Date(params.startDate).getTime();
      allLogs = allLogs.filter((l) => new Date(l.createdAt).getTime() >= startTime);
    }
    if (params.endDate) {
      const endTime = new Date(params.endDate).getTime();
      allLogs = allLogs.filter((l) => new Date(l.createdAt).getTime() <= endTime);
    }
    if (params.searchTerm && params.searchTerm.trim()) {
      const term = params.searchTerm.trim().toLowerCase();
      allLogs = allLogs.filter(
        (l) =>
          (l.userName && l.userName.toLowerCase().includes(term)) ||
          (l.userEmail && l.userEmail.toLowerCase().includes(term)) ||
          (l.targetName && l.targetName.toLowerCase().includes(term)) ||
          (l.actionType && l.actionType.toLowerCase().includes(term))
      );
    }

    allLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = allLogs.length;
    const paginatedLogs = allLogs.slice(offset, offset + limit);

    return {
      logs: paginatedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },
};
