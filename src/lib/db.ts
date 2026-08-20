import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

export const pool = new Pool({
  connectionString,
  max: 20, // Otimizado para concorrência
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000, // Timeout rápido resiliente
});

// Memória resiliente instantânea com suporte completo a pagamentos e assinaturas
export const fallbackStore = {
  users: new Map<string, Record<string, unknown>>(),
  profiles: new Map<string, Record<string, unknown>>(),
  kanban_tasks: new Map<string, Record<string, unknown>>(),
  messages: new Map<string, Record<string, unknown>>(),
  drive_files: new Map<string, Record<string, unknown>>(),
  subscriptions: new Map<string, Record<string, unknown>>(),
  payment_transactions: new Map<string, Record<string, unknown>>(),
  invoices: new Map<string, Record<string, unknown>>(),
  payouts: new Map<string, Record<string, unknown>>(),
  application_notes: new Map<string, Record<string, unknown>[]>(),
};

// Inicialização imediata síncrona/assíncrona do fallback
(async () => {
  const hashPassword = await bcrypt.hash('lumiardi2026', 10);

  const defaultUsers = [
    {
      id: 'admin-curadoria-1',
      email: 'curadoria@lumiardi.com',
      password_hash: hashPassword,
      role: 'ADMIN',
      curation_status: 'APROVADO',
      full_name: 'Mesa de Curadoria Lumiardi',
      created_at: new Date().toISOString(),
    },
    {
      id: 'user-admin-model',
      email: 'admin@lumiardi.com',
      password_hash: hashPassword,
      role: 'ADMIN',
      curation_status: 'APROVADO',
      full_name: 'Administrador Lumiardi',
      created_at: new Date().toISOString(),
    },
    {
      id: 'user-model-1',
      email: 'modelo@lumiardi.com',
      password_hash: hashPassword,
      role: 'MODELO',
      curation_status: 'APROVADO',
      full_name: 'Sua Conta Modelo',
      created_at: new Date().toISOString(),
    },
    {
      id: 'user-agency-1',
      email: 'agencia@lumiardi.com',
      password_hash: hashPassword,
      role: 'AGENCIA',
      curation_status: 'APROVADO',
      full_name: 'Sua Agência Corporativa',
      created_at: new Date().toISOString(),
    },
    {
      id: 'user-test-candidata',
      email: 'candidata.teste@lumiardi.com',
      password_hash: hashPassword,
      role: 'MODELO',
      curation_status: 'EM_CURATORIA',
      full_name: 'Isabella Montenegro (Candidata Teste)',
      phone: '+55 (11) 98765-4321',
      document_type: 'Passaporte Internacional / RG',
      document_name: 'passaporte_isabella_2257.pdf',
      created_at: new Date().toISOString(),
    },
  ];

  defaultUsers.forEach((u) => fallbackStore.users.set(u.email.toLowerCase(), u));

  fallbackStore.profiles.set('user-model-1', {
    user_id: 'user-model-1',
    artistic_name: 'Sua Conta Modelo',
    category: 'Modelo & Criadora VIP',
    instagram: '@suaconta',
    gender: 'Feminino',
    monthly_revenue_estimate: 'Sob Consulta',
    measurements: { height: '175', weight: '55', waist: '60', bust: '88', hips: '90' },
    physiognomy: { eyeColor: 'Castanhos', hairColor: 'Natural', skinTone: 'Clara', languages: ['Português', 'Inglês'] },
    address: { country: 'Brasil', state: 'SP', city: 'São Paulo' },
    photos: [],
    video_url: '',
    bio: '',
  });

  fallbackStore.profiles.set('user-test-candidata', {
    user_id: 'user-test-candidata',
    artistic_name: 'Isabella M.',
    category: 'Alta Moda & Criadora VIP',
    instagram: '@isabella.montenegro',
    gender: 'Feminino',
    document_number: 'MG-19.824.552',
    birth_date: '14/05/2001',
    monthly_revenue_estimate: 'Sob Consulta',
    measurements: { height: '178', weight: '56', waist: '61', bust: '89', hips: '91' },
    physiognomy: { eyeColor: 'Verdes', hairColor: 'Castanho Claro', skinTone: 'Clara', languages: ['Português', 'Inglês', 'Italiano'] },
    address: { country: 'Brasil', state: 'SP', city: 'São Paulo' },
    photos: [],
    video_url: '',
    bio: '',
  });

  fallbackStore.profiles.set('user-agency-1', {
    user_id: 'user-agency-1',
    corporate_name: 'Sua Agência Corporativa',
    responsible_name: 'Diretoria de Casting',
    category: 'Agência de Casting & Modelos',
    cnpj: '12.345.678/0001-90',
    instagram: '@suaagencia',
    address: { country: 'Brasil', state: 'SP', city: 'São Paulo' },
    specialties: ['Alta Moda', 'Editorial', 'Campanhas Digitais'],
    commission_rate: '20%',
  });

  // Kanban Tasks Iniciais
  const defaultTasks = [
    {
      id: 'task-1',
      user_id: 'user-model-1',
      title: 'Atualizar Fotos do Book e Ficha Técnica',
      agency_name: 'Lumiardi Onboarding',
      column_status: 'todo',
      priority: 'Alta',
      due_date: 'Hoje',
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-2',
      user_id: 'user-model-1',
      title: 'Definir Diretrizes e Limites de Imagem',
      agency_name: 'Lumiardi Compliance',
      column_status: 'inProgress',
      priority: 'Média',
      due_date: 'Esta semana',
      created_at: new Date().toISOString(),
    },
    {
      id: 'task-3',
      user_id: 'user-model-1',
      title: 'Auditoria Documental & Liberação de Credencial VIP',
      agency_name: 'Mesa de Curadoria',
      column_status: 'done',
      priority: 'Normal',
      due_date: 'Concluído',
      created_at: new Date().toISOString(),
    },
  ];
  defaultTasks.forEach((t) => fallbackStore.kanban_tasks.set(t.id, t));

  // Mensagens Iniciais
  const defaultMessages = [
    {
      id: 'msg-1',
      sender_id: 'admin-curadoria-1',
      receiver_id: 'user-model-1',
      conversation_id: 'curation',
      text: 'Bem-vinda à plataforma Lumiardi! Seu acesso exclusivo está liberado e protegido por criptografia de ponta a ponta. Você pode utilizar este canal para tirar dúvidas com nossa equipe ou receber propostas de agências parceiras.',
      attachment_url: null,
      attachment_name: null,
      attachment_type: null,
      is_read: true,
      created_at: new Date().toISOString(),
    },
  ];
  defaultMessages.forEach((m) => fallbackStore.messages.set(m.id, m));

  // Drive Files Iniciais
  const defaultDriveFiles = [
    {
      id: 'file-1',
      user_id: 'user-model-1',
      name: 'Manual_de_Compliance_e_Diretrizes_Lumiardi.pdf',
      category: 'contracts',
      type: 'document',
      size: '1.8 MB',
      uploaded_by: 'Equipe de Curadoria Lumiardi',
      file_url: '/documents/manual_compliance.pdf',
      downloads: 1,
      privacy: 'encrypted',
      created_at: new Date().toISOString(),
    },
    {
      id: 'file-2',
      user_id: 'user-model-1',
      name: 'Modelo_Padrao_NDA_Blindagem_de_Imagem.pdf',
      category: 'contracts',
      type: 'document',
      size: '850 KB',
      uploaded_by: 'Assessoria Jurídica Lumiardi',
      file_url: '/documents/modelo_nda.pdf',
      downloads: 0,
      privacy: 'agency-only',
      created_at: new Date().toISOString(),
    },
  ];
  defaultDriveFiles.forEach((f) => fallbackStore.drive_files.set(f.id, f));

  // Assinaturas Iniciais (Seed)
  const now = new Date();
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const defaultSubscriptions = [
    {
      id: 'sub-model-1',
      user_id: 'user-model-1',
      gateway: 'ccbill',
      gateway_subscription_id: 'ccbill_sub_998124',
      gateway_customer_id: 'ccbill_cust_4412',
      plan_id: 'radiance',
      plan_category: 'criadoras',
      status: 'active',
      billing_interval: 'monthly',
      amount: 69.90,
      currency: 'BRL',
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
      cancel_at_period_end: false,
      metadata: { billingDescriptor: 'LMI*BILLING SERVICES', lastCard4: '4242' },
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
    {
      id: 'sub-agency-1',
      user_id: 'user-agency-1',
      gateway: 'nowpayments',
      gateway_subscription_id: 'nowpay_sub_55102',
      plan_id: 'signature',
      plan_category: 'agencias',
      status: 'active',
      billing_interval: 'monthly',
      amount: 259.00,
      currency: 'USD',
      current_period_start: now.toISOString(),
      current_period_end: nextMonth.toISOString(),
      cancel_at_period_end: false,
      metadata: { payCurrency: 'USDTTRC20', txHash: '0x7a8b9c...f3e1' },
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
  ];
  defaultSubscriptions.forEach((s) => fallbackStore.subscriptions.set(s.user_id, s));

  // Faturas Iniciais (Seed)
  const defaultInvoices = [
    {
      id: 'inv-101',
      user_id: 'user-model-1',
      subscription_id: 'sub-model-1',
      invoice_number: 'LUM-INV-2026-0041',
      amount: 69.90,
      currency: 'BRL',
      status: 'paid',
      billing_reason: 'Assinatura Mensal — Plano Radiance (Criadora VIP)',
      due_date: now.toISOString(),
      paid_at: now.toISOString(),
      receipt_number: 'LMI-REC-99410',
      pdf_url: '/api/billing/invoices/inv-101/download',
      created_at: now.toISOString(),
    },
    {
      id: 'inv-201',
      user_id: 'user-agency-1',
      subscription_id: 'sub-agency-1',
      invoice_number: 'LUM-INV-2026-0082',
      amount: 259.00,
      currency: 'USD',
      status: 'paid',
      billing_reason: 'Assinatura Mensal — Plano Signature (Agência)',
      due_date: now.toISOString(),
      paid_at: now.toISOString(),
      receipt_number: 'LMI-REC-99820',
      pdf_url: '/api/billing/invoices/inv-201/download',
      created_at: now.toISOString(),
    },
  ];
  defaultInvoices.forEach((inv) => fallbackStore.invoices.set(inv.id, inv));

  // Payouts Iniciais (Seed)
  const defaultPayouts = [
    {
      id: 'payout-1',
      creator_id: 'user-model-1',
      agency_id: 'user-agency-1',
      amount: 4500.00,
      currency: 'BRL',
      status: 'paid',
      payout_method: 'pix',
      gateway_reference: 'PIX-E2E-998471928374',
      description: 'Campanha Editorial Internacional Milan SS26',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      paid_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'payout-2',
      creator_id: 'user-model-1',
      agency_id: 'user-agency-1',
      amount: 1800.00,
      currency: 'USD',
      status: 'processing',
      payout_method: 'crypto_usdt',
      gateway_reference: 'NOW-PAYOUT-33910',
      description: 'Licenciamento de Imagem para Campanha Global VIP',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  defaultPayouts.forEach((p) => fallbackStore.payouts.set(p.id, p));
})();

let isInitialized = false;

/**
 * Inicialização DDL automática do banco de dados PostgreSQL com tabelas financeiras
 */
export async function initDatabase(): Promise<boolean> {
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
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
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
          video_url VARCHAR(255),
          monthly_revenue_estimate VARCHAR(100),
          commission_rate VARCHAR(50),
          specialties JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
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
          receiver_id VARCHAR(100),
          conversation_id VARCHAR(100) NOT NULL,
          text TEXT NOT NULL,
          attachment_url TEXT,
          attachment_name VARCHAR(255),
          attachment_type VARCHAR(50),
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // 5. Tabela DRIVE_FILES
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

      // 6. Tabela SUBSCRIPTIONS (CCBill + NOWPayments)
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

      // 7. Tabela PAYMENT_TRANSACTIONS (Auditoria e Idempotência)
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

      // 8. Tabela INVOICES (Faturas e Recibos Fiscais / PDF)
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

      // 9. Tabela PAYOUTS (Divisão de Faturamento & Repasses)
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

      // 10. Índices de Alta Performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_users_curation_status ON users(curation_status);
        CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_kanban_tasks_user_id ON kanban_tasks(user_id);
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_drive_files_user_id ON drive_files(user_id);
        CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
        CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
        CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_payment_transactions_idemp ON payment_transactions(idempotency_key);
        CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
        CREATE INDEX IF NOT EXISTS idx_payouts_creator_id ON payouts(creator_id);
      `);

      const hashPassword = await bcrypt.hash('lumiardi2026', 10);

      await client.query(`
        INSERT INTO users (id, email, password_hash, role, curation_status, full_name, document_name)
        VALUES 
          ('admin-curadoria-1', 'curadoria@lumiardi.com', $1, 'ADMIN', 'APROVADO', 'Mesa de Curadoria Lumiardi', NULL),
          ('user-admin-model', 'admin@lumiardi.com', $1, 'ADMIN', 'APROVADO', 'Administrador Lumiardi', NULL),
          ('user-model-1', 'modelo@lumiardi.com', $1, 'MODELO', 'APROVADO', 'Criadora Lumiardi', NULL),
          ('user-agency-1', 'agencia@lumiardi.com', $1, 'AGENCIA', 'APROVADO', 'Sua Agência Corporativa', NULL),
          ('user-test-candidata', 'candidata.teste@lumiardi.com', $1, 'MODELO', 'EM_CURATORIA', 'Isabella Montenegro (Candidata Teste)', 'passaporte_isabella_2257.pdf')
        ON CONFLICT (email) DO NOTHING;
      `, [hashPassword]);

      await client.query(`
        INSERT INTO profiles (user_id, artistic_name, category, instagram, created_at)
        VALUES 
          ('user-model-1', 'Sua Conta Modelo', 'Modelo & Criadora VIP', '@suaconta', NOW()),
          ('user-test-candidata', 'Isabella M.', 'Alta Moda & Criadora VIP', '@isabella.montenegro', NOW())
        ON CONFLICT (user_id) DO NOTHING;
      `);

      isInitialized = true;
      console.log('✅ PostgreSQL Local (pgAdmin): Tabelas, Finanças e Assinaturas sincronizadas.');
      return true;
    } finally {
      client.release();
    }
  } catch {
    return false;
  }
}
