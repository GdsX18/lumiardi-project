/**
 * LUMIARDI — CONTAS DE DEMONSTRAÇÃO COMERCIAL (SHOWCASE)
 *
 * Cria/atualiza duas contas usadas pelo atendimento comercial em apresentações:
 *
 *   MODELO   demo.modelo@lumiardi.com    senha: Lumiardi#Demo2026!Modelo
 *   AGÊNCIA  demo.agencia@lumiardi.com   senha: Lumiardi#Demo2026!Agencia
 *
 * Ambas têm users.is_demo = TRUE:
 *   - só enxergam uma à outra (catálogo, diretório de agências, propostas e chat);
 *   - são invisíveis para modelos/agências reais, para os KPIs e para as listagens da curadoria.
 *
 * Idempotente: cada execução restaura o estado "vitrine" (perfil, plano ativo, logo) e, por padrão,
 * zera o histórico de interações entre as duas (propostas, contratos, chat, notificações) para que a
 * próxima apresentação comece limpa. Use --keep-history para preservar esse histórico.
 *
 * Uso:
 *   node scripts/seed-demo-accounts.js [--keep-history]
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente (.env.local, .env.production ou .env)
const envFiles = ['.env.local', '.env.production', '.env'];
for (const f of envFiles) {
  const fullPath = path.join(__dirname, '..', f);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^["'](.*)["']$/, '$1');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
    break;
  }
}

const KEEP_HISTORY = process.argv.includes('--keep-history');
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERRO: Nenhuma URL de banco de dados (DATABASE_URL ou DIRECT_URL) encontrada.');
  process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });

const MODEL = {
  id: 'demo-modelo-showcase',
  email: 'demo.modelo@lumiardi.com',
  password: 'Lumiardi#Demo2026!Modelo',
  fullName: 'Sophia Laurent',
  planId: 'icon',
  planAmount: 129.9,
};

const AGENCY = {
  id: 'demo-agencia-showcase',
  email: 'demo.agencia@lumiardi.com',
  password: 'Lumiardi#Demo2026!Agencia',
  fullName: 'Helena Duarte',
  corporateName: 'Maison Áurea Management',
  planId: 'signature',
  planAmount: 490.0,
};

const DEMO_IDS = [MODEL.id, AGENCY.id];
const AGENCY_LOGO_KEY = `vault/${AGENCY.id}/avatars/maison-aurea-logo.png`;
const AGENCY_LOGO_URL = `/api/media/${AGENCY_LOGO_KEY}`;

// Book da modelo: imagens editoriais de vitrine já publicadas pelo site (public/images)
const MODEL_PHOTOS = [
  { id: 'demo-photo-1', url: '/images/creator_sophia.jpg', title: 'Editorial Noir — Milão', tag: 'Editorial' },
  { id: 'demo-photo-2', url: '/images/hero_visual.jpg', title: 'Golden Hour — Paris', tag: 'Campanha' },
];

const MODEL_QUALITATIVE = {
  artisticName: 'Sophia Laurent',
  category: 'Criadora de conteúdo +18',
  gender: 'Feminino Cisgênero',
  hobbies: 'Alta-costura, fotografia analógica, viagens e gastronomia francesa',
  platforms: { instagram: '@sophialaurent.demo', privacy: '@sophialaurent', onlyfans: 'sophialaurent' },
  monthlyRevenueEstimate: 'R$ 30.000 a R$ 80.000',
  conversionRateEstimate: '5% a 10%',
  availability: ['Tarde', 'Noite'],
  hasChildren: false,
  languages: ['Português', 'Inglês', 'Francês'],
  exposureOpinion: 'Exposição elegante, sempre com curadoria',
  personalLimits: 'Sem conteúdo explícito em campanhas abertas; apenas parcerias alinhadas ao posicionamento premium.',
  mainGoal: 'Consolidar carreira internacional premium',
  measurements: { height: '178', weight: '58', waist: '61', bust: '86', hips: '91' },
  physiognomy: { hairColor: 'Preto', eyeColor: 'Castanhos', skinTone: 'Negra' },
  acceptsOffers: true,
  isRepresented: false,
};

const MODEL_BIO =
  'Modelo e criadora de conteúdo com estética editorial e sofisticada. Trabalhos em campanhas de moda ' +
  'e lifestyle de luxo entre São Paulo, Paris e Milão. Presença de câmera marcante, postura de passarela ' +
  'e comunicação refinada em três idiomas. Busca parcerias exclusivas com marcas e agências que valorizem ' +
  'discrição, qualidade de produção e posicionamento premium.';

const AGENCY_BIO =
  'Boutique de gestão de talentos com sede em São Paulo e atuação internacional. Desenvolvemos carreiras ' +
  'de criadoras premium com planejamento estratégico, curadoria de imagem, negociação de contratos e ' +
  'proteção jurídica — sempre com total discrição e respeito aos limites de cada talento.';

function getR2() {
  const { CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY } = process.env;
  if (!CLOUDFLARE_R2_ACCOUNT_ID || !CLOUDFLARE_R2_ACCESS_KEY_ID || !CLOUDFLARE_R2_SECRET_ACCESS_KEY) return null;
  return {
    bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || 'lumiardi-vault-private',
    client: new S3Client({
      region: 'auto',
      endpoint: `https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: CLOUDFLARE_R2_ACCESS_KEY_ID, secretAccessKey: CLOUDFLARE_R2_SECRET_ACCESS_KEY },
    }),
  };
}

async function upsertUser(client, acc, role, hash) {
  // Conflito por e-mail mantém o id já existente (sessões/relacionamentos continuam válidos)
  const res = await client.query(
    `INSERT INTO users (id, email, password_hash, role, curation_status, full_name, plan_id, plan_billing_interval,
                        whatsapp, phone, is_demo, two_factor_enabled, two_factor_secret, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'APROVADO', $5, $6, 'yearly', '+55 11 90000-0000', '+55 11 90000-0000', TRUE, FALSE, NULL, NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       curation_status = 'APROVADO',
       rejection_reason = NULL,
       full_name = EXCLUDED.full_name,
       plan_id = EXCLUDED.plan_id,
       plan_billing_interval = 'yearly',
       is_demo = TRUE,
       two_factor_enabled = FALSE,
       two_factor_secret = NULL,
       updated_at = NOW()
     RETURNING id`,
    [acc.id, acc.email, hash, role, acc.fullName, acc.planId]
  );
  return res.rows[0].id;
}

async function upsertProfile(client, userId, fields) {
  const cols = Object.keys(fields);
  const values = cols.map((c) => fields[c]);
  await client.query(
    `INSERT INTO profiles (user_id, ${cols.join(', ')}, created_at, updated_at)
     VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')}, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET ${cols.map((c) => `${c} = EXCLUDED.${c}`).join(', ')}, updated_at = NOW()`,
    [userId, ...values]
  );
}

async function resetSubscription(client, userId, acc, category) {
  await client.query('DELETE FROM invoices WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);
  const subId = `sub_demo_${userId}`;
  await client.query(
    `INSERT INTO subscriptions (id, user_id, gateway, gateway_subscription_id, gateway_customer_id, plan_id, plan_category,
                                status, billing_interval, amount, currency, current_period_start, current_period_end,
                                cancel_at_period_end, metadata, created_at, updated_at)
     VALUES ($1, $2, 'asaas', NULL, NULL, $3, $4, 'active', 'yearly', $5, 'BRL', NOW(), NOW() + INTERVAL '365 days',
             FALSE, $6, NOW(), NOW())`,
    [subId, userId, acc.planId, category, acc.planAmount, JSON.stringify({ demo: true, note: 'Conta de demonstração — sem cobrança real' })]
  );
  await client.query(
    `INSERT INTO invoices (id, user_id, subscription_id, invoice_number, amount, currency, status, billing_reason,
                           due_date, paid_at, receipt_number, gateway, created_at)
     VALUES ($1, $2, $3, $4, $5, 'BRL', 'paid', $6, NOW(), NOW(), $7, 'asaas', NOW())`,
    [`inv_demo_${userId}`, userId, subId, `DEMO-${userId.toUpperCase()}`, acc.planAmount,
     `Assinatura Plano ${acc.planId} (Anual) — demonstração`, `REC-DEMO-${userId.toUpperCase()}`]
  );
}

async function run() {
  console.log('✨ ═══════════════════════════════════════════════════════════════');
  console.log('✨ LUMIARDI — CONTAS DE DEMONSTRAÇÃO COMERCIAL (SHOWCASE)');
  console.log('✨ ═══════════════════════════════════════════════════════════════\n');
  console.log(`🔌 Banco: ${connectionString.replace(/:[^:@]+@/, ':****@').replace(/^.*@/, '')}\n`);

  // 1. Logo da agência no R2 (categoria "avatars" = pública)
  const r2 = getR2();
  let logoUrl = '';
  if (r2) {
    await r2.client.send(new PutObjectCommand({
      Bucket: r2.bucket,
      Key: AGENCY_LOGO_KEY,
      Body: fs.readFileSync(path.join(__dirname, 'assets', 'demo-agency-logo.png')),
      ContentType: 'image/png',
      CacheControl: 'public, max-age=86400',
    }));
    logoUrl = AGENCY_LOGO_URL;
    console.log(`🖼️  Logo da agência publicado em ${AGENCY_LOGO_KEY}`);
  } else {
    console.log('⚠️  Credenciais do R2 ausentes: a agência ficará sem logo.');
  }

  const client = await pool.connect();
  try {
    // Garante a coluna mesmo que o deploy com a migração ainda não tenha rodado
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE');

    await client.query('BEGIN');

    const [modelHash, agencyHash] = await Promise.all([
      bcrypt.hash(MODEL.password, 10),
      bcrypt.hash(AGENCY.password, 10),
    ]);

    // 2. Conta MODELO
    const modelId = await upsertUser(client, MODEL, 'MODELO', modelHash);
    await upsertProfile(client, modelId, {
      artistic_name: MODEL_QUALITATIVE.artisticName,
      category: MODEL_QUALITATIVE.category,
      instagram: MODEL_QUALITATIVE.platforms.instagram,
      gender: MODEL_QUALITATIVE.gender,
      birth_date: '1999-04-12',
      bio: MODEL_BIO,
      hobbies: MODEL_QUALITATIVE.hobbies,
      exposure_opinion: MODEL_QUALITATIVE.exposureOpinion,
      measurements: JSON.stringify(MODEL_QUALITATIVE.measurements),
      physiognomy: JSON.stringify(MODEL_QUALITATIVE.physiognomy),
      address: JSON.stringify({ country: 'Brasil', state: 'SP', city: 'São Paulo' }),
      photos: JSON.stringify(MODEL_PHOTOS),
      avatar_url: MODEL_PHOTOS[0].url,
      monthly_revenue_estimate: MODEL_QUALITATIVE.monthlyRevenueEstimate,
      accepts_offers: true,
      is_represented: false,
      represented_agency_name: null,
      represented_agency_id: null,
      pre_interview: JSON.stringify(MODEL_QUALITATIVE),
    });
    await resetSubscription(client, modelId, MODEL, 'criadoras');

    // 3. Conta AGÊNCIA
    const agencyId = await upsertUser(client, AGENCY, 'AGENCIA', agencyHash);
    await upsertProfile(client, agencyId, {
      corporate_name: AGENCY.corporateName,
      responsible_name: AGENCY.fullName,
      category: 'Agência de Casting & Modelos',
      instagram: '@maisonaurea.demo',
      cnpj: '00.000.000/0001-00',
      bio: AGENCY_BIO,
      address: JSON.stringify({ country: 'Brasil', state: 'SP', city: 'São Paulo' }),
      commission_rate: '20%',
      specialties: JSON.stringify(['Alta Moda', 'Editorial', 'Campanhas de Luxo', 'Eventos VIP']),
      logo_url: logoUrl || null,
      avatar_url: logoUrl || null,
    });
    await resetSubscription(client, agencyId, AGENCY, 'agencias');

    // 4. Estado limpo para a próxima apresentação
    const ids = [modelId, agencyId];
    const idPattern = ids.join('|');
    if (!KEEP_HISTORY) {
      await client.query('DELETE FROM scout_proposals WHERE agency_id = ANY($1) OR model_id = ANY($1)', [ids]);
      await client.query('DELETE FROM agency_model_contracts WHERE agency_id = ANY($1) OR model_id = ANY($1)', [ids]);
      await client.query('DELETE FROM shared_drive_files WHERE agency_id = ANY($1) OR model_id = ANY($1)', [ids]);
      await client.query('DELETE FROM chat_conversations WHERE agency_id = ANY($1) OR model_id = ANY($1)', [ids]);
      await client.query('DELETE FROM messages WHERE sender_id = ANY($1) OR receiver_id = ANY($1) OR conversation_id ~ $2', [ids, idPattern]);
      await client.query('DELETE FROM notifications WHERE user_id = ANY($1)', [ids]);
      console.log('🧽 Histórico de propostas, contratos, chat e notificações das contas demo zerado.');
    }

    await client.query('COMMIT');

    // 5. Verificação: as demos estão marcadas e fora das listagens reais
    const check = await client.query(
      `SELECT u.email, u.role, u.curation_status, u.is_demo, s.plan_id, s.status AS plano
       FROM users u LEFT JOIN subscriptions s ON s.user_id = u.id WHERE u.id = ANY($1) ORDER BY u.role DESC`,
      [ids]
    );
    console.log('\n📋 Contas de demonstração:');
    console.table(check.rows);

    const realCatalog = await client.query(
      `SELECT COUNT(*)::int AS n FROM users WHERE id = ANY($1) AND is_demo = FALSE`,
      [ids]
    );
    if (realCatalog.rows[0].n !== 0) throw new Error('Alguma conta demo ficou sem is_demo = TRUE!');

    console.log('\n🔐 ═══════════════ CREDENCIAIS PARA O ATENDIMENTO ═══════════════');
    console.log(`   MODELO  (login como Modelo)   ${MODEL.email}   /   ${MODEL.password}`);
    console.log(`   AGÊNCIA (login como Agência)  ${AGENCY.email}  /   ${AGENCY.password}`);
    console.log('   ───────────────────────────────────────────────────────────────');
    console.log('   • As duas só enxergam uma à outra; usuários reais nunca as veem.');
    console.log('   • Roteiro: Agência → Catálogo → "Sophia Laurent" → Enviar proposta;');
    console.log('     Modelo → aceitar proposta → chat em tempo real entre as duas.');
    console.log('   • Rode este script de novo antes de cada apresentação para zerar o histórico.');
    console.log('   ═══════════════════════════════════════════════════════════════\n');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Erro ao criar contas demo (transação revertida):', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
