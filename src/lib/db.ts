import { Pool } from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.error('[DB] DATABASE_URL não está definido em produção.');
}
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

declare global {
  var __pgPool: Pool | undefined;
}

const isSupabase = connectionString.includes('supabase.com') || connectionString.includes('pooler.supabase.com');

export const pool = globalThis.__pgPool || new Pool({
  connectionString,
  // Com DATABASE_CA_CERT (CA do Supabase, PEM) o certificado do servidor é verificado.
  ssl: isSupabase
    ? process.env.DATABASE_CA_CERT
      ? { ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, '\n'), rejectUnauthorized: true }
      : { rejectUnauthorized: false }
    : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__pgPool = pool;
}

// Memória resiliente instantânea com suporte completo a pagamentos, assinaturas, RBAC, Audit Logs e Drive Compartilhado
export const fallbackStore = {
  users: new Map<string, Record<string, unknown>>(),
  profiles: new Map<string, Record<string, unknown>>(),
  kanban_tasks: new Map<string, Record<string, unknown>>(),
  messages: new Map<string, Record<string, unknown>>(),
  drive_files: new Map<string, Record<string, unknown>>(),
  shared_drive_files: new Map<string, Record<string, unknown>>(),
  agency_model_contracts: new Map<string, Record<string, unknown>>(),
  scout_proposals: new Map<string, Record<string, unknown>>(),
  admin_users: new Map<string, Record<string, unknown>>(),
  curation_audit_logs: new Map<string, Record<string, unknown>>(),
  subscriptions: new Map<string, Record<string, unknown>>(),
  payment_transactions: new Map<string, Record<string, unknown>>(),
  invoices: new Map<string, Record<string, unknown>>(),
  payouts: new Map<string, Record<string, unknown>>(),
  application_notes: new Map<string, Record<string, unknown>[]>(),
  notifications: new Map<string, Record<string, unknown>>(),
  meet_rooms: new Map<string, Record<string, unknown>>(),
  meet_participants: new Map<string, Record<string, unknown>>(),
  meet_signals: new Map<string, Record<string, unknown>>(),
  curation_interviews: new Map<string, Record<string, unknown>>(),
  coupons: new Map<string, Record<string, unknown>>(),
  contact_inquiries: new Map<string, Record<string, unknown>>(),
  compliance_reports: new Map<string, Record<string, unknown>>(),
};

// Nenhum dado é semeado em memória: contas, cupons e cadastros existem apenas no PostgreSQL.

let isInitialized = false;
let initPromise: Promise<boolean> | null = null;

/**
 * Inicialização DDL automática do banco de dados PostgreSQL com tabelas financeiras, RBAC, Audit e Drive Compartilhado
 */
export async function initDatabase(): Promise<boolean> {
  if (isInitialized) return true;
  // Evita DDL concorrente quando várias requisições chegam no cold start
  if (!initPromise) {
    initPromise = runInitDatabase().finally(() => {
      initPromise = null;
    });
  }
  return initPromise;
}

async function runInitDatabase(): Promise<boolean> {
  if (isInitialized) return true;

  try {
    const client = await pool.connect();
    try {
      // 1. Tabela USERS
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL,
          curation_status VARCHAR(20) NOT NULL DEFAULT 'EM_CURATORIA',
          full_name VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          document_type VARCHAR(100),
          document_name VARCHAR(255),
          document_url VARCHAR(255),
          rejection_reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS interview_date DATE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS interview_time VARCHAR(10);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS interview_scheduled_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS interview_approved_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS interview_rejection_reason TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_billing_interval VARCHAR(20);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_selfie_url TEXT;
        -- VARCHAR(255) estourava com URLs longas do vault (erro 22001 no cadastro)
        ALTER TABLE users ALTER COLUMN document_url TYPE TEXT;
        -- 2FA TOTP: segredo cifrado (AES-256-GCM, ver lib/security/twoFactor.ts)
        ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;
        CREATE INDEX IF NOT EXISTS idx_users_last_seen_at ON users(last_seen_at);

        -- Tabela CURATION_INTERVIEWS (Entrevista de Curadoria Prévia Obrigatória)
        CREATE TABLE IF NOT EXISTS curation_interviews (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          full_name VARCHAR(255) NOT NULL,
          artistic_name VARCHAR(255),
          email VARCHAR(255) NOT NULL,
          whatsapp VARCHAR(50) NOT NULL,
          plan_id VARCHAR(50) NOT NULL,
          billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly',
          interview_date DATE NOT NULL,
          interview_time VARCHAR(10) NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'aguardando_reuniao',
          rejection_reason TEXT,
          approved_by VARCHAR(100),
          approved_at TIMESTAMP WITH TIME ZONE,
          rejected_by VARCHAR(100),
          rejected_at TIMESTAMP WITH TIME ZONE,
          notes TEXT,
          photo_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_curation_interviews_user ON curation_interviews(user_id);
        CREATE INDEX IF NOT EXISTS idx_curation_interviews_status ON curation_interviews(status);
        CREATE INDEX IF NOT EXISTS idx_curation_interviews_date ON curation_interviews(interview_date, interview_time);
        ALTER TABLE curation_interviews ADD COLUMN IF NOT EXISTS candidate_id VARCHAR(100);
        CREATE INDEX IF NOT EXISTS idx_curation_interviews_candidate ON curation_interviews(candidate_id);
      `);

      // 2. Tabela PROFILES
      await client.query(`
        CREATE TABLE IF NOT EXISTS profiles (
          user_id VARCHAR(100) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          artistic_name VARCHAR(255),
          corporate_name VARCHAR(255),
          responsible_name VARCHAR(255),
          category VARCHAR(100),
          instagram VARCHAR(100),
          gender VARCHAR(50),
          birth_date VARCHAR(50),
          document_number VARCHAR(100),
          cnpj VARCHAR(100),
          bio TEXT,
          hobbies TEXT,
          exposure_opinion TEXT,
          measurements JSONB,
          physiognomy JSONB,
          address JSONB,
          photos JSONB,
          avatar_url TEXT,
          logo_url TEXT,
          video_url VARCHAR(255),
          monthly_revenue_estimate VARCHAR(100),
          commission_rate VARCHAR(50),
          specialties JSONB,
          accepts_offers BOOLEAN DEFAULT TRUE,
          is_represented BOOLEAN DEFAULT FALSE,
          represented_agency_name VARCHAR(255),
          represented_agency_id VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
      `);

      // 3. Tabela KANBAN_TASKS
      await client.query(`
        CREATE TABLE IF NOT EXISTS kanban_tasks (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          agency_name VARCHAR(255),
          column_status VARCHAR(20) NOT NULL DEFAULT 'todo',
          priority VARCHAR(20) DEFAULT 'Normal',
          due_date VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 4. Tabela MESSAGES
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(100) PRIMARY KEY,
          sender_id VARCHAR(100) NOT NULL,
          sender_name VARCHAR(255),
          sender_role VARCHAR(50),
          receiver_id VARCHAR(100),
          conversation_id VARCHAR(100) NOT NULL,
          text TEXT NOT NULL,
          attachment_url TEXT,
          attachment_name VARCHAR(255),
          attachment_type VARCHAR(255),
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Migração: MIMEs longos (ex.: .docx = 73 caracteres) estouravam VARCHAR(50) e o INSERT falhava
      await client.query(`
        ALTER TABLE messages ALTER COLUMN attachment_type TYPE VARCHAR(255);
        ALTER TABLE messages ALTER COLUMN attachment_name TYPE VARCHAR(255);
        ALTER TABLE messages ALTER COLUMN sender_name TYPE VARCHAR(255);
      `);

      // 5. Tabela DRIVE_FILES (Privado)
      await client.query(`
        CREATE TABLE IF NOT EXISTS drive_files (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'raw-photos',
          type VARCHAR(50) NOT NULL DEFAULT 'image',
          size VARCHAR(50) NOT NULL DEFAULT '0 MB',
          uploaded_by VARCHAR(255) NOT NULL,
          file_url TEXT NOT NULL,
          downloads INTEGER DEFAULT 0,
          privacy VARCHAR(50) DEFAULT 'agency-only',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 6. Tabela SHARED_DRIVE_FILES (Drive Compartilhado Modelo ↔ Agência)
      await client.query(`
        CREATE TABLE IF NOT EXISTS shared_drive_files (
          id VARCHAR(100) PRIMARY KEY,
          agency_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          model_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'raw-photos',
          type VARCHAR(50) NOT NULL DEFAULT 'image',
          size VARCHAR(50) NOT NULL DEFAULT '0 MB',
          uploaded_by_id VARCHAR(100) NOT NULL,
          uploaded_by_name VARCHAR(255) NOT NULL,
          file_url TEXT NOT NULL,
          downloads INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 7. Tabela AGENCY_MODEL_CONTRACTS
      await client.query(`
        CREATE TABLE IF NOT EXISTS agency_model_contracts (
          id VARCHAR(100) PRIMARY KEY,
          agency_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          model_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          agency_name VARCHAR(255) NOT NULL,
          model_name VARCHAR(255) NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'active',
          commission_rate VARCHAR(50) DEFAULT '20%',
          start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          end_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 8. Tabela SCOUT_PROPOSALS
      await client.query(`
        CREATE TABLE IF NOT EXISTS scout_proposals (
          id VARCHAR(100) PRIMARY KEY,
          agency_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          model_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          agency_name VARCHAR(255) NOT NULL,
          model_name VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          proposed_commission VARCHAR(50) DEFAULT '20%',
          status VARCHAR(30) NOT NULL DEFAULT 'sent',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 9. Tabela ADMIN_USERS (RBAC Curadoria)
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id VARCHAR(100) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'curador_junior',
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 10. Tabela CURATION_AUDIT_LOGS
      await client.query(`
        CREATE TABLE IF NOT EXISTS curation_audit_logs (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          user_name VARCHAR(255) NOT NULL,
          user_email VARCHAR(255) NOT NULL,
          user_role VARCHAR(50) NOT NULL,
          action_type VARCHAR(100) NOT NULL,
          target_id VARCHAR(100),
          target_name VARCHAR(255),
          target_type VARCHAR(50),
          details JSONB,
          ip_address VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 11. Tabela SUBSCRIPTIONS
      await client.query(`
        CREATE TABLE IF NOT EXISTS subscriptions (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          gateway VARCHAR(30) NOT NULL,
          gateway_subscription_id VARCHAR(150),
          gateway_customer_id VARCHAR(150),
          plan_id VARCHAR(50) NOT NULL,
          plan_category VARCHAR(50) NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'active',
          billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly',
          amount NUMERIC(10,2) NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
          current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
          cancel_at_period_end BOOLEAN DEFAULT FALSE,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 12. Tabela PAYMENT_TRANSACTIONS
      await client.query(`
        CREATE TABLE IF NOT EXISTS payment_transactions (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
          subscription_id VARCHAR(100),
          gateway VARCHAR(30) NOT NULL,
          gateway_transaction_id VARCHAR(150) NOT NULL,
          amount NUMERIC(10,2) NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'USD',
          status VARCHAR(30) NOT NULL,
          payment_method VARCHAR(50) NOT NULL,
          crypto_address VARCHAR(150),
          crypto_amount NUMERIC(18,8),
          crypto_currency VARCHAR(30),
          raw_payload JSONB,
          idempotency_key VARCHAR(150) UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 13. Tabela INVOICES
      await client.query(`
        CREATE TABLE IF NOT EXISTS invoices (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          subscription_id VARCHAR(100),
          invoice_number VARCHAR(100) UNIQUE NOT NULL,
          amount NUMERIC(10,2) NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
          status VARCHAR(30) NOT NULL DEFAULT 'paid',
          billing_reason TEXT NOT NULL,
          due_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          receipt_number VARCHAR(100),
          pdf_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Migrações automáticas de colunas para tabelas financeiras existentes
      await client.query(`
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_interval VARCHAR(20) DEFAULT 'monthly';
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_category VARCHAR(50) DEFAULT 'criadoras';
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days';
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS metadata JSONB;
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) DEFAULT 0;
        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'BRL';

        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100);
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'BRL';
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_reason TEXT DEFAULT 'Assinatura';
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gateway VARCHAR(30);
        ALTER TABLE invoices ALTER COLUMN gateway DROP NOT NULL;

        ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255);
        ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_role VARCHAR(50);

        -- Índice de performance para polling incremental por timestamp
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);
        CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON messages(conversation_id, created_at ASC);

        -- (Mensagens de usuárias nunca são apagadas na inicialização: a purga antiga por texto
        --  — 'oi', 'dw'… — removia mensagens reais a cada cold start.)

        -- Migrações e higienização do Lumiardi Drive
        ALTER TABLE drive_files ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE;
        DELETE FROM drive_files WHERE name IN (
          'Manual_de_Compliance_e_Diretrizes_Lumiardi.pdf',
          'Modelo_Padrao_NDA_Blindagem_de_Imagem.pdf'
        );
        DELETE FROM shared_drive_files WHERE name IN (
          'Contrato_Agenciamento_Exclusivo_2026.pdf',
          'Composto_Digital_Alta_Moda_SS26.pdf',
          'Ensaio_Milan_Look01_RAW_Master.jpg'
        );
      `);

      // 14. Tabela PAYOUTS
      await client.query(`
        CREATE TABLE IF NOT EXISTS payouts (
          id VARCHAR(100) PRIMARY KEY,
          creator_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          agency_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
          amount NUMERIC(10,2) NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
          status VARCHAR(30) NOT NULL DEFAULT 'pending',
          payout_method VARCHAR(50) NOT NULL,
          gateway_reference VARCHAR(150),
          description TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          paid_at TIMESTAMP WITH TIME ZONE
        );
      `);

      // Migração: bancos criados por versões antigas do schema não têm creator_id/agency_id
      // em payouts (CREATE TABLE IF NOT EXISTS não adiciona colunas a tabelas existentes).
      await client.query(`
        ALTER TABLE payouts ADD COLUMN IF NOT EXISTS creator_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE;
        ALTER TABLE payouts ADD COLUMN IF NOT EXISTS agency_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL;
      `);

      // 15. Tabela de NOTIFICATIONS
      await client.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(100) DEFAULT 'Geral',
          type VARCHAR(50) DEFAULT 'info',
          link VARCHAR(255),
          link_text VARCHAR(100),
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS terms_acceptances (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          terms_version VARCHAR(50) NOT NULL,
          accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          client_ip VARCHAR(45),
          user_agent TEXT,
          UNIQUE(user_id, terms_version)
        );
        CREATE INDEX IF NOT EXISTS idx_terms_acceptances_user_id
          ON terms_acceptances(user_id);
      `);

      // 16. Índices de Alta Performance
      // Cada índice roda isolado: uma tabela legada sem a coluna esperada (ex.: 42703) gera aviso
      // mas não derruba a inicialização nem a criação das demais tabelas.
      const performanceIndexes: string[] = [
        `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
        `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`,
        `CREATE INDEX IF NOT EXISTS idx_users_curation_status ON users(curation_status);`,
        `CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);`,
        `CREATE INDEX IF NOT EXISTS idx_kanban_tasks_user_id ON kanban_tasks(user_id);`,
        `CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);`,
        `CREATE INDEX IF NOT EXISTS idx_drive_files_user_id ON drive_files(user_id);`,
        `CREATE INDEX IF NOT EXISTS idx_shared_drive_files_rel ON shared_drive_files(agency_id, model_id);`,
        `CREATE INDEX IF NOT EXISTS idx_agency_contracts ON agency_model_contracts(agency_id, model_id);`,
        `CREATE INDEX IF NOT EXISTS idx_curation_audit_logs_time ON curation_audit_logs(created_at DESC);`,
        `CREATE INDEX IF NOT EXISTS idx_curation_audit_logs_action ON curation_audit_logs(action_type);`,
        `CREATE INDEX IF NOT EXISTS idx_curation_audit_logs_user ON curation_audit_logs(user_id);`,
        `CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);`,
        `CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);`,
        `CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);`,
        `CREATE INDEX IF NOT EXISTS idx_payment_transactions_idemp ON payment_transactions(idempotency_key);`,
        `CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);`,
        `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);`,
        `CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;`,
        `CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);`,
        `CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);`,
        `CREATE INDEX IF NOT EXISTS idx_messages_conv_created_asc ON messages(conversation_id, created_at ASC);`,
        `CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);`,
        `CREATE INDEX IF NOT EXISTS idx_messages_curation_sender ON messages(conversation_id, sender_id, receiver_id);`,
        `CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen_at DESC NULLS LAST);`,
        `DO $$ BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = current_schema() AND table_name = 'payouts' AND column_name = 'creator_id'
          ) THEN
            CREATE INDEX IF NOT EXISTS idx_payouts_creator_id ON payouts(creator_id);
          END IF;
        END $$;`,
      ];
      for (const indexSql of performanceIndexes) {
        try {
          await client.query(indexSql);
        } catch (idxErr) {
          console.warn('[DB] Índice ignorado:', (idxErr as Error).message);
        }
      }

      await client.query(`
        -- 17. Tabelas Lumiardi Meet (WebRTC & Sinalização Multi-Nó Persistente)
        CREATE TABLE IF NOT EXISTS meet_rooms (
          id VARCHAR(100) PRIMARY KEY,
          passcode VARCHAR(50),
          host_id VARCHAR(100) NOT NULL,
          host_name VARCHAR(255) NOT NULL,
          provider VARCHAR(50) DEFAULT 'webrtc_native',
          daily_room_url TEXT,
          daily_token TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS meet_participants (
          room_id VARCHAR(100) NOT NULL,
          participant_id VARCHAR(100) NOT NULL,
          participant_name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'caller',
          user_role VARCHAR(50) NOT NULL DEFAULT 'model',
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          PRIMARY KEY (room_id, participant_id)
        );
        CREATE INDEX IF NOT EXISTS idx_meet_part_room ON meet_participants(room_id);
        CREATE INDEX IF NOT EXISTS idx_meet_part_last_seen ON meet_participants(last_seen_at DESC);

        CREATE TABLE IF NOT EXISTS meet_signals (
          id VARCHAR(100) PRIMARY KEY,
          room_id VARCHAR(100) NOT NULL,
          sender_id VARCHAR(100) NOT NULL,
          target_id VARCHAR(100),
          type VARCHAR(50) NOT NULL,
          data JSONB NOT NULL,
          consumed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_meet_signals_room_target ON meet_signals(room_id, target_id, consumed);
        CREATE INDEX IF NOT EXISTS idx_meet_signals_created ON meet_signals(created_at ASC);
      `);

      // ─── Identidade da Mesa de Curadoria no chat (idempotente) ────────────────
      // A linha em `users` só representa a curadoria nas conversas; a senha é aleatória e
      // inutilizável. Login administrativo acontece exclusivamente via `admin_users`
      // (crie contas com `npm run admin:create`).
      const unusableHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      await client.query(`
        INSERT INTO users (id, email, password_hash, role, curation_status, full_name, document_name)
        VALUES ('admin-curadoria-1', 'curadoria@lumiardi.com', $1, 'ADMIN', 'APROVADO', 'Mesa de Curadoria Lumiardi', NULL)
        ON CONFLICT DO NOTHING;
      `, [unusableHash]);

      // ─── Notas internas da Curadoria ───────────────────────────────────────
      await client.query(`
        CREATE TABLE IF NOT EXISTS application_notes (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          author VARCHAR(255) NOT NULL,
          text TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_application_notes_user ON application_notes(user_id, created_at DESC);
      `);

      // ─── Idempotência de webhooks (claim atômico por evento) ─────────────────
      await client.query(`
        CREATE TABLE IF NOT EXISTS webhook_events (
          id TEXT PRIMARY KEY,
          provider TEXT NOT NULL,
          received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      // ─── Rate limiting persistente (login, cupons, formulários) ──────────────
      await client.query(`
        CREATE TABLE IF NOT EXISTS rate_limits (
          key TEXT PRIMARY KEY,
          hits INTEGER NOT NULL DEFAULT 0,
          window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);
      `);

      // ─── 18. Tabela COUPONS (Sistema de Descontos & Promoções) ───────────────────
      await client.query(`
        CREATE TABLE IF NOT EXISTS coupons (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          code TEXT UNIQUE NOT NULL,
          discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
          discount_value NUMERIC NOT NULL,
          active BOOLEAN DEFAULT true,
          max_uses INTEGER DEFAULT NULL,
          times_used INTEGER DEFAULT 0,
          expires_at TIMESTAMPTZ DEFAULT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
        CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);

        -- Seed do Cupom Modelo Oficial LUMIARDI10 (10% de desconto)
        INSERT INTO coupons (id, code, discount_type, discount_value, active, max_uses, times_used, expires_at)
        VALUES ('coupon-lumiardi10', 'LUMIARDI10', 'percentage', 10, true, NULL, 0, NULL)
        ON CONFLICT (code) DO NOTHING;
      `);

      // ─── 19. Tabelas CONTACT_INQUIRIES e COMPLIANCE_REPORTS ───────────────────
      await client.query(`
        CREATE TABLE IF NOT EXISTS contact_inquiries (
          id              VARCHAR(100) PRIMARY KEY,
          contact_type    VARCHAR(100) NOT NULL,
          full_name       VARCHAR(255) NOT NULL,
          email           VARCHAR(255) NOT NULL,
          subject         VARCHAR(300) NOT NULL,
          message         TEXT NOT NULL,
          ip_address      VARCHAR(100),
          user_agent      TEXT,
          email_sent      BOOLEAN DEFAULT FALSE,
          email_sent_at   TIMESTAMP WITH TIME ZONE,
          created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON contact_inquiries(email);
        CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created ON contact_inquiries(created_at DESC);

        CREATE TABLE IF NOT EXISTS compliance_reports (
          id                   VARCHAR(100) PRIMARY KEY,
          protocol_number      VARCHAR(50) UNIQUE NOT NULL,
          category             VARCHAR(100) NOT NULL,
          priority             VARCHAR(30) NOT NULL,
          reporter_name        VARCHAR(255) NOT NULL,
          reporter_email       VARCHAR(255) NOT NULL,
          reporter_phone       VARCHAR(50),
          reporter_relation    VARCHAR(50) NOT NULL,
          target_url           TEXT NOT NULL,
          target_username      VARCHAR(200),
          approx_date          VARCHAR(100),
          description          TEXT NOT NULL,
          judicial_body        VARCHAR(300),
          process_number       VARCHAR(100),
          authority_name       VARCHAR(200),
          judicial_deadline    VARCHAR(100),
          declaration_accepted BOOLEAN NOT NULL DEFAULT TRUE,
          ip_address           VARCHAR(100),
          user_agent           TEXT,
          email_sent           BOOLEAN DEFAULT FALSE,
          email_sent_at        TIMESTAMP WITH TIME ZONE,
          status               VARCHAR(50) NOT NULL DEFAULT 'received',
          created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_compliance_reports_protocol ON compliance_reports(protocol_number);
        CREATE INDEX IF NOT EXISTS idx_compliance_reports_category ON compliance_reports(category);
        CREATE INDEX IF NOT EXISTS idx_compliance_reports_status ON compliance_reports(status);
        CREATE INDEX IF NOT EXISTS idx_compliance_reports_created ON compliance_reports(created_at DESC);
      `);

      isInitialized = true;
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[DB] Erro ao conectar/inicializar banco de dados PostgreSQL:', err);
    return false;
  }
}
