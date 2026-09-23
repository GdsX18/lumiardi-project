import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sanitizeInput } from '@/lib/security';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { MeetService } from '@/services/meetService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action;
    const roomId = sanitizeInput(body.roomId || '');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID obrigatório.' }, { status: 400 });
    }

    const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = decodeSession(cookie);

    const participantId = sanitizeInput(body.participantId || session?.id || `guest-${crypto.randomBytes(3).toString('hex')}`);
    const participantName = sanitizeInput(body.participantName || session?.name || 'Membro VIP Lumiardi');
    const userRole: 'agency' | 'model' | 'admin' | 'guest' =
      session?.role === 'agencia'
        ? 'agency'
        : session?.role === 'criadora'
        ? 'model'
        : session?.role === 'admin'
        ? 'admin'
        : (body.userRole as 'agency' | 'model' | 'admin' | 'guest') || 'guest';

    // 1. AÇÃO: Ingressar na Sala
    if (action === 'join') {
      const joinResult = await MeetService.joinRoom({
        roomId,
        participantId,
        participantName,
        userRole,
      });

      return NextResponse.json({
        success: true,
        role: joinResult.role,
        participants: joinResult.participants,
      });
    }

    // 2. AÇÃO: Enviar Sinal (Offer, Answer, ICE Candidate)
    if (action === 'signal') {
      const { type, data, targetId } = body;
      if (!type || !data) {
        return NextResponse.json({ error: 'Tipo e dados de sinalização obrigatórios.' }, { status: 400 });
      }

      const signalRes = await MeetService.addSignal({
        roomId,
        senderId: participantId,
        targetId: targetId ? sanitizeInput(targetId) : undefined,
        type,
        data,
      });

      return NextResponse.json({ success: true, signalId: signalRes.signalId });
    }

    // 3. AÇÃO: Polling de Sinais Pendentes & Presença
    if (action === 'poll') {
      const pollResult = await MeetService.pollSignals({
        roomId,
        participantId,
      });

      return NextResponse.json({
        success: true,
        myRole: pollResult.myRole,
        signals: pollResult.signals,
        participants: pollResult.participants,
      });
    }

    // 4. AÇÃO: Sair da Sala
    if (action === 'leave') {
      const leaveResult = await MeetService.leaveRoom({
        roomId,
        participantId,
      });

      return NextResponse.json({
        success: true,
        remainingParticipants: leaveResult.remainingParticipants,
        destroyed: leaveResult.destroyed,
      });
    }

    return NextResponse.json({ error: 'Ação de sinalização inválida.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro no canal de sinalização';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
