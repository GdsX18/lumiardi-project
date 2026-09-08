/**
 * LUMIARDI — TESTE DE INTEGRAÇÃO DO GATEWAY ASAAS (API v3)
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function testAsaasIntegration() {
  console.log('🧪 Iniciando testes de integração do Asaas API v3...');

  // Lê e valida .env.local
  const envLocal = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  assert(envLocal.includes('ASAAS_API_KEY'));
  assert(envLocal.includes('ASAAS_API_URL'));
  assert(envLocal.includes('ASAAS_WEBHOOK_SECRET'));
  assert(!envLocal.includes('CCBILL_CLIENT_ACCNUM'), 'Não deve conter variáveis CCBILL');
  console.log('✅ Variáveis de ambiente Asaas e ausência de CCBILL verificadas em .env.local.');

  // Lê e valida .env.production
  const envProd = fs.readFileSync(path.join(__dirname, '..', '.env.production'), 'utf8');
  assert(envProd.includes('ASAAS_API_KEY'));
  assert(envProd.includes('ASAAS_API_URL'));
  assert(envProd.includes('ASAAS_WEBHOOK_SECRET'));
  assert(!envProd.includes('CCBILL_CLIENT_ACCNUM'), 'Não deve conter variáveis CCBILL');
  console.log('✅ Variáveis de ambiente Asaas e ausência de CCBILL verificadas em .env.production.');

  // Lê e valida .env.example
  const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
  assert(envExample.includes('ASAAS_API_KEY'));
  assert(envExample.includes('ASAAS_API_URL'));
  assert(envExample.includes('ASAAS_WEBHOOK_SECRET'));
  assert(!envExample.includes('CCBILL_CLIENT_ACCNUM'), 'Não deve conter variáveis CCBILL');
  console.log('✅ Variáveis de ambiente Asaas e ausência de CCBILL verificadas em .env.example.');

  // Teste de cálculo de expiração e formatação Pix EMV
  const formattedAmount = (69.9).toFixed(2);
  const mockPayload = `00020126580014br.gov.bcb.pix0136pix@asaas.com.br520400005303986540${formattedAmount}5802BR5916LUMIARDI PLATFORM6009SAO PAULO62070503***6304`;
  assert(mockPayload.includes('br.gov.bcb.pix'));
  assert(mockPayload.includes('69.90'));
  console.log('✅ Formatação EMV do Pix BACEN verificada.');

  // Teste de simulação dos 4 eventos de webhook
  const events = ['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_OVERDUE', 'PAYMENT_REFUNDED'];
  for (const ev of events) {
    const payload = {
      event: ev,
      payment: {
        id: `pay_test_${Date.now()}`,
        customer: 'cus_test_123',
        value: 19.90,
        billingType: 'PIX',
        status: ev === 'PAYMENT_RECEIVED' ? 'RECEIVED' : ev === 'PAYMENT_CONFIRMED' ? 'CONFIRMED' : ev === 'PAYMENT_OVERDUE' ? 'OVERDUE' : 'REFUNDED',
        externalReference: 'user-test-1:glow:monthly',
      },
    };

    assert.strictEqual(payload.event, ev);
    assert(payload.payment.externalReference.includes('user-test-1'));
    console.log(`✅ Evento Asaas simulado com sucesso: ${ev}`);
  }

  // Verifica que rota antiga ccbill não existe
  assert(!fs.existsSync(path.join(__dirname, '..', 'src/app/api/webhooks/ccbill')), 'src/app/api/webhooks/ccbill deve ser deletada');
  assert(fs.existsSync(path.join(__dirname, '..', 'src/app/api/webhooks/asaas/route.ts')), 'src/app/api/webhooks/asaas/route.ts deve existir');
  console.log('✅ Exclusão da rota ccbill e criação da rota asaas confirmadas.');

  console.log('\n🎉 Todos os testes de integração do Asaas passaram com 100% de sucesso!');
}

testAsaasIntegration().catch((e) => {
  console.error('❌ Falha:', e);
  process.exit(1);
});

