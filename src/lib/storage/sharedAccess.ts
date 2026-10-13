/**
 * LUMIARDI — Acesso ao espaço compartilhado agência ↔ modelo
 *
 * As regras síncronas de `mediaAccess` só olham os ids dentro da chave. Aqui entra o banco:
 * a pasta `vault/shared/<agência>/<modelo>/` só vale enquanto houver contrato não encerrado
 * entre o par (sem contrato não se grava; depois do encerramento não se lê mais).
 */

import type { SessionUser } from '@/lib/auth';
import { initDatabase, pool } from '@/lib/db';
import { canReadMedia, canWriteMedia, isStaff, parseMediaKey } from '@/lib/storage/mediaAccess';

export async function hasActivePartnership(agencyId: string, modelId: string): Promise<boolean> {
  await initDatabase();
  const res = await pool.query(
    "SELECT 1 FROM agency_model_contracts WHERE agency_id = $1 AND model_id = $2 AND status <> 'terminated' LIMIT 1",
    [agencyId, modelId]
  );
  return res.rows.length > 0;
}

async function sharedPairAllowed(key: string): Promise<boolean> {
  const parsed = parseMediaKey(key);
  if (!parsed.isShared) return true;
  if (!parsed.agencyId || !parsed.modelId) return false;
  return hasActivePartnership(parsed.agencyId, parsed.modelId);
}

/** canReadMedia + contrato vigente para pastas compartilhadas (a curadoria continua lendo). */
export async function canReadMediaWithContract(key: string, session: SessionUser | null): Promise<boolean> {
  if (!canReadMedia(key, session)) return false;
  if (!session || isStaff(session)) return true;
  return sharedPairAllowed(key);
}

/** canWriteMedia + contrato vigente para pastas compartilhadas. */
export async function canWriteMediaWithContract(key: string, session: SessionUser | null): Promise<boolean> {
  if (!session || !canWriteMedia(key, session)) return false;
  return sharedPairAllowed(key);
}
