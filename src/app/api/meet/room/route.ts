import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';
import { MeetService } from '@/services/meetService';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => ({}));
    const action = rawBody.action || 'create';
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const participantId = session?.id || rawBody.participantId || `guest-${crypto.randomBytes(3).toString('hex')}`;
    const participantName = session?.name || rawBody.participantName || 'Membro VIP Lumiardi';
    const userRole: 'agency' | 'model' | 'admin' | 'guest' =
      session?.role === 'agencia'
        ? 'agency'
        : session?.role === 'criadora'
        ? 'model'
        : session?.role === 'admin'
        ? 'admin'
        : 'guest';

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

    // 3. AÇÃO: Criar Nova Sala Dinâmica sob Demanda
    const customRoomName = sanitizeInput(rawBody.roomName || '');
    const roomId = customRoomName
      ? `LM-${customRoomName.toUpperCase().replace(/[^A-Z0-9-]/g, '')}`
      : `LM-${crypto.randomBytes(3).toString('hex').toUpperCase()}-VIP`;

    const passcode = crypto.randomInt(100000, 999999).toString();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/dashboard/meet?room=${encodeURIComponent(roomId)}`;

    const dailyApiKey = process.env.DAILY_API_KEY;
    let dailyRoomUrl: string | null = null;
    let dailyToken: string | null = null;
    let provider: 'daily.co' | 'webrtc_native' = 'webrtc_native';

    if (dailyApiKey) {
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
      hostId: participantId,
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
    const msg = err instanceof Error ? err.message : 'Erro ao processar requisição de sala';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
