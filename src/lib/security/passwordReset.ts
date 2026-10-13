/**
 * LUMIARDI — Tokens de redefinição de senha
 *
 * O link enviado por e-mail carrega um token aleatório de 256 bits; o banco guarda só
 * o SHA-256 dele (um vazamento da tabela não permite redefinir senhas). Cada token vale
 * 1 hora, é de uso único e emitir um novo invalida os anteriores da mesma conta.
 */

import crypto from 'crypto';
import { invalidateMemberCache } from '@/lib/apiAuth';
import bcrypt from 'bcryptjs';
import { pool, initDatabase, withTransaction } from '@/lib/db';
import { normalizePassword, PASSWORD_BCRYPT_COST } from '@/lib/passwordPolicy';

const TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Gera o token para a conta de modelo/agência com este e-mail; null se a conta não existe. */
export async function createPasswordResetToken(
  email: string
): Promise<{ token: string; userId: string; name: string | null; email: string } | null> {
  await initDatabase();
  const res = await pool.query(
    "SELECT id, email, full_name FROM users WHERE LOWER(email) = $1 AND role IN ('MODELO', 'AGENCIA') LIMIT 1",
    [email.trim().toLowerCase()]
  );
  const user = res.rows[0];
  if (!user) return null;

  const token = crypto.randomBytes(32).toString('base64url');
  await withTransaction(async (client) => {
    await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
    await client.query(
      'INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
      [hashToken(token), user.id, new Date(Date.now() + TOKEN_TTL_MS).toISOString()]
    );
  });
  return { token, userId: user.id, name: user.full_name || null, email: user.email };
}

/** Troca a senha se o token for válido; consome o token na mesma transação. */
export async function resetPasswordWithToken(token: string, newPassword: string): Promise<'ok' | 'invalid_token'> {
  if (!token || token.length > 200) return 'invalid_token';
  await initDatabase();
  const hash = await bcrypt.hash(normalizePassword(newPassword), PASSWORD_BCRYPT_COST);

  return withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE password_reset_tokens SET used_at = NOW()
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
       RETURNING user_id`,
      [hashToken(token)]
    );
    const userId = res.rows[0]?.user_id as string | undefined;
    if (!userId) return 'invalid_token' as const;

    // Troca de senha derruba todas as sessões abertas (inclusive um cookie roubado)
    await client.query(
      'UPDATE users SET password_hash = $1, sessions_valid_after = NOW(), updated_at = NOW() WHERE id = $2',
      [hash, userId]
    );
    await client.query('DELETE FROM password_reset_tokens WHERE user_id = $1 AND token_hash != $2', [userId, hashToken(token)]);
    invalidateMemberCache(userId);
    return 'ok' as const;
  });
}
