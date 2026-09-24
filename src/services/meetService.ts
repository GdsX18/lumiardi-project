import crypto from 'crypto';
import { pool, initDatabase, fallbackStore } from '@/lib/db';

export interface MeetRoomRecord {
  roomId: string;
  hostId: string;
  hostName: string;
  passcode?: string;
  provider: 'livekit' | 'daily.co' | 'webrtc_native';
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
    provider?: 'livekit' | 'daily.co' | 'webrtc_native';
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
    const userRole = params.userRole || 'guest';

    try {
      // 1. Purga apenas registros inativos (> 45 segundos) ou o próprio participante (re-join)
      await pool.query(
        `DELETE FROM meet_participants 
         WHERE room_id = $1 AND (last_seen_at < NOW() - INTERVAL '45 seconds' OR participant_id = $2)`,
        [params.roomId, params.participantId]
      );

      // 2. Insere ou atualiza o participante atual
      await pool.query(
        `INSERT INTO meet_participants (room_id, participant_id, participant_name, role, user_role, joined_at, last_seen_at)
         VALUES ($1, $2, $3, 'caller', $4, NOW(), NOW())
         ON CONFLICT (room_id, participant_id) 
         DO UPDATE SET participant_name = $3, user_role = $4, last_seen_at = NOW()`,
        [params.roomId, params.participantId, params.participantName, userRole]
      );

      // 3. Busca todos os participantes ativos ordenados estritamente por ordem de entrada (joined_at)
      const allActiveRes = await pool.query(
        `SELECT * FROM meet_participants 
         WHERE room_id = $1 AND last_seen_at >= NOW() - INTERVAL '45 seconds'
         ORDER BY joined_at ASC`,
        [params.roomId]
      );

      // O primeiro participante cronologicamente é SEMPRE o caller, o segundo é SEMPRE o callee
      let myAssignedRole: 'caller' | 'callee' = 'caller';
      const participants: MeetParticipantRecord[] = [];

      for (let i = 0; i < allActiveRes.rows.length; i++) {
        const row = allActiveRes.rows[i];
        const assignedRole: 'caller' | 'callee' = i === 0 ? 'caller' : 'callee';

        if (row.role !== assignedRole) {
          await pool.query(
            'UPDATE meet_participants SET role = $1 WHERE room_id = $2 AND participant_id = $3',
            [assignedRole, params.roomId, row.participant_id]
          );
        }

        if (row.participant_id === params.participantId) {
          myAssignedRole = assignedRole;
        }

        participants.push({
          id: row.participant_id,
          name: row.participant_name,
          role: assignedRole,
          userRole: row.user_role as 'agency' | 'model' | 'admin' | 'guest',
          joinedAt: row.joined_at?.toISOString() || new Date().toISOString(),
          lastSeenAt: row.last_seen_at?.toISOString() || new Date().toISOString(),
        });
      }

      return { success: true, role: myAssignedRole, participants };
    } catch {
      // Fallback em memória resiliente
      const now = Date.now();
      const prefix = `${params.roomId}:`;
      const activeList: (MeetParticipantRecord & { lastSeenMs: number; joinedMs: number })[] = [];

      for (const [key, val] of fallbackStore.meet_participants.entries()) {
        if (key.startsWith(prefix)) {
          const part = val as unknown as MeetParticipantRecord & { lastSeenMs: number; joinedMs: number };
          if (part.id === params.participantId || now - (part.lastSeenMs || 0) >= 45000) {
            fallbackStore.meet_participants.delete(key);
          } else {
            activeList.push(part);
          }
        }
      }

      const myRecord = {
        id: params.participantId,
        name: params.participantName,
        role: (activeList.length === 0 ? 'caller' : 'callee') as 'caller' | 'callee',
        userRole,
        joinedAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        lastSeenMs: now,
        joinedMs: now,
      };

      activeList.push(myRecord);
      activeList.sort((a, b) => a.joinedMs - b.joinedMs);

      let myRole: 'caller' | 'callee' = 'caller';
      const participants: MeetParticipantRecord[] = activeList.map((p, idx) => {
        const role = (idx === 0 ? 'caller' : 'callee') as 'caller' | 'callee';
        p.role = role;
        if (p.id === params.participantId) myRole = role;
        fallbackStore.meet_participants.set(`${params.roomId}:${p.id}`, p as unknown as Record<string, unknown>);
        return {
          id: p.id,
          name: p.name,
          role,
          userRole: p.userRole,
          joinedAt: p.joinedAt,
          lastSeenAt: p.lastSeenAt,
        };
      });

      return { success: true, role: myRole, participants };
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
  }): Promise<{ success: boolean; myRole: 'caller' | 'callee'; signals: MeetSignalRecord[]; participants: MeetParticipantRecord[] }> {
    await initDatabase();

    try {
      // 1. Atualiza presença do participante atual
      const updateRes = await pool.query(
        `UPDATE meet_participants 
         SET last_seen_at = NOW() 
         WHERE room_id = $1 AND participant_id = $2`,
        [params.roomId, params.participantId]
      );
      if (updateRes.rowCount === 0) {
        await pool.query(
          `INSERT INTO meet_participants (room_id, participant_id, participant_name, role, user_role, joined_at, last_seen_at)
           VALUES ($1, $2, 'Membro VIP Lumiardi', 'callee', 'guest', NOW(), NOW())
           ON CONFLICT (room_id, participant_id) DO UPDATE SET last_seen_at = NOW()`,
          [params.roomId, params.participantId]
        );
      }

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
         WHERE room_id = $1 AND last_seen_at >= NOW() - INTERVAL '45 seconds'
         ORDER BY joined_at ASC`,
        [params.roomId]
      );

      let myRole: 'caller' | 'callee' = 'caller';
      const participants: MeetParticipantRecord[] = activeRes.rows.map((r, idx) => {
        const assignedRole: 'caller' | 'callee' = idx === 0 ? 'caller' : 'callee';
        if (r.participant_id === params.participantId) {
          myRole = assignedRole;
        }
        return {
          id: r.participant_id,
          name: r.participant_name,
          role: assignedRole,
          userRole: r.user_role as 'agency' | 'model' | 'admin' | 'guest',
          joinedAt: r.joined_at?.toISOString() || new Date().toISOString(),
          lastSeenAt: r.last_seen_at?.toISOString() || new Date().toISOString(),
        };
      });

      const signals: MeetSignalRecord[] = signalsRes.rows.map((r) => ({
        id: r.id,
        roomId: r.room_id,
        senderId: r.sender_id,
        targetId: r.target_id,
        type: r.type as 'offer' | 'answer' | 'candidate',
        data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
        timestamp: new Date(r.created_at).getTime(),
      }));

      return { success: true, myRole, signals, participants };
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
          const p = val as unknown as MeetParticipantRecord & { lastSeenMs: number; joinedMs?: number };
          if (now - (p.lastSeenMs || 0) < 45000) {
            activeParticipants.push(p);
          } else {
            fallbackStore.meet_participants.delete(key);
          }
        }
      }

      activeParticipants.sort((a, b) => ((a as any).joinedMs || 0) - ((b as any).joinedMs || 0));
      let fallbackMyRole: 'caller' | 'callee' = 'caller';
      activeParticipants.forEach((p, idx) => {
        const assignedRole: 'caller' | 'callee' = idx === 0 ? 'caller' : 'callee';
        p.role = assignedRole;
        if (p.id === params.participantId) fallbackMyRole = assignedRole;
      });

      return { success: true, myRole: fallbackMyRole, signals: pendingSignals, participants: activeParticipants };
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

