import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { AccessToken } from 'livekit-server-sdk';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const roomId = sanitizeInput(body.roomId || '');
    if (!roomId) {
      return NextResponse.json({ error: 'Room ID obrigatório.' }, { status: 400 });
    }

    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    // Identidade da sessão autenticada sempre prevalece: o corpo só nomeia convidados sem sessão,
    // e o id de convidado nunca pode reivindicar o de um usuário real
    const participantId = session
      ? session.id
      : `guest-${sanitizeInput(String(body.participantId || '')).replace(/^guest-/, '').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 32) || crypto.randomBytes(3).toString('hex')}`;
    const participantName = sanitizeInput(session?.name || body.participantName || 'Convidado Lumiardi');

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL;

    // Se o LiveKit Cloud estiver configurado com chaves
    if (apiKey && apiSecret && livekitUrl) {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: participantId,
        name: participantName,
        ttl: '6h',
      });

      at.addGrant({
        roomJoin: true,
        room: roomId,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });

      const token = await at.toJwt();

      return NextResponse.json({
        success: true,
        provider: 'livekit',
        token,
        serverUrl: livekitUrl,
        participantId,
        participantName,
        roomId,
      });
    }

    // Se as credenciais do LiveKit ainda não foram preenchidas no .env.local
    return NextResponse.json({
      success: false,
      configured: false,
      error: 'Credenciais do LiveKit Cloud (LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL) não configuradas no .env.local.',
      provider: 'webrtc_native',
    }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao emitir token LiveKit';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

