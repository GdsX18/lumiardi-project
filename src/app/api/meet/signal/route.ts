import { NextRequest, NextResponse } from 'next/server';
import { sanitizeInput } from '@/lib/security';

interface SignalPayload {
  id: string;
  senderId: string;
  targetId?: string;
  type: 'offer' | 'answer' | 'candidate';
  data: unknown;
  timestamp: number;
}

interface RoomSignalingState {
  roomId: string;
  updatedAt: number;
  participants: Map<string, { id: string; name: string; role: 'caller' | 'callee'; joinedAt: number }>;
  signals: SignalPayload[];
}

declare global {
  // eslint-disable-next-line no-var
  var __lumiardi_signals: Map<string, RoomSignalingState> | undefined;
}

const signalingStore = globalThis.__lumiardi_signals || new Map<string, RoomSignalingState>();
globalThis.__lumiardi_signals = signalingStore;

function cleanStaleRooms() {
  const now = Date.now();
  for (const [roomId, state] of signalingStore.entries()) {
    if (now - state.updatedAt > 60 * 60 * 1000) {
      signalingStore.delete(roomId);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    cleanStaleRooms();
    const body = await request.json().catch(() => ({}));
    const action = body.action;
    const roomId = sanitizeInput(body.roomId || '');
    const participantId = sanitizeInput(body.participantId || '');
    const participantName = sanitizeInput(body.participantName || 'Convidado VIP');

    if (!roomId) {
      return NextResponse.json({ error: 'Room ID obrigatório.' }, { status: 400 });
    }

    let room = signalingStore.get(roomId);
    if (!room) {
      room = {
        roomId,
        updatedAt: Date.now(),
        participants: new Map(),
        signals: [],
      };
      signalingStore.set(roomId, room);
    }
    room.updatedAt = Date.now();

    // 1. AÇÃO: Ingressar na Sala
    if (action === 'join') {
      let role: 'caller' | 'callee' = 'caller';
      if (room.participants.size >= 1 && !room.participants.has(participantId)) {
        role = 'callee';
      } else if (room.participants.has(participantId)) {
        role = room.participants.get(participantId)!.role;
      }

      room.participants.set(participantId, {
        id: participantId,
        name: participantName,
        role,
        joinedAt: Date.now(),
      });

      const participantList = Array.from(room.participants.values());

      return NextResponse.json({
        success: true,
        role,
        participants: participantList,
      });
    }

    // 2. AÇÃO: Enviar Sinal (Offer, Answer, ICE Candidate)
    if (action === 'signal') {
      const { type, data, targetId } = body;
      if (!type || !data) {
        return NextResponse.json({ error: 'Tipo e dados de sinalização obrigatórios.' }, { status: 400 });
      }

      const signalItem: SignalPayload = {
        id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderId: participantId,
        targetId,
        type,
        data,
        timestamp: Date.now(),
      };

      room.signals.push(signalItem);

      // Mantém no máximo 50 sinais pendentes por sala
      if (room.signals.length > 50) {
        room.signals = room.signals.slice(-50);
      }

      return NextResponse.json({ success: true, signalId: signalItem.id });
    }

    // 3. AÇÃO: Polling de Sinais Pendentes
    if (action === 'poll') {
      const now = Date.now();
      // Retorna sinais enviados por outros participantes destinados a mim ou sem destino explícito
      const mySignals = room.signals.filter(
        (s) => s.senderId !== participantId && (!s.targetId || s.targetId === participantId)
      );

      // Remove os sinais entregues da fila
      room.signals = room.signals.filter(
        (s) => !(s.senderId !== participantId && (!s.targetId || s.targetId === participantId))
      );

      // Purga sinais com mais de 30 segundos
      room.signals = room.signals.filter((s) => now - s.timestamp < 30000);

      const participantList = Array.from(room.participants.values());

      return NextResponse.json({
        success: true,
        signals: mySignals,
        participants: participantList,
      });
    }

    // 4. AÇÃO: Sair da Sala
    if (action === 'leave') {
      room.participants.delete(participantId);

      // Notifica saída aos demais se ainda restarem participantes
      if (room.participants.size === 0) {
        signalingStore.delete(roomId);
        return NextResponse.json({ success: true, destroyed: true });
      }

      return NextResponse.json({
        success: true,
        remainingParticipants: room.participants.size,
      });
    }

    return NextResponse.json({ error: 'Ação de sinalização inválida.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro no canal de sinalização';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

