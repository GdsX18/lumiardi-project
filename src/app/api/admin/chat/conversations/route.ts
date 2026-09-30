import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedAdminSession } from '@/lib/apiAuth';
import { pool, initDatabase } from '@/lib/db';

export interface AdminConversation {
  userId: string;
  displayName: string;
  userRole: 'MODELO' | 'AGENCIA';
  email: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  curationStatus: string;
}

const searchParam = (term: string) => `%${term}%`;

export async function GET(request: NextRequest) {
  try {
    const session = await getVerifiedAdminSession();

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'criadora' | 'agencia'
    const search = (searchParams.get('search') || '').toLowerCase().trim();

    await initDatabase();

    // ─── PostgreSQL: uma conversa por candidata no canal 'curation' ───────────
    // A thread reúne tudo que ela enviou (sender_id) ou recebeu da curadoria (receiver_id) — a mesma
    // regra usada por /api/chat/messages quando o admin abre a conversa (targetUserId).
    const roleFilter =
      filter === 'criadora' ? "AND u.role = 'MODELO'" :
      filter === 'agencia' ? "AND u.role = 'AGENCIA'" :
      '';

    const searchFilter = search
      ? `AND (
          LOWER(COALESCE(p.artistic_name, '')) LIKE $1
          OR LOWER(COALESCE(p.corporate_name, '')) LIKE $1
          OR LOWER(u.email) LIKE $1
          OR LOWER(u.full_name) LIKE $1
        )`
      : '';

    const res = await pool.query(
      `
      SELECT
        u.id                                                     AS user_id,
        COALESCE(p.artistic_name, p.corporate_name, u.full_name) AS display_name,
        u.role                                                   AS user_role,
        u.email,
        u.curation_status,
        COALESCE(lm.text, 'Canal oficial de curadoria inicializado.') AS last_message,
        COALESCE(lm.created_at, u.created_at)                   AS last_time,
        COALESCE(lm.unread_count, 0)                             AS unread_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN LATERAL (
        SELECT m.text, m.created_at,
          (
            SELECT COUNT(*)
            FROM messages unread
            WHERE unread.conversation_id = 'curation'
              AND unread.sender_id = u.id
              AND unread.is_read = FALSE
          )::int AS unread_count
        FROM messages m
        WHERE m.conversation_id = 'curation'
          AND (m.sender_id = u.id OR m.receiver_id = u.id)
        ORDER BY m.created_at DESC
        LIMIT 1
      ) lm ON TRUE
      WHERE u.role IN ('MODELO', 'AGENCIA')
        ${roleFilter}
        ${searchFilter}
      ORDER BY COALESCE(lm.created_at, u.created_at) DESC
      `,
      search ? [searchParam(search)] : []
    );

    const conversations: AdminConversation[] = res.rows.map((row) => ({
      userId: row.user_id as string,
      displayName: (row.display_name as string) || row.email,
      userRole: (row.user_role as 'MODELO' | 'AGENCIA'),
      email: row.email as string,
      lastMessage: (row.last_message as string) || '',
      lastTime: row.last_time
        ? new Date(row.last_time as string).toISOString()
        : new Date().toISOString(),
      unreadCount: Number(row.unread_count) || 0,
      curationStatus: (row.curation_status as string) || 'EM_CURATORIA',
    }));

    // Ordena por última mensagem (mais recente primeiro)
    conversations.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());

    return NextResponse.json({ success: true, conversations });
  } catch (err: unknown) {
    console.error('[admin/chat/conversations] Erro:', err);
    return NextResponse.json({ error: 'Erro ao listar conversas.', code: 'service_unavailable' }, { status: 500 });
  }
}

