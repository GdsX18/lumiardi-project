import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { pool, initDatabase, fallbackStore } from '@/lib/db';

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

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all' | 'criadora' | 'agencia'
    const search = (searchParams.get('search') || '').toLowerCase().trim();

    await initDatabase();

    let conversations: AdminConversation[] = [];

    // ─── PostgreSQL: agrupa mensagens por sender_id no canal 'curation' ───────
    try {
      const roleFilter =
        filter === 'criadora' ? "AND u.role = 'MODELO'" :
        filter === 'agencia' ? "AND u.role = 'AGENCIA'" :
        '';

      const searchFilter = search
        ? `AND (
            LOWER(COALESCE(p.artistic_name, '')) LIKE $2
            OR LOWER(COALESCE(p.corporate_name, '')) LIKE $2
            OR LOWER(u.email) LIKE $2
            OR LOWER(u.full_name) LIKE $2
          )`
        : '';

      const searchParam = `%${search}%`;

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
                AND unread.sender_id != $1
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
        search ? [session.id, searchParam] : [session.id]
      );

      conversations = res.rows.map((row) => ({
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
    } catch (dbErr) {
      console.warn('[AdminChat] PostgreSQL unavailable, using fallbackStore:', dbErr);

      // ─── Fallback: deriva conversas da tabela em memória ──────────────────
      for (const u of fallbackStore.users.values()) {
        const uObj = u as Record<string, unknown>;
        if (uObj.role !== 'MODELO' && uObj.role !== 'AGENCIA') continue;
        const userRole = (uObj.role as string) === 'MODELO' ? 'MODELO' : 'AGENCIA';
        if (filter === 'criadora' && userRole !== 'MODELO') continue;
        if (filter === 'agencia' && userRole !== 'AGENCIA') continue;

        const profileEntry = fallbackStore.profiles.get(String(uObj.id)) as Record<string, unknown> | undefined;
        const displayName = (
          (profileEntry?.artistic_name as string) ||
          (profileEntry?.corporate_name as string) ||
          (uObj.full_name as string) ||
          (uObj.email as string)
        );

        if (search) {
          const haystack = `${displayName} ${uObj.email} ${uObj.full_name}`.toLowerCase();
          if (!haystack.includes(search)) continue;
        }

        let lastMsg = 'Canal oficial de curadoria inicializado.';
        let lastTime = String(uObj.created_at || new Date().toISOString());

        for (const msg of fallbackStore.messages.values()) {
          const m = msg as Record<string, unknown>;
          if (m.conversation_id !== 'curation') continue;
          if (m.sender_id === uObj.id || m.receiver_id === uObj.id) {
            if (String(m.created_at) > lastTime) {
              lastMsg = String(m.text || '');
              lastTime = String(m.created_at);
            }
          }
        }

        conversations.push({
          userId: String(uObj.id),
          displayName,
          userRole,
          email: String(uObj.email),
          lastMessage: lastMsg,
          lastTime,
          unreadCount: 0,
          curationStatus: String(uObj.curation_status || 'EM_CURATORIA'),
        });
      }
    }

    // Ordena por última mensagem (mais recente primeiro)
    conversations.sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());

    return NextResponse.json({ success: true, conversations });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao listar conversas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

