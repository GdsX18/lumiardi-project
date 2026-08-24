-- ══════════════════════════════════════════════════════════════════
-- LUMIARDI — SCRIPT SQL COMPLETO & PRODUÇÃO (POSTGRESQL 17)
-- Multi-Gateway, RBAC Curadoria, Audit Logs, Drive Compartilhado & Scout
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

-- 2. TABELA DE PERFIS (BOOK, MEDIDAS, REDES SOCIAIS, DADOS CORPORATIVOS & SCOUT)
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
  accepts_offers BOOLEAN DEFAULT TRUE,
  is_represented BOOLEAN DEFAULT FALSE,
  represented_agency_name VARCHAR(255),
  represented_agency_id VARCHAR(100),
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

-- 5. TABELA DE ARQUIVOS DO LUMIARDI DRIVE PRIVADO
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

-- 6. TABELA DE ARQUIVOS DO DRIVE COMPARTILHADO (MODELO ↔ AGÊNCIA)
CREATE TABLE IF NOT EXISTS shared_drive_files (
  id VARCHAR(100) PRIMARY KEY,
  agency_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'raw-photos', -- 'raw-photos', 'videos', 'contracts', 'briefings', 'compostos'
  type VARCHAR(50) NOT NULL DEFAULT 'image', -- 'image', 'video', 'document'
  size VARCHAR(50) NOT NULL DEFAULT '0 MB',
  uploaded_by_id VARCHAR(100) NOT NULL,
  uploaded_by_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE CONTRATOS & VÍNCULOS (AGENCY ↔ MODEL)
CREATE TABLE IF NOT EXISTS agency_model_contracts (
  id VARCHAR(100) PRIMARY KEY,
  agency_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_name VARCHAR(255) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active', 'pending', 'terminated'
  commission_rate VARCHAR(50) DEFAULT '20%',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABELA DE PROPOSTAS DE SCOUTING (SCOUT_PROPOSALS)
CREATE TABLE IF NOT EXISTS scout_proposals (
  id VARCHAR(100) PRIMARY KEY,
  agency_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agency_name VARCHAR(255) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  proposed_commission VARCHAR(50) DEFAULT '20%',
  status VARCHAR(30) NOT NULL DEFAULT 'sent', -- 'sent', 'accepted', 'declined', 'blocked'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABELA DE MEMBROS E CARGOS DA CURADORIA (RBAC: ADMIN_USERS)
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'curador_junior', -- 'curador_junior', 'curador_senior', 'supervisor', 'admin'
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'inactive'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABELA DE HISTÓRICO E LOGS DE AUDITORIA DA CURADORIA (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS curation_audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  action_type VARCHAR(100) NOT NULL, -- 'APROVOU_MODELO', 'RECUSOU_MODELO', 'APROVOU_AGENCIA', 'RECUSOU_AGENCIA', 'ADICIONOU_NOTA', 'CRIOU_CURADOR', 'ALTEROU_CARGO_CURADOR', 'EXPORTOU_DOSSIE', 'ALTEROU_CADASTRO'
  target_id VARCHAR(100),
  target_name VARCHAR(255),
  target_type VARCHAR(50), -- 'MODELO', 'AGENCIA', 'USUARIO_CURADORIA', 'DOCUMENTO'
  details JSONB,
  ip_address VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TABELA DE ASSINATURAS (SUBSCRIPTIONS)
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

-- 12. TABELA DE TRANSAÇÕES FINANCEIRAS (PAYMENT_TRANSACTIONS)
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

-- 13. TABELA DE FATURAS E RECIBOS (INVOICES)
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

-- 14. TABELA DE PAYOUTS E COMISSÕES (PAYOUTS)
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

-- 15. ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_curation_status ON users(curation_status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_user_id ON kanban_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_drive_files_user_id ON drive_files(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_drive_files_rel ON shared_drive_files(agency_id, model_id);
CREATE INDEX IF NOT EXISTS idx_agency_contracts ON agency_model_contracts(agency_id, model_id);
CREATE INDEX IF NOT EXISTS idx_curation_audit_logs_time ON curation_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_curation_audit_logs_action ON curation_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_curation_audit_logs_user ON curation_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_idemp ON payment_transactions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(recipient_id);

-- 16. SEED DAS CONTAS DE TESTE & CURADORIA (Senha padrão: lumiardi2026)
INSERT INTO users (id, email, password_hash, role, curation_status, full_name)
VALUES 
  ('admin-curadoria-1', 'curadoria@lumiardi.com', '$2a$10$7v2M3Xg5zKq3R2V6xO5dOeo4YpZ0f7jJ7v5X6n8z9m0k1l2m3n4o', 'ADMIN', 'APROVADO', 'Mesa de Curadoria Lumiardi'),
  ('user-admin-model', 'admin@lumiardi.com', '$2a$10$7v2M3Xg5zKq3R2V6xO5dOeo4YpZ0f7jJ7v5X6n8z9m0k1l2m3n4o', 'ADMIN', 'APROVADO', 'Administrador Lumiardi'),
  ('user-model-1', 'modelo@lumiardi.com', '$2a$10$7v2M3Xg5zKq3R2V6xO5dOeo4YpZ0f7jJ7v5X6n8z9m0k1l2m3n4o', 'MODELO', 'APROVADO', 'Sua Conta Modelo'),
  ('user-agency-1', 'agencia@lumiardi.com', '$2a$10$7v2M3Xg5zKq3R2V6xO5dOeo4YpZ0f7jJ7v5X6n8z9m0k1l2m3n4o', 'AGENCIA', 'APROVADO', 'Sua Agência Corporativa')
ON CONFLICT (email) DO NOTHING;

-- Equipe de Curadoria (RBAC)
INSERT INTO admin_users (id, email, password_hash, full_name, role, status)
VALUES
  ('cur-admin-1', 'curadoria@lumiardi.com', '$2a$10$7v2M3Xg5zKq3R2V6xO5dOeo4YpZ0f7jJ7v5X6n8z9m0k1l2m3n4o', 'Mesa de Curadoria (Diretoria)', 'admin', 'active'),
  ('cur-admin-2', 'admin@lumiardi.com', '$2a$10$7v2M3Xg5zKq3R2V6xO5dOeo4YpZ0f7jJ7v5X6n8z9m0k1l2m3n4o', 'Administrador Executivo', 'admin', 'active'),
  ('cur-snr-1', 'curador.senior@lumiardi.com', '$2a$10$7v2M3Xg5zKq3R2V6xO5dOeo4YpZ0f7jJ7v5X6n8z9m0k1l2m3n4o', 'Rodrigo Medeiros (Curador Sênior)', 'curador_senior', 'active'),
  ('cur-jnr-1', 'curador.junior@lumiardi.com', '$2a$10$7v2M3Xg5zKq3R2V6xO5dOeo4YpZ0f7jJ7v5X6n8z9m0k1l2m3n4o', 'Camila Duarte (Curadora Júnior)', 'curador_junior', 'active')
ON CONFLICT (email) DO NOTHING;

-- Perfis Iniciais
INSERT INTO profiles (user_id, artistic_name, category, instagram, gender, monthly_revenue_estimate, measurements, address, photos, video_url, accepts_offers, is_represented, represented_agency_name, represented_agency_id)
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
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  true,
  true,
  'Sua Agência Corporativa',
  'user-agency-1'
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

-- Contrato Inicial Modelo ↔ Agência
INSERT INTO agency_model_contracts (id, agency_id, model_id, agency_name, model_name, status, commission_rate)
VALUES (
  'contract-model-agency-1',
  'user-agency-1',
  'user-model-1',
  'Sua Agência Corporativa',
  'Sua Conta Modelo',
  'active',
  '20%'
) ON CONFLICT (id) DO NOTHING;

-- Arquivos Iniciais do Drive Compartilhado
INSERT INTO shared_drive_files (id, agency_id, model_id, name, category, type, size, uploaded_by_id, uploaded_by_name, file_url, downloads)
VALUES
  ('sfile-1', 'user-agency-1', 'user-model-1', 'Contrato_Agenciamento_Exclusivo_2026.pdf', 'contracts', 'document', '2.4 MB', 'user-agency-1', 'Sua Agência Corporativa', '/documents/contrato_agenciamento.pdf', 2),
  ('sfile-2', 'user-agency-1', 'user-model-1', 'Composto_Digital_Alta_Moda_SS26.pdf', 'compostos', 'document', '4.1 MB', 'user-agency-1', 'Sua Agência Corporativa', '/documents/composto_digital.pdf', 5),
  ('sfile-3', 'user-agency-1', 'user-model-1', 'Ensaio_Milan_Look01_RAW_Master.jpg', 'raw-photos', 'image', '12.8 MB', 'user-model-1', 'Sua Conta Modelo', '/images/creator_elena.jpg', 1)
ON CONFLICT (id) DO NOTHING;

-- Logs Iniciais de Auditoria da Curadoria
INSERT INTO curation_audit_logs (id, user_id, user_name, user_email, user_role, action_type, target_id, target_name, target_type, details)
VALUES
  ('log-seed-1', 'cur-admin-1', 'Mesa de Curadoria (Diretoria)', 'curadoria@lumiardi.com', 'admin', 'APROVOU_MODELO', 'user-model-1', 'Sua Conta Modelo', 'MODELO', '{"reason": "Documentação e biometria validadas com sucesso"}'::jsonb),
  ('log-seed-2', 'cur-admin-1', 'Mesa de Curadoria (Diretoria)', 'curadoria@lumiardi.com', 'admin', 'APROVOU_AGENCIA', 'user-agency-1', 'Sua Agência Corporativa', 'AGENCIA', '{"reason": "CNPJ e contrato social verificados"}'::jsonb),
ON CONFLICT (id) DO NOTHING;

