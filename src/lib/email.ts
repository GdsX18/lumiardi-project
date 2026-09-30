/**
 * LUMIARDI — SERVIÇO DE E-MAILS TRANSACIONAIS (SMTP LUXURY ENGINE)
 * Disparo oficial de E-mails com autenticação 2FA, Boas-Vindas, Auditoria 2257 e Recuperação de Senha.
 * Design responsivo de alto padrão (Dark/Gold Luxury Theme).
 */

import nodemailer from 'nodemailer';

const smtpPort = Number(process.env.SMTP_PORT) || 587;
const isSecure = smtpPort === 465; // true para 465 (SSL direto), false para 587 (STARTTLS)

export const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.lumiardi.com',
  port: smtpPort,
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false // Evita falhas por certificados autoassinados em desenvolvimento
  },
  connectionTimeout: 10000, // 10s timeout
  greetingTimeout: 5000,
  socketTimeout: 15000,
});

export async function verifyConnection(): Promise<boolean> {
  await mailTransporter.verify();
  return true;
}

// Configuração do Transportador SMTP (reutiliza mailTransporter defensivo)
function getTransporter() {
  return mailTransporter;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Lumiardi Official <noreply@lumiardi.com>';

export function isEmailConfigured(): boolean {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return false;
  if (host === 'mail.seudominio.com' || pass === 'SUA_SENHA_SMTP' || pass === 'placeholder') return false;
  return true;
}

async function sendViaResend(params: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ messageId?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: params.from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Resend error: ${res.statusText}`);
  }
  const data = await res.json();
  return { messageId: data.id };
}

/**
 * Layout Base em HTML de Alto Padrão (Dark & Gold Luxury)
 */
function buildLuxuryEmailTemplate(title: string, preheader: string, contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #070708;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #E6E6E6;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #070708;
      padding: 40px 10px;
    }
    .card {
      max-width: 580px;
      margin: 0 auto;
      background-color: #0F0F12;
      border: 1px solid #24221C;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.8);
    }
    .header {
      padding: 35px 30px 25px;
      text-align: center;
      border-bottom: 1px solid #1E1C17;
      background: radial-gradient(circle at top, #1C1914 0%, #0F0F12 100%);
    }
    .logo-text {
      font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 5px;
      color: #F3E5AB;
      margin: 0;
      text-transform: uppercase;
    }
    .logo-sub {
      font-size: 10px;
      letter-spacing: 3px;
      color: #8C8270;
      margin-top: 6px;
      text-transform: uppercase;
    }
    .content {
      padding: 35px 35px 30px;
      font-size: 15px;
      line-height: 1.6;
      color: #D1D1D6;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(212, 175, 55, 0.12);
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 20px;
      color: #D4AF37;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 15px;
    }
    .code-box {
      margin: 25px 0;
      padding: 20px;
      background: #070709;
      border: 1px dashed #D4AF37;
      border-radius: 8px;
      text-align: center;
    }
    .code-digits {
      font-family: 'Courier New', monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #F5D77F;
    }
    .btn {
      display: inline-block;
      margin: 25px 0 10px;
      padding: 14px 32px;
      background: linear-gradient(135deg, #D4AF37 0%, #AA820A 100%);
      color: #070708 !important;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 2px;
      text-decoration: none;
      text-transform: uppercase;
      border-radius: 6px;
    }
    .footer {
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #1A1917;
      font-size: 11px;
      color: #636366;
      background-color: #0A0A0C;
    }
    .footer a {
      color: #8C8270;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#070708;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${preheader}
  </div>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="logo-text">LUMIARDI</h1>
        <div class="logo-sub">Private Members Club & Exclusive Talent</div>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} LUMIARDI INC. Todos os direitos reservados.</p>
        <p>Ambiente Criptografado & Homologado • 18 U.S.C. § 2257 Compliance</p>
        <p><a href="https://www.lumiardi.com/termos">Termos de Uso</a> • <a href="https://www.lumiardi.com/privacidade">Privacidade</a></p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

export const EmailService = {
  /**
   * 1. Envio de Código 2FA / Autenticação em Duas Etapas
   */
  async send2FACode(toEmail: string, code: string, recipientName?: string) {
    const title = 'Seu Código de Segurança Lumiardi';
    const preheader = `Seu código de verificação 2FA é: ${code}`;
    
    const content = `
      <div class="badge">Segurança & Acesso</div>
      <h2 style="color:#FFF; font-size:20px; margin-top:0;">Autenticação de Dois Fatores</h2>
      <p>Olá, <strong>${recipientName || 'Membro Lumiardi'}</strong>,</p>
      <p>Você solicitou acesso seguro ou autorização de operação na sua conta Lumiardi. Utilize o código de 6 dígitos abaixo para confirmar sua identidade:</p>
      
      <div class="code-box">
        <div class="code-digits">${code}</div>
        <div style="font-size:11px; color:#8E8E93; margin-top:8px;">Válido por 10 minutos • Não compartilhe este código com ninguém</div>
      </div>

      <p style="font-size:13px; color:#8E8E93;">Se você não solicitou este código, recomendamos alterar sua senha imediatamente ou contatar o suporte de segurança.</p>
    `;

    const html = buildLuxuryEmailTemplate(title, preheader, content);

    const transporter = getTransporter();
    return transporter.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `[LUMIARDI] Seu código de segurança: ${code}`,
      html,
    });
  },

  /**
   * 2. Boas-Vindas para Criadoras / Membros
   */
  async sendWelcomeEmail(toEmail: string, name: string, role: 'creator' | 'member' | 'agency') {
    const title = 'Bem-vindo(a) ao Universo Lumiardi';
    const preheader = 'Seu acesso ao ambiente exclusivo foi criado com sucesso.';

    const isCreator = role === 'creator';
    const content = `
      <div class="badge">Bem-vindo(a) à Lumiardi</div>
      <h2 style="color:#FFF; font-size:22px; margin-top:0;">A sua jornada de exclusividade começa agora</h2>
      <p>Olá, <strong>${name}</strong>,</p>
      <p>É uma honra dar as boas-vindas a você na <strong>Lumiardi</strong> — o ecossistema privado de maior prestígio para criadoras de elite e membros seletos.</p>
      
      ${isCreator ? `
      <p>Sua solicitação de qualificação foi recebida. Complete a verificação biométrica para liberar seu feed exclusivo, salas de videochamadas privativas e monetização internacional.</p>
      <div style="text-align:center;">
        <a href="https://www.lumiardi.com/qualificacao" class="btn">Concluir Qualificação</a>
      </div>
      ` : `
      <p>Seu perfil VIP está pronto para explorar o catálogo de talentos seletos, conteúdos restritos em alta definição e experiências privativas 1-a-1.</p>
      <div style="text-align:center;">
        <a href="https://www.lumiardi.com/dashboard" class="btn">Acessar Meu Painel</a>
      </div>
      `}

      <p style="font-size:13px; color:#8E8E93; margin-top:20px;">Questions? Our VIP Support team is available to answer this e-mail.</p>
    `;

    const html = buildLuxuryEmailTemplate(title, preheader, content);
    const transporter = getTransporter();
    return transporter.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: `Bem-vindo(a) à Lumiardi, ${name}`,
      html,
    });
  },

  /**
   * 3. Notificação de Status de Homologação KYC (Aprovado / Rejeitado)
   */
  async sendKYCStatusEmail(toEmail: string, name: string, approved: boolean, referenceCode: string, reasons?: string[]) {
    const title = approved ? 'Homologação Aprovada — Lumiardi' : 'Atualização de Homologação — Lumiardi';
    const preheader = approved ? `Parabéns! Sua auditoria 2257 foi aprovada sob protocolo ${referenceCode}` : 'Avisos sobre o envio dos seus documentos';

    const content = approved ? `
      <div class="badge" style="color:#34C759; border-color:rgba(52, 199, 89, 0.4); background:rgba(52, 199, 89, 0.1);">Homologação Aprovada</div>
      <h2 style="color:#FFF; font-size:22px; margin-top:0;">Auditoria Biométrica Concluída</h2>
      <p>Olá, <strong>${name}</strong>,</p>
      <p>Temos o prazer de informar que seus documentos oficiais e biometria facial foram <strong>homologados com sucesso</strong> em conformidade com as normas internacionais 18 U.S.C. § 2257.</p>
      
      <div style="background:#08080A; border:1px solid #2C2C2E; padding:15px 20px; border-radius:8px; margin:20px 0;">
        <div style="font-size:11px; color:#8E8E93;">NÚMERO DO PROTOCOLO DE AUDITORIA:</div>
        <div style="font-family:monospace; font-size:15px; color:#F5D77F; font-weight:700; margin-top:4px;">${referenceCode}</div>
      </div>

      <p>Seu perfil de criadora agora está totalmente habilitado para publicar mídias no Vault R2, receber pagamentos internacionais e abrir salas Daily.co.</p>
      
      <div style="text-align:center;">
        <a href="https://www.lumiardi.com/dashboard/criadora" class="btn">Entrar no Painel da Criadora</a>
      </div>
    ` : `
      <div class="badge" style="color:#FF453A; border-color:rgba(255, 69, 58, 0.4); background:rgba(255, 69, 58, 0.1);">Ação Necessária</div>
      <h2 style="color:#FFF; font-size:22px; margin-top:0;">Inconsistência nos Documentos</h2>
      <p>Olá, <strong>${name}</strong>,</p>
      <p>Nossa equipe de auditoria e o motor de visão identificaram pendências no seu envio de verificação:</p>
      
      <div style="background:#1A0F0F; border:1px solid #4D1F1F; padding:15px 20px; border-radius:8px; margin:20px 0; color:#FFB3B0;">
        ${reasons && reasons.length > 0 ? reasons.map(r => `• ${r}`).join('<br>') : '• Documento ilegível ou rosto da câmera não coincidente com a foto.'}
      </div>

      <p>Você pode realizar um novo envio com fotos mais nítidas e bem iluminadas a qualquer momento:</p>
      
      <div style="text-align:center;">
        <a href="https://www.lumiardi.com/qualificacao" class="btn">Enviar Documento Novamente</a>
      </div>
    `;

    const html = buildLuxuryEmailTemplate(title, preheader, content);
    const transporter = getTransporter();
    return transporter.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: approved ? `[LUMIARDI] Homologação Aprovada — Protocolo ${referenceCode}` : `[LUMIARDI] Atualização sobre sua verificação de documentos`,
      html,
    });
  },

  /**
   * 4. Recuperação de Senha
   */
  async sendPasswordResetEmail(toEmail: string, resetLink: string, recipientName?: string) {
    const title = 'Redefinição de Senha — Lumiardi';
    const preheader = 'Instruções para redefinir sua senha com segurança.';

    const content = `
      <div class="badge">Redefinição Segura</div>
      <h2 style="color:#FFF; font-size:20px; margin-top:0;">Redefinição de Senha</h2>
      <p>Olá, <strong>${recipientName || 'Membro Lumiardi'}</strong>,</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta Lumiardi. Clique no botão abaixo para criar uma nova senha de acesso:</p>
      
      <div style="text-align:center;">
        <a href="${resetLink}" class="btn">Redefinir Minha Senha</a>
      </div>

      <p style="font-size:12px; color:#8E8E93; margin-top:25px;">Por motivos de segurança, este link é válido por 1 hora. Se você não solicitou a redefinição, desconsidere este e-mail.</p>
    `;

    const html = buildLuxuryEmailTemplate(title, preheader, content);
    const transporter = getTransporter();
    return transporter.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      subject: '[LUMIARDI] Instruções para redefinição de senha',
      html,
    });
  },

  /**
   * 5. Formulário de Contato — Notificação interna para a equipe Lumiardi
   */
  async sendContactForm(data: {
    name: string;
    email: string;
    type: string;
    subject: string;
    message: string;
  }) {
    const toEmail = process.env.CONTACT_RECEIVER_EMAIL || process.env.CONTACT_EMAIL || 'contact@lumiardi.com';
    const title = `[Contato] ${data.subject}`;
    const preheader = `Nova mensagem de ${data.name} — ${data.type}`;

    const content = `
      <div class="badge">Nova Mensagem de Contato</div>
      <h2 style="color:#FFF; font-size:20px; margin-top:0;">${data.subject}</h2>

      <div style="background:#08080A; border:1px solid #2C2C2E; padding:15px 20px; border-radius:8px; margin:20px 0;">
        <table style="width:100%; border-collapse:collapse; font-size:13px; color:#D1D1D6;">
          <tr><td style="padding:6px 0; color:#8E8E93; width:130px;">Nome:</td><td style="padding:6px 0;"><strong>${data.name}</strong></td></tr>
          <tr><td style="padding:6px 0; color:#8E8E93;">E-mail:</td><td style="padding:6px 0;"><a href="mailto:${data.email}" style="color:#D4AF37;">${data.email}</a></td></tr>
          <tr><td style="padding:6px 0; color:#8E8E93;">Tipo:</td><td style="padding:6px 0;">${data.type}</td></tr>
          <tr><td style="padding:6px 0; color:#8E8E93;">Assunto:</td><td style="padding:6px 0;">${data.subject}</td></tr>
        </table>
      </div>

      <div style="margin-top:20px;">
        <div style="font-size:11px; color:#8E8E93; margin-bottom:8px; text-transform:uppercase; letter-spacing:1px;">Mensagem:</div>
        <div style="background:#070709; border:1px solid #2C2C2E; padding:15px 20px; border-radius:8px; font-size:14px; line-height:1.7; color:#D1D1D6; white-space:pre-wrap;">${data.message}</div>
      </div>

      <div style="margin-top:25px; text-align:center;">
        <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" class="btn">Responder a ${data.name}</a>
      </div>

      <p style="font-size:12px; color:#636366; margin-top:20px;">Este e-mail foi gerado automaticamente pelo formulário de contato de www.lumiardi.com</p>
    `;

    const html = buildLuxuryEmailTemplate(title, preheader, content);
    const transporter = getTransporter();
    return transporter.sendMail({
      from: FROM_EMAIL,
      to: toEmail,
      replyTo: `"${data.name}" <${data.email}>`,
      subject: `[Lumiardi Contact] ${data.type} — ${data.subject}`,
      html,
    });
  },

  /**
   * 6. Denúncia Formal e Compliance (Notice-and-Action / Trust & Safety)
   */
  async sendComplianceReport(data: {
    protocolNumber: string;
    category: string;
    priority: string;
    name: string;
    email: string;
    phone?: string;
    personType: string;
    url: string;
    username?: string;
    approxDate?: string;
    description: string;
    judicialBody?: string;
    processNumber?: string;
    authorityName?: string;
    judicialDeadline?: string;
    ipAddress?: string;
  }) {
    const toEmail = process.env.CONTACT_RECEIVER_EMAIL || process.env.CONTACT_EMAIL || 'contact@lumiardi.com';
    const title = `🚨 [Denúncia Formal] ${data.category} — ${data.protocolNumber}`;
    const preheader = `Protocolo ${data.protocolNumber} - Prioridade ${data.priority} - Comunicante: ${data.name}`;

    const isCritical = data.priority.toUpperCase().includes('CRÍTICA');
    const badgeColor = isCritical ? '#FF453A' : '#D4AF37';

    const content = `
      <div class="badge" style="color:${badgeColor}; border-color:${badgeColor}66; background:${badgeColor}1A;">
        Notice-and-Action · Prioridade ${data.priority}
      </div>
      <h2 style="color:#FFF; font-size:22px; margin-top:0;">Comunicação Formal de Violação</h2>

      <div style="background:#08080A; border:1px solid #2C2C2E; padding:18px 20px; border-radius:8px; margin:20px 0;">
        <table style="width:100%; border-collapse:collapse; font-size:13px; color:#D1D1D6;">
          <tr>
            <td style="padding:6px 0; color:#8E8E93; width:170px;">Número do Protocolo:</td>
            <td style="padding:6px 0;"><strong style="font-family:monospace; color:#F5D77F; font-size:15px;">${data.protocolNumber}</strong></td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#8E8E93;">Categoria:</td>
            <td style="padding:6px 0;"><strong>${data.category}</strong></td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#8E8E93;">Nível de Prioridade:</td>
            <td style="padding:6px 0;"><span style="color:${badgeColor}; font-weight:700;">${data.priority}</span></td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#8E8E93;">IP de Origem:</td>
            <td style="padding:6px 0; font-family:monospace;">${data.ipAddress || 'Não registrado'}</td>
          </tr>
        </table>
      </div>

      <h3 style="color:#F5E5AB; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; margin:25px 0 10px;">
        1. Identificação do Comunicante
      </h3>
      <div style="background:#08080A; border:1px solid #2C2C2E; padding:15px 20px; border-radius:8px; margin-bottom:20px;">
        <table style="width:100%; border-collapse:collapse; font-size:13px; color:#D1D1D6;">
          <tr>
            <td style="padding:6px 0; color:#8E8E93; width:170px;">Nome Completo:</td>
            <td style="padding:6px 0;"><strong>${data.name}</strong></td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#8E8E93;">E-mail para Notificação:</td>
            <td style="padding:6px 0;"><a href="mailto:${data.email}" style="color:#D4AF37;">${data.email}</a></td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#8E8E93;">Telefone:</td>
            <td style="padding:6px 0;">${data.phone || 'Não informado'}</td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#8E8E93;">Relação com o Fato:</td>
            <td style="padding:6px 0;">${data.personType}</td>
          </tr>
        </table>
      </div>

      ${data.judicialBody ? `
      <h3 style="color:#D4AF37; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; margin:25px 0 10px;">
        Requisição de Autoridade / Mandado Judicial
      </h3>
      <div style="background:#13091F; border:1px solid rgba(123, 44, 191, 0.4); padding:15px 20px; border-radius:8px; margin-bottom:20px;">
        <table style="width:100%; border-collapse:collapse; font-size:13px; color:#E0AAFF;">
          <tr><td style="padding:6px 0; width:170px;">Órgão / Vara:</td><td style="padding:6px 0; font-weight:600;">${data.judicialBody}</td></tr>
          <tr><td style="padding:6px 0;">Nº do Processo / Ofício:</td><td style="padding:6px 0; font-family:monospace;">${data.processNumber || 'N/A'}</td></tr>
          <tr><td style="padding:6px 0;">Autoridade Subscritora:</td><td style="padding:6px 0;">${data.authorityName || 'N/A'}</td></tr>
          <tr><td style="padding:6px 0;">Prazo Determinado:</td><td style="padding:6px 0; font-weight:bold; color:#FF5470;">${data.judicialDeadline || 'Não especificado'}</td></tr>
        </table>
      </div>
      ` : ''}

      <h3 style="color:#F5E5AB; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; margin:25px 0 10px;">
        2. Conteúdo Alvo Denunciado
      </h3>
      <div style="background:#08080A; border:1px solid #2C2C2E; padding:15px 20px; border-radius:8px; margin-bottom:20px;">
        <table style="width:100%; border-collapse:collapse; font-size:13px; color:#D1D1D6;">
          <tr>
            <td style="padding:6px 0; color:#8E8E93; width:170px;">URL / Link Direto:</td>
            <td style="padding:6px 0;"><a href="${data.url}" target="_blank" rel="noopener noreferrer" style="color:#F5D77F; word-break:break-all;">${data.url}</a></td>
          </tr>
          ${data.username ? `<tr><td style="padding:6px 0; color:#8E8E93;">ID / Usuário:</td><td style="padding:6px 0;">${data.username}</td></tr>` : ''}
          ${data.approxDate ? `<tr><td style="padding:6px 0; color:#8E8E93;">Data Aproximada:</td><td style="padding:6px 0;">${data.approxDate}</td></tr>` : ''}
        </table>
      </div>

      <h3 style="color:#F5E5AB; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; margin:25px 0 10px;">
        3. Descrição dos Fatos e Violação Alegada
      </h3>
      <div style="background:#070709; border:1px solid #2C2C2E; padding:15px 20px; border-radius:8px; font-size:14px; line-height:1.7; color:#D1D1D6; white-space:pre-wrap;">${data.description}</div>

      <div style="margin-top:20px; padding:12px 16px; background:#0B160C; border:1px solid #1B4332; border-radius:6px; font-size:12px; color:#74C69D;">
        ✓ Declaração formal de veracidade e responsabilidade sob as penas da lei confirmada pelo comunicante.
      </div>

      <div style="margin-top:30px; text-align:center;">
        <a href="mailto:${data.email}?subject=Re: [Protocolo ${data.protocolNumber}] Notificação de Tramitação Lumiardi" class="btn">Responder ao Comunicante</a>
      </div>

      <p style="font-size:11px; color:#636366; margin-top:25px; text-align:center;">
        Este e-mail é um alerta prioritário gerado pelo canal de Notice-and-Action de www.lumiardi.com.<br>
        Destinatário oficial: ${toEmail}
      </p>
    `;

    const html = buildLuxuryEmailTemplate(title, preheader, content);
    const transporter = getTransporter();
    return transporter.sendMail({
      from: `"Lumiardi Trust & Safety" <${process.env.SMTP_USER || 'noreply@lumiardi.com'}>`,
      to: toEmail,
      replyTo: `"${data.name}" <${data.email}>`,
      subject: `🚨 [DENÚNCIA FORMAL] ${data.category} — Protocolo ${data.protocolNumber}`,
      html,
    });
  },

  async sendInterviewInvite(params: {
    to?: string;
    toEmail?: string;
    candidateName: string;
    interviewDate: string;
    interviewTime: string;
    meetUrl?: string;
    meetLink?: string;
    roomPasscode?: string;
  }): Promise<{ success: boolean; simulated: boolean; message: string; messageId?: string }> {
    const to = (params.to || params.toEmail || '').trim();
    const candidateName = (params.candidateName || '').trim();
    const interviewDate = (params.interviewDate || '').trim();
    const interviewTime = (params.interviewTime || '').trim();
    const meetUrl = (params.meetUrl || params.meetLink || '').trim();
    const roomPasscode = params.roomPasscode?.trim();

    // 1. Validação defensiva dos dados essenciais (lança erro explícito se faltar algum campo)
    if (!to) {
      throw new Error("Dados incompletos para o convite: to (e-mail da candidata)");
    }
    if (!candidateName) {
      throw new Error("Dados incompletos para o convite: candidateName");
    }
    if (!interviewDate) {
      throw new Error("Dados incompletos para o convite: interviewDate");
    }
    if (!interviewTime) {
      throw new Error("Dados incompletos para o convite: interviewTime");
    }
    if (!meetUrl) {
      throw new Error("Dados incompletos para o convite: meetUrl (link da sala de reunião)");
    }

    // 2. Verificação de chaves no .env: Se não configuradas, retorna aviso informativo claro
    if (!isEmailConfigured()) {
      console.warn('[EmailService] Chaves de envio de e-mail não configuradas no .env. Convite registrado localmente para:', to);
      return {
        success: true,
        simulated: true,
        message: 'Chaves de envio de e-mail não configuradas no .env. Convite registrado localmente.',
      };
    }

    // 3. Verificação prévia de conectividade SMTP
    try {
      await verifyConnection();
    } catch (verifyErr: any) {
      console.error('[SMTP VERIFY ERROR]:', verifyErr);
      throw new Error(`Falha na conexão SMTP (${process.env.SMTP_HOST || 'mail.lumiardi.com'}): ${verifyErr?.message || String(verifyErr)}`);
    }

    // 4. Formatação de data em Inglês
    let formattedDate = interviewDate;
    try {
      const cleanDate = interviewDate.includes('T') ? interviewDate.split('T')[0] : interviewDate;
      const dateObj = new Date(cleanDate + 'T12:00:00');
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    } catch {
      formattedDate = interviewDate;
    }

    // 5. Template do Convite (Inglês Oficial)
    const subject = 'Lumiardi Curation — Your Editorial Interview is Scheduled';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lumiardi Curation — Your Editorial Interview is Scheduled</title>
  <style>
    body { margin: 0; padding: 0; background-color: #070708; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E6E6E6; -webkit-font-smoothing: antialiased; }
    .wrapper { width: 100%; background-color: #070708; padding: 40px 10px; }
    .card { max-width: 600px; margin: 0 auto; background-color: #0F0F12; border: 1px solid #24221C; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
    .header { padding: 35px 30px 25px; text-align: center; border-bottom: 1px solid #1E1C17; background: radial-gradient(circle at top, #1C1914 0%, #0F0F12 100%); }
    .logo-text { font-size: 26px; font-weight: 700; letter-spacing: 5px; color: #F3E5AB; margin: 0; text-transform: uppercase; font-family: 'Cinzel', Georgia, serif; }
    .logo-sub { font-size: 11px; letter-spacing: 3px; color: #8C8270; margin-top: 6px; text-transform: uppercase; }
    .content { padding: 35px 35px 30px; font-size: 15px; line-height: 1.6; color: #D1D1D6; }
    .badge { display: inline-block; padding: 5px 14px; background: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 20px; color: #D4AF37; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 20px; }
    .details-box { background-color: #070709; border: 1px solid #24221C; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
    .detail-row { padding: 10px 0; border-bottom: 1px solid #1A1917; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-size: 11px; letter-spacing: 1.5px; color: #8C8270; text-transform: uppercase; margin-bottom: 4px; display: block; }
    .detail-value { font-size: 15px; color: #F3E5AB; font-weight: 600; }
    .instructions-box { background: rgba(212, 175, 55, 0.05); border: 1px solid rgba(212, 175, 55, 0.25); border-radius: 8px; padding: 18px 20px; margin: 24px 0; }
    .instructions-title { font-size: 12px; font-weight: 700; color: #D4AF37; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; }
    .instructions-list { margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.7; color: #C5C5CA; }
    .btn-container { text-align: center; margin: 30px 0 25px; }
    .btn { display: inline-block; padding: 15px 36px; background: linear-gradient(135deg, #D4AF37 0%, #AA820A 100%); color: #070708 !important; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-decoration: none; text-transform: uppercase; border-radius: 6px; }
    .footer { padding: 25px 30px; text-align: center; border-top: 1px solid #1A1917; font-size: 11px; color: #636366; background-color: #0A0A0C; line-height: 1.6; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;color:#070708;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Your editorial interview with Lumiardi Curation has been scheduled for ${formattedDate} at ${interviewTime} (Brasília Time).
  </div>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <h1 class="logo-text">LUMIARDI</h1>
        <div class="logo-sub">Curation Department & Editorial Board</div>
      </div>
      <div class="content">
        <div class="badge">Editorial Selection</div>
        <h2 style="color:#FFF; font-size:22px; font-weight:600; margin-top:0; margin-bottom:16px;">
          Your Editorial Interview is Scheduled
        </h2>
        
        <p>Hello, <strong style="color:#F3E5AB;">${candidateName}</strong>,</p>
        <p>We are pleased to confirm your preliminary curation interview with the Lumiardi editorial board. Please review your scheduled session details below:</p>
        
        <div class="details-box">
          <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">${formattedDate}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Time</span>
            <span class="detail-value">${interviewTime} (Brasília Time — BRT / UTC-3)</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Session Format</span>
            <span class="detail-value">Private Video Evaluation (1-on-1)</span>
          </div>
          ${roomPasscode ? `
          <div class="detail-row">
            <span class="detail-label">Access Passcode</span>
            <span class="detail-value" style="font-family:monospace; letter-spacing:3px;">${roomPasscode}</span>
          </div>
          ` : ''}
        </div>

        <div class="btn-container">
          <a href="${meetUrl}" class="btn" target="_blank" rel="noopener noreferrer">Join Secure Meeting Room</a>
        </div>

        <div class="instructions-box">
          <div class="instructions-title">Preparation & Mandatory Instructions</div>
          <ul class="instructions-list">
            <li><strong>Join 5 minutes early:</strong> Please connect 5 minutes prior to ensure camera and audio settings are ready.</li>
            <li><strong>Identification document:</strong> Have a valid government-issued ID card or passport ready for visual confirmation (in compliance with 18 U.S.C. § 2257).</li>
            <li><strong>Private environment:</strong> Ensure you are located in a quiet, well-lit private space for your session.</li>
          </ul>
        </div>

        <p style="font-size:13px; color:#8E8E93; line-height:1.6; margin-top:24px;">
          This meeting room link is private, encrypted, and uniquely assigned to your profile. Please do not forward or share this link. If you have any questions or need to reschedule, reply directly to this email.
        </p>
      </div>
      <div class="footer">
        <p style="margin:0 0 4px 0;">© ${new Date().getFullYear()} LUMIARDI INC. All rights reserved.</p>
        <p style="margin:0 0 4px 0;">Confidential & Encrypted Curation Channel • 18 U.S.C. § 2257 Compliance</p>
        <p style="margin:0;">Lumiardi Editorial Board • <a href="https://www.lumiardi.com" style="color:#8C8270; text-decoration:none;">www.lumiardi.com</a></p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const text = `LUMIARDI CURATION — YOUR EDITORIAL INTERVIEW IS SCHEDULED\n\n` +
      `Hello, ${candidateName},\n\n` +
      `We are pleased to confirm your preliminary curation interview with the Lumiardi editorial board.\n\n` +
      `SESSION DETAILS:\n` +
      `- Date: ${formattedDate}\n` +
      `- Time: ${interviewTime} (Brasília Time — BRT / UTC-3)\n` +
      `- Format: Private Video Evaluation (1-on-1)\n` +
      `${roomPasscode ? `- Access Passcode: ${roomPasscode}\n` : ''}` +
      `- Meeting Room: ${meetUrl}\n\n` +
      `MANDATORY INSTRUCTIONS:\n` +
      `1. Please connect 5 minutes early to test camera and audio.\n` +
      `2. Have a valid government-issued ID card or passport ready for visual confirmation (18 U.S.C. § 2257).\n` +
      `3. Ensure a quiet, well-lit private space.\n\n` +
      `This meeting link is private and assigned exclusively to you.\n` +
      `If you have questions or need to reschedule, please reply directly to this email.\n\n` +
      `Lumiardi Curation Team`;

    try {
      const fromAddress = process.env.EMAIL_FROM || `"Lumiardi Official" <${process.env.SMTP_USER || 'noreply@lumiardi.com'}>`;
      const info = await mailTransporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
        text,
      });

      return {
        success: true,
        simulated: false,
        message: `Convite enviado com sucesso para ${to}!`,
        messageId: info.messageId,
      };
    } catch (sendErr: any) {
      console.error('[SMTP SEND ERROR DEBUG]:', sendErr);
      throw new Error(`Falha no disparo do e-mail SMTP: ${sendErr?.message || String(sendErr)}`);
    }
  }
};
