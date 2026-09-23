import crypto from 'crypto';
import { pool, initDatabase, fallbackStore } from '@/lib/db';

export interface MeetRoomRecord {
  roomId: string;
  hostId: string;
  hostName: string;
  passcode?: string;
  provider: 'daily.co' | 'webrtc_native';
  dailyRoomUrl?: string | null;
  dailyToken?: string | null;
  createdAt: string;
}

export interface MeetParticipantRecord {
  id: string;
  name: string;
  role: 'caller' | 'callee';
  userRole: 'agency' | 'model' | 'admin' | 'guest';
  joinedAt: string;
  lastSeenAt: string;
}

export interface MeetSignalRecord {
  id: string;
  roomId: string;
  senderId: string;
  targetId?: string | null;
  type: 'offer' | 'answer' | 'candidate';
  data: unknown;
  timestamp: number;
}

export const MeetService = {
  /**
   * Cria ou recupera uma sala persistente compartilhada entre múltiplos nós
   */
  async createOrGetRoom(params: {
    roomId: string;
    hostId: string;
    hostName: string;
    passcode?: string;
    provider?: 'daily.co' | 'webrtc_native';
    dailyRoomUrl?: string | null;
    dailyToken?: string | null;
  }): Promise<MeetRoomRecord> {
    await initDatabase();
    const provider = params.provider || 'webrtc_native';

    try {
      const res = await pool.query('SELECT * FROM meet_rooms WHERE id = $1', [params.roomId]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          roomId: row.id,
          hostId: row.host_id,
          hostName: row.host_name,
          passcode: row.passcode,
          provider: row.provider || 'webrtc_native',
          dailyRoomUrl: row.daily_room_url,
          dailyToken: row.daily_token,
          createdAt: row.created_at?.toISOString() || new Date().toISOString(),
        };
      }

      await pool.query(
        `INSERT INTO meet_rooms (id, passcode, host_id, host_name, provider, daily_room_url, daily_token, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET updated_at = NOW()`,
        [
          params.roomId,
          params.passcode || null,
          params.hostId,
          params.hostName,
          provider,
          params.dailyRoomUrl || null,
          params.dailyToken || null,
        ]
      );

      return {
        roomId: params.roomId,
        hostId: params.hostId,
        hostName: params.hostName,
        passcode: params.passcode,
        provider,
        dailyRoomUrl: params.dailyRoomUrl,
        dailyToken: params.dailyToken,
        createdAt: new Date().toISOString(),
      };
    } catch {
      // Fallback em memória resiliente
      const existing = fallbackStore.meet_rooms.get(params.roomId) as MeetRoomRecord | undefined;
      if (existing) return existing;

      const record: MeetRoomRecord = {
        roomId: params.roomId,
        hostId: params.hostId,
        hostName: params.hostName,
        passcode: params.passcode,
        provider,
        dailyRoomUrl: params.dailyRoomUrl,
        dailyToken: params.dailyToken,
        createdAt: new Date().toISOString(),
      };
      fallbackStore.meet_rooms.set(params.roomId, record as unknown as Record<string, unknown>);
      return record;
    }
  },

  /**
   * Obtém detalhes de uma sala existente
   */
  async getRoom(roomId: string): Promise<MeetRoomRecord | null> {
    await initDatabase();
    try {
      const res = await pool.query('SELECT * FROM meet_rooms WHERE id = $1', [roomId]);
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          roomId: row.id,
          hostId: row.host_id,
          hostName: row.host_name,
          passcode: row.passcode,
          provider: row.provider || 'webrtc_native',
          dailyRoomUrl: row.daily_room_url,
          dailyToken: row.daily_token,
          createdAt: row.created_at?.toISOString() || new Date().toISOString(),
        };
      }
    } catch {
      // Fallback
    }

    const fallbackRoom = fallbackStore.meet_rooms.get(roomId) as MeetRoomRecord | undefined;
    return fallbackRoom || null;
  },

  /**
   * Ingressa um participante na sala, atribuindo papéis:
   * Primeiro participante -> 'caller'
   * Segundo participante -> 'callee'
   */
  async joinRoom(params: {
    roomId: string;
    participantId: string;
    participantName: string;
    userRole?: 'agency' | 'model' | 'admin' | 'guest';
  }): Promise<{ success: boolean; role: 'caller' | 'callee'; participants: MeetParticipantRecord[] }> {
    await initDatabase();
    const userRole = params.userRole || 'model';

    try {
      // 1. Busca participantes ativos nos últimos 45 segundos que não sejam este participante
      const othersRes = await pool.query(
        `SELECT * FROM meet_participants 
         WHERE room_id = $1 
           AND participant_id != $2 
           AND last_seen_at >= NOW() - INTERVAL '45 seconds'`,
        [params.roomId, params.participantId]
      );

      // 2. Verifica se o participante já tinha um papel previamente registrado nesta sala
      const meRes = await pool.query(
        'SELECT * FROM meet_participants WHERE room_id = $1 AND participant_id = $2',
        [params.roomId, params.participantId]
      );

      let role: 'caller' | 'callee' = 'caller';
      if (othersRes.rows.length >= 1) {
        // Já existe um interlocutor ativo na sala -> este participante é o callee
        role = 'callee';
      } else if (meRes.rows.length > 0) {
        // Se este participante já estava e ninguém mais está ativo, mantém o papel prévio
        role = (meRes.rows[0].role as 'caller' | 'callee') || 'caller';
      }

      // 3. Upsert do participante com timestamp atualizado
      await pool.query(
        `INSERT INTO meet_participants (room_id, participant_id, participant_name, role, user_role, joined_at, last_seen_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (room_id, participant_id) 
         DO UPDATE SET participant_name = $3, role = $4, user_role = $5, last_seen_at = NOW()`,
        [params.roomId, params.participantId, params.participantName, role, userRole]
      );

      // 4. Retorna a lista de todos os participantes ativos
      const allActiveRes = await pool.query(
        `SELECT * FROM meet_participants 
         WHERE room_id = $1 AND last_seen_at >= NOW() - INTERVAL '45 seconds'
         ORDER BY joined_at ASC`,
        [params.roomId]
      );

      const participants: MeetParticipantRecord[] = allActiveRes.rows.map((row) => ({
        id: row.participant_id,
        name: row.participant_name,
        role: row.role as 'caller' | 'callee',
        userRole: row.user_role as 'agency' | 'model' | 'admin' | 'guest',
        joinedAt: row.joined_at?.toISOString() || new Date().toISOString(),
        lastSeenAt: row.last_seen_at?.toISOString() || new Date().toISOString(),
      }));

      return { success: true, role, participants };
    } catch {
      // Fallback em memória
      const now = Date.now();
      const prefix = `${params.roomId}:`;
      const activeOthers: MeetParticipantRecord[] = [];
      let previousMe: MeetParticipantRecord | null = null;

      for (const [key, val] of fallbackStore.meet_participants.entries()) {
        if (key.startsWith(prefix)) {
          const part = val as unknown as MeetParticipantRecord & { lastSeenMs: number };
          if (part.id === params.participantId) {
            previousMe = part;
          } else if (now - (part.lastSeenMs || 0) < 45000) {
            activeOthers.push(part);
          }
        }
      }

      let role: 'caller' | 'callee' = 'caller';
      if (activeOthers.length >= 1) {
        role = 'callee';
      } else if (previousMe) {
        role = previousMe.role;
      }

      const myRecord = {
        id: params.participantId,
        name: params.participantName,
        role,
        userRole,
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        lastSeenMs: now,
      };

      fallbackStore.meet_participants.set(`${params.roomId}:${params.participantId}`, myRecord as unknown as Record<string, unknown>);

      const allActive: MeetParticipantRecord[] = [myRecord, ...activeOthers];
      return { success: true, role, participants: allActive };
    }
  },

  /**
   * Registra um sinal WebRTC (oferta, resposta ou ICE Candidate)
   */
  async addSignal(params: {
    roomId: string;
    senderId: string;
    targetId?: string;
    type: 'offer' | 'answer' | 'candidate';
    data: unknown;
  }): Promise<{ success: boolean; signalId: string }> {
    await initDatabase();
    const signalId = `sig-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    try {
      await pool.query(
        `INSERT INTO meet_signals (id, room_id, sender_id, target_id, type, data, consumed, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE, NOW())`,
        [signalId, params.roomId, params.senderId, params.targetId || null, params.type, JSON.stringify(params.data)]
      );
      return { success: true, signalId };
    } catch {
      // Fallback em memória
      const signal: MeetSignalRecord & { createdAtMs: number; consumed: boolean } = {
        id: signalId,
        roomId: params.roomId,
        senderId: params.senderId,
        targetId: params.targetId || null,
        type: params.type,
        data: params.data,
        timestamp: Date.now(),
        createdAtMs: Date.now(),
        consumed: false,
      };
      fallbackStore.meet_signals.set(signalId, signal as unknown as Record<string, unknown>);
      return { success: true, signalId };
    }
  },

  /**
   * Realiza polling de sinais pendentes para um participante e atualiza batimento cardíaco (presence)
   */
  async pollSignals(params: {
    roomId: string;
    participantId: string;
  }): Promise<{ success: boolean; signals: MeetSignalRecord[]; participants: MeetParticipantRecord[] }> {
    await initDatabase();

    try {
      // 1. Atualiza presença do participante atual
      await pool.query(
        `UPDATE meet_participants 
         SET last_seen_at = NOW() 
         WHERE room_id = $1 AND participant_id = $2`,
        [params.roomId, params.participantId]
      );

      // 2. Busca sinais pendentes destinados a este participante (ou broadcast na sala)
      const signalsRes = await pool.query(
        `SELECT * FROM meet_signals 
         WHERE room_id = $1 
           AND sender_id != $2 
           AND (target_id IS NULL OR target_id = $2)
           AND consumed = FALSE
           AND created_at >= NOW() - INTERVAL '60 seconds'
         ORDER BY created_at ASC`,
        [params.roomId, params.participantId]
      );

      // 3. Marca os sinais retornados como consumidos
      if (signalsRes.rows.length > 0) {
        const ids = signalsRes.rows.map((r) => r.id);
        await pool.query(
          `UPDATE meet_signals SET consumed = TRUE WHERE id = ANY($1::varchar[])`,
          [ids]
        );
      }

      // 4. Purga preventiva de sinais antigos (> 2 minutos)
      await pool.query(`DELETE FROM meet_signals WHERE created_at < NOW() - INTERVAL '2 minutes'`);

      // 5. Retorna lista de participantes atualmente conectados
      const activeRes = await pool.query(
        `SELECT * FROM meet_participants 
         WHERE room_id = $1 AND last_seen_at >= NOW() - INTERVAL '40 seconds'
         ORDER BY joined_at ASC`,
        [params.roomId]
      );

      const signals: MeetSignalRecord[] = signalsRes.rows.map((r) => ({
        id: r.id,
        roomId: r.room_id,
        senderId: r.sender_id,
        targetId: r.target_id,
        type: r.type as 'offer' | 'answer' | 'candidate',
        data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
        timestamp: new Date(r.created_at).getTime(),
      }));

      const participants: MeetParticipantRecord[] = activeRes.rows.map((r) => ({
        id: r.participant_id,
        name: r.participant_name,
        role: r.role as 'caller' | 'callee',
        userRole: r.user_role as 'agency' | 'model' | 'admin' | 'guest',
        joinedAt: r.joined_at?.toISOString() || new Date().toISOString(),
        lastSeenAt: r.last_seen_at?.toISOString() || new Date().toISOString(),
      }));

      return { success: true, signals, participants };
    } catch {
      // Fallback em memória
      const now = Date.now();
      const myKey = `${params.roomId}:${params.participantId}`;
      const me = fallbackStore.meet_participants.get(myKey);
      if (me) {
        (me as Record<string, unknown>).lastSeenMs = now;
        (me as Record<string, unknown>).lastSeenAt = new Date().toISOString();
      }

      const pendingSignals: MeetSignalRecord[] = [];
      for (const [id, val] of fallbackStore.meet_signals.entries()) {
        const s = val as unknown as MeetSignalRecord & { createdAtMs: number; consumed: boolean };
        if (
          s.roomId === params.roomId &&
          s.senderId !== params.participantId &&
          (!s.targetId || s.targetId === params.participantId) &&
          !s.consumed &&
          now - s.createdAtMs < 60000
        ) {
          pendingSignals.push({
            id: s.id,
            roomId: s.roomId,
            senderId: s.senderId,
            targetId: s.targetId,
            type: s.type,
            data: s.data,
            timestamp: s.timestamp,
          });
          s.consumed = true;
        } else if (now - s.createdAtMs > 120000) {
          fallbackStore.meet_signals.delete(id);
        }
      }

      const activeParticipants: MeetParticipantRecord[] = [];
      const prefix = `${params.roomId}:`;
      for (const [key, val] of fallbackStore.meet_participants.entries()) {
        if (key.startsWith(prefix)) {
          const p = val as unknown as MeetParticipantRecord & { lastSeenMs: number };
          if (now - (p.lastSeenMs || 0) < 40000) {
            activeParticipants.push(p);
          } else {
            fallbackStore.meet_participants.delete(key);
          }
        }
      }

      return { success: true, signals: pendingSignals, participants: activeParticipants };
    }
  },

  /**
   * Encerra a participação de um usuário na sala
   */
  async leaveRoom(params: {
    roomId: string;
    participantId: string;
  }): Promise<{ success: boolean; remainingParticipants: number; destroyed?: boolean }> {
    await initDatabase();

    try {
      await pool.query(
        'DELETE FROM meet_participants WHERE room_id = $1 AND participant_id = $2',
        [params.roomId, params.participantId]
      );

      const countRes = await pool.query(
        `SELECT COUNT(*) as count FROM meet_participants 
         WHERE room_id = $1 AND last_seen_at >= NOW() - INTERVAL '30 seconds'`,
        [params.roomId]
      );

      const count = parseInt(countRes.rows[0]?.count || '0', 10);
      if (count === 0) {
        await pool.query('DELETE FROM meet_signals WHERE room_id = $1', [params.roomId]);
        await pool.query('DELETE FROM meet_rooms WHERE id = $1', [params.roomId]);
        return { success: true, remainingParticipants: 0, destroyed: true };
      }

      return { success: true, remainingParticipants: count, destroyed: false };
    } catch {
      // Fallback em memória
      fallbackStore.meet_participants.delete(`${params.roomId}:${params.participantId}`);

      let count = 0;
      const prefix = `${params.roomId}:`;
      for (const [key] of fallbackStore.meet_participants.entries()) {
        if (key.startsWith(prefix)) count++;
      }

      if (count === 0) {
        fallbackStore.meet_rooms.delete(params.roomId);
        for (const [sigId, s] of fallbackStore.meet_signals.entries()) {
          if ((s as unknown as MeetSignalRecord).roomId === params.roomId) {
            fallbackStore.meet_signals.delete(sigId);
          }
        }
        return { success: true, remainingParticipants: 0, destroyed: true };
      }

      return { success: true, remainingParticipants: count, destroyed: false };
    }
  },
};

