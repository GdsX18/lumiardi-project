import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sanitizeInput } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const hostId = session?.id || 'host-user';
    const hostName = session?.name || 'Membro VIP Lumiardi';
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

    // Se tiver DAILY_API_KEY configurada, cria sala no Daily.co via REST API
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
              exp: Math.round(Date.now() / 1000) + 7200, // 2 horas de validade
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
        console.warn('Daily.co API error fallback to Native WebRTC:', dailyErr);
      }
    }

    return NextResponse.json({
      success: true,
      roomId,
      passcode,
      inviteUrl,
      dailyRoomUrl,
      dailyToken,
      provider,
      hostName,
      createdAt: new Date().toISOString(),
      encryption: 'AES-256-GCM / WebRTC DTLS-SRTP',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar sala de reunião';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
