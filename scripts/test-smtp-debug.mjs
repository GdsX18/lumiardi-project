/**
 * Diagnóstico SMTP isolado (temporário).
 *
 * Uso:
 *   node scripts/test-smtp-debug.mjs                         -> só EHLO/AUTH (verify)
 *   node scripts/test-smtp-debug.mjs destino@gmail.com       -> envia e-mail de teste
 *   node scripts/test-smtp-debug.mjs destino@gmail.com --env=.env.production --port=587
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

const args = process.argv.slice(2);
const opt = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const to = args.find((a) => !a.startsWith('--'));
const envFile = opt('env') || '.env.local';

if (!fs.existsSync(envFile)) {
  console.error(`Arquivo ${envFile} não encontrado`);
  process.exit(1);
}
process.loadEnvFile(envFile);

const host = opt('host') || process.env.SMTP_HOST;
const port = Number(opt('port') || process.env.SMTP_PORT || 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const fromAddr = 'noreply@lumiardi.com';

console.log(`\n=== SMTP DEBUG | env=${envFile} host=${host} port=${port} secure=${port === 465} user=${user} ===\n`);

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  requireTLS: port === 587,
  auth: { user, pass },
  tls: { servername: host, minVersion: 'TLSv1.2' },
  logger: true,
  debug: true,
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
});

try {
  await transporter.verify();
  console.log('\n[OK] Conexão + AUTH aceitos pelo servidor\n');
} catch (err) {
  console.error('\n[FALHA] verify():', err.code, err.responseCode, err.response || err.message);
  process.exit(2);
}

if (!to) {
  console.log('Nenhum destinatário informado — apenas verify executado.');
  process.exit(0);
}

const msgId = `<${crypto.randomUUID()}@lumiardi.com>`;
const now = new Date();

try {
  const info = await transporter.sendMail({
    envelope: { from: fromAddr, to },
    from: `"Lumiardi Official" <${fromAddr}>`,
    to,
    replyTo: fromAddr,
    subject: `Lumiardi SMTP diagnostic ${now.toISOString()}`,
    messageId: msgId,
    date: now,
    text: `Teste de entrega SMTP.\nMessage-ID: ${msgId}\nHost: ${host}:${port}\n`,
    html: `<p>Teste de entrega SMTP.</p><p>Message-ID: <code>${msgId.replace(/[<>]/g, '')}</code></p>`,
  });
  console.log('\n=== RESULTADO ===');
  console.log('messageId :', info.messageId);
  console.log('envelope  :', info.envelope);
  console.log('accepted  :', info.accepted);
  console.log('rejected  :', info.rejected);
  console.log('response  :', info.response);
} catch (err) {
  console.error('\n[FALHA] sendMail():', err.code, err.responseCode, err.command, err.response || err.message);
  process.exit(3);
}
