/**
 * LUMIARDI — ELIMINAÇÃO DEFINITIVA DAS CONTAS DE TESTE (PRÉ-PRODUÇÃO)
 *
 * Remove as contas abaixo e TODOS os registros associados:
 *   - public.users (+ CASCADE: profiles, curation_interviews, scout_proposals, agency_model_contracts,
 *     notifications, subscriptions, invoices, payouts, kanban_tasks, drive_files, shared_drive_files,
 *     terms_acceptances)
 *   - tabelas sem FK: messages, chat_conversations, application_notes, curation_audit_logs,
 *     payment_transactions, meet_rooms/participants/signals, rate_limits, contact_inquiries,
 *     compliance_reports
 *   - auth.users (Supabase Auth, se existir registro)
 *   - arquivos no Cloudflare R2: vault/<userId>/** e vault/shared/** que envolvam o usuário
 *
 * Uso:
 *   node scripts/cleanup-test-users.js            → simulação (nada é apagado)
 *   node scripts/cleanup-test-users.js --execute  → apaga de verdade (transação única + R2 após o COMMIT)
 */

const { Pool } = require('pg');
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

const TEST_EMAILS = [
  'bernardodemoreira01@gmail.com',
  'bernardodemoreira08@gmail.com',
  'bernardodemoreira07@gmail.com',
];

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

const EXECUTE = process.argv.includes('--execute');
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERRO: Nenhuma URL de banco de dados (DATABASE_URL ou DIRECT_URL) encontrada.');
  process.exit(1);
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });

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

async function listKeys(r2, prefix) {
  const keys = [];
  let token;
  do {
    const res = await r2.client.send(new ListObjectsV2Command({ Bucket: r2.bucket, Prefix: prefix, ContinuationToken: token }));
    for (const obj of res.Contents || []) keys.push(obj.Key);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

/** Chaves do R2 pertencentes aos usuários: espaço privado + espaços compartilhados em que participam. */
async function collectR2Keys(r2, ids) {
  const keys = new Set();
  for (const id of ids) {
    for (const k of await listKeys(r2, `vault/${id}/`)) keys.add(k);
    for (const k of await listKeys(r2, `vault/shared/${id}/`)) keys.add(k); // id como agência
  }
  // id como modelo: vault/shared/<agencyId>/<modelId>/...
  for (const k of await listKeys(r2, 'vault/shared/')) {
    if (ids.includes(k.split('/')[3])) keys.add(k);
  }
  return [...keys];
}

async function deleteR2Keys(r2, keys) {
  let deleted = 0;
  for (let i = 0; i < keys.length; i += 1000) {
    const batch = keys.slice(i, i + 1000);
    const res = await r2.client.send(new DeleteObjectsCommand({
      Bucket: r2.bucket,
      Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
    }));
    deleted += batch.length - (res.Errors?.length || 0);
    for (const e of res.Errors || []) console.error(`   ⚠️  R2: falha ao apagar ${e.Key}: ${e.Message}`);
  }
  return deleted;
}

async function run() {
  console.log('🧹 ═══════════════════════════════════════════════════════════════');
  console.log(`🧹 LUMIARDI — ELIMINAÇÃO DE CONTAS DE TESTE ${EXECUTE ? '(EXECUÇÃO REAL)' : '(SIMULAÇÃO)'}`);
  console.log('🧹 ═══════════════════════════════════════════════════════════════\n');
  console.log(`🔌 Banco: ${connectionString.replace(/:[^:@]+@/, ':****@').replace(/^.*@/, '')}\n`);

  const client = await pool.connect();
  const summary = [];
  let r2Keys = [];
  const r2 = getR2();

  try {
    const usersRes = await client.query(
      'SELECT id, email, role, curation_status FROM users WHERE LOWER(email) = ANY($1)',
      [TEST_EMAILS]
    );
    const ids = usersRes.rows.map((r) => r.id);
    const emails = TEST_EMAILS;

    console.log('👤 Contas encontradas:');
    if (usersRes.rows.length) console.table(usersRes.rows);
    const missing = emails.filter((e) => !usersRes.rows.some((r) => r.email.toLowerCase() === e));
    if (missing.length) console.log(`   (não encontradas em public.users: ${missing.join(', ')})`);

    if (r2) {
      r2Keys = await collectR2Keys(r2, ids);
    } else {
      console.log('⚠️  Credenciais do R2 ausentes: arquivos do storage NÃO serão verificados.');
    }

    // Padrão que identifica os usuários dentro de chaves/IDs compostos (ex.: conversation_id "dm:a:b", rate_limits "login:email")
    const idPattern = [...ids, ...emails].map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') || '^$';

    await client.query('BEGIN');

    const step = async (label, sql, params) => {
      const res = await client.query(sql, params);
      summary.push({ tabela: label, registros: res.rowCount });
    };

    // 1. Tabelas sem FK para users (precisam de limpeza explícita)
    await step('messages', `DELETE FROM messages WHERE sender_id = ANY($1) OR receiver_id = ANY($1) OR conversation_id ~ $2`, [ids, idPattern]);
    await step('chat_conversations', `DELETE FROM chat_conversations WHERE model_id = ANY($1) OR agency_id = ANY($1)`, [ids]);
    await step('application_notes', `DELETE FROM application_notes WHERE user_id = ANY($1)`, [ids]);
    await step('curation_audit_logs', `DELETE FROM curation_audit_logs WHERE target_id = ANY($1) OR user_id = ANY($1) OR details::text ~ $2`, [ids, idPattern]);
    await step('payment_transactions', `DELETE FROM payment_transactions WHERE user_id = ANY($1)`, [ids]);
    await step('meet_signals', `DELETE FROM meet_signals WHERE sender_id = ANY($1) OR target_id = ANY($1)`, [ids]);
    await step('meet_participants', `DELETE FROM meet_participants WHERE participant_id = ANY($1)`, [ids]);
    await step('meet_rooms', `DELETE FROM meet_rooms WHERE host_id = ANY($1)`, [ids]);
    await step('rate_limits', `DELETE FROM rate_limits WHERE key ~ $1`, [idPattern]);
    await step('contact_inquiries', `DELETE FROM contact_inquiries WHERE LOWER(email) = ANY($1)`, [emails]);
    await step('compliance_reports', `DELETE FROM compliance_reports WHERE LOWER(reporter_email) = ANY($1)`, [emails]);
    await step('profiles.represented_agency_id (desvinculado)', `UPDATE profiles SET represented_agency_id = NULL, represented_agency_name = NULL, is_represented = FALSE WHERE represented_agency_id = ANY($1)`, [ids]);

    // 2. Contagem do que o CASCADE vai levar junto (para o relatório)
    const cascadeTables = [
      ['profiles', 'user_id'], ['curation_interviews', 'user_id'], ['notifications', 'user_id'],
      ['subscriptions', 'user_id'], ['invoices', 'user_id'], ['kanban_tasks', 'user_id'],
      ['drive_files', 'user_id'], ['terms_acceptances', 'user_id'],
    ];
    for (const [table, col] of cascadeTables) {
      const r = await client.query(`SELECT COUNT(*)::int AS n FROM ${table} WHERE ${col} = ANY($1)`, [ids]);
      summary.push({ tabela: `${table} (cascade)`, registros: r.rows[0].n });
    }
    for (const table of ['scout_proposals', 'agency_model_contracts', 'shared_drive_files']) {
      const r = await client.query(`SELECT COUNT(*)::int AS n FROM ${table} WHERE agency_id = ANY($1) OR model_id = ANY($1)`, [ids]);
      summary.push({ tabela: `${table} (cascade)`, registros: r.rows[0].n });
    }
    const p = await client.query(`SELECT COUNT(*)::int AS n FROM payouts WHERE creator_id = ANY($1) OR recipient_id = ANY($1)`, [ids]);
    summary.push({ tabela: 'payouts (cascade)', registros: p.rows[0].n });

    // 3. Usuário principal (dispara o ON DELETE CASCADE)
    await step('users', `DELETE FROM users WHERE id = ANY($1)`, [ids]);

    // 4. Supabase Auth (a plataforma usa autenticação própria, mas garante que não sobra nada)
    try {
      await client.query('SAVEPOINT auth_users');
      await step('auth.users', `DELETE FROM auth.users WHERE LOWER(email) = ANY($1)`, [emails]);
    } catch (err) {
      await client.query('ROLLBACK TO SAVEPOINT auth_users');
      summary.push({ tabela: 'auth.users', registros: `ignorado (${err.message})` });
    }

    // 5. Verificação: nenhum resto pode sobrar dentro da transação
    const leftover = await client.query(`SELECT COUNT(*)::int AS n FROM users WHERE LOWER(email) = ANY($1)`, [emails]);
    if (leftover.rows[0].n !== 0) throw new Error('Usuários ainda presentes após o DELETE — abortando.');

    if (EXECUTE) {
      await client.query('COMMIT');
    } else {
      await client.query('ROLLBACK');
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('❌ Erro — transação revertida, nada foi apagado:', err.message);
    process.exitCode = 1;
    return;
  } finally {
    client.release();
    await pool.end();
  }

  // 6. Storage (somente após o COMMIT do banco)
  let r2Deleted = 0;
  if (EXECUTE && r2 && r2Keys.length) {
    r2Deleted = await deleteR2Keys(r2, r2Keys);
  }
  summary.push({
    tabela: 'Cloudflare R2 (arquivos)',
    registros: EXECUTE ? `${r2Deleted}/${r2Keys.length}` : r2Keys.length,
  });

  console.log(`\n📋 RESUMO ${EXECUTE ? 'DA ELIMINAÇÃO' : 'DA SIMULAÇÃO (nada foi apagado)'}:`);
  console.table(summary);
  if (r2Keys.length) {
    console.log('🗂️  Arquivos do storage:');
    for (const k of r2Keys) console.log(`   - ${k}`);
  }
  console.log(EXECUTE
    ? '\n✅ Contas de teste eliminadas definitivamente (transação confirmada).'
    : '\nℹ️  Simulação concluída. Rode com --execute para apagar de verdade.');
}

run();
