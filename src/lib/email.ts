/**
 * LUMIARDI — SERVIÇO DE E-MAILS TRANSACIONAIS (SMTP LUXURY ENGINE)
 * Disparo oficial de E-mails com autenticação 2FA, Boas-Vindas, Auditoria 2257 e Recuperação de Senha.
 * Design responsivo de alto padrão (Dark/Gold Luxury Theme).
 */

import nodemailer from 'nodemailer';

// Configuração do Transportador SMTP
function getTransporter() {
  const host = process.env.SMTP_HOST || '69.6.249.13';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER || 'noreply@lumiardi.com';
  const pass = process.env.SMTP_PASS || '@Sender@#2026';

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false, // Evita bloqueios por certificados autoassinados da hospedagem
    },
  });
}

const FROM_EMAIL = process.env.EMAIL_FROM || '"LUMIARDI" <noreply@lumiardi.com>';

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

      <p style="font-size:13px; color:#8E8E93; margin-top:20px;">Dúvidas? Nossa concierge está à sua disposição 24/7 respondendo a este e-mail.</p>
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
};
