/**
 * LUMIARDI — Autorização server-side para rotas de API.
 *
 * O cookie assinado prova QUEM é o usuário; papéis administrativos são revalidados no banco
 * para que desativações e mudanças de cargo tenham efeito imediato (sem esperar o cookie expirar).
 */

import { getSessionFromCookie, SessionUser } from '@/lib/auth';
import { pool, initDatabase } from '@/lib/db';

const ADMIN_CACHE_TTL_MS = 30_000;
const adminCache = new Map<string, { at: number; role: SessionUser['curationRole'] | null }>();

/** Consulta (com cache curto) o cargo ativo do membro da curadoria; null se inativo/inexistente. */
async function getActiveAdminRole(adminId: string, email?: string): Promise<SessionUser['curationRole'] | null> {
  const cacheKey = `${adminId}:${email || ''}`;
  const cached = adminCache.get(cacheKey);
  if (cached && Date.now() - cached.at < ADMIN_CACHE_TTL_MS) return cached.role;

  await initDatabase();
  const res = await pool.query(
    'SELECT role, status FROM admin_users WHERE id = $1 OR ($2 != \'\' AND LOWER(email) = LOWER($2)) ORDER BY updated_at DESC LIMIT 1',
    [adminId, email || '']
  );
  const row = res.rows[0];
  const role = row && row.status === 'active' ? ((row.role as SessionUser['curationRole']) || 'admin') : null;
  adminCache.set(cacheKey, { at: Date.now(), role });
  return role;
}

/** Invalida o cache após alterar um membro da equipe. */
export function invalidateAdminCache(adminId?: string) {
  if (adminId) adminCache.delete(adminId);
  else adminCache.clear();
}

export type MemberRole = 'criadora' | 'agencia';

const MEMBER_DB_ROLE: Record<MemberRole, string> = { criadora: 'MODELO', agencia: 'AGENCIA' };

/**
 * Sessão de modelo/agência com papel e aprovação confirmados no banco: o cookie pode estar
 * desatualizado (conta pendente, rejeitada ou suspensa depois do login). null caso contrário.
 */
export async function getApprovedMemberSession(roles: MemberRole[]): Promise<SessionUser | null> {
  const session = await getSessionFromCookie();
  if (!session || !roles.includes(session.role as MemberRole)) return null;

  await initDatabase();
  const res = await pool.query('SELECT role, curation_status FROM users WHERE id = $1 LIMIT 1', [session.id]);
  const row = res.rows[0];
  if (!row || row.role !== MEMBER_DB_ROLE[session.role as MemberRole] || row.curation_status !== 'APROVADO') {
    return null;
  }
  return session;
}

/** Quem pode navegar no catálogo de talentos: agência aprovada ou membro ativo da curadoria. */
export async function getCatalogViewerSession(): Promise<SessionUser | null> {
  return (await getVerifiedAdminSession()) || (await getApprovedMemberSession(['agencia']));
}

/** Sessão de membro ativo da curadoria, com `curationRole` atualizado do banco; null caso contrário. */
export async function getVerifiedAdminSession(): Promise<SessionUser | null> {
  const session = await getSessionFromCookie();
  if (!session || session.role !== 'admin') return null;
  try {
    const role = await getActiveAdminRole(session.id, session.email);
    if (!role) return null;
    return { ...session, curationRole: role };
  } catch (err) {
    console.error('[apiAuth] Falha ao validar membro da curadoria:', err);
    return null;
  }
}
