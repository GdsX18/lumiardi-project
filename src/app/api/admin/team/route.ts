import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { AuditLogService } from '@/lib/audit/auditService';
import { getSessionFromCookie } from '@/lib/auth';
import { getVerifiedAdminSession, invalidateAdminCache } from '@/lib/apiAuth';
import crypto from 'crypto';
import { getClientIp } from '@/lib/security/rateLimiter';
import type { CurationRole } from '@/types';

const VALID_ROLES: CurationRole[] = ['curador_junior', 'curador_senior', 'supervisor', 'admin'];

/** Senha temporária forte (letras + números), exibida uma única vez para o administrador. */
function generateTemporaryPassword(): string {
  return `Lm${crypto.randomBytes(9).toString('base64url')}${crypto.randomInt(10, 99)}`;
}

export async function GET() {
  try {
    const session = await getVerifiedAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito à Curadoria Lumiardi.' }, { status: 401 });
    }

    const role = session.curationRole || 'curador_junior';
    // Curadores juniores não têm acesso à listagem de equipe
    if (role === 'curador_junior') {
      return NextResponse.json({ error: 'Permissão insuficiente para visualizar membros da equipe.' }, { status: 403 });
    }

    const team = await StorageService.listAdminUsers();
    return NextResponse.json({ team });
  } catch (error) {
    console.error('Erro ao listar equipe de curadoria:', error);
    return NextResponse.json({ error: 'Erro ao buscar equipe' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito à Curadoria.' }, { status: 401 });
    }

    const role = session.curationRole || 'curador_junior';
    // Apenas Admins podem criar novos membros
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Apenas Administradores podem cadastrar novos membros na equipe.' }, { status: 403 });
    }

    const body = await req.json();
    const { email, password } = body;
    // Aceita os nomes de campo do painel (name/curationRole) e os canônicos (fullName/role)
    const fullName = body.fullName ?? body.name;
    const userRole = body.role ?? body.curationRole;

    if (!email || !fullName || !userRole || typeof email !== 'string' || typeof fullName !== 'string') {
      return NextResponse.json({ error: 'Email, nome completo e cargo são obrigatórios.' }, { status: 400 });
    }
    if (!VALID_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Cargo inválido.' }, { status: 400 });
    }

    const temporaryPassword = password ? undefined : generateTemporaryPassword();
    let newUser;
    try {
      newUser = await StorageService.createAdminUser({
        email,
        fullName,
        role: userRole,
        password: password || temporaryPassword,
      });
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      if (code === 'WEAK_PASSWORD') {
        return NextResponse.json({ error: 'A senha precisa ter pelo menos 8 caracteres, com letras e números.', code: 'weak_password' }, { status: 400 });
      }
      if (code === 'EMAIL_IN_USE') {
        return NextResponse.json({ error: 'Já existe um membro com este e-mail.', code: 'email_in_use' }, { status: 409 });
      }
      throw err;
    }

    // Registrar log de auditoria
    const ip = getClientIp(req.headers);
    await AuditLogService.logAction({
      userId: session.id,
      userName: session.name,
      userEmail: session.email,
      userRole: session.curationRole || 'admin',
      actionType: 'CADASTROU_CURADOR',
      targetId: newUser.id,
      targetName: newUser.fullName,
      targetType: 'USUARIO_CURADORIA',
      details: { email: newUser.email, assignedRole: newUser.role },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, user: newUser, temporaryPassword });
  } catch (error) {
    console.error('Erro ao criar membro da equipe:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar membro da equipe.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getVerifiedAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito à Curadoria.' }, { status: 401 });
    }

    const role = session.curationRole || 'curador_junior';
    // Apenas Admins podem alterar cargos e status
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Apenas Administradores podem editar cargos ou status da equipe.' }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;
    const newStatus = body.status ?? (typeof body.isActive === 'boolean' ? (body.isActive ? 'active' : 'inactive') : undefined);
    const newRole = body.role ?? body.curationRole;
    const fullName = body.fullName ?? body.name;

    if (!id) {
      return NextResponse.json({ error: 'ID do membro é obrigatório.' }, { status: 400 });
    }
    if (newRole !== undefined && !VALID_ROLES.includes(newRole)) {
      return NextResponse.json({ error: 'Cargo inválido.' }, { status: 400 });
    }
    if (newStatus !== undefined && newStatus !== 'active' && newStatus !== 'inactive') {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 });
    }

    const updated = await StorageService.updateAdminUser(id, {
      role: newRole,
      status: newStatus,
      fullName,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 });
    }
    invalidateAdminCache(id);

    // Registrar log de auditoria
    const ip = getClientIp(req.headers);
    await AuditLogService.logAction({
      userId: session.id,
      userName: session.name,
      userEmail: session.email,
      userRole: session.curationRole || 'admin',
      actionType: 'ALTEROU_CARGO',
      targetId: updated.id,
      targetName: updated.fullName,
      targetType: 'USUARIO_CURADORIA',
      details: { newRole, newStatus },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('Erro ao atualizar membro:', error);
    return NextResponse.json({ error: 'Erro ao atualizar membro da equipe.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getVerifiedAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Acesso restrito à Curadoria.' }, { status: 401 });
    }

    const role = session.curationRole || 'curador_junior';
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Apenas Administradores podem remover membros da equipe.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID do membro é obrigatório.' }, { status: 400 });
    }

    // Impede deletar a si mesmo
    if (id === session.id) {
      return NextResponse.json({ error: 'Você não pode excluir sua própria conta de administrador.' }, { status: 400 });
    }

    await StorageService.deleteAdminUser(id);
    invalidateAdminCache(id);

    // Registrar log de auditoria
    const ip = getClientIp(req.headers);
    await AuditLogService.logAction({
      userId: session.id,
      userName: session.name,
      userEmail: session.email,
      userRole: session.curationRole || 'admin',
      actionType: 'REMOVEU_CURADOR',
      targetId: id,
      targetName: 'Membro Removido',
      targetType: 'USUARIO_CURADORIA',
      details: { deletedUserId: id },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, message: 'Membro removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar membro:', error);
    return NextResponse.json({ error: 'Erro ao deletar membro.' }, { status: 500 });
  }
}
