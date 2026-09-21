/**
 * LUMIARDI — TESTE DE FOGO (LIVE PIX ASAAS PRODUÇÃO)
 * Executa uma chamada direta contra a API oficial de Produção do Asaas
 * Gerando uma cobrança PIX real de R$ 5,00 para validação pré-lançamento.
 */

const fs = require('fs');
const path = require('path');

function loadEnvironment() {
  const envFiles = ['.env', '.env.local', '.env.production'];
  const env = {};

  for (const file of envFiles) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!env[key]) {
            env[key] = val;
          }
        }
      });
    }
  }

  return env;
}

async function runLivePixTest() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🔥 LUMIARDI — TESTE DE FOGO PIX (PRODUÇÃO REAL ASAAS)');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const env = loadEnvironment();
  const rawApiUrl = env.ASAAS_API_URL || process.env.ASAAS_API_URL || 'https://api.asaas.com/v3';
  const apiUrl = rawApiUrl.replace(/\/+$/, '');
  const apiKey = (env.ASAAS_API_KEY || process.env.ASAAS_API_KEY || '').trim();

  if (!apiKey) {
    console.error('❌ ERRO CRÍTICO: ASAAS_API_KEY não foi encontrada nos arquivos de ambiente!');
    process.exit(1);
  }

  console.log(`🌐 Endpoint Conectado: ${apiUrl}`);
  console.log(`🔑 Chave de Produção detectada (prefixo: ${apiKey.slice(0, 16)}...)`);

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Lumiardi/1.0.0',
    access_token: apiKey,
  };

function generateValidCPF() {
  const rnd = (n) => Math.floor(Math.random() * n);
  const n = Array(9).fill(0).map(() => rnd(10));

  let d1 = n.reduce((total, num, idx) => total + num * (10 - idx), 0);
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;

  let d2 = [...n, d1].reduce((total, num, idx) => total + num * (11 - idx), 0);
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;

  return `${n.join('')}${d1}${d2}`;
}

  // 1. Obter ou Criar Cliente na Conta de Produção
  let customerId = null;
  const testEmail = 'teste.producao@lumiardi.com';
  const testCpf = generateValidCPF();

  console.log('\n[1/3] Verificando / criando cliente de teste com CPF válido...');
  try {
    const searchRes = await fetch(`${apiUrl}/customers?email=${encodeURIComponent(testEmail)}`, {
      method: 'GET',
      headers,
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
        console.log(`✅ Cliente existente localizado: ${searchData.data[0].name} (ID: ${customerId})`);
        
        // Garante que o cliente tenha CPF cadastrado
        if (!searchData.data[0].cpfCnpj) {
          console.log(`   Atualizando cliente com CPF válido para PIX...`);
          await fetch(`${apiUrl}/customers/${customerId}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ cpfCnpj: testCpf }),
          });
          console.log(`   CPF atualizado: ${testCpf}`);
        }
      }
    }

    if (!customerId) {
      // Cria novo cliente com dados de teste e CPF válido
      const createRes = await fetch(`${apiUrl}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Lumiardi Teste de Fogo Producao',
          email: testEmail,
          cpfCnpj: testCpf,
          notificationDisabled: true,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(`Falha ao criar cliente: ${JSON.stringify(createData)}`);
      }

      customerId = createData.id;
      console.log(`✅ Novo cliente de teste criado com sucesso (ID: ${customerId})`);
    }
  } catch (err) {
    console.error('❌ Erro na etapa de cliente:', err.message);
    process.exit(1);
  }

  // 2. Criar Cobrança Avulsa via PIX no Valor de R$ 5,00
  console.log('\n[2/3] Gerando cobrança PIX de R$ 5,00 na API de Produção...');
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dueDate = `${year}-${month}-${day}`;

  let payment = null;
  try {
    const paymentPayload = {
      customer: customerId,
      billingType: 'PIX',
      value: 5.00,
      dueDate: dueDate,
      description: 'Lumiardi — Teste de Fogo Produção R$ 5,00',
      externalReference: `teste_fogo_${Date.now()}`,
      postalService: false,
    };

    const payRes = await fetch(`${apiUrl}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(paymentPayload),
    });

    const payData = await payRes.json();
    if (!payRes.ok) {
      throw new Error(`Falha ao criar cobrança PIX: ${JSON.stringify(payData)}`);
    }

    payment = payData;
    console.log(`✅ Cobrança PIX criada com sucesso!`);
    console.log(`   • ID do Pagamento: ${payment.id}`);
    console.log(`   • Valor: R$ ${Number(payment.value).toFixed(2)}`);
    console.log(`   • Status: ${payment.status}`);
    console.log(`   • Vencimento: ${payment.dueDate}`);
    if (payment.invoiceUrl) {
      console.log(`   • Fatura Asaas: ${payment.invoiceUrl}`);
    }
  } catch (err) {
    console.error('❌ Erro na geração da cobrança:', err.message);
    process.exit(1);
  }

  // 3. Obter QR Code e Código Pix Copia e Cola
  console.log('\n[3/3] Obtendo chave Pix Copia e Cola e QR Code...');
  try {
    const qrRes = await fetch(`${apiUrl}/payments/${payment.id}/pixQrCode`, {
      method: 'GET',
      headers,
    });

    const qrData = await qrRes.json();
    if (!qrRes.ok) {
      throw new Error(`Falha ao obter dados Pix: ${JSON.stringify(qrData)}`);
    }

    const pixPayload = qrData.payload;
    const qrCodeWebLink = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixPayload)}`;

    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('🎉 COBRANÇA PIX REAL GERADA COM SUCESSO NO ASAAS PRODUÇÃO!');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    console.log(`📌 ID DA COBRANÇA: ${payment.id}`);
    console.log(`💵 VALOR: R$ 5,00`);
    console.log(`📅 EXPIRAÇÃO: ${qrData.expirationDate || '24 horas'}`);
    if (payment.invoiceUrl) {
      console.log(`🔗 PÁGINA OFICIAL DA FATURA ASAAS: ${payment.invoiceUrl}`);
    }
    console.log(`🖼️ LINK DIRETO PARA ESCANEAR QR CODE: ${qrCodeWebLink}\n`);

    console.log('📋 CÓDIGO PIX COPIA E COLA (Copie a linha inteira abaixo):');
    console.log('───────────────────────────────────────────────────────────────────');
    console.log(pixPayload);
    console.log('───────────────────────────────────────────────────────────────────\n');

    console.log('💡 Assim que o pagamento for concluído no aplicativo bancário,');
    console.log('   o Asaas disparará o evento PAYMENT_RECEIVED / PAYMENT_CONFIRMED.');
  } catch (err) {
    console.error('❌ Erro ao obter QR Code do Pix:', err.message);
    process.exit(1);
  }
}

runLivePixTest();
