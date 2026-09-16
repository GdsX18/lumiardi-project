/**
 * LUMIARDI — SCRIPT CLI PARA CRIAÇÃO / ATUALIZAÇÃO DE ADMINISTRADOR
 * 
 * Uso:
 *   node scripts/create-admin.js <email> <senha> [nome_completo] [cargo_rbac]
 * 
 * Exemplo:
 *   node scripts/create-admin.js "admin@lumiardi.com" "MinhaSenhaForte2026!" "Administrador Executivo" "admin"
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

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
👑 LUMIARDI — GERENCIADOR CLI DE ADMINISTRADORES
Uso:
  node scripts/create-admin.js <email> <senha> [nome_completo] [cargo_rbac]

Exemplos:
  node scripts/create-admin.js "admin@lumiardi.com" "MinhaSenhaForte2026!"
  node scripts/create-admin.js "gestor@lumiardi.com" "SenhaSegura123!" "Gestor Geral" "admin"
  node scripts/create-admin.js "curador@lumiardi.com" "SenhaSegura123!" "Curador Sênior" "curador_senior"

Cargos RBAC válidos:
  - admin (Acesso total)
  - supervisor (Supervisão operacional)
  - curador_senior (Aprovação e reprovação de cadastros)
  - curador_junior (Triagem e análise preliminar)
  `);
  process.exit(0);
}

const email = process.argv[2] || 'admin@lumiardi.com';
const password = process.argv[3] || 'lumiardi2026';
const fullName = process.argv[4] || 'Administrador Lumiardi';
const rbacRole = process.argv[5] || 'admin'; // 'admin', 'supervisor', 'curador_senior', 'curador_junior'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/lumiardi_db';

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10000,
});

async function createAdmin() {
  console.log('👑 ═══════════════════════════════════════════════════════════════');
  console.log('👑 LUMIARDI — GERENCIADOR CLI DE ADMINISTRADORES (PRODUÇÃO)');
  console.log('👑 ═══════════════════════════════════════════════════════════════\n');

  console.log(`👤 E-mail:     ${email}`);
  console.log(`📛 Nome:       ${fullName}`);
  console.log(`🛡️ Cargo RBAC: ${rbacRole}`);
  console.log(`🔌 Conectando a: ${connectionString.replace(/:[^:@]+@/, ':****@')}\n`);

  let client;
  try {
    client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL!');

    console.log('🔐 Gerando hash bcrypt seguro (salt 10)...');
    const hash = await bcrypt.hash(password, 10);

    const userId = `admin-${Date.now().toString(36)}`;
    const curId = `cur-${Date.now().toString(36)}`;

    // 1. Tabela users (Autenticação do Sistema)
    await client.query(`
      INSERT INTO users (id, email, password_hash, role, curation_status, full_name, updated_at)
      VALUES ($1, $2, $3, 'ADMIN', 'APROVADO', $4, NOW())
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = 'ADMIN',
        curation_status = 'APROVADO',
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    `, [userId, email.toLowerCase().trim(), hash, fullName]);

    // 2. Tabela admin_users (Equipe de Curadoria & RBAC)
    await client.query(`
      INSERT INTO admin_users (id, email, password_hash, full_name, role, status, updated_at)
      VALUES ($1, $2, $3, $4, $5, 'active', NOW())
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        status = 'active',
        updated_at = NOW();
    `, [curId, email.toLowerCase().trim(), hash, fullName, rbacRole]);

    console.log('\n🎉 SUCESSO ABSOLUTO!');
    console.log(`✅ Administrador '${email}' criado/atualizado com sucesso no banco de dados.`);
    console.log(`🔑 Login liberado imediatamente na rota /admin/login com a senha fornecida.\n`);
  } catch (err) {
    console.error('❌ Erro ao criar administrador no banco:', err.message);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

createAdmin();
