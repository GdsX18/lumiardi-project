import { NextRequest, NextResponse } from 'next/server';
import { AuditLogService } from '@/lib/audit/auditService';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito à Mesa de Curadoria.' }, { status: 401 });
    }

    const curationRole = session.curationRole || 'curador_junior';

    // Apenas Supervisores e Admins podem visualizar a trilha de auditoria
    if (curationRole !== 'supervisor' && curationRole !== 'admin') {
      return NextResponse.json(
        {
          error: 'Acesso negado. Apenas Supervisores e Administradores têm permissão para acessar o Histórico de Auditoria.',
          code: 'INSUFFICIENT_PERMISSIONS',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const actionType = searchParams.get('actionType') || undefined;
    const curadorId = searchParams.get('curadorId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const searchTerm = searchParams.get('searchTerm') || undefined;

    const data = await AuditLogService.listLogs({
      page,
      limit,
      actionType,
      curadorId,
      startDate,
      endDate,
      searchTerm,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao consultar logs de auditoria:', error);
    return NextResponse.json({ error: 'Erro interno ao consultar auditoria.' }, { status: 500 });
  }
}
