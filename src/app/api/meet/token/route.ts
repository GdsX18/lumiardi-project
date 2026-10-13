import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { sanitizeInput } from '@/lib/security';
import { getMeetSession, resolveMeetParticipantId } from '@/lib/meetIdentity';
import { MeetService } from '@/services/meetService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const roomId = sanitizeInput(body.roomId || '');
    if (!roomId) {
      return NextResponse.json({ error: 'Room ID obrigatório.' }, { status: 400 });
    }

    // Token LiveKit só para contas logadas e para salas que existem (o id da sala é o convite)
    const session = await getMeetSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Faça login para entrar na chamada.', code: 'unauthorized' }, { status: 401 });
    }
    if (!(await MeetService.getRoom(roomId))) {
      return NextResponse.json({ error: 'Sala inexistente ou já finalizada.', code: 'room_not_found' }, { status: 404 });
    }

    const participantId = resolveMeetParticipantId(session, body.participantId);
    const participantName = sanitizeInput(session.name || 'Membro Lumiardi');

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
    console.error('[Meet Token] Erro:', err);
    return NextResponse.json({ error: 'Erro ao emitir token LiveKit' }, { status: 500 });
  }
}

