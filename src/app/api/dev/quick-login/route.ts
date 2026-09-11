import { NextRequest, NextResponse } from 'next/server';
import { encodeSession, SessionUser, SESSION_COOKIE_NAME } from '@/lib/auth';
import { pool, initDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  // Em produção, retorna 404 puro — sem revelar que a rota existe
  if ((process.env.NODE_ENV as string) === 'production') {
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Garante que o banco está inicializado e que o usuário de teste existe na tabela users
  // (FK obrigatória para invoices e subscriptions)
  try {
    await initDatabase();
    await pool.query(`
      INSERT INTO users (id, email, password_hash, role, curation_status, full_name)
      VALUES (
        'user-test-candidata',
        'candidata.teste@lumiardi.com',
        '$2b$10$placeholderhashinvalidnotusedforlogin000000000000000000',
        'MODELO',
        'EM_CURATORIA',
        'Isabella Montenegro (Candidata Teste)'
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    `);
  } catch (err) {
    console.warn('[quick-login] UPSERT do usuário de teste falhou (ignorando):', err);
    // Não bloqueia o login mesmo se o DB estiver offline — o fallbackStore cuida disso
  }

  // Usuário que já existe semeado no seu db.ts e fallbackStore
  const testUser: SessionUser = {
    id: 'user-test-candidata',
    email: 'candidata.teste@lumiardi.com',
    name: 'Isabella Montenegro (Candidata Teste)',
    role: 'criadora',
    curationStatus: 'EM_CURATORIA',
    createdAt: new Date().toISOString()
  };

  // Gera o cookie JWT assinado
  const token = encodeSession(testUser);

  // Redireciona de volta para a página de checkout
  const response = NextResponse.redirect(new URL('/checkout', request.url));
  
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: (process.env.NODE_ENV as string) === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 1 dia
  });

  return response;
}