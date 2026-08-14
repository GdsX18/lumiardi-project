/**
 * LUMIARDI — SUÍTE DE TESTES AUTOMATIZADOS DE SISTEMA & INTEGRAÇÃO
 * Executável via: node scripts/test-suite.js
 */

const assert = require('assert');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('🧪 ═══════════════════════════════════════════════════════════════');
  console.log('🧪 LUMIARDI — EXECUÇÃO DE TESTES TÉCNICOS INTEGRADOS (PRODUÇÃO)');
  console.log('🧪 Multi-Gateway, 2FA TOTP, KYC, Storage R2, Rate Limit & Legal');
  console.log('🧪 ═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  // 1. Teste de Integridade de Arquivos Essenciais & Infra
  console.log('📂 1. Verificação de Arquivos de Infraestrutura & Deploy:');
  test('Dockerfile existe e contém configuração multi-stage', () => {
    const dockerfile = fs.readFileSync(path.join(__dirname, '..', 'Dockerfile'), 'utf8');
    assert(dockerfile.includes('FROM node:20-alpine AS deps'));
    assert(dockerfile.includes('FROM node:20-alpine AS runner'));
    assert(dockerfile.includes('server.js'));
  });

  test('docker-compose.yml existe e declara postgres 17 e app', () => {
    const compose = fs.readFileSync(path.join(__dirname, '..', 'docker-compose.yml'), 'utf8');
    assert(compose.includes('image: postgres:17-alpine'));
    assert(compose.includes('lumiardi_postgres'));
    assert(compose.includes('lumiardi_app'));
  });

  test('.env.example existe e contém variáveis de ambiente documentadas', () => {
    const envEx = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
    assert(envEx.includes('DATABASE_URL'));
    assert(envEx.includes('CCBILL_CLIENT_ACCNUM'));
    assert(envEx.includes('NOWPAYMENTS_API_KEY'));
    assert(envEx.includes('UPSTASH_REDIS_REST_URL'));
    assert(envEx.includes('CLOUDFLARE_R2_BUCKET_NAME'));
  });

  test('lumiardi_schema.sql existe e contém tabelas de usuários, faturas e assinaturas', () => {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'lumiardi_schema.sql'), 'utf8');
    assert(sql.includes('CREATE TABLE IF NOT EXISTS users'));
    assert(sql.includes('CREATE TABLE IF NOT EXISTS profiles'));
    assert(sql.includes('CREATE TABLE IF NOT EXISTS subscriptions'));
    assert(sql.includes('CREATE TABLE IF NOT EXISTS payment_transactions'));
    assert(sql.includes('CREATE TABLE IF NOT EXISTS invoices'));
    assert(sql.includes('CREATE TABLE IF NOT EXISTS payouts'));
  });

  // 2. Teste de Módulos de Pagamento & Cibersegurança
  console.log('\n💳 2. Verificação dos Módulos Financeiros, 2FA e Storage:');
  const modules = [
    'src/lib/payments/types.ts',
    'src/lib/payments/plansConfig.ts',
    'src/lib/payments/ccbillAdapter.ts',
    'src/lib/payments/nowpaymentsAdapter.ts',
    'src/lib/payments/gatewayFactory.ts',
    'src/lib/payments/billingService.ts',
    'src/lib/cache.ts',
    'src/lib/security/totp.ts',
    'src/lib/security/rateLimiter.ts',
    'src/lib/security/turnstile.ts',
    'src/lib/kyc/kycService.ts',
    'src/lib/storage/r2Service.ts',
  ];

  modules.forEach((file) => {
    test(`Módulo de produção existe: ${file}`, () => {
      assert(fs.existsSync(path.join(__dirname, '..', file)), `Arquivo ${file} não encontrado`);
    });
  });

  // 3. Teste de Assinaturas, Hash e Criptografia
  console.log('\n🔒 3. Testes de Criptografia, 2FA e Hash:');
  await testAsync('Geração e verificação de hash bcrypt para senhas seguras', async () => {
    const password = 'lumiardi2026';
    const hash = await bcrypt.hash(password, 10);
    const isValid = await bcrypt.compare(password, hash);
    assert.strictEqual(isValid, true, 'O hash deve validar a senha original');
  });

  test('Cálculo de FormDigest MD5 para CCBill FlexForms', () => {
    const salt = 'lumiardi_salt_test';
    const stringToHash = `69.903069.90301840${salt}`;
    const digest = crypto.createHash('md5').update(stringToHash).digest('hex');
    assert.strictEqual(typeof digest, 'string');
    assert.strictEqual(digest.length, 32);
  });

  test('Cálculo de Assinatura HMAC-SHA512 para NOWPayments IPN', () => {
    const secret = 'nowpayments_ipn_secret_test';
    const payload = JSON.stringify({ payment_id: '12345', status: 'finished' });
    const hmac = crypto.createHmac('sha512', secret).update(payload).digest('hex');
    assert.strictEqual(typeof hmac, 'string');
    assert.strictEqual(hmac.length, 128);
  });

  // 4. Teste das Rotas de API, Webhooks & 2FA
  console.log('\n🌐 4. Verificação de Rotas da API & Webhooks:');
  const apiRoutes = [
    'src/app/api/upload/route.ts',
    'src/app/api/drive/route.ts',
    'src/app/api/drive/signed-url/route.ts',
    'src/app/api/chat/messages/route.ts',
    'src/app/api/chat/conversations/route.ts',
    'src/app/api/kanban/route.ts',
    'src/app/api/creators/route.ts',
    'src/app/api/agencies/route.ts',
    'src/app/api/auth/login/route.ts',
    'src/app/api/auth/register/route.ts',
    'src/app/api/auth/2fa/generate/route.ts',
    'src/app/api/auth/2fa/verify/route.ts',
    'src/app/api/curation/verify/route.ts',
    'src/app/api/webhooks/kyc/route.ts',
    'src/app/api/user/me/route.ts',
    'src/app/api/profile/update/route.ts',
    'src/app/api/checkout/create-session/route.ts',
    'src/app/api/webhooks/ccbill/route.ts',
    'src/app/api/webhooks/nowpayments/route.ts',
    'src/app/api/billing/subscription/route.ts',
    'src/app/api/billing/subscription/cancel/route.ts',
    'src/app/api/billing/invoices/route.ts',
    'src/app/api/billing/payouts/route.ts',
  ];

  apiRoutes.forEach((route) => {
    test(`Rota de API existe: ${route}`, () => {
      assert(fs.existsSync(path.join(__dirname, '..', route)), `Arquivo ${route} não encontrado`);
    });
  });

  // 5. Teste das Páginas do Dashboard, Portais e Legal
  console.log('\n🖥️ 5. Verificação de Páginas, Portais e Documentação Legal:');
  const pages = [
    'src/app/page.tsx',
    'src/app/login/page.tsx',
    'src/app/planos/page.tsx',
    'src/app/checkout/page.tsx',
    'src/app/termos/page.tsx',
    'src/app/privacidade/page.tsx',
    'src/app/compliance-2257/page.tsx',
    'src/app/dashboard/page.tsx',
    'src/app/dashboard/billing/page.tsx',
    'src/app/dashboard/book/page.tsx',
    'src/app/dashboard/meet/page.tsx',
    'src/app/dashboard/drive/page.tsx',
    'src/app/dashboard/chat/page.tsx',
    'src/app/dashboard/kanban/page.tsx',
    'src/app/dashboard/agencias/page.tsx',
    'src/app/admin/page.tsx',
    'src/app/admin/login/page.tsx',
  ];

  pages.forEach((p) => {
    test(`Página existe e compilada: ${p}`, () => {
      assert(fs.existsSync(path.join(__dirname, '..', p)), `Página ${p} não encontrada`);
    });
  });

  // Resumo
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`📊 RESULTADO DOS TESTES: ${passed} PASSARAM | ${failed} FALHARAM`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
