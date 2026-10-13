/**
 * LUMIARDI — Autorização server-side para rotas de API.
 *
 * O cookie assinado prova QUEM é o usuário; o banco diz se a conta ainda vale. Toda rota de API
 * lê a sessão por `getActiveSession`, que recusa:
 *  - contas apagadas e membros da curadoria inativos;
 *  - cookies emitidos antes de `sessions_valid_after` (troca de senha, desligamento, revogação).
 * O resultado fica em cache curto por instância, então desativações valem em até ~30s.
 */

import { getSessionFromCookie, SessionUser } from '@/lib/auth';
import { pool, initDatabase } from '@/lib/db';

const ACCOUNT_CACHE_TTL_MS = 30_000;

interface AccountState {
  at: number;
  /** false = conta inexistente ou (curadoria) inativa */
  active: boolean;
  /** epoch em segundos; cookies com iat anterior foram revogados */
  validAfter: number | null;
  curationRole: SessionUser['curationRole'] | null;
}

const accountCache = new Map<string, AccountState>();

function cacheKey(kind: 'admin' | 'member', id: string) {
  return `${kind}:${id}`;
}

async function loadAccountState(kind: 'admin' | 'member', id: string): Promise<AccountState> {
  const key = cacheKey(kind, id);
  const cached = accountCache.get(key);
  if (cached && Date.now() - cached.at < ACCOUNT_CACHE_TTL_MS) return cached;

  await initDatabase();
  let state: AccountState;
  if (kind === 'admin') {
    // Só pelo id: um e-mail reaproveitado por outro membro nunca reativa um cookie antigo
    const res = await pool.query('SELECT role, status, sessions_valid_after FROM admin_users WHERE id = $1 LIMIT 1', [id]);
    const row = res.rows[0];
    state = {
      at: Date.now(),
      active: Boolean(row && row.status === 'active'),
      validAfter: row?.sessions_valid_after ? Math.floor(new Date(row.sessions_valid_after).getTime() / 1000) : null,
      curationRole: row ? ((row.role as SessionUser['curationRole']) || 'admin') : null,
    };
  } else {
    const res = await pool.query('SELECT sessions_valid_after FROM users WHERE id = $1 LIMIT 1', [id]);
    const row = res.rows[0];
    state = {
      at: Date.now(),
      active: Boolean(row),
      validAfter: row?.sessions_valid_after ? Math.floor(new Date(row.sessions_valid_after).getTime() / 1000) : null,
      curationRole: null,
    };
  }
  accountCache.set(key, state);
  return state;
}

/**
 * Sessão do cookie, confirmada no banco (conta existente/ativa e não revogada); null caso contrário.
 * Para membros da curadoria, `curationRole` vem do banco, nunca do cookie.
 */
export async function getActiveSession(cookieValue?: string | null): Promise<SessionUser | null> {
  const session = await getSessionFromCookie(cookieValue);
  if (!session) return null;
  try {
    const kind = session.role === 'admin' ? 'admin' : 'member';
    const state = await loadAccountState(kind, session.id);
    if (!state.active) return null;
    if (state.validAfter !== null && (session.iat ?? 0) < state.validAfter) return null;
    return kind === 'admin' ? { ...session, curationRole: state.curationRole || 'admin' } : session;
  } catch (err) {
    console.error('[apiAuth] Falha ao validar sessão:', err);
    return null;
  }
}

/** Invalida o cache de um membro da curadoria (ou de todos) após alterá-lo. */
export function invalidateAdminCache(adminId?: string) {
  if (adminId) accountCache.delete(cacheKey('admin', adminId));
  else accountCache.clear();
}

/** Invalida o cache de uma conta de modelo/agência. */
export function invalidateMemberCache(userId: string) {
  accountCache.delete(cacheKey('member', userId));
}

/** Derruba todas as sessões abertas da conta (cookies emitidos até agora deixam de valer). */
export async function revokeSessions(kind: 'admin' | 'member', id: string, db: { query: typeof pool.query } = pool) {
  const table = kind === 'admin' ? 'admin_users' : 'users';
  await db.query(`UPDATE ${table} SET sessions_valid_after = NOW() WHERE id = $1`, [id]);
  accountCache.delete(cacheKey(kind, id));
}

export type MemberRole = 'criadora' | 'agencia';

const MEMBER_DB_ROLE: Record<MemberRole, string> = { criadora: 'MODELO', agencia: 'AGENCIA' };

/**
 * Sessão de modelo/agência com papel e aprovação confirmados no banco: o cookie pode estar
 * desatualizado (conta pendente, rejeitada ou suspensa depois do login). null caso contrário.
 */
export async function getApprovedMemberSession(roles: MemberRole[]): Promise<SessionUser | null> {
  const session = await getActiveSession();
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
  const session = await getActiveSession();
  return session && session.role === 'admin' ? session : null;
}
