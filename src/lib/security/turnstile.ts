/**
 * LUMIARDI — CLOUDFLARE TURNSTILE BOT PROTECTION
 * Verificação de CAPTCHA invisível e de alta privacidade para formulários de checkout e login.
 */

export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes?: string[];
  challengeTs?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(
  token?: string,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  // Se não houver chave configurada em ambiente local/dev, aprova por padrão
  if (!secretKey || process.env.NODE_ENV !== 'production') {
    return { success: true };
  }

  if (!token) {
    return { success: false, errorCodes: ['missing-input-response'] };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const outcome = await res.json();
      return {
        success: Boolean(outcome.success),
        errorCodes: outcome['error-codes'],
        challengeTs: outcome.challenge_ts,
        hostname: outcome.hostname,
      };
    }
  } catch (err) {
    console.error('[Turnstile] Erro na verificação do token:', err);
  }

  return { success: false, errorCodes: ['verification-failed'] };
}
