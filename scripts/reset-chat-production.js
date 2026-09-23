/**
 * LUMIARDI — SCRIPT DE RESET E HIGIENIZAÇÃO DE PRODUÇÃO
 * 
 * 1. Purga definitiva de contas administrativas fictícias do RBAC
 * 2. Criação dos índices dedicados de performance no PostgreSQL
 * 3. Limpeza total de mensagens residuais de teste
 * 4. Inicialização do canal de Curadoria com mensagem oficial única
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERRO: Nenhuma URL de banco de dados (DATABASE_URL ou DIRECT_URL) encontrada.');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runReset() {
  const client = await pool.connect();
  try {
    console.log('⚡ Conectado ao PostgreSQL Oficial (Supabase)...');

    // 1. Criação de índices de alta performance
    console.log('📦 Aplicando índices SQL para otimização do chat...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
      CREATE INDEX IF NOT EXISTS idx_agency_contracts ON agency_model_contracts(agency_id, model_id);
    `);
    console.log('✅ Índices criados/validados com sucesso.');

    // 2. Purga definitiva de contas fictícias
    console.log('🧹 Purgando contas fictícias do painel RBAC e tabela users...');
    const deletedAdmin = await client.query(`
      DELETE FROM admin_users WHERE email IN (
        'admin@lumiardi.com',
        'supervisor@lumiardi.com',
        'curador.senior@lumiardi.com',
        'curador.junior@lumiardi.com'
      ) RETURNING email;
    `);
    console.log(`✅ Contas excluídas de admin_users: ${deletedAdmin.rows.map(r => r.email).join(', ') || 'Nenhuma pendente'}`);

    const deletedUsers = await client.query(`
      DELETE FROM users WHERE email IN (
        'admin@lumiardi.com',
        'candidata.teste@lumiardi.com',
        'valentina.rossi@lumiardi.com',
        'candidatura.pendente42@gmail.com',
        'contato@elitemanagement.com.br',
        'casting@agenciaglobalfake.net',
        'supervisor@lumiardi.com',
        'curador.senior@lumiardi.com',
        'curador.junior@lumiardi.com'
      ) RETURNING email;
    `);
    console.log(`✅ Contas excluídas de users: ${deletedUsers.rows.map(r => r.email).join(', ') || 'Nenhuma pendente'}`);

    // 3. Garantir que curadoria@lumiardi.com seja o único Master Root
    const hash = await bcrypt.hash('lumiardi2026', 10);
    await client.query(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, status)
      VALUES ('cur-admin-1', 'curadoria@lumiardi.com', $1, 'Mesa de Curadoria Lumiardi', 'admin', 'active')
      ON CONFLICT (email) DO UPDATE SET
        role = 'admin',
        status = 'active',
        full_name = 'Mesa de Curadoria Lumiardi';
    `, [hash]);

    await client.query(`
      INSERT INTO users (id, email, password_hash, role, curation_status, full_name)
      VALUES ('admin-curadoria-1', 'curadoria@lumiardi.com', $1, 'ADMIN', 'APROVADO', 'Mesa de Curadoria Lumiardi')
      ON CONFLICT (email) DO UPDATE SET
        role = 'ADMIN',
        curation_status = 'APROVADO',
        full_name = 'Mesa de Curadoria Lumiardi';
    `, [hash]);
    console.log('👑 Conta Master Root "curadoria@lumiardi.com" consolidada como única administradora.');

    // 4. Limpeza total de mensagens residuais de teste
    console.log('🧼 Higienizando tabela de mensagens (reset de produção)...');
    await client.query('DELETE FROM messages;');

    // 5. Inserção da mensagem de boas-vindas oficial da Curadoria
    await client.query(`
      INSERT INTO messages (id, sender_id, sender_name, sender_role, receiver_id, conversation_id, text, is_read, created_at)
      VALUES (
        'msg-welcome-official',
        'admin-curadoria-1',
        'Mesa de Curadoria Lumiardi',
        'curadoria',
        NULL,
        'curation',
        'Bem-vinda à plataforma Lumiardi! Seu acesso exclusivo está liberado e protegido por criptografia de ponta a ponta. Você pode utilizar este canal para tirar dúvidas com nossa equipe ou receber orientações da nossa curadoria.',
        TRUE,
        NOW()
      );
    `);
    console.log('💌 Mensagem oficial de boas-vindas da curadoria inserida com sucesso.');

    // 6. Auditoria final
    const finalAdmins = await client.query('SELECT id, email, full_name, role, status FROM admin_users');
    console.log('\n--- RELATÓRIO FINAL RBAC ---');
    console.table(finalAdmins.rows);

    const finalMessages = await client.query('SELECT id, sender_name, conversation_id, text, created_at FROM messages');
    console.log('\n--- RELATÓRIO FINAL MENSAGENS ---');
    console.table(finalMessages.rows);

    console.log(`\n🎉 Reset de produção concluído com êxito! Total membros curadoria: ${finalAdmins.rows.length}`);
  } catch (err) {
    console.error('❌ Erro no reset de produção:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runReset();

