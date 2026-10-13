import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/apiAuth';

import { pool, initDatabase } from '@/lib/db';
import { getClientIp } from '@/lib/security/rateLimiter';

export async function POST(req: NextRequest) {
  try {
    const session = await getActiveSession();
    const body = await req.json();
    // Versão registrada no aceite (prova legal): só versões publicadas
    const termsVersion = typeof body.termsVersion === 'string' && /^v\d+(\.\d+)*-\d{4}-\d{2}$/.test(body.termsVersion)
      ? body.termsVersion
      : 'v2.1-2026-09';

    const clientIp = getClientIp(req.headers);
    const userAgent = req.headers.get('user-agent') || '';

    if (session?.id) {
      try {
        await initDatabase();
        await pool.query(
          `INSERT INTO terms_acceptances (id, user_id, terms_version, accepted_at, client_ip, user_agent)
           VALUES ($1, $2, $3, NOW(), $4, $5)
           ON CONFLICT (user_id, terms_version) DO UPDATE
           SET accepted_at = NOW(), client_ip = EXCLUDED.client_ip`,
          [
            `ta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            session.id,
            termsVersion,
            clientIp,
            userAgent,
          ]
        );
      } catch (dbErr) {
        console.error('[terms/accept] DB error (non-fatal):', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      acceptedAt: new Date().toISOString(),
      termsVersion,
    });
  } catch (error: unknown) {
    console.error('[api/terms/accept] Erro:', error);
    return NextResponse.json(
      { error: 'Failed to record acceptance' },
      { status: 500 }
    );
  }
}
