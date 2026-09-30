import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth';
import { pool, initDatabase } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const body = await req.json();
    const { termsVersion = 'v2.1-2026-09' } = body;

    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
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
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to record acceptance', detail: error.message },
      { status: 500 }
    );
  }
}
