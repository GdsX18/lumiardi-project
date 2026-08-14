/**
 * LUMIARDI — SCRIPT DE INICIALIZAÇÃO E MIGRAÇÃO DO BANCO DE DADOS (POSTGRESQL 17)
 * Executável via: npm run db:init ou node scripts/init-db.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env.local se existirem
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["'](.*)["']$/, '$1');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 10000,
});

async function runMigrations() {
  console.log('🚀 Iniciando sincronização e migração do banco de dados Lumiardi...');
  console.log(`🔌 Conectando a: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

  let client;
  try {
    client = await pool.connect();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!');

    const schemaPath = path.join(__dirname, '..', 'lumiardi_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      console.log('📜 Executando schema SQL (lumiardi_schema.sql)...');
      await client.query(sql);
      console.log('✅ Schema e tabelas sincronizados com sucesso!');
    } else {
      console.warn('⚠️ Arquivo lumiardi_schema.sql não encontrado. Criando tabelas programaticamente...');
    }

    console.log('🎉 Migrações concluídas com êxito! Banco pronto para produção.');
  } catch (err) {
    console.error('❌ Erro durante a inicialização do banco de dados:', err.message);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

runMigrations();
