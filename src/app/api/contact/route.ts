import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EmailService } from '@/lib/email';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { pool, fallbackStore, initDatabase } from '@/lib/db';

const ContactSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(100),
  email: z.string().email('E-mail inválido.').max(255),
  type: z.string().min(2, 'Tipo de contato é obrigatório.').max(100),
  subject: z.string().min(3, 'Assunto deve ter pelo menos 3 caracteres.').max(200),
  message: z.string().min(10, 'A mensagem deve ter pelo menos 10 caracteres.').max(5000),
  honeypot: z.string().optional().nullable(),
});

function sanitizeSingleLine(str?: string | null): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').replace(/[\r\n\t]+/g, ' ').trim();
}

function sanitizeMultiLine(str?: string | null): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const rawBody = await req.json();

    // 1. Verificação de Honeypot Anti-Spam
    if (rawBody.honeypot && typeof rawBody.honeypot === 'string' && rawBody.honeypot.trim().length > 0) {
      console.warn(`[Contact API] Bot descartado via honeypot do IP ${clientIp}`);
      return NextResponse.json({ success: true });
    }

    // 2. Proteção Anti-Abuso (Rate Limiting: 5 requisições por 15 minutos)
    const rateLimit = checkRateLimit(`contact_${clientIp}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 5,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Muitas mensagens enviadas recentemente. Aguarde alguns minutos antes de tentar novamente.' },
        { status: 429 }
      );
    }

    // 3. Validação estrita com Zod
    const parseResult = ContactSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Dados inválidos.';
      return NextResponse.json({ error: firstError, details: parseResult.error.issues }, { status: 400 });
    }

    const { name, email, type, subject, message } = parseResult.data;

    // 4. Sanitização contra injeção e XSS
    const cleanName = sanitizeSingleLine(name);
    const cleanEmail = sanitizeSingleLine(email);
    const cleanType = sanitizeSingleLine(type);
    const cleanSubject = sanitizeSingleLine(subject);
    const cleanMessage = sanitizeMultiLine(message);

    const inquiryId = `inq-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // 5. Persistência de Auditoria (PostgreSQL / Supabase)
    await initDatabase();
    try {
      await pool.query(
        `INSERT INTO contact_inquiries (
          id, contact_type, full_name, email, subject, message, ip_address, user_agent, email_sent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [inquiryId, cleanType, cleanName, cleanEmail, cleanSubject, cleanMessage, clientIp, userAgent, false]
      );
    } catch (dbErr) {
      console.warn('[Contact API] Erro ao salvar inquiry no banco principal, armazenando em fallbackStore:', dbErr);
      fallbackStore.contact_inquiries.set(inquiryId, {
        id: inquiryId,
        contact_type: cleanType,
        full_name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
        ip_address: clientIp,
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      });
    }

    // 6. Disparo do E-mail para o Destinatário Oficial (contact@lumiardi.com)
    try {
      await EmailService.sendContactForm({
        name: cleanName,
        email: cleanEmail,
        type: cleanType,
        subject: cleanSubject,
        message: cleanMessage,
      });

      try {
        await pool.query(
          `UPDATE contact_inquiries SET email_sent = TRUE, email_sent_at = NOW() WHERE id = $1`,
          [inquiryId]
        );
      } catch {
        // Ignora falha de atualização no banco
      }
    } catch (mailErr) {
      console.error('[Contact API] Erro no envio de e-mail SMTP (registro preservado no DB):', mailErr);
      // Retorna sucesso para o usuário se o chamado já estiver seguro no banco de dados
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Contact API] Erro inesperado:', err);
    return NextResponse.json({ error: 'Erro interno ao processar a mensagem.' }, { status: 500 });
  }
}

