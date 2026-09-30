import { NextResponse } from 'next/server';

/**
 * Rota legada de "aprovação instantânea" (simulador de desenvolvimento).
 * Decisões de curadoria passam exclusivamente por POST /api/admin/applications/[id]/status,
 * que valida permissões, transições de status e registra a auditoria.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Rota descontinuada. Use a Mesa de Curadoria (/api/admin/applications/[id]/status).',
      code: 'not_found',
    },
    { status: 410 }
  );
}
