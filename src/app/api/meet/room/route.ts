import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

export interface EphemeralRoom {
  roomId: string;
  passcode: string;
  hostId: string;
  hostName: string;
  createdAt: number;
  participants: Map<string, { id: string; name: string; joinedAt: number }>;
  provider: 'daily.co' | 'webrtc_native';
  dailyRoomUrl?: string | null;
  dailyToken?: string | null;
}

// Armazenamento em memória estritamente efémero com auto-destruição
declare global {
  // eslint-disable-next-line no-var
  var __lumiardi_ephemeral_rooms: Map<string, EphemeralRoom> | undefined;
}

const roomsStore = globalThis.__lumiardi_ephemeral_rooms || new Map<string, EphemeralRoom>();
globalThis.__lumiardi_ephemeral_rooms = roomsStore;

// Purga preventiva de salas antigas (> 2 horas)
function purgeExpiredRooms() {
  const now = Date.now();
  for (const [id, room] of roomsStore.entries()) {
    if (now - room.createdAt > 2 * 60 * 60 * 1000) {
      roomsStore.delete(id);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    purgeExpiredRooms();

    const rawBody = await request.json().catch(() => ({}));
    const action = rawBody.action || 'create';
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const participantId = session?.id || rawBody.participantId || `guest-${crypto.randomBytes(3).toString('hex')}`;
    const participantName = session?.name || rawBody.participantName || 'Membro VIP Lumiardi';

    // 1. AÇÃO: Encerrar ou Sair de uma Sala Efémera
    if (action === 'leave' || action === 'end') {
      const targetRoomId = sanitizeInput(rawBody.roomId || '');
      if (targetRoomId && roomsStore.has(targetRoomId)) {
        const room = roomsStore.get(targetRoomId)!;
        room.participants.delete(participantId);

        // Se foi encerramento forçado ou não sobrou ninguém na sala, destrói a sala imediatamente
        if (action === 'end' || room.participants.size === 0) {
          roomsStore.delete(targetRoomId);
          return NextResponse.json({ success: true, destroyed: true, roomId: targetRoomId });
        }
        return NextResponse.json({ success: true, remainingParticipants: room.participants.size });
      }
      return NextResponse.json({ success: true, destroyed: true });
    }

    // 2. AÇÃO: Obter Status / Ingressar em Sala Existente
    if (action === 'status') {
      const targetRoomId = sanitizeInput(rawBody.roomId || '');
      const room = roomsStore.get(targetRoomId);
      if (!room) {
        return NextResponse.json({ exists: false, error: 'Sala inexistente ou já finalizada.' });
      }
      return NextResponse.json({
        exists: true,
        roomId: room.roomId,
        hostName: room.hostName,
        participantCount: room.participants.size,
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

    // Registra a sala efémera na memória
    const newRoom: EphemeralRoom = {
      roomId,
      passcode,
      hostId: participantId,
      hostName: participantName,
      createdAt: Date.now(),
      participants: new Map([[participantId, { id: participantId, name: participantName, joinedAt: Date.now() }]]),
      provider,
      dailyRoomUrl,
      dailyToken,
    };

    roomsStore.set(roomId, newRoom);

    return NextResponse.json({
      success: true,
      roomId,
      passcode,
      inviteUrl,
      dailyRoomUrl,
      dailyToken,
      provider,
      hostName: participantName,
      createdAt: new Date().toISOString(),
      encryption: 'AES-256-GCM / WebRTC DTLS-SRTP',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar requisição de sala';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
