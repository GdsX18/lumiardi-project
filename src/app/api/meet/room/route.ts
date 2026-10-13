import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sanitizeInput } from '@/lib/security';
import { getMeetSession, meetUserRole, newMeetRoomId, resolveMeetParticipantId } from '@/lib/meetIdentity';
import { MeetService } from '@/services/meetService';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const action = rawBody.action || 'create';

    // Salas só para contas logadas: status, criação e saída nunca aceitam identidade vinda do corpo
    const session = await getMeetSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Faça login para usar o Lumiardi Meet.', code: 'unauthorized' }, { status: 401 });
    }

    const participantId = resolveMeetParticipantId(session, rawBody.participantId);
    const participantName = session.name || 'Membro VIP Lumiardi';
    const userRole = meetUserRole(session);

    // 1. AÇÃO: Encerrar ou Sair de uma Sala
    if (action === 'leave' || action === 'end') {
      const targetRoomId = sanitizeInput(rawBody.roomId || '');
      if (targetRoomId) {
        const result = await MeetService.leaveRoom({
          roomId: targetRoomId,
          participantId,
        });
        return NextResponse.json({
          success: true,
          destroyed: result.destroyed,
          remainingParticipants: result.remainingParticipants,
          roomId: targetRoomId,
        });
      }
      return NextResponse.json({ success: true, destroyed: true });
    }

    // 2. AÇÃO: Obter Status de Sala Existente
    if (action === 'status') {
      const targetRoomId = sanitizeInput(rawBody.roomId || '');
      const room = await MeetService.getRoom(targetRoomId);
      if (!room) {
        return NextResponse.json({ exists: false, error: 'Sala inexistente ou já finalizada.' });
      }
      return NextResponse.json({
        exists: true,
        roomId: room.roomId,
        hostName: room.hostName,
        provider: room.provider,
        dailyRoomUrl: room.dailyRoomUrl,
      });
    }

    // 3. AÇÃO: Criar Nova Sala Dinâmica sob Demanda (id aleatório; nomes escolhidos seriam adivinháveis)
    const roomId = newMeetRoomId();

    const passcode = crypto.randomInt(100000, 999999).toString();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/dashboard/meet?room=${encodeURIComponent(roomId)}`;

    const livekitKey = process.env.LIVEKIT_API_KEY;
    const livekitSecret = process.env.LIVEKIT_API_SECRET;
    const dailyApiKey = process.env.DAILY_API_KEY;
    let dailyRoomUrl: string | null = null;
    let dailyToken: string | null = null;
    let provider: 'livekit' | 'daily.co' | 'webrtc_native' = 'webrtc_native';

    if (livekitKey && livekitSecret) {
      provider = 'livekit';
    } else if (dailyApiKey) {
      try {
        const cleanDailyRoomName = `lumiardi-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`;
        const dailyRes = await fetch('https://api.daily.co/v1/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${dailyApiKey}`,
          },
          body: JSON.stringify({
            name: cleanDailyRoomName,
            privacy: 'public',
            properties: {
              exp: Math.round(Date.now() / 1000) + 7200,
              enable_screenshare: true,
              enable_chat: true,
              enable_knocking: true,
              enable_recording: 'cloud',
              start_video_off: false,
              start_audio_off: false,
            },
          }),
        });

        if (dailyRes.ok) {
          const dailyData = await dailyRes.json();
          dailyRoomUrl = dailyData.url;
          provider = 'daily.co';
        }
      } catch (dailyErr) {
        console.warn('Daily.co API fallback to Native WebRTC:', dailyErr);
      }
    }

    // Registra a sala no banco de dados compartilhado
    const roomRecord = await MeetService.createOrGetRoom({
      roomId,
      hostId: session.id,
      hostName: participantName,
      passcode,
      provider,
      dailyRoomUrl,
      dailyToken,
    });

    // Registra a presença do host como participante
    await MeetService.joinRoom({
      roomId,
      participantId,
      participantName,
      userRole,
    });

    return NextResponse.json({
      success: true,
      participantId,
      roomId: roomRecord.roomId,
      passcode,
      inviteUrl,
      dailyRoomUrl: roomRecord.dailyRoomUrl,
      dailyToken: roomRecord.dailyToken,
      provider: roomRecord.provider,
      hostName: participantName,
      createdAt: roomRecord.createdAt,
      encryption: 'AES-256-GCM / WebRTC DTLS-SRTP',
    });
  } catch (err: unknown) {
    console.error('[Meet Room] Erro:', err);
    return NextResponse.json({ error: 'Erro ao processar requisição de sala' }, { status: 500 });
  }
}
