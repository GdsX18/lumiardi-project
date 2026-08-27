import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';

export const pool = new Pool({
  connectionString,
  max: 20, // Otimizado para concorrência
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000, // Timeout rápido resiliente
});

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

  // Equipe de Curadoria (RBAC) em Memória
  const defaultAdminUsers = [
    {
      id: 'cur-admin-1',
      email: 'curadoria@lumiardi.com',
      password_hash: hashPassword,
      full_name: 'Mesa de Curadoria (Diretoria)',
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cur-admin-2',
      email: 'admin@lumiardi.com',
      password_hash: hashPassword,
      full_name: 'Administrador Executivo',
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cur-sup-1',
      email: 'supervisor@lumiardi.com',
      password_hash: hashPassword,
      full_name: 'Clara Bittencourt (Supervisora)',
      role: 'supervisor',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cur-snr-1',
      email: 'curador.senior@lumiardi.com',
      password_hash: hashPassword,
      full_name: 'Rodrigo Medeiros (Curador Sênior)',
      role: 'curador_senior',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 'cur-jnr-1',
      email: 'curador.junior@lumiardi.com',
      password_hash: hashPassword,
      full_name: 'Camila Duarte (Curadora Júnior)',
      role: 'curador_junior',
      status: 'active',
      created_at: new Date().toISOString(),
    },
  ];

  defaultAdminUsers.forEach((au) => {
    fallbackStore.admin_users.set(au.id, au);
    // Também mapeia como usuário para login
    if (!fallbackStore.users.has(au.email.toLowerCase())) {
      fallbackStore.users.set(au.email.toLowerCase(), {
        id: au.id,
        email: au.email,
        password_hash: au.password_hash,
        role: 'ADMIN',
        curation_status: 'APROVADO',
        full_name: au.full_name,
        created_at: au.created_at,
      });
    }
  });

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
    photos: [
      { id: '1', url: '/api/media/assets/images/creator_elena.jpg', title: 'Editorial Milan', tag: 'Alta Resolução · RAW' },
      { id: '2', url: '/api/media/assets/images/creator_sophia.jpg', title: 'Studio Portrait', tag: 'Book Oficial' },
    ],
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    bio: 'Modelo editorial com experiência em alta costura e campanhas internacionais.',
    accepts_offers: true,
    is_represented: true,
    represented_agency_name: 'Sua Agência Corporativa',
    represented_agency_id: 'user-agency-1',
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
    accepts_offers: true,
    is_represented: false,
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

  // Contrato Inicial Modelo ↔ Agência
  fallbackStore.agency_model_contracts.set('contract-model-agency-1', {
    id: 'contract-model-agency-1',
    agency_id: 'user-agency-1',
    model_id: 'user-model-1',
    agency_name: 'Sua Agência Corporativa',
    model_name: 'Sua Conta Modelo',
    status: 'active',
    commission_rate: '20%',
    start_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  // Arquivos do Drive Compartilhado Iniciais
  const defaultSharedFiles = [
    {
      id: 'sfile-1',
      agency_id: 'user-agency-1',
      model_id: 'user-model-1',
      name: 'Contrato_Agenciamento_Exclusivo_2026.pdf',
      category: 'contracts',
      type: 'document',
      size: '2.4 MB',
      uploaded_by_id: 'user-agency-1',
      uploaded_by_name: 'Sua Agência Corporativa',
      file_url: '/documents/manual_compliance.pdf',
      downloads: 2,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sfile-2',
      agency_id: 'user-agency-1',
      model_id: 'user-model-1',
      name: 'Composto_Digital_Alta_Moda_SS26.pdf',
      category: 'compostos',
      type: 'document',
      size: '4.1 MB',
      uploaded_by_id: 'user-agency-1',
      uploaded_by_name: 'Sua Agência Corporativa',
      file_url: '/documents/modelo_nda.pdf',
      downloads: 5,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'sfile-3',
      agency_id: 'user-agency-1',
      model_id: 'user-model-1',
      name: 'Ensaio_Milan_Look01_RAW_Master.jpg',
      category: 'raw-photos',
      type: 'image',
      size: '12.8 MB',
      uploaded_by_id: 'user-model-1',
      uploaded_by_name: 'Sua Conta Modelo',
      file_url: '/api/media/assets/images/creator_elena.jpg',
      downloads: 1,
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  defaultSharedFiles.forEach((sf) => fallbackStore.shared_drive_files.set(sf.id, sf));

  // Logs Iniciais de Auditoria da Curadoria
  const defaultAuditLogs = [
    {
      id: 'log-seed-1',
      user_id: 'cur-admin-1',
      user_name: 'Mesa de Curadoria (Diretoria)',
      user_email: 'curadoria@lumiardi.com',
      user_role: 'admin',
      action_type: 'APROVOU_MODELO',
      target_id: 'user-model-1',
      target_name: 'Sua Conta Modelo',
      target_type: 'MODELO',
      details: { reason: 'Documentação internacional e biometria validadas com sucesso' },
      ip_address: '127.0.0.1',
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-seed-2',
      user_id: 'cur-admin-1',
      user_name: 'Mesa de Curadoria (Diretoria)',
      user_email: 'curadoria@lumiardi.com',
      user_role: 'admin',
      action_type: 'APROVOU_AGENCIA',
      target_id: 'user-agency-1',
      target_name: 'Sua Agência Corporativa',
      target_type: 'AGENCIA',
      details: { reason: 'CNPJ ativo e contrato social corporativo aprovado' },
      ip_address: '127.0.0.1',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'log-seed-3',
      user_id: 'cur-sup-1',
      user_name: 'Clara Bittencourt (Supervisora)',
      user_email: 'supervisor@lumiardi.com',
      user_role: 'supervisor',
      action_type: 'ADICIONOU_NOTA',
      target_id: 'user-test-candidata',
      target_name: 'Isabella Montenegro',
      target_type: 'MODELO',
      details: { note: 'Aguardando envio do comprovante de residência atualizado para aprovação final' },
      ip_address: '127.0.0.1',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
  defaultAuditLogs.forEach((log) => fallbackStore.curation_audit_logs.set(log.id, log));

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

  // Notificações Iniciais
  const defaultNotifications = [
    {
      id: 'notif-seed-1',
      user_id: 'user-model-1',
      title: 'Credencial Aprovada',
      description: 'Sua conta foi homologada com sucesso sob o protocolo 18 U.S.C. § 2257. Todos os recursos estão liberados.',
      category: 'Curadoria',
      type: 'success',
      link: '/dashboard/book',
      link_text: 'Ver Meu Book',
      is_read: false,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-seed-2',
      user_id: 'user-model-1',
      title: 'Portfólio & Book Digital',
      description: 'Mantenha suas fotos em alta resolução atualizadas para atrair agências internacionais parceiras.',
      category: 'Talentos',
      type: 'info',
      link: '/dashboard/book',
      link_text: 'Gerenciar Book',
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-seed-3',
      user_id: 'user-model-1',
      title: 'Criptografia Militar E2E',
      description: 'Todas as mensagens no Chat e arquivos no Drive Lumiardi são protegidos por AES-256 e SHA-512.',
      category: 'Segurança',
      type: 'info',
      link: '/dashboard/drive',
      link_text: 'Acessar Drive',
      is_read: false,
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-seed-4',
      user_id: 'user-agency-1',
      title: 'Credencial Aprovada',
      description: 'Sua agência foi homologada pela Mesa de Curadoria Lumiardi com sucesso.',
      category: 'Curadoria',
      type: 'success',
      link: '/dashboard/agencias',
      link_text: 'Ver Agência',
      is_read: false,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-seed-5',
      user_id: 'user-agency-1',
      title: 'Catálogo de Talentos Atualizado',
      description: 'Novas criadoras de elite foram aprovadas e estão disponíveis para contratação.',
      category: 'Scout',
      type: 'info',
      link: '/dashboard/agencias',
      link_text: 'Explorar Roster',
      is_read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];
  defaultNotifications.forEach((n) => fallbackStore.notifications.set(n.id, n));
})();

let isInitialized = false;

/**
 * Inicialização DDL automática do banco de dados PostgreSQL com tabelas financeiras, RBAC, Audit e Drive Compartilhado
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

        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(100);
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'BRL';
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_reason TEXT DEFAULT 'Assinatura';
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);
        ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;
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

      // 16. Índices de Alta Performance
      await client.query(`
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
        CREATE INDEX IF NOT EXISTS idx_payouts_creator_id ON payouts(creator_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
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
        INSERT INTO admin_users (id, email, password_hash, full_name, role, status)
        VALUES
          ('cur-admin-1', 'curadoria@lumiardi.com', $1, 'Mesa de Curadoria (Diretoria)', 'admin', 'active'),
          ('cur-admin-2', 'admin@lumiardi.com', $1, 'Administrador Executivo', 'admin', 'active'),
          ('cur-sup-1', 'supervisor@lumiardi.com', $1, 'Clara Bittencourt (Supervisora)', 'supervisor', 'active'),
          ('cur-snr-1', 'curador.senior@lumiardi.com', $1, 'Rodrigo Medeiros (Curador Sênior)', 'curador_senior', 'active'),
          ('cur-jnr-1', 'curador.junior@lumiardi.com', $1, 'Camila Duarte (Curadora Júnior)', 'curador_junior', 'active')
        ON CONFLICT (email) DO NOTHING;
      `, [hashPassword]);

      await client.query(`
        INSERT INTO profiles (user_id, artistic_name, category, instagram, accepts_offers, is_represented, represented_agency_name, represented_agency_id, created_at)
        VALUES 
          ('user-model-1', 'Sua Conta Modelo', 'Modelo & Criadora VIP', '@suaconta', true, true, 'Sua Agência Corporativa', 'user-agency-1', NOW()),
          ('user-test-candidata', 'Isabella M.', 'Alta Moda & Criadora VIP', '@isabella.montenegro', true, false, NULL, NULL, NOW())
        ON CONFLICT (user_id) DO NOTHING;
      `);

      isInitialized = true;
      console.log('[OK] PostgreSQL Local: Tabelas, Finanças, RBAC e Drive Compartilhado sincronizados.');
      return true;
    } finally {
      client.release();
    }
  } catch {
    return false;
  }
}
