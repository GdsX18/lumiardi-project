import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { EmailService } from '@/lib/email';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { pool, fallbackStore, initDatabase } from '@/lib/db';

const CATEGORIES_MAP: Record<string, { title: string; priority: string }> = {
  menor: { title: 'Menor de Idade (ECA Digital / CSAM)', priority: 'CRÍTICA' },
  intimo_nao_consensual: { title: 'Conteúdo Íntimo Não Consensual (NCII)', priority: 'CRÍTICA / ALTA' },
  exploracao_coercao: { title: 'Exploração, Coerção ou Tráfico', priority: 'CRÍTICA' },
  perfil_falso: { title: 'Perfil Falso / Impersonação', priority: 'ALTA' },
  direito_imagem: { title: 'Uso Indevido de Imagem e Voz', priority: 'ALTA' },
  copyright: { title: 'Direito Autoral / Violação de Copyright', priority: 'MODERADA' },
  fraude: { title: 'Fraude Financeira / Documental', priority: 'ALTA' },
  violacao_termos: { title: 'Outra Violação dos Termos de Uso', priority: 'MODERADA' },
  ordem_judicial: { title: 'Requisição de Autoridade / Ordem Judicial', priority: 'IMEDIATA' },
};

const PERSON_TYPE_MAP: Record<string, string> = {
  sim: 'Sou a própria pessoa retratada',
  nao: 'Terceiro / Testemunha',
  rep_legal: 'Sou Representante Legal',
  procurador: 'Sou Procurador / Advogado',
  resp_legal: 'Responsável Legal',
};

const ComplianceSchema = z.object({
  category: z.string().min(1, 'Categoria é obrigatória'),
  name: z.string().min(2, 'Nome completo deve ter pelo menos 2 caracteres').max(200),
  email: z.string().email('E-mail inválido').max(255),
  phone: z.string().max(50).optional().nullable(),
  personType: z.string().min(1, 'Relação é obrigatória'),
  url: z.string().min(3, 'URL ou link é obrigatório').max(2000),
  username: z.string().max(100).optional().nullable(),
  approxDate: z.string().max(100).optional().nullable(),
  description: z.string().min(10, 'Descrição detalhada é obrigatória').max(10000),
  declaration: z.boolean().refine((val) => val === true, {
    message: 'A declaração formal de veracidade é obrigatória.',
  }),
  judicialBody: z.string().max(300).optional().nullable(),
  processNumber: z.string().max(100).optional().nullable(),
  authorityName: z.string().max(200).optional().nullable(),
  judicialDeadline: z.string().max(100).optional().nullable(),
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

    // 1. Verificação Honeypot (Anti-Bot)
    if (rawBody.honeypot && typeof rawBody.honeypot === 'string' && rawBody.honeypot.trim().length > 0) {
      console.warn(`[Compliance API] Bot descartado via honeypot do IP ${clientIp}`);
      const fakeId = Math.floor(100000 + Math.random() * 900000);
      return NextResponse.json({
        success: true,
        protocol: `LUM-${new Date().getFullYear()}-${fakeId}`,
        date: new Date().toLocaleString('pt-BR'),
        priority: 'ALTA',
      });
    }

    // 2. Proteção Anti-Abuso (Rate Limiting)
    const rateLimit = checkRateLimit(`compliance_${clientIp}`, {
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 5,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Limite de comunicações atingido para este endereço IP. Aguarde antes de enviar nova denúncia.' },
        { status: 429 }
      );
    }

    // 3. Validação de Payload com Zod
    const parseResult = ComplianceSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Dados inválidos.';
      return NextResponse.json({ error: firstError, details: parseResult.error.issues }, { status: 400 });
    }

    const data = parseResult.data;

    // 4. Mapeamento de Categoria e Prioridade Jurídica
    const categoryInfo = CATEGORIES_MAP[data.category] || {
      title: data.category,
      priority: 'ALTA',
    };
    const personRelation = PERSON_TYPE_MAP[data.personType] || data.personType;

    const year = new Date().getFullYear();
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const protocolNumber = `LUM-${year}-${randomDigits}`;
    const reportId = `report-${Date.now()}-${randomDigits}`;

    // 5. Sanitização rigorosa contra XSS e injeção de cabeçalhos
    const cleanName = sanitizeSingleLine(data.name);
    const cleanEmail = sanitizeSingleLine(data.email);
    const cleanPhone = sanitizeSingleLine(data.phone);
    const cleanUrl = sanitizeSingleLine(data.url);
    const cleanUsername = sanitizeSingleLine(data.username);
    const cleanApproxDate = sanitizeSingleLine(data.approxDate);
    const cleanDescription = sanitizeMultiLine(data.description);
    const cleanJudicialBody = sanitizeSingleLine(data.judicialBody);
    const cleanProcessNumber = sanitizeSingleLine(data.processNumber);
    const cleanAuthorityName = sanitizeSingleLine(data.authorityName);
    const cleanJudicialDeadline = sanitizeSingleLine(data.judicialDeadline);

    // 6. Persistência de Auditoria e Fallback (PostgreSQL / Supabase)
    let emailSent = false;
    await initDatabase();

    try {
      await pool.query(
        `INSERT INTO compliance_reports (
          id, protocol_number, category, priority, reporter_name, reporter_email,
          reporter_phone, reporter_relation, target_url, target_username, approx_date,
          description, judicial_body, process_number, authority_name, judicial_deadline,
          declaration_accepted, ip_address, user_agent, email_sent, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        )`,
        [
          reportId,
          protocolNumber,
          categoryInfo.title,
          categoryInfo.priority,
          cleanName,
          cleanEmail,
          cleanPhone || null,
          personRelation,
          cleanUrl,
          cleanUsername || null,
          cleanApproxDate || null,
          cleanDescription,
          cleanJudicialBody || null,
          cleanProcessNumber || null,
          cleanAuthorityName || null,
          cleanJudicialDeadline || null,
          true,
          clientIp,
          userAgent,
          false,
          'received',
        ]
      );
    } catch (dbErr) {
      console.warn('[Compliance API] Erro ao salvar em banco principal, armazenando em fallbackStore:', dbErr);
      fallbackStore.compliance_reports.set(reportId, {
        id: reportId,
        protocolNumber,
        category: categoryInfo.title,
        priority: categoryInfo.priority,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        personType: personRelation,
        url: cleanUrl,
        username: cleanUsername,
        approxDate: cleanApproxDate,
        description: cleanDescription,
        judicialBody: cleanJudicialBody,
        processNumber: cleanProcessNumber,
        authorityName: cleanAuthorityName,
        judicialDeadline: cleanJudicialDeadline,
        ipAddress: clientIp,
        userAgent,
        createdAt: new Date().toISOString(),
      });
    }

    // 7. Disparo Oficial para o E-mail Centralizado (contact@lumiardi.com)
    try {
      await EmailService.sendComplianceReport({
        protocolNumber,
        category: categoryInfo.title,
        priority: categoryInfo.priority,
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        personType: personRelation,
        url: cleanUrl,
        username: cleanUsername,
        approxDate: cleanApproxDate,
        description: cleanDescription,
        judicialBody: cleanJudicialBody,
        processNumber: cleanProcessNumber,
        authorityName: cleanAuthorityName,
        judicialDeadline: cleanJudicialDeadline,
        ipAddress: clientIp,
      });

      emailSent = true;
      try {
        await pool.query(
          `UPDATE compliance_reports SET email_sent = TRUE, email_sent_at = NOW() WHERE id = $1`,
          [reportId]
        );
      } catch {
        // Ignora erro de atualização se banco falhou
      }
    } catch (mailErr) {
      console.error('[Compliance API] Falha no disparo de e-mail SMTP (registro salvo no DB):', mailErr);
    }

    const formattedDate = new Date().toLocaleString('pt-BR');

    return NextResponse.json({
      success: true,
      protocol: protocolNumber,
      category: categoryInfo.title,
      priority: categoryInfo.priority,
      date: formattedDate,
      email: cleanEmail,
      emailSent,
    });
  } catch (err: unknown) {
    console.error('[Compliance API] Erro crítico inesperado:', err);
    return NextResponse.json(
      { error: 'Não foi possível processar a denúncia formal no momento. Tente novamente ou envie diretamente para contact@lumiardi.com.' },
      { status: 500 }
    );
  }
}

