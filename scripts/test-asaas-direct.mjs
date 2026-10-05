/**
 * LUMIARDI — VALIDAÇÃO ISOLADA DO ASAAS (sem frontend, sem banco)
 *
 * Carrega o ambiente exatamente como o Next.js (@next/env) e chama a API do Asaas direto:
 *   1. Chave de API: GET /myAccount
 *   2. Chave Pix: GET /pix/addressKeys (confere ASAAS_PIX_KEY cadastrada e ativa)
 *   3. Pix: cria cliente de teste + cobrança PIX (POST /customers, POST /payments) e busca o QR Code
 *      (GET /payments/{id}/pixQrCode). Cliente e cobrança são excluídos ao final (use --keep para manter).
 *   4. Cartão: monta e valida localmente o payload de POST /payments (CREDIT_CARD) — NÃO envia ao Asaas.
 *
 * Uso:
 *   node scripts/test-asaas-direct.mjs [--prod] [--cpf=00000000000] [--value=5] [--keep] [--dry-run]
 *     --prod     carrega como produção (.env.production) em vez de desenvolvimento (.env.local)
 *     --cpf      CPF do cliente de teste (padrão: ASAAS_TEST_CPF ou um CPF válido gerado)
 *     --dry-run  só valida chave/Pix key e o payload do cartão, sem criar cliente/cobrança
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require('@next/env');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const isProd = Boolean(args.prod);

let failures = 0;
const ok = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg) => {
  failures++;
  console.log(`  ❌ ${msg}`);
};
const section = (title) => console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 60 - title.length))}`);

// ── Ambiente (mesmo loader do Next.js) ─────────────────────────────────────────
section(`Ambiente (${isProd ? 'produção' : 'desenvolvimento'})`);
const { loadedEnvFiles } = loadEnvConfig(root, !isProd, { info() {}, error() {} }, true);
console.log(`  Arquivos carregados: ${loadedEnvFiles.map((f) => path.basename(f.path)).join(', ') || '(nenhum)'}`);

// Mesma normalização de src/lib/payments/asaasClient.ts (normalizeAsaasApiKey)
function normalizeAsaasApiKey(raw) {
  let key = String(raw ?? '').trim().replace(/^["']|["']$/g, '');
  if (key.startsWith('\\$')) key = key.slice(1);
  if (/^aact_/.test(key)) key = `$${key}`;
  return key;
}

const loadedRawKey = process.env.ASAAS_API_KEY;
const apiKey = normalizeAsaasApiKey(loadedRawKey);
const apiUrl = (process.env.ASAAS_API_URL || 'https://api.asaas.com/v3').replace(/\/+$/, '');
const pixKey = (process.env.ASAAS_PIX_KEY || '').trim();

// O "$" inicial da chave é expandido como variável pelo loader do Next/Docker → chave vazia em runtime
for (const f of loadedEnvFiles) {
  const line = fs.readFileSync(f.path, 'utf8').split(/\r?\n/).find((l) => /^\s*ASAAS_API_KEY\s*=/.test(l));
  if (line && /=\s*["']?\$aact_/.test(line)) {
    fail(`${path.basename(f.path)}: ASAAS_API_KEY começa com "$" — o Next.js/Docker o expande como variável. Remova o "$" inicial (ASAAS_API_KEY=aact_...).`);
  }
}

console.log(`  ASAAS_API_URL: ${apiUrl}`);
if (!apiKey) {
  fail(`ASAAS_API_KEY vazia após o carregamento (valor bruto carregado: ${JSON.stringify(loadedRawKey ?? null)}).`);
  console.log('\nSem chave não há como testar o Asaas. Corrija o .env e rode de novo.');
  process.exit(1);
}
ok(`ASAAS_API_KEY carregada (${apiKey.slice(0, 11)}…, ${apiKey.length} caracteres)`);
const isSandbox = apiUrl.includes('sandbox');
if (apiKey.startsWith('$aact_prod_') && isSandbox) fail('Chave de PRODUÇÃO apontando para a URL de sandbox.');
if (apiKey.startsWith('$aact_hmlg_') && !isSandbox) fail('Chave de SANDBOX apontando para a URL de produção.');

const headers = { 'Content-Type': 'application/json', 'User-Agent': 'Lumiardi/1.0.0', access_token: apiKey };

async function asaas(method, endpoint, body) {
  let res;
  try {
    res = await fetch(`${apiUrl}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (err) {
    return { status: 0, json: null, text: `Falha de rede: ${err.cause?.code || err.message}` };
  }
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* corpo vazio ou não-JSON */
  }
  return { status: res.status, json, text };
}

const describe = (r) =>
  `HTTP ${r.status}${r.json?.errors ? ` — ${r.json.errors.map((e) => `${e.code}: ${e.description}`).join(' | ')}` : r.text ? ` — ${r.text.slice(0, 200)}` : ' (corpo vazio)'}`;

// ── Utilidades de documento/cartão (mesmas regras de src/lib/payments/document.ts) ──
const onlyDigits = (v) => String(v ?? '').replace(/\D/g, '');
function isValidCpf(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}
function generateCpf() {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  for (const len of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += n[i] * (len + 1 - i);
    const rest = (sum * 10) % 11;
    n.push(rest === 10 ? 0 : rest);
  }
  return n.join('');
}
function luhn(number) {
  let sum = 0;
  let dbl = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let d = Number(number[i]);
    if (dbl && (d *= 2) > 9) d -= 9;
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

// ── 1. Chave de API ───────────────────────────────────────────────────────────
section('1. Chave de API (GET /myAccount)');
const account = await asaas('GET', '/myAccount');
if (account.status === 200) ok(`Chave válida — conta: ${account.json?.name || account.json?.companyName || '(sem nome)'}`);
else {
  fail(`Chave recusada: ${describe(account)}`);
  console.log('\nSem chave válida as demais chamadas falhariam. Encerrando.');
  process.exit(1);
}

// ── 2. Chave Pix ──────────────────────────────────────────────────────────────
section('2. Chave Pix (GET /pix/addressKeys)');
const keys = await asaas('GET', '/pix/addressKeys?limit=100');
if (keys.status === 200) {
  const list = Array.isArray(keys.json?.data) ? keys.json.data : [];
  const active = list.filter((k) => String(k.status).toUpperCase() === 'ACTIVE');
  ok(`HTTP 200 — ${list.length} chave(s) Pix na conta, ${active.length} ativa(s)`);
  if (active.length === 0) fail('Nenhuma chave Pix ATIVA: o Asaas não gera QR Code dinâmico sem uma.');
  if (pixKey) {
    const match = list.find((k) => String(k.key).toLowerCase() === pixKey.toLowerCase());
    if (match) ok(`ASAAS_PIX_KEY encontrada na conta (status ${match.status})`);
    else fail('ASAAS_PIX_KEY não corresponde a nenhuma chave Pix desta conta.');
  }
} else fail(`Falha ao listar chaves Pix: ${describe(keys)}`);

// ── 3. Cliente + cobrança Pix + QR Code ───────────────────────────────────────
section('3. Cobrança Pix real (POST /customers, POST /payments, GET /pixQrCode)');
if (args['dry-run']) {
  console.log('  (pulado: --dry-run)');
} else {
  const cpf = onlyDigits(args.cpf || process.env.ASAAS_TEST_CPF) || generateCpf();
  if (!isValidCpf(cpf)) fail(`CPF de teste inválido: ${cpf}`);
  const value = Number(args.value) || 5;
  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  let customerId = null;
  let paymentId = null;

  const customer = await asaas('POST', '/customers', {
    name: 'Lumiardi Teste Integracao',
    cpfCnpj: cpf,
    externalReference: `test-asaas-direct-${Date.now()}`,
    notificationDisabled: true,
  });
  if (customer.status === 200 && customer.json?.id) {
    customerId = customer.json.id;
    ok(`Cliente criado: ${customerId}`);
  } else fail(`Falha ao criar cliente: ${describe(customer)}`);

  if (customerId) {
    const payment = await asaas('POST', '/payments', {
      customer: customerId,
      billingType: 'PIX',
      value,
      dueDate,
      description: 'Lumiardi — teste isolado de integração (será excluída)',
      externalReference: 'test-asaas-direct',
    });
    if (payment.status === 200 && payment.json?.id) {
      paymentId = payment.json.id;
      ok(`Cobrança Pix criada: ${paymentId} (R$ ${value.toFixed(2)}, status ${payment.json.status})`);
    } else fail(`Falha ao criar cobrança Pix: ${describe(payment)}`);
  }

  if (paymentId) {
    let qr = null;
    for (let attempt = 0; attempt < 3 && !qr; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 700 * attempt));
      const r = await asaas('GET', `/payments/${paymentId}/pixQrCode`);
      if (r.status === 200 && r.json?.payload && r.json?.encodedImage) qr = r;
      else if (attempt === 2) fail(`Falha ao obter QR Code Pix: ${describe(r)}`);
    }
    if (qr) {
      ok(`QR Code Pix: HTTP 200 — copia e cola com ${qr.json.payload.length} caracteres, imagem base64 com ${qr.json.encodedImage.length} caracteres`);
      if (!qr.json.payload.startsWith('000201')) fail('Payload Pix não está no formato EMV (000201...).');
    }
  }

  // Limpeza: nada de teste fica na conta (a menos que --keep)
  if (!args.keep) {
    if (paymentId) {
      const del = await asaas('DELETE', `/payments/${paymentId}`);
      del.status === 200 ? ok(`Cobrança ${paymentId} excluída`) : fail(`Não foi possível excluir a cobrança ${paymentId}: ${describe(del)}`);
    }
    if (customerId) {
      const del = await asaas('DELETE', `/customers/${customerId}`);
      del.status === 200 ? ok(`Cliente ${customerId} excluído`) : fail(`Não foi possível excluir o cliente ${customerId}: ${describe(del)}`);
    }
  } else if (paymentId || customerId) {
    console.log(`  (--keep: mantidos cliente ${customerId} e cobrança ${paymentId})`);
  }
}

// ── 4. Payload de cartão (validação local, sem envio) ─────────────────────────
section('4. Payload de cartão de crédito (validação local — NÃO enviado)');
// Mesma montagem de /api/checkout/confirm + AsaasClient.createPayment. Cartão de teste oficial do Asaas (sandbox).
const sampleCard = { number: '5184 0197 4037 3151', holderName: 'TITULAR TESTE', expiry: '05/30', cvv: '318' };
const [expMonth, expYearShort] = sampleCard.expiry.split('/');
const cardPayload = {
  customer: 'cus_000000000000',
  billingType: 'CREDIT_CARD',
  value: 5,
  dueDate: new Date().toISOString().split('T')[0],
  description: 'Assinatura Lumiardi — Plano Glow (Mensal)',
  externalReference: 'user:glow:monthly',
  creditCard: {
    holderName: sampleCard.holderName,
    number: onlyDigits(sampleCard.number),
    expiryMonth: expMonth.padStart(2, '0'),
    expiryYear: expYearShort.length === 2 ? `20${expYearShort}` : expYearShort,
    ccv: sampleCard.cvv,
  },
  creditCardHolderInfo: {
    name: sampleCard.holderName,
    email: 'titular@example.com',
    cpfCnpj: generateCpf(),
    postalCode: onlyDigits('01310-100'),
    addressNumber: '1000',
    phone: onlyDigits('(11) 98765-4321'),
    mobilePhone: onlyDigits('(11) 98765-4321'),
  },
  remoteIp: '200.200.200.200',
};

const checks = [
  ['creditCard.number (Luhn)', luhn(cardPayload.creditCard.number) && cardPayload.creditCard.number.length >= 13],
  ['creditCard.expiryMonth (MM)', /^(0[1-9]|1[0-2])$/.test(cardPayload.creditCard.expiryMonth)],
  ['creditCard.expiryYear (AAAA)', /^\d{4}$/.test(cardPayload.creditCard.expiryYear)],
  ['creditCard.ccv (3-4 dígitos)', /^\d{3,4}$/.test(cardPayload.creditCard.ccv)],
  ['creditCard.holderName', Boolean(cardPayload.creditCard.holderName.trim())],
  ['creditCardHolderInfo.name', Boolean(cardPayload.creditCardHolderInfo.name)],
  ['creditCardHolderInfo.email', /.+@.+\..+/.test(cardPayload.creditCardHolderInfo.email)],
  ['creditCardHolderInfo.cpfCnpj (CPF válido)', isValidCpf(cardPayload.creditCardHolderInfo.cpfCnpj)],
  ['creditCardHolderInfo.postalCode (8 dígitos)', /^\d{8}$/.test(cardPayload.creditCardHolderInfo.postalCode)],
  ['creditCardHolderInfo.addressNumber', Boolean(cardPayload.creditCardHolderInfo.addressNumber)],
  ['creditCardHolderInfo.phone (10-11 dígitos)', /^\d{10,11}$/.test(cardPayload.creditCardHolderInfo.phone)],
  ['remoteIp', Boolean(cardPayload.remoteIp)],
];
const undefinedFields = [];
const walk = (obj, prefix = '') => {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') undefinedFields.push(prefix + k);
    else if (typeof v === 'object') walk(v, `${prefix}${k}.`);
  }
};
walk(cardPayload);
for (const [name, pass] of checks) (pass ? ok : fail)(name);
undefinedFields.length ? fail(`Campos vazios/undefined: ${undefinedFields.join(', ')}`) : ok('Nenhum campo vazio ou undefined');
const masked = {
  ...cardPayload,
  creditCard: { ...cardPayload.creditCard, number: `**** **** **** ${cardPayload.creditCard.number.slice(-4)}`, ccv: '***' },
};
console.log(`\n  Payload montado:\n${JSON.stringify(masked, null, 2).replace(/^/gm, '    ')}`);

// ── Resultado ────────────────────────────────────────────────────────────────
console.log(`\n${failures === 0 ? '✅ Tudo certo com o Asaas.' : `❌ ${failures} verificação(ões) falharam.`}`);
process.exit(failures === 0 ? 0 : 1);
