import { NextRequest, NextResponse } from 'next/server';
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

    const participantId = sanitizeInput(body.participantId || session?.id || `guest-${Math.random().toString(36).substring(2, 7)}`);
    const participantName = sanitizeInput(body.participantName || session?.name || 'Membro VIP Lumiardi');

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

