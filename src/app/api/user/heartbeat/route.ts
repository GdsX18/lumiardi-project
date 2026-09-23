import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { StorageService } from '@/services/storageService';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    await StorageService.updateUserLastSeen(session.id);

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar heartbeat';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

