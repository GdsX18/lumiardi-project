import { NextRequest, NextResponse } from 'next/server';
import { StorageService } from '@/services/storageService';
import { AuditLogService } from '@/lib/audit/auditService';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== 'admin') {
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
    const session = await getSessionFromCookie();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito à Curadoria.' }, { status: 401 });
    }

    const role = session.curationRole || 'curador_junior';
    // Apenas Admins podem criar novos membros
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Apenas Administradores podem cadastrar novos membros na equipe.' }, { status: 403 });
    }

    const body = await req.json();
    const { email, fullName, role: userRole, password } = body;

    if (!email || !fullName || !userRole) {
      return NextResponse.json({ error: 'Email, nome completo e cargo são obrigatórios.' }, { status: 400 });
    }

    const newUser = await StorageService.createAdminUser({
      email,
      fullName,
      role: userRole,
      password: password || 'lumiardi2026',
    });

    // Registrar log de auditoria
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
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

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Erro ao criar membro da equipe:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar membro da equipe.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito à Curadoria.' }, { status: 401 });
    }

    const role = session.curationRole || 'curador_junior';
    // Apenas Admins podem alterar cargos e status
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Apenas Administradores podem editar cargos ou status da equipe.' }, { status: 403 });
    }

    const body = await req.json();
    const { id, role: newRole, status: newStatus, fullName } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do membro é obrigatório.' }, { status: 400 });
    }

    const updated = await StorageService.updateAdminUser(id, {
      role: newRole,
      status: newStatus,
      fullName,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 });
    }

    // Registrar log de auditoria
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
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
    const session = await getSessionFromCookie();
    if (!session || session.role !== 'admin') {
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

    // Registrar log de auditoria
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
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
