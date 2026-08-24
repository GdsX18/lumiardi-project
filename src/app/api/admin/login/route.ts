import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { sanitizeInput } from '@/lib/security';
import { encodeSession, SESSION_COOKIE_NAME, SessionUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const email = sanitizeInput(rawBody.email);
    const password = typeof rawBody.password === 'string' ? rawBody.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Por favor, informe suas credenciais de administrador.' },
        { status: 400 }
      );
    }

    const authResult = await StorageService.authenticateAdmin(email, password);

    if (!authResult || !authResult.user) {
      return NextResponse.json(
        { error: 'Acesso negado. Credenciais administrativas inválidas ou não autorizadas.' },
        { status: 401 }
      );
    }

    const user = authResult.user;

    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      name: user.name || 'Mesa de Curadoria Lumiardi',
      role: 'admin',
      curationRole: user.curationRole || 'admin',
      curationStatus: 'APROVADO',
      createdAt: user.createdAt || new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      message: 'Autenticação administrativa realizada com sucesso.',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: encodeSession(sessionUser),
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    console.error('Erro no login admin:', err);
    return NextResponse.json(
      { error: 'Falha interna durante a autenticação administrativa.', details: message },
      { status: 500 }
    );
  }
}
