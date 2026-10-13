import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/security';
import { getMeetSession, meetUserRole, resolveMeetParticipantId } from '@/lib/meetIdentity';
import { MeetService } from '@/services/meetService';

const SIGNAL_TYPES = new Set(['offer', 'answer', 'candidate']);
const MAX_SIGNAL_BYTES = 64 * 1024;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action;
    const roomId = sanitizeInput(body.roomId || '');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID obrigatório.' }, { status: 400 });
    }

    // Sinalização só com sessão: o participante é sempre o da sessão (o corpo só escolhe a aba)
    const session = await getMeetSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Faça login para entrar na chamada.', code: 'unauthorized' }, { status: 401 });
    }

    const participantId = resolveMeetParticipantId(session, body.participantId);
    const participantName = sanitizeInput(String(body.participantName || session.name || 'Membro VIP Lumiardi')).slice(0, 120);
    const userRole = meetUserRole(session);

    // 1. AÇÃO: Ingressar na Sala
    if (action === 'join') {
      if (!(await MeetService.getRoom(roomId))) {
        return NextResponse.json({ error: 'Sala inexistente ou já finalizada.', code: 'room_not_found' }, { status: 404 });
      }
      const joinResult = await MeetService.joinRoom({
        roomId,
        participantId,
        participantName,
        userRole,
      });

      return NextResponse.json({
        success: true,
        participantId,
        role: joinResult.role,
        participants: joinResult.participants,
      });
    }

    // 2. AÇÃO: Enviar Sinal (Offer, Answer, ICE Candidate)
    if (action === 'signal') {
      // O widget envia `signalType`; `type` fica por compatibilidade
      const type = body.type ?? body.signalType;
      const { data, targetId } = body;
      if (!type || !data || !SIGNAL_TYPES.has(type)) {
        return NextResponse.json({ error: 'Tipo e dados de sinalização obrigatórios.' }, { status: 400 });
      }
      if (JSON.stringify(data).length > MAX_SIGNAL_BYTES) {
        return NextResponse.json({ error: 'Sinal grande demais.' }, { status: 413 });
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
        participantId,
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
    console.error('[Meet Signal] Erro:', err);
    return NextResponse.json({ error: 'Erro no canal de sinalização' }, { status: 500 });
  }
}
