-- ══════════════════════════════════════════════════════════════════
-- LUMIARDI — SCRIPT SQL COMPLETO & PRODUÇÃO (POSTGRESQL 17)
-- Multi-Gateway (CCBill & NOWPayments), Assinaturas, Faturas e Payouts
-- ══════════════════════════════════════════════════════════════════

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'MODELO', 'AGENCIA' ou 'ADMIN'
  curation_status VARCHAR(20) NOT NULL DEFAULT 'EM_CURATORIA', -- 'EM_CURATORIA', 'APROVADO', 'REJEITADO'
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  document_type VARCHAR(100),
  document_name VARCHAR(255),
  document_url VARCHAR(255),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE PERFIS (BOOK, MEDIDAS, REDES SOCIAIS, DADOS CORPORATIVOS)
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

-- 3. TABELA DE TAREFAS DO KANBAN
CREATE TABLE IF NOT EXISTS kanban_tasks (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  agency_name VARCHAR(255),
  column_status VARCHAR(20) NOT NULL DEFAULT 'todo', -- 'todo', 'inProgress', 'done'
  priority VARCHAR(20) DEFAULT 'Normal',
  due_date VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE MENSAGENS E CHAT
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

-- 5. TABELA DE ARQUIVOS DO LUMIARDI DRIVE
CREATE TABLE IF NOT EXISTS drive_files (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'raw-photos', -- 'raw-photos', 'videos', 'contracts', 'briefings'
  type VARCHAR(50) NOT NULL DEFAULT 'image', -- 'image', 'video', 'document'
  size VARCHAR(50) NOT NULL DEFAULT '0 MB',
  uploaded_by VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  downloads INTEGER DEFAULT 0,
  privacy VARCHAR(50) DEFAULT 'agency-only',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE ASSINATURAS (SUBSCRIPTIONS)
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gateway VARCHAR(30) NOT NULL, -- 'ccbill' | 'nowpayments'
  gateway_subscription_id VARCHAR(150),
  gateway_customer_id VARCHAR(150),
  plan_id VARCHAR(50) NOT NULL,
  plan_category VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'trial', 'expired'
  billing_interval VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE TRANSAÇÕES FINANCEIRAS (PAYMENT_TRANSACTIONS)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
  subscription_id VARCHAR(100),
  gateway VARCHAR(30) NOT NULL,
  gateway_transaction_id VARCHAR(150) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  status VARCHAR(30) NOT NULL, -- 'pending', 'success', 'failed', 'refunded', 'chargeback'
  payment_method VARCHAR(50) NOT NULL, -- 'credit_card', 'crypto'
  crypto_address VARCHAR(150),
  crypto_amount NUMERIC(18,8),
  crypto_currency VARCHAR(30),
  raw_payload JSONB,
  idempotency_key VARCHAR(150) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABELA DE FATURAS E RECIBOS (INVOICES)
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id VARCHAR(100),
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
  status VARCHAR(30) NOT NULL DEFAULT 'paid', -- 'paid', 'open', 'void', 'uncollectible'
  billing_reason TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  receipt_number VARCHAR(100),
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABELA DE PAYOUTS E COMISSÕES (PAYOUTS)
CREATE TABLE IF NOT EXISTS payouts (
  id VARCHAR(100) PRIMARY KEY,
  creator_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  recipient_id VARCHAR(100) REFERENCES users(id) ON DELETE CASCADE,
  recipient_type VARCHAR(20) DEFAULT 'MODELO',
  agency_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'BRL',
  status VARCHAR(30) NOT NULL DEFAULT 'completed', -- 'pending', 'processing', 'completed', 'failed'
  payout_method VARCHAR(50) DEFAULT 'pix', -- 'pix', 'crypto_usdt', 'wire_swift'
  gateway_payout_id VARCHAR(150),
  gateway_reference VARCHAR(150),
  destination_account VARCHAR(100),
  description TEXT,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- 10. ÍNDICES DE ALTA PERFORMANCE
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
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(recipient_id);

-- 11. SEED DAS CONTAS DE TESTE & CURADORIA (Senha padrão: lumiardi2026)
INSERT INTO users (id, email, password_hash, role, curation_status, full_name)
VALUES 
  ('admin-curadoria-1', 'curadoria@lumiardi.com', '$2a$10$7v2M3Xg5zKq3R2V6xO5dOeo4YpZ0f7jJ7v5X6n8z9m0k1l2m3n4o', 'ADMIN', 'APROVADO', 'Mesa de Curadoria Lumiardi'),
  ('user-admin-model', 'admin@lumiardi.com', '$2a$10$7v2M3Xg5zKq3R2V6xO5dOeo4YpZ0f7jJ7v5X6n8z9m0k1l2m3n4o', 'ADMIN', 'APROVADO', 'Administrador Lumiardi'),
  ('user-model-1', 'modelo@lumiardi.com', '$2a$10$7v2M3Xg5zKq3R2V6xO5dOeo4YpZ0f7jJ7v5X6n8z9m0k1l2m3n4o', 'MODELO', 'APROVADO', 'Sua Conta Modelo'),
  ('user-agency-1', 'agencia@lumiardi.com', '$2a$10$7v2M3Xg5zKq3R2V6xO5dOeo4YpZ0f7jJ7v5X6n8z9m0k1l2m3n4o', 'AGENCIA', 'APROVADO', 'Sua Agência Corporativa')
ON CONFLICT (email) DO NOTHING;

INSERT INTO profiles (user_id, artistic_name, category, instagram, gender, monthly_revenue_estimate, measurements, address, photos, video_url)
VALUES (
  'user-model-1',
  'Sua Conta Modelo',
  'Modelo & Criadora VIP',
  '@suaconta',
  'Feminino',
  'Sob Consulta',
  '{"height": "175", "weight": "55", "waist": "60", "bust": "88", "hips": "90"}'::jsonb,
  '{"country": "Brasil", "state": "SP", "city": "São Paulo"}'::jsonb,
  '[{"id": "1", "url": "/images/creator_elena.jpg", "title": "Editorial Milan", "tag": "Alta Resolução · RAW"}, {"id": "2", "url": "/images/creator_sophia.jpg", "title": "Studio Portrait", "tag": "Book Oficial"}]'::jsonb,
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO profiles (user_id, corporate_name, responsible_name, category, cnpj, instagram, address, commission_rate, specialties)
VALUES (
  'user-agency-1',
  'Sua Agência Corporativa',
  'Diretoria de Casting',
  'Agência de Casting & Modelos',
  '12.345.678/0001-90',
  '@suaagencia',
  '{"country": "Brasil", "state": "SP", "city": "São Paulo"}'::jsonb,
  '20%',
  '["Alta Moda", "Editorial", "Campanhas Internacionais"]'::jsonb
) ON CONFLICT (user_id) DO NOTHING;
