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
